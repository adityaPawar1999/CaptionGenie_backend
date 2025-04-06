require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: 'adityaPawar@20' });
        if (existingUser) {
            console.log('User already exists. Updating to admin...');
            existingUser.isAdmin = true;
            await existingUser.save();
            console.log('Successfully updated user to admin:', existingUser);
            process.exit(0);
        }

        // Create new admin user
        const hashedPassword = await bcrypt.hash('@!37fxCbzW@&L*q', 10);
        const newUser = new User({
            name: 'Aditya Pawar',
            email: 'adityaPawar@20',
            password: hashedPassword,
            isAdmin: true
        });

        await newUser.save();
        console.log('Successfully created admin user:', newUser);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createAdminUser();