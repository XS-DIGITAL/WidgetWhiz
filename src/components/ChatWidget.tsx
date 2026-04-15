import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWidget({ botId }: { botId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [botConfig, setBotConfig] = useState<{ name: string, color: string, welcomeMessage: string } | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (botId) {
      // In a real app, this might be a public endpoint
      // For now, we fetch from our internal API if possible
      fetch(`/api/bots`)
        .then(res => res.json())
        .then(bots => {
          const bot = bots.find((b: any) => b._id === botId);
          if (bot) {
            setBotConfig({
              name: bot.name,
              color: bot.color,
              welcomeMessage: bot.welcomeMessage
            });
            setMessages([{ role: 'assistant', content: bot.welcomeMessage }]);
          } else {
            setMessages([{ role: 'assistant', content: 'Hello! How can I help you today?' }]);
          }
        })
        .catch(() => {
          setMessages([{ role: 'assistant', content: 'Hello! How can I help you today?' }]);
        });
    } else {
      setMessages([{ role: 'assistant', content: 'Hello! I am your WidgetWhiz assistant. How can I help you today?' }]);
    }
  }, [botId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.plan) setUserPlan(data.plan);
        })
        .catch(err => console.error(err));
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, botId })
      });
      const data = await res.json();
      
      // Extract content from Xon AI response
      const aiContent = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[380px] h-[520px] bg-white shadow-2xl flex flex-col overflow-hidden mb-4 border border-border-main rounded-xl"
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center" style={{ backgroundColor: botConfig?.color || '#2563eb' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot className="text-white" size={18} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{botConfig?.name || 'WidgetWhiz Assistant'}</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-main">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-[13px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-white text-text-main border border-border-main rounded-bl-none shadow-sm'
                  }`}>
                    {msg.content.includes('<think>') ? (
                      <div className="space-y-2">
                        <div className="text-[11px] text-text-muted italic bg-bg-main p-2 rounded border-l-2 border-primary/30">
                          {msg.content.match(/<think>([\s\S]*?)<\/think>/)?.[1]}
                        </div>
                        <div>{msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()}</div>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-xl rounded-bl-none border border-border-main shadow-sm w-[80%]">
                    <div className="animate-pulse space-y-2">
                      <div className="h-2 bg-bg-main rounded w-3/4"></div>
                      <div className="h-2 bg-bg-main rounded w-1/2"></div>
                      <div className="h-2 bg-bg-main rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-border-main">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full bg-bg-main border border-border-main rounded-lg py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 top-1.5 w-8 h-8 text-white rounded-md flex items-center justify-center hover:opacity-90 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: botConfig?.color || '#2563eb' }}
                >
                  <Send size={14} />
                </button>
              </div>
              {userPlan === 'free' && (
                <p className="text-[10px] text-text-muted text-center mt-2">
                  Powered by <span className="font-bold" style={{ color: botConfig?.color || '#2563eb' }}>WidgetWhiz</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ 
          backgroundColor: botConfig?.color || '#2563eb',
          boxShadow: `0 10px 15px -3px ${botConfig?.color || '#2563eb'}4D` 
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
