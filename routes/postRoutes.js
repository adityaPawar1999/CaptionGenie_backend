const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const { body, validationResult } = require("express-validator"); // Import validation functions
const authenticateToken = require("../middleware/authenticateToken");
const adminMiddleware = require("../middleware/adminMiddleware");

// 🔹 Admin Routes for Post Management
router.get("/admin/all", adminMiddleware, async (req, res) => {
    try {
        const posts = await Post.find().populate('user', 'name username email');
        res.json(posts);
    } catch (error) {
        console.error("🚨 Error fetching posts:", error);
        res.status(500).json({ error: "Server error while fetching posts" });
    }
});

router.put("/admin/update/:id", adminMiddleware, async (req, res) => {
    try {
        const { title, categories, description, links, tags } = req.body;
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Update post fields
        post.title = title || post.title;
        post.categories = categories || post.categories;
        post.description = description || post.description;
        post.links = links || post.links;
        post.tags = tags || post.tags;

        await post.save();
        res.status(200).json({ message: "Post updated successfully by admin", post });
    } catch (error) {
        console.error("🚨 Error updating post:", error);
        res.status(500).json({ error: "Server error while updating post", details: error.message });
    }
});

router.delete("/admin/delete/:id", adminMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        await post.deleteOne();
        res.status(200).json({ message: "Post deleted successfully by admin" });
    } catch (error) {
        console.error("🚨 Error deleting post:", error);
        res.status(500).json({ error: "Server error while deleting post", details: error.message });
    }
});

// 🔹 Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, "../images"); // ✅ Correct folder path
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});

const uploadMiddleware = multer({ storage });


// 🔹 Multer File Filter to Restrict File Types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPG, PNG, and WEBP allowed"), false);
    }
};

// 🔹 Multer Upload Middleware (Max 3 images per post)
const upload = multer({ storage, fileFilter }).array("images", 3);

// 🔹 Create a Post (Protected)
router.post("/create", authenticateToken, (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            console.error("🚨 Multer Error:", err);
            return res.status(500).json({ error: "Multer error while uploading files", details: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log("✅ Incoming Request Body:", req.body);
        console.log("✅ Uploaded Files:", req.files);
        console.log("✅ User from Token:", req.user);

        // 🔹 Ensure `req.files` exists before using `.map()`
        const imagePaths = req.files ? req.files.map((file) => `uploads/${file.filename}`) : [];

        // 🔹 Parse JSON fields safely
        const categories = req.body.categories ? JSON.parse(req.body.categories) : [];
        const links = req.body.links ? JSON.parse(req.body.links) : [];
        const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

        // 🔹 Validate User Authentication
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized: User not authenticated" });
        }

        // 🔹 Create Post
        const newPost = new Post({
            title: req.body.title || "", // Allow empty title
            categories,
            description: req.body.description || "", // Allow empty description
            images: imagePaths,
            links,
            tags,
            user: req.user.id,
        });

        await newPost.save();
        console.log(newPost);
        res.status(201).json({ message: "Post created successfully", post: newPost });

    } catch (error) {
        console.error("🚨 Server Error:", error);
        res.status(500).json({ error: "Server error while creating post", details: error.message });
    }
});

// 🔹 Update Post (Protected)
router.put("/update/:id", authenticateToken, async (req, res) => {
    try {
        const { title, categories, description, links, tags } = req.body;

        // 🔹 Find the post
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // 🔹 Check ownership
        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized: You can only update your own posts" });
        }

        // 🔹 Update Post Fields
        post.title = title || post.title;
        post.categories = categories || post.categories;
        post.description = description || post.description;
        post.links = links || post.links;
        post.tags = tags || post.tags;

        await post.save();
        res.status(200).json({ message: "Post updated successfully", post });

    } catch (error) {
        console.error("🚨 Error updating post:", error);
        res.status(500).json({ error: "Server error while updating post", details: error.message });
    }
});

// 🔹 Delete Post (Protected)
router.delete("/delete/:id", authenticateToken, async (req, res) => {
    try {
        // 🔹 Find the post
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // 🔹 Check ownership
        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized: You can only delete your own posts" });
        }

        await post.deleteOne();
        res.status(200).json({ message: "Post deleted successfully" });

    } catch (error) {
        console.error("🚨 Error deleting post:", error);
        res.status(500).json({ error: "Server error while deleting post", details: error.message });
    }
});

// add likes to post
router.post('/like/:id', authenticateToken, async (req, res) => {
    try {
        console.log("like hits");
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      const userId = req.user.id;
      const index = post.likes.indexOf(userId);
  
      if (index === -1) {
        post.likes.push(userId); // Like post
      } else {
        post.likes.splice(index, 1); // Unlike post
      }
  
      await post.save();
      res.json({ message: 'Like status updated successfully', likes: post.likes });
    } catch (error) {
      console.error('🚨 Error updating like:', error);
      res.status(500).json({ error: 'Server error while updating like' });
    }
  });
  

