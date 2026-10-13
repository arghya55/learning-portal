import express from "express";

import Department from "../models/Department.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// GET ALL DEPARTMENTS
// ADMIN / HOD / USER
// =====================================================

router.get("/", protect, async (req, res) => {
  try {
    const departments = await Department.find()
      .sort({ name: 1 });

    res.json({
      success: true,
      count: departments.length,
      departments
    });

  } catch (error) {

    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch departments"
    });
  }
});

// =====================================================
// CREATE DEPARTMENT
// ADMIN ONLY
// =====================================================

router.post(
  "/",
  protect,
  allowRoles("ADMIN"),
  async (req, res) => {

    try {

      const {
        name,
        description
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department name is required"
        });
      }

      const existingDepartment =
        await Department.findOne({
          name: name.trim()
        });

      if (existingDepartment) {
        return res.status(409).json({
          success: false,
          message: "Department already exists"
        });
      }

      const department =
        await Department.create({
          name: name.trim(),
          description:
            description?.trim() || ""
        });

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        department
      });

    } catch (error) {

      console.error(
        "Create department error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to create department"
      });
    }
  }
);

// =====================================================
// UPDATE DEPARTMENT
// ADMIN ONLY
// =====================================================

router.put(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  async (req, res) => {

    try {

      const {
        name,
        description,
        status
      } = req.body;

      const department =
        await Department.findById(
          req.params.id
        );

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found"
        });
      }

      if (name !== undefined) {
        department.name = name.trim();
      }

      if (description !== undefined) {
        department.description =
          description.trim();
      }

      if (
        status !== undefined &&
        ["Active", "Inactive"].includes(status)
      ) {
        department.status = status;
      }

      await department.save();

      res.json({
        success: true,
        message: "Department updated successfully",
        department
      });

    } catch (error) {

      console.error(
        "Update department error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to update department"
      });
    }
  }
);

export default router;