import { clearAllUserCaches } from "./dashboardCache";

export const getAccessToken = () =>
  localStorage.getItem("accessToken");

export const getRefreshToken = () =>
  localStorage.getItem("refreshToken");

export const logout = () => {
  clearAllUserCaches();
  localStorage.clear();
  window.location.href = "/auth/login";
};
