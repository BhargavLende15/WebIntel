import axios from 'axios';

const TOKEN_KEY = 'webintel_access_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('webintel:unauthorized'));
    }
    return Promise.reject(error);
  },
);
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (payload) => api.post('/auth/register', payload);
export const getCurrentUser = () => api.get('/auth/me');

export const checkHealth = () => axios.get(
  `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '')}/health`
);

export const analyzeWebsite = (url, options = {}) =>
  api.post('/analyze', { url, ...options });

export const getAnalysis = (id) => api.get(`/analysis/${id}`);
export const calculateScore = (analysisId) =>
  api.post('/score', { analysis_id: analysisId });
export const getRecommendations = (analysisId) =>
  api.post('/recommendations', { analysis_id: analysisId });
export const getSavedRecommendations = (analysisId) =>
  api.get(`/recommendations/${analysisId}`);
export const getDashboard = (id) => api.get(`/dashboard/${id}`);
export const getLatestDashboard = () => api.get('/dashboard/latest');
export const sendChatMessage = (payload) => api.post('/chat', payload);
export const predictScore = (websiteId, horizonDays = 30) =>
  api.post('/predict', { website_id: websiteId, horizon_days: horizonDays });
export const setupMonitoring = (payload) => api.post('/monitor', payload);
export const getHistory = (websiteId) => api.get(`/history/${websiteId}`);

export const generateReport = (payload) =>
  api.post('/report/pdf', payload, {
    responseType: payload.format === 'html' ? 'text' : 'blob',
    headers: { Accept: payload.format === 'html' ? 'text/html' : 'application/pdf' },
  });

export { TOKEN_KEY };
export default api;
