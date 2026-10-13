import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API, { serverUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

import "../Style.css";

const formatDuration = (seconds = 0) => {
  if (!seconds || seconds <= 0) {
    return "Not available";
  }

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
};

const Department = () => {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] =
    useState("overview");

  // ==================================================
  // LOAD DEPARTMENT
  // ==================================================

  const loadDepartment = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await API.get(
        "/department/my"
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to load department."
        );
      }

      setData(response.data);
    } catch (err) {
      console.error(
        "Department loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load department."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartment();
  }, []);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="department-page">
        <div className="department-loading">
          <div className="loading-spinner"></div>

          <p>
            Loading department information...
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <div className="department-page">
        <div className="department-error">
          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to load department
          </h2>

          <p>{error}</p>

          <button
            className="primary-btn"
            onClick={loadDepartment}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const isHOD = user?.role === "HOD";

  const department =
    data.department || {};

  const hod = data.hod;

  const employees =
    data.employees || [];

  const trainings =
    data.trainings || [];

  const stats =
    data.stats || {};

  // ==================================================
  // USER VIEW
  // ==================================================

  const renderEmployeeOverview = () => {
    return (
      <>
        {/* Department Header */}

        <div className="department-hero">
          <div>
            <span className="hero-label">
              MY DEPARTMENT
            </span>

            <h1>
              {department.name}
            </h1>

            <p>
              {department.description ||
                "Department learning and training workspace"}
            </p>
          </div>

          <div className="hero-role">
            <span className="role-badge">
              EMPLOYEE
            </span>

            <strong>
              {data.user?.name}
            </strong>

            {data.user?.employeeId && (
              <small>
                ID: {data.user.employeeId}
              </small>
            )}
          </div>
        </div>

        {/* Stats */}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              👥
            </div>

            <div>
              <span>
                Employees
              </span>

              <strong>
                {stats.employeeCount || 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              🎬
            </div>

            <div>
              <span>
                Training Videos
              </span>

              <strong>
                {stats.trainingCount || 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ✅
            </div>

            <div>
              <span>
                Completed
              </span>

              <strong>
                {stats.completedCount || 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              📊
            </div>

            <div>
              <span>
                My Progress
              </span>

              <strong>
                {stats.overallProgress || 0}%
              </strong>
            </div>
          </div>
        </div>

        {/* Department Info */}

        <div className="content-grid">
          <div className="department-card">
            <div className="card-header">
              <div>
                <h2>
                  Department Information
                </h2>

                <p>
                  Basic information about your department
                </p>
              </div>

              <div className="card-icon">
                🏢
              </div>
            </div>

            <div className="info-list">
              <div className="info-row">
                <span>
                  Department
                </span>

                <strong>
                  {department.name}
                </strong>
              </div>

              <div className="info-row">
                <span>
                  Status
                </span>

                <span className="status-active">
                  {department.status ||
                    "Active"}
                </span>
              </div>

              <div className="info-row">
                <span>
                  HOD
                </span>

                <strong>
                  {hod?.name ||
                    "Not assigned"}
                </strong>
              </div>

              {hod?.email && (
                <div className="info-row">
                  <span>
                    HOD Email
                  </span>

                  <strong>
                    {hod.email}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* HOD Card */}

          <div className="department-card">
            <div className="card-header">
              <div>
                <h2>
                  Department Head
                </h2>

                <p>
                  Your department HOD
                </p>
              </div>

              <div className="card-icon">
                👨‍💼
              </div>
            </div>

            {hod ? (
              <div className="hod-profile">
                <div className="hod-avatar">
                  {hod.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "H"}
                </div>

                <div>
                  <h3>
                    {hod.name}
                  </h3>

                  <span>
                    Head of Department
                  </span>

                  {hod.employeeId && (
                    <small>
                      Employee ID:{" "}
                      {hod.employeeId}
                    </small>
                  )}

                  {hod.email && (
                    <small>
                      {hod.email}
                    </small>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                HOD not assigned
              </div>
            )}
          </div>
        </div>

        {/* Training */}

        <div className="department-card full-width">
          <div className="card-header">
            <div>
              <h2>
                Department Training
              </h2>

              <p>
                Training videos assigned to
                your department
              </p>
            </div>

            <button
              className="secondary-btn"
              onClick={() =>
                navigate("/trainings")
              }
            >
              View All
            </button>
          </div>

          {trainings.length === 0 ? (
            <div className="empty-state">
              <div>
                🎬
              </div>

              <h3>
                No training videos
              </h3>

              <p>
                There are currently no active
                training videos for your department.
              </p>
            </div>
          ) : (
            <div className="training-grid">
              {trainings.map(
                (training) => (
                  <TrainingCard
                    key={training._id}
                    training={training}
                    isHOD={false}
                    navigate={navigate}
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Employees */}

        <div className="department-card full-width">
          <div className="card-header">
            <div>
              <h2>
                Department Employees
              </h2>

              <p>
                Employees working in your department
              </p>
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="empty-state">
              No employees found.
            </div>
          ) : (
            <EmployeeTable
              employees={employees}
              isHOD={false}
            />
          )}
        </div>
      </>
    );
  };

  // ==================================================
  // HOD VIEW
  // ==================================================

  const renderHODOverview = () => {
    return (
      <>
        {/* Hero */}

        <div className="department-hero hod-hero">
          <div>
            <span className="hero-label">
              DEPARTMENT WORKSPACE
            </span>

            <h1>
              {department.name}
            </h1>

            <p>
              Manage your department training
              and monitor employee progress.
            </p>
          </div>

          <div className="hero-role">
            <span className="role-badge hod">
              HOD
            </span>

            <strong>
              {data.user?.name}
            </strong>

            {data.user?.employeeId && (
              <small>
                ID: {data.user.employeeId}
              </small>
            )}
          </div>
        </div>

        {/* HOD Stats */}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              👥
            </div>

            <div>
              <span>
                Employees
              </span>

              <strong>
                {stats.employeeCount || 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              🎬
            </div>

            <div>
              <span>
                Total Trainings
              </span>

              <strong>
                {stats.trainingCount || 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ✅
            </div>

            <div>
              <span>
                Completed
              </span>

              <strong>
                {stats.completedCount || 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              📊
            </div>

            <div>
              <span>
                Department Progress
              </span>

              <strong>
                {stats.overallProgress || 0}%
              </strong>
            </div>
          </div>
        </div>

        {/* Quick Actions */}

        <div className="quick-actions">
          <button
            className="action-btn primary"
            onClick={() =>
              navigate("/upload-training")
            }
          >
            <span>＋</span>

            Upload Training
          </button>

          <button
            className="action-btn"
            onClick={() =>
              navigate("/manage-trainings")
            }
          >
            <span>🎬</span>

            Manage Trainings
          </button>

          <button
            className="action-btn"
            onClick={() =>
              navigate("/reports")
            }
          >
            <span>📊</span>

            Training Reports
          </button>
        </div>

        {/* Department + HOD */}

        <div className="content-grid">
          <div className="department-card">
            <div className="card-header">
              <div>
                <h2>
                  Department Information
                </h2>

                <p>
                  Department details
                </p>
              </div>

              <div className="card-icon">
                🏢
              </div>
            </div>

            <div className="info-list">
              <div className="info-row">
                <span>
                  Department
                </span>

                <strong>
                  {department.name}
                </strong>
              </div>

              <div className="info-row">
                <span>
                  Status
                </span>

                <span className="status-active">
                  {department.status}
                </span>
              </div>

              <div className="info-row">
                <span>
                  Employees
                </span>

                <strong>
                  {stats.employeeCount || 0}
                </strong>
              </div>
            </div>
          </div>

          <div className="department-card">
            <div className="card-header">
              <div>
                <h2>
                  Department Head
                </h2>

                <p>
                  Current HOD
                </p>
              </div>

              <div className="card-icon">
                👨‍💼
              </div>
            </div>

            {hod ? (
              <div className="hod-profile">
                <div className="hod-avatar">
                  {hod.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "H"}
                </div>

                <div>
                  <h3>
                    {hod.name}
                  </h3>

                  <span>
                    Head of Department
                  </span>

                  <small>
                    {hod.email}
                  </small>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                HOD not assigned
              </div>
            )}
          </div>
        </div>

        {/* Employee Progress */}

        <div className="department-card full-width">
          <div className="card-header">
            <div>
              <h2>
                Employee Training Progress
              </h2>

              <p>
                Monitor training completion
                of your department employees
              </p>
            </div>

            <button
              className="secondary-btn"
              onClick={() =>
                navigate("/reports")
              }
            >
              Full Report
            </button>
          </div>

          {data.employeeProgress?.length ===
          0 ? (
            <div className="empty-state">
              No employees found.
            </div>
          ) : (
            <EmployeeProgressTable
              employeeProgress={
                data.employeeProgress || []
              }
            />
          )}
        </div>

        {/* Department Trainings */}

        <div className="department-card full-width">
          <div className="card-header">
            <div>
              <h2>
                Department Training Videos
              </h2>

              <p>
                Training content belonging to
                {` ${department.name}`}
              </p>
            </div>

            <button
              className="primary-small-btn"
              onClick={() =>
                navigate("/upload-training")
              }
            >
              + Upload
            </button>
          </div>

          {trainings.length === 0 ? (
            <div className="empty-state">
              <div>
                🎬
              </div>

              <h3>
                No training videos
              </h3>

              <p>
                Upload your first department
                training video.
              </p>
            </div>
          ) : (
            <div className="training-grid">
              {trainings.map(
                (training) => (
                  <TrainingCard
                    key={training._id}
                    training={training}
                    isHOD
                    navigate={navigate}
                  />
                )
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  // ==================================================
  // MAIN
  // ==================================================

  return (
    <div className="department-page">

      <div className="department-tabs">
        <button
          className={
            activeTab === "overview"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveTab("overview")
          }
        >
          Overview
        </button>

        <button
          className={
            activeTab === "employees"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveTab("employees")
          }
        >
          Employees
        </button>

        <button
          className={
            activeTab === "trainings"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveTab("trainings")
          }
        >
          Training Videos
        </button>
      </div>

      {activeTab === "overview" &&
        (isHOD
          ? renderHODOverview()
          : renderEmployeeOverview())}

      {activeTab === "employees" && (
        <div className="department-card full-width">
          <div className="card-header">
            <div>
              <h2>
                Department Employees
              </h2>

              <p>
                {isHOD
                  ? "Monitor employees in your department."
                  : "Employees in your department."}
              </p>
            </div>
          </div>

          {isHOD ? (
            <EmployeeProgressTable
              employeeProgress={
                data.employeeProgress || []
              }
            />
          ) : (
            <EmployeeTable
              employees={employees}
              isHOD={false}
            />
          )}
        </div>
      )}

      {activeTab === "trainings" && (
        <div className="department-card full-width">
          <div className="card-header">
            <div>
              <h2>
                Department Training Videos
              </h2>

              <p>
                {isHOD
                  ? "Manage training videos for your department."
                  : "Watch training videos assigned to your department."}
              </p>
            </div>

            {isHOD && (
              <button
                className="primary-small-btn"
                onClick={() =>
                  navigate("/upload-training")
                }
              >
                + Upload Training
              </button>
            )}
          </div>

          {trainings.length === 0 ? (
            <div className="empty-state">
              No training videos available.
            </div>
          ) : (
            <div className="training-grid">
              {trainings.map(
                (training) => (
                  <TrainingCard
                    key={training._id}
                    training={training}
                    isHOD={isHOD}
                    navigate={navigate}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ======================================================
// TRAINING CARD
// ======================================================

const TrainingCard = ({
  training,
  isHOD,
  navigate,
}) => {
  const progress =
    training.progress?.progressPercent || 0;

  const completed =
    training.progress?.completed || false;

  return (
    <div className="training-card">

      <div className="training-thumbnail">
        {training.thumbnailUrl ? (
          <img
            src={serverUrl(
              training.thumbnailUrl
            )}
            alt={training.title}
          />
        ) : (
          <div className="video-placeholder">
            🎬
          </div>
        )}

        <div className="play-overlay">
          ▶
        </div>

        {training.status && (
          <span
            className={`training-status ${
              training.status === "Active"
                ? "active"
                : "inactive"
            }`}
          >
            {training.status}
          </span>
        )}
      </div>

      <div className="training-content">

        <span className="training-category">
          {training.category ||
            "General"}
        </span>

        <h3>
          {training.title}
        </h3>

        <p>
          {training.description ||
            "Department training video"}
        </p>

        <div className="training-meta">
          <span>
            ⏱{" "}
            {formatDuration(
              training.durationSeconds
            )}
          </span>

          {isHOD && training.uploadedBy && (
            <span>
              👤{" "}
              {training.uploadedBy.name}
            </span>
          )}
        </div>

        {!isHOD && (
          <div className="training-progress">

            <div className="progress-header">
              <span>
                {completed
                  ? "Completed"
                  : progress > 0
                  ? "In Progress"
                  : "Not Started"}
              </span>

              <strong>
                {progress}%
              </strong>
            </div>

            <div className="progress-bar">
              <div
                className={
                  completed
                    ? "progress-fill completed"
                    : "progress-fill"
                }
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        <button
          className="watch-training-btn"
          onClick={() =>
            navigate(
              `/training/${training._id}`
            )
          }
        >
          ▶{" "}
          {isHOD
            ? "Preview Training"
            : completed
            ? "Watch Again"
            : progress > 0
            ? "Continue"
            : "Start Training"}
        </button>

        {isHOD && (
          <button
            className="manage-training-btn"
            onClick={() =>
              navigate(
                "/manage-trainings"
              )
            }
          >
            ⚙ Manage Training
          </button>
        )}
      </div>
    </div>
  );
};

// ======================================================
// EMPLOYEE TABLE
// ======================================================

const EmployeeTable = ({
  employees,
}) => {
  return (
    <div className="table-wrapper">
      <table className="department-table">
        <thead>
          <tr>
            <th>
              Employee ID
            </th>

            <th>
              Employee Name
            </th>

            <th>
              Email
            </th>

            <th>
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {employees.map(
            (employee) => (
              <tr key={employee._id}>
                <td>
                  {employee.employeeId ||
                    "-"}
                </td>

                <td>
                  <div className="employee-name">
                    <div className="employee-avatar">
                      {employee.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <strong>
                      {employee.name}
                    </strong>
                  </div>
                </td>

                <td>
                  {employee.email}
                </td>

                <td>
                  <span
                    className={
                      employee.active
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {employee.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

// ======================================================
// HOD EMPLOYEE PROGRESS TABLE
// ======================================================

const EmployeeProgressTable = ({
  employeeProgress,
}) => {
  return (
    <div className="table-wrapper">
      <table className="department-table">
        <thead>
          <tr>
            <th>
              Employee
            </th>

            <th>
              Employee ID
            </th>

            <th>
              Completed
            </th>

            <th>
              Training
            </th>

            <th>
              Progress
            </th>

            <th>
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {employeeProgress.map(
            (employee) => (
              <tr key={employee._id}>
                <td>
                  <div className="employee-name">
                    <div className="employee-avatar">
                      {employee.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {employee.name}
                      </strong>

                      <small>
                        {employee.email}
                      </small>
                    </div>
                  </div>
                </td>

                <td>
                  {employee.employeeId ||
                    "-"}
                </td>

                <td>
                  <strong>
                    {employee.completedCount}
                  </strong>
                </td>

                <td>
                  {employee.trainingCount}
                </td>

                <td>
                  <div className="employee-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${employee.progressPercent}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {employee.progressPercent}%
                    </strong>
                  </div>
                </td>

                <td>
                  {employee.progressPercent ===
                  100 ? (
                    <span className="completion-badge completed">
                      Completed
                    </span>
                  ) : employee.progressPercent >
                    0 ? (
                    <span className="completion-badge progress">
                      In Progress
                    </span>
                  ) : (
                    <span className="completion-badge pending">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Department;