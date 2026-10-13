import express from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Department from "../models/Department.js";

import {
  protect,
  allowRoles,
} from "../middleware/auth.js";

const router = express.Router();


// =====================================================
// GET ALL USERS
// =====================================================

router.get(
  "/",
  protect,
  allowRoles("ADMIN"),
  async (req, res) => {
    try {
      const users = await User.find()
        .populate(
          "department",
          "name status"
        )
        .select("-password")
        .sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        users,
      });

    } catch (error) {

      console.error(
        "Get users error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to fetch users",
      });
    }
  }
);


// =====================================================
// CREATE USER / HOD
// =====================================================

router.post(
  "/",
  protect,
  allowRoles("ADMIN"),
  async (req, res) => {

    try {

      const {
        name,
        email,
        password,
        role,
        department,
        employeeId,
      } = req.body;


      // -----------------------------
      // REQUIRED FIELDS
      // -----------------------------

      if (
        !name ||
        !email ||
        !password ||
        !role ||
        !department
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Name, email, password, role and department are required",
        });

      }


      // -----------------------------
      // VALID ROLE
      // -----------------------------

      if (
        !["HOD", "USER"].includes(
          role
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Only HOD and USER accounts can be created by Admin",
        });

      }


      // -----------------------------
      // CHECK EMAIL
      // -----------------------------

      const normalizedEmail =
        email
          .toLowerCase()
          .trim();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {

        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists",
        });

      }


      // -----------------------------
      // CHECK DEPARTMENT
      // -----------------------------

      const departmentDoc =
        await Department.findById(
          department
        );

      if (!departmentDoc) {

        return res.status(404).json({
          success: false,
          message:
            "Department not found",
        });

      }


      if (
        departmentDoc.status !==
        "Active"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Selected department is inactive",
        });

      }


      // -----------------------------
      // HASH PASSWORD
      // -----------------------------

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );


      // -----------------------------
      // CREATE USER
      // -----------------------------

      const user =
        await User.create({

          name:
            name.trim(),

          email:
            normalizedEmail,

          password:
            hashedPassword,

          role,

          department,

          employeeId:
            employeeId?.trim() ||
            "",

          active: true,

        });


      const safeUser =
        await User.findById(
          user._id
        )
          .populate(
            "department",
            "name status"
          )
          .select("-password");


      res.status(201).json({

        success: true,

        message:
          "User created successfully",

        user:
          safeUser,

      });


    } catch (error) {

      console.error(
        "Create user error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to create user",
      });

    }
  }
);


// =====================================================
// UPDATE USER
// =====================================================

router.put(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  async (req, res) => {

    try {

      const {
        name,
        email,
        password,
        role,
        department,
        employeeId,
      } = req.body;


      const user =
        await User.findById(
          req.params.id
        ).select("+password");


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });

      }


      // -----------------------------
      // VALID ROLE
      // -----------------------------

      if (
        role &&
        !["HOD", "USER"].includes(
          role
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid role",
        });

      }


      // -----------------------------
      // EMAIL CHECK
      // -----------------------------

      if (email) {

        const normalizedEmail =
          email
            .toLowerCase()
            .trim();

        const duplicate =
          await User.findOne({
            email:
              normalizedEmail,

            _id: {
              $ne: user._id,
            },
          });

        if (duplicate) {

          return res.status(409).json({
            success: false,
            message:
              "Another user already uses this email",
          });

        }

        user.email =
          normalizedEmail;
      }


      // -----------------------------
      // DEPARTMENT CHECK
      // -----------------------------

      if (department) {

        const departmentDoc =
          await Department.findById(
            department
          );

        if (!departmentDoc) {

          return res.status(404).json({
            success: false,
            message:
              "Department not found",
          });

        }

        if (
          departmentDoc.status !==
          "Active"
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Selected department is inactive",
          });

        }

        user.department =
          department;
      }


      // -----------------------------
      // UPDATE FIELDS
      // -----------------------------

      if (name !== undefined) {
        user.name =
          name.trim();
      }

      if (
        employeeId !==
        undefined
      ) {
        user.employeeId =
          employeeId.trim();
      }

      if (role !== undefined) {
        user.role = role;
      }


      // -----------------------------
      // PASSWORD
      // -----------------------------

      if (
        password &&
        password.trim()
      ) {

        user.password =
          await bcrypt.hash(
            password,
            12
          );
      }


      await user.save();


      const updatedUser =
        await User.findById(
          user._id
        )
          .populate(
            "department",
            "name status"
          )
          .select("-password");


      res.json({

        success: true,

        message:
          "User updated successfully",

        user:
          updatedUser,

      });


    } catch (error) {

      console.error(
        "Update user error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update user",
      });

    }
  }
);


// =====================================================
// UPDATE USER STATUS
// =====================================================

router.patch(
  "/:id/status",
  protect,
  allowRoles("ADMIN"),
  async (req, res) => {

    try {

      const {
        active,
      } = req.body;


      if (
        typeof active !==
        "boolean"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Active status must be true or false",
        });

      }


      // Prevent Admin from
      // disabling own account

      if (
        req.user._id.toString() ===
        req.params.id
      ) {

        return res.status(400).json({
          success: false,
          message:
            "You cannot deactivate your own account",
        });

      }


      const user =
        await User.findByIdAndUpdate(
          req.params.id,

          {
            active,
          },

          {
            new: true,
          }
        )
          .populate(
            "department",
            "name status"
          )
          .select("-password");


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });

      }


      res.json({

        success: true,

        message:
          `User ${
            active
              ? "activated"
              : "deactivated"
          } successfully`,

        user,

      });


    } catch (error) {

      console.error(
        "Status update error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update user status",
      });

    }
  }
);


export default router;