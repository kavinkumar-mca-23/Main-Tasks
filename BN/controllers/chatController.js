const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

// Create or get 1-on-1 chat
exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).send("User ID missing");

  let chat = await Chat.findOne({
    members: { $all: [req.user.id, userId] },
  }).populate("members", "-password").populate("lastMessage");

  if (!chat) {
    chat = await Chat.create({ members: [req.user.id, userId] });
  }

  res.json(chat);
};

// Get all user chats
exports.getChats = async (req, res) => {
  const chats = await Chat.find({
    members: req.user.id,
  })
    .populate("members", "-password")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name email profilePic" },
    })
    .sort({ updatedAt: -1 });

  res.json(chats);
};

// Send a message
exports.sendMessage = async (req, res) => {
  const { chatId, text, type = "text" } = req.body;

  const message = await Message.create({
    chatId,
    sender: req.user.id,
    text,
    type,
  });

  const fullMessage = await Message.findById(message._id).populate("sender", "name profilePic");

  await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

  res.json(fullMessage);
};

// Get messages by chat
exports.getMessages = async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chatId })
    .populate("sender", "name profilePic")
    .sort({ createdAt: 1 });

  res.json(messages);
};
