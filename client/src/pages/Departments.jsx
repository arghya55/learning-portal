import { useEffect, useState } from "react";
import API from "../services/api";

const Departments = () => {
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingDepartment, setEditingDepartment] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active",
  });

  // ==========================================
  // LOAD DEPARTMENTS
  // ==========================================

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await API.get("/departments");

      if (response.data.success) {
        setDepartments(
          response.data.departments || []
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load departments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // OPEN CREATE
  // ==========================================

  const openCreateModal = () => {
    setEditingDepartment(null);

    setFormData({
      name: "",
      description: "",
      status: "Active",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const openEditModal = (department) => {
    setEditingDepartment(department);

    setFormData({
      name: department.name || "",
      description:
        department.description || "",
      status:
        department.status || "Active",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingDepartment(null);
  };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError(
        "Department name is required."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingDepartment) {
        await API.put(
          `/departments/${editingDepartment._id}`,
          {
            name: formData.name.trim(),
            description:
              formData.description.trim(),
            status: formData.status,
          }
        );

        setSuccess(
          "Department updated successfully."
        );
      } else {
        await API.post(
          "/departments",
          {
            name: formData.name.trim(),
            description:
              formData.description.trim(),
          }
        );

        setSuccess(
          "Department created successfully."
        );
      }

      setShowModal(false);

      await loadDepartments();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to save department."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // TOGGLE STATUS
  // ==========================================

  const toggleStatus = async (
    department
  ) => {
    const newStatus =
      department.status === "Active"
        ? "Inactive"
        : "Active";

    try {
      setError("");
      setSuccess("");

      await API.put(
        `/departments/${department._id}`,
        {
          name: department.name,
          description:
            department.description || "",
          status: newStatus,
        }
      );

      setSuccess(
        `Department ${
          newStatus === "Active"
            ? "activated"
            : "deactivated"
        } successfully.`
      );

      await loadDepartments();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to update department status."
      );
    }
  };

  return (
    <div className="management-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="management-header">

        <div>

          <span className="management-label">
            ADMINISTRATION
          </span>

          <h1>
            Department Management
          </h1>

          <p>
            Create and manage hospital
            departments.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={openCreateModal}
        >
          + Create Department
        </button>

      </div>


      {/* ======================================
          MESSAGES
      ====================================== */}

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


      {/* ======================================
          DEPARTMENT TABLE
      ====================================== */}

      <div className="management-card">

        <div className="management-card-header">

          <div>

            <h2>
              Departments
            </h2>

            <p>
              {departments.length} department
              {departments.length !== 1
                ? "s"
                : ""} registered
            </p>

          </div>

        </div>


        {loading ? (

          <div className="management-loading">
            Loading departments...
          </div>

        ) : departments.length === 0 ? (

          <div className="management-empty">

            <div className="empty-icon">
              🏢
            </div>

            <h3>
              No Departments Found
            </h3>

            <p>
              Create your first department
              to get started.
            </p>

          </div>

        ) : (

          <div className="management-table-wrapper">

            <table className="management-table">

              <thead>

                <tr>

                  <th>
                    Department
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {departments.map(
                  (department) => (

                    <tr
                      key={
                        department._id
                      }
                    >

                      <td>

                        <div className="table-primary">
                          🏢{" "}
                          {department.name}
                        </div>

                      </td>

                      <td>

                        <span className="table-secondary">
                          {department.description ||
                            "No description"}
                        </span>

                      </td>

                      <td>

                        <span
                          className={
                            department.status ===
                            "Active"
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {department.status}
                        </span>

                      </td>

                      <td>

                        <span className="table-secondary">
                          {department.createdAt
                            ? new Date(
                                department.createdAt
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </span>

                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            className="action-edit"
                            onClick={() =>
                              openEditModal(
                                department
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className={
                              department.status ===
                              "Active"
                                ? "action-disable"
                                : "action-enable"
                            }
                            onClick={() =>
                              toggleStatus(
                                department
                              )
                            }
                          >
                            {department.status ===
                            "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================
          CREATE / EDIT MODAL
      ====================================== */}

      {showModal && (

        <div className="modal-overlay">

          <div className="management-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingDepartment
                    ? "Edit Department"
                    : "Create Department"}
                </h2>

                <p>
                  {editingDepartment
                    ? "Update department information."
                    : "Add a new hospital department."}
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>
                  Department Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Information Technology"
                  disabled={saving}
                />

              </div>


              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Department description"
                  rows="4"
                  disabled={saving}
                />

              </div>


              {editingDepartment && (

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingDepartment
                    ? "Update Department"
                    : "Create Department"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Departments;