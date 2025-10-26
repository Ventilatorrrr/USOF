//axiosInstance.js
import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method?.toLowerCase() === "get") {
        config.params = { ...(config.params || {}), _ts: Date.now() };
    }
    return config;
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
