import express from "express";

import User from "../models/User.js";
import Department from "../models/Department.js";
import Training from "../models/Training.js";
import Progress from "../models/Progress.js";

import {
  protect,
} from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// DASHBOARD SUMMARY
// =====================================================

router.get(
  "/summary",
  protect,
  async (req, res) => {
    try {
      // =================================================
      // SUPER ADMIN DASHBOARD
      // SUPER ADMIN DOES NOT NEED A DEPARTMENT
      // =================================================

      if (req.user.role === "SUPER_ADMIN") {
        const [
          totalUsers,
          totalHods,
          totalDepartments,
          totalTrainings,
          activeUsers,
          activeHods,
          activeDepartments,
        ] = await Promise.all([
          // All normal users
          User.countDocuments({
            role: "USER",
          }),

          // All HODs
          User.countDocuments({
            role: "HOD",
          }),

          // All departments
          Department.countDocuments(),

          // All trainings
          Training.countDocuments(),

          // Active users
          User.countDocuments({
            role: "USER",
            active: true,
          }),

          // Active HODs
          User.countDocuments({
            role: "HOD",
            active: true,
          }),

          // Active departments
          Department.countDocuments({
            status: "Active",
          }),
        ]);

        return res.json({
          success: true,

          role: "SUPER_ADMIN",

          summary: {
            totalUsers,
            totalHods,
            totalDepartments,
            totalTrainings,
            activeUsers,
            activeHods,
            activeDepartments,
          },
        });
      }

      // =================================================
      // ADMIN DASHBOARD
      // =================================================

      if (req.user.role === "ADMIN") {
        const [
          totalUsers,
          totalHods,
          totalDepartments,
          totalTrainings,
          activeUsers,
          activeDepartments,
        ] = await Promise.all([
          User.countDocuments({
            role: "USER",
          }),

          User.countDocuments({
            role: "HOD",
          }),

          Department.countDocuments(),

          Training.countDocuments(),

          User.countDocuments({
            role: "USER",
            active: true,
          }),

          Department.countDocuments({
            status: "Active",
          }),
        ]);

        return res.json({
          success: true,

          role: "ADMIN",

          summary: {
            totalUsers,
            totalHods,
            totalDepartments,
            totalTrainings,
            activeUsers,
            activeDepartments,
          },
        });
      }

      // =================================================
      // HOD / USER MUST HAVE DEPARTMENT
      // =================================================

      if (!req.user.department) {
        return res.status(400).json({
          success: false,
          message:
            "No department assigned to your account",
        });
      }

      const departmentId =
        req.user.department._id;

      // =================================================
      // HOD DASHBOARD
      // =================================================

      if (req.user.role === "HOD") {
        const departmentUsers =
          await User.countDocuments({
            role: "USER",
            department: departmentId,
            active: true,
          });

        const departmentTrainings =
          await Training.find({
            department: departmentId,
            status: "Active",
          }).select("_id");

        const trainingIds =
          departmentTrainings.map(
            (training) => training._id
          );

        const departmentUserIds =
          await User.find({
            role: "USER",
            department: departmentId,
          }).select("_id");

        const userIds =
          departmentUserIds.map(
            (user) => user._id
          );

        const completedCount =
          await Progress.countDocuments({
            user: {
              $in: userIds,
            },

            training: {
              $in: trainingIds,
            },

            completed: true,
          });

        const totalProgressRecords =
          await Progress.countDocuments({
            user: {
              $in: userIds,
            },

            training: {
              $in: trainingIds,
            },
          });

        const pendingCount =
          Math.max(
            departmentUsers *
              trainingIds.length -
              completedCount,
            0
          );

        return res.json({
          success: true,

          role: "HOD",

          department: {
            id: departmentId,
            name: req.user.department.name,
          },

          summary: {
            departmentUsers,

            departmentTrainings:
              trainingIds.length,

            completedCount,

            pendingCount,

            progressRecords:
              totalProgressRecords,
          },
        });
      }

      // =================================================
      // USER DASHBOARD
      // =================================================

      if (req.user.role === "USER") {
        const trainingFilter = {
          department: departmentId,
          status: "Active",
        };

        const departmentTrainings =
          await Training.countDocuments(
            trainingFilter
          );

        const completedCount =
          await Progress.countDocuments({
            user: req.user._id,
            completed: true,
          });

        const pendingCount =
          Math.max(
            departmentTrainings -
              completedCount,
            0
          );

        return res.json({
          success: true,

          role: "USER",

          department: {
            id: departmentId,
            name: req.user.department.name,
          },

          summary: {
            departmentTrainings,
            completedCount,
            pendingCount,
          },
        });
      }

      // =================================================
      // INVALID ROLE
      // =================================================

      return res.status(403).json({
        success: false,
        message: "Invalid user role",
      });

    } catch (error) {
      console.error(
        "Dashboard summary error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load dashboard summary",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);

export default router;