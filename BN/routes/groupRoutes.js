const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const authMiddleware = require('../middleware/authMiddleware');
const { addGroupToRecentChats } = require('../controllers/userController');

// ✅ Permanent group listing for logged-in user (moved up to avoid conflict)
router.get('/my-groups', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { 'members.user': userId }
      ]
    })
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name avatar');

    res.json(groups);
  } catch (err) {
    console.error('Get My Groups Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Create a new group (auto-admin + add to recent chats)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members } = req.body;

    // Add creator as admin
    const groupMembers = [
      { user: req.user.id, role: 'admin' },
      ...(members || []).map(m => ({ user: m.user, role: 'member' }))
    ];

    const group = await Group.create({
      name,
      description,
      members: groupMembers,
      createdBy: req.user.id
    });

    // 🔥 Add group to all members' recent chats
    const memberIds = groupMembers.map(m => m.user);
    await addGroupToRecentChats(group._id, memberIds);

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name avatar');

    res.status(201).json(populatedGroup);
  } catch (err) {
    console.error('Create Group Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get all groups
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name avatar');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get single group by ID
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name avatar');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Add members (Admin only) + add to recent chats
router.post('/:groupId/add-members', authMiddleware, async (req, res) => {
  try {
    const { members } = req.body; // [{ user: userId }, ...]
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if requester is admin
    const isAdmin = group.members.some(
      m => m.user.toString() === req.user.id && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    const newMemberIds = [];

    members.forEach(m => {
      if (!group.members.some(existing => existing.user.toString() === m.user)) {
        group.members.push({ user: m.user, role: 'member' });
        newMemberIds.push(m.user);
      }
    });

    await group.save();

    // 🔥 Add group to newly added members' recent chats
    if (newMemberIds.length > 0) {
      await addGroupToRecentChats(group._id, newMemberIds);
    }

    const updatedGroup = await Group.findById(req.params.groupId)
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name avatar');

    res.json(updatedGroup);
  } catch (err) {
    console.error('Add Members Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Remove a member (Admin only)
router.delete('/:groupId/remove-member/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user.id && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    group.members = group.members.filter(
      m => m.user.toString() !== req.params.userId
    );

    await group.save();

    const updatedGroup = await Group.findById(req.params.groupId)
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name avatar');

    res.json(updatedGroup);
  } catch (err) {
    console.error('Remove Member Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Leave group (for members or admin)
router.post('/:groupId/leave', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    group.members = group.members.filter(m => m.user.toString() !== req.user.id);

    const wasAdmin = group.createdBy.toString() === req.user.id;
    if (wasAdmin) {
      if (group.members.length > 0) {
        group.createdBy = group.members[0].user;
        group.members[0].role = 'admin';
      } else {
        await Group.findByIdAndDelete(req.params.groupId);
        return res.json({ message: 'Group deleted as no members left' });
      }
    }

    await group.save();

    const updatedGroup = await Group.findById(req.params.groupId)
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name avatar');

    res.json(updatedGroup);
  } catch (err) {
    console.error('Leave Group Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Send message to group (populate sender)
router.post('/:groupId/message', authMiddleware, async (req, res) => {
  try {
    const { content, media, mentions } = req.body;

    const message = await GroupMessage.create({
      group: req.params.groupId,
      sender: req.user.id,
      content,
      media,
      mentions
    });

    const populatedMsg = await message.populate('sender', 'name avatar');
    res.status(201).json(populatedMsg);
  } catch (err) {
    console.error('Send Group Message Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get messages for a group
router.get('/:groupId/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group: req.params.groupId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Get Group Messages Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;