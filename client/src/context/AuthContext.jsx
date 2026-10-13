import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing login
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("lp_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get("/auth/me");

        if (response.data.success) {
          setUser(response.data.user);

          localStorage.setItem(
            "lp_user",
            JSON.stringify(response.data.user)
          );
        }
      } catch (error) {
        console.error(
          "Session validation failed:",
          error.response?.data?.message ||
            error.message
        );

        localStorage.removeItem("lp_token");
        localStorage.removeItem("lp_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Login failed"
        );
      }

      const token = response.data.token;
      const loggedInUser = response.data.user;

      localStorage.setItem("lp_token", token);

      localStorage.setItem(
        "lp_user",
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);

      return {
        success: true,
        user: loggedInUser,
      };
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Login failed",
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("lp_token");
    localStorage.removeItem("lp_user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;