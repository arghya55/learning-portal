import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const UploadTraining = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    department: "",
  });

  // =========================================================
  // LOAD DEPARTMENTS
  // =========================================================

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        setError("");

        const response = await API.get("/departments");

        console.log("Departments API:", response.data);

        let departmentList = [];

        if (Array.isArray(response.data)) {
          departmentList = response.data;
        } else if (Array.isArray(response.data.departments)) {
          departmentList = response.data.departments;
        } else if (Array.isArray(response.data.data)) {
          departmentList = response.data.data;
        }

        const activeDepartments = departmentList.filter(
          (department) => department.status === "Active"
        );

        setDepartments(activeDepartments);

        // HOD automatically uses own department
        if (user?.role === "HOD" && user?.department?._id) {
          setFormData((previous) => ({
            ...previous,
            department: user.department._id,
          }));
        }
      } catch (err) {
        console.error("Department loading error:", err);

        setDepartments([]);

        setError(
          err.response?.data?.message ||
            "Failed to load departments"
        );
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (user) {
      loadDepartments();
    }
  }, [user]);

  // =========================================================
  // HANDLE TEXT / SELECT INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // FORMAT FILE SIZE
  // =========================================================

  const formatFileSize = (bytes = 0) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // =========================================================
  // FORMAT VIDEO DURATION
  // =========================================================

  const formatDuration = (seconds = 0) => {
    const totalSeconds = Math.floor(Number(seconds) || 0);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  };

  // =========================================================
  // HANDLE VIDEO SELECTION
  // =========================================================

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");
    setVideoDuration(0);

    if (!file) {
      setVideoFile(null);
      return;
    }

    console.log("Selected video:", file);
    console.log("File type:", file.type);
    console.log("File size:", file.size);

    // -------------------------------------------------------
    // ALLOWED VIDEO TYPES
    // -------------------------------------------------------

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only MP4, WebM, OGG and MOV videos are allowed."
      );

      setVideoFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    // -------------------------------------------------------
    // MAX SIZE = 500 MB
    // -------------------------------------------------------

    const maxSize = 500 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Video size must be less than 500 MB."
      );

      setVideoFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    // -------------------------------------------------------
    // SAVE FILE
    // -------------------------------------------------------

    setVideoFile(file);

    // -------------------------------------------------------
    // READ VIDEO DURATION
    // -------------------------------------------------------

    const video = document.createElement("video");

    video.preload = "metadata";

    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const duration = video.duration;

      console.log("Video duration:", duration);

      if (Number.isFinite(duration)) {
        setVideoDuration(Math.floor(duration));
      }

      URL.revokeObjectURL(objectUrl);
    };

    video.onerror = () => {
      console.warn(
        "Could not read video duration."
      );

      setVideoDuration(0);

      URL.revokeObjectURL(objectUrl);
    };

    video.src = objectUrl;
  };

  // =========================================================
  // REMOVE SELECTED VIDEO
  // =========================================================

  const removeVideo = () => {
    setVideoFile(null);
    setVideoDuration(0);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------------------------------
    // TITLE
    // -------------------------------------------------------

    if (!formData.title.trim()) {
      setError("Please enter training title.");
      return;
    }

    // -------------------------------------------------------
    // DEPARTMENT
    // -------------------------------------------------------

    if (!formData.department) {
      setError("Please select department.");
      return;
    }

    // -------------------------------------------------------
    // VIDEO
    // -------------------------------------------------------

    if (!videoFile) {
      setError("Please select a training video.");
      return;
    }

    // -------------------------------------------------------
    // SECURITY CHECK
    // -------------------------------------------------------

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(videoFile.type)) {
      setError(
        "Only MP4, WebM, OGG and MOV videos are allowed."
      );
      return;
    }

    // -------------------------------------------------------
    // SIZE CHECK
    // -------------------------------------------------------

    const maxSize = 500 * 1024 * 1024;

    if (videoFile.size > maxSize) {
      setError(
        "Video size must be less than 500 MB."
      );
      return;
    }

    try {
      setLoading(true);

      // -----------------------------------------------------
      // FORM DATA
      // -----------------------------------------------------

      const data = new FormData();

      data.append(
        "title",
        formData.title.trim()
      );

      data.append(
        "description",
        formData.description.trim()
      );

      data.append(
        "category",
        formData.category
      );

      data.append(
        "department",
        formData.department
      );

      data.append(
        "durationSeconds",
        String(videoDuration || 0)
      );

      data.append(
        "video",
        videoFile
      );

      console.log(
        "Uploading training:",
        {
          title: formData.title,
          department: formData.department,
          category: formData.category,
          durationSeconds: videoDuration,
          fileName: videoFile.name,
        }
      );

      // -----------------------------------------------------
      // UPLOAD
      // -----------------------------------------------------

      await API.post(
        "/trainings",
        data
      );

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setSuccess(
        "Training uploaded successfully."
      );

      // -----------------------------------------------------
      // RESET FORM
      // -----------------------------------------------------

      setFormData({
        title: "",
        description: "",
        category: "General",
        department:
          user?.role === "HOD"
            ? user?.department?._id || ""
            : "",
      });

      setVideoFile(null);
      setVideoDuration(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // -----------------------------------------------------
      // REDIRECT
      // -----------------------------------------------------

      setTimeout(() => {
        navigate("/manage-trainings");
      }, 1000);
    } catch (err) {
      console.error(
        "Training upload error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to upload training."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="management-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="management-header">
        <div>
          <div className="management-label">
            TRAINING MANAGEMENT
          </div>

          <h1>
            Upload Training
          </h1>

          <p>
            Upload a training video for
            department employees.
          </p>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* =====================================================
          FORM CARD
      ===================================================== */}

      <div className="management-card">

        <div className="management-card-header">
          <div>
            <h2>
              Training Information
            </h2>

            <p>
              Enter training details and
              upload the video.
            </p>
          </div>
        </div>

        <form
          className="management-form"
          onSubmit={handleSubmit}
        >

          {/* =================================================
              TITLE
          ================================================= */}

          <div className="form-group">

            <label>
              Training Title
              <span className="required">
                *
              </span>
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Example: Hand Hygiene Training"
              disabled={loading}
            />

          </div>

          {/* =================================================
              DEPARTMENT
          ================================================= */}

          <div className="form-group">

            <label>
              Department
              <span className="required">
                *
              </span>
            </label>

            {user?.role === "HOD" ? (

              <div className="readonly-field">
                {user?.department?.name ||
                  "No Department Assigned"}
              </div>

            ) : (

              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={
                  loading ||
                  loadingDepartments
                }
              >

                <option value="">
                  {loadingDepartments
                    ? "Loading departments..."
                    : "Select Department"}
                </option>

                {Array.isArray(departments) &&
                  departments.map((department) => (
                    <option
                      key={department._id}
                      value={department._id}
                    >
                      {department.name}
                    </option>
                  ))}

              </select>

            )}

          </div>

          {/* =================================================
              CATEGORY
          ================================================= */}

          <div className="form-group">

            <label>
              Training Category
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >

              <option value="General">
                General
              </option>

              <option value="Orientation">
                Orientation
              </option>

              <option value="Safety">
                Safety
              </option>

              <option value="Clinical">
                Clinical
              </option>

              <option value="Compliance">
                Compliance
              </option>

              <option value="SOP">
                SOP
              </option>

              <option value="IT">
                IT
              </option>

              <option value="HR">
                HR
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="form-group">

            <label>
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what employees will learn from this training..."
              rows={5}
              disabled={loading}
            />

          </div>

          {/* =================================================
              VIDEO UPLOAD
          ================================================= */}

          <div className="form-group">

            <label>
              Training Video
              <span className="required">
                *
              </span>
            </label>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              id="training-video"
              type="file"
              accept=".mp4,.webm,.ogg,.mov,video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={handleVideoChange}
              disabled={loading}
              style={{
                display: "none",
              }}
            />

            {/* Clickable upload area */}
            <label
              htmlFor="training-video"
              className="video-upload-box"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "180px",
                padding: "30px",
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                textAlign: "center",
                background: "#f8fafc",
                transition:
                  "all 0.2s ease",
                opacity: loading
                  ? 0.6
                  : 1,
              }}
            >

              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "10px",
                }}
              >
                🎥
              </div>

              <strong
                style={{
                  fontSize: "16px",
                  marginBottom: "6px",
                }}
              >
                Click here to select a video
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                MP4, WebM, OGG or MOV
              </span>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
              >
                Maximum size: 500 MB
              </span>

            </label>

            {/* =================================================
                SELECTED FILE
            ================================================= */}

            {videoFile && (

              <div
                className="selected-file"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: "15px",
                  marginTop: "15px",
                  padding: "15px",
                  borderRadius: "10px",
                  background: "#f1f5f9",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    minWidth: 0,
                  }}
                >

                  <span
                    style={{
                      fontSize: "28px",
                    }}
                  >
                    🎬
                  </span>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >

                    <strong
                      style={{
                        overflow: "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {videoFile.name}
                    </strong>

                    <small>
                      {formatFileSize(
                        videoFile.size
                      )}
                    </small>

                    {videoDuration > 0 && (
                      <small>
                        Duration:{" "}
                        {formatDuration(
                          videoDuration
                        )}
                      </small>
                    )}

                  </div>

                </div>

                <button
                  type="button"
                  onClick={removeVideo}
                  disabled={loading}
                  className="secondary-button"
                >
                  Remove
                </button>

              </div>

            )}

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  "/manage-trainings"
                )
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                loading ||
                !videoFile
              }
            >
              {loading
                ? "Uploading..."
                : "Upload Training"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default UploadTraining;