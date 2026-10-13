import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const Reports = () => {
  const { user } = useAuth();

  // =========================================================
  // REPORT DATA
  // =========================================================

  const [report, setReport] = useState([]);

  const [summary, setSummary] = useState({
    totalRecords: 0,
    employees: 0,
    trainings: 0,
    departments: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    completionPercentage: 0,
  });

  // =========================================================
  // DEPARTMENTS
  // =========================================================

  const [departments, setDepartments] = useState([]);

  // IMPORTANT:
  // Department filter must be a string, not an array.
  const [department, setDepartment] = useState("all");

  // =========================================================
  // FILTERS
  // =========================================================

  const [status, setStatus] = useState("Active");

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  // =========================================================
  // UI STATES
  // =========================================================

  const [loading, setLoading] = useState(false);

  const [downloading, setDownloading] = useState("");

  const [error, setError] = useState("");

  // =========================================================
  // LOAD DEPARTMENTS
  // =========================================================

  const loadDepartments = async () => {
    try {
      const response = await API.get("/departments");

      console.log("Departments API response:", response.data);

      let departmentList = [];

      // API returns array directly
      if (Array.isArray(response.data)) {
        departmentList = response.data;
      }

      // API returns:
      // { success: true, departments: [...] }
      else if (Array.isArray(response.data?.departments)) {
        departmentList = response.data.departments;
      }

      // API returns:
      // { success: true, data: [...] }
      else if (Array.isArray(response.data?.data)) {
        departmentList = response.data.data;
      }

      // API returns:
      // { data: { departments: [...] } }
      else if (Array.isArray(response.data?.data?.departments)) {
        departmentList = response.data.data.departments;
      }

      setDepartments(departmentList);
    } catch (err) {
      console.error("Department loading error:", err);

      setDepartments([]);

      setError(
        err.response?.data?.message ||
          "Failed to load departments"
      );
    }
  };

  // =========================================================
  // BUILD REPORT PARAMETERS
  // =========================================================

  const buildParams = () => {
    const params = {};

    // Training status
    if (status) {
      params.status = status;
    }

    // ADMIN can filter by department.
    // HOD department is handled by backend.
    if (
      user?.role === "ADMIN" &&
      department &&
      department !== "all"
    ) {
      params.department = department;
    }

    // Completed date range
    if (from) {
      params.from = from;
    }

    if (to) {
      params.to = to;
    }

    return params;
  };

  // =========================================================
  // LOAD REPORT
  // =========================================================

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const params = buildParams();

      console.log("Report params:", params);

      const [reportResponse, summaryResponse] =
        await Promise.all([
          API.get("/reports/training", {
            params,
          }),

          API.get("/reports/summary", {
            params,
          }),
        ]);

      console.log(
        "Training report response:",
        reportResponse.data
      );

      console.log(
        "Summary response:",
        summaryResponse.data
      );

      // =====================================================
      // REPORT RESPONSE
      // =====================================================

      const reportData =
        Array.isArray(reportResponse.data)
          ? reportResponse.data
          : Array.isArray(reportResponse.data?.data)
          ? reportResponse.data.data
          : Array.isArray(reportResponse.data?.report)
          ? reportResponse.data.report
          : [];

      setReport(reportData);

      // =====================================================
      // SUMMARY RESPONSE
      // =====================================================

      const summaryData =
        summaryResponse.data?.summary ||
        summaryResponse.data?.data ||
        summaryResponse.data ||
        {};

      setSummary({
        totalRecords:
          Number(summaryData.totalRecords) || 0,

        employees:
          Number(summaryData.employees) || 0,

        trainings:
          Number(summaryData.trainings) || 0,

        departments:
          Number(summaryData.departments) || 0,

        completed:
          Number(summaryData.completed) || 0,

        inProgress:
          Number(summaryData.inProgress) || 0,

        pending:
          Number(summaryData.pending) || 0,

        completionPercentage:
          Number(summaryData.completionPercentage) || 0,
      });
    } catch (err) {
      console.error("Report loading error:", err);

      setReport([]);

      setSummary({
        totalRecords: 0,
        employees: 0,
        trainings: 0,
        departments: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        completionPercentage: 0,
      });

      setError(
        err.response?.data?.message ||
          "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadDepartments();
    }
  }, [user]);

  // =========================================================
  // LOAD REPORT WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    loadReports();
  }, [
    user,
    department,
    status,
    from,
    to,
  ]);

  // =========================================================
  // DOWNLOAD REPORT
  // =========================================================

  const downloadReport = async (format) => {
    try {
      setDownloading(format);
      setError("");

      const params = {
        ...buildParams(),
        format,
      };

      console.log(
        `Downloading ${format} report with params:`,
        params
      );

      const response = await API.get(
        "/reports/download",
        {
          params,
          responseType: "blob",
        }
      );

      // =====================================================
      // CHECK IF SERVER RETURNED AN ERROR AS BLOB
      // =====================================================

      if (
        response.data?.type ===
        "application/json"
      ) {
        const text =
          await response.data.text();

        try {
          const json = JSON.parse(text);

          throw new Error(
            json.message ||
              `Failed to download ${format} report`
          );
        } catch (parseError) {
          throw new Error(
            `Failed to download ${format} report`
          );
        }
      }

      // =====================================================
      // FILE EXTENSION
      // =====================================================

      let extension = format;

      if (format === "excel") {
        extension = "xlsx";
      }

      if (format === "xlsx") {
        extension = "xlsx";
      }

      // =====================================================
      // CREATE BLOB
      // =====================================================

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers[
              "content-type"
            ] || "application/octet-stream",
        }
      );

      // =====================================================
      // CREATE DOWNLOAD URL
      // =====================================================

      const url =
        window.URL.createObjectURL(blob);

      // =====================================================
      // CREATE LINK
      // =====================================================

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `training-report-${new Date()
          .toISOString()
          .slice(0, 10)}.${extension}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      // =====================================================
      // CLEAN URL
      // =====================================================

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Report download error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          `Failed to download ${format} report`
      );
    } finally {
      setDownloading("");
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    try {
      return new Date(date).toLocaleDateString(
        "en-IN"
      );
    } catch {
      return date;
    }
  };

  // =========================================================
  // SAFE PROGRESS
  // =========================================================

  const getProgress = (value) => {
    const progress = Number(value);

    if (Number.isNaN(progress)) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, Math.round(progress))
    );
  };

  // =========================================================
  // SAFE STATUS CLASS
  // =========================================================

  const getStatusClass = (value) => {
    if (!value) {
      return "status-pending";
    }

    return `status-${String(value)
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="management-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="management-header">

        <div>
          <div className="management-label">
            REPORTING
          </div>

          <h1>
            Training Reports
          </h1>

          <p>
            Monitor employee training
            completion and progress.
          </p>
        </div>

      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* ===================================================
          FILTER CARD
      =================================================== */}

      <div className="management-card">

        <div className="management-card-header">

          <div>
            <h2>
              Report Filters
            </h2>

            <p>
              Filter training performance
              before downloading.
            </p>
          </div>

        </div>

        <div className="management-form">

          {/* =================================================
              DEPARTMENT
              ADMIN ONLY
          ================================================= */}

          {user?.role === "ADMIN" && (
            <div className="form-group">

              <label>
                Department
              </label>

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Departments
                </option>

                {Array.isArray(
                  departments
                ) &&
                  departments.map(
                    (dept) => (
                      <option
                        key={dept._id}
                        value={dept._id}
                      >
                        {dept.name}
                      </option>
                    )
                  )}

              </select>

            </div>
          )}

          {/* =================================================
              TRAINING STATUS
          ================================================= */}

          <div className="form-group">

            <label>
              Training Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
            >

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="all">
                All
              </option>

            </select>

          </div>

          {/* =================================================
              FROM DATE
          ================================================= */}

          <div className="form-group">

            <label>
              Completed From
            </label>

            <input
              type="date"
              value={from}
              onChange={(e) =>
                setFrom(
                  e.target.value
                )
              }
            />

          </div>

          {/* =================================================
              TO DATE
          ================================================= */}

          <div className="form-group">

            <label>
              Completed To
            </label>

            <input
              type="date"
              value={to}
              onChange={(e) =>
                setTo(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "20px",
          }}
        >

          {/* REFRESH */}

          <button
            type="button"
            onClick={loadReports}
            disabled={
              loading ||
              downloading !== ""
            }
            className="btn btn-primary"
          >
            {loading
              ? "Loading..."
              : "Refresh Report"}
          </button>

          {/* EXCEL */}

          <button
            type="button"
            onClick={() =>
              downloadReport("xlsx")
            }
            disabled={
              downloading !== "" ||
              loading
            }
            className="btn btn-success"
          >
            {downloading === "xlsx"
              ? "Downloading..."
              : "Download Excel"}
          </button>

          {/* CSV */}

          <button
            type="button"
            onClick={() =>
              downloadReport("csv")
            }
            disabled={
              downloading !== "" ||
              loading
            }
            className="btn btn-secondary"
          >
            {downloading === "csv"
              ? "Downloading..."
              : "Download CSV"}
          </button>

          {/* PDF */}

          <button
            type="button"
            onClick={() =>
              downloadReport("pdf")
            }
            disabled={
              downloading !== "" ||
              loading
            }
            className="btn btn-danger"
          >
            {downloading === "pdf"
              ? "Downloading..."
              : "Download PDF"}
          </button>

        </div>

      </div>

      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <div className="stats-grid">

        {/* EMPLOYEES */}

        <div className="stat-card">

          <span>
            Employees
          </span>

          <strong>
            {summary.employees || 0}
          </strong>

        </div>

        {/* TRAININGS */}

        <div className="stat-card">

          <span>
            Trainings
          </span>

          <strong>
            {summary.trainings || 0}
          </strong>

        </div>

        {/* COMPLETED */}

        <div className="stat-card">

          <span>
            Completed
          </span>

          <strong>
            {summary.completed || 0}
          </strong>

        </div>

        {/* IN PROGRESS */}

        <div className="stat-card">

          <span>
            In Progress
          </span>

          <strong>
            {summary.inProgress || 0}
          </strong>

        </div>

        {/* PENDING */}

        <div className="stat-card">

          <span>
            Pending
          </span>

          <strong>
            {summary.pending || 0}
          </strong>

        </div>

        {/* COMPLETION */}

        <div className="stat-card">

          <span>
            Completion
          </span>

          <strong>
            {summary.completionPercentage ||
              0}
            %
          </strong>

        </div>

      </div>

      {/* ===================================================
          REPORT TABLE
      =================================================== */}

      <div className="management-card">

        <div className="management-card-header">

          <div>

            <h2>
              Employee Training Report
            </h2>

            <p>
              {report.length} records
            </p>

          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="loading-state">
            Loading report...
          </div>
        ) : report.length === 0 ? (

          /* EMPTY */

          <div className="empty-state">
            No report data found.
          </div>

        ) : (

          /* TABLE */

          <div className="table-wrapper">

            <table className="management-table">

              <thead>

                <tr>

                  <th>
                    Employee ID
                  </th>

                  <th>
                    Employee
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Training
                  </th>

                  <th>
                    Duration
                  </th>

                  <th>
                    Progress
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Completed
                  </th>

                </tr>

              </thead>

              <tbody>

                {Array.isArray(report) &&
                  report.map(
                    (item, index) => {

                      const progress =
                        getProgress(
                          item.progressPercentage
                        );

                      return (
                        <tr
                          key={
                            `${item.employeeId || "employee"}-${item.trainingTitle || "training"}-${index}`
                          }
                        >

                          {/* EMPLOYEE ID */}

                          <td>
                            {item.employeeId ||
                              "-"}
                          </td>

                          {/* EMPLOYEE */}

                          <td>

                            <strong>
                              {item.employeeName ||
                                "-"}
                            </strong>

                            <br />

                            <small>
                              {item.employeeEmail ||
                                "-"}
                            </small>

                          </td>

                          {/* DEPARTMENT */}

                          <td>
                            {item.department ||
                              "-"}
                          </td>

                          {/* TRAINING */}

                          <td>

                            <strong>
                              {item.trainingTitle ||
                                "-"}
                            </strong>

                            <br />

                            <small>
                              {item.category ||
                                "General"}
                            </small>

                          </td>

                          {/* DURATION */}

                          <td>
                            {item.duration ||
                              "00:00"}
                          </td>

                          {/* PROGRESS */}

                          <td>

                            <strong>
                              {progress}%
                            </strong>

                            <div
                              style={{
                                width:
                                  "100px",
                                height:
                                  "6px",
                                background:
                                  "#e5e7eb",
                                borderRadius:
                                  "10px",
                                marginTop:
                                  "6px",
                                overflow:
                                  "hidden",
                              }}
                            >

                              <div
                                style={{
                                  width:
                                    `${progress}%`,
                                  height:
                                    "100%",
                                  background:
                                    "currentColor",
                                  borderRadius:
                                    "10px",
                                }}
                              />

                            </div>

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`status-badge ${getStatusClass(
                                item.status
                              )}`}
                            >
                              {item.status ||
                                "Pending"}
                            </span>

                          </td>

                          {/* COMPLETED */}

                          <td>
                            {item.completedDate
                              ? formatDate(
                                  item.completedDate
                                )
                              : "-"}
                          </td>

                        </tr>
                      );
                    }
                  )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default Reports;