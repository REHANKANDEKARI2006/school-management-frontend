import axios from "axios";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";

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
    // 🌍 STRATEGY: Use 'localhost' when developing locally for stability.
    // Use the hardcoded IP for mobile devices on the same network.
    const API_IP = "192.168.29.235"; 
    const envUrl = process.env.NEXT_PUBLIC_API_URL;

    if (envUrl && envUrl.includes('://')) {
      config.baseURL = envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl;
    } else {
      // Dynamically use the hostname of the browser. 
      // If viewed on phone via 172.x.x.x, the API will hit 172.x.x.x:5000 automatically.
      const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
      config.baseURL = `http://${hostname}:5000`;
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Trigger global loader for process executions (mutations)
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        useGlobalLoaderStore.getState().increment();
      }
    }
    return config;
  },
  (error) => {
    if (typeof window !== "undefined" && ['post', 'put', 'patch', 'delete'].includes(error.config?.method?.toLowerCase() || '')) {
      useGlobalLoaderStore.getState().decrement();
    }
    return Promise.reject(error);
  }
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
  (response) => {
    if (typeof window !== "undefined" && ['post', 'put', 'patch', 'delete'].includes(response.config?.method?.toLowerCase() || '')) {
      useGlobalLoaderStore.getState().decrement();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the account has been deactivated
    if (
      error.response?.data?.deactivated === true || 
      error.response?.data?.message === "Your account is deactivated!"
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("isAuthenticated");
        localStorage.removeItem("role_id");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_name");
        localStorage.removeItem("student_id");
        localStorage.removeItem("class_id");
        window.location.href = "/?deactivated=true";
      }
      return Promise.reject(error);
    }

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
    const errorDetail = {
      url: error.config?.url || originalRequest?.url,
      baseURL: error.config?.baseURL || originalRequest?.baseURL,
      method: error.config?.method || originalRequest?.method,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    };
    
    console.error("Axios Error Detail:", JSON.stringify(errorDetail, null, 2));

    if (typeof window !== "undefined" && ['post', 'put', 'patch', 'delete'].includes(originalRequest?.method?.toLowerCase() || '')) {
      useGlobalLoaderStore.getState().decrement();
    }

    return Promise.reject(error);
  }
);

export default instance;
