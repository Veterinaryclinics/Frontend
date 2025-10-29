import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn("Backend not reachable or returned an error:", error.message);
    return Promise.resolve({ data: { data: null } });
  }
);

export default axiosInstance;
export { axiosInstance };
