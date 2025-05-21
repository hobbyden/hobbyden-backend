const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    coAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    visibility: {
      type: String,
      enum: ["public", "request", "invite"],
      default: "public",
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["member", "admin", "co-admin"],
          default: "member",
        },
      },
    ],
    memberCount: { type: Number, default: 0 },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Posts" }],
    createdAt: { type: Date, default: Date.now() },
    details: { type: mongoose.Schema.Types.ObjectId, ref: "GroupDetails" },
    joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bio: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupBio" }],
  },
  { timestamps: true }
);

const Group = mongoose.model("Groups", groupSchema);

module.exports = Group;
