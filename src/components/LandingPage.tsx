import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { 
  Bot, 
  Globe, 
  Database, 
  Code, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3,
  MousePointer2,
  Cpu,
  Layers,
  ChevronRight,
  ChevronLeft,
  Send,
  Headset
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  // Scroll logic for steps section
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(stepsProgress, "change", (latest) => {
    if (latest < 0.2) setActiveStep(0);
    else if (latest < 0.45) setActiveStep(1);
    else if (latest < 0.7) setActiveStep(2);
    else setActiveStep(3);
  });

  // Playground state
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundMessages, setPlaygroundMessages] = useState<{role: 'user' | 'bot', content: string}[]>([]);
  const [isPlaygroundThinking, setIsPlaygroundThinking] = useState(false);
  const playgroundEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  const scrollToBottom = () => {
    playgroundEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    if (isMounted.current && playgroundMessages.length > 0) {
      scrollToBottom();
    }
    isMounted.current = true;
  }, [playgroundMessages]);

  const handlePlaygroundSend = async (text?: string) => {
    const rawMessage = text || playgroundInput;
    if (!rawMessage || !rawMessage.trim() || isPlaygroundThinking) return;

    const userMsg = { role: 'user' as const, content: rawMessage.trim() };
    setPlaygroundMessages(prev => [...prev, userMsg]);
    setPlaygroundInput('');
    setIsPlaygroundThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `You are the WidgetWhiz demo bot. Answer concisely as the salesperson for WidgetWhiz. 
          Context: WidgetWhiz is an AI Chatbot platform (Free: 2 bots, 3 scaped pages; Pro: $5/mo, 10 bots, unlimited).
          User: ${rawMessage.trim()}`
        })
      });
      
      const data = await res.json();
      const botContent = data.choices?.[0]?.message?.content || "I'm having trouble connecting to my brain right now. Please try again!";
      
      setPlaygroundMessages(prev => [...prev, { role: 'bot' as const, content: botContent }]);
    } catch (err) {
      console.error('Playground Error:', err);
      setPlaygroundMessages(prev => [...prev, { role: 'bot' as const, content: "Sorry, I ran into an error connecting to the service. Please try again later." }]);
    } finally {
      setIsPlaygroundThinking(false);
    }
  };

  // Steps for the "How it works" visualizer
  const steps = [
    {
      id: 'scrape',
      title: 'Extract Knowledge',
      desc: 'Point WidgetWhiz at any URL. Our agent scans, cleans, and indexes the content instantly.',
      icon: <Globe className="text-blue-500" />,
      visual: (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
          <motion.div 
            initial={{ width: '60%' }}
            animate={{ width: activeStep === 0 ? '70%' : '60%' }}
            className="bg-white rounded-lg shadow-xl p-4 w-[70%] border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 h-4 bg-gray-100 rounded-md mx-2 text-[8px] flex items-center px-2 text-gray-400">https://your-docs.com</div>
            </div>
            <div className="space-y-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: activeStep === 0 ? '100% ' : '100%' }}
                className="h-2 bg-gray-100 rounded"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: activeStep === 0 ? '80%' : '80%' }}
                className="h-2 bg-gray-100 rounded"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: activeStep === 0 ? '90%' : '90%' }}
                className="h-2 bg-gray-100 rounded"
              />
            </div>
            {activeStep === 0 && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="bg-primary text-white p-3 rounded-full shadow-lg pulse-animation">
                  <Bot size={24} />
                </div>
              </motion.div>
            )}
          </motion.div>
          <AnimatePresence>
            {activeStep === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute bottom-10 right-10 bg-white border border-primary/20 shadow-lg p-3 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold uppercase text-primary">Live Scraping</span>
                </div>
                <div className="text-[10px] text-gray-500">Extracting 452 knowledge points...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    },
    {
      id: 'train',
      title: 'AI Synthesis',
      desc: 'Our Gemini-powered engine summarizes and chunks data to ensure the bot answers with surgical precision.',
      icon: <Cpu className="text-purple-500" />,
      visual: (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-2xl p-8 relative">
           <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />
          </div>
          <div className="grid grid-cols-4 gap-4 w-full">
            {[...Array(8)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: activeStep === 1 ? [0.3, 1, 0.3] : 0.2,
                  scale: activeStep === 1 ? 1 : 0.8
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                className="h-16 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400"
              >
                <Database size={20} />
              </motion.div>
            ))}
          </div>
          <motion.div 
             animate={{ 
               y: [0, -10, 0],
               rotate: [0, 5, -5, 0]
             }}
             transition={{ duration: 4, repeat: Infinity }}
             className="absolute bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-2 border border-purple-100"
          >
             <Sparkles className="text-purple-500" size={32} />
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Processing</div>
             <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                 animate={{ x: [-100, 100] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
                 className="h-full w-12 bg-purple-500"
               />
             </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 'embed',
      title: 'Zero-Code Embed',
      desc: 'Copy a single line of script and drop it into your React, Next.js, or HTML site. No backend needed.',
      icon: <Code className="text-green-500" />,
      visual: (
        <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E] rounded-2xl border border-white/10 p-6">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="text-xs font-mono text-gray-500">index.html</div>
              <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400">HTML</div>
            </div>
            <pre className="text-sm font-mono leading-relaxed text-gray-300">
              <code>
                {`<html>\n  <head>\n    <title>My App</title>\n    `}
                <motion.span 
                  initial={{ background: 'transparent' }}
                  animate={{ background: activeStep === 2 ? '#3b82f644' : 'transparent' }}
                  className="rounded px-1"
                >
                  {`<script src="https://widget-whiz.vercel.app/widget.js" />`}
                </motion.span>
                {` \n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>`}
              </code>
            </pre>
            <motion.div 
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: activeStep === 2 ? 1 : 0 }}
               className="bg-primary/20 text-primary border border-primary/30 p-3 rounded-lg flex items-center justify-between"
            >
               <span className="text-xs font-bold">Copy Component Code</span>
               <CheckCircle2 size={16} />
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: 'live',
      title: 'Human-Like Support',
      desc: 'Your bot provides sub-second responses with the exact personality and tone of your brand.',
      icon: <MessageSquare className="text-orange-500" />,
      visual: (
        <div className="w-full h-full bg-slate-100 rounded-2xl relative overflow-hidden flex items-end justify-end p-4">
           {/* Background "Site" */}
           <div className="absolute inset-x-6 top-6 bottom-0 bg-white shadow-lg rounded-t-xl overflow-hidden border border-gray-200">
             <div className="h-12 bg-gray-50 border-b p-4 flex items-center gap-4">
               <div className="w-20 h-3 bg-gray-200 rounded" />
               <div className="flex-1" />
               <div className="w-12 h-3 bg-gray-200 rounded" />
             </div>
             <div className="p-8 space-y-4">
               <div className="w-[60%] h-8 bg-gray-100 rounded" />
               <div className="w-full h-4 bg-gray-50 rounded" />
               <div className="w-[90%] h-4 bg-gray-50 rounded" />
             </div>
           </div>

           {/* The Widget */}
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="relative z-10 w-72 h-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
           >
              <div className="bg-primary p-4 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold">WidgetWhiz Assistant</div>
                  <div className="text-[10px] opacity-80">Online & Ready</div>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                 <div className="bg-gray-100 rounded-2xl p-3 text-[11px] max-w-[80%]">
                   Hi! How can I help you today?
                 </div>
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 1 }}
                   className="bg-primary/10 text-primary rounded-2xl p-3 text-[11px] max-w-[80%] ml-auto"
                 >
                   What features are in the Pro plan?
                 </motion.div>
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 2.5 }}
                   className="bg-gray-100 rounded-2xl p-3 text-[11px] max-w-[90%]"
                 >
                   The Pro plan includes 10 bots, unlimited scraping, and no watermark on the widget. Would you like to start a trial?
                 </motion.div>
              </div>
              <div className="p-3 border-t border-gray-100">
                <div className="h-8 bg-gray-50 rounded-full border px-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Type a message...</span>
                  <Send size={12} className="text-primary" />
                </div>
              </div>
           </motion.div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white min-h-screen text-text-main" ref={containerRef}>
      <Helmet>
        <title>WidgetWhiz - Effortless AI Chatbots for Your Website</title>
        <meta name="description" content="Build and deploy custom AI chatbots in seconds. WidgetWhiz scrapes your website, learns your business, and helps you 10x your customer engagement." />
        <meta name="keywords" content="WidgetWhiz, AI Chatbot, Website Chatbot, Customer Support Automation, AI Widget, Widget Whiz" />
        <meta property="og:title" content="WidgetWhiz | AI Chatbot Builder" />
        <meta property="og:description" content="Transform your customer support with WidgetWhiz. Our AI scrapes your site and builds a custom chatbot widget. Start for free." />
        <meta property="og:image" content="https://i.ibb.co/nqFJM9tw/22-04-2026-01-21-11-REC.png" />
        <meta property="twitter:title" content="WidgetWhiz | AI Chatbot Builder" />
        <meta property="twitter:description" content="Transform your customer support with WidgetWhiz. Our AI scrapes your site and builds a custom chatbot widget." />
        <meta property="twitter:image" content="https://i.ibb.co/nqFJM9tw/22-04-2026-01-21-11-REC.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "WidgetWhiz",
            "operatingSystem": "Web",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "5.00",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "124"
            },
            "description": "Effortless AI Chatbots for Your Website. Scrape, learn, and deploy in seconds. WidgetWhiz helps you automate customer support and 10x engagement."
          })}
        </script>
      </Helmet>
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-[100] px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="text-white" size={20} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-primary">WidgetWhiz</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-text-muted">
          <a href="#demo" className="hover:text-primary transition-colors">How it Works</a>
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <button onClick={() => navigate('/dashboard')} className="btn-primary py-2 px-6">
            {token ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>
        <button className="md:hidden p-2"><Layers size={20} /></button>
      </nav>

      {/* Section 1: Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 translate-x-1/4 -translate-y-1/2 opacity-20">
           <svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
             <circle cx="300" cy="300" r="300" fill="url(#paint0_radial_hero)" />
             <defs>
               <radialGradient id="paint0_radial_hero" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(300 300) rotate(90) scale(300)">
                 <stop stopColor="#3b82f6" />
                 <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
               </radialGradient>
             </defs>
           </svg>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            style={{ y: heroY }}
            className="flex-1 space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
              <Zap size={12} />
              Introducing AI-First Knowledge Automation
            </div>
            <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tight">
              AI CHATBOT <br />
              FOR YOUR SITE <br />
              <span className="text-primary italic">ON AUTOPILOT.</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-xl leading-relaxed">
              Scrape your docs. Train your AI. Embed your bot. In under 60 seconds, 
              WidgetWhiz builds sub-second AI agents that actually know your business.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-primary text-base py-4 px-8 flex items-center gap-3 shadow-xl shadow-primary/30 group"
              >
                {token ? 'Go to Dashboard' : 'Launch Your First Bot'} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-outline text-base border-2 py-4 px-8 font-bold">
                View Live Cases
              </button>
            </div>
            <div className="flex items-center gap-8 pt-8">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <img 
                    key={i} 
                    src={`https://picsum.photos/seed/user${i}/100/100`} 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    alt={`WidgetWhiz Customer ${i}`}
                   />
                 ))}
               </div>
               <div className="text-xs text-gray-400 font-medium">
                 Joined by over <span className="text-text-main font-bold">2,400+</span> webmasters worldwide.
               </div>
            </div>
          </motion.div>

          <div className="flex-1 w-full relative">
             <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative aspect-square md:aspect-auto md:h-[600px] w-full bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden p-4"
             >
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-white/50 backdrop-blur rounded-full px-3 py-1 border border-white/20 text-[10px] font-bold text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> System Active
                  </div>
                </div>
                <div className="h-full flex flex-col justify-center gap-4 relative">
                   <div className="space-y-4">
                      <div className="card w-full max-w-sm ml-auto mr-12 rotate-2 shadow-2xl">
                         <div className="card-header flex items-center justify-between">
                            <span className="text-xs">Knowledge Pulse</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                         </div>
                         <div className="card-body py-3">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                 <Globe size={16} className="text-primary" />
                               </div>
                               <div className="flex-1 h-3 bg-gray-100 rounded" />
                               <div className="w-8 h-3 bg-gray-100 rounded" />
                            </div>
                         </div>
                      </div>
                      <div className="card w-full max-w-xs -ml-4 -rotate-3 shadow-2xl relative z-10 border-primary/20">
                         <div className="card-header bg-primary/5 border-b-primary/10">
                            <span className="text-xs text-primary font-bold">Generated Result</span>
                         </div>
                         <div className="card-body py-4 space-y-2">
                            <div className="w-full h-2 bg-gray-100 rounded" />
                            <div className="w-[80%] h-2 bg-gray-100 rounded" />
                            <div className="w-[40%] h-2 bg-primary/20 rounded" />
                         </div>
                      </div>
                      <div className="absolute right-10 bottom-20">
                        <motion.div 
                          animate={{ y: [0, -20, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 w-48"
                        >
                           <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Bot size={12} className="text-white" />
                              </div>
                              <div className="w-20 h-2 bg-gray-100 rounded" />
                           </div>
                           <div className="space-y-1.5">
                              <div className="w-full h-1.5 bg-gray-100 rounded" />
                              <div className="w-full h-1.5 bg-gray-100 rounded" />
                              <div className="w-[60%] h-1.5 bg-gray-100 rounded" />
                           </div>
                        </motion.div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: How it Works (The Visualizer) */}
      <section id="demo" ref={stepsRef} style={{ height: '600vh' }} className="relative bg-gray-50/50 border-y border-gray-100">
        <div className="sticky top-16 h-[calc(100vh-64px)] w-full flex flex-col justify-center overflow-visible z-10">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="text-center space-y-4 mb-4 md:mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight italic">
                FOUR STEPS. <br/> <span className="text-primary not-italic">INFINITY IMPACT.</span>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                Stop hiring support teams for generic questions. Automate the baseline and 
                let your humans solve the complex puzzles.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
              {/* Visual Stage */}
              <div className="aspect-[4/3] relative w-full h-full lg:h-[450px]">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full h-full"
                  >
                    {steps[activeStep].visual}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step Selection (Original UI) */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`w-full text-left p-5 rounded-2xl transition-all duration-500 border-2 ${
                      activeStep === index 
                      ? 'bg-white border-primary shadow-xl scale-[1.05] z-10' 
                      : 'bg-transparent border-transparent grayscale opacity-40 hover:opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeStep === index ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-400'}`}>
                          {step.icon}
                       </div>
                       <div>
                         <h3 className={`font-black tracking-tight transition-colors mb-0.5 ${activeStep === index ? 'text-text-main text-lg' : 'text-text-muted text-base'}`}>
                            {index + 1}. {step.title}
                         </h3>
                         <p className={`text-xs leading-relaxed transition-colors ${activeStep === index ? 'text-gray-500' : 'text-gray-400'}`}>
                            {step.desc}
                         </p>
                       </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Features Bento */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black">FEATURE RICH. <br/><span className="text-gray-400">FUTURE PROOF.</span></h2>
              <p className="text-gray-500 max-w-md">Every detail crafted to reduce friction in your AI journey.</p>
            </div>
            <button className="btn-outline flex items-center gap-2 font-bold py-3 px-6 rounded-full border-gray-200">
               Explore Documentation <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             <div className="md:col-span-8 bg-black rounded-3xl p-10 text-white overflow-hidden relative group">
                <div className="relative z-10 space-y-4 max-w-sm">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                      <Sparkles size={24} />
                   </div>
                   <h3 className="text-3xl font-black">Advanced AI Summarization</h3>
                   <p className="text-gray-400 text-sm leading-relaxed">
                      Don't just upload text. Our engine understands context, removes fluff, and prioritizes 
                      key information for every customer query.
                   </p>
                </div>
                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                   <div className="w-96 h-96 border-[40px] border-primary rounded-full" />
                </div>
             </div>
             
             <div className="md:col-span-4 bg-orange-50 rounded-3xl p-10 relative overflow-hidden group border border-orange-100">
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                      <Headset size={24} />
                   </div>
                   <h3 className="text-2xl font-black">Human Takeover</h3>
                   <p className="text-gray-600 text-sm">AI handles the routine, but humans can jump in anytime. Seamlessly transition complex queries to your support team.</p>
                </div>
                <div className="mt-8 flex gap-1">
                   {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-orange-200 animate-pulse" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
             </div>

             <div className="md:col-span-4 bg-primary rounded-3xl p-10 text-white">
                <div className="space-y-4 h-full flex flex-col">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                      <BarChart3 size={24} />
                   </div>
                   <h3 className="text-2xl font-black">Performance Analytics</h3>
                   <p className="text-white/80 text-sm flex-1">Track satisfaction, response times, and chat volume live.</p>
                   <div className="pt-8 h-20 flex items-end gap-1">
                      {[4, 2, 5, 3, 6, 4, 7].map((h, i) => (
                        <div key={i} className="bg-white/30 flex-1 rounded-t" style={{ height: `${h * 10}%` }} />
                      ))}
                   </div>
                </div>
             </div>

             <div className="md:col-span-8 bg-gray-900 rounded-3xl p-10 text-white relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                   <div className="flex-1 space-y-4">
                      <h3 className="text-3xl font-black">Seamless Widget Personalization</h3>
                      <p className="text-gray-400 text-sm">Match your brand perfectly with custom logos, themes, and online statuses.</p>
                   </div>
                   <div className="flex-1 bg-white/5 p-2 rounded-2xl border border-white/10">
                      <div className="h-40 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                         <div className="p-3 bg-white rounded-full shadow-lg text-primary">
                            <Bot size={32} />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Section 4: Live Chat Experience Playground */}
      <section className="py-32 bg-primary/5">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic">TRY BEFORE <span className="text-primary not-italic">YOU BUY.</span></h2>
            <p className="text-gray-500">Ask WidgetWhiz (our own bot) anything about how it works.</p>
          </div>
          
          <div className="max-w-2xl mx-auto h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden text-left">
              <div className="bg-primary p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">WidgetWhiz Assistant</h4>
                    <div className="flex items-center gap-1.5 opacity-80 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Online
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-gray-50/30">
                 {playgroundMessages.length === 0 && (
                   <div className="bg-white rounded-2xl rounded-tl-none p-4 text-sm shadow-sm border border-gray-100 max-w-[85%] leading-relaxed">
                     Hello! I'm the WidgetWhiz demo assistant. I've been trained on my own documentation. What would you like to know?
                   </div>
                 )}
                 
                 {playgroundMessages.map((msg, i) => (
                   <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${msg.role === 'user' ? 'bg-primary text-white ml-auto rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none shadow-sm'} rounded-2xl p-4 text-sm max-w-[85%] leading-relaxed`}
                   >
                     {msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()}
                   </motion.div>
                 ))}

                 {isPlaygroundThinking && (
                   <div className="flex items-center gap-1 p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-gray-100 w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                   </div>
                 )}
                 <div ref={playgroundEndRef} />
              </div>
              <div className="p-4 bg-white space-y-4">
                 <div className="flex flex-wrap gap-2">
                    {['Pricing plans?', 'How to embed?', 'Is it secure?'].map(q => (
                      <button 
                        key={q} 
                        onClick={() => handlePlaygroundSend(q)}
                        disabled={isPlaygroundThinking}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                 </div>
                 <div className="h-12 bg-gray-50 rounded-2xl px-4 flex items-center border border-gray-200 gap-4 group-focus-within:border-primary transition-colors">
                    <input 
                      type="text" 
                      placeholder="Ask about features, setup, security..." 
                      className="flex-1 bg-transparent text-sm outline-none"
                      value={playgroundInput}
                      onChange={(e) => setPlaygroundInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePlaygroundSend()}
                      disabled={isPlaygroundThinking}
                    />
                    <button 
                      onClick={() => handlePlaygroundSend()}
                      disabled={isPlaygroundThinking}
                      className="text-primary p-2 hover:scale-110 transition-transform disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                 </div>
              </div>
          </div>
        </div>
      </section>

      {/* Section 5: Trust / Testimonials */}
      <section className="py-32 px-6 bg-white overflow-hidden relative">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
               <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-5xl font-black leading-tight">TRUSTED BY <br/><span className="text-primary italic">BUILDERS.</span></h2>
                    <p className="text-gray-500 text-lg leading-relaxed lowercase">
                      "WE USED TO SPEND HOURS ON LIVE CHAT REPEATING THE SAME DOCS. NOW WIDGETWHIZ DOES IT FOR US WITH 98% ACCURACY. OUR NPS HAS NEVER BEEN HIGHER."
                    </p>
                  </div>
                  <div>
                    <div className="font-black text-xl mb-1 uppercase tracking-tighter">Alex Chen</div>
                    <div className="text-primary text-xs font-bold uppercase tracking-widest">Head of Growth, DevScale</div>
                  </div>
                  <div className="flex gap-4">
                     <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"><ChevronLeft size={20}/></button>
                     <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-primary"><ChevronRight size={20}/></button>
                  </div>
               </div>
               <div className="relative">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-4 mt-12">
                        <img src="https://picsum.photos/seed/tech1/400/500" referrerPolicy="no-referrer" className="rounded-3xl w-full h-64 object-cover grayscale" alt="WidgetWhiz Success Story 1" />
                        <img src="https://picsum.photos/seed/tech2/400/300" referrerPolicy="no-referrer" className="rounded-3xl w-full h-48 object-cover grayscale" alt="WidgetWhiz Success Story 2" />
                     </div>
                     <div className="space-y-4">
                        <img src="https://picsum.photos/seed/tech3/400/300" referrerPolicy="no-referrer" className="rounded-3xl w-full h-48 object-cover grayscale" alt="WidgetWhiz Success Story 3" />
                        <img src="https://picsum.photos/seed/tech4/400/500" referrerPolicy="no-referrer" className="rounded-3xl w-full h-64 object-cover grayscale" alt="WidgetWhiz Success Story 4" />
                     </div>
                  </div>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
               </div>
            </div>
         </div>
      </section>

      {/* Section 6: Pricing */}
      <section id="pricing" className="py-32 px-6 bg-gray-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black tracking-tighter">FAIR PRICING. <span className="text-primary italic">SCALABLE POWER.</span></h2>
            <p className="text-gray-500">Choose the plan that fits your current needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col">
                <div className="mb-8">
                   <h3 className="text-xl font-bold mb-2">Free Starter</h3>
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$0</span>
                      <span className="text-gray-400 text-sm">/mo</span>
                   </div>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                   {['2 AI Bots', '3 Scraped Pages', 'Standard AI Support', 'Community Access'].map(f => (
                     <li key={f} className="flex items-center gap-3 text-sm text-gray-500">
                       <CheckCircle2 size={18} className="text-green-500" /> {f}
                     </li>
                   ))}
                </ul>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-outline w-full py-4 text-base font-bold"
                >
                  Get Started Free
                </button>
             </div>

             <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl ring-2 ring-primary relative flex flex-col overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase py-1 px-4 rounded-bl-xl tracking-widest">
                   Best Value
                </div>
                <div className="mb-8">
                   <h3 className="text-xl font-bold mb-2">Pro Power</h3>
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$5</span>
                      <span className="text-gray-400 text-sm">/mo</span>
                   </div>
                </div>
                <ul className="space-y-4 mb-10 flex-1 text-text-main">
                   {[
                     '10 AI Bots', 
                     'Unlimited Scraped Pages', 
                     'Gemini Ultra Integration', 
                     'White-label (No Watermark)', 
                     'Advanced Analytics',
                     'Custom Script Parameters'
                   ].map(f => (
                     <li key={f} className="flex items-center gap-3 text-sm font-medium">
                       <CheckCircle2 size={18} className="text-primary" /> {f}
                     </li>
                   ))}
                </ul>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary w-full py-4 text-base shadow-xl shadow-primary/20"
                >
                  Upgrade to Pro
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Section 7: Final CTA & Footer */}
      <section className="py-40 bg-white px-6 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.05),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(168,85,247,0.05),transparent_40%)]" />
         <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
            <h2 className="text-7xl md:text-9xl font-black leading-[0.8] tracking-tighter">
               READY TO <br/><span className="text-primary italic">WHIZ?</span>
            </h2>
            <div className="space-y-8">
               <p className="text-xl text-gray-500 max-w-xl mx-auto">
                  Join 2,400+ companies automating their customer success today.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary py-5 px-10 text-lg shadow-2xl scale-110"
                  >
                    {token ? 'Go to Dashboard' : "Get Started Now — It's Free"}
                  </button>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                     <div className="flex items-center gap-1.5"><Shield size={14} /> Secure</div>
                     <div className="flex items-center gap-1.5"><Zap size={14} /> Instant</div>
                  </div>
               </div>
            </div>
         </div>

         <footer className="mt-40 pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 text-gray-400 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                <Bot className="text-primary" size={14} />
              </div>
              <span className="font-bold text-text-main text-sm">WidgetWhiz.</span>
            </div>
            <div className="flex gap-8">
               <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
               <a href="#" className="hover:text-primary transition-colors">Status</a>
            </div>
            <div>© 2024 WidgetWhiz. All rights reserved.</div>
         </footer>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }
        .pulse-animation {
          animation: pulse 2s infinite ease-in-out;
        }
        .bg-grid-slate-100 {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(15 23 42 / 0.04)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
        }
        .section-visible-grid {
           background-image: radial-gradient(circle at 1px 1px, #e4e4e7 1px, transparent 0);
           background-size: 40px 40px;
        }
      `}} />
    </div>
  );
}
