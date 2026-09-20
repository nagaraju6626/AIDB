import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const apiOrigin = configuredApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const api = axios.create({
	baseURL: `${apiOrigin}/api`,
	headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export interface HealthResponse {
	success: boolean;
	message: string;
}

export interface ApiEnvelope<T> {
	success: boolean;
	data: T;
	message?: string;
	error?: string;
}

export const getHealth = async (): Promise<HealthResponse> => {
	const response = await api.get<HealthResponse>('/health');
	return response.data;
};

export const getDatabases = async () => api.get<ApiEnvelope<{ connections: unknown[] }>>('/databases');
export const getSchema = async () => api.get<ApiEnvelope<{ tables: unknown[] }>>('/schema');
export const getTableSchema = async (tableName: string) => api.get<ApiEnvelope<unknown>>(`/schema/${encodeURIComponent(tableName)}`);
export const getDashboard = async () => api.get<ApiEnvelope<unknown>>('/dashboard');
export const getQueries = async () => api.get<ApiEnvelope<{ queries: unknown[] }>>('/queries');
export const getSavedQueries = async () => api.get<ApiEnvelope<{ queries: unknown[] }>>('/saved-queries');
export const getAnalytics = async () => api.get<ApiEnvelope<unknown>>('/analytics');

export const getApiErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		return error.response?.data?.detail || error.response?.data?.error || 'Unable to connect to the AI Data Assistant server.';
	}
	return 'Unable to connect to the AI Data Assistant server.';
};

export default api;
