const express = require("express");
const {
  followUser,
  getAllFriendRequests,
  unfollowUser,
  getAllMutualFriends,
  getUserSuggestions,
  userCommonInterests,
  getUserDetails,
  getUsersForSearch,
} = require("../controllers/userController");
const authMiddleWare = require("../middleware/authMiddleware");
const { getUserPosts } = require("../controllers/postController");
const router = express.Router();

// Get User Details
router.get("/details", authMiddleWare, getUserDetails);

// Follow User
router.post("/follow", authMiddleWare, followUser);

// Unfollow User
router.post("/unfollow", authMiddleWare, unfollowUser);

// Get all friend requests
router.get("/friend-requests", authMiddleWare, getAllFriendRequests);

// Get mutual friends
router.get("/mutual-friends/:userId", authMiddleWare, getAllMutualFriends);

// Get user suggestions
router.get("/user-suggestion", authMiddleWare, getUserSuggestions);

// Get users with common interests
router.get("/usersInterests", authMiddleWare, userCommonInterests);

// Get users posts
router.get("/posts", authMiddleWare, getUserPosts);

// Getall users for search
router.get("/search", authMiddleWare, getUsersForSearch);

module.exports = router;
