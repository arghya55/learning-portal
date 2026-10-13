import express from "express";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { protect, allowRoles } from "../middleware/auth.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Training from "../models/Training.js";
import Progress from "../models/Progress.js";

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const formatDuration = (seconds = 0) => {
  const total = Math.max(0, Number(seconds) || 0);

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }

  return `${minutes}m ${secs}s`;
};

/* =========================================================
   BUILD REPORT DATA
========================================================= */

const buildReportData = async (req) => {
  const {
    department = "all",
    status = "Active",
    from = "",
    to = ""
  } = req.query;

  const trainingFilter = {};

  /*
    ADMIN:
      Can see every department.

    HOD:
      Can only see own department.
  */

  if (req.user.role === "HOD") {
    if (!req.user.department?._id) {
      throw new Error("HOD has no department assigned");
    }

    trainingFilter.department = req.user.department._id;
  }

  if (
    req.user.role === "ADMIN" &&
    department !== "all" &&
    department
  ) {
    if (!isValidId(department)) {
      throw new Error("Invalid department");
    }

    trainingFilter.department = department;
  }

  /*
    Status:
      Active
      Inactive
      All
  */

  if (status === "Active" || status === "Inactive") {
    trainingFilter.status = status;
  }

  /*
    TRAININGS
  */

  const trainings = await Training.find(trainingFilter)
    .populate("department", "name")
    .sort({
      createdAt: -1
    })
    .lean();

  if (!trainings.length) {
    return [];
  }

  /*
    USER FILTER
  */

  const userFilter = {
    role: "USER",
    active: true
  };

  if (req.user.role === "HOD") {
    userFilter.department = req.user.department._id;
  } else if (
    req.user.role === "ADMIN" &&
    department !== "all" &&
    department
  ) {
    userFilter.department = department;
  }

  const users = await User.find(userFilter)
    .populate("department", "name")
    .select("name email employeeId department")
    .sort({
      name: 1
    })
    .lean();

  /*
    PROGRESS
  */

  const trainingIds = trainings.map((training) => training._id);
  const userIds = users.map((user) => user._id);

  const progressRecords = await Progress.find({
    user: {
      $in: userIds
    },
    training: {
      $in: trainingIds
    }
  })
    .lean();

  const progressMap = new Map();

  progressRecords.forEach((item) => {
    progressMap.set(
      `${item.user.toString()}_${item.training.toString()}`,
      item
    );
  });

  /*
    CREATE EMPLOYEE × TRAINING REPORT
  */

  const report = [];

  users.forEach((user) => {
    trainings.forEach((training) => {
      /*
        Safety check:
        employee and training must belong
        to same department.
      */

      if (
        user.department?._id?.toString() !==
        training.department?._id?.toString()
      ) {
        return;
      }

      const progress = progressMap.get(
        `${user._id.toString()}_${training._id.toString()}`
      );

      const duration = Number(
        training.durationSeconds || 0
      );

      const watchedSeconds = Number(
        progress?.watchedSeconds || 0
      );

      let progressPercentage = 0;

      if (duration > 0) {
        progressPercentage = Math.min(
          100,
          Math.round(
            (watchedSeconds / duration) * 100
          )
        );
      } else if (progress?.completed) {
        progressPercentage = 100;
      }

      const completed = Boolean(
        progress?.completed
      );

      report.push({
        employeeId: user.employeeId || "-",

        employeeName: user.name,

        employeeEmail: user.email,

        department:
          user.department?.name ||
          training.department?.name ||
          "-",

        trainingTitle: training.title,

        category: training.category || "General",

        trainingStatus: training.status,

        durationSeconds: duration,

        duration: formatDuration(duration),

        watchedSeconds,

        watchedDuration:
          formatDuration(watchedSeconds),

        progressPercentage,

        status: completed
          ? "Completed"
          : progressPercentage > 0
          ? "In Progress"
          : "Pending",

        completedAt:
          progress?.completedAt || null,

        completedDate:
          progress?.completedAt
            ? formatDate(progress.completedAt)
            : ""
      });
    });
  });

  /*
    DATE FILTER

    This filter applies to completed date.
  */

  let filteredReport = report;

  if (from) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    filteredReport = filteredReport.filter(
      (row) => {
        if (!row.completedAt) return false;

        return (
          new Date(row.completedAt) >=
          fromDate
        );
      }
    );
  }

  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    filteredReport = filteredReport.filter(
      (row) => {
        if (!row.completedAt) return false;

        return (
          new Date(row.completedAt) <=
          toDate
        );
      }
    );
  }

  return filteredReport;
};

