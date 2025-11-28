import axios from 'axios';

const baseURL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  '';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data?.message || err.message;
    console.warn('API error:', message);
    return Promise.reject(err);
  }
);