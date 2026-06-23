import axios from "axios";
import { triggerAuthModal } from "@/lib/auth-modal-trigger";

const apiClient = axios.create({
  baseURL: "/api/proxy",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/cart")) {
      triggerAuthModal();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
