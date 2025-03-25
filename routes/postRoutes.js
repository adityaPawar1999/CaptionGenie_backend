const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const { body, validationResult } = require("express-validator"); // Import validation functions
const authenticateToken = require("./authenticateToken");

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

// 🔹 Get All Posts (Public)
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find().populate('user', 'name username email');
        res.json(posts);
    } catch (error) {
        console.error("🚨 Error fetching posts:", error);
        res.status(500).json({ error: "Server error while fetching posts" });
    }
});
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    console.log('am hit single')
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    try {
      const post = await Post.findById(id).populate('user', 'name username email');
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Server error", details: error.message });
    }
});

module.exports = router;


