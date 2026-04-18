import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const API = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${BASE}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          original.headers.Authorization = `Bearer ${res.data.access}`;
          return API(original);
        } catch {
          localStorage.clear();
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register/', data),
  login:    (data) => API.post('/auth/login/',    data),
  logout:   (data) => API.post('/auth/logout/',   data),
  me:       ()     => API.get('/auth/me/'),
};

export const studentsAPI = {
  list:   ()         => API.get('/students/'),
  get:    (id)       => API.get(`/students/${id}/`),
  create: (data)     => API.post('/students/', data),
  update: (id, data) => API.put(`/students/${id}/`, data),
};

export const placementsAPI = {
  list:   ()         => API.get('/placements/'),
  get:    (id)       => API.get(`/placements/${id}/`),
  create: (data)     => API.post('/placements/', data),
  update: (id, data) => API.put(`/placements/${id}/`, data),
};

export const logbooksAPI = {
  list:         ()         => API.get('/logbooks/'),
  get:          (id)       => API.get(`/logbooks/${id}/`),
  create:       (data)     => API.post('/logbooks/', data),
  updateStatus: (id, data) => API.patch(`/logbooks/${id}/`, data),
};

export const evaluationsAPI = {
  list:   ()     => API.get('/evaluations/'),
  get:    (id)   => API.get(`/evaluations/${id}/`),
  create: (data) => API.post('/evaluations/', data),
};

export const issuesAPI = {
  list:         ()         => API.get('/issues/'),
  create:       (data)     => API.post('/issues/', data),
  updateStatus: (id, data) => API.patch(`/issues/${id}/`, data),
};

export default API;
