import axios from "axios";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const api = axios.create({
  baseURL: configuredApiBaseUrl || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (import.meta.env.PROD && !configuredApiBaseUrl) {
    return Promise.reject(
      new Error("VITE_API_BASE_URL must be set to the Render API base URL for production.")
    );
  }

  return config;
});

export default api;