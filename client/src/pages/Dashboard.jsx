import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD DASHBOARD SUMMARY
  // ==========================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          "/dashboard/summary"
        );

        if (response.data.success) {
          setSummary(response.data.summary);
        }
      } catch (err) {
        console.error(
          "Dashboard error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="page-loading">
        Loading dashboard...
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="dashboard-error">

        <div className="dashboard-error-icon">
          ⚠️
        </div>

        <h3>
          Dashboard Error
        </h3>

        <p>
          {error}
        </p>

        <button
          className="primary-button"
          onClick={() =>
            window.location.reload()
          }
        >
          Try Again
        </button>

      </div>
    );
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  if (user?.role === "ADMIN") {
    return (
      <AdminDashboard
        user={user}
        summary={summary}
      />
    );
  }

  // ==========================================
  // HOD DASHBOARD
  // ==========================================

  if (user?.role === "HOD") {
    return (
      <HodDashboard
        user={user}
        summary={summary}
      />
    );
  }

  // ==========================================
  // USER DASHBOARD
  // ==========================================

  return (
    <UserDashboard
      user={user}
      summary={summary}
    />
  );
};

export default Dashboard;


/* =================================================
   ADMIN DASHBOARD
================================================= */

const AdminDashboard = ({
  user,
  summary,
}) => {
  return (
    <div className="dashboard-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="dashboard-welcome">

        <div>

          <span className="dashboard-label">
            ADMIN DASHBOARD
          </span>

          <h1>
            Welcome, {user?.name}
          </h1>

          <p>
            Manage departments, employees,
            HODs and hospital training programs.
          </p>

        </div>

        <div className="dashboard-role-badge">
          ADMIN
        </div>

      </div>


      {/* ========================================
          STAT CARDS
      ======================================== */}

      <div className="dashboard-stats">

        <StatCard
          icon="🏢"
          title="Departments"
          value={
            summary?.totalDepartments || 0
          }
          subtitle="Total departments"
        />

        <StatCard
          icon="👥"
          title="Employees"
          value={
            summary?.totalUsers || 0
          }
          subtitle="Registered employees"
        />

        <StatCard
          icon="👨‍💼"
          title="HODs"
          value={
            summary?.totalHods || 0
          }
          subtitle="Department HODs"
        />

        <StatCard
          icon="🎥"
          title="Trainings"
          value={
            summary?.totalTrainings || 0
          }
          subtitle="Training videos"
        />

        <StatCard
          icon="✓"
          title="Active Users"
          value={
            summary?.activeUsers || 0
          }
          subtitle="Currently active"
        />

        <StatCard
          icon="✓"
          title="Active Departments"
          value={
            summary?.activeDepartments || 0
          }
          subtitle="Currently active"
        />

      </div>


      {/* ========================================
          SYSTEM OVERVIEW
      ======================================== */}

      <div className="dashboard-section">

        <div className="section-title">

          <div>
            <h2>
              System Overview
            </h2>

            <p>
              Current learning portal statistics
            </p>
          </div>

        </div>

        <div className="overview-grid">

          <OverviewItem
            label="Total Employees"
            value={
              summary?.totalUsers || 0
          }
          icon="👥"
          />

          <OverviewItem
            label="Total HODs"
            value={
              summary?.totalHods || 0
            }
            icon="👨‍💼"
          />

          <OverviewItem
            label="Training Videos"
            value={
              summary?.totalTrainings || 0
            }
            icon="🎬"
          />

          <OverviewItem
            label="Departments"
            value={
              summary?.totalDepartments || 0
            }
            icon="🏢"
          />

        </div>

      </div>

    </div>
  );
};


/* =================================================
   HOD DASHBOARD
================================================= */

