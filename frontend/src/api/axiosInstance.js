//axiosInstance.js
import axios from "axios";

// Прибираємо сліш наприкінці, якщо він раптом там є
const rawBaseURL = process.env.REACT_APP_API_URL || "https://usof.onrender.com/api";
const cleanBaseURL = rawBaseURL.replace(/\/+$/, "");

const api = axios.create({
    baseURL: cleanBaseURL,
    headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Запобігаємо кешуванню для GET-запитів
    if (config.method?.toLowerCase() === "get") {
        config.params = { ...(config.params || {}), _ts: Date.now() };
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
