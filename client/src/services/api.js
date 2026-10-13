import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("lp_token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    if (
      config.data instanceof FormData
    ) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) =>
    Promise.reject(error)
);

export const serverUrl = (
  path = ""
) => {
  const base =
    import.meta.env.VITE_SERVER_URL ||
    "http://localhost:5000";

  return `${base}${path}`;
};

export default API;