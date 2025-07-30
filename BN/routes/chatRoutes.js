const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  accessChat,
  getChats,
  sendMessage,
  getMessages,
} = require("../controllers/chatController");

router.post("/access", auth, accessChat);
router.get("/", auth, getChats);
router.post("/message", auth, sendMessage);
router.get("/message/:chatId", auth, getMessages);

module.exports = router;
