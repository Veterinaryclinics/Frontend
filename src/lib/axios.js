import axios from "axios";

const API_BASE_URL =
  "https://petzy-api-byauacaahabbacec.westeurope-01.azurewebsites.net/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 15000,   
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessToken = () => localStorage.getItem("petzy_access_token");
const getRefreshToken = () => localStorage.getItem("petzy_refresh_token");

const extractAuthPayload = (responseData) => {
  const payload = responseData?.data ?? responseData ?? {};

  return {
    accessToken:
      payload.accessToken ||
      payload.token ||
      payload.jwtToken ||
      payload.jwt ||
      payload?.tokens?.accessToken ||
      null,

    refreshToken:
      payload.refreshToken ||
      payload?.tokens?.refreshToken ||
      null,

    user:
      payload.user ||
      payload.account ||
      payload.clinicOwner ||
      null,
  };
};

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/account/refresh`,
          {
            refreshToken: getRefreshToken(),
          }
        );

        const { accessToken, refreshToken } = extractAuthPayload(
          refreshResponse.data
        );

        if (accessToken) {
          localStorage.setItem("petzy_access_token", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        if (refreshToken) {
          localStorage.setItem("petzy_refresh_token", refreshToken);
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("petzy_access_token");
        localStorage.removeItem("petzy_refresh_token");
        localStorage.removeItem("petzy_auth_user");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { axiosInstance };