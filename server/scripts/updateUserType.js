const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Fix for ECONNREFUSED on some systems
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function updateUserType() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB Atlas");

    // Find the user before update
    const userBefore = await User.findOne({ email: 'subhamk@gmail.com' });
    if (!userBefore) {
      console.log("ERROR: User with email 'subhamk@gmail.com' not found!");
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log("\n--- BEFORE UPDATE ---");
    console.log("Name:", userBefore.name);
    console.log("Email:", userBefore.email);
    console.log("UserType:", userBefore.userType);
    console.log("ID:", userBefore._id);

    // Update userType from donor to admin
    const result = await User.findOneAndUpdate(
      { email: 'subhamk@gmail.com' },
      { $set: { userType: 'admin' } },
      { new: true }
    );

    console.log("\n--- AFTER UPDATE ---");
    console.log("Name:", result.name);
    console.log("Email:", result.email);
    console.log("UserType:", result.userType);
    console.log("ID:", result._id);

    console.log("\n✅ Successfully updated userType from 'donor' to 'admin'!");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateUserType();
