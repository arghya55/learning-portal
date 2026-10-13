import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ======================================
// PROTECT ROUTES
// ======================================

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id)
      .populate("department", "name status");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // Attach complete user to request
    req.user = user;

    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};


// ======================================
// ROLE AUTHORIZATION
// ======================================

export const allowRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ==================================
    // SUPER ADMIN = FULL ACCESS
    // ==================================

    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    // ==================================
    // OTHER ROLES
    // ==================================

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};