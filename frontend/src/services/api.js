import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refresh = localStorage.getItem('refresh_token');
            if (refresh) {
                try {
                    const res = await axios.post('http://localhost:8000/api/auth/refresh/', { refresh });
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
    login:    (data) => API.post('/auth/login/', data),
    logout:   (data) => API.post('/auth/logout/', data),
    me:       ()     => API.get('/auth/me/'),
};

export const studentsAPI = {
    list:   ()         => API.get('/students/'),
    get:    (id)       => API.get(`/students/${id}/`),
    create: (data)     => API.post('/students/', data),
    update: (id, data) => API.put(`/students/${id}/`, data),
};

export const logbooksAPI = {
    list:   ()     => API.get('/logbooks/'),
    create: (data) => API.post('/logbooks/', data),
};

export const evaluationsAPI = {
    list:   ()     => API.get('/evaluations/'),
    create: (data) => API.post('/evaluations/', data),
};

export const placementsAPI = {
    list:   ()     => API.get('/placements/'),
    create: (data) => API.post('/placements/', data),
};

export const issuesAPI = {
    list:   ()     => API.get('/issues/'),
    create: (data) => API.post('/issues/', data),
};

export default API;