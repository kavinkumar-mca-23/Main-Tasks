// utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://main-tasks-backend.onrender.com/api", // Change to your backend IP/host in production
});

// Set auth token in headers if needed
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};


// export const getCurrentUser = () => api.get("/auth/me");


export default api;
