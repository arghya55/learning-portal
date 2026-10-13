import {
  Navigate,
  Outlet
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";


const ProtectedRoute = ({
  allowedRoles
}) => {

  const {
    user,
    loading
  } = useAuth();


  // =================================================
  // AUTH CHECK
  // =================================================

  if (loading) {

    return (

      <div className="loading-screen">

        <div className="loading-box">

          Checking authentication...

        </div>

      </div>

    );
  }


  // =================================================
  // NOT LOGGED IN
  // =================================================

  if (!user) {

    return (

      <Navigate
        to="/login"
        replace
      />

    );
  }


  // =================================================
  // ROLE CHECK
  // =================================================

  if (
    allowedRoles &&
    !allowedRoles.includes(
      user.role
    )
  ) {

    return (

      <Navigate
        to="/dashboard"
        replace
      />

    );
  }


  // =================================================
  // ACCESS GRANTED
  // =================================================

  return <Outlet />;
};


export default ProtectedRoute;