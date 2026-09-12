import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DatabaseConnection {
  id: number;
  name: string;
  db_type: string;
  database_name: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

interface ConnectionState {
  activeConnectionId: number | null;
  connections: DatabaseConnection[];
  setActiveConnection: (id: number | null) => void;
  setConnections: (conns: DatabaseConnection[]) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      activeConnectionId: null,
      connections: [],
      setActiveConnection: (id) => set({ activeConnectionId: id }),
      setConnections: (conns) => set({ connections: conns }),
    }),
    {
      name: 'connection-storage',
    }
  )
);
