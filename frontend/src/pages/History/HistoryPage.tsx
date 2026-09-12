import { useState, useEffect } from 'react';
import { getQueries } from '../../services/api';
import { Clock, Search, Filter, CheckCircle2, XCircle, MessageSquare, Code, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HistoryPage = () => {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    getQueries().then(res => {
      setQueries(res.data?.queries || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredQueries = queries.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase()) || 
                          (q.sql_query && q.sql_query.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' ? true : q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading history...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            Query History
          </h1>
          <p className="text-slate-500 dark:text-slate-400">View and revisit your previous database questions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search query history..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {filteredQueries.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center flex flex-col items-center">
          <Clock className="w-12 h-12 text-slate-200 mb-4" />
          <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300">No query history yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Your database questions will appear here after you run them.</p>
          <button onClick={() => navigate('/query')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Ask Your Database
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredQueries.map((q) => (
              <li key={q.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <h4 className="font-medium text-navy dark:text-white">{q.question}</h4>
                    </div>
                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100">
                      <Code className="w-4 h-4 text-blue-400 mt-0.5" />
                      <pre className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap flex-1">{q.sql_query}</pre>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium mt-3">
                      {q.status === 'success' ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Success</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Failed</span>
                      )}
                      {q.status === 'success' && <span className="text-slate-500 dark:text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{q.row_count} rows</span>}
                      {q.status === 'success' && <span className="text-slate-500 dark:text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{q.execution_time_ms} ms</span>}
                      <span className="text-slate-400 ml-auto">{new Date(q.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => navigate('/query', { state: { question: q.question } })}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3" /> Run Again
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(q.sql_query)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Copy SQL
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
