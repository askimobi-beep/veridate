import axios from "axios";

export const API_BASE_URL = "https://veridate.store/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

export default api;
