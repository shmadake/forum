import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const url = process.env.URL;
const JWT_SECRET = process.env.JWT_SECRET;
const __dirname = fileURLToPath(import.meta.url);

if (!JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not set in your .env file. Set it before deploying to production."
  );
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

try {
  mongoose.connect(url);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log(error);
}

// ---------------- Schemas ----------------

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const replySchema = new mongoose.Schema({
  postId: {
    type: String,
    required: true,
  },
  reply: {
    type: String,
  },
  author: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);
const Reply = mongoose.model("Reply", replySchema);

// ---------------- Auth helpers ----------------

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true, // not readable by client-side JS, protects against XSS token theft
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ error: "Not authenticated" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch (error) {
    return res.status(401).send({ error: "Invalid or expired session" });
  }
};

// ---------------- Auth routes ----------------

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({ error: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).send({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).send({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(201).send({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Signup failed. Please try again." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).send({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.send({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Login failed. Please try again." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.send({ message: "Logged out" });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.send({ id: req.user.id, name: req.user.name, email: req.user.email });
});

// ---------------- Post / Reply routes ----------------

app.get("/api/posts", async (req, res) => {
  const result = await Post.find().sort({ createdAt: -1 });
  res.send(result);
});

app.get("/api/replies", async (req, res) => {
  const result = await Reply.find().sort({ createdAt: -1 });
  res.send(result);
});

// Protected: must be logged in to create a post. Author is taken from the
// verified token instead of trusting whatever the client sends.
app.post("/api/newpost", requireAuth, async (req, res) => {
  try {
    const result = await Post.create({
      topic: req.body.topic,
      title: req.body.title,
      content: req.body.content,
      author: req.user.email,
    });
    res.status(201).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not create post" });
  }
});

// Protected + ownership check: only the original author can edit their post.
app.put("/api/posts/edit/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });
    if (post.author !== req.user.email) {
      return res.status(403).send({ error: "You can only edit your own posts" });
    }
    const result = await Post.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not edit post" });
  }
});

// Protected: must be logged in to reply. Author comes from the token.
app.post("/api/posts/reply/:id", requireAuth, async (req, res) => {
  try {
    const result = await Reply.create({
      postId: req.params.id,
      reply: req.body.reply,
      author: req.user.email,
      createdAt: Date.now(),
    });
    res.status(201).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not post reply" });
  }
});

// Protected + ownership check: only the original author can delete their post.
app.delete("/api/posts/delete/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });
    if (post.author !== req.user.email) {
      return res.status(403).send({ error: "You can only delete your own posts" });
    }
    const result1 = await Post.findByIdAndDelete(req.params.id);
    await Reply.deleteMany({ postId: req.params.id });
    res.send(result1);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not delete post" });
  }
});

// Protected + ownership check: only the original author can delete their reply.
app.delete("/api/replies/delete/:id", requireAuth, async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);
    if (!reply) return res.status(404).send({ error: "Reply not found" });
    if (reply.author !== req.user.email) {
      return res.status(403).send({ error: "You can only delete your own replies" });
    }
    const result = await Reply.findByIdAndDelete(req.params.id);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not delete reply" });
  }
});

app.use(express.static(path.resolve("client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve("client/build", "index.html"));
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
