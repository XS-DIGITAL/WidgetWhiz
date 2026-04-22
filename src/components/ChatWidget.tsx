import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, Star, Calendar, Headset, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWidget({ botId, isEmbedded = false }: { botId?: string, isEmbedded?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string>(() => {
    const saved = localStorage.getItem('ww_visitor_id');
    if (saved) return saved;
    const newId = crypto.randomUUID();
    localStorage.setItem('ww_visitor_id', newId);
    return newId;
  });
  const [botConfig, setBotConfig] = useState<{ 
    name: string, 
    color: string, 
    welcomeMessage: string, 
    showPopup: boolean, 
    popupMessage: string,
    logo?: string,
    enableBooking?: boolean,
    bookingParameters?: string[],
    humanAgentOnline?: boolean,
    enableNotifySound?: boolean
  } | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'human', content: string, isBooking?: boolean, bookingFields?: string[], createdAt?: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [bookingForm, setBookingForm] = useState<Record<string, string>>({});
  const [isHumanRequested, setIsHumanRequested] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pageContext, setPageContext] = useState<{ title: string, url: string, content: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PAGE_CONTEXT') {
        setPageContext(event.data.context);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  }, []);

  useEffect(() => {
    if (isEmbedded) {
      window.parent.postMessage({ type: 'WIDGET_STATE', isOpen }, '*');
    }
  }, [isOpen, isEmbedded]);

  const syncChat = useCallback(async () => {
    if (!botId) return;
    try {
      // Sync session
      const syncRes = await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, visitorId })
      });
      const session = await syncRes.json();
      if (session._id) {
        setSessionId(session._id);
        setIsHumanRequested(session.isHumanSupport);
        
        // Fetch messages
        const msgRes = await fetch(`/api/sessions/${session._id}/messages`);
        const remoteMessages = await msgRes.json();
        
        if (remoteMessages.length > messages.length) {
          const lastMsg = remoteMessages[remoteMessages.length - 1];
          if ((lastMsg.role === 'human' || lastMsg.role === 'assistant') && !isMuted && botConfig?.enableNotifySound) {
            notificationSound.current?.play().catch(() => {});
          }
          setMessages(remoteMessages);
        } else if (remoteMessages.length === 0 && botConfig) {
          setMessages([{ role: 'assistant', content: botConfig.welcomeMessage }]);
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  }, [botId, visitorId, messages.length, isMuted, botConfig]);

  useEffect(() => {
    if (botId) {
      fetch(`/api/public/bots/${botId}`)
        .then(res => res.json())
        .then(bot => {
          if (bot && !bot.error) {
            setBotConfig({
              name: bot.name,
              color: bot.color,
              welcomeMessage: bot.welcomeMessage,
              showPopup: bot.showPopup ?? true,
              popupMessage: bot.popupMessage || 'Hi there! How can we help?',
              logo: bot.logo,
              enableBooking: bot.enableBooking,
              bookingParameters: bot.bookingParameters,
              humanAgentOnline: bot.humanAgentOnline,
              enableNotifySound: bot.enableNotifySound
            });
          }
        });
    }
  }, [botId]);

  useEffect(() => {
    if (sessionId && isOpen) {
      const interval = setInterval(syncChat, 4000);
      return () => clearInterval(interval);
    }
  }, [sessionId, isOpen, syncChat]);

  useEffect(() => {
    if (botId && !sessionId) {
      syncChat();
    }
  }, [botId, sessionId, syncChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
        body: JSON.stringify({ 
          prompt: userMsg, 
          botId, 
          sessionId, 
          visitorId,
          pageContext: pageContext 
        })
      });
      const data = await res.json();
      
      if (data.sessionId) setSessionId(data.sessionId);
      
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

  const requestHuman = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/request-human`, { method: 'POST' });
      if (res.ok) {
        setIsHumanRequested(true);
        syncChat();
      }
    } catch (err) {
      console.error(err);
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
    <div className={`${isEmbedded ? 'w-full h-full bg-transparent p-0' : 'fixed bottom-6 right-6 z-50 p-4'} flex flex-col items-end justify-end pointer-events-none`}>
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
                    <span className="text-white/70 text-[10px] font-medium uppercase tracking-wider">
                      {botConfig?.humanAgentOnline ? 'Agent Online' : 'AI Assistant'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/80 hover:text-white transition-colors">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-main relative">
              {showRating ? (
                <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-8 text-center">
                  <h3 className="text-lg font-bold mb-2">How was your experience?</h3>
                  <p className="text-sm text-text-muted mb-6">Your feedback helps us improve!</p>
                  <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => handleRate(star)} className="p-2 hover:scale-110 transition-transform text-yellow-400">
                        <Star size={32} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setIsOpen(false); setShowRating(false); }} className="text-xs text-text-muted hover:underline">Skip rating</button>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.role === 'human' && <span className="text-[9px] font-bold text-orange-500 uppercase ml-1 mb-1 tracking-tighter italic">Live Agent</span>}
                      <div className={`max-w-[85%] p-3 rounded-xl text-[13px] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/10' 
                          : msg.role === 'human' 
                            ? 'bg-orange-500 text-white rounded-bl-none shadow-md shadow-orange-500/10'
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
                            <button type="submit" className="w-full bg-primary text-white text-[11px] font-bold py-2 rounded hover:opacity-90 transition-opacity">Confirm Booking</button>
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
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer / CTA */}
            <div className="p-4 bg-white border-t border-border-main">
              {botConfig?.humanAgentOnline && !isHumanRequested && !showRating && (
                <button 
                  onClick={requestHuman}
                  className="mb-3 w-full flex items-center justify-center gap-2 py-2 px-4 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold border border-orange-100 hover:bg-orange-100 transition-colors"
                >
                  <Headset size={14} /> Request Human Agent Help
                </button>
              )}
              
              {isHumanRequested && !showRating && (
                <div className="mb-3 text-[10px] font-bold text-success flex items-center gap-1.5 justify-center bg-success/5 py-1 rounded">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  HUMAN AGENT ALERTED. FEEL FREE TO LEAVE A MESSAGE.
                </div>
              )}

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
                  className="absolute right-1.5 top-1.5 w-8 h-8 text-white rounded-md flex items-center justify-center hover:opacity-90 transition-colors disabled:opacity-50 shadow-sm"
                  style={{ backgroundColor: botConfig?.color || '#2563eb' }}
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[10px] text-text-muted text-center mt-2">
                Powered by <span className="font-bold" style={{ color: botConfig?.color || '#2563eb' }}>WidgetWhiz</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <AnimatePresence>
          {!isOpen && botConfig?.showPopup && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute bottom-full right-0 mb-4 bg-white border border-border-main shadow-xl p-3 rounded-2xl rounded-br-none min-w-[180px] max-w-[220px] pointer-events-auto"
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
          {isOpen ? (
            <X size={24} />
          ) : (
            botConfig?.logo ? (
              <img src={botConfig.logo} alt="Logo" className="w-8 h-8 object-cover rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <MessageSquare size={24} />
            )
          )}
          
          {!isOpen && botConfig?.humanAgentOnline && (
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-orange-500 border-2 border-white rounded-full shadow-sm flex items-center justify-center">
              <Headset size={10} className="text-white" />
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