const HodDashboard = ({
  user,
  summary,
}) => {

  const totalTrainings =
    summary?.departmentTrainings || 0;

  const completed =
    summary?.completedCount || 0;

  const pending =
    summary?.pendingCount || 0;

  const percentage =
    totalTrainings > 0
      ? Math.round(
          (completed /
            (completed + pending || 1)) *
            100
        )
      : 0;

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-welcome">

        <div>

          <span className="dashboard-label">
            HOD DASHBOARD
          </span>

          <h1>
            Welcome, {user?.name}
          </h1>

          <p>
            Monitor your department's
            employee training progress.
          </p>

        </div>

        <div className="dashboard-role-badge">
          HOD
        </div>

      </div>


      {/* DEPARTMENT */}

      <div className="department-banner">

        <div className="department-banner-icon">
          🏢
        </div>

        <div>

          <span>
            YOUR DEPARTMENT
          </span>

          <strong>
            {user?.department?.name ||
              "Department"}
          </strong>

        </div>

      </div>


      {/* STATS */}

      <div className="dashboard-stats">

        <StatCard
          icon="👥"
          title="Employees"
          value={
            summary?.departmentUsers || 0
          }
          subtitle="Department employees"
        />

        <StatCard
          icon="🎥"
          title="Trainings"
          value={totalTrainings}
          subtitle="Department trainings"
        />

        <StatCard
          icon="✓"
          title="Completed"
          value={completed}
          subtitle="Completed trainings"
        />

        <StatCard
          icon="⏳"
          title="Pending"
          value={pending}
          subtitle="Pending trainings"
        />

      </div>


      {/* PROGRESS */}

      <div className="dashboard-section">

        <div className="section-title">

          <div>

            <h2>
              Department Training Progress
            </h2>

            <p>
              Overall completion status
            </p>

          </div>

          <strong className="large-percentage">
            {percentage}%
          </strong>

        </div>


        <div className="dashboard-progress">

          <div
            className="dashboard-progress-value"
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>


        <div className="progress-summary">

          <span>
            ✓ {completed} completed
          </span>

          <span>
            ⏳ {pending} pending
          </span>

        </div>

      </div>

    </div>
  );
};


/* =================================================
   USER DASHBOARD
================================================= */

const UserDashboard = ({
  user,
  summary,
}) => {

  const total =
    summary?.departmentTrainings || 0;

  const completed =
    summary?.completedCount || 0;

  const pending =
    summary?.pendingCount || 0;

  const percentage =
    total > 0
      ? Math.round(
          (completed / total) * 100
        )
      : 0;

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-welcome">

        <div>

          <span className="dashboard-label">
            EMPLOYEE DASHBOARD
          </span>

          <h1>
            Welcome, {user?.name}
          </h1>

          <p>
            Continue your department training
            and complete your assigned videos.
          </p>

        </div>

        <div className="dashboard-role-badge">
          EMPLOYEE
        </div>

      </div>


      {/* DEPARTMENT */}

      <div className="department-banner">

        <div className="department-banner-icon">
          🏢
        </div>

        <div>

          <span>
            YOUR DEPARTMENT
          </span>

          <strong>
            {user?.department?.name ||
              "Department"}
          </strong>

        </div>

      </div>


      {/* STATS */}

      <div className="dashboard-stats">

        <StatCard
          icon="🎥"
          title="My Trainings"
          value={total}
          subtitle="Available trainings"
        />

        <StatCard
          icon="✓"
          title="Completed"
          value={completed}
          subtitle="Completed trainings"
        />

        <StatCard
          icon="⏳"
          title="Pending"
          value={pending}
          subtitle="Pending trainings"
        />

        <StatCard
          icon="📊"
          title="Progress"
          value={`${percentage}%`}
          subtitle="Overall completion"
        />

      </div>


      {/* MY PROGRESS */}

      <div className="dashboard-section">

        <div className="section-title">

          <div>

            <h2>
              My Training Progress
            </h2>

            <p>
              Your overall department training
              completion
            </p>

          </div>

          <strong className="large-percentage">
            {percentage}%
          </strong>

        </div>


        <div className="dashboard-progress">

          <div
            className="dashboard-progress-value"
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>


        <div className="progress-summary">

          <span>
            ✓ {completed} completed
          </span>

          <span>
            ⏳ {pending} pending
          </span>

        </div>

      </div>


      {/* STATUS */}

      <div className="training-status-box">

        {percentage === 100 ? (

          <>
            <div className="status-icon">
              🎉
            </div>

            <div>

              <strong>
                All trainings completed!
              </strong>

              <p>
                Great work. You have completed
                all available department trainings.
              </p>

            </div>
          </>

        ) : (

          <>
            <div className="status-icon">
              📚
            </div>

            <div>

              <strong>
                Keep learning
              </strong>

              <p>
                You have {pending} training
                {pending !== 1 ? "s" : ""} remaining
                to complete.
              </p>

            </div>
          </>

        )}

      </div>

    </div>
  );
};


/* =================================================
   STAT CARD
================================================= */

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
}) => {
  return (
    <div className="dashboard-stat-card">

      <div className="stat-card-top">

        <div className="stat-card-icon">
          {icon}
        </div>

      </div>

      <div className="stat-card-value">
        {value}
      </div>

      <div className="stat-card-title">
        {title}
      </div>

      <div className="stat-card-subtitle">
        {subtitle}
      </div>

    </div>
  );
};


/* =================================================
   OVERVIEW ITEM
================================================= */

const OverviewItem = ({
  label,
  value,
  icon,
}) => {
  return (
    <div className="overview-item">

      <div className="overview-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
};