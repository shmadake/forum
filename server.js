import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const url = process.env.URL;
const __dirname = fileURLToPath(import.meta.url);
//console.log(__dirname);
//console.log(import.meta.url);

app.use(cors());
app.use(express.json());

try {
  mongoose.connect(url);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log(error);
}

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

const Post = mongoose.model("Post", postSchema);
const Reply = mongoose.model("Reply", replySchema);

app.get("/api/posts", async (req, res) => {
  const result = await Post.find().sort({ createdAt: -1 });
  //console.log(result);
  res.send(result);
});

app.get("/api/replies", async (req, res) => {
  const result = await Reply.find().sort({ createdAt: -1 });
  //console.log(result);
  res.send(result);
});

app.post("/api/newpost", async (req, res) => {
  //console.log(req.body);
  const result = await Post.create(req.body);
  // console.log(result);
});

app.put("/api/posts/edit/:id", async (req, res) => {
  const result = await Post.findOneAndUpdate({ _id: req.params.id }, req.body);
  //console.log(result);
  res.send(result);
  //console.log(req.body);
  //console.log(req.params.id);
});

app.post("/api/posts/reply/:id", async (req, res) => {
  const result = await Reply.create({
    postId: req.params.id,
    reply: req.body.reply,
    author: req.body.author,
    createdAt: Date.now(),
  });
  res.send(result);
});

app.delete("/api/posts/delete/:id", async (req, res) => {
  const result1 = await Post.findByIdAndDelete(req.params.id);
  const result2 = await Reply.deleteMany({ postId: req.params.id });
  //console.log(result);
  res.send(result1);
});

app.delete("/api/replies/delete/:id", async (req, res) => {
  const result = await Reply.findByIdAndDelete(req.params.id);
  //console.log(result);
  res.send(result);
});

app.use(express.static(path.resolve("client/build")));
//console.log(path.resolve("client/build", "index.html"))
app.get("*", (req, res) => {
  res.sendFile(path.resolve("client/build", "index.html"));
});

app.listen(port);
