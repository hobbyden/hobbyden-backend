const express = require("express");
const authMiddleWare = require("../middleware/authMiddleware");
const {
  createGroup,
  followGroup,
  joinRequestGroup,
  respondToJoinRequest,
  getAllRequests,
  getGroupDetails,
  getVideoPostByGroupId,
  getPostByGroupId,
  updateGroupAboutPage,
  getMyGroupPosts,
  leaveGroup,
  getJoinedGroups,
  getMyGroups,
  getGroupSuggestion,
} = require("../controllers/Group/groupController");
const {
  sendInvite,
  getInvites,
  acceptInvite,
  rejectInvite,
} = require("../controllers/Group/inviteController");

const router = express.Router();

// Create Group
router.post("/create", authMiddleWare, createGroup);

// Follow Group
router.post("/follow/:groupId", authMiddleWare, followGroup);

// Send join Request
router.post("/join-request/:groupId", authMiddleWare, joinRequestGroup);

// Get join Requests
router.get("/requests/:groupId", authMiddleWare, getAllRequests);

// Get group details
router.get("/details/:groupId", authMiddleWare, getGroupDetails);

// Send join Request
router.post(
  "/join-request/respond/:groupId",
  authMiddleWare,
  respondToJoinRequest
);

// Send Group Invite
router.post("/sendInvite/:groupId", authMiddleWare, sendInvite);

// Get all Group Invites
router.get("/invites", authMiddleWare, getInvites);

// Accept Group Invites
router.post("/accept-invite", authMiddleWare, acceptInvite);

// Reject Group Invites
router.post("/reject-invite", authMiddleWare, rejectInvite);

// Get all Group Posts
router.get("/posts/:groupId", authMiddleWare, getPostByGroupId);

// Get all Group Video Posts
router.get("/video-posts/:groupId", authMiddleWare, getVideoPostByGroupId);

// Update Group about page
router.put("/about/:groupId", authMiddleWare, updateGroupAboutPage);

// Get My Group Posts
router.get("/myposts/:groupId", authMiddleWare, getMyGroupPosts);

// Get My Group Posts
router.post("/leave/:groupId", authMiddleWare, leaveGroup);

// Get Joined Groups
router.get("/joined", authMiddleWare, getJoinedGroups);

// Get Joined Groups
router.get("/myGroups", authMiddleWare, getMyGroups);

// Get Group suggestions based on interests
router.get("/groups", authMiddleWare, getGroupSuggestion);

module.exports = router;
