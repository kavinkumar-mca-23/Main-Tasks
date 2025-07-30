// const express = require('express');
// const router = express.Router();
// const {
//   followUser,
//   unfollowUser,
//   acceptFollowRequest,
//   rejectFollowRequest,
//   getPendingRequests,
//   getNotifications,
//   markNotificationSeen,
//   getFollowers,
//   getFollowing,
//   getSuggestedUsers,
//   getFollowStatus,
//   cancelFollowRequest // <-- Add this import
// } = require('../controllers/followController');
// const authMiddleware = require('../middleware/authMiddleware');

// // Follow a user (public or private)
// router.post('/follow/:id', authMiddleware, followUser);

// // Cancel a follow request (private profile)
// router.post('/cancel-request/:id', authMiddleware, cancelFollowRequest);

// // Unfollow a user
// router.post('/unfollow/:id', authMiddleware, unfollowUser);

// // Accept a follow request
// router.post('/accept/:id', authMiddleware, acceptFollowRequest);

// // Reject a follow request
// router.post('/reject/:id', authMiddleware, rejectFollowRequest);

// // Get follow status between current user and target
// router.get('/status/:id', authMiddleware, getFollowStatus);

// // Get pending follow requests (for private users)
// router.get('/pending-requests', authMiddleware, getPendingRequests);

// // Get all notifications for a user
// router.get('/notifications', authMiddleware, getNotifications);

// // Mark a specific notification as seen
// router.put('/notifications/:id/seen', authMiddleware, markNotificationSeen);

// // Get followers/following lists
// router.get('/followers/:id', authMiddleware, getFollowers);
// router.get('/following/:id', authMiddleware, getFollowing);

// // Get suggested users
// router.get('/suggested', authMiddleware, getSuggestedUsers);

// module.exports = router;


const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getSuggestedUsers,
} = require("../controllers/followController");

const router = express.Router();

router.post("/follow/:id", auth, followUser);
router.post("/unfollow/:id", auth, unfollowUser);
router.get("/status/:id", auth, getFollowStatus);
router.get("/followers/:id", auth, getFollowers);
router.get("/following/:id", auth, getFollowing);
router.get("/suggested", auth, getSuggestedUsers);

module.exports = router;