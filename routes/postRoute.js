const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinary");
const {
  createPost,
  likePost,
  addCommentToPost,
  addReplyToComment,
  getAllPosts,
  getAllVideoPosts,
  nonPublicPosts,
  getTrendingPosts,
} = require("../controllers/postController");
const router = express.Router();

router.post(
  "/post",
  authMiddleware,
  multerMiddleware.single("media"),
  createPost
);

router.get("/post", authMiddleware, getAllPosts);

router.get("/video-post", authMiddleware, getAllVideoPosts);

router.post("/post/like/:postId", authMiddleware, likePost);

router.post("/post/comment/:postId", authMiddleware, addCommentToPost);

router.post(
  "/post/comment-reply/:postId/:commentId",
  authMiddleware,
  addReplyToComment
);

router.get("/friends-post", authMiddleware, nonPublicPosts);

router.get("/trending", authMiddleware, getTrendingPosts);

// router.post("/post/like/:postId", authMiddleware, likePost);

module.exports = router;
