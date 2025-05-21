const mongoose = require("mongoose");

const groupBioSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Groups",
    required: true,
  },
  about: { type: String },
  rules: { type: String },
  info: { type: String },
  goals: { type: String },
  category: [{ type: String }],
  tags: [{ type: String }],
});

const GroupBio = mongoose.model("GroupBio", groupBioSchema);
module.exports = GroupBio;
