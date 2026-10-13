import express from "express";
import fs from "fs";
import path from "path";

import Training from "../models/Training.js";
import Department from "../models/Department.js";
import Progress from "../models/Progress.js";

import {
  protect,
  allowRoles
} from "../middleware/auth.js";

import { uploadVideo } from "../middleware/upload.js";

const router = express.Router();


// =====================================================
// HELPER - DELETE FILE SAFELY
// =====================================================

const deleteFileSafely = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "File deletion failed:",
      error.message
    );
  }
};


// =====================================================
// GET ALL TRAININGS
// ADMIN / HOD / USER
// =====================================================

router.get(
  "/",
  protect,
  async (req, res) => {
    try {
      const {
        department,
        status
      } = req.query;

      let filter = {};

      // =================================================
      // ADMIN
      // =================================================

      if (req.user.role === "ADMIN") {

        // Admin can see Active + Inactive
        if (
          status === "Active" ||
          status === "Inactive"
        ) {
          filter.status = status;
        }

        // Optional department filter
        if (department) {
          filter.department = department;
        }
      }

      // =================================================
      // HOD / USER
      // ONLY OWN DEPARTMENT + ACTIVE
      // =================================================

      else {

        if (!req.user.department) {
          return res.json({
            success: true,
            count: 0,
            trainings: []
          });
        }

        filter.status = "Active";

        filter.department =
          req.user.department._id;
      }


      // =================================================
      // FIND TRAININGS
      // =================================================

      const trainings =
        await Training.find(filter)
          .populate(
            "department",
            "name status"
          )
          .populate(
            "uploadedBy",
            "name email role"
          )
          .sort({
            createdAt: -1
          });


      // =================================================
      // ADD USER PROGRESS
      // =================================================

      if (req.user.role === "USER") {

        const trainingIds =
          trainings.map(
            training => training._id
          );

        const progressRecords =
          await Progress.find({
            user: req.user._id,
            training: {
              $in: trainingIds
            }
          });


        const progressMap =
          new Map();


        progressRecords.forEach(
          progress => {

            progressMap.set(
              progress.training.toString(),
              progress
            );

          }
        );


        const result =
          trainings.map(
            training => {

              const progress =
                progressMap.get(
                  training._id.toString()
                );


              return {
                ...training.toObject(),

                progress:
                  progress || {
                    watchedSeconds: 0,
                    completed: false,
                    completedAt: null
                  }
              };

            }
          );


        return res.json({
          success: true,
          count: result.length,
          trainings: result
        });
      }


      // =================================================
      // ADMIN / HOD RESPONSE
      // =================================================

      return res.json({
        success: true,
        count: trainings.length,
        trainings
      });

    } catch (error) {

      console.error(
        "Get trainings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch trainings"
      });
    }
  }
);


// =====================================================
// GET SINGLE TRAINING
// ADMIN / HOD / USER
// =====================================================

router.get(
  "/:id",
  protect,
  async (req, res) => {

    try {

      const training =
        await Training.findById(
          req.params.id
        )
          .populate(
            "department",
            "name status"
          )
          .populate(
            "uploadedBy",
            "name email role"
          );


      if (!training) {

        return res.status(404).json({
          success: false,
          message:
            "Training not found"
        });

      }


      // =================================================
      // USER ACCESS
      // =================================================

      if (req.user.role === "USER") {

        if (
          training.status !== "Active"
        ) {

          return res.status(403).json({
            success: false,
            message:
              "This training is inactive"
          });

        }


        if (
          !req.user.department ||
          training.department._id.toString() !==
            req.user.department._id.toString()
        ) {

          return res.status(403).json({
            success: false,
            message:
              "You cannot access this training"
          });

        }


        const progress =
          await Progress.findOne({
            user: req.user._id,
            training: training._id
          });


        return res.json({
          success: true,
          training,
          progress:
            progress || {
              watchedSeconds: 0,
              completed: false,
              completedAt: null
            }
        });
      }


      // =================================================
      // HOD ACCESS
      // =================================================

      if (req.user.role === "HOD") {

        if (
          !req.user.department ||
          training.department._id.toString() !==
            req.user.department._id.toString()
        ) {

          return res.status(403).json({
            success: false,
            message:
              "You can access only your department training"
          });

        }
      }


      // =================================================
      // ADMIN / HOD
      // =================================================

      return res.json({
        success: true,
        training
      });

    } catch (error) {

      console.error(
        "Get single training error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch training"
      });
    }
  }
);


