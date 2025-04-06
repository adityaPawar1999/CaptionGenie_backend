const User = require('../models/User');
const jwt = require('jsonwebtoken');

const adminMiddleware = async (req, res, next) => {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        // Add user info to request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token." });
    }
};

module.exports = adminMiddleware;