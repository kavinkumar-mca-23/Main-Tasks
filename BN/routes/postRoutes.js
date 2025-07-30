const express = require('express');
const router = express.Router();

const { createPost, getAllPosts,getPostsByUser,deletePost,likePost,commentOnPost,getComments, getPostCounts,replyToComment } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/cloudinaryUpload');

router.post('/', authMiddleware, upload.single('media'), createPost);
 router.get('/', getAllPosts); // optional public fetch
// Get posts by user
router.get('/user/:userId', getPostsByUser);
router.delete('/:id', authMiddleware, deletePost);
router.post('/like/:postId', authMiddleware, likePost);
router.post('/comment/:postId', authMiddleware, commentOnPost);
router.post('/reply/:postId/:commentId', authMiddleware, replyToComment);
router.get('/comments/:postId', getComments);
router.get("/counts/:id", getPostCounts);


module.exports = router;