const express = require("express");
const router = express.Router();
const Post = require("./../models/Post"); // adjust path as needed
const authenticateToken = require("./../middleware/authenticateToken");

// ✅ Like or Unlike a Post
router.put("/like/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      post.likes.pull(userId);
      await post.save();
      return res.json({ message: "Post unliked", likes: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();
      console.log('like saved')
      return res.json({ message: "Post liked", likes: post.likes.length });
    }
  } catch (err) {
    console.error('Error saving like:', err);
    res.status(500).json({ 
      error: "Server error while liking post", 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ✅ Add Comment to a Post
router.post("/comment/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { comment } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = {
      user: req.user.id,
      text: comment,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    res.json({ message: "Comment added", comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: "Server error while adding comment" });
  }
});

// ✅ Get All Comments of a Post
router.get("/comments/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("comments.user", "name username");
    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching comments" });
  }
});

module.exports = router;
