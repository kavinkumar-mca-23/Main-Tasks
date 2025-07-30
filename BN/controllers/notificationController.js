const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO, getOnlineUsers } = require('../socket');

async function sendNotification({ to, from, type ,postId, commentText }) {
  try {
    const fromUser = await User.findById(from).select('name avatar');
    if (!fromUser) throw new Error('From user not found');

    let message = '';
    if (type === 'follow') {
      message = `${fromUser.name} started following you`;
    } else if (type === 'follow_back') {
      message = `${fromUser.name} followed you back, now you are mutual friends`;
    } else if (type === 'unfollow') {
      message = `${fromUser.name} unfollowed you`;
    } else if (type === 'like') {
      message = `${fromUser.name} liked your post`;
    } else if (type === 'comment') {
      message = `${fromUser.name} commented: "${commentText}"`;
    }
    const notificationDoc = await Notification.create({
      to, 
      from:fromUser._id, 
      type,
      post: postId || null,
      message, 
      seen: false
    });
    
      // Populate the `from` field with `name` and `avatar`
    const notification = await Notification.findById(notificationDoc._id)
      .populate('from', 'name avatar');
    

    // Emit via socket.io if user is online
    const socketId = getOnlineUsers().get(to.toString());
    if (socketId) {
       getIO().to(socketId).emit('notification', {
        _id: notification._id,
        from: {
          _id: notification.from._id,
          name: notification.from.name,
          avatar: notification.from.avatar
        },
        type: notification.type,
        message: notification.message,
        createdAt: notification.createdAt,
        post: notification.post
      });
    }
  } catch (error) {
    console.error("sendNotification Error:", error.message);
  }
}
module.exports = {sendNotification}