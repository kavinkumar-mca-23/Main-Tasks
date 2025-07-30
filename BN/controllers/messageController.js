// controllers/messageController.js

const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

// ✅ Send a new message
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ message: "Invalid data passed" });
  }

  const newMessage = {
    sender: req.user.id,
    content,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);

    // Populate message fields
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    // Update latestMessage in Chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ✅ Get all messages for a chat
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

module.exports = {
  sendMessage,
  getAllMessages,
};
