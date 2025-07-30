const Post = require("../models/Post");
const cloudinary = require('../config/cloudinary');
const Notification = require("../models/Notification")
const User =require("../models/User")
const {getIO, getOnlineUsers} = require('../socket')
// Create post
const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;

    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      console.log("📁 File received from Cloudinary:", req.file);
      mediaUrl = req.file.path || req.file.secure_url || "";
      const mimeType = req.file.mimetype;

      if (mimeType.startsWith("image/")) mediaType = "image";
      else if (mimeType.startsWith("video/")) mediaType = "video";
    }

    const post = await Post.create({
      user: userId,
      text,
      mediaUrl,
      mediaType,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("❌ Error in createPost:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// Get posts by a specific user
const getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const posts = await Post.find({ user: userId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Error in getPostsByUser:", err);
    res.status(500).json({ message: "Failed to fetch user posts", error: err.message });
  }
};

// Get all posts with user info
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Error in getAllPosts:", err);
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};
// Delete post by ID
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if logged in user is the owner
    if (post.user.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized to delete this post" });

    // Optional: delete media from Cloudinary (if stored there)
    if (post.mediaUrl) {
      const publicId = post.mediaUrl.split('/').pop().split('.')[0]; // crude way
      const cloudinary = require('../config/cloudinary'); // adjust path as needed

      await cloudinary.uploader.destroy(publicId, {
        resource_type: post.mediaType === "video" ? "video" : "image",
      });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deletePost:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

//like/unlike Post
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(req.user.id);

    if (alreadyLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);

      if (post.user.toString() !== req.user.id) {
        const fromUser = await User.findById(req.user.id).select("name avatar");
        const notification = await Notification.create({
          to: post.user,
          from: req.user.id,
          type: "like",
          post: post._id,
          message: `${fromUser.name} liked your post`,
        });

        getIO().to(post.user.toString()).emit("notification", {
          _id: notification._id,
          from: {
            _id: fromUser._id,
            name: fromUser.name,
            avatar: fromUser.avatar,
          },
          type: "like",
          message: notification.message,
          post: post._id,
          createdAt: notification.createdAt,
        });
      }
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    console.error("❌ Error in likePost:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Comment on a post
const commentOnPost = async (req, res) => {
  const { text } = req.body;
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    // ✅ Find post and populate post owner
    const post = await Post.findById(postId).populate("user");
    if (!post) return res.status(404).json({ message: "Post not found" });

    // ✅ Add main comment
    const comment = { user: userId, text, createdAt: new Date(), replies: [] }; // 🆕 replies array added for inline replies
    post.comments.push(comment);
    await post.save();

    // ✅ Notification logic preserved
    const fromUser = await User.findById(userId);

    if (userId !== post.user._id.toString()) {
      const notificationDoc = await Notification.create({
        to: post.user._id,
        from: userId,
        type: "comment",
        post: post._id,
        message: `${fromUser.name} commented: "${text}"`,
        seen: false,
      });

      const populatedNotification = await Notification.findById(notificationDoc._id)
        .populate("from", "name avatar");

      const socketId = getOnlineUsers().get(post.user._id.toString());
      if (socketId) {
        getIO().to(socketId).emit("notification", {
          _id: populatedNotification._id,
          from: {
            _id: populatedNotification.from._id,
            name: populatedNotification.from.name,
            avatar: populatedNotification.from.avatar,
          },
          type: "comment",
          message: populatedNotification.message,
          post: post._id,
          createdAt: populatedNotification.createdAt,
        });
      }
    }

    // ✅ Populate nested replies also
    const updatedPost = await Post.findById(postId)
      .populate("comments.user", "name avatar")
      .populate("comments.replies.user", "name avatar"); // 🆕 Added for inline reply user details

    res.status(201).json({
      comments: updatedPost.comments,
      commentCount: updatedPost.comments.length,
    });
  } catch (err) {
    console.error("❌ Error in commentOnPost:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get comments of a post
// Get comments of a post
const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("comments.user", "name avatar")                        // ✅ Existing line (kept as is)
      .populate("comments.replies.user", "name avatar");              // 🆕 ADDED: Populate reply users too

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({
      comments: post.comments,
      commentCount: post.comments.length,
    });
  } catch (err) {
    console.error("❌ Error in getComments:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Like & comment count for post
const getPostCounts = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // ✅ Count total replies inside each comment
    const totalReplies = post.comments.reduce((count, comment) => {
      return count + (comment.replies?.length || 0);
    }, 0);

    // Retrun like and comment counts

    res.json({
      likesCount: post.likes.length,
      commentsCount: post.comments.length  + totalReplies,
    });
  } catch (err) {
    console.error("❌ Error in getPostCounts:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// replies to comments 

const replyToComment = async (req, res) => {
  const { text } = req.body;
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({ user: userId, text });
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("comments.user", "name avatar")
      .populate("comments.replies.user", "name avatar");

    res.status(201).json({
      comments: updatedPost.comments,
    });
  } catch (err) {
    console.error("❌ Error in replyToComment:", err);
    res.status(500).json({ message: "Server error" });
  }
};





// Export all controllers
module.exports = {
  createPost,
  getPostsByUser,
  getAllPosts,
  deletePost,
  likePost,
  commentOnPost,
  getComments,
  getPostCounts,
  replyToComment
};
