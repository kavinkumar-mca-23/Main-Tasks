const User = require('../models/User');
const Group = require('../models/Group');

// 🔍 Search users by name (only excludes self)
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.name?.trim();
    const currentUserId = req.user.id;

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: currentUserId }, // exclude self
      name: { $regex: query, $options: 'i' }
    }).select('_id name avatar');

    res.json(users);
  } catch (err) {
    console.error('Search User Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 💾 Add recent chat (store permanently)
exports.addRecentChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatId = req.params.id;

    if (chatId === userId) {
      return res.status(400).json({ message: "Cannot add yourself to recent chats" });
    }

    const user = await User.findById(userId);

    // Remove if exists and move to front
    user.recentChats = user.recentChats.filter(id => id.toString() !== chatId);
    user.recentChats.unshift(chatId);
    user.recentChats = user.recentChats.slice(0, 10);

    await user.save();
    res.json({ message: "Recent chat updated" });
  } catch (err) {
    console.error("Add Recent Chat Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📄 Get recent chats (includes groups)
exports.getRecentChats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('recentChats');
    const chats = [];
    const toRemove = [];

    for (const id of user.recentChats) {
      let chatObj = await User.findById(id).select('_id name avatar');
      let type = 'user';

      if (!chatObj) {
        chatObj = await Group.findById(id)
          .populate('members.user', 'name avatar')
          .populate('createdBy', 'name avatar');
        type = 'group';
      }

      if (chatObj) {
        chats.push({ type, data: chatObj });
      } else {
        toRemove.push(id);
      }
    }

    // Bulk cleanup
    if (toRemove.length > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { recentChats: { $in: toRemove } }
      });
    }

    res.json(chats);
  } catch (err) {
    console.error("Get Recent Chats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ⚡ Auto-update recentChats for group members
exports.addGroupToRecentChats = async (groupId, memberIds) => {
  try {
    await Promise.all(
      memberIds.map(async (memberId) => {
        const user = await User.findById(memberId);
        if (user) {
          user.recentChats = user.recentChats.filter(id => id.toString() !== groupId.toString());
          user.recentChats.unshift(groupId);
          user.recentChats = user.recentChats.slice(0, 10);
          await user.save();
        }
      })
    );
  } catch (err) {
    console.error("Auto Add Group to RecentChats Error:", err);
  }
};
