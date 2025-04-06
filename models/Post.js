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
  likes: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    default: []
  },
  comments: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      text: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
