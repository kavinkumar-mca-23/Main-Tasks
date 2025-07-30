const { Server } = require('socket.io');
const Message = require('./models/Message');
const Chat = require('./models/Chat');


let io = null;
const onlineUsers = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      console.log(`🟢 Registered user ${userId} -> ${socket.id}`);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }

    // ✅ Join chat room
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`📥 User ${socket.userId} joined chat ${chatId}`);
    });

    // ✅ Leave chat room when switching
    socket.on("leave-chat", (chatId) => {
      socket.leave(chatId);
      console.log(`📤 User ${socket.userId} left chat ${chatId}`);
    });

    // ✅ Typing indicator
    socket.on("typing", ({ chatId, senderId }) => {
      if (chatId && senderId) {
        socket.to(chatId).emit("typing", { chatId, senderId });
      }
    });

    socket.on("stop-typing", ({ chatId, userId }) => {
      if (chatId && userId) {
        socket.to(chatId).emit("stop-typing", { chatId, userId });
      }
    });

    // ✅ Send and receive message
    socket.on("send-message", ({ chatId, message }) => {
      io.to(chatId).emit("receive-message", message);
    });

    // ✅ Delivered (only notify chat members)
    socket.on("message-delivered", async ({ messageId, receiverId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "delivered" });
        if (messageId && receiverId) {
          io.emit("message-status-updated", { messageId, status: "delivered" });
        }
      } catch (err) {
        console.error("Error updating message delivered status:", err);
      }
    });

    // ✅ Seen (only notify chat members)
    socket.on("seen", async ({ messageId, userId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "seen" });
        if (messageId && userId) {
          io.emit("message-status-updated", { messageId, status: "seen", seenBy: userId });
        }
      } catch (err) {
        console.error("Error updating message seen status:", err);
      }
    });

    // ✅ Handle disconnect
    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      console.log(`🔴 User disconnected: ${socket.userId}`);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

function getOnlineUsers() {
  return onlineUsers;
}

module.exports = { initSocket, getIO, getOnlineUsers };
