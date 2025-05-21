const Group = require("../../models/Group");
const GroupBio = require("../../models/GroupBio");
const Post = require("../../models/Post");
const User = require("../../models/User");
const customResponse = require("../../utils/responseHandler");
const mongoose = require("mongoose");

// Create Group
const createGroup = async (req, res) => {
  try {
    const userId = req?.user?.userId;

    const {
      title,
      coAdmins = [],
      visibility = "public",
      members = [],
      posts = [],
      details = null,
      memberCount,
    } = req.body;

    const newGroup = await new Group({
      admin: userId,
      title,
      coAdmins,
      visibility,
      members: [{ user: userId, role: "admin" }],
      memberCount,
      posts,
      details,
    });
    const savedGroup = await newGroup.save();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { createdGroups: savedGroup._id } },
      { new: true }
    );

    return customResponse(res, 201, "Group created successfully", {
      group: newGroup,
      user: updatedUser,
    });
  } catch (error) {
    console.log("error creating post", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Get Group details
const getGroupDetails = async (req, res) => {
  try {
    const groupId = req.params.groupId; // Fix typo here (from 'prams' to 'params')

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await Group.findById(groupId).populate({
      path: "members.user", // Correct the path to 'members.user'
      select: "username", // Specify which fields to select from the User model (optional)
    });

    if (!group) {
      return customResponse(res, 404, "Group does not exist");
    }

    return customResponse(
      res,
      200,
      "Group details fetched successfully",
      group
    );
  } catch (error) {
    console.log("Error getting group details", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Follow Group
const followGroup = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    const groupId = req.params.groupId;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(groupId)
    ) {
      return res.status(400).json({ message: "Invalid user ID or group ID" });
    }

    const group = await Group.findById(groupId).populate({
      path: "members.user",
    });

    if (!group) {
      return customResponse(res, 404, "Group not found");
    }

    if (group.visibility === "invite" || group.visibility === "request") {
      return customResponse(
        res,
        400,
        "Request to join is required for this group"
      );
    }

    const isMember = group.members.some(
      (member) => member.user._id.toString() === userId.toString()
    );

    if (isMember) {
      return res
        .status(400)
        .json({ message: "You are already a member of this group" });
    }

    group.members.push({ user: userId, role: "member" });
    group.memberCount = group.members.length;
    await group.save();

    // Update the user's joinedGroups field
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { joinedGroups: groupId } },
      { new: true }
    );
    return customResponse(res, 200, "Joined the group successfully", {
      group,
      user,
    });
  } catch (error) {
    console.log("Error joining group:", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Request for joining group
const joinRequestGroup = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId);

    if (!group) {
      return customResponse(res, 404, "Group not found");
    }

    if (group.visibility !== "request") {
      return customResponse(
        res,
        400,
        "This group doesn't require join requests"
      );
    }

    if (group.joinRequests.includes(userId)) {
      return customResponse(res, 400, "Request has already been sent");
    }

    if (
      group.members.some(
        (member) => member.user.toString() === userId.toString()
      )
    ) {
      return customResponse(res, 400, "You are already a member of this group");
    }

    group.joinRequests.push(userId);
    await group.save();

    return customResponse(res, 200, "Join request sent successfully", {
      group,
    });
  } catch (error) {
    console.log("Error sending request:", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Get all requests
const getAllRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId).populate({
      path: "joinRequests",
      select: "username",
    });

    if (!group) {
      return customResponse(res, 404, "Group does not exist");
    }

    if (group.admin.toString() !== userId.toString()) {
      return customResponse(res, 403, "Only admins are authorized");
    }

    const requests = group.joinRequests;
    return customResponse(res, 200, "Request Get successfull", requests);
  } catch (error) {
    console.log("Error getting requests", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Accept/decline join request
const respondToJoinRequest = async (req, res) => {
  try {
    const { action } = req.body;
    const userId = req?.user?.userId;
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId);
    if (!group) {
      return customResponse(res, 404, "Group not found");
    }

    if (group.admin.toString() !== userId.toString()) {
      return customResponse(
        res,
        403,
        "Only admins can approve/reject join requests"
      );
    }

    const requestedUserId = req.body.userId;
    if (!requestedUserId) {
      return customResponse(res, 400, "request user id is empty");
    }
    if (!group.joinRequests.includes(requestedUserId)) {
      return customResponse(
        res,
        400,
        "This user has not requested to join the group"
      );
    }

    if (action === "approve") {
      group.members.push({ user: requestedUserId, role: "member" });
      group.memberCount = group.members.length;
    }

    group.joinRequests = group.joinRequests.filter(
      (user) => user.toString() !== requestedUserId.toString()
    );

    await group.save();

    return customResponse(
      res,
      200,
      action === "approve" ? "User added to the group" : "Join request rejected"
    );
  } catch (error) {
    console.log("Error responding to join request:", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Get all posts by Group
const getPostByGroupId = async (req, res) => {
  try {
    const GroupId = req.params.groupId;

    const groupExist = await Group.findById(GroupId);

    if (!groupExist) {
      return customResponse(res, 404, "Group Not Found");
    }

    const groupPosts = await Post.find({ groupId: GroupId });

    return customResponse(
      res,
      200,
      "Get Group Posts successfull",
      groupPosts,
      groupPosts.length
    );
  } catch (error) {
    console.log("error getting group posts", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get Videos of Groups
const getVideoPostByGroupId = async (req, res) => {
  try {
    const GroupId = req.params.groupId;

    const groupExist = await Group.findById(GroupId);

    if (!groupExist) {
      return customResponse(res, 404, "Group Not Found");
    }

    const groupPosts = await Post.find({
      groupId: GroupId,
      mediaType: "video",
    });

    return customResponse(
      res,
      200,
      "Get Group Video Posts successfull",
      groupPosts,
      groupPosts.length
    );
  } catch (error) {
    console.log("error getting group posts", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Update Group About Page
const updateGroupAboutPage = async (req, res) => {
  try {
    const user = req?.user?.userId;
    const { groupId } = req.params;
    const { about, rules, info, goals, category } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return customResponse(res, 404, "Group not found");
    }
    const isAdmin = group.admin.toString() === user;
    if (!isAdmin) {
      return customResponse(res, 401, "Unauthorized");
    }

    if (!about || !rules || !info || !goals || !category) {
      return customResponse(res, 400, "All fields are required");
    }

    let bio = await GroupBio.findOneAndUpdate(
      { group: groupId },
      { about, rules, info, goals, category },
      { new: true, runValidators: true, upsert: true }
    );

    await bio.save();
    await Group.findByIdAndUpdate(groupId, { bio: bio._id });

    return customResponse(
      res,
      200,
      "group about page updated successfully",
      bio
    );
  } catch (error) {
    console.log("Error updating Group about", error);
    return customResponse(res, 500, "Internal Server error");
  }
};

// Get Users all posts in Group
const getMyGroupPosts = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    // console.log(userId);
    const { groupId } = req.params;
    if (!userId || !groupId) {
      return customResponse(res, 400, "userId and groupId required");
    }
    const groupExist = await Group.findById(groupId);
    if (!groupExist) {
      return customResponse(res, 404, "Group not found");
    }
    const groupPosts = await Post.find({ groupId: groupId });
    const myPosts = groupPosts.filter((post) => {
      const userPost = post.user.toString() === userId;
      // console.log(userPost);
      return userPost;
    });
    return customResponse(
      res,
      200,
      "My Group Posts get successfull",
      myPosts,
      myPosts.length
    );
  } catch (error) {
    console.log("Error getting my posts", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Get Joined Groups
const getJoinedGroups = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    // const groupId = req.params.groupId

    const ObjUserId = new mongoose.Types.ObjectId(userId);

    const joinedGroups = await Group.find({ "members.user": ObjUserId });
    if (joinedGroups.length === 0) {
      return customResponse(res, 404, "No groups found for this user");
    }

    return customResponse(
      res,
      200,
      "My Joined Groups get successfull",
      joinedGroups,
      joinedGroups.length
    );
  } catch (error) {
    console.log("Error getting joied groups", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Get my Groups
const getMyGroups = async (req, res) => {
  try {
    const userId = req?.user?.userId;

    const ObjUserId = new mongoose.Types.ObjectId(userId);

    const isMyGroup = await Group.find({ admin: ObjUserId });

    if (isMyGroup.length < 1) {
      return customResponse(res, 404, "No Groups found");
    }
    return customResponse(
      res,
      200,
      "Groups found successfully",
      isMyGroup,
      isMyGroup.length
    );
  } catch (error) {
    console.log("Error getting my groups", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Group suggestion based on users interests
const getGroupSuggestion = async (req, res) => {
  try {
    const userId = req?.user?.userId;

    const userInterests = await User.findById(userId).select("interests");

    if (!userInterests || userInterests.length === 0) {
      return customResponse(res, 200, "Interests empty");
    }

    const groupCategories = await Group.find()
      .select("bio")
      .populate("bio", "category");

    const suggestedGroups = groupCategories.filter((group) => {
      // The result is then "flattened," meaning that if there were multiple category arrays in bio, they would be combined into a single array.
      const groupCategories = group.bio.flatMap((bio) => bio.category);
      return userInterests.interests.some((interest) =>
        groupCategories.includes(interest)
      );
    });

    return customResponse(res, 200, "Success", suggestedGroups);
  } catch (error) {
    console.log("Error getting group suggestions", error);
    return customResponse(res, 500, "Internal server error");
  }
};

// Leave Group
const leaveGroup = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    const groupId = req.params.groupId;

    const user = await User.findById(userId);
    const group = await Group.findById(groupId);

    if (!user || !group) {
      return customResponse(res, 404, "User or Group not found");
    }
    const userExist = group.members.toString().includes(userId);
    if (!userExist) {
      return customResponse(res, 404, "You are not a member of this group");
    }
    group.members = group.members.filter(
      (member) => member.user.toString() !== userId
    );
    group.memberCount = group.memberCount > 0 ? group.memberCount - 1 : 0;
    const updatedGroup = await group.save();
    if (!updatedGroup) {
      return customResponse(res, 500, "Failed to update group");
    }
    return customResponse(res, 200, "Group left successfully");
  } catch (error) {
    console.log("error leaving group", error);
    return customResponse(res, 500, "Internal server error");
  }
};

module.exports = {
  createGroup,
  followGroup,
  joinRequestGroup,
  respondToJoinRequest,
  getAllRequests,
  getGroupDetails,
  getPostByGroupId,
  getVideoPostByGroupId,
  updateGroupAboutPage,
  getMyGroupPosts,
  getJoinedGroups,
  getMyGroups,
  getGroupSuggestion,
  leaveGroup,
};
