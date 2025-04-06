require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const user = await User.findOneAndUpdate(
            { email: 'adityaPawar@20' },
            { isAdmin: true },
            { new: true }
        );

        if (!user) {
            console.log('User not found with email: adityaPawar@20');
            process.exit(1);
        }

        console.log('Successfully updated user to admin:', user);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

makeAdmin();