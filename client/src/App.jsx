import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Departments from "./pages/Departments";
import Department from "./pages/Department";
import Users from "./pages/Users";

import Trainings from "./pages/Trainings";

import UploadTraining from "./pages/UploadTraining";
import ManageTrainings from "./pages/ManageTrainings";
import TrainingWatch from "./pages/TrainingWatch";

import Reports from "./pages/Reports";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Progress from "./pages/Progress";
import Completed from "./pages/Completed";


const App = () => {
  return (
    <Routes>

      {/* =================================================
          PUBLIC
      ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =================================================
          AUTHENTICATED USERS
      ================================================= */}

      <Route
        element={<ProtectedRoute />}
      >

        <Route
          element={<Layout />}
        >

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* =================================================
              ADMIN - DEPARTMENTS
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN"
                ]}
              />
            }
          >

            <Route
              path="/departments"
              element={<Departments />}
            />

          </Route>


          {/* =================================================
              ADMIN - USERS
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN"
                ]}
              />
            }
          >

            <Route
              path="/users"
              element={<Users />}
            />

          </Route>


          {/* =================================================
              TRAINING LIBRARY
              ADMIN / HOD / USER
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "HOD",
                  "USER"
                ]}
              />
            }
          >

            <Route
              path="/trainings"
              element={<Trainings />}
            />

            {/* Main training watch route */}

            <Route
              path="/training/:id"
              element={<TrainingWatch />}
            />

            {/* Alias route - keeps old links working */}

            <Route
              path="/trainings/:id"
              element={<TrainingWatch />}
            />

          </Route>


          {/* =================================================
              UPLOAD TRAINING
              ADMIN / HOD
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "HOD"
                ]}
              />
            }
          >

            <Route
              path="/upload-training"
              element={<UploadTraining />}
            />

          </Route>


          {/* =================================================
              MANAGE TRAININGS
              ADMIN / HOD
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "HOD"
                ]}
              />
            }
          >

            <Route
              path="/manage-trainings"
              element={<ManageTrainings />}
            />

          </Route>


          {/* =================================================
              REPORTS
              ADMIN / HOD
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "HOD"
                ]}
              />
            }
          >

            <Route
              path="/reports"
              element={<Reports />}
            />

          </Route>


          {/* =================================================
              MY DEPARTMENT
              ADMIN / HOD / USER
          ================================================= */}

          <Route
  element={
    <ProtectedRoute
      allowedRoles={[
        "ADMIN",
        "HOD",
        "USER",
      ]}
    />
  }
>
  <Route
    path="/department"
    element={<Department />}
  />
</Route>


          {/* =================================================
              USER - MY PROGRESS
          ================================================= */}
<Route element={<ProtectedRoute allowedRoles={["USER"]} />}>

  <Route
    path="/progress"
    element={<Progress />}
  />

  <Route
    path="/completed"
    element={<Completed />}
  />

</Route>

        </Route>

      </Route>


      {/* =================================================
          ROOT
      ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      {/* =================================================
          UNKNOWN URL
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
};

export default App;