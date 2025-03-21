// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,  // this ensures cookies are sent on each request
});

export default api;