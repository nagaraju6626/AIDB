import axios from 'axios';

// Ensure it points to the correct backend url (defaults to localhost:8000 for development)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Read active connection directly from local storage if available
  try {
    const connState = localStorage.getItem('connection-storage');
    if (connState) {
      const parsed = JSON.parse(connState);
      const activeId = parsed?.state?.activeConnectionId;
      if (activeId) {
        config.headers['X-Connection-ID'] = activeId.toString();
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.detail?.includes('Unable to connect') || 
        error.response?.data?.detail?.includes('Failed to connect') ||
        error.response?.data?.detail?.includes('Connection failed') ||
        error.response?.data?.detail?.includes('No database connection')) {
       window.dispatchEvent(new Event('db:disconnected'));
    }
    if (error.response?.status === 401) {
      // Allow auth store to handle or just remove token here
    }
    return Promise.reject(error);
  }
);

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || error.response?.data?.error || 'Unable to connect to the AI Data Assistant server.');
  }
};

export const register = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const login = async (data: any) => {
  // Login expects application/x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', data.email);
  formData.append('password', data.password);
  
  const response = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

export const forgotPassword = async (data: { email: string }) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data: { token: string; new_password: string }) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (data: { name: string }) => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getQueries = async () => {
  const response = await api.get('/queries');
  return response.data;
};

export const getSavedQueries = async () => {
  const response = await api.get('/saved-queries');
  return response.data;
};

export const saveQuery = async (data: { name: string; description?: string; question: string; sql_query: string }) => {
  const response = await api.post('/saved-queries', data);
  return response.data;
};

export const updateSavedQuery = async (id: number, data: { name?: string; description?: string }) => {
  const response = await api.put(`/saved-queries/${id}`, data);
  return response.data;
};

export const deleteSavedQuery = async (id: number) => {
  const response = await api.delete(`/saved-queries/${id}`);
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

export const getSchema = async () => {
  const response = await api.get('/schema');
  return response.data;
};

export const getTableSchema = async (tableName: string) => {
  const response = await api.get(`/schema/${tableName}`);
  return response.data;
};

export const getTablePreview = async (tableName: string) => {
  const response = await api.get(`/schema/${tableName}/preview`);
  return response.data;
};

export const getConnections = async () => {
  const response = await api.get('/databases');
  return response.data;
};

export const createConnection = async (data: any) => {
  const response = await api.post('/databases', data);
  return response.data;
};

export const testConnection = async (data: any) => {
  const response = await api.post('/databases/test', data);
  return response.data;
};

export const testExistingConnection = async (id: number) => {
  const response = await api.post(`/databases/${id}/test`);
  return response.data;
};

export const updateConnection = async (id: number, data: any) => {
  const response = await api.put(`/databases/${id}`, data);
  return response.data;
};

export const deleteConnection = async (id: number) => {
  const response = await api.delete(`/databases/${id}`);
  return response.data;
};

// --- Notifications API ---

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const createNotification = async (data: { type: string, title: string, message: string }) => {
  const response = await api.post('/notifications', data);
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: number) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const deleteAllNotifications = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};
