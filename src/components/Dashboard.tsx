import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, MessageSquare, Code, Send, Plus, Trash2, Bot, ExternalLink, ChevronRight, Globe, CreditCard, ShieldCheck, Users, LogOut, Lock, Mail, X, FileText, Sparkles, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

interface KnowledgeItem {
  _id: string;
  content: string;
  source: 'text' | 'url';
  url?: string;
  summary?: string;
  createdAt: string;
}

interface BotItem {
  _id: string;
  name: string;
  description: string;
  color: string;
  welcomeMessage: string;
  showPopup: boolean;
  popupMessage: string;
  enableBooking?: boolean;
  bookingParameters?: string[];
  logo?: string;
  knowledgeIds: string[] | KnowledgeItem[];
  userId?: { email: string };
  createdAt?: string;
}

interface UserProfile {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalBots: number;
  totalKnowledge: number;
  proUsers: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'bots' | 'integration' | 'billing' | 'admin-stats' | 'admin-users' | 'admin-bots'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [newKnowledge, setNewKnowledge] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [bots, setBots] = useState<BotItem[]>([]);
  const [newBotName, setNewBotName] = useState('');
  const [newBotDesc, setNewBotDesc] = useState('');
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const [selectedBot, setSelectedBot] = useState<BotItem | null>(null);
  const [botViewMode, setBotViewMode] = useState<'settings' | 'analytics' | 'test'>('settings');
  const [testMessage, setTestMessage] = useState('');
  const [testChat, setTestChat] = useState<{role: string, content: string}[]>([]);
  const [isTestTyping, setIsTestTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [realAnalytics, setRealAnalytics] = useState<{totalSessions: number, avgResponseTime: string, satisfaction: string} | null>(null);
  const [selectedIntegrationBot, setSelectedIntegrationBot] = useState<string>('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Auth state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Admin state
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminBots, setAdminBots] = useState<BotItem[]>([]);
  const [viewingKnowledge, setViewingKnowledge] = useState<KnowledgeItem | null>(null);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchKnowledge();
      fetchBots();
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'admin-stats') fetchAdminStats();
      if (activeTab === 'admin-users') fetchAdminUsers();
      if (activeTab === 'admin-bots') fetchAdminBots();
    }
  }, [activeTab, user]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setKnowledge(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/bots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBots(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAdminStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAdminUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminBots = async () => {
    try {
      const res = await fetch('/api/admin/bots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAdminBots(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = authMode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setKnowledge([]);
    setBots([]);
    navigate('/');
  };

  const addKnowledge = async () => {
    if (!newKnowledge.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newKnowledge })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add knowledge');
      }
      const newItem = await res.json();
      setNewKnowledge('');
      
      // Generate summary using Backend
      try {
        const sumRes = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content: newItem.content, type: 'text' })
        });
        const sumData = await sumRes.json();
        const summary = sumData.summary;
        
        if (summary) {
          await fetch(`/api/knowledge/${newItem._id}`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ summary })
          });
        }
      } catch (sumErr) {
        console.error("Summarization failed:", sumErr);
      }

      fetchKnowledge();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: scrapeUrl })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to scrape website');
      }
      const newItem = await res.json();
      setScrapeUrl('');
      
      // Generate summary using Backend
      try {
        const sumRes = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content: newItem.content, type: 'url' })
        });
        const sumData = await sumRes.json();
        const summary = sumData.summary;
        
        if (summary) {
          await fetch(`/api/knowledge/${newItem._id}`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ summary })
          });
        }
      } catch (sumErr) {
        console.error("Summarization failed:", sumErr);
      }

      fetchKnowledge();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBotName, description: newBotDesc })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create bot');
      }
      setNewBotName('');
      setNewBotDesc('');
      setIsCreatingBot(false);
      fetchBots();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBot = async (id: string) => {
    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchBots();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteKnowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchKnowledge();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async (botId: string) => {
    try {
      const res = await fetch(`/api/bots/${botId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRealAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateBot = async (id: string, updates: Partial<BotItem>) => {
    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchBots();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim() || !selectedBot || isTestTyping) return;

    const userMsg = { role: 'user', content: testMessage };
    setTestChat(prev => [...prev, userMsg]);
    setTestMessage('');
    setIsTestTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testMessage, botId: selectedBot._id })
      });
      const data = await res.json();
      const assistantMsg = { role: 'assistant', content: data.choices?.[0]?.message?.content || 'Error' };
      setTestChat(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestTyping(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBot) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setSelectedBot({ ...selectedBot, logo: data.url });
        updateBot(selectedBot._id, { logo: data.url });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpgrade = () => {
    if (!user) return;
    
    // In a production app, the plan ID should be fetched from your admin settings
    // For this demo, we'll try to find an existing plan or prompt for one
    const publicKey = (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY;
    
    if (!publicKey) {
      alert("Flutterwave Public Key is missing! Please add VITE_FLUTTERWAVE_PUBLIC_KEY to your environment variables.");
      return;
    }

    // Try to get plan ID from localStorage or context if we created one
    const savedPlanId = localStorage.getItem('pro_plan_id') || '77532'; // Example placeholder

    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: `sub_${Date.now()}_${user._id}`,
      amount: 5, // $5 for Pro
      currency: "USD",
      payment_options: "card, account, ussd",
      customer: {
        email: user.email,
        name: user.email.split('@')[0],
      },
      customizations: {
        title: "WidgetWhiz Pro",
        description: "Monthly subscription to Pro features",
        logo: "https://ais-pre-cgf3pi7fubnnspjqbxicws-517274545143.europe-west2.run.app/logo.png",
      },
      payment_plan: savedPlanId,
      callback: async (data: any) => {
        if (data.status === "successful") {
          try {
            const res = await fetch('/api/flutterwave/verify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ transaction_id: data.transaction_id })
            });
            const result = await res.json();
            if (result.success) {
              alert("Subscription successful! Welcome to Pro.");
              fetchUser(); // Refresh user data
            } else {
              alert("Verification failed: " + result.error);
            }
          } catch (err) {
            alert("An error occurred during verification.");
          }
        }
      },
      onclose: () => {
        console.log("Payment modal closed");
      }
    });
  };

  const createProPlan = async () => {
    try {
      const res = await fetch('/api/flutterwave/create-plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 5,
          name: "WidgetWhiz Pro",
          interval: "monthly",
          currency: "USD"
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const planId = data.data.id;
        localStorage.setItem('pro_plan_id', planId);
        alert(`Plan created successfully! ID: ${planId}. This ID is now saved for the Upgrade button.`);
      } else {
        alert("Failed to create plan: " + data.error);
      }
    } catch (err) {
      alert("Error creating plan.");
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your pro subscription? You will lose access to pro features at the end of your billing cycle.")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/flutterwave/cancel', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Subscription cancelled successfully.");
        fetchUser();
      } else {
        alert("Failed to cancel: " + data.error);
      }
    } catch (err) {
      alert("Error cancelling subscription.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
              <Bot className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">WidgetWhiz</h1>
            <p className="text-text-muted mt-2">The smarter way to build AI widgets</p>
          </div>

          <div className="card">
            <div className="card-body p-8">
              <h2 className="text-xl font-bold text-text-main mb-6">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-text-muted" size={18} />
                    <input 
                      type="email" 
                      required
                      className="input-field pl-10 w-full" 
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-text-muted" size={18} />
                    <input 
                      type="password" 
                      required
                      className="input-field pl-10 w-full" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-primary w-full py-3"
                >
                  {isLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  {authMode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-border-main p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-primary">WidgetWhiz</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-text-muted hover:text-text-main"
        >
          {isMobileMenuOpen ? <X size={24} /> : <div className="space-y-1.5"><div className="w-6 h-0.5 bg-current"/><div className="w-6 h-0.5 bg-current"/><div className="w-6 h-0.5 bg-current"/></div>}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 lg:relative lg:z-auto lg:translate-x-0 transition-transform duration-300
        w-64 bg-sidebar border-r border-border-main flex flex-col py-6 shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden lg:flex px-6 mb-8 items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-primary">WidgetWhiz</h1>
        </div>

        <nav className="flex flex-col flex-1">
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={activeTab === 'overview'} 
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={<Database size={18} />} 
            label="Knowledge" 
            active={activeTab === 'knowledge'} 
            onClick={() => { setActiveTab('knowledge'); setIsMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={<MessageSquare size={18} />} 
            label="My Bots" 
            active={activeTab === 'bots'} 
            onClick={() => { setActiveTab('bots'); setIsMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={<Code size={18} />} 
            label="Integration" 
            active={activeTab === 'integration'} 
            onClick={() => { setActiveTab('integration'); setIsMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={<CreditCard size={18} />} 
            label="Billing" 
            active={activeTab === 'billing'} 
            onClick={() => { setActiveTab('billing'); setIsMobileMenuOpen(false); }} 
          />

          {user?.role === 'admin' && (
            <>
              <div className="px-6 mt-8 mb-2">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Admin Panel</p>
              </div>
              <SidebarItem 
                icon={<ShieldCheck size={18} />} 
                label="App Stats" 
                active={activeTab === 'admin-stats'} 
                onClick={() => { setActiveTab('admin-stats'); setIsMobileMenuOpen(false); }} 
              />
              <SidebarItem 
                icon={<Users size={18} />} 
                label="User Management" 
                active={activeTab === 'admin-users'} 
                onClick={() => { setActiveTab('admin-users'); setIsMobileMenuOpen(false); }} 
              />
              <SidebarItem 
                icon={<Bot size={18} />} 
                label="Global Bots" 
                active={activeTab === 'admin-bots'} 
                onClick={() => { setActiveTab('admin-bots'); setIsMobileMenuOpen(false); }} 
              />
            </>
          )}
        </nav>

        <div className="mt-auto px-6 space-y-4">
          <div className={`p-4 rounded-lg border ${user?.plan === 'pro' ? 'bg-primary/5 border-primary/20' : 'bg-bg-main border-border-main'}`}>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Current Plan</p>
            <p className={`text-sm font-semibold capitalize ${user?.plan === 'pro' ? 'text-primary' : 'text-text-main'}`}>
              {user?.plan} Plan
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 w-full rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden lg:flex h-16 bg-white border-b border-border-main justify-between items-center px-8 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-main capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-sm font-bold text-text-main">{user?.email}</p>
              <p className="text-[10px] text-text-muted uppercase font-bold">{user?.role}</p>
            </div>
            <div className="status-badge">
              <div className="w-2 h-2 bg-success rounded-full" />
              System Online
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <ShieldCheck size={18} />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6"
              >
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="My Bots" value={bots.length.toString()} change={`${bots.length}/${user?.plan === 'free' ? '2' : '10'}`} />
                    <StatCard label="Scraped Pages" value={knowledge.filter(k => k.source === 'url').length.toString()} change={`${knowledge.filter(k => k.source === 'url').length}/${user?.plan === 'free' ? '3' : '∞'}`} />
                    <StatCard label="Knowledge Points" value={knowledge.length.toString()} change="Total" />
                  </div>
                  
                  <div className="card">
                    <div className="card-header">
                      <span>Recent Knowledge</span>
                    </div>
                    <div className="card-body p-0">
                      <div className="divide-y divide-border-main">
                        {knowledge.slice(0, 5).map(item => (
                          <div 
                            key={item._id} 
                            onClick={() => setViewingKnowledge(item)}
                            className="flex items-center justify-between p-4 hover:bg-bg-main transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-bg-main flex items-center justify-center">
                                {item.source === 'url' ? <Globe size={14} className="text-primary" /> : <Database size={14} className="text-text-muted" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.source === 'url' ? item.url : item.content.substring(0, 50)}</p>
                                <p className="text-xs text-text-muted capitalize">
                                  {item.source} source 
                                  {item.summary && <span className="ml-2 text-primary flex items-center gap-1 inline-flex"><Sparkles size={10} /> Summarized</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteKnowledge(item._id); }}
                                className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                              <ChevronRight size={16} className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="card">
                    <div className="card-header">
                      <span>Plan Status</span>
                    </div>
                    <div className="card-body">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-muted">Bots</span>
                          <span className="text-sm font-bold">{bots.length} / {user?.plan === 'free' ? '2' : '10'}</span>
                        </div>
                        <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full" 
                            style={{ width: `${(bots.length / (user?.plan === 'free' ? 2 : 10)) * 100}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin-stats' && (
              <motion.div 
                key="admin-stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Users" value={adminStats?.totalUsers.toString() || '0'} change="All Time" />
                  <StatCard label="Total Bots" value={adminStats?.totalBots.toString() || '0'} change="All Users" />
                  <StatCard label="Pro Users" value={adminStats?.proUsers.toString() || '0'} change={`${((adminStats?.proUsers || 0) / (adminStats?.totalUsers || 1) * 100).toFixed(1)}%`} />
                  <StatCard label="Knowledge Base" value={adminStats?.totalKnowledge.toString() || '0'} change="Total Chunks" />
                </div>

                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <span>Subscription Management</span>
                    <CreditCard size={18} className="text-primary" />
                  </div>
                  <div className="card-body">
                    <p className="text-sm text-text-muted mb-4">
                      Before users can upgrade, you need to create a payment plan in your Flutterwave dashboard or initialize the Pro plan here.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={createProPlan}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Initialize Pro Plan ($5/mo)
                      </button>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Manual Plan ID Override</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="input-field py-1.5 flex-1" 
                            placeholder="Enter Flutterwave Plan ID..." 
                            defaultValue={localStorage.getItem('pro_plan_id') || ''}
                            onBlur={(e) => {
                              if (e.target.value) {
                                localStorage.setItem('pro_plan_id', e.target.value);
                                alert("Plan ID updated locally.");
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin-users' && (
              <motion.div 
                key="admin-users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-x-auto"
              >
                <div className="card-header">User Management</div>
                <div className="card-body p-0">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-bg-main border-b border-border-main">
                      <tr>
                        <th className="px-6 py-3 font-bold text-text-muted uppercase text-[10px]">Email</th>
                        <th className="px-6 py-3 font-bold text-text-muted uppercase text-[10px]">Role</th>
                        <th className="px-6 py-3 font-bold text-text-muted uppercase text-[10px]">Plan</th>
                        <th className="px-6 py-3 font-bold text-text-muted uppercase text-[10px]">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main">
                      {adminUsers.map(u => (
                        <tr key={u._id} className="hover:bg-bg-main transition-colors">
                          <td className="px-6 py-4 font-medium">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.plan === 'pro' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                              {u.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin-bots' && (
              <motion.div 
                key="admin-bots"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-x-auto"
              >
                <div className="card-header">Global Bot Management</div>
                <div className="card-body p-0">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-bg-main border-b border-border-main">
                      <tr>
                        <th className="px-6 py-3 font-bold text-text-muted uppercase text-[10px]">Bot Name</th>
                        <th className="px-6 py-3 font-bold text-text-muted uppercase text-[10px]">Owner</th>
                        <th className="px-6 py-3 font-bold text-text-muted uppercase text-[10px]">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main">
                      {adminBots.map(b => (
                        <tr key={b._id} className="hover:bg-bg-main transition-colors">
                          <td className="px-6 py-4 font-medium">{b.name}</td>
                          <td className="px-6 py-4 text-text-muted">{b.userId?.email}</td>
                          <td className="px-6 py-4 text-text-muted">{new Date(b.createdAt || '').toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'knowledge' && (
              <motion.div 
                key="knowledge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6"
              >
                <div className="flex flex-col gap-6">
                  <div className="card">
                    <div className="card-header">Scrape Website</div>
                    <div className="card-body">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="url"
                          className="input-field flex-1"
                          placeholder="https://example.com"
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                        />
                        <button 
                          className="btn-primary"
                          onClick={handleScrape}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Scraping...' : 'Scrape'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">Knowledge Base</div>
                    <div className="card-body p-0">
                      <div className="divide-y divide-border-main">
                        {knowledge.map(item => (
                          <div key={item._id} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-bg-main flex items-center justify-center">
                                  {item.source === 'url' ? <Globe size={14} className="text-primary" /> : <Database size={14} className="text-text-muted" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate">{item.source === 'url' ? item.url : 'Manual Entry'}</p>
                                  <p className="text-[10px] text-text-muted uppercase font-bold">{new Date(item.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => deleteKnowledge(item._id)}
                                className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            
                            {item.summary ? (
                              <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Sparkles size={12} className="text-primary" />
                                  <span className="text-[10px] font-bold text-primary uppercase">AI Summary</span>
                                </div>
                                <p className="text-xs text-text-main leading-relaxed">{item.summary}</p>
                              </div>
                            ) : (
                              <div className="bg-bg-main p-3 rounded-lg">
                                <p className="text-xs text-text-muted italic">No summary available.</p>
                              </div>
                            )}

                            <div className="text-[11px] text-text-muted line-clamp-2 bg-bg-main/50 p-2 rounded">
                              {item.content}
                            </div>
                          </div>
                        ))}
                        {knowledge.length === 0 && (
                          <div className="p-8 text-center text-text-muted">
                            <Database size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No knowledge items found.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="card">
                    <div className="card-header">Manual Data</div>
                    <div className="card-body">
                      <textarea 
                        className="input-field w-full min-h-[120px] mb-4"
                        placeholder="Paste text here..."
                        value={newKnowledge}
                        onChange={(e) => setNewKnowledge(e.target.value)}
                      />
                      <button 
                        className="btn-primary w-full"
                        onClick={addKnowledge}
                        disabled={isLoading}
                      >
                        Add Knowledge
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bots' && (
              <motion.div 
                key="bots"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {!selectedBot ? (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h3 className="text-lg font-bold text-text-main">My AI Bots</h3>
                      <button 
                        onClick={() => setIsCreatingBot(true)}
                        className="btn-primary flex items-center gap-2 w-full sm:w-auto"
                        disabled={bots.length >= (user?.plan === 'free' ? 2 : 10)}
                      >
                        <Plus size={18} />
                        Create New Bot
                      </button>
                    </div>

                    {isCreatingBot && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="card border-primary"
                      >
                        <div className="card-body">
                          <h4 className="font-bold mb-4">New Bot Configuration</h4>
                          <form onSubmit={handleCreateBot} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-text-muted uppercase mb-1">Bot Name</label>
                              <input 
                                type="text" 
                                className="input-field w-full" 
                                placeholder="e.g. Sales Assistant"
                                value={newBotName}
                                onChange={(e) => setNewBotName(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-text-muted uppercase mb-1">Description</label>
                              <textarea 
                                className="input-field w-full h-20" 
                                placeholder="What does this bot do?"
                                value={newBotDesc}
                                onChange={(e) => setNewBotDesc(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button 
                                type="button"
                                onClick={() => setIsCreatingBot(false)}
                                className="btn-outline"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit"
                                className="btn-primary"
                                disabled={isLoading}
                              >
                                {isLoading ? 'Creating...' : 'Create Bot'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {bots.map(bot => (
                        <div key={bot._id} className="card hover:border-primary transition-colors group">
                          <div className="card-body">
                            <div className="flex justify-between items-start mb-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Bot className="text-primary" size={20} />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="status-badge">Active</div>
                                <button 
                                  onClick={() => deleteBot(bot._id)}
                                  className="p-1.5 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-bold text-text-main mb-1">{bot.name}</h4>
                            <p className="text-sm text-text-muted mb-4">{bot.description || 'No description provided.'}</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { setSelectedBot(bot); setBotViewMode('settings'); }}
                                className="btn-outline text-xs py-1.5 flex-1"
                              >
                                Settings
                              </button>
                              <button 
                                onClick={() => { setSelectedBot(bot); setBotViewMode('analytics'); }}
                                className="btn-outline text-xs py-1.5 flex-1"
                              >
                                Analytics
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {bots.length === 0 && !isCreatingBot && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-border-main rounded-xl">
                          <Bot className="mx-auto text-text-muted mb-4" size={48} />
                          <h4 className="font-bold text-text-main">No bots yet</h4>
                          <p className="text-sm text-text-muted mb-6">Create your first AI assistant to get started.</p>
                          <button 
                            onClick={() => setIsCreatingBot(true)}
                            className="btn-primary"
                          >
                            Create Your First Bot
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedBot(null)}
                        className="p-2 hover:bg-bg-main rounded-lg transition-colors"
                      >
                        <ChevronRight size={20} className="rotate-180" />
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-text-main">{selectedBot.name}</h3>
                        <p className="text-sm text-text-muted">{botViewMode === 'settings' ? 'Bot Configuration' : 'Performance Analytics'}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 border-b border-border-main">
                      <button 
                        onClick={() => setBotViewMode('settings')}
                        className={`pb-4 text-sm font-bold transition-colors border-b-2 ${botViewMode === 'settings' ? 'text-primary border-primary' : 'text-text-muted border-transparent'}`}
                      >
                        Settings
                      </button>
                      <button 
                        onClick={() => { setBotViewMode('analytics'); fetchAnalytics(selectedBot._id); }}
                        className={`pb-4 text-sm font-bold transition-colors border-b-2 ${botViewMode === 'analytics' ? 'text-primary border-primary' : 'text-text-muted border-transparent'}`}
                      >
                        Analytics
                      </button>
                      <button 
                        onClick={() => { setBotViewMode('test'); setTestChat([{ role: 'assistant', content: selectedBot.welcomeMessage || 'Hello!' }]); }}
                        className={`pb-4 text-sm font-bold transition-colors border-b-2 ${botViewMode === 'test' ? 'text-primary border-primary' : 'text-text-muted border-transparent'}`}
                      >
                        Test Bot
                      </button>
                    </div>

                    {botViewMode === 'settings' && (
                      <div className="card">
                        <div className="card-body space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="font-bold text-sm uppercase tracking-wider text-text-muted">General Settings</h4>
                              <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Bot Name</label>
                                <input 
                                  type="text" 
                                  className="input-field w-full" 
                                  defaultValue={selectedBot.name} 
                                  onBlur={(e) => {
                                    const newName = e.target.value;
                                    setSelectedBot({ ...selectedBot, name: newName });
                                    updateBot(selectedBot._id, { name: newName });
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Welcome Message</label>
                                <input 
                                  type="text" 
                                  className="input-field w-full" 
                                  defaultValue={selectedBot.welcomeMessage} 
                                  onBlur={(e) => {
                                    const newMsg = e.target.value;
                                    setSelectedBot({ ...selectedBot, welcomeMessage: newMsg });
                                    updateBot(selectedBot._id, { welcomeMessage: newMsg });
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Widget Color</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="color" 
                                    className="w-10 h-10 rounded cursor-pointer" 
                                    defaultValue={selectedBot.color} 
                                    onChange={(e) => {
                                      const newColor = e.target.value;
                                      setSelectedBot({ ...selectedBot, color: newColor });
                                      updateBot(selectedBot._id, { color: newColor });
                                    }}
                                  />
                                  <input 
                                    type="text" 
                                    className="input-field flex-1" 
                                    defaultValue={selectedBot.color} 
                                    onBlur={(e) => {
                                      const newColor = e.target.value;
                                      setSelectedBot({ ...selectedBot, color: newColor });
                                      updateBot(selectedBot._id, { color: newColor });
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="pt-4 border-t border-border-main space-y-4">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-text-muted">Floating CTA Settings</h4>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="checkbox" 
                                    id="showPopup"
                                    checked={selectedBot.showPopup}
                                    onChange={(e) => {
                                      const val = e.target.checked;
                                      setSelectedBot({ ...selectedBot, showPopup: val });
                                      updateBot(selectedBot._id, { showPopup: val });
                                    }}
                                    className="w-4 h-4 text-primary rounded border-border-main cursor-pointer"
                                  />
                                  <label htmlFor="showPopup" className="text-xs font-medium cursor-pointer">Show popup message</label>
                                </div>
                                {selectedBot.showPopup && (
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Popup Message (Max 70 chars)</label>
                                    <input 
                                      type="text" 
                                      className="input-field w-full" 
                                      maxLength={70}
                                      defaultValue={selectedBot.popupMessage} 
                                      onBlur={(e) => {
                                        const newMsg = e.target.value;
                                        setSelectedBot({ ...selectedBot, popupMessage: newMsg });
                                        updateBot(selectedBot._id, { popupMessage: newMsg });
                                      }}
                                    />
                                    <p className="text-[10px] text-text-muted mt-1">{(selectedBot.popupMessage || '').length}/70 characters</p>
                                  </div>
                                )}
                              </div>

                              <div className="pt-4 border-t border-border-main space-y-4">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-text-muted">Bot Appearance</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Bot Logo</label>
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 bg-bg-main border border-border-main rounded-lg flex items-center justify-center overflow-hidden">
                                        {selectedBot.logo ? (
                                          <img src={selectedBot.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <Bot className="text-text-muted" size={24} />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <label className="btn-secondary flex items-center justify-center gap-2 cursor-pointer py-2 text-xs">
                                          <Upload size={14} />
                                          {isUploading ? 'Uploading...' : 'Upload Logo'}
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={isUploading}
                                          />
                                        </label>
                                        <p className="text-[10px] text-text-muted mt-1">Recommended: Square image, max 2MB</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Or use Logo URL</label>
                                    <input 
                                      type="text" 
                                      className="input-field w-full text-xs" 
                                      placeholder="https://example.com/logo.png"
                                      defaultValue={selectedBot.logo} 
                                      onBlur={(e) => {
                                        const newLogo = e.target.value;
                                        setSelectedBot({ ...selectedBot, logo: newLogo });
                                        updateBot(selectedBot._id, { logo: newLogo });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-border-main space-y-4">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-text-muted">Advanced Features</h4>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="checkbox" 
                                    id="enableBooking"
                                    checked={selectedBot.enableBooking}
                                    onChange={(e) => {
                                      const val = e.target.checked;
                                      setSelectedBot({ ...selectedBot, enableBooking: val });
                                      updateBot(selectedBot._id, { enableBooking: val });
                                    }}
                                    className="w-4 h-4 text-primary rounded border-border-main cursor-pointer"
                                  />
                                  <label htmlFor="enableBooking" className="text-xs font-medium cursor-pointer">Enable AI Booking Form</label>
                                </div>
                                {selectedBot.enableBooking && (
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Booking Parameters (comma separated)</label>
                                    <input 
                                      type="text" 
                                      className="input-field w-full" 
                                      defaultValue={selectedBot.bookingParameters?.join(', ')} 
                                      onBlur={(e) => {
                                        const params = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                        setSelectedBot({ ...selectedBot, bookingParameters: params });
                                        updateBot(selectedBot._id, { bookingParameters: params });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-bold text-sm uppercase tracking-wider text-text-muted">Knowledge Base</h4>
                              <p className="text-xs text-text-muted">Select which knowledge sources this bot should use.</p>
                              <div className="max-h-60 overflow-y-auto border border-border-main rounded-lg divide-y divide-border-main">
                                {knowledge.map(item => {
                                  const isLinked = (selectedBot.knowledgeIds as any[]).some(k => {
                                    const id = typeof k === 'string' ? k : k._id;
                                    return id === item._id;
                                  });
                                  return (
                                    <div key={item._id} className="flex items-center gap-3 p-3 hover:bg-bg-main transition-colors">
                                      <input 
                                        type="checkbox" 
                                        checked={isLinked}
                                        onChange={(e) => {
                                          const currentIds = (selectedBot.knowledgeIds as any[]).map(k => typeof k === 'string' ? k : k._id);
                                          const newIds = e.target.checked 
                                            ? [...currentIds, item._id]
                                            : currentIds.filter(id => id !== item._id);
                                          
                                          // Optimistically update local state
                                          setSelectedBot({ ...selectedBot, knowledgeIds: newIds });
                                          updateBot(selectedBot._id, { knowledgeIds: newIds });
                                        }}
                                        className="w-4 h-4 text-primary rounded border-border-main cursor-pointer"
                                      />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">{item.source === 'url' ? item.url : item.content.substring(0, 40)}</p>
                                        <p className="text-[10px] text-text-muted capitalize">{item.source}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {botViewMode === 'analytics' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard label="Total Sessions" value={realAnalytics?.totalSessions.toString() || '0'} change="Real-time data" />
                        <StatCard label="Avg Response Time" value={realAnalytics?.avgResponseTime || '0s'} change="Optimized" />
                        <StatCard label="User Satisfaction" value={realAnalytics?.satisfaction || '0%'} change="Based on ratings" />
                      </div>
                    )}

                    {botViewMode === 'test' && (
                      <div className="card max-w-2xl mx-auto h-[500px] flex flex-col">
                        <div className="p-4 border-b border-border-main flex items-center justify-between" style={{ backgroundColor: selectedBot.color }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <Bot size={16} className="text-white" />
                            </div>
                            <span className="font-bold text-white">{selectedBot.name}</span>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-main">
                          {testChat.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                msg.role === 'user' 
                                  ? 'bg-primary text-white rounded-tr-none' 
                                  : 'bg-white text-text-main border border-border-main rounded-tl-none'
                              }`}>
                                {msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()}
                              </div>
                            </div>
                          ))}
                          {isTestTyping && (
                            <div className="flex justify-start">
                              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-border-main shadow-sm w-[70%]">
                                <div className="space-y-2">
                                  <div className="h-2.5 shimmer rounded w-3/4"></div>
                                  <div className="h-2.5 shimmer rounded w-1/2"></div>
                                  <div className="h-2.5 shimmer rounded w-5/6"></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <form onSubmit={handleTestChat} className="p-4 border-t border-border-main bg-white">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              className="input-field flex-1" 
                              placeholder="Type a message..." 
                              value={testMessage}
                              onChange={(e) => setTestMessage(e.target.value)}
                            />
                            <button type="submit" className="btn-primary p-2">
                              <Send size={18} />
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'integration' && (
              <motion.div 
                key="integration"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card">
                  <div className="card-header">Select Bot for Integration</div>
                  <div className="card-body">
                    <select 
                      className="input-field w-full"
                      value={selectedIntegrationBot}
                      onChange={(e) => setSelectedIntegrationBot(e.target.value)}
                    >
                      <option value="">Select a bot...</option>
                      {bots.map(bot => (
                        <option key={bot._id} value={bot._id}>{bot.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedIntegrationBot && (
                  <div className="card">
                    <div className="card-header">Embed Code</div>
                    <div className="card-body">
                      <p className="text-sm text-text-muted mb-4">Paste this script into your website's &lt;head&gt; tag.</p>
                      <div className="relative group">
                        <pre className="bg-bg-main p-4 rounded-lg text-xs overflow-x-auto border border-border-main">
                          {`<script src="${window.location.origin}/widget.js"></script>
<script>
  WidgetWhiz.init({
    botId: '${selectedIntegrationBot}'
  });
</script>`}
                        </pre>
                        <button 
                          onClick={() => {
                            const code = `<script src="${window.location.origin}/widget.js"></script>\n<script>\n  WidgetWhiz.init({\n    botId: '${selectedIntegrationBot}'\n  });\n</script>`;
                            navigator.clipboard.writeText(code);
                            alert('Copied to clipboard!');
                          }}
                          className="absolute top-2 right-2 p-2 bg-white border border-border-main rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-main"
                        >
                          <Code size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div 
                key="billing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`card ${user?.plan === 'free' ? 'border-primary ring-1 ring-primary' : ''}`}>
                    <div className="card-body p-8 flex flex-col items-center text-center">
                      <h3 className="text-xl font-bold mb-2">Free Plan</h3>
                      <p className="text-3xl font-extrabold mb-6">$0<span className="text-sm font-normal text-text-muted">/mo</span></p>
                      <ul className="text-sm text-text-muted space-y-4 mb-8 text-left w-full">
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-success" /> 2 AI Chatbots</li>
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-success" /> 3 Scraped Pages</li>
                        <li className="flex items-center gap-2 text-red-500"><X size={16} /> Widget Watermark</li>
                      </ul>
                      <button disabled className="w-full btn-outline">Current Plan</button>
                    </div>
                  </div>

                  <div className={`card ${user?.plan === 'pro' ? 'border-primary ring-1 ring-primary' : ''}`}>
                    <div className="card-body p-8 flex flex-col items-center text-center">
                      <div className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-2 py-1 rounded mb-4">Recommended</div>
                      <h3 className="text-xl font-bold mb-2">Pro Plan</h3>
                      <p className="text-3xl font-extrabold mb-6">$5<span className="text-sm font-normal text-text-muted">/mo</span></p>
                      <ul className="text-sm text-text-muted space-y-4 mb-8 text-left w-full">
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-success" /> 10 AI Chatbots</li>
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-success" /> Unlimited Scraping</li>
                        <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-success" /> No Watermark</li>
                      </ul>
                      {user?.plan === 'free' ? (
                        <button className="w-full btn-primary" onClick={handleUpgrade}>Upgrade Now</button>
                      ) : (
                        <div className="w-full space-y-3">
                          <button disabled className="w-full btn-outline">Pro Active</button>
                          <div className="flex items-center justify-center gap-2 text-[10px] text-success font-bold uppercase">
                            <Sparkles size={12} />
                            Status: {user?.subscriptionStatus || 'Active'}
                          </div>
                          {user?.subscriptionStatus !== 'cancelled' && (
                            <button 
                              onClick={handleCancelSubscription}
                              className="text-[10px] text-red-500 hover:underline font-bold uppercase"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Processing...' : 'Cancel Subscription'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Knowledge Detail Modal */}
      <AnimatePresence>
        {viewingKnowledge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-border-main flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {viewingKnowledge.source === 'url' ? <Globe size={20} className="text-primary" /> : <Database size={20} className="text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-main line-clamp-1">{viewingKnowledge.source === 'url' ? viewingKnowledge.url : 'Text Source'}</h3>
                    <p className="text-xs text-text-muted">Added {new Date(viewingKnowledge.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setViewingKnowledge(null)} className="p-2 hover:bg-bg-main rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {viewingKnowledge.summary && (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <Sparkles size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">AI Summary</span>
                    </div>
                    <p className="text-sm text-text-main leading-relaxed">{viewingKnowledge.summary}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Extracted Content</h4>
                  <div className="bg-bg-main rounded-xl p-4 font-mono text-[11px] text-text-main whitespace-pre-wrap leading-relaxed border border-border-main">
                    {viewingKnowledge.content}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border-main flex justify-end gap-3 bg-bg-main/50">
                <button 
                  onClick={() => setViewingKnowledge(null)}
                  className="btn-outline"
                >
                  Close
                </button>
                <button 
                  onClick={() => { setActiveTab('knowledge'); setViewingKnowledge(null); }}
                  className="btn-primary"
                >
                  Manage Knowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all border-l-4 ${
        active 
          ? 'text-primary bg-[#eff6ff] border-primary' 
          : 'text-text-muted border-transparent hover:text-text-main hover:bg-bg-main'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, change }: { label: string, value: string, change: string }) {
  return (
    <div className="card">
      <div className="card-body">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <h4 className="text-2xl font-bold text-text-main">{value}</h4>
          <span className="text-xs font-bold text-text-muted">{change}</span>
        </div>
      </div>
    </div>
  );
}
