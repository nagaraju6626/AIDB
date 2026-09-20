import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface TableOverview {
  name: string;
  columns: number;
  records: number;
}

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key: { table: string; column: string } | null;
}

export interface TableDetail {
  name: string;
  columns: ColumnDef[];
  indexes: any[];
}

export interface TablePreview {
  name: string;
  rows: any[];
}

interface SchemaWorkspaceState {
  connectionId: number | null;
  tables: TableOverview[];
  searchQuery: string;
  selectedTableName: string | null;
  tableDetail: TableDetail | null;
  tablePreview: TablePreview | null;
  showPreview: boolean;
  loadingSchema: boolean;
  refreshing: boolean;
  error: string | null;
  loadingDetails: boolean;
  detailsError: string | null;
  loadingPreview: boolean;
  previewError: string | null;
  setConnectionId: (connectionId: number | null) => void;
  setTables: (tables: TableOverview[]) => void;
  setSearchQuery: (searchQuery: string) => void;
  selectTable: (selectedTableName: string) => void;
  setTableDetail: (tableDetail: TableDetail | null) => void;
  setTablePreview: (tablePreview: TablePreview | null) => void;
  setShowPreview: (showPreview: boolean) => void;
  setLoadingSchema: (loadingSchema: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setLoadingDetails: (loadingDetails: boolean) => void;
  setDetailsError: (detailsError: string | null) => void;
  setLoadingPreview: (loadingPreview: boolean) => void;
  setPreviewError: (previewError: string | null) => void;
  resetForConnection: (connectionId: number | null) => void;
  clearSelection: () => void;
  clearWorkspace: () => void;
}

const initialWorkspace = {
  connectionId: null,
  tables: [],
  searchQuery: '',
  selectedTableName: null,
  tableDetail: null,
  tablePreview: null,
  showPreview: false,
  loadingSchema: true,
  refreshing: false,
  error: null,
  loadingDetails: false,
  detailsError: null,
  loadingPreview: false,
  previewError: null,
};

export const useSchemaStore = create<SchemaWorkspaceState>()(
  persist(
    (set) => ({
      ...initialWorkspace,
      setConnectionId: (connectionId) => set({ connectionId }),
      setTables: (tables) => set({ tables }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      selectTable: (selectedTableName) => set({
        selectedTableName,
        tableDetail: null,
        tablePreview: null,
        showPreview: false,
        detailsError: null,
        previewError: null,
      }),
      setTableDetail: (tableDetail) => set({ tableDetail }),
      setTablePreview: (tablePreview) => set({ tablePreview }),
      setShowPreview: (showPreview) => set({ showPreview }),
      setLoadingSchema: (loadingSchema) => set({ loadingSchema }),
      setRefreshing: (refreshing) => set({ refreshing }),
      setError: (error) => set({ error }),
      setLoadingDetails: (loadingDetails) => set({ loadingDetails }),
      setDetailsError: (detailsError) => set({ detailsError }),
      setLoadingPreview: (loadingPreview) => set({ loadingPreview }),
      setPreviewError: (previewError) => set({ previewError }),
      resetForConnection: (connectionId) => set({
        ...initialWorkspace,
        connectionId,
      }),
      clearSelection: () => set({
        selectedTableName: null,
        tableDetail: null,
        tablePreview: null,
        showPreview: false,
        loadingDetails: false,
        detailsError: null,
        loadingPreview: false,
        previewError: null,
      }),
      clearWorkspace: () => set(initialWorkspace),
    }),
    {
      name: 'schema-workspace-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
