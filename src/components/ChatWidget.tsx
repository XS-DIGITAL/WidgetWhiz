import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWidget({ botId, isEmbedded = false }: { botId?: string, isEmbedded?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [botConfig, setBotConfig] = useState<{ 
    name: string, 
    color: string, 
    welcomeMessage: string, 
    showPopup: boolean, 
    popupMessage: string,
    logo?: string,
    enableBooking?: boolean,
    bookingParameters?: string[]
  } | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, isBooking?: boolean, bookingFields?: string[] }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [bookingForm, setBookingForm] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEmbedded) {
      window.parent.postMessage({ type: 'WIDGET_STATE', isOpen }, '*');
    }
  }, [isOpen, isEmbedded]);

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
              welcomeMessage: bot.welcomeMessage,
              showPopup: bot.showPopup ?? true,
              popupMessage: bot.popupMessage || 'Hi there! How can we help?',
              logo: bot.logo,
              enableBooking: bot.enableBooking,
              bookingParameters: bot.bookingParameters
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
        body: JSON.stringify({ prompt: userMsg, botId, sessionId })
      });
      const data = await res.json();
      
      if (data.sessionId) setSessionId(data.sessionId);
      
      // Extract content from Xon AI response
      let aiContent = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
      
      const isBooking = aiContent.includes('[BOOKING_REQUEST]');
      let bookingFields: string[] = [];
      if (isBooking) {
        const match = aiContent.match(/\[BOOKING_REQUEST\]\s*(.*)/);
        if (match && match[1]) {
          bookingFields = match[1].split(',').map((s: string) => s.trim());
        }
        aiContent = aiContent.replace(/\[BOOKING_REQUEST\].*/, 'Please fill out the booking details below:');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent, isBooking, bookingFields }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      setShowRating(false);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessages(prev => [...prev, { role: 'user', content: `Booking Details: ${Object.entries(bookingForm).map(([k, v]) => `${k}: ${v}`).join(', ')}` }]);
    setMessages(prev => [...prev, { role: 'assistant', content: "Thank you! Your booking request has been received. We'll get back to you shortly." }]);
    setBookingForm({});
  };

  const handleClose = () => {
    if (messages.length > 1 && sessionId && !showRating) {
      setShowRating(true);
    } else {
      setIsOpen(false);
      setShowRating(false);
    }
  };

  return (
    <div className={`${isEmbedded ? 'w-full h-full' : 'fixed bottom-6 right-6 z-50'} flex flex-col items-end justify-end p-4 pointer-events-none`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-full max-w-[380px] h-[520px] bg-white shadow-2xl flex flex-col overflow-hidden mb-4 border border-border-main rounded-xl pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center" style={{ backgroundColor: botConfig?.color || '#2563eb' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
                  {botConfig?.logo ? (
                    <img src={botConfig.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Bot className="text-white" size={18} />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{botConfig?.name || 'WidgetWhiz Assistant'}</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-main relative">
              {showRating ? (
                <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-8 text-center">
                  <h3 className="text-lg font-bold mb-2">How was your experience?</h3>
                  <p className="text-sm text-text-muted mb-6">Your feedback helps us improve!</p>
                  <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => handleRate(star)}
                        className="p-2 hover:scale-110 transition-transform text-yellow-400"
                      >
                        <Star size={32} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => { setIsOpen(false); setShowRating(false); }}
                    className="text-xs text-text-muted hover:underline"
                  >
                    Skip rating
                  </button>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-[13px] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-white text-text-main border border-border-main rounded-bl-none shadow-sm'
                      }`}>
                        {msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()}
                        
                        {msg.isBooking && msg.bookingFields && (
                          <form onSubmit={handleBookingSubmit} className="mt-4 space-y-3 bg-bg-main p-3 rounded-lg border border-border-main">
                            <div className="flex items-center gap-2 mb-2 text-primary">
                              <Calendar size={14} />
                              <span className="text-[11px] font-bold uppercase">Booking Form</span>
                            </div>
                            {msg.bookingFields.map((field) => (
                              <div key={field}>
                                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">{field}</label>
                                <input 
                                  type="text" 
                                  required
                                  className="w-full bg-white border border-border-main rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  value={bookingForm[field] || ''}
                                  onChange={(e) => setBookingForm({ ...bookingForm, [field]: e.target.value })}
                                />
                              </div>
                            ))}
                            <button 
                              type="submit"
                              className="w-full bg-primary text-white text-[11px] font-bold py-2 rounded hover:opacity-90 transition-opacity"
                            >
                              Confirm Booking
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-xl rounded-bl-none border border-border-main shadow-sm w-[80%]">
                        <div className="space-y-2">
                          <div className="h-2.5 shimmer rounded w-3/4"></div>
                          <div className="h-2.5 shimmer rounded w-1/2"></div>
                          <div className="h-2.5 shimmer rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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

      <AnimatePresence>
        {!isOpen && botConfig?.showPopup && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="absolute bottom-20 right-0 mb-2 mr-2 bg-white border border-border-main shadow-xl p-3 rounded-2xl rounded-br-none max-w-[200px] pointer-events-auto"
          >
            <p className="text-xs font-medium text-text-main leading-tight">
              {botConfig.popupMessage}
            </p>
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-r border-b border-border-main rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white pointer-events-auto"
        style={{ 
          backgroundColor: botConfig?.color || '#2563eb',
          boxShadow: `0 10px 15px -3px ${botConfig?.color || '#2563eb'}4D` 
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        
        {/* Online Indicator */}
        {!isOpen && (
          <div className="absolute top-0 left-0 w-4 h-4 bg-success border-2 border-white rounded-full shadow-sm" />
        )}
      </motion.button>
    </div>
  );
}
