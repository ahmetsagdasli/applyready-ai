import axios from 'axios';

// Tum istekler /api altina gider; Vite proxy backend'e yonlendirir.
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
