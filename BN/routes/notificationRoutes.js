const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// Get notifications for logged-in user
router.get('/', auth, async (req, res) => {
  const notifications = await Notification.find({ to: req.user.id })
   .populate('from', 'name avatar')
  .sort({ createdAt: -1 }).limit(50);
  
  res.json(notifications);
});

// Get unseen notification count by userId
router.get('/:userId/unseen-count', async (req, res) => {
  try {
    const userId = req.params.userId;

    const unseenCount = await Notification.countDocuments({
      to: userId,
      seen: false
    });

    res.json({ unseenCount: unseenCount || 0 }); // default to 0 if null
  } catch (err) {
    console.error('Error fetching unseen count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ✅ Mark as seen and delete after 3 seconds
router.post('/seen/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { seen: true },
      { new: true }
    );

    res.json({ success: true });

    // Delete after 3 seconds (non-blocking)
    setTimeout(async () => {
      try {
        await Notification.findByIdAndDelete(req.params.id);
        console.log(`Deleted seen notification ${req.params.id}`);
      } catch (e) {
        console.error("Error deleting seen notification after delay:", e);
      }
    }, 3000);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as seen" });
  }
});

// ✅ Cleanup all seen notifications (on button click)
router.delete('/cleanup', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ to: req.user.id, seen: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Cleanup failed" });
  }
});


module.exports = router;