// 🔹 Add Comment to Post (Protected)
router.post("/comment/:id", authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: "Comment text is required" });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const newComment = {
            user: req.user.id,
            text: text.trim(),
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        // Populate user information for the new comment
        const populatedPost = await Post.findById(post._id)
            .populate('comments.user', 'name username');

        const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

        res.status(201).json({
            message: "Comment added successfully",
            comment: addedComment
        });

    } catch (error) {
        console.error("🚨 Error adding comment:", error);
        res.status(500).json({ error: "Server error while adding comment" });
    }
});

// 🔹 Get Related Posts by Categories (Public)
router.post("/related", async (req, res) => {
    try {
        const { categories } = req.body;
        const { excludePostId } = req.query;
        
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: "Categories array is required" });
        }
        
        // Find posts with matching categories, excluding the current post
        const relatedPosts = await Post.find({
            categories: { $in: categories },
            _id: { $ne: excludePostId }
        })
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(5) // Limit to 5 related posts
        .populate('user', 'name username');
        
        res.json({ posts: relatedPosts });
    } catch (error) {
        console.error("🚨 Error fetching related posts:", error);
        res.status(500).json({ error: "Server error while fetching related posts" });
    }
});
// 🔹 Get All Posts (Public) with optional category filter
router.get("/", async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        
        // If category is provided, filter posts by that category
        if (category) {
            query.categories = category;
        }
        
        const posts = await Post.find(query).populate('user', 'name username email');
        res.json(posts);
    } catch (error) {
        console.error("🚨 Error fetching posts:", error);
        res.status(500).json({ error: "Server error while fetching posts" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching post with ID:', id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('❌ Invalid post ID format:', id);
            return res.status(400).json({ error: "Invalid post ID format" });
        }

        const post = await Post.findById(id).populate('user', 'name username email');
        
        if (!post) {
            console.log('❌ Post not found with ID:', id);
            return res.status(404).json({ error: "Post not found" });
        }

        console.log('✅ Successfully retrieved post:', post._id);
        res.json(post);

    } catch (error) {
        console.error('🚨 Server error while fetching post:', error);
        res.status(500).json({
            error: "Server error while fetching post",
            details: error.message
        });
    }
});

// 🔹 Save Post (Protected)
router.post('/save/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if post is already saved
        if (user.savedPosts.includes(post._id)) {
            return res.status(400).json({ error: 'Post already saved' });
        }

        // Add post to user's saved posts
        user.savedPosts.push(post._id);
        await user.save();

        res.json({ message: 'Post saved successfully' });
    } catch (error) {
        console.error('🚨 Error saving post:', error);
        res.status(500).json({ error: 'Server error while saving post' });
    }
});


router.post('/like/:id', async (req, res) => {
    try {
        console.log("like hits");
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      const index = post.likes.indexOf(userId);
  
      if (index === -1) {
        post.likes.push(userId); // Like post
      } else {
        post.likes.splice(index, 1); // Unlike post
      }
  
      await post.save();
      res.json({ message: 'Like status updated successfully', likes: post.likes });
    } catch (error) {
      console.error('🚨 Error updating like:', error);
      res.status(500).json({ error: 'Server error while updating like' });
    }
  });
  
// 🔹 Add Comment (Protected)
router.post('/comment/:id', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = {
            user: req.user.id,
            text
        };

        post.comments.push(comment);
        await post.save();
        res.json({ message: 'Comment added successfully', comment });
    } catch (error) {
        console.error('🚨 Error adding comment:', error);
        res.status(500).json({ error: 'Server error while adding comment' });
    }
});

// 🔹 Get Comments (Public)
router.get('/comments/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('comments.user', 'name username');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ comments: post.comments });
    } catch (error) {
        console.error('🚨 Error fetching comments:', error);
        res.status(500).json({ error: 'Server error while fetching comments' });
    }
});

// 🔹 Unsave Post (Protected)
router.delete('/unsave/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove post from saved posts
        user.savedPosts = user.savedPosts.filter(postId => postId.toString() !== req.params.id);
        await user.save();

        res.json({ message: 'Post removed from saved posts' });
    } catch (error) {
        console.error('🚨 Error unsaving post:', error);
        res.status(500).json({ error: 'Server error while unsaving post' });
    }
});

// 🔹 Get User's Saved Posts (Protected)
router.get('/saved/posts', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('savedPosts');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.savedPosts);
    } catch (error) {
        console.error('🚨 Error fetching saved posts:', error);
        res.status(500).json({ error: 'Server error while fetching saved posts' });
    }
});



module.exports = router;