/* =========================================================
   GET REPORT
   GET /api/reports/training
========================================================= */

router.get(
  "/training",
  protect,
  allowRoles("ADMIN", "HOD"),
  async (req, res) => {
    try {
      const report =
        await buildReportData(req);

      res.json({
        success: true,
        count: report.length,
        data: report
      });
    } catch (error) {
      console.error(
        "Training report error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to generate training report"
      });
    }
  }
);

/* =========================================================
   SUMMARY
   GET /api/reports/summary
========================================================= */

router.get(
  "/summary",
  protect,
  allowRoles("ADMIN", "HOD"),
  async (req, res) => {
    try {
      const report =
        await buildReportData(req);

      const total = report.length;

      const completed =
        report.filter(
          (item) =>
            item.status === "Completed"
        ).length;

      const inProgress =
        report.filter(
          (item) =>
            item.status === "In Progress"
        ).length;

      const pending =
        report.filter(
          (item) =>
            item.status === "Pending"
        ).length;

      const completionPercentage =
        total > 0
          ? Math.round(
              (completed / total) * 100
            )
          : 0;

      const employees =
        new Set(
          report.map(
            (item) => item.employeeId
          )
        ).size;

      const trainings =
        new Set(
          report.map(
            (item) => item.trainingTitle
          )
        ).size;

      const departments =
        new Set(
          report.map(
            (item) => item.department
          )
        ).size;

      res.json({
        success: true,
        summary: {
          totalRecords: total,
          employees,
          trainings,
          departments,
          completed,
          inProgress,
          pending,
          completionPercentage
        }
      });
    } catch (error) {
      console.error(
        "Report summary error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to generate report summary"
      });
    }
  }
);

/* =========================================================
   DOWNLOAD CSV
========================================================= */

const sendCSV = (res, report) => {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Email",
    "Department",
    "Training",
    "Category",
    "Training Status",
    "Duration",
    "Watched Duration",
    "Progress %",
    "Status",
    "Completed Date"
  ];

  const escapeCSV = (value) => {
    const stringValue =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return `"${stringValue.replace(
      /"/g,
      '""'
    )}"`;
  };

  const rows = report.map((item) => [
    item.employeeId,
    item.employeeName,
    item.employeeEmail,
    item.department,
    item.trainingTitle,
    item.category,
    item.trainingStatus,
    item.duration,
    item.watchedDuration,
    `${item.progressPercentage}%`,
    item.status,
    item.completedDate
  ]);

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      row.map(escapeCSV).join(",")
    )
  ].join("\n");

  res.setHeader(
    "Content-Type",
    "text/csv; charset=utf-8"
  );

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="training-report.csv"'
  );

  res.send("\uFEFF" + csv);
};

/* =========================================================
   DOWNLOAD EXCEL
========================================================= */

