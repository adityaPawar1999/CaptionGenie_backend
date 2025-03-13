const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/authRoutes");

const PORT = process.env.PORT || 5010;

dotenv.config();
const app = express();

console.log('Server is running...');

// ✅ Apply middleware in the correct order
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: ["https://captiongenie-nlsq.vercel.app"], // Replace with your frontend URL
  credentials: true // If using cookies or authentication
}));

// ✅ Register routes after middleware
app.use("/api/auth", authRoutes);

// ✅ Connect to MongoDB and start the server


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if the database connection fails
  });



  //aj12@GMAIL.COM 1111