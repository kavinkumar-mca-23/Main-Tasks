const express = require('express');
const router = express.Router();
const { searchUsers, addRecentChat,getRecentChats } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔐 GET /api/users/search?name=xxx
router.get('/search', authMiddleware, searchUsers);
// routes/userRoutes.js

// 💾 Add recent chat
router.post('/recent/:id', authMiddleware, addRecentChat);

// 📄 Get recent chats
router.get('/recent', authMiddleware, getRecentChats);





module.exports = router;