const sendExcel = async (res, report) => {
  const workbook =
    new ExcelJS.Workbook();

  const worksheet =
    workbook.addWorksheet(
      "Training Report"
    );

  worksheet.columns = [
    {
      header: "Employee ID",
      key: "employeeId",
      width: 18
    },
    {
      header: "Employee Name",
      key: "employeeName",
      width: 25
    },
    {
      header: "Email",
      key: "employeeEmail",
      width: 30
    },
    {
      header: "Department",
      key: "department",
      width: 20
    },
    {
      header: "Training",
      key: "trainingTitle",
      width: 35
    },
    {
      header: "Category",
      key: "category",
      width: 18
    },
    {
      header: "Training Status",
      key: "trainingStatus",
      width: 18
    },
    {
      header: "Duration",
      key: "duration",
      width: 15
    },
    {
      header: "Watched",
      key: "watchedDuration",
      width: 15
    },
    {
      header: "Progress %",
      key: "progressPercentage",
      width: 14
    },
    {
      header: "Status",
      key: "status",
      width: 15
    },
    {
      header: "Completed Date",
      key: "completedDate",
      width: 18
    }
  ];

  report.forEach((item) => {
    worksheet.addRow({
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      employeeEmail: item.employeeEmail,
      department: item.department,
      trainingTitle: item.trainingTitle,
      category: item.category,
      trainingStatus: item.trainingStatus,
      duration: item.duration,
      watchedDuration:
        item.watchedDuration,
      progressPercentage:
        `${item.progressPercentage}%`,
      status: item.status,
      completedDate: item.completedDate
    });
  });

  worksheet.getRow(1).font = {
    bold: true
  };

  worksheet.getRow(1).alignment = {
    vertical: "middle"
  };

  worksheet.autoFilter = {
    from: "A1",
    to: "L1"
  };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="training-report.xlsx"'
  );

  await workbook.xlsx.write(res);

  res.end();
};

/* =========================================================
   DOWNLOAD PDF
========================================================= */

const sendPDF = (res, report) => {
  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
    layout: "landscape"
  });

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="training-report.pdf"'
  );

  doc.pipe(res);

  doc
    .fontSize(18)
    .text(
      "Learning Portal - Training Report",
      {
        align: "center"
      }
    );

  doc.moveDown();

  doc
    .fontSize(9)
    .text(
      `Generated: ${new Date().toLocaleString(
        "en-IN"
      )}`
    );

  doc.moveDown();

  const columns = [
    {
      title: "Employee",
      width: 100
    },
    {
      title: "Department",
      width: 75
    },
    {
      title: "Training",
      width: 145
    },
    {
      title: "Progress",
      width: 55
    },
    {
      title: "Status",
      width: 70
    },
    {
      title: "Completed",
      width: 75
    }
  ];

  const startX = 30;
  let y = 100;

  let x = startX;

  doc.fontSize(8);

  columns.forEach((column) => {
    doc
      .rect(
        x,
        y,
        column.width,
        20
      )
      .stroke();

    doc.text(
      column.title,
      x + 3,
      y + 6,
      {
        width:
          column.width - 6
      }
    );

    x += column.width;
  });

  y += 20;

  report.forEach((item) => {
    if (y > 540) {
      doc.addPage();

      y = 40;
    }

    const values = [
      item.employeeName,
      item.department,
      item.trainingTitle,
      `${item.progressPercentage}%`,
      item.status,
      item.completedDate || "-"
    ];

    x = startX;

    values.forEach(
      (value, index) => {
        const column =
          columns[index];

        doc
          .rect(
            x,
            y,
            column.width,
            22
          )
          .stroke();

        doc.text(
          String(value || "-"),
          x + 3,
          y + 6,
          {
            width:
              column.width - 6,
            height: 16,
            ellipsis: true
          }
        );

        x += column.width;
      }
    );

    y += 22;
  });

  doc.end();
};

/* =========================================================
   DOWNLOAD
   GET /api/reports/download?format=xlsx
========================================================= */

router.get(
  "/download",
  protect,
  allowRoles("ADMIN", "HOD"),
  async (req, res) => {
    try {
      const format = (
        req.query.format || "xlsx"
      ).toLowerCase();

      const report =
        await buildReportData(req);

      if (format === "csv") {
        return sendCSV(
          res,
          report
        );
      }

      if (
        format === "xlsx" ||
        format === "excel"
      ) {
        return await sendExcel(
          res,
          report
        );
      }

      if (format === "pdf") {
        return sendPDF(
          res,
          report
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Invalid format. Use csv, xlsx or pdf."
      });
    } catch (error) {
      console.error(
        "Report download error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to download report"
      });
    }
  }
);

export default router;