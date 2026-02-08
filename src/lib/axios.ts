import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000", // ✅ Backend URL
  withCredentials: false,           // ❌ true नहीं चाहिए (JWT localStorage में है)
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 🔐 Attach access token to every request
 */
instance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 🚨 Global response error handler (future-ready)
 * 401 / 403 → token expired / unauthorized
 */
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // future: refresh token logic here
      console.warn("⚠️ Unauthorized - token may be expired");
    }
    return Promise.reject(error);
  }
);

export default instance;

