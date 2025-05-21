const User = require("../models/User");
const customResponse = require("../utils/responseHandler");
const mongoose = require("mongoose");

// Get User Details
const getUserDetails = async (req, res) => {
  try {
    const userId = req?.user?.userId;

    const userExists = await User.findById(userId);
    if (!userExists) {
      return customResponse(res, 401, "Unauthorized");
    }
    return customResponse(res, 200, "User details get successfull", userExists);
  } catch (error) {
    console.log("Erro getting user details", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Follow User
const followUser = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    // console.log(userId);
    const { userToFollow } = req.body;

    if (userId === userToFollow) {
      return customResponse(res, 403, "Cannot follow yourself");
    }

    if (!mongoose.Types.ObjectId.isValid(userToFollow)) {
      return customResponse(res, 400, "Invalid user ID format");
    }

    const currentUser = await User.findById(userId);

    const userExist = await User.findById(userToFollow);

    if (currentUser.following.includes(userToFollow)) {
      return customResponse(res, 404, "User already being followed");
    }

    if (!userExist || !currentUser) {
      return customResponse(res, 404, "User not found");
    }

    currentUser.following.push(userExist);
    currentUser.followingCount = currentUser.following.length;

    userExist.followers.push(currentUser);
    userExist.followerCount = userExist.followers.length;

    await currentUser.save();
    await userExist.save();

    return customResponse(res, 200, "User followed successfully");
  } catch (error) {
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Unfollow User
const unfollowUser = async (req, res) => {
  const { userIdToUnfollow } = req.body;
  const userId = req?.user?.userId;

  if (userId === userIdToUnfollow) {
    return customResponse(res, 400, "You cannot Unfollow yourself");
  }

  try {
    const userToUnfollow = await User.findById(userIdToUnfollow);
    const currentUser = await User.findById(userId);

    if (!currentUser || !userToUnfollow) {
      return customResponse(res, 404, "User not found");
    }

    if (!currentUser.following.includes(userIdToUnfollow)) {
      return customResponse(res, 404, "You are not following this user");
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userIdToUnfollow
    );
    currentUser.followingCount = currentUser.following.length;

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    userToUnfollow.followerCount = userToUnfollow.followers.length;

    await currentUser.save();
    await userToUnfollow.save();

    return customResponse(res, 200, "User Unfollowed successfully");
  } catch (error) {
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get all friend requests
const getAllFriendRequests = async (req, res) => {
  try {
    const loggedInUserId = req?.user?.userId;

    const loggedInUser = await User.findById(loggedInUserId).select(
      "followers following"
    );
    if (!loggedInUser) {
      return customResponse(res, 404, "User not found");
    }

    const pendingRequests = await User.find({
      _id: { $in: loggedInUser.followers, $nin: loggedInUser.following },
    }).select("-password");

    return customResponse(
      res,
      200,
      "user to follow back get successfully",
      pendingRequests
    );
  } catch (error) {
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get all mutual Friends
const getAllMutualFriends = async (req, res) => {
  try {
    const profileUserId = req.params.userId;

    const loggedInUser = await User.findById(profileUserId)
      .select("followers following")
      .populate(
        "followers",
        "username email followerCount followingCount profilePhoto"
      )
      .populate(
        "following",
        "username email followerCount followingCount profilePhoto"
      );
    if (!loggedInUser) {
      return customResponse(res, 404, "User not found");
    }
    const followingUserId = new Set(
      loggedInUser.following.map((user) => user._id.toString())
    );
    const mutualFriends = loggedInUser.followers.filter((follower) =>
      followingUserId.has(follower._id.toString())
    );
    return customResponse(
      res,
      200,
      "Mutual friends get successfully",
      mutualFriends,
      mutualFriends.length
    );
  } catch (error) {
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// common user suggestions
const getUserSuggestions = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;

    const loggedInUser = await User.findById(loggedInUserId).select(
      "followers following"
    );

    if (!loggedInUser) {
      return customResponse(res, 404, "User not found");
    }

    const userSuggestion = await User.find({
      _id: {
        $ne: loggedInUser,
        $nin: [...loggedInUser.followers, ...loggedInUser.following],
      },
    }).select("username profilePhoto email followerCount");

    return customResponse(
      res,
      200,
      "user get successfully for friend request",
      userSuggestion
    );
  } catch (error) {
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Suggest Users based on common Interests
const userCommonInterests = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;

    // Fetch the logged-in user
    const loggedInUser = await User.findById(loggedInUserId).select(
      "followers following interests"
    );

    if (!loggedInUser) {
      return customResponse(res, 404, "User not found");
    }

    // Ensure that interests are available and are not empty
    if (!loggedInUser.interests || loggedInUser.interests.length === 0) {
      return customResponse(res, 404, "No interests found for the user");
    }

    // Use the logged-in user's interests to find other users with similar interests
    const userSuggestion = await User.find({
      _id: {
        $ne: loggedInUserId, // Exclude the logged-in user
        $nin: [...loggedInUser.followers, ...loggedInUser.following], // Exclude users already followed or following
      },
      interests: { $in: loggedInUser.interests }, // Match users with at least one common interest
    }).select("username profilePhoto email followerCount");

    return customResponse(
      res,
      200,
      "Users suggested successfully based on interests",
      userSuggestion
    );
  } catch (error) {
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get users for search
const getUsersForSearch = async (req, res) => {
  try {
    const users = await User.find().select(
      "username profilePhoto email followerCount"
    );
    return customResponse(res, 200, "user get successfully", users);
  } catch (error) {
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

module.exports = {
  getUserDetails,
  followUser,
  getAllFriendRequests,
  unfollowUser,
  getAllMutualFriends,
  getUserSuggestions,
  userCommonInterests,
  getUsersForSearch,
};
