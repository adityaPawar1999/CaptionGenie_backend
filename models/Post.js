const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false, // ✅ Change from true to false
    trim: true,
  },
  description: {
    type: String,
    required: false, // ✅ Change from true to false
    trim: true,
  },
  categories: {
    type: [String],
    default: [],
  },
  images: {
    type: [String],
    default: [],
  },
  links: {
    type: [Object],
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
