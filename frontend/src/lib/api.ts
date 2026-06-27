import axios from "axios";
import { getToken, clearToken } from "./auth";

/**
 * Pre-configured Axios instance.
 * - Base URL points to the Next.js rewrite proxy (/api → localhost:8000)
 * - Authorization header is injected automatically from localStorage
 * - 401 responses are caught to clear the token and redirect to login.
 */
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — catch 401 and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
