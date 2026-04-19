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
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

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
            
            instance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            
            processQueue(null, accessToken);
            return instance(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          console.error("Refresh token failed", refreshError);
          // 🚨 Session absolutely expired - clear and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== "undefined") {
            window.location.href = "/?session=expired";
          }
        } finally {
          isRefreshing = false;
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
