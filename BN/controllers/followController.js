const User = require('../models/User');
const {sendNotification} =require('../controllers/notificationController')

// FOLLOW USER (direct follow for both public/private)
exports.followUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!target) return res.status(404).json({ message: 'User not found' });
    if (!user) return res.status(404).json({ message: 'Current user not found' });
    if (target._id.equals(user._id)) return res.status(400).json({ message: 'Cannot follow yourself' });
    if (user.following.includes(target._id)) return res.status(400).json({ message: 'Already following this user' });

    user.following.push(target._id);
    target.followers.push(user._id);

    await user.save();
    await target.save();

    // Send follow notification
    await sendNotification({ to: target._id, from: user._id, type: 'follow' });
    
   
    // If mutual, send follow_back notification
    if (target.following.includes(user._id)) {
      await sendNotification({ to: user._id, from: target._id, type: 'follow_back' });
    }

    return res.status(200).json({
      message: `You started following ${target.name}`,
    });
  } catch (err) {
    console.error("FollowUser error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UNFOLLOW USER
exports.unfollowUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!target) return res.status(404).json({ message: 'User not found' });
    if (!user) return res.status(404).json({ message: 'Current user not found' });
    if (!user.following.includes(target._id)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    target.followers.pull(user._id);
    user.following.pull(target._id);

    await target.save();
    await user.save();

     // Send unfollow notification
    await sendNotification({ to: target._id, from: user._id, type: 'unfollow' });

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error("UnfollowUser error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET FOLLOW STATUS
exports.getFollowStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUser._id);
    const isFollowedBy = targetUser.following.includes(currentUser._id);

    return res.json({ isFollowing, isFollowedBy });
  } catch (err) {
    console.error("GetFollowStatus error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET FOLLOWERS
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'name avatar');
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET FOLLOWING
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'name avatar');
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET SUGGESTED USERS
exports.getSuggestedUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
    .select('name avatar isPrivate')
    .sort({ createdAt: -1 }) // 👈 Sort by latest users
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};