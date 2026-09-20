import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type QueryView = 'table' | 'chart';
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ChartConfig {
  type: string;
  xAxis: string;
  yAxis: string;
}

interface QueryWorkspaceState {
  queryDraft: string;
  result: any | null;
  resultConnectionId: number | null;
  status: QueryStatus;
  error: string | null;
  activeTab: QueryView;
  chartConfig: ChartConfig;
  setQueryDraft: (queryDraft: string) => void;
  setResult: (result: any | null, connectionId?: number | null) => void;
  setStatus: (status: QueryStatus) => void;
  setError: (error: string | null) => void;
  setActiveTab: (activeTab: QueryView) => void;
  setChartConfig: (chartConfig: ChartConfig) => void;
  clearWorkspace: () => void;
}

const initialWorkspace = {
  queryDraft: '',
  result: null,
  resultConnectionId: null,
  status: 'idle' as QueryStatus,
  error: null,
  activeTab: 'table' as QueryView,
  chartConfig: {
    type: 'bar',
    xAxis: '',
    yAxis: '',
  },
};

export const useQueryStore = create<QueryWorkspaceState>()(
  persist(
    (set) => ({
      ...initialWorkspace,
      setQueryDraft: (queryDraft) => set({ queryDraft }),
      setResult: (result, connectionId = null) => set({ result, resultConnectionId: connectionId }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setChartConfig: (chartConfig) => set({ chartConfig }),
      clearWorkspace: () => set(initialWorkspace),
    }),
    {
      name: 'query-workspace-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
