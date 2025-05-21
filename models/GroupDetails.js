const mongoose = require("mongoose");

const groupDetailsSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Groups",
    required: true,
  },
  description: { type: String },
  aboutUs: { type: String },
  rules: { type: String },
  goals: { type: String },
});

const GroupDetails = mongoose.model("GroupDetails", groupDetailsSchema);

module.exports = GroupDetails;
