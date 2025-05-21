const { uploadFileToCloudinary } = require("../config/cloudinary");
const Group = require("../models/Group");
const Post = require("../models/Post");
const User = require("../models/User");
const customResponse = require("../utils/responseHandler");

// Creating a Post
const createPost = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    console.log(userId);

    const { content, hashTags, visibility, isGroup, groupId } = req.body;
    const file = req.file;
    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      mediaUrl = uploadResult?.secure_url;
      mediaType = file.mimetype.startsWith("video") ? "video" : "image";
    }

    const newPost = await new Post({
      user: userId,
      content,
      mediaType,
      mediaUrl,
      hashTags,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      visibility,
      isGroup,
      groupId,
    });

    if (isGroup) {
      const group = await Group.findById(groupId);
      if (!group) {
        return customResponse(res, 404, "Group Not Found");
      }
      group.posts.push(newPost);
      await group.save();
    }
    await newPost.save();
    return customResponse(res, 201, "Post Created Successfully", newPost);
  } catch (error) {
    console.log("error creating post", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get All Posts
const getAllPosts = async (req, res) => {
  try {
    const user = req?.user?.userId;
    console.log(user);
    const posts = await Post.find({ visibility: "public" }).sort({
      createdAt: -1,
    });
    if (!user) {
      return customResponse(res, 401, "Unauthorized");
    }
    return customResponse(
      res,
      200,
      "Get All Posts successfull",
      posts,
      posts.length
    );
  } catch (error) {
    console.log("error Getting all post", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get All Video Posts
const getAllVideoPosts = async (req, res) => {
  try {
    const user = req?.user?.userId;
    console.log(user);
    const posts = await Post.find({ mediaType: "video" }).sort({
      createdAt: -1,
    });
    if (!user) {
      return customResponse(res, 401, "Unauthorized");
    }
    return customResponse(res, 200, "Get All Posts successfull", posts);
  } catch (error) {
    console.log("error Getting all post", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Liking a Post
const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return customResponse(res, 404, "Post not found");
    }

    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // filters out the userId from the post.likes array, effectively removing the like.
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      // decreases the likeCount by 1, but ensures the count doesn't go below 0
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(userId);
      post.likeCount += 1;
    }

    const updatedPost = await post.save();
    return customResponse(
      res,
      201,
      hasLiked ? "Post unliked successfully" : "Post liked successfully",
      updatedPost
    );
  } catch (error) {
    console.log("Error getting likes", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Post comments
const addCommentToPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  const { text } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return customResponse(res, 404, "Post not found");
    }
    post.comments.push({ user: userId, text });
    post.commentCount += 1;

    await post.save();
    return customResponse(res, 201, "Comment added successfully", post);
  } catch (error) {
    console.log("error getting comments", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Add replies to comments
const addReplyToComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.userId;
  const { text } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return customResponse(res, 404, "Post not found");
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return customResponse(res, 404, "Comment not found");
    }

    comment.replies.push({ user: userId, text });
    comment.replyCount += 1;

    await post.save();
    return customResponse(res, 201, "Reply added successfully", post);
  } catch (error) {
    console.log("Error adding reply", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get posts by user Id
const getUserPosts = async (req, res) => {
  try {
    const user = req?.user?.userId;

    if (!user) {
      return customResponse(res, 400, "User id is required to get user post");
    }

    const posts = await Post.find({ user: user }).sort({ createdAt: -1 });
    return customResponse(res, 201, "Get user posts successfull", posts);
  } catch (error) {
    console.log("Error getting user posts", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get posts for friends only
const nonPublicPosts = async (req, res) => {
  try {
    const currentUserId = req?.user?.userId;
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return customResponse(res, 404, "User not found");
    }
    const postAuthor = await Post.find()
      .populate("user", "followers following")
      .sort({ createdAt: -1 });
    const friendPosts = postAuthor.filter((post) => {
      const authorFollowers = post.user.followers;
      const authorFollowing = post.user.following;
      return (
        authorFollowers.includes(currentUserId) &&
        authorFollowing.includes(currentUserId)
      );
    });
    if (friendPosts.length === 0) {
      return customResponse(res, 200, "No Friend Posts");
    }
    return customResponse(
      res,
      200,
      "Friends only post get successfull",
      friendPosts,
      friendPosts.length
    );
  } catch (error) {
    console.log("Error fetching friends only posts", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

// Get trending posts
const getTrendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ visibility: "public" })
      .populate("likes")
      .populate("comments")
      .sort({ createdAt: -1 });

    const trendingPosts = posts.sort((a, b) => {
      const aEngagement = a.likes.length + a.comments.length;
      const bEngagement = b.likes.length + b.comments.length;

      return bEngagement - aEngagement;
    });
    const topTrendingPosts = trendingPosts.slice(0, 5);
    return customResponse(
      res,
      200,
      "Trending posts fetched successfully",
      topTrendingPosts,
      topTrendingPosts.length
    );
  } catch (error) {
    console.log("Error getting trending posts", error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  likePost,
  addCommentToPost,
  addReplyToComment,
  getAllVideoPosts,
  getUserPosts,
  nonPublicPosts,
  getTrendingPosts
};
