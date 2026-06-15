export const getAccessToken = () =>
  localStorage.getItem("accessToken");

export const getRefreshToken = () =>
  localStorage.getItem("refreshToken");

export const logout = () => {
  localStorage.clear();
  window.location.href = "/auth/login";
};
