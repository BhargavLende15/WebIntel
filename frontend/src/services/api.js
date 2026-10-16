import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = () => axios.get('http://localhost:8000/health');

export const analyzeWebsite = (url, options = {}) =>
  api.post('/analyze', { url, ...options });

export const getAnalysis = (id) => api.get(`/analysis/${id}`);

export const calculateScore = (analysisId) =>
  api.post('/score', { analysis_id: analysisId });

export const getRecommendations = (analysisId) =>
  api.post('/recommendations', { analysis_id: analysisId });

export const getDashboard = (id) => api.get(`/dashboard/${id}`);

export const getLatestDashboard = () => api.get('/dashboard/latest');

export const sendChatMessage = (payload) => api.post('/chat', payload);

export const predictScore = (websiteId, horizonDays = 30) =>
  api.post('/predict', { website_id: websiteId, horizon_days: horizonDays });

export const setupMonitoring = (payload) => api.post('/monitor', payload);

export const getHistory = (websiteId) => api.get(`/history/${websiteId}`);

export const generateReport = (payload) => api.post('/report/pdf', payload);

export default api;
