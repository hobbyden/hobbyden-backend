const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    profilePhoto: { type: String, default: null },
    coverPhoto: { type: String, default: null },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    interests: [{ type: String }], // Updated interests as an array of strings
    // interests: [{ name: { type: String }, category: { type: String } }], // Interests as an array of objects
    createdGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    bio: { type: mongoose.Schema.Types.ObjectId, ref: "Bio" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
