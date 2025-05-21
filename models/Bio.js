const mongoose = require("mongoose");

const bioSchema = new mongoose.Schema({
  description: { type: String },
  from: { type: String },
  education: { type: String },
  occupation: { type: String },
  hobbies: [{ type: String }],
  socails: [{ type: String }],
});

const Bio = mongoose.model("Bio", bioSchema);

module.exports = Bio;
