import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface DatabaseInfo {
  id: number;
  name: string;
  status: string;
}

export interface Statistics {
  total_tables: number;
  total_records: number;
  queries_run: number;
  ai_queries: number;
}

export interface TableSchema {
  name: string;
  columns: number;
  records: number;
}

export interface DashboardData {
  database: DatabaseInfo;
  statistics: Statistics;
  recent_queries: any[];
  schema_overview: TableSchema[];
}

export interface QueryItem {
  id: number;
  question: string;
  sql: string;
  status: string;
  execution_time_ms: number;
  created_at: string;
}

export interface SavedQuery {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface DashboardWorkspaceState {
  connectionId: number | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  backendHealth: 'connected' | 'disconnected' | 'checking';
  lastUpdated: string | null;
  dashboardData: DashboardData | null;
  recentQueries: QueryItem[];
  savedQueries: SavedQuery[];
  analyticsError: boolean;
  setConnectionId: (connectionId: number | null) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setBackendHealth: (backendHealth: DashboardWorkspaceState['backendHealth']) => void;
  setLastUpdated: (lastUpdated: string) => void;
  setDashboardData: (dashboardData: DashboardData | null) => void;
  setRecentQueries: (recentQueries: QueryItem[]) => void;
  setSavedQueries: (savedQueries: SavedQuery[]) => void;
  setAnalyticsError: (analyticsError: boolean) => void;
  resetForConnection: (connectionId: number | null) => void;
  clearWorkspace: () => void;
}

const initialWorkspace = {
  connectionId: null,
  loading: true,
  refreshing: false,
  error: null,
  backendHealth: 'checking' as const,
  lastUpdated: null,
  dashboardData: null,
  recentQueries: [],
  savedQueries: [],
  analyticsError: false,
};

export const useDashboardStore = create<DashboardWorkspaceState>()(
  persist(
    (set) => ({
      ...initialWorkspace,
      setConnectionId: (connectionId) => set({ connectionId }),
      setLoading: (loading) => set({ loading }),
      setRefreshing: (refreshing) => set({ refreshing }),
      setError: (error) => set({ error }),
      setBackendHealth: (backendHealth) => set({ backendHealth }),
      setLastUpdated: (lastUpdated) => set({ lastUpdated }),
      setDashboardData: (dashboardData) => set({ dashboardData }),
      setRecentQueries: (recentQueries) => set({ recentQueries }),
      setSavedQueries: (savedQueries) => set({ savedQueries }),
      setAnalyticsError: (analyticsError) => set({ analyticsError }),
      resetForConnection: (connectionId) => set({ ...initialWorkspace, connectionId }),
      clearWorkspace: () => set(initialWorkspace),
    }),
    {
      name: 'dashboard-workspace-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
