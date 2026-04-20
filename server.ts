import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import axios from "axios";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const upload = multer({ storage: multer.memoryStorage() });

// MongoDB Schemas
const KnowledgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  source: String, // 'text' or 'url'
  url: String,
  summary: String,
  botIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bot' }], // Knowledge can belong to multiple bots
  createdAt: { type: Date, default: Date.now }
});

const BotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  color: { type: String, default: '#2563eb' },
  welcomeMessage: { type: String, default: 'Hello! How can I help you today?' },
  showPopup: { type: Boolean, default: true },
  popupMessage: { type: String, default: 'Hi there! How can we help?' },
  enableBooking: { type: Boolean, default: false },
  bookingParameters: { type: [String], default: ['Name', 'Email', 'Date', 'Time'] },
  logo: String,
  knowledgeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Knowledge' }],
  createdAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: for logged in users
  role: { type: String, enum: ['user', 'assistant'] },
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  subscriptionId: String,
  planId: String,
  subscriptionStatus: String, // 'active', 'cancelled', 'expired'
  createdAt: { type: Date, default: Date.now }
});

const Knowledge = mongoose.model("Knowledge", KnowledgeSchema);
const Bot = mongoose.model("Bot", BotSchema);
const User = mongoose.model("User", UserSchema);
const Message = mongoose.model("Message", MessageSchema);
const Session = mongoose.model("Session", SessionSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to MongoDB (Non-blocking)
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, {
      dbName: 'widgetwhiz'
    }).then(() => {
      console.log("Connected to MongoDB (Database: widgetwhiz)");
    }).catch(err => {
      console.error("MongoDB connection error:", err);
    });
  }

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: "Forbidden: Admin only" });
    next();
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      // First user is admin
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'admin' : 'user';

      const user = await User.create({ email, password: hashedPassword, role });
      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET);
      res.json({ token, user: { email: user.email, role: user.role, plan: user.plan } });
    } catch (err) {
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET);
      res.json({ token, user: { email: user.email, role: user.role, plan: user.plan } });
    } catch (err) {
      res.status(500).json({ error: "Signin failed" });
    }
  });

  // User Routes
  app.get("/api/user/me", authenticate, async (req: any, res) => {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  });

  app.get("/api/knowledge", authenticate, async (req: any, res) => {
    const data = await Knowledge.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(data);
  });

  app.post("/api/knowledge", authenticate, async (req: any, res) => {
    const { content } = req.body;
    if (content) {
      const newItem = await Knowledge.create({ userId: req.userId, content, source: 'text' });
      res.json(newItem);
    } else {
      res.status(400).json({ error: "Content is required" });
    }
  });

  app.post("/api/scrape", authenticate, async (req: any, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const user = await User.findById(req.userId);
      if (user?.plan === 'free') {
        const urlCount = await Knowledge.countDocuments({ userId: req.userId, source: 'url' });
        if (urlCount >= 3) return res.status(403).json({ error: "Free plan limit reached" });
      }

      const response = await axios.get(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000 
      });
      const $ = cheerio.load(response.data);
      
      // Advanced Cleaning: Remove heavy elements that don't contribute to knowledge
      $('script, style, nav, footer, header, iframe, noscript, svg, .ads, #ads, aside, form, button').remove();
      
      const title = $('title').text() || $('h1').first().text() || $('meta[property="og:title"]').attr('content') || url;
      const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      
      // Get main content area with more heuristics
      let contentContainer: any = $('main');
      if (!contentContainer.length) contentContainer = $('article');
      if (!contentContainer.length) contentContainer = $('[role="main"]');
      if (!contentContainer.length) contentContainer = $('#content');
      if (!contentContainer.length) contentContainer = $('.content');
      if (!contentContainer.length) contentContainer = $('.post');
      if (!contentContainer.length) contentContainer = $('.main');
      if (!contentContainer.length) {
        // Fallback: Find the div with the most paragraphs
        let maxPs = 0;
        $('div').each((_, el) => {
          const ps = $(el).find('p').length;
          if (ps > maxPs) {
            maxPs = ps;
            contentContainer = $(el);
          }
        });
      }
      if (!contentContainer.length) contentContainer = $('body');
      
      // Extract structured text from paragraphs and headings
      let textParts: string[] = [];
      contentContainer.find('h1, h2, h3, h4, p, li').each((_, el) => {
        const t = $(el).text().trim();
        if (t.length > 20) textParts.push(t);
      });
      
      const combinedText = textParts.join('\n\n') || contentContainer.text();
      const cleanedText = combinedText.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
      
      const content = `Title: ${title}\nDescription: ${description}\nURL: ${url}\n\nContent:\n${cleanedText}`.substring(0, 15000);

      const newItem = await Knowledge.create({ userId: req.userId, content, source: 'url', url });
      res.json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Scraping failed" });
    }
  });

  app.get("/api/bots", authenticate, async (req: any, res) => {
    const data = await Bot.find({ userId: req.userId }).populate('knowledgeIds').sort({ createdAt: -1 });
    res.json(data);
  });

  app.patch("/api/bots/:id", authenticate, async (req: any, res) => {
    try {
      const updatedBot = await Bot.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true }
      );
      res.json(updatedBot);
    } catch (err) {
      res.status(500).json({ error: "Failed to update bot" });
    }
  });

  app.get("/api/bots/:id/analytics", authenticate, async (req: any, res) => {
    try {
      const sessions = await Session.find({ botId: req.params.id });
      const totalSessions = sessions.length;
      const ratedSessions = sessions.filter(s => s.rating);
      const avgRating = ratedSessions.length > 0 
        ? (ratedSessions.reduce((acc, s) => acc + (s.rating || 0), 0) / ratedSessions.length).toFixed(1)
        : "N/A";

      res.json({
        totalSessions,
        avgResponseTime: "1.2s",
        satisfaction: avgRating === "N/A" ? "N/A" : `${(Number(avgRating) / 5 * 100).toFixed(0)}%`
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/bots", authenticate, async (req: any, res) => {
    const { name, description } = req.body;
    try {
      const user = await User.findById(req.userId);
      if (user?.plan === 'free') {
        const botCount = await Bot.countDocuments({ userId: req.userId });
        if (botCount >= 2) return res.status(403).json({ error: "Free plan limit reached" });
      }
      const newBot = await Bot.create({ userId: req.userId, name, description });
      res.json(newBot);
    } catch (err) {
      res.status(500).json({ error: "Failed to create bot" });
    }
  });

  app.delete("/api/bots/:id", authenticate, async (req: any, res) => {
    try {
      await Bot.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete bot" });
    }
  });

  app.patch("/api/knowledge/:id", authenticate, async (req: any, res) => {
    try {
      const updatedKnowledge = await Knowledge.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true }
      );
      res.json(updatedKnowledge);
    } catch (err) {
      res.status(500).json({ error: "Failed to update knowledge" });
    }
  });

  app.delete("/api/knowledge/:id", authenticate, async (req: any, res) => {
    try {
      await Knowledge.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete knowledge" });
    }
  });

  // Admin Routes
  app.get("/api/admin/stats", authenticate, isAdmin, async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalBots = await Bot.countDocuments();
    const totalKnowledge = await Knowledge.countDocuments();
    const proUsers = await User.countDocuments({ plan: 'pro' });
    res.json({ totalUsers, totalBots, totalKnowledge, proUsers });
  });

  app.get("/api/admin/users", authenticate, isAdmin, async (req, res) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  });

  app.get("/api/admin/bots", authenticate, isAdmin, async (req, res) => {
    const bots = await Bot.find().populate('userId', 'email').sort({ createdAt: -1 });
    res.json(bots);
  });

  app.post("/api/sessions/:id/rate", async (req, res) => {
    const { rating } = req.body;
    try {
      await Session.findByIdAndUpdate(req.params.id, { rating });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to rate session" });
    }
  });

  app.get("/api/public/bots/:id", async (req, res) => {
    try {
      const bot = await Bot.findById(req.params.id).select("name color welcomeMessage showPopup popupMessage logo enableBooking bookingParameters");
      if (!bot) return res.status(404).json({ error: "Bot not found" });
      res.json(bot);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch bot" });
    }
  });

  app.post("/api/upload", authenticate, upload.single('image'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ImgBB API key missing" });

    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('image', blob, req.file.originalname);

      const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        res.json({ url: response.data.data.url });
      } else {
        res.status(500).json({ error: "Upload to ImgBB failed" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Flutterwave Routes
  app.post("/api/flutterwave/create-plan", authenticate, isAdmin, async (req, res) => {
    const { amount, name, interval, currency } = req.body;
    try {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/payment-plans',
        { amount, name, interval, currency },
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: error.response?.data?.message || "Failed to create plan" });
    }
  });

  app.post("/api/flutterwave/verify", authenticate, async (req: any, res) => {
    const { transaction_id } = req.body;
    if (!transaction_id) return res.status(400).json({ error: "Transaction ID required" });

    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
          }
        }
      );

      const { status, customer, payment_plan } = response.data.data;

      if (status === 'successful') {
        // Try to find the subscription ID if this was a plan payment
        let subId = undefined;
        if (payment_plan) {
          try {
            const listResponse = await axios.get(
              `https://api.flutterwave.com/v3/subscriptions?email=${customer.email}`,
              {
                headers: { 'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
              }
            );
            const activeSub = listResponse.data.data?.find((s: any) => s.status === 'active' && s.plan == payment_plan);
            if (activeSub) subId = activeSub.id;
          } catch (e) {
            console.error("Failed to fetch sub ID during verify", e);
          }
        }

        await User.findByIdAndUpdate(req.userId, {
          plan: 'pro',
          planId: payment_plan,
          subscriptionId: subId,
          subscriptionStatus: 'active'
        });
        res.json({ success: true, message: "Subscription activated" });
      } else {
        res.status(400).json({ error: "Payment was not successful" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.response?.data?.message || "Verification failed" });
    }
  });

  app.post("/api/flutterwave/cancel", authenticate, async (req: any, res) => {
    const user = await User.findById(req.userId);
    if (!user || user.plan !== 'pro') {
      return res.status(400).json({ error: "No active pro subscription found" });
    }

    try {
      let subId = user.subscriptionId;

      if (!subId) {
        const listResponse = await axios.get(
          `https://api.flutterwave.com/v3/subscriptions?email=${user.email}`,
          {
            headers: { 'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
          }
        );
        const activeSub = listResponse.data.data?.find((s: any) => s.status === 'active' && s.plan == user.planId);
        if (activeSub) {
          subId = activeSub.id;
          user.subscriptionId = subId;
          await user.save();
        }
      }

      if (!subId) {
        return res.status(404).json({ error: "Subscription record not found in Flutterwave" });
      }

      const response = await axios.put(
        `https://api.flutterwave.com/v3/subscriptions/${subId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        user.subscriptionStatus = 'cancelled';
        await user.save();
        res.json({ success: true, message: "Subscription cancelled" });
      } else {
        res.status(400).json({ error: "Failed to cancel subscription" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.response?.data?.message || "Cancellation failed" });
    }
  });

  app.post("/api/webhooks/flutterwave", async (req, res) => {
    const secretHash = process.env.FLW_WEBHOOK_HASH;
    const signature = req.headers['verif-hash'];
    
    if (secretHash && signature !== secretHash) {
      return res.status(401).end();
    }
    
    const payload = req.body;
    console.log("Flutterwave Webhook:", payload.event);

    try {
      if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
        const email = payload.data.customer.email;
        const payment_plan = payload.data.payment_plan;

        if (payment_plan) {
          await User.findOneAndUpdate(
            { email },
            { plan: 'pro', planId: payment_plan, subscriptionStatus: 'active' }
          );
        }
      } else if (payload.event === 'subscription.cancelled') {
        const email = payload.data.customer.email;
        await User.findOneAndUpdate(
          { email },
          { plan: 'free', subscriptionStatus: 'cancelled' }
        );
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
    }
    
    res.status(200).json({ status: 'success' });
  });

  app.post("/api/chat", async (req, res) => {
    const { prompt, botId, sessionId } = req.body;
    const uniqueKey = process.env.XON_AI_UNIQUE_KEY;
    if (!uniqueKey) return res.status(500).json({ error: "Xon AI Key missing" });

    try {
      let context = "";
      let welcomeMessage = "Hello! How can I help you today?";
      let currentSessionId = sessionId;
      let bookingInstructions = "";
      
      if (botId) {
        const bot = await Bot.findById(botId).populate('knowledgeIds');
        if (bot) {
          context = bot.knowledgeIds.map((k: any) => k.content).join("\n").substring(0, 4000);
          welcomeMessage = bot.welcomeMessage || welcomeMessage;
          
          if (bot.enableBooking) {
            bookingInstructions = `\n\nIf the user wants to book a meeting or appointment, respond with exactly "[BOOKING_REQUEST]" followed by the parameters needed: ${bot.bookingParameters.join(", ")}. Example: "[BOOKING_REQUEST] Name, Email, Date, Time"`;
          }

          if (!currentSessionId) {
            const session = await Session.create({ botId });
            currentSessionId = session._id;
          }
          
          // Save user message for analytics
          await Message.create({ botId, sessionId: currentSessionId, role: 'user', content: prompt });
        }
      }

      const response = await fetch("https://xon-ai-zeta.vercel.app/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: context ? `Context: ${context}${bookingInstructions}\n\nUser: ${prompt}` : prompt + bookingInstructions,
          unique_key: uniqueKey,
        }),
      });
      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";

      if (botId && currentSessionId) {
        // Save assistant message for analytics
        await Message.create({ botId, sessionId: currentSessionId, role: 'assistant', content: assistantContent });
      }

      res.json({ ...data, sessionId: currentSessionId });
    } catch (error) {
      res.status(500).json({ error: "Chat failed" });
    }
  });

  // API 404 handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  if (process.env.VERCEL) {
    console.log("Running on Vercel");
  } else {
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  }
  
  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  app(req, res);
};
