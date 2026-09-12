import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { updateProfile } from '../../services/api';
import { User, Palette, Sparkles, Database, Shield, Bell, Info, Check, Loader2, Edit2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SettingsPage = () => {
  const { user, setAuth, token } = useAuthStore();
  const { connections, activeConnectionId } = useConnectionStore();
  
  // Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Appearance state (mock persist for now, could use a real store)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  
  // Notifications state
  const [notifyQueries, setNotifyQueries] = useState(localStorage.getItem('notifyQueries') !== 'false');
  const [notifyConnections, setNotifyConnections] = useState(localStorage.getItem('notifyConnections') !== 'false');

  const activeConnection = connections.find(c => c.id === activeConnectionId);

  useEffect(() => {
    setProfileName(user?.name || '');
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    setIsSavingProfile(true);
    try {
      const updatedUser = await updateProfile({ name: profileName });
      if (token) {
        setAuth({ ...user, ...updatedUser }, token);
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Real implementation would toggle a 'dark' class on the HTML tag
  };

  const handleNotifyChange = (key: string, value: boolean, setter: any) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 dark:bg-slate-900/30 p-6">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your AIDB account, AI preferences, database preferences, and application behavior.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile */}
        <section className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Profile</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Display Name</label>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-white font-medium">{user?.name || 'Unknown User'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                    <p className="text-slate-900 dark:text-white">{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Account Role</label>
                    <p className="text-slate-900 dark:text-white capitalize flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      {user?.role || 'User'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  {isEditingProfile ? (
                    <>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile || !profileName.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Changes
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileName(user?.name || '');
                        }}
                        className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                  {profileSuccess && <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in"><Check className="w-4 h-4"/> Profile updated</span>}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <Palette className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Appearance</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Interface Theme</label>
            <div className="flex gap-4">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${theme === t ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Dark mode functionality is currently a preview setting.</p>
          </div>
        </section>

        {/* AI Settings */}
        <section className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">AI Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Configured AI Model</label>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-md text-sm font-mono">qwen/qwen3.8-27b</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">(Managed by Backend)</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg">
              <h4 className="text-blue-800 dark:text-blue-200 font-medium text-sm mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Secure Key Management
              </h4>
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                Your Groq API key is securely managed by the AIDB backend environment. It is never exposed to the frontend, browser local storage, or injected into client requests.
              </p>
            </div>
          </div>
        </section>

        {/* Database Settings */}
        <section className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <Database className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Database Configuration</h2>
          </div>
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Active Database Connection</label>
              {activeConnection ? (
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">{activeConnection.name}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:text-slate-400 rounded text-xs font-mono uppercase border border-slate-200 dark:border-slate-700">{activeConnection.db_type}</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Connected</span>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No active database connection selected.</p>
              )}
            </div>
            <Link to="/connections" className="bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center">
              Manage Connections
            </Link>
          </div>
        </section>

        {/* Query & Security */}
        <section className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Query & Security</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-1">Read-Only Execution</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">All AI-generated SQL is rigorously validated by SQLGlot to block destructive statements (DROP, DELETE, UPDATE, INSERT) before execution.</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-1">Result Limitation</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Query results are capped to a safe maximum limit (default: 100 rows) to prevent memory exhaustion and browser freezing.</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-1">Safe DB Isolation</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Internal application schemas (e.g. users, saved_queries) are strictly filtered out of the AI prompt context.</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-1">Ownership Validation</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Connections are securely tied to your user account to ensure strict multi-tenant isolation across environments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <Bell className="w-5 h-5 text-teal-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Notifications</h2>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex items-center h-5">
                <input 
                  type="checkbox" 
                  checked={notifyQueries}
                  onChange={(e) => handleNotifyChange('notifyQueries', e.target.checked, setNotifyQueries)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Query Status Alerts</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Show success/failure toast notifications when executing queries.</span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex items-center h-5">
                <input 
                  type="checkbox" 
                  checked={notifyConnections}
                  onChange={(e) => handleNotifyChange('notifyConnections', e.target.checked, setNotifyConnections)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Connection Status</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Alert me when my active database connection drops or is updated.</span>
              </div>
            </label>
          </div>
        </section>

        {/* About */}
        <section className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">System Information</h2>
          </div>
          <div className="p-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="font-medium text-slate-700 dark:text-slate-300">Application</span>
              <span>AIDB (AI Data Assistant)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="font-medium text-slate-700 dark:text-slate-300">Version</span>
              <span>v1.0.0 (Production)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="font-medium text-slate-700 dark:text-slate-300">Backend API</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Online</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">Framework</span>
              <span>React + Vite + FastAPI</span>
            </div>
          </div>
        </section>
        
        {/* Spacer for bottom */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};
