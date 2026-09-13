import { useState, useEffect } from 'react';
import { getConnections, createConnection, updateConnection, deleteConnection, testConnection, testExistingConnection } from '../../services/api';
import { useConnectionStore, type DatabaseConnection } from '../../store/connectionStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Database, Plus, Edit2, Trash2, Check, Loader2, Play, AlertCircle, X, Server } from 'lucide-react';

export const ConnectionsPage = () => {
  const { connections, setConnections, activeConnectionId, setActiveConnection, connectionStatus } = useConnectionStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dbType, setDbType] = useState('sqlite');
  const [name, setName] = useState('');
  const [databaseName, setDatabaseName] = useState(''); // Serves as file path for sqlite
  const [host, setHost] = useState('');
  const [port, setPort] = useState<number | ''>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadConnections = () => {
    setLoading(true);
    getConnections().then(res => {
      setConnections(res.data.connections);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setDbType('sqlite');
    setName('');
    setDatabaseName('');
    setHost('');
    setPort('');
    setUsername('');
    setPassword('');
    setTestResult(null);
    setTestError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (conn: DatabaseConnection) => {
    setEditingId(conn.id);
    setDbType(conn.db_type);
    setName(conn.name);
    setDatabaseName(conn.database_name);
    setHost(conn.host || '');
    setPort(conn.port || '');
    setUsername(conn.username || '');
    setPassword(conn.password || '');
    setTestResult(null);
    setTestError(null);
    setIsModalOpen(true);
  };

  const getPayload = () => {
    return { 
      name, 
      db_type: dbType, 
      database_name: databaseName,
      ...(dbType !== 'sqlite' ? {
        host: host || undefined,
        port: port ? Number(port) : undefined,
        username: username || undefined,
        password: password || undefined
      } : {})
    };
  };

  const handleTest = async () => {
    if (!name.trim() || !databaseName.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      await testConnection(getPayload()).finally(() => useNotificationStore.getState().fetchNotifications());
      setTestResult({ success: true, message: "Connection successful" });
    } catch (err: any) {
      setTestResult({ success: false, message: err.response?.data?.detail || err.message || "Connection failed" });
      setTestError(err.response?.data?.detail || err.message || "Connection failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestExisting = async (id: number) => {
    try {
      await testExistingConnection(id);
      alert("Connection is working correctly.");
    } catch (err: any) {
      alert("Connection failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !databaseName.trim()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await updateConnection(editingId, getPayload());
      } else {
        const res = await createConnection(getPayload());
        if (connections.length === 0) {
           setActiveConnection(res.data.connection.id);
        }
      }
      setIsModalOpen(false);
      loadConnections();
    } catch (err: any) {
      setTestError(err.response?.data?.detail || err.message || "Failed to save connection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this connection?")) return;
    setDeletingId(id);
    try {
      await deleteConnection(id);
      if (activeConnectionId === id) {
        setActiveConnection(null);
      }
      loadConnections();
    } catch (err) {
      console.error(err);
      alert("Failed to delete connection.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUseConnection = (id: number) => {
    setActiveConnection(id);
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 dark:bg-slate-900/30 p-6">
      
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Database Connections
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your active database connections and add new data sources.</p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      {loading ? (
        <div className="max-w-5xl mx-auto flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map(conn => (
            <div 
              key={conn.id} 
              className={`bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border ${activeConnectionId === conn.id ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'} shadow-sm transition-all flex flex-col`}
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeConnectionId === conn.id ? 'bg-blue-100 text-blue-600 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:text-slate-400'}`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{conn.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {conn.db_type}
                        </span>
                        {activeConnectionId === conn.id && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            connectionStatus === 'connected' ? 'bg-emerald-100 text-emerald-700 dark:text-emerald-300' :
                            connectionStatus === 'disconnected' ? 'bg-red-100 text-red-700 dark:text-red-300' :
                            'bg-yellow-100 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              connectionStatus === 'connected' ? 'bg-emerald-500' :
                              connectionStatus === 'disconnected' ? 'bg-red-500' :
                              'bg-yellow-500 animate-pulse'
                            }`}></span>
                            {connectionStatus === 'connected' ? 'Connected' :
                             connectionStatus === 'disconnected' ? 'Disconnected' : 'Checking'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mt-4 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100">
                  <div className="flex">
                    <span className="w-24 text-slate-400">Database:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono truncate" title={conn.database_name}>{conn.database_name}</span>
                  </div>
                  {conn.host && (
                    <div className="flex">
                      <span className="w-24 text-slate-400">Host:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">{conn.host}:{conn.port}</span>
                    </div>
                  )}
                  {conn.username && (
                    <div className="flex">
                      <span className="w-24 text-slate-400">User:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">{conn.username}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(conn)} className="p-2 text-slate-400 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleTestExisting(conn.id)} className="p-2 text-slate-400 hover:text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors" title="Test Connection">
                    <Play className="w-4 h-4" />
                  </button>
                  {conn.name !== 'Demo Database' && (
                    <button 
                      onClick={() => handleDelete(conn.id)} 
                      disabled={deletingId === conn.id}
                      className="p-2 text-slate-400 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50" 
                      title="Delete"
                    >
                      {deletingId === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => handleUseConnection(conn.id)}
                  disabled={activeConnectionId === conn.id}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeConnectionId === conn.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-default' : 'bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                >
                  {activeConnectionId === conn.id ? 'In Use' : 'Use Database'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 rounded-t-xl">
              <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-blue-500" />
                {editingId ? 'Edit Connection' : 'Add Connection'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {testError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="break-all">{testError}</p>
                </div>
              )}
              {testResult?.success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm flex gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{testResult.message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Connection Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Production Analytics"
                    autoFocus
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Database Type *</label>
                  <select 
                    value={dbType} 
                    onChange={(e) => setDbType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="sqlite">SQLite</option>
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>

                {dbType === 'sqlite' ? (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Database File Path *</label>
                    <input 
                      type="text" 
                      value={databaseName} 
                      onChange={(e) => setDatabaseName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                      placeholder="e.g. ./data/production.db"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Relative or absolute path to the .db file.</p>
                  </div>
                ) : (
                  <>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Host *</label>
                      <input 
                        type="text" 
                        value={host} 
                        onChange={(e) => setHost(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                        placeholder="localhost"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Port *</label>
                      <input 
                        type="number" 
                        value={port} 
                        onChange={(e) => setPort(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                        placeholder={dbType === 'postgres' ? '5432' : '3306'}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Database Name *</label>
                      <input 
                        type="text" 
                        value={databaseName} 
                        onChange={(e) => setDatabaseName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                        placeholder="postgres"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username *</label>
                      <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                        placeholder="postgres"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 dark:bg-slate-900/30 rounded-b-xl flex items-center justify-between">
              <button 
                onClick={handleTest}
                disabled={isTesting || !name.trim() || !databaseName.trim()}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Test Connection
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || !name.trim() || !databaseName.trim() || (testResult !== null && !testResult.success) || false}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

