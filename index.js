const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5010;

// ✅ Check for MONGO_URI
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

// ✅ Middleware
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));


app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "https://captiongenie-nlsq.vercel.app"], 
  credentials: true
}));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

console.log("🚀 Server is starting...");

// ✅ MongoDB Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
