import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("ALL");
  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  const [showModal, setShowModal] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    department: "",
    employeeId: "",
  });

  // ==========================================
  // LOAD USERS
  // ==========================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await API.get("/users");

      if (response.data.success) {
        setUsers(
          response.data.users || []
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD DEPARTMENTS
  // ==========================================

  const loadDepartments = async () => {
    try {
      const response =
        await API.get("/departments");

      if (response.data.success) {
        setDepartments(
          response.data.departments || []
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {

      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        user.name
          ?.toLowerCase()
          .includes(searchText) ||
        user.email
          ?.toLowerCase()
          .includes(searchText) ||
        user.employeeId
          ?.toLowerCase()
          .includes(searchText);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const userDepartmentId =
        user.department?._id ||
        user.department ||
        "";

      const matchesDepartment =
        departmentFilter === "ALL" ||
        userDepartmentId ===
          departmentFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesDepartment
      );
    });
  }, [
    users,
    search,
    roleFilter,
    departmentFilter,
  ]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // OPEN CREATE
  // ==========================================

  const openCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "USER",
      department: "",
      employeeId: "",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ==========================================
  // CLOSE
  // ==========================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
  };

  // ==========================================
  // CREATE USER
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError(
        "Name is required."
      );

      return;
    }

    if (!formData.email.trim()) {
      setError(
        "Email is required."
      );

      return;
    }

    if (!formData.password) {
      setError(
        "Password is required."
      );

      return;
    }

    if (
      formData.role !== "ADMIN" &&
      !formData.department
    ) {
      setError(
        "Department is required for HOD and USER."
      );

      return;
    }

    try {
      setSaving(true);

      await API.post(
        "/users",
        {
          name: formData.name.trim(),

          email:
            formData.email
              .trim()
              .toLowerCase(),

          password:
            formData.password,

          role:
            formData.role,

          department:
            formData.department ||
            null,

          employeeId:
            formData.employeeId.trim(),
        }
      );

      setSuccess(
        "User created successfully."
      );

      setShowModal(false);

      await loadUsers();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to create user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // TOGGLE USER STATUS
  // ==========================================

  const toggleUserStatus = async (
    user
  ) => {
    const newStatus = !user.active;

    try {
      setError("");
      setSuccess("");

      await API.patch(
        `/users/${user._id}/status`,
        {
          active: newStatus,
        }
      );

      setSuccess(
        `User ${
          newStatus
            ? "activated"
            : "deactivated"
        } successfully.`
      );

      await loadUsers();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to update user status."
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
            User Management
          </h1>

          <p>
            Create and manage employees
            and department HODs.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={openCreateModal}
        >
          + Create User
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
          FILTERS
      ====================================== */}

      <div className="management-filter-card">

        <div className="filter-search">

          <label>
            Search
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name, email or employee ID..."
          />

        </div>


        <div className="filter-control">

          <label>
            Role
          </label>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="HOD">
              HOD
            </option>

            <option value="USER">
              Employee
            </option>

            <option value="ADMIN">
              Admin
            </option>

          </select>

        </div>


        <div className="filter-control">

          <label>
            Department
          </label>

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
          >

            <option value="ALL">
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department._id}
                  value={department._id}
                >
                  {department.name}
                </option>
              )
            )}

          </select>

        </div>

      </div>


      {/* ======================================
          USER TABLE
      ====================================== */}

      <div className="management-card">

        <div className="management-card-header">

          <div>

            <h2>
              Users
            </h2>

            <p>
              Showing{" "}
              {filteredUsers.length} of{" "}
              {users.length} users
            </p>

          </div>

        </div>


        {loading ? (

          <div className="management-loading">
            Loading users...
          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="management-empty">

            <div className="empty-icon">
              👥
            </div>

            <h3>
              No Users Found
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>

          </div>

        ) : (

          <div className="management-table-wrapper">

            <table className="management-table">

              <thead>

                <tr>

                  <th>
                    User
                  </th>

                  <th>
                    Employee ID
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredUsers.map(
                  (user) => (

                    <tr
                      key={user._id}
                    >

                      <td>

                        <div className="user-table-cell">

                          <div className="user-avatar">
                            {(
                              user.name ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <div className="table-primary">
                              {user.name}
                            </div>

                            <div className="table-secondary">
                              {user.email}
                            </div>

                          </div>

                        </div>

                      </td>


                      <td>

                        <span className="employee-id-badge">
                          {user.employeeId ||
                            "-"}
                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            user.role ===
                            "ADMIN"
                              ? "role-admin"
                              : user.role ===
                                "HOD"
                              ? "role-hod"
                              : "role-user"
                          }
                        >
                          {user.role ===
                          "USER"
                            ? "EMPLOYEE"
                            : user.role}
                        </span>

                      </td>


                      <td>

                        <span className="table-secondary">

                          {user.department
                            ?.name ||
                            "All Departments"}

                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            user.active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {user.active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>


                      <td>

                        <button
                          className={
                            user.active
                              ? "action-disable"
                              : "action-enable"
                          }
                          onClick={() =>
                            toggleUserStatus(
                              user
                            )
                          }
                        >
                          {user.active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

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
          CREATE USER MODAL
      ====================================== */}

      {showModal && (

        <div className="modal-overlay">

          <div className="management-modal user-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Create User
                </h2>

                <p>
                  Create an employee,
                  HOD or admin account.
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

              {/* NAME */}

              <div className="form-group">

                <label>
                  Full Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  disabled={saving}
                />

              </div>


              {/* EMAIL */}

              <div className="form-group">

                <label>
                  Email
                  <span>*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="employee@hospital.com"
                  disabled={saving}
                />

              </div>


              {/* PASSWORD */}

              <div className="form-group">

                <label>
                  Password
                  <span>*</span>
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  placeholder="Enter password"
                  disabled={saving}
                />

              </div>


              {/* ROLE + EMPLOYEE ID */}

              <div className="form-two-columns">

                <div className="form-group">

                  <label>
                    Role
                    <span>*</span>
                  </label>

                  <select
                    name="role"
                    value={
                      formData.role
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >

                    <option value="USER">
                      Employee
                    </option>

                    <option value="HOD">
                      HOD
                    </option>

                    <option value="ADMIN">
                      Admin
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Employee ID
                  </label>

                  <input
                    type="text"
                    name="employeeId"
                    value={
                      formData.employeeId
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="EMP001"
                    disabled={saving}
                  />

                </div>

              </div>


              {/* DEPARTMENT */}

              {formData.role !==
                "ADMIN" && (

                <div className="form-group">

                  <label>
                    Department
                    <span>*</span>
                  </label>

                  <select
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >

                    <option value="">
                      Select Department
                    </option>

                    {departments
                      .filter(
                        (department) =>
                          department.status ===
                          "Active"
                      )
                      .map(
                        (department) => (
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


              {formData.role ===
                "ADMIN" && (

                <div className="admin-info-box">

                  <strong>
                    Admin account
                  </strong>

                  <p>
                    Admin users do not belong
                    to a specific department.
                  </p>

                </div>

              )}


              {/* ACTIONS */}

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
                    ? "Creating..."
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Users;