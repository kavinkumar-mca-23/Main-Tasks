const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// ✅ Send a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, media } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      media,
      status: 'sent'  // ✅ ensure consistency
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Send Message Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get chat between two users
router.get('/:user1/:user2', authMiddleware, async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    if (!mongoose.isValidObjectId(user1) || !mongoose.isValidObjectId(user2)) {
      return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Get Messages Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