// =====================================================
// UPLOAD TRAINING
// ADMIN / HOD
// =====================================================

router.post(
  "/",
  protect,
  allowRoles("ADMIN", "HOD"),
  uploadVideo.single("video"),

  async (req, res) => {

    try {

      const {
        title,
        description,
        category,
        department,
        durationSeconds
      } = req.body;


      // =================================================
      // VIDEO CHECK
      // =================================================

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message:
            "Training video is required"
        });

      }


      // =================================================
      // TITLE CHECK
      // =================================================

      if (
        !title ||
        !title.trim()
      ) {

        deleteFileSafely(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "Training title is required"
        });

      }


      // =================================================
      // DEPARTMENT CHECK
      // =================================================

      if (!department) {

        deleteFileSafely(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "Department is required"
        });

      }


      // =================================================
      // FIND DEPARTMENT
      // =================================================

      const selectedDepartment =
        await Department.findById(
          department
        );


      if (!selectedDepartment) {

        deleteFileSafely(
          req.file.path
        );

        return res.status(404).json({
          success: false,
          message:
            "Department not found"
        });

      }


      // =================================================
      // ACTIVE DEPARTMENT CHECK
      // =================================================

      if (
        selectedDepartment.status !==
        "Active"
      ) {

        deleteFileSafely(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "Selected department is inactive"
        });

      }


      // =================================================
      // HOD OWN DEPARTMENT CHECK
      // =================================================

      if (req.user.role === "HOD") {

        if (!req.user.department) {

          deleteFileSafely(
            req.file.path
          );

          return res.status(403).json({
            success: false,
            message:
              "HOD has no department assigned"
          });

        }


        if (
          req.user.department._id.toString() !==
          department.toString()
        ) {

          deleteFileSafely(
            req.file.path
          );

          return res.status(403).json({
            success: false,
            message:
              "HOD can upload only to their own department"
          });

        }
      }


      // =================================================
      // VIDEO URL
      // =================================================

      const videoUrl =
        `/uploads/videos/${req.file.filename}`;


      // =================================================
      // CREATE TRAINING
      // =================================================

      const training =
        await Training.create({

          title:
            title.trim(),

          description:
            description
              ? description.trim()
              : "",

          category:
            category
              ? category.trim()
              : "General",

          videoUrl,

          originalFileName:
            req.file.originalname,

          durationSeconds:
            Number(durationSeconds) || 0,

          department,

          uploadedBy:
            req.user._id,

          status:
            "Active"
        });


      // =================================================
      // POPULATE RESPONSE
      // =================================================

      const createdTraining =
        await Training.findById(
          training._id
        )
          .populate(
            "department",
            "name status"
          )
          .populate(
            "uploadedBy",
            "name email role"
          );


      return res.status(201).json({

        success: true,

        message:
          "Training uploaded successfully",

        training:
          createdTraining
      });

    } catch (error) {

      if (req.file) {
        deleteFileSafely(
          req.file.path
        );
      }

      console.error(
        "Upload training error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to upload training"
      });
    }
  }
);


// =====================================================
// UPDATE TRAINING
// ADMIN / HOD
// =====================================================

router.put(
  "/:id",
  protect,
  allowRoles("ADMIN", "HOD"),

  async (req, res) => {

    try {

      const training =
        await Training.findById(
          req.params.id
        );


      if (!training) {

        return res.status(404).json({
          success: false,
          message:
            "Training not found"
        });

      }


      // =================================================
      // HOD OWN DEPARTMENT CHECK
      // =================================================

      if (req.user.role === "HOD") {

        if (
          !req.user.department ||
          training.department.toString() !==
            req.user.department._id.toString()
        ) {

          return res.status(403).json({
            success: false,
            message:
              "You can manage only your department training"
          });

        }
      }


      const {
        title,
        description,
        category,
        status,
        department
      } = req.body;


      // =================================================
      // TITLE
      // =================================================

      if (
        title !== undefined
      ) {

        if (
          !title.trim()
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Training title cannot be empty"
          });

        }

        training.title =
          title.trim();
      }


      // =================================================
      // DESCRIPTION
      // =================================================

      if (
        description !== undefined
      ) {

        training.description =
          description.trim();

      }


      // =================================================
      // CATEGORY
      // =================================================

      if (
        category !== undefined
      ) {

        training.category =
          category.trim();

      }


      // =================================================
      // STATUS
      // =================================================

      if (
        status !== undefined
      ) {

        if (
          !["Active", "Inactive"]
            .includes(status)
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Invalid training status"
          });

        }

        training.status =
          status;
      }


      // =================================================
      // DEPARTMENT
      // ADMIN ONLY
      // =================================================

      if (
        department !== undefined
      ) {

        if (
          req.user.role !== "ADMIN"
        ) {

          return res.status(403).json({
            success: false,
            message:
              "Only Admin can change training department"
          });

        }


        const selectedDepartment =
          await Department.findById(
            department
          );


        if (!selectedDepartment) {

          return res.status(404).json({
            success: false,
            message:
              "Selected department not found"
          });

        }


        if (
          selectedDepartment.status !==
          "Active"
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Selected department is inactive"
          });

        }


        training.department =
          department;
      }


      // =================================================
      // SAVE
      // =================================================

      await training.save();


      const updatedTraining =
        await Training.findById(
          training._id
        )
          .populate(
            "department",
            "name status"
          )
          .populate(
            "uploadedBy",
            "name email role"
          );


      return res.json({

        success: true,

        message:
          "Training updated successfully",

        training:
          updatedTraining
      });

    } catch (error) {

      console.error(
        "Update training error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update training"
      });
    }
  }
);


