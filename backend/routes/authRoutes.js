const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

// สมัคร (เปิดสาธารณะ) - ในโปรดักชันควรจำกัดหรือให้ admin สร้างให้
router.post("/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" });
    }
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "User exists" });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username,
      passwordHash,
      role: role === "admin" ? "admin" : "user"
    });
    const token = generateToken(user);
    res.json({
      token,
      user: { username: user.username, role: user.role }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Register failed" });
  }
});

// ล็อกอิน
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      token,
      user: { username: user.username, role: user.role }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
