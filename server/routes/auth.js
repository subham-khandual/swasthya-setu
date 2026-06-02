const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/userAuth", async (req, res) => {
  const { name, email, password, userType } = req.body;
  try {
    console.log(process.env.MONGODB_URI);
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      userType,
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.user = {
      userId: user._id,
      userEmail: user.email,
      userType: user.userType,
      userName: user.name,
    };
    console.log("User session set:", req.session);
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/google-sync", async (req, res) => {
  const { email, name } = req.body;
  try {
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // Auto-register the user if they don't exist
      const placeholderPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      user = new User({
        name: name || email.split("@")[0],
        email,
        password: placeholderPassword,
        userType: "donor", // Default userType
      });
      await user.save();
      isNewUser = true;
      console.log("Auto-registered new Google user:", email);
    } else if (!user.userType) {
      // Ensure existing users have a role
      user.userType = "donor";
      await user.save();
    }

    req.session.user = {
      userId: user._id,
      userEmail: user.email,
      userType: user.userType,
      userName: user.name,
    };
    res.status(200).json({ success: true, message: "Session synchronized", isNewUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/update-role", async (req, res) => {
  const { userType } = req.body;
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findByIdAndUpdate(
      req.session.user.userId,
      { userType },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update session
    req.session.user.userType = user.userType;

    res.status(200).json({ success: true, userType: user.userType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/user", async (req, res) => {
  try {
    if (!req.session.user)
      return res.status(200).json({ authenticated: false, error: "User not authenticated" });
    const user = await User.findById(req.session.user.userId).select(
      "-password"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({
      userName: user.name,
      userId: user._id,
      userEmail: user.email,
      userType: user.userType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
