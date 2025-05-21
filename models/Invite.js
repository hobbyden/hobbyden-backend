const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    sentAt: { type: Date, default: Date.now() },
    expiresAt: {
      type: Date,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

// Create TTL index on expiresAt field
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 }); // Expire after 1 hour

// Middleware to update expiresAt when status is 'accepted' or 'rejected'
inviteSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    (this.status === "accepted" || this.status == "rejected")
  ) {
    this.expiresAt = new Date(); // Expire immediately when status is accepted or rejected
    console.log(`ExpiresAt set to: ${this.expiresAt}`); // Log the expiration time
  }
  next();
});

const Invite = mongoose.model("Invite", inviteSchema);

module.exports = Invite;
