import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot as BotIcon, 
  Database, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Plus, 
  LogOut, 
  Globe, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Search, 
  User as UserIcon, 
  Shield, 
  Zap,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  Star,
  RefreshCw,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Headset,
  Calendar
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface User {
  email: string;
  role: string;
  plan: string;
  planId?: string;
}

interface Bot {
  _id: string;
  name: string;
  description: string;
  color: string;
  welcomeMessage: string;
  showPopup: boolean;
  popupMessage: string;
  enableBooking: boolean;
  bookingParameters: string[];
  logo?: string;
  knowledgeIds: any[];
  humanAgentOnline: boolean;
  enableNotifySound: boolean;
  availability?: {
    workingDays: number[];
    startHour: string;
    endHour: string;
  };
}

interface Meeting {
  _id: string;
  botId: any;
  name: string;
  email: string;
  date: string;
  time: string;
  createdAt: string;
}

interface Knowledge {
  _id: string;
  content: string;
  source: 'text' | 'url';
  url?: string;
  summary?: string;
  createdAt: string;
}

interface Session {
  _id: string;
  botId: any;
  visitorId: string;
  isHumanSupport: boolean;
  lastMessageAt: string;
  rating?: number;
}

interface Message {
  _id: string;
  role: 'user' | 'assistant' | 'human';
  content: string;
  createdAt: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'bots' | 'knowledge' | 'support' | 'analytics' | 'bookings' | 'settings'>('bots');
  const [bots, setBots] = useState<Bot[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Modal States
  const [showBotModal, setShowBotModal] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [manualText, setManualText] = useState('');
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');

  // Support State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchBots();
      fetchKnowledge();
      fetchSessions();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedBotId) {
      fetchProAnalytics(selectedBotId);
    }
  }, [selectedBotId]);

  useEffect(() => {
    let interval: any;
    if (selectedSessionId && activeTab === 'support') {
      fetchMessages(selectedSessionId);
      interval = setInterval(() => fetchMessages(selectedSessionId), 5000);
    }
    return () => clearInterval(interval);
  }, [selectedSessionId, activeTab]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUser(await res.json());
      else handleLogout();
    } catch (e) {
      handleLogout();
    }
  };

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/bots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBots(data);
      if (data.length > 0 && !selectedBotId) setSelectedBotId(data[0]._id);
    } catch (e) {}
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setKnowledge(await res.json());
    } catch (e) {}
  };

  const fetchMeetings = async (botId: string) => {
    try {
      const res = await fetch(`/api/bots/${botId}/meetings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/human/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSessions(await res.json());
    } catch (e) {}
  };

  const fetchMessages = async (sid: string) => {
    try {
      const res = await fetch(`/api/sessions/${sid}/messages`);
      setChatMessages(await res.json());
    } catch (e) {}
  };

  const joinSession = async (sid: string) => {
    try {
      await fetch(`/api/sessions/${sid}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchSessions(); // Refresh sessions to show human support active
    } catch (e) {}
  };

  useEffect(() => {
    if (selectedSessionId) {
      joinSession(selectedSessionId);
    }
  }, [selectedSessionId]);

  const fetchProAnalytics = async (id: string) => {
    try {
      const res = await fetch(`/api/bots/${id}/analytics-pro`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalyticsData(data.chartData || []);
    } catch (e) {}
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && authPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setAuthLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError("Connection failed. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const createBot = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.target as any).botName.value;
    const description = (e.target as any).botDesc.value;
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        fetchBots();
        setShowBotModal(false);
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (e) {}
  };

  const updateBot = async (id: string, updates: Partial<Bot>) => {
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
        setEditingBot(null);
      }
    } catch (e) {}
  };

  const deleteBot = async (id: string) => {
    if (!confirm("Are you sure? This delete all data for this bot.")) return;
    try {
      await fetch(`/api/bots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchBots();
    } catch (e) {}
  };

  const handleScrape = async () => {
    if (!scrapingUrl) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: scrapingUrl })
      });
      if (res.ok) {
        fetchKnowledge();
        setScrapingUrl('');
        setShowKnowledgeModal(false);
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (e) {} finally {
      setIsLoading(false);
    }
  };

  const handleAddText = async () => {
    if (!manualText) return;
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: manualText })
      });
      if (res.ok) {
        fetchKnowledge();
        setManualText('');
        setShowKnowledgeModal(false);
      }
    } catch (e) {}
  };

  const deleteKnowledge = async (id: string) => {
    try {
      await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchKnowledge();
    } catch (e) {}
  };

  const sendHumanReply = async () => {
    if (!replyText || !selectedSessionId) return;
    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/human-reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyText })
      });
      if (res.ok) {
        setReplyText('');
        fetchMessages(selectedSessionId);
      }
    } catch (e) {} finally {
      setIsSendingReply(false);
    }
  };

  const upgradeToPro = () => {
    // This is where Flutterwave integration would happen
    // For now, let's pretend and prompt the user
    const confirmed = confirm("Upgrade to Pro Plan for $5/month to unlock unlimited scraping and 10 bots?");
    if (confirmed) {
      window.open('https://flutterwave.com/pay/widgetwhizpro', '_blank');
      alert("After payment, please refresh your dashboard.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <BotIcon className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-primary">WidgetWhiz</h1>
          </div>
          
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100">
            <h2 className="text-2xl font-black mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your credentials to access your chatbot dashboard.</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:border-primary transition-colors text-sm"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:border-primary transition-colors text-sm pr-12"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:border-primary transition-colors text-sm pr-12"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}
              <button 
                type="submit" 
                disabled={authLoading}
                className="btn-primary w-full py-3 h-12 flex items-center justify-center gap-2 mt-4"
              >
                {authLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-bold text-gray-400 hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      <Helmet>
        <title>Dashboard | WidgetWhiz AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex flex-col h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <BotIcon className="text-white" size={18} />
          </div>
          <span className="text-xl font-black tracking-tight text-primary">WidgetWhiz</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem active={activeTab === 'bots'} onClick={() => setActiveTab('bots')} icon={<BotIcon size={18}/>} label="My Bots" />
          <NavItem active={activeTab === 'knowledge'} onClick={() => setActiveTab('knowledge')} icon={<Database size={18}/>} label="Knowledge" />
          <NavItem active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon={<MessageSquare size={18}/>} label="Human Support" count={sessions.filter(s => s.isHumanSupport).length} />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={18}/>} label="Analytics" />
          <NavItem active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Calendar size={18}/>} label="Bookings" />
          <div className="pt-4 mt-4 border-t border-gray-200">
            <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18}/>} label="Settings" />
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </nav>

        {user && (
          <div className="p-4 m-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon className="text-gray-400" size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-black truncate">{user.email}</div>
                <div className={`text-[10px] uppercase font-bold ${user.plan === 'pro' ? 'text-primary' : 'text-gray-400'}`}>
                  {user.plan} Plan
                </div>
              </div>
            </div>
            {user.plan === 'free' && (
              <button 
                onClick={upgradeToPro}
                className="w-full py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-all"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between z-10 shrink-0">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            {activeTab === 'bots' && "My Chatbots"}
            {activeTab === 'knowledge' && "Knowledge Base"}
            {activeTab === 'support' && "Live Human Support"}
            {activeTab === 'analytics' && "AI Analytics"}
            {activeTab === 'bookings' && "Bookings & Availability"}
            {activeTab === 'settings' && "Account Settings"}
          </h2>
          <div className="flex items-center gap-4">
             {activeTab === 'bots' && (
               <button onClick={() => setShowBotModal(true)} className="btn-primary py-2 px-4 shadow-md bg-primary hover:bg-primary-dark text-sm flex items-center gap-2">
                 <Plus size={16} /> New Bot
               </button>
             )}
             {activeTab === 'knowledge' && (
               <button onClick={() => setShowKnowledgeModal(true)} className="btn-primary py-2 px-4 shadow-md bg-primary hover:bg-primary-dark text-sm flex items-center gap-2">
                 <Plus size={16} /> Add Knowledge
               </button>
             )}
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
           <AnimatePresence mode="wait">
             {activeTab === 'bots' && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {bots.map(bot => (
                   <div key={bot._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group relative">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: bot.color }}>
                            {bot.logo ? <img src={bot.logo} className="w-8 h-8 object-contain" alt="logo" /> : <BotIcon size={24} />}
                         </div>
                         <div className="flex-1">
                            <h3 className="font-black text-lg truncate">{bot.name}</h3>
                            <p className="text-xs text-gray-400 line-clamp-1">{bot.description}</p>
                         </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                         <div className="flex items-center justify-between text-xs text-gray-500">
                           <span>Knowledge Points</span>
                           <span className="font-bold">{bot.knowledgeIds.length}</span>
                         </div>
                         <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${Math.min(bot.knowledgeIds.length * 10, 100)}%` }} />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setEditingBot(bot)} className="px-3 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                           <Edit3 size={14} /> Customize
                         </button>
                         <button onClick={() => {
                           const snippet = `<script src="${window.location.origin}/widget.js?botId=${bot._id}"></script>`;
                           navigator.clipboard.writeText(snippet);
                           alert("Code snippet copied to clipboard!");
                         }} className="px-3 py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
                           <Copy size={14} /> Get Code
                         </button>
                      </div>
                      
                      <button onClick={() => deleteBot(bot._id)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
                 {bots.length === 0 && (
                   <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <BotIcon size={32} />
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-gray-400">No Bots Yet</h4>
                        <p className="text-xs text-gray-300">Create your first AI assistant to get started.</p>
                      </div>
                      <button onClick={() => setShowBotModal(true)} className="btn-primary py-2 px-6">Create Bot</button>
                   </div>
                 )}
               </motion.div>
             )}

             {activeTab === 'knowledge' && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                 {/* Bulk Actions */}
                 <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <Stat label="Total Points" value={knowledge.length} icon={<Database className="text-blue-500" size={14}/>} />
                       <Stat label="Sources Scraped" value={knowledge.filter(k => k.source === 'url').length} icon={<Globe className="text-green-500" size={14}/>} />
                    </div>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                       <input type="text" placeholder="Search knowledge..." className="pl-10 pr-4 h-10 bg-gray-50 border-none rounded-xl text-sm outline-none w-64 focus:ring-2 ring-primary/20 transition-all" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {knowledge.map(k => (
                      <div key={k._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-5 hover:shadow-md transition-shadow">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.source === 'url' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            {k.source === 'url' ? <Globe size={20} /> : <Edit3 size={20} />}
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-3 mb-1">
                               <h4 className="font-bold text-sm truncate max-w-sm">{k.source === 'url' ? k.url : "Manual Entry"}</h4>
                               <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(k.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {k.summary || k.content.substring(0, 200)}
                            </p>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => deleteKnowledge(k._id)} className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all">
                              <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                    ))}
                    {knowledge.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center text-gray-300 gap-4">
                         <Database size={48} />
                         <span className="text-sm font-bold">Your knowledge base is empty</span>
                         <button onClick={() => setShowKnowledgeModal(true)} className="btn-primary py-2 px-6">Add Data Now</button>
                      </div>
                    )}
                 </div>
               </motion.div>
             )}

             {activeTab === 'support' && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex gap-6">
                 {/* Session List */}
                 <div className="w-80 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                       <h4 className="font-black text-sm uppercase tracking-wider text-gray-400">Active Conversations</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                       {sessions.map(s => (
                         <button 
                           key={s._id} 
                           onClick={() => setSelectedSessionId(s._id)}
                           className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${selectedSessionId === s._id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50'}`}
                         >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                               <UserIcon className={selectedSessionId === s._id ? 'text-white/80' : 'text-gray-400'} size={20} />
                            </div>
                            <div className="text-left overflow-hidden">
                               <div className="text-xs font-black truncate">Visitor {s.visitorId?.substring(0, 5)}</div>
                               <div className={`text-[10px] truncate ${selectedSessionId === s._id ? 'text-white/60' : 'text-gray-400'}`}>
                                 {s.botId?.name || "Agent Support"}
                               </div>
                            </div>
                            {s.isHumanSupport && <div className="ml-auto w-2 h-2 rounded-full bg-red-400" />}
                         </button>
                       ))}
                       {sessions.length === 0 && (
                         <div className="py-20 text-center text-gray-300 text-xs font-bold">No active sessions</div>
                       )}
                    </div>
                 </div>

                 {/* Chat Area */}
                 <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    {selectedSessionId ? (
                      <>
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span className="text-sm font-black">Live Support Mode</span>
                           </div>
                           <button onClick={() => setSelectedSessionId(null)} className="p-2 hover:bg-gray-50 rounded-full"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                           {chatMessages.map(m => (
                             <div key={m._id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[75%] p-4 rounded-3xl ${
                                  m.role === 'user' 
                                    ? 'bg-white border border-gray-100 rounded-tl-none shadow-sm' 
                                    : m.role === 'human' 
                                      ? 'bg-primary text-white rounded-tr-none shadow-lg' 
                                      : 'bg-gray-100 text-gray-500 rounded-tr-none'
                                }`}>
                                   <div className="text-xs leading-relaxed">{m.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()}</div>
                                   <div className={`text-[8px] mt-1 opacity-50 font-bold uppercase ${m.role === 'user' ? 'text-left' : 'text-right'}`}>
                                     {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                </div>
                             </div>
                           ))}
                           {chatMessages.length === 0 && <div className="h-full flex items-center justify-center text-gray-300 text-xs">Waiting for messages...</div>}
                        </div>
                        <div className="p-4 bg-white border-t border-gray-100">
                           <div className="flex items-center gap-3">
                              <input 
                                type="text" 
                                placeholder="Reply as Human Agent..." 
                                className="flex-1 h-12 px-6 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-primary transition-colors text-sm"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendHumanReply()}
                              />
                              <button 
                                onClick={sendHumanReply}
                                disabled={isSendingReply || !replyText}
                                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary-dark transition-all disabled:opacity-50"
                              >
                                {isSendingReply ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                              </button>
                           </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-300 gap-4">
                         <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                            <MessageSquare size={40} />
                         </div>
                         <h4 className="font-black">Select a Conversation</h4>
                         <p className="text-xs max-w-xs">Pick a visitor from the list to start providing live human assistance.</p>
                      </div>
                    )}
                 </div>
               </motion.div>
             )}

             {activeTab === 'analytics' && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black">Conversation Traffic</h3>
                        <p className="text-sm text-gray-500">Real-time interaction volume for your selected bot.</p>
                     </div>
                     <select 
                       className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none ring-primary/20 focus:ring-2"
                       value={selectedBotId}
                       onChange={(e) => setSelectedBotId(e.target.value)}
                     >
                       <option value="">Select a Bot</option>
                       {bots.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                     </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={analyticsData}>
                              <defs>
                                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                              />
                              <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                              <Area type="monotone" dataKey="messages" stroke="#8b5cf6" strokeWidth={3} fillOpacity={0} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-primary text-white rounded-3xl p-6 shadow-lg shadow-primary/20">
                           <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Total Queries</div>
                           <div className="text-4xl font-black">{analyticsData.reduce((acc, d) => acc + d.messages, 0)}</div>
                           <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                              <Zap size={14} /> +12.5% this week
                           </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                           <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Avg Session Duration</div>
                           <div className="text-3xl font-black text-gray-900">4m 12s</div>
                           <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-500">
                              <CheckCircle2 size={14} /> Optimal Performance
                           </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                           <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Success Rate</div>
                           <div className="text-3xl font-black text-gray-900">92%</div>
                           <div className="mt-4 flex justify-between h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="bg-green-500 w-[92%] h-full" />
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}

             {activeTab === 'bookings' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 text-text-main">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black italic">BOOKINGS & APPOINTMENTS</h3>
                        <p className="text-sm text-gray-400">Track and manage meetings scheduled via your chatbot.</p>
                     </div>
                     <select 
                       className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none ring-primary/20 focus:ring-2"
                       value={selectedBotId}
                       onChange={(e) => {
                         setSelectedBotId(e.target.value);
                         if (e.target.value) fetchMeetings(e.target.value);
                       }}
                     >
                       <option value="">Select a Bot</option>
                       {bots.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                     </select>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-gray-50/50 border-b border-gray-100">
                              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Visitor</th>
                              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {meetings.map((m) => (
                             <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-5">
                                   <div className="text-sm font-black text-gray-900">{m.name}</div>
                                </td>
                                <td className="px-8 py-5 text-sm text-gray-500">{m.email}</td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-2">
                                      <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase text-center">{m.date}</div>
                                      <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase text-center">{m.time}</div>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-xs text-gray-400 font-medium">
                                   {new Date(m.createdAt).toLocaleDateString()}
                                </td>
                             </tr>
                           ))}
                           {meetings.length === 0 && (
                             <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">
                                   No bookings found for this bot
                                </td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
                </motion.div>
              )}

             {activeTab === 'settings' && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl space-y-8">
                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-black mb-6">Profile Information</h3>
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Email</label>
                             <div className="h-12 flex items-center px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900">
                                {user?.email}
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Role</label>
                             <div className="h-12 flex items-center px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 uppercase">
                                {user?.role}
                             </div>
                         </div>
                        </div>
                     </div>
                  </section>

                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-xl font-black">Plan & Subscription</h3>
                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user?.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                          {user?.plan} Membership
                       </div>
                    </div>
                    
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 flex flex-col md:flex-row items-center gap-6">
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                          <Zap size={32} />
                       </div>
                       <div className="flex-1 text-center md:text-left">
                          <h4 className="font-black text-lg">Want more power?</h4>
                          <p className="text-xs text-gray-500">Unleash WidgetWhiz Pro with unlimited scraping, 10 bots, and advanced analytics.</p>
                       </div>
                       {user?.plan === 'free' ? (
                         <button onClick={upgradeToPro} className="btn-primary py-3 px-8 shadow-xl shadow-primary/20">Upgrade Now</button>
                       ) : (
                         <div className="flex items-center gap-2 text-primary font-black text-sm">
                           <CheckCircle2 size={20} /> Pro Plan Active
                         </div>
                       )}
                    </div>
                  </section>

                  <section className="bg-red-50/50 rounded-3xl p-8 border border-red-100">
                    <h3 className="text-lg font-black text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-xs text-red-500 mb-6 font-medium">Permanently delete your account and all associated chatbot data. This action is irreversible.</p>
                    <button className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                       Delete Account
                    </button>
                  </section>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </main>

      {/* Bot Customizer Modal */}
      <AnimatePresence>
        {editingBot && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingBot(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: editingBot.color }}>
                         <Settings size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black italic">BOT CONFIGURATOR</h2>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {editingBot._id}</span>
                      </div>
                   </div>
                   <button onClick={() => setEditingBot(null)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto flex">
                   {/* Editor */}
                   <div className="flex-1 p-8 space-y-8 border-r border-gray-100">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Bot Name</label>
                            <input 
                              type="text" 
                              className="w-full h-12 px-6 bg-gray-50 border-none rounded-2xl outline-none ring-primary/10 focus:ring-4 transition-all text-sm font-bold" 
                              value={editingBot.name}
                              onChange={(e) => setEditingBot({...editingBot, name: e.target.value})}
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Accent Color</label>
                            <input 
                              type="color" 
                              className="w-full h-12 px-2 bg-gray-50 border-none rounded-2xl outline-none cursor-pointer" 
                              value={editingBot.color}
                              onChange={(e) => setEditingBot({...editingBot, color: e.target.value})}
                            />
                         </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Welcome Message</label>
                         <textarea 
                           className="w-full h-24 p-6 bg-gray-50 border-none rounded-3xl outline-none ring-primary/10 focus:ring-4 transition-all text-sm leading-relaxed" 
                           value={editingBot.welcomeMessage}
                           onChange={(e) => setEditingBot({...editingBot, welcomeMessage: e.target.value})}
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="bg-gray-50 p-6 rounded-[2rem] flex items-center justify-between">
                            <div>
                               <div className="text-sm font-black">Enable Booking</div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase">Appointmnet Feature</div>
                            </div>
                            <button 
                              onClick={() => setEditingBot({...editingBot, enableBooking: !editingBot.enableBooking})}
                              className={`w-12 h-6 rounded-full relative transition-colors ${editingBot.enableBooking ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingBot.enableBooking ? 'right-1' : 'left-1'}`} />
                            </button>
                         </div>
                         <div className="bg-gray-50 p-6 rounded-[2rem] flex items-center justify-between">
                            <div>
                               <div className="text-sm font-black">Online Agent Status</div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase">Human availability</div>
                            </div>
                            <button 
                              onClick={() => setEditingBot({...editingBot, humanAgentOnline: !editingBot.humanAgentOnline})}
                              className={`w-12 h-6 rounded-full relative transition-colors ${editingBot.humanAgentOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingBot.humanAgentOnline ? 'right-1' : 'left-1'}`} />
                            </button>
                         </div>
                         <div className="bg-gray-50 p-6 rounded-[2rem] flex items-center justify-between">
                            <div>
                               <div className="text-sm font-black">Messages Sound</div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase">Enable notify sound</div>
                            </div>
                            <button 
                              onClick={() => setEditingBot({...editingBot, enableNotifySound: !editingBot.enableNotifySound})}
                              className={`w-12 h-6 rounded-full relative transition-colors ${editingBot.enableNotifySound ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingBot.enableNotifySound ? 'right-1' : 'left-1'}`} />
                            </button>
                         </div>
                      </div>
                   </div>

                   {/* Preview Sidebar */}
                   <div className="w-80 bg-gray-50 p-8 shrink-0 flex flex-col justify-center items-center gap-6">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Appearance Preview</div>
                      <div className="w-64 h-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                         <div className="p-4 flex items-center gap-3 text-white" style={{ backgroundColor: editingBot.color }}>
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                               <BotIcon size={18} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                               <div className="text-[10px] font-bold truncate">{editingBot.name}</div>
                               <div className="text-[8px] opacity-80">{editingBot.humanAgentOnline ? 'Agent Online' : 'AI Assistant'}</div>
                            </div>
                         </div>
                         <div className="flex-1 p-4">
                            <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 text-[10px] max-w-[85%] text-gray-500">
                               {editingBot.welcomeMessage}
                            </div>
                         </div>
                         <div className="p-3 border-t">
                            <div className="h-8 bg-gray-50 rounded-full border px-3 flex items-center justify-between">
                               <div className="text-[8px] text-gray-400">Type a message...</div>
                               <SendPreviewIcon color={editingBot.color} />
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={() => updateBot(editingBot._id, editingBot)}
                        className="w-full btn-primary py-4 text-base font-black flex items-center justify-center gap-3 shadow-xl"
                        style={{ backgroundColor: editingBot.color }}
                      >
                         <Save size={20} /> Save Changes
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bot Creation Modal */}
      <AnimatePresence>
        {showBotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBotModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden">
                <div className="space-y-2 mb-8">
                   <h2 className="text-3xl font-black italic">LAUNCH NEW BOT</h2>
                   <p className="text-gray-400 text-sm">Start your journey toward automated customer delight.</p>
                </div>
                <form onSubmit={createBot} className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Display Name</label>
                      <input 
                        name="botName" 
                        required 
                        placeholder="e.g. WidgetWhiz Sales Pro"
                        className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl outline-none ring-primary/10 focus:ring-4 transition-all text-sm font-bold" 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Purpose / Description</label>
                      <input 
                        name="botDesc" 
                        required 
                        placeholder="e.g. Assistant for my flower shop docs"
                        className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl outline-none ring-primary/10 focus:ring-4 transition-all text-sm font-bold" 
                      />
                   </div>
                   <div className="pt-4 flex items-center gap-4">
                      <button type="button" onClick={() => setShowBotModal(false)} className="flex-1 py-4 text-sm font-black text-gray-400 uppercase tracking-widest">Cancel</button>
                      <button type="submit" className="flex-1 btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20">Build Bot</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Knowledge Creation Modal */}
      <AnimatePresence>
        {showKnowledgeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowKnowledgeModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                   <h2 className="text-2xl font-black italic uppercase tracking-tight">KNOWLEDGE INJECTOR</h2>
                   <button onClick={() => setShowKnowledgeModal(false)} className="p-2 hover:bg-gray-50 rounded-full"><X size={24}/></button>
                </div>
                
                <div className="p-8 space-y-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                            <Globe size={18} />
                         </div>
                         <h3 className="font-black text-sm uppercase tracking-wider">Web Scraping</h3>
                      </div>
                      <div className="flex gap-2">
                         <input 
                           type="url" 
                           placeholder="https://docs.yourstartup.com" 
                           className="flex-1 h-12 px-6 bg-gray-50 border-none rounded-2xl outline-none ring-primary/10 focus:ring-4 transition-all text-sm"
                           value={scrapingUrl}
                           onChange={(e) => setScrapingUrl(e.target.value)}
                         />
                         <button 
                           onClick={handleScrape}
                           disabled={isLoading || !scrapingUrl}
                           className="px-6 h-12 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-40"
                         >
                            {isLoading ? <Loader2 className="animate-spin" size={18}/> : 'Scrape'}
                         </button>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold px-2">Free plan allows 3 scaped URLs. Pro plan is unlimited.</p>
                   </div>

                   <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                      <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-300 bg-white px-2">OR FEED MANUAL CONTENT</div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                            <Edit3 size={18} />
                         </div>
                         <h3 className="font-black text-sm uppercase tracking-wider">Manual Batch</h3>
                      </div>
                      <textarea 
                        placeholder="Paste your product descriptions, pricing lists, or FAQs here..." 
                        className="w-full h-40 p-6 bg-gray-50 border-none rounded-[2rem] outline-none ring-primary/10 focus:ring-4 transition-all text-sm leading-relaxed"
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                      />
                      <button 
                        onClick={handleAddText}
                        disabled={!manualText}
                        className="w-full h-12 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                         Add to Knowledge Base
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: any, label: string, count?: number }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 border-2 ${
        active 
          ? 'bg-white border-primary text-primary shadow-xl shadow-primary/5 z-10' 
          : 'bg-transparent border-transparent text-gray-400 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-inherit'}`}>
        {icon}
      </div>
      <span className="flex-1 text-left text-sm font-black tracking-tight">{label}</span>
      {count !== undefined && count > 0 && (
         <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${active ? 'bg-primary text-white' : 'bg-red-400 text-white'}`}>
           {count}
         </div>
      )}
    </button>
  );
}

function Stat({ label, value, icon }: { label: string, value: any, icon: any }) {
  return (
    <div className="flex items-center gap-3 p-1">
       <div className="shrink-0">{icon}</div>
       <div className="leading-tight">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
          <div className="text-sm font-black text-gray-900">{value}</div>
       </div>
    </div>
  );
}

function SendPreviewIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
