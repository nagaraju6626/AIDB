import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { getMe } from './services/api';
import { AppLayout } from './components/Layout/AppLayout';
import { QueryPage } from './pages/Query/QueryPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { SchemaPage } from './pages/Schema/SchemaPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { SavedQueriesPage } from './pages/Saved/SavedQueriesPage';
import { ConnectionsPage } from './pages/Connections/ConnectionsPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Auth/ResetPasswordPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { token, isCheckingSession } = useAuthStore();
  
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Checking session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  const { token, setAuth, logout, isCheckingSession, setCheckingSession } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        try {
          const user = await getMe();
          setAuth(user, token);
        } catch (error) {
          console.error("Session expired or invalid");
          logout();
        }
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  // Set theme from localStorage on initial load
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system';
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading AIDB...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
        <Route path="/reset-password" element={token ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/schema" element={<SchemaPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/saved" element={<SavedQueriesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
