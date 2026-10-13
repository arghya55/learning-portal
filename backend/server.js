import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";

import departmentRoutes from "./routes/departments.js";
import userRoutes from "./routes/users.js";
import trainingRoutes from "./routes/trainings.js";

import dashboardRoutes from "./routes/dashboard.js";
import reportRoutes from "./routes/reports.js";

import departmentWorkspaceRoutes from "./routes/departmentWorkspace.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(morgan("dev"));

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// ======================================
// AUTH ROUTES
// ======================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/departments",
  departmentRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/trainings",
  trainingRoutes
);

// ======================================
// DASHBOARD ROUTES
// ======================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// ======================================
// REPORT ROUTES
// ======================================

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/department",
  departmentWorkspaceRoutes
);

// ======================================
// HEALTH CHECK
// ======================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Learning Portal Backend is running"
  });
});

app.listen(PORT, () => {

  console.log("---------------------------------");
  console.log("Learning Portal Backend");
  console.log(
    `Server: http://localhost:${PORT}`
  );
  console.log("---------------------------------");

});