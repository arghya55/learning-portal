import express from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ======================================
// LOGIN
// ======================================

router.post("/login", async (req, res) => {
  try {

    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    })
      .select("+password")
      .populate(
        "department",
        "name status"
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive"
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      active: user.active
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ======================================
// CURRENT USER
// ======================================

router.get("/me", protect, async (req, res) => {

  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      employeeId: req.user.employeeId,
      active: req.user.active
    }
  });

});

export default router;