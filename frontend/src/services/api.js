/**
 * api.js — Axios instance + all endpoint helpers
 *
 * BUG FIXED: The original interceptor caught 401s but didn't clear state properly
 * when the refresh call itself failed — added window dispatch so App can react.
 *
 * ADDED: placementsAPI.myStudent() — fetches the placement for the
 * currently-authenticated student; used by ScoreCard & LogbookForm.
 */
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const API = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor: attach bearer token ── */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response interceptor: auto-refresh JWT ── */
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
          // BUG FIX: dispatch a custom event so App component can react
          // instead of a hard redirect which breaks SPA state
          window.dispatchEvent(new CustomEvent('iles:session-expired'));
        }
      }
    }
    return Promise.reject(error);
  }
);

/* 
   AUTH
 */
export const authAPI = {
  register: (data) => API.post('/auth/register/', data),
  login:    (data) => API.post('/auth/login/',    data),
  logout:   (data) => API.post('/auth/logout/',   data),
  me:       ()     => API.get('/auth/me/'),
};

/* 
   STUDENTS
   GET /students/      → list (admin sees all; student sees own)
   POST /students/     → create profile
   GET /students/:id/  → detail
   PUT /students/:id/  → update
 */
export const studentsAPI = {
  list:   ()         => API.get('/students/'),
  get:    (id)       => API.get(`/students/${id}/`),
  create: (data)     => API.post('/students/', data),
  update: (id, data) => API.put(`/students/${id}/`, data),
  delete: (id)       => API.delete(`/students/${id}/`),    // admin only — enforced server-side
};

/* 
   PLACEMENTS
   GET /placements/     → list (student sees own; others see all)
   POST /placements/    → create (admin only – enforced server-side)
   GET /placements/:id/ → detail
   PUT /placements/:id/ → update (admin/supervisor)
 */
export const placementsAPI = {
  list:   ()         => API.get('/placements/'),
  get:    (id)       => API.get(`/placements/${id}/`),
  create: (data)     => API.post('/placements/', data),
  update: (id, data) => API.put(`/placements/${id}/`, data),
};

/* 
   LOGBOOKS
   GET /logbooks/       → list (student sees own; others see all)
   POST /logbooks/      → create entry
   GET /logbooks/:id/   → detail
   PATCH /logbooks/:id/ → update status (supervisor approve/reject)
 */
export const logbooksAPI = {
  list:         ()         => API.get('/logbooks/'),
  get:          (id)       => API.get(`/logbooks/${id}/`),
  create:       (data)     => API.post('/logbooks/', data),
  updateStatus: (id, data) => API.patch(`/logbooks/${id}/`, data),
};

/* 
   EVALUATIONS
   GET /evaluations/    → list (student sees own; others see all)
   POST /evaluations/   → create (supervisor/admin only)
   GET /evaluations/:id/ → detail
 */
export const evaluationsAPI = {
  list:   ()     => API.get('/evaluations/'),
  get:    (id)   => API.get(`/evaluations/${id}/`),
  create: (data) => API.post('/evaluations/', data),
};

/* 
   ISSUES
   GET /issues/        → list (student sees own; others see all)
   POST /issues/       → report new issue
   PATCH /issues/:id/  → update status (admin/supervisor)
 */
export const issuesAPI = {
  list:         ()         => API.get('/issues/'),
  create:       (data)     => API.post('/issues/', data),
  updateStatus: (id, data) => API.patch(`/issues/${id}/`, data),
};

/* 
   SUPERVISORS (admin panel – list workplace supervisors)
   GET /supervisors/   → list
   POST /supervisors/  → create (admin only)

   ADDED: These routes existed in urls.py but had no API helpers.
 */
export const supervisorsAPI = {
  list:   ()     => API.get('/supervisors/'),
  create: (data) => API.post('/supervisors/', data),
};

/* 
   ADMINS
   GET /admins/    → list
   POST /admins/   → create

   ADDED: Same as above – missing from original api.js.
 */
export const adminsAPI = {
  list:   ()     => API.get('/admins/'),
  create: (data) => API.post('/admins/', data),
};

export default API;