import axios from "axios";

const instance = axios.create({
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 🔐 Dynamically set baseURL + attach access token on every request.
 * - On localhost:3000  → API calls go to localhost:5000
 * - On 172.20.10.2:3000 → API calls go to 172.20.10.2:5000
 * This makes network access work automatically without env changes.
 */
instance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      config.baseURL = `http://${hostname}:5000`;

      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      config.baseURL = "http://localhost:5000";
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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const hostname = window.location.hostname;
          const res = await axios.post(`http://${hostname}:5000/api/auth/refresh-token`, {
            refreshToken,
          });

          if (res.data.success) {
            const { accessToken } = res.data;
            localStorage.setItem("accessToken", accessToken);
            
            // ✅ Ensure the header is updated for the retry
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${accessToken}`
            };
            
            console.log("🔄 Retrying request with new token...");
            return instance(originalRequest);
          }
        } catch (refreshError) {
          console.error("Refresh token failed", refreshError);
          // 🚨 Session absolutely expired - clear and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== "undefined") {
            window.location.href = "/?session=expired";
          }
        }
      } else {
        // No refresh token available - clear and redirect
        localStorage.removeItem("accessToken");
        if (typeof window !== "undefined") {
          window.location.href = "/?session=expired";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
