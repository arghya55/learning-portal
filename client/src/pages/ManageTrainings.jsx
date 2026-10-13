import {
  useEffect,
  useMemo,
  useState
} from "react";

import API, {
  serverUrl
} from "../services/api";

import {
  useAuth
} from "../context/AuthContext";

import {
  useNavigate
} from "react-router-dom";


const ManageTrainings = () => {

  const {
    user
  } = useAuth();

  const navigate =
    useNavigate();


  const [
    trainings,
    setTrainings
  ] = useState([]);


  const [
    departments,
    setDepartments
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  const [
    success,
    setSuccess
  ] = useState("");


  const [
    search,
    setSearch
  ] = useState("");


  const [
    departmentFilter,
    setDepartmentFilter
  ] = useState("ALL");


  const [
    statusFilter,
    setStatusFilter
  ] = useState("ALL");


  const [
    editingTraining,
    setEditingTraining
  ] = useState(null);


  const [
    editForm,
    setEditForm
  ] = useState({

    title: "",

    description: "",

    category: "",

    department: "",

    status: "Active"
  });


  const [
    actionLoading,
    setActionLoading
  ] = useState(false);


  // =================================================
  // FORMAT DURATION
  // =================================================

  const formatDuration =
    (seconds = 0) => {

      const totalSeconds =
        Math.floor(
          Number(seconds) || 0
        );


      const hours =
        Math.floor(
          totalSeconds / 3600
        );


      const minutes =
        Math.floor(
          (totalSeconds % 3600) /
          60
        );


      const remainingSeconds =
        totalSeconds % 60;


      if (hours > 0) {

        return `${hours}h ${minutes}m`;

      }


      if (minutes > 0) {

        return `${minutes}m ${remainingSeconds}s`;

      }


      return `${remainingSeconds}s`;
    };


  // =================================================
  // LOAD DATA
  // =================================================

  const loadData =
    async () => {

      try {

        setLoading(true);

        setError("");


        const requests = [
          API.get(
            user?.role === "ADMIN"
              ? `/trainings${
                  statusFilter !== "ALL"
                    ? `?status=${statusFilter}`
                    : ""
                }`
              : "/trainings"
          )
        ];


        if (
          user?.role === "ADMIN"
        ) {

          requests.push(
            API.get(
              "/departments"
            )
          );

        }


        const responses =
          await Promise.all(
            requests
          );


        setTrainings(
          responses[0]
            .data
            .trainings || []
        );


        if (
          user?.role === "ADMIN"
        ) {

          setDepartments(
            responses[1]
              .data
              .departments || []
          );

        }

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.message ||
          "Failed to load trainings"
        );

      } finally {

        setLoading(false);

      }
    };


  useEffect(() => {

    if (user) {
      loadData();
    }

  }, [
    user,
    statusFilter
  ]);


  // =================================================
  // FILTER
  // =================================================

  const filteredTrainings =
    useMemo(() => {

      return trainings.filter(
        training => {

          const searchText =
            search
              .toLowerCase()
              .trim();


          const matchesSearch =
            !searchText ||
            training.title
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            training.category
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            training.description
              ?.toLowerCase()
              .includes(
                searchText
              );


          const matchesDepartment =
            departmentFilter ===
              "ALL" ||
            training.department?._id ===
              departmentFilter;


          const matchesStatus =
            statusFilter ===
              "ALL" ||
            training.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesDepartment &&
            matchesStatus
          );

        }
      );

    }, [
      trainings,
      search,
      departmentFilter,
      statusFilter
    ]);


  // =================================================
  // SUMMARY
  // =================================================

  const totalTrainings =
    trainings.length;


  const activeTrainings =
    trainings.filter(
      training =>
        training.status ===
        "Active"
    ).length;


  const inactiveTrainings =
    trainings.filter(
      training =>
        training.status ===
        "Inactive"
    ).length;


  // =================================================
  // OPEN EDIT
  // =================================================

  const openEdit =
    (training) => {

      setEditingTraining(
        training
      );


      setEditForm({

        title:
          training.title || "",

        description:
          training.description || "",

        category:
          training.category ||
          "General",

        department:
          training.department?._id ||
          "",

        status:
          training.status ||
          "Active"
      });


      setError("");
      setSuccess("");
    };


  // =================================================
  // EDIT CHANGE
  // =================================================

  const handleEditChange =
    (event) => {

      const {
        name,
        value
      } = event.target;


      setEditForm(
        previous => ({
          ...previous,
          [name]: value
        })
      );
    };


  // =================================================
  // UPDATE
  // =================================================

  const handleUpdate =
    async (event) => {

      event.preventDefault();


      if (
        !editForm.title.trim()
      ) {

        setError(
          "Training title is required"
        );

        return;
      }


      try {

        setActionLoading(true);

        setError("");

        setSuccess("");


        await API.put(
          `/trainings/${editingTraining._id}`,
          editForm
        );


        setSuccess(
          "Training updated successfully"
        );


        setEditingTraining(
          null
        );


        await loadData();

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.message ||
          "Failed to update training"
        );

      } finally {

        setActionLoading(false);

      }
    };


  // =================================================
  // TOGGLE STATUS
  // =================================================

  const toggleStatus =
    async (training) => {

      const newStatus =
        training.status ===
          "Active"
          ? "Inactive"
          : "Active";


      try {

        setActionLoading(true);

        setError("");

        setSuccess("");


        await API.put(
          `/trainings/${training._id}`,
          {
            status:
              newStatus
          }
        );


        setSuccess(
          `Training ${newStatus.toLowerCase()} successfully`
        );


        await loadData();

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.message ||
          "Failed to update training status"
        );

      } finally {

        setActionLoading(false);

      }
    };


  // =================================================
  // DELETE
  // =================================================

  const deleteTraining =
    async (training) => {

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${training.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setActionLoading(true);

        setError("");

        setSuccess("");


        await API.delete(
          `/trainings/${training._id}`
        );


        setSuccess(
          "Training deleted successfully"
        );


        await loadData();

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.message ||
          "Failed to delete training"
        );

      } finally {

        setActionLoading(false);

      }
    };


  // =================================================
  // WATCH
  // =================================================

  const watchTraining =
    (id) => {

      navigate(
        `/trainings/${id}`
      );

    };


  // =================================================
  // RENDER
  // =================================================

  return (

    <div className="management-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="management-header">

        <div>

          <div className="management-label">
            TRAINING MANAGEMENT
          </div>

          <h1>
            Training Library
          </h1>

          <p>
            Manage training videos for{" "}
            {user?.role === "ADMIN"
              ? "all departments."
              : "your department."}
          </p>

        </div>


        <button
          className="primary-button"
          onClick={() =>
            navigate(
              "/upload-training"
            )
          }
        >
          + Upload Training
        </button>

      </div>


      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}


      {success && (

        <div className="alert alert-success">
          {success}
        </div>

      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="training-management-summary">

        <div className="training-summary-card">

          <span>
            Total Trainings
          </span>

          <strong>
            {totalTrainings}
          </strong>

        </div>


        <div className="training-summary-card">

          <span>
            Active
          </span>

          <strong>
            {activeTrainings}
          </strong>

        </div>


        <div className="training-summary-card">

          <span>
            Inactive
          </span>

          <strong>
            {inactiveTrainings}
          </strong>

        </div>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="management-filter-card">

        <div className="filter-search">

          <input
            type="text"
            placeholder="Search training..."
            value={search}
            onChange={e =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        {user?.role === "ADMIN" && (

          <div className="filter-control">

            <select
              value={
                departmentFilter
              }
              onChange={e =>
                setDepartmentFilter(
                  e.target.value
                )
              }
            >

              <option value="ALL">
                All Departments
              </option>


              {departments.map(
                department => (

                  <option
                    key={
                      department._id
                    }
                    value={
                      department._id
                    }
                  >
                    {
                      department.name
                    }
                  </option>

                )
              )}

            </select>

          </div>

        )}


        <div className="filter-control">

          <select
            value={
              statusFilter
            }
            onChange={e =>
              setStatusFilter(
                e.target.value
              )
            }
          >

            <option value="ALL">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

          </select>

        </div>

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      {loading ? (

        <div className="management-loading">
          Loading trainings...
        </div>

      ) : filteredTrainings.length === 0 ? (

        <div className="management-empty">

          <div className="empty-icon">
            🎥
          </div>

          <h3>
            No trainings found
          </h3>

          <p>
            Try changing your filters
            or upload a new training.
          </p>

        </div>

      ) : (

        <div className="training-grid">

          {filteredTrainings.map(
            training => (

              <div
                className="training-management-card"
                key={
                  training._id
                }
              >

                {/* =================================================
                    VIDEO
                ================================================= */}

                <div className="training-video-preview">

                  <video
                    src={
                      serverUrl(
                        training.videoUrl
                      )
                    }
                    preload="metadata"
                  />

                  <div className="video-overlay">
                    ▶
                  </div>

                </div>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="training-card-content">

                  <div className="training-card-top">

                    <span className="training-category">

                      {
                        training.category ||
                        "General"
                      }

                    </span>


                    <span
                      className={
                        training.status ===
                        "Active"
                          ? "status-active"
                          : "status-inactive"
                      }
                    >

                      {
                        training.status
                      }

                    </span>

                  </div>


                  <h3>
                    {
                      training.title
                    }
                  </h3>


                  <p className="training-description">

                    {
                      training.description ||
                      "No description available."
                    }

                  </p>


                  {/* =================================================
                      META
                  ================================================= */}

                  <div className="training-meta">

                    <div>

                      <strong>
                        Department
                      </strong>

                      <span>
                        {
                          training
                            .department
                            ?.name ||
                          "-"
                        }
                      </span>

                    </div>


                    <div>

                      <strong>
                        Duration
                      </strong>

                      <span>
                        {formatDuration(
                          training.durationSeconds
                        )}
                      </span>

                    </div>


                    <div>

                      <strong>
                        Uploaded By
                      </strong>

                      <span>
                        {
                          training
                            .uploadedBy
                            ?.name ||
                          "-"
                        }
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="training-card-actions">

                    <button
                      className="secondary-button"
                      onClick={() =>
                        watchTraining(
                          training._id
                        )
                      }
                    >
                      Watch
                    </button>


                    <button
                      className="action-edit"
                      onClick={() =>
                        openEdit(
                          training
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Edit
                    </button>


                    <button
                      className={
                        training.status ===
                        "Active"
                          ? "action-disable"
                          : "action-enable"
                      }
                      onClick={() =>
                        toggleStatus(
                          training
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >

                      {training.status ===
                      "Active"
                        ? "Disable"
                        : "Enable"}

                    </button>


                    <button
                      className="action-delete"
                      onClick={() =>
                        deleteTraining(
                          training
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}


      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {editingTraining && (

        <div
          className="modal-overlay"
          onMouseDown={e => {

            if (
              e.target ===
              e.currentTarget
            ) {

              setEditingTraining(
                null
              );

            }

          }}
        >

          <div className="management-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Edit Training
                </h2>

                <p>
                  Update training information.
                </p>

              </div>


              <button
                className="modal-close"
                onClick={() =>
                  setEditingTraining(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleUpdate
              }
            >

              {/* TITLE */}

              <div className="form-group">

                <label>
                  Training Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={
                    editForm.title
                  }
                  onChange={
                    handleEditChange
                  }
                />

              </div>


              {/* DEPARTMENT */}

              <div className="form-group">

                <label>
                  Department
                </label>


                {user?.role ===
                "HOD" ? (

                  <div className="readonly-field">

                    {
                      trainingDepartmentName(
                        editingTraining
                      )
                    }

                  </div>

                ) : (

                  <select
                    name="department"
                    value={
                      editForm.department
                    }
                    onChange={
                      handleEditChange
                    }
                  >

                    {departments.map(
                      department => (

                        <option
                          key={
                            department._id
                          }
                          value={
                            department._id
                          }
                        >
                          {
                            department.name
                          }
                        </option>

                      )
                    )}

                  </select>

                )}

              </div>


              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  name="category"
                  value={
                    editForm.category
                  }
                  onChange={
                    handleEditChange
                  }
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


              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    editForm.description
                  }
                  onChange={
                    handleEditChange
                  }
                  rows="4"
                />

              </div>


              {/* STATUS */}

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    editForm.status
                  }
                  onChange={
                    handleEditChange
                  }
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

              </div>


              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setEditingTraining(
                      null
                    )
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    actionLoading
                  }
                >

                  {actionLoading
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};


// =================================================
// HELPER
// =================================================

const trainingDepartmentName =
  (training) => {

    return (
      training?.department?.name ||
      "Department"
    );

  };


export default ManageTrainings;