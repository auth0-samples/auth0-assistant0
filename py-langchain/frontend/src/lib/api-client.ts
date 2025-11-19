import axios from "axios";

export const apiClient = axios.create({
  baseURL: window.location.origin,
  withCredentials: true,
});
