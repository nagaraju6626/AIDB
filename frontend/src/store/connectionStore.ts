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

export type ConnectionStatus = "connected" | "disconnected" | "not_connected" | "checking";

interface ConnectionState {
  activeConnectionId: number | null;
  connections: DatabaseConnection[];
  connectionStatus: ConnectionStatus;
  setActiveConnection: (id: number | null) => void;
  setConnections: (conns: DatabaseConnection[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      activeConnectionId: null,
      connections: [],
      connectionStatus: "not_connected",
      setActiveConnection: (id) => set({ activeConnectionId: id }),
      setConnections: (conns) => set({ connections: conns }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
    }),
    {
      name: 'connection-storage',
      partialize: (state) => ({ 
        activeConnectionId: state.activeConnectionId, 
        connections: state.connections 
        // DO NOT persist connectionStatus so it evaluates freshly on load
      }),
    }
  )
);
