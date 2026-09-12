import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isCheckingSession: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setCheckingSession: (isChecking: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isCheckingSession: true,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    // We should not remove connection-storage completely on logout to allow guest/other users?
    // Wait, connections belong to users. Let's clear it safely on the component level or leave it and it will get overwritten.
    set({ user: null, token: null });
  },
  setCheckingSession: (isChecking) => set({ isCheckingSession: isChecking }),
}));
