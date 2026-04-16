import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import axios from "axios";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

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
  logo: String,
  knowledgeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Knowledge' }],
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
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
  createdAt: { type: Date, default: Date.now }
});

const Knowledge = mongoose.model("Knowledge", KnowledgeSchema);
const Bot = mongoose.model("Bot", BotSchema);
const User = mongoose.model("User", UserSchema);
const Message = mongoose.model("Message", MessageSchema);

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

      const response = await axios.get(url, { headers: { 'User-Agent': 'WidgetWhiz-Scraper/1.0' } });
      const $ = cheerio.load(response.data);
      $('script, style').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      const content = text.substring(0, 5000);

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
      const messages = await Message.find({ botId: req.params.id });
      const totalChats = messages.filter(m => m.role === 'user').length;
      // Simple analytics calculation
      res.json({
        totalChats,
        avgResponseTime: "1.2s", // Mocked for now as we don't track timing yet
        satisfaction: "95%"
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

  app.post("/api/chat", async (req, res) => {
    const { prompt, botId } = req.body;
    const uniqueKey = process.env.XON_AI_UNIQUE_KEY;
    if (!uniqueKey) return res.status(500).json({ error: "Xon AI Key missing" });

    try {
      let context = "";
      let welcomeMessage = "Hello! How can I help you today?";
      
      if (botId) {
        const bot = await Bot.findById(botId).populate('knowledgeIds');
        if (bot) {
          context = bot.knowledgeIds.map((k: any) => k.content).join("\n").substring(0, 4000);
          welcomeMessage = bot.welcomeMessage || welcomeMessage;
          
          // Save user message for analytics
          await Message.create({ botId, role: 'user', content: prompt });
        }
      }

      const response = await fetch("https://xon-ai-zeta.vercel.app/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: context ? `Context: ${context}\n\nUser: ${prompt}` : prompt,
          unique_key: uniqueKey,
        }),
      });
      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";

      if (botId) {
        // Save assistant message for analytics
        await Message.create({ botId, role: 'assistant', content: assistantContent });
      }

      res.json(data);
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
