const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  getUserById,
  getAllUsers,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // <-- import multer config

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getProfile);

// 👇 Use multer middleware for avatar upload on updateProfile
router.put('/me', authMiddleware, upload.single('avatar'), updateProfile);

router.get('/:id', getUserById);

// router.get("/", authMiddleware, getAllUsers);


module.exports = router;
