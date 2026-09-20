import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Table2, ListOrdered, Bookmark, Clock, CheckCircle2, 
  XCircle, RefreshCw, BarChart2, MessageSquare, Terminal, LayoutDashboard
} from 'lucide-react';
import { 
  getDashboard, getQueries, getSavedQueries, getAnalytics, checkHealth 
} from '../../services/api';
import { ApiErrorAlert } from '../../components/UI/ApiErrorAlert';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useDashboardStore } from '../../store/dashboardStore';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const activeConnectionId = useConnectionStore(state => state.activeConnectionId);
  const {
    connectionId,
    loading,
    refreshing,
    error,
    backendHealth,
    lastUpdated,
    dashboardData,
    recentQueries,
    savedQueries,
    analyticsError,
    setConnectionId,
    setLoading,
    setRefreshing,
    setError,
    setBackendHealth,
    setLastUpdated,
    setDashboardData,
    setRecentQueries,
    setSavedQueries,
    setAnalyticsError,
    resetForConnection,
  } = useDashboardStore();

  const fetchData = async (isRefresh = false) => {
    if (!token) return;
    if (!activeConnectionId) {
      setError('Please select a database connection before refreshing the dashboard.');
      setBackendHealth('disconnected');
      return;
    }
    if (isRefresh && refreshing) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    setAnalyticsError(false);
    setBackendHealth('checking');

    try {
      // 1. Check health
      await checkHealth();
      setBackendHealth('connected');

      // 2. Fetch critical dashboard data
      const [dashRes, queriesRes, savedRes] = await Promise.all([
        getDashboard(),
        getQueries(),
        getSavedQueries(),
      ]);

      setDashboardData(dashRes.data);
      setRecentQueries(queriesRes.data?.queries || []);
      setSavedQueries(savedRes.data?.queries || []);
      setConnectionId(activeConnectionId);
      setLastUpdated(new Date().toISOString());

      // 3. Try fetching analytics (non-critical)
      try {
        await getAnalytics();
      } catch (e) {
        setAnalyticsError(true);
      }

    } catch (err: any) {
      setBackendHealth('disconnected');
      setError(err.message || 'Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (connectionId !== activeConnectionId) {
      resetForConnection(activeConnectionId);
      return;
    }
    if (activeConnectionId && !dashboardData) fetchData();
  }, [token, activeConnectionId, connectionId, dashboardData]);

  const handleRefresh = () => {
    if (!refreshing) {
      void fetchData(true);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
            <div className="h-4 w-72 bg-slate-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 dark:border-slate-700 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-28 animate-pulse">
               <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
               <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 p-5 h-64 animate-pulse"></div>
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 p-5 h-64 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-navy dark:text-white mb-6">Dashboard</h1>
        <ApiErrorAlert message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Tables',
      value: dashboardData?.statistics.total_tables || 0,
      description: 'Tables available in your database',
      icon: Table2,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Records',
      value: (dashboardData?.statistics.total_records || 0).toLocaleString(),
      description: 'Rows indexed across all tables',
      icon: Database,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'Total Queries',
      value: dashboardData?.statistics.queries_run || 0,
      description: 'Queries executed so far',
      icon: ListOrdered,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
    },
    {
      title: 'Saved Queries',
      value: savedQueries.length,
      description: 'Useful queries bookmarked',
      icon: Bookmark,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor your database, queries, and AI-powered insights from one place.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm">
            <div className={`w-2 h-2 rounded-full ${backendHealth === 'connected' ? 'bg-green-500' : backendHealth === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="font-medium text-slate-600 dark:text-slate-400 capitalize">{backendHealth}</span>
          </div>
          
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</span>
          </div>
          
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md shadow-sm transition-colors disabled:opacity-50 font-medium text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && <ApiErrorAlert message={error} />}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 dark:border-slate-700 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.title}</h3>
            </div>
            <div className="text-3xl font-bold text-navy dark:text-white">{kpi.value}</div>
            <div className="text-xs text-slate-400 mt-2">{kpi.description}</div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Database Overview */}
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                Database Overview
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {dashboardData?.schema_overview?.length || 0} Tables
              </span>
            </div>
            
            <div className="p-0 overflow-x-auto">
              {dashboardData?.schema_overview && dashboardData.schema_overview.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 dark:border-slate-700 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Table Name</th>
                      <th className="px-6 py-3 font-semibold">Columns</th>
                      <th className="px-6 py-3 font-semibold">Records</th>
                      <th className="px-6 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {dashboardData.schema_overview.map((table) => (
                      <tr key={table.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Table2 className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          {table.name}
                        </td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{table.columns}</td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{table.records.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right">
                          <button 
                            onClick={() => navigate('/schema')}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 text-xs font-medium"
                          >
                            View Schema
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <Database className="w-12 h-12 text-slate-200 mb-3" />
                  <h4 className="text-slate-700 dark:text-slate-300 font-medium">No tables found</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect a database to see its schema overview.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Queries */}
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-500" />
                Recent Queries
              </h3>
              <button 
                onClick={() => navigate('/history')}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
              >
                View All
              </button>
            </div>
            
            <div className="p-0 overflow-x-auto">
              {recentQueries.length > 0 ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {recentQueries.slice(0, 5).map((q, i) => (
                    <li key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">"{q.question || 'Direct SQL Query'}"</p>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {q.status === 'success' ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle2 className="w-3 h-3" /> Success</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle className="w-3 h-3" /> Failed</span>
                        )}
                        <span>{q.execution_time_ms ?? '--'} ms</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                  <h4 className="text-slate-700 dark:text-slate-300 font-medium">No queries yet</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Ask your database a question using natural language to get started.</p>
                  <button 
                    onClick={() => navigate('/query')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Start Querying
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>
        
        {/* Right Column (Narrower) */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2 mb-4">
               <LayoutDashboard className="w-5 h-5 text-violet-500" />
               Quick Actions
            </h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/query')} className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group">
                Ask Your Database <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
              </button>
              <button onClick={() => navigate('/schema')} className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group">
                Explore Schema <Table2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </button>
              <button onClick={() => navigate('/saved')} className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-teal-50 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group">
                Saved Queries <Bookmark className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />
              </button>
            </div>
          </div>

          {/* Saved Queries */}
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
              <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-teal-500" />
                Saved Queries
              </h3>
            </div>
            <div className="p-0">
              {savedQueries.length > 0 ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                   {savedQueries.slice(0, 4).map((sq) => (
                     <li key={sq.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors" onClick={() => navigate('/saved')}>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{sq.name}</p>
                        {sq.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{sq.description}</p>}
                     </li>
                   ))}
                </ul>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <Bookmark className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No saved queries yet. Save useful queries to run them later.</p>
                  <button 
                    onClick={() => navigate('/query')}
                    className="text-xs px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Create Query
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-pink-500" />
                Analytics
              </h3>
            </div>
            
            {analyticsError ? (
               <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg text-orange-700 dark:text-orange-300 text-sm flex items-start gap-2">
                 <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                 <p>Analytics temporarily unavailable</p>
               </div>
            ) : (
               <div className="h-32 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900/30">
                  <div className="text-center">
                    <BarChart2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Not enough data to display chart</p>
                  </div>
               </div>
            )}
            
            {!analyticsError && (
              <button 
                onClick={() => navigate('/analytics')}
                className="w-full mt-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 text-center"
              >
                View Full Analytics
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

// Add AlertTriangle to imports if needed, though Lucide has it. I'll define it since I used it above.
import { AlertTriangle } from 'lucide-react';
