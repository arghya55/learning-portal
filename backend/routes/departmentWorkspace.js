import express from "express";

import { protect, allowRoles } from "../middleware/auth.js";

import User from "../models/User.js";
import Department from "../models/Department.js";
import Training from "../models/Training.js";
import Progress from "../models/Progress.js";

const router = express.Router();

/*
=========================================================
GET MY DEPARTMENT
=========================================================

USER:
- Own department
- HOD
- Employees
- Active trainings
- Own basic information

HOD:
- Own department
- Employees
- All department trainings
- Employee progress
- Training statistics
=========================================================
*/

router.get(
  "/my",
  protect,
  allowRoles("USER", "HOD"),
  async (req, res) => {
    try {
      const loggedInUser = req.user;

      // --------------------------------------------------
      // CHECK DEPARTMENT
      // --------------------------------------------------

      if (!loggedInUser.department) {
        return res.status(400).json({
          success: false,
          message: "You are not assigned to any department.",
        });
      }

      const departmentId = loggedInUser.department._id;

      // --------------------------------------------------
      // GET DEPARTMENT
      // --------------------------------------------------

      const department = await Department.findById(departmentId).lean();

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found.",
        });
      }

      // --------------------------------------------------
      // GET HOD
      // --------------------------------------------------

      const hod = await User.findOne({
        role: "HOD",
        department: departmentId,
        active: true,
      })
        .select("name email employeeId")
        .lean();

      // --------------------------------------------------
      // GET EMPLOYEES
      // --------------------------------------------------

      const employees = await User.find({
        role: "USER",
        department: departmentId,
      })
        .select("name email employeeId active createdAt")
        .sort({ name: 1 })
        .lean();

      // --------------------------------------------------
      // GET TRAININGS
      // --------------------------------------------------

      const trainingQuery = {
        department: departmentId,
      };

      // USER should only see active videos
      if (loggedInUser.role === "USER") {
        trainingQuery.status = "Active";
      }

      const trainings = await Training.find(trainingQuery)
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      // --------------------------------------------------
      // BASIC STATS
      // --------------------------------------------------

      const activeTrainings = trainings.filter(
        (training) => training.status === "Active"
      );

      const inactiveTrainings = trainings.filter(
        (training) => training.status === "Inactive"
      );

      // --------------------------------------------------
      // USER RESPONSE
      // --------------------------------------------------

      if (loggedInUser.role === "USER") {
        const ownProgress = await Progress.find({
          user: loggedInUser._id,
          training: {
            $in: activeTrainings.map((training) => training._id),
          },
        }).lean();

        const progressMap = {};

        ownProgress.forEach((item) => {
          progressMap[String(item.training)] = item;
        });

        const trainingData = activeTrainings.map((training) => {
          const progress = progressMap[String(training._id)];

          let progressPercent = 0;

          if (progress?.completed) {
            progressPercent = 100;
          } else if (
            progress?.watchedSeconds &&
            training.durationSeconds > 0
          ) {
            progressPercent = Math.min(
              100,
              Math.round(
                (progress.watchedSeconds /
                  training.durationSeconds) *
                  100
              )
            );
          }

          return {
            ...training,
            progress: {
              watchedSeconds: progress?.watchedSeconds || 0,
              completed: progress?.completed || false,
              completedAt: progress?.completedAt || null,
              progressPercent,
            },
          };
        });

        const completedCount = trainingData.filter(
          (training) => training.progress.completed
        ).length;

        const inProgressCount = trainingData.filter(
          (training) =>
            !training.progress.completed &&
            training.progress.watchedSeconds > 0
        ).length;

        const pendingCount =
          trainingData.length -
          completedCount -
          inProgressCount;

        const overallProgress =
          trainingData.length > 0
            ? Math.round(
                (completedCount / trainingData.length) * 100
              )
            : 0;

        return res.json({
          success: true,

          role: "USER",

          user: {
            _id: loggedInUser._id,
            name: loggedInUser.name,
            email: loggedInUser.email,
            employeeId: loggedInUser.employeeId,
            role: loggedInUser.role,
            active: loggedInUser.active,
          },

          department,

          hod,

          employees,

          trainings: trainingData,

          stats: {
            employeeCount: employees.length,
            trainingCount: activeTrainings.length,
            completedCount,
            inProgressCount,
            pendingCount,
            overallProgress,
          },
        });
      }

      // ==================================================
      // HOD RESPONSE
      // ==================================================

      const activeTrainingIds = activeTrainings.map(
        (training) => training._id
      );

      // --------------------------------------------------
      // GET ALL DEPARTMENT PROGRESS
      // --------------------------------------------------

      const progressRecords = await Progress.find({
        user: {
          $in: employees.map((employee) => employee._id),
        },
        training: {
          $in: activeTrainingIds,
        },
      }).lean();

      // --------------------------------------------------
      // CREATE PROGRESS MAP
      // --------------------------------------------------

      const progressMap = {};

      progressRecords.forEach((record) => {
        const key =
          String(record.user) +
          "_" +
          String(record.training);

        progressMap[key] = record;
      });

      // --------------------------------------------------
      // EMPLOYEE PROGRESS
      // --------------------------------------------------

      const employeeProgress = employees.map((employee) => {
        const employeeTrainingProgress =
          activeTrainings.map((training) => {
            const key =
              String(employee._id) +
              "_" +
              String(training._id);

            const progress = progressMap[key];

            return {
              trainingId: training._id,

              trainingTitle: training.title,

              watchedSeconds:
                progress?.watchedSeconds || 0,

              completed:
                progress?.completed || false,

              completedAt:
                progress?.completedAt || null,
            };
          });

        const completedCount =
          employeeTrainingProgress.filter(
            (item) => item.completed
          ).length;

        const trainingCount = activeTrainings.length;

        const progressPercent =
          trainingCount > 0
            ? Math.round(
                (completedCount / trainingCount) * 100
              )
            : 0;

        return {
          _id: employee._id,

          name: employee.name,

          email: employee.email,

          employeeId: employee.employeeId,

          active: employee.active,

          completedCount,

          trainingCount,

          progressPercent,

          trainings: employeeTrainingProgress,
        };
      });

      // --------------------------------------------------
      // DEPARTMENT TOTALS
      // --------------------------------------------------

      const totalEmployees = employees.length;

      const totalTrainingAssignments =
        totalEmployees * activeTrainings.length;

      const totalCompleted = employeeProgress.reduce(
        (total, employee) =>
          total + employee.completedCount,
        0
      );

      const totalInProgress = employeeProgress.reduce(
        (total, employee) => {
          const count = employee.trainings.filter(
            (training) =>
              !training.completed &&
              training.watchedSeconds > 0
          ).length;

          return total + count;
        },
        0
      );

      const totalPending =
        totalTrainingAssignments -
        totalCompleted -
        totalInProgress;

      const departmentProgress =
        totalTrainingAssignments > 0
          ? Math.round(
              (totalCompleted /
                totalTrainingAssignments) *
                100
            )
          : 0;

      // --------------------------------------------------
      // FINAL HOD RESPONSE
      // --------------------------------------------------

      return res.json({
        success: true,

        role: "HOD",

        user: {
          _id: loggedInUser._id,
          name: loggedInUser.name,
          email: loggedInUser.email,
          employeeId: loggedInUser.employeeId,
          role: loggedInUser.role,
          active: loggedInUser.active,
        },

        department,

        hod,

        employees,

        trainings,

        employeeProgress,

        stats: {
          employeeCount: totalEmployees,

          trainingCount: trainings.length,

          activeTrainingCount:
            activeTrainings.length,

          inactiveTrainingCount:
            inactiveTrainings.length,

          totalAssignments:
            totalTrainingAssignments,

          completedCount: totalCompleted,

          inProgressCount: totalInProgress,

          pendingCount: totalPending,

          overallProgress: departmentProgress,
        },
      });
    } catch (error) {
      console.error(
        "MY DEPARTMENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load department information.",
        error: error.message,
      });
    }
  }
);

export default router;