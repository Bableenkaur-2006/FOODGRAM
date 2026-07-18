import axios from "axios";

const api = axios.create({
    baseURL: "https://foodgram-backend-xtmt.onrender.com",
    withCredentials: true
});

export default api;