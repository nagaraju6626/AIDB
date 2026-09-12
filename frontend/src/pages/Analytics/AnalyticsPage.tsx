import { useEffect, useState } from 'react';
import { getAnalytics } from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Activity, Clock, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  average_execution_time: number;
  ai_queries: number;
  sql_queries: number;
  queries_per_day: { name: string; queries: number }[];
  success_vs_failure: { name: string; value: number }[];
  ai_vs_sql: { name: string; value: number }[];
  average_response_time: { name: string; time: number }[];
}

export const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalytics();
      if (res.success) {
        setData(res.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const PIE_COLORS = ['#10b981', '#ef4444'];
  const AI_COLORS = ['#8b5cf6', 'var(--chart-text)'];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Analytics Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Key metrics and usage statistics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-32 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-80 animate-pulse"></div>
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Analytics Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Key metrics and usage statistics</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Failed to load analytics</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const successRate = data.total_queries > 0 
    ? Math.round((data.successful_queries / data.total_queries) * 100) 
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Key metrics and usage statistics</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Queries</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{data.total_queries}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">All time queries</div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Success Rate</h3>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{successRate}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">{data.successful_queries} successful queries</div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">AI Generated</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{data.ai_queries}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Natural language queries</div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Execution Time</h3>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{data.average_execution_time} ms</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Average DB execution time</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-6">Queries Over Time (Last 7 Days)</h3>
          {data.queries_per_day.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.queries_per_day}>
                  <defs>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--chart-text)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--chart-text)', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="queries" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400">No data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-6">Execution Time Trend (ms)</h3>
          {data.average_response_time.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.average_response_time}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--chart-text)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--chart-text)', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="time" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400">No data available</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-6">Success vs Failure</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.success_vs_failure}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.success_vs_failure.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-6">Query Source</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ai_vs_sql} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--chart-grid)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'var(--chart-text)', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                  {data.ai_vs_sql.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={AI_COLORS[index % AI_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