// =====================================================
// DELETE TRAINING
// ADMIN / HOD
// =====================================================

router.delete(
  "/:id",
  protect,
  allowRoles("ADMIN", "HOD"),

  async (req, res) => {

    try {

      const training =
        await Training.findById(
          req.params.id
        );


      if (!training) {

        return res.status(404).json({
          success: false,
          message:
            "Training not found"
        });

      }


      // =================================================
      // HOD ACCESS CHECK
      // =================================================

      if (req.user.role === "HOD") {

        if (
          !req.user.department ||
          training.department.toString() !==
            req.user.department._id.toString()
        ) {

          return res.status(403).json({
            success: false,
            message:
              "You can delete only your department training"
          });

        }
      }


      // =================================================
      // DELETE VIDEO FILE
      // =================================================

      if (training.videoUrl) {

        const relativePath =
          training.videoUrl.replace(
            /^\/uploads[\\/]/,
            ""
          );


        const videoPath =
          path.join(
            process.cwd(),
            "uploads",
            relativePath
          );


        deleteFileSafely(
          videoPath
        );
      }


      // =================================================
      // DELETE PROGRESS
      // =================================================

      await Progress.deleteMany({
        training:
          training._id
      });


      // =================================================
      // DELETE TRAINING
      // =================================================

      await Training.findByIdAndDelete(
        training._id
      );


      return res.json({
        success: true,
        message:
          "Training deleted successfully"
      });

    } catch (error) {

      console.error(
        "Delete training error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete training"
      });
    }
  }
);


// =====================================================
// SAVE USER PROGRESS
// USER ONLY
// =====================================================

router.post(
  "/:id/progress",
  protect,
  allowRoles("USER"),

  async (req, res) => {

    try {

      const {
        watchedSeconds,
        completed
      } = req.body;


      const training =
        await Training.findById(
          req.params.id
        );


      if (!training) {

        return res.status(404).json({
          success: false,
          message:
            "Training not found"
        });

      }


      // =================================================
      // ACTIVE CHECK
      // =================================================

      if (
        training.status !==
        "Active"
      ) {

        return res.status(403).json({
          success: false,
          message:
            "This training is inactive"
        });

      }


      // =================================================
      // DEPARTMENT ACCESS
      // =================================================

      if (
        !req.user.department ||
        training.department.toString() !==
          req.user.department._id.toString()
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You cannot access this training"
        });

      }


      // =================================================
      // SAFE VALUES
      // =================================================

      const safeWatchedSeconds =
        Math.max(
          0,
          Number(watchedSeconds) || 0
        );


      const safeCompleted =
        Boolean(completed);


      // =================================================
      // UPSERT
      // =================================================

      const progress =
        await Progress.findOneAndUpdate(

          {
            user:
              req.user._id,

            training:
              training._id
          },

          {
            $set: {

              watchedSeconds:
                safeWatchedSeconds,

              completed:
                safeCompleted,

              completedAt:
                safeCompleted
                  ? new Date()
                  : null
            }
          },

          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );


      return res.json({

        success: true,

        message:
          "Training progress saved",

        progress
      });

    } catch (error) {

      console.error(
        "Progress error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save progress"
      });
    }
  }
);


export default router;