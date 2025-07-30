// models/Post.js
const mongoose = require("mongoose");

// ✅ Declare replySchema first
const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// ✅ Now safely use replySchema in commentSchema
const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    replies: [replySchema], // ✅ OK now
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video", ""] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema] // ✅ Includes replies inside
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
