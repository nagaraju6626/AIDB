import { useState, useEffect } from 'react';
import { getSavedQueries, deleteSavedQuery, updateSavedQuery } from '../../services/api';
import { Bookmark, Search, MessageSquare, Code, Play, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SavedQueriesPage = () => {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const [editingQuery, setEditingQuery] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  const loadQueries = () => {
    setLoading(true);
    getSavedQueries().then(res => {
      setQueries(res.data?.queries || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete saved query?\nThis action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteSavedQuery(id);
      setQueries(queries.filter(q => q.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete query");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingQuery || !editName.trim()) return;
    setIsSaving(true);
    try {
      await updateSavedQuery(editingQuery.id, { name: editName, description: editDesc });
      setEditingQuery(null);
      loadQueries();
    } catch (e) {
      console.error(e);
      alert("Failed to update query");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQueries = queries.filter(q => {
    const s = search.toLowerCase();
    return q.name.toLowerCase().includes(s) || 
           (q.description && q.description.toLowerCase().includes(s)) ||
           q.question.toLowerCase().includes(s) ||
           (q.sql_query && q.sql_query.toLowerCase().includes(s));
  });

  if (loading && queries.length === 0) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading saved queries...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-blue-500" />
            Saved Queries
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Quickly access and run your favorite database questions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search saved queries..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {queries.length === 0 && !loading ? (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center flex flex-col items-center">
          <Bookmark className="w-12 h-12 text-slate-200 mb-4" />
          <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300">No saved queries yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Save useful database questions so you can quickly run them again.</p>
          <button onClick={() => navigate('/query')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Ask Your Database
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQueries.map((q) => (
            <div key={q.id} className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-navy dark:text-white text-lg">{q.name}</h3>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingQuery(q); setEditName(q.name); setEditDesc(q.description || ''); }} 
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)} 
                    disabled={deletingId === q.id}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                  >
                    {deletingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {q.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{q.description}</p>}
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{q.question}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 flex items-start gap-2 max-h-32 overflow-hidden relative">
                  <Code className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <pre className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap">{q.sql_query}</pre>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => navigate('/query', { state: { question: q.question } })}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" /> Run Query
                </button>
                <button 
                  onClick={() => navigator.clipboard.writeText(q.sql_query)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Copy SQL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingQuery && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-500" />
                Edit Saved Query
              </h3>
              <button onClick={() => setEditingQuery(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Query Name *</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingQuery(null)} 
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditSave}
                  disabled={isSaving || !editName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
