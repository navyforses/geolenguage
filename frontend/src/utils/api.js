import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect
          localStorage.removeItem('token');
          // window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden');
          break;
        case 404:
          console.error('Not found');
          break;
        case 429:
          console.error('Rate limited');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          break;
      }
    } else if (error.request) {
      console.error('Network error');
    }

    return Promise.reject(error);
  }
);

export default api;

// Convenience methods
export const platforms = {
  getAll: () => api.get('/platforms'),
  get: (slug) => api.get(`/platforms/${slug}`),
  getMetrics: (slug, params) => api.get(`/platforms/${slug}/metrics`, { params }),
  getHistorical: (slug, params) => api.get(`/platforms/${slug}/historical`, { params }),
  compare: (slugs, metrics) => api.post('/platforms/compare', { slugs, metrics }),
  refresh: (slug) => api.get(`/platforms/${slug}/refresh`)
};

export const forecasts = {
  getAll: (params) => api.get('/forecasts', { params }),
  getByPlatform: (slug) => api.get(`/forecasts/platform/${slug}`),
  get: (id) => api.get(`/forecasts/${id}`),
  generate: (slug, force) => api.post('/forecasts/generate', { platform_slug: slug, force }),
  getSummary: () => api.get('/forecasts/stats/summary'),
  getAccuracy: (params) => api.get('/forecasts/stats/accuracy', { params })
};

export const alerts = {
  getAll: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  getByPlatform: (slug, limit) => api.get(`/alerts/platform/${slug}`, { params: { limit } }),
  getUnreadCount: () => api.get('/alerts/unread/count'),
  getRecent: (hours) => api.get('/alerts/feed/recent', { params: { hours } }),
  markAsRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllAsRead: () => api.patch('/alerts/read-all'),
  delete: (id) => api.delete(`/alerts/${id}`)
};

export const reports = {
  getAll: (params) => api.get('/reports', { params }),
  get: (id) => api.get(`/reports/${id}`),
  getLatest: () => api.get('/reports/latest'),
  generate: (options) => api.post('/reports/generate', options),
  getDashboard: () => api.get('/reports/data/dashboard'),
  getTrends: (days) => api.get('/reports/data/trends', { params: { days } }),
  getPlatformReport: (slug) => api.get(`/reports/platform/${slug}`)
};

export const metrics = {
  getRealtime: () => api.get('/metrics/realtime'),
  getStocks: () => api.get('/metrics/stocks'),
  getTrends: (platforms, timeframe) => api.get('/metrics/trends', { params: { platforms, timeframe } }),
  getSentiment: (platform) => api.get('/metrics/sentiment', { params: { platform } }),
  getEconomic: () => api.get('/metrics/economic'),
  getGitHub: () => api.get('/metrics/github'),
  getCrypto: () => api.get('/metrics/crypto'),
  getYouTube: (region) => api.get('/metrics/youtube', { params: { region } })
};

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
  logout: () => api.post('/auth/logout'),
  getPreferences: () => api.get('/auth/preferences'),
  updatePreferences: (data) => api.patch('/auth/preferences', data)
};
