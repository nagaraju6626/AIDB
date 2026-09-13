import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, Send, Loader2, Sparkles, Terminal, BarChart2, 
  Table as TableIcon, Download, Copy, Check, LayoutTemplate, Bookmark, X, Play
} from 'lucide-react';
import { API_BASE_URL, saveQuery } from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import { useLocation } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

import { useConnectionStore } from '../../store/connectionStore';
import { useNotificationStore } from '../../store/notificationStore';

export const QueryPage = () => {
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.question || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const activeConnectionId = useConnectionStore(state => state.activeConnectionId);

  useEffect(() => {
    if (location.state?.question) {
       setQuery(location.state.question);
       // We intentionally don't auto-run to allow user to edit or see it first
    }
  }, [location.state]);
  
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedData, setCopiedData] = useState(false);
  
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [chartConfig, setChartConfig] = useState({
    type: 'bar',
    xAxis: '',
    yAxis: ''
  });

  const handleAsk = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!query.trim()) return;

    if (!activeConnectionId) {
      setError("Please select a database connection first.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setActiveTab('table');
    
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/query/ask`, {
          connection_id: activeConnectionId,
          question: query
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      
      const data = response.data?.data || response.data;
      setResult(data);
      
      // Auto-configure chart if there are results
      if (data.rows && data.rows.length > 0 && data.columns && data.columns.length > 0) {
        const numericCols = data.columns.filter((c: string) => {
          const val = data.rows[0][c];
          return typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
        });
        const textCols = data.columns.filter((c: string) => {
          const val = data.rows[0][c];
          return typeof val === 'string' && isNaN(Number(val));
        });
        
        let initialChartType = data.chart_type && data.chart_type !== 'none' ? data.chart_type : 'bar';
        
        // Single KPI check
        if (data.rows.length === 1 && numericCols.length === 1 && textCols.length === 0) {
           initialChartType = 'kpi';
        }

        setChartConfig({
          type: initialChartType,
          xAxis: textCols.length > 0 ? textCols[0] : data.columns[0],
          yAxis: numericCols.length > 0 ? numericCols[0] : data.columns[data.columns.length - 1]
        });
        
        if (initialChartType !== 'none' && initialChartType !== 'kpi') {
          setActiveTab('chart');
        }
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'An error occurred while processing your request.');
    } finally {
      setIsProcessing(false);
      useNotificationStore.getState().fetchNotifications();
    }
  };

  const handleCopySql = () => {
    if (result?.sql) {
      navigator.clipboard.writeText(result.sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const handleCopyData = () => {
    if (result?.rows && result.rows.length > 0) {
      const headers = result.columns.join('\t');
      const rows = result.rows.map((row: any) => 
        result.columns.map((c: string) => row[c] !== null ? String(row[c]) : 'NULL').join('\t')
      ).join('\n');
      navigator.clipboard.writeText(`${headers}\n${rows}`);
      setCopiedData(true);
      setTimeout(() => setCopiedData(false), 2000);
    }
  };

  const handleSaveQuery = async () => {
    if (!saveName.trim() || !result?.sql) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveQuery({
        name: saveName,
        description: saveDesc,
        question: result.question || query,
        sql_query: result.sql
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaveModalOpen(false);
        setSaveSuccess(false);
        setSaveName('');
        setSaveDesc('');
      }, 2000);
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || err.message || 'Failed to save query');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (!result?.rows || result.rows.length === 0) return;
    const headers = result.columns.join(',');
    const rows = result.rows.map((row: any) => 
      result.columns.map((c: string) => {
        const val = row[c];
        if (val === null) return '';
        // Escape quotes and wrap in quotes if contains comma
        const strVal = String(val).replace(/"/g, '""');
        return strVal.includes(',') ? `"${strVal}"` : strVal;
      }).join(',')
    ).join('\n');
    
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-database-query-results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const numericColumns = useMemo(() => {
    if (!result?.rows || result.rows.length === 0) return [];
    return result.columns.filter((c: string) => {
      const val = result.rows[0][c];
      return typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
    });
  }, [result]);
  
  const categoricalColumns = useMemo(() => {
    if (!result?.rows || result.rows.length === 0) return [];
    return result.columns.filter((c: string) => {
      const val = result.rows[0][c];
      return typeof val === 'string' && isNaN(Number(val));
    });
  }, [result]);

  const chartData = useMemo(() => {
    if (!result?.rows) return [];
    return result.rows.map((row: any) => {
      const newRow = { ...row };
      result.columns.forEach((col: string) => {
        const val = newRow[col];
        if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
          newRow[col] = Number(val);
        }
      });
      return newRow;
    });
  }, [result]);

  const isKpi = result?.rows?.length === 1 && result.columns.length === 1 && typeof result.rows[0][result.columns[0]] === 'number';

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto gap-6 pb-12">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Ask Your Database Anything</h1>
        <p className="text-slate-500 dark:text-slate-400">Use natural language to explore your data securely.</p>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-32 py-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder='e.g., "Show me the top 5 students by marks"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleAsk();
               }
            }}
          />
          <button
            onClick={handleAsk}
            disabled={isProcessing || !query.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask AI</span>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {['Show the top 5 students by marks', 'How many employees are in each department?', 'List all courses with more than 50 students'].map(q => (
            <button 
              key={q}
              onClick={() => setQuery(q)}
              className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="font-medium animate-pulse">Analyzing your request...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isProcessing && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${error.toLowerCase().includes('quota') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'}`}>
           <Terminal className="w-5 h-5 mt-0.5 flex-shrink-0" />
           <div className="flex-1">
             <h4 className="font-semibold">{error.toLowerCase().includes('quota') ? 'API Quota Exceeded' : 'Query Failed'}</h4>
             <p className="text-sm mt-1 leading-relaxed">{error}</p>
             {error.toLowerCase().includes('quota') && (
               <button 
                 onClick={() => handleAsk()}
                 className="mt-3 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
               >
                 <Play className="w-3.5 h-3.5" />
                 Retry Query
               </button>
             )}
           </div>
        </div>
      )}

      {/* Result Section */}
      {result && !isProcessing && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Metadata & Summary Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 dark:text-green-400 flex items-center justify-center">
                   <Check className="w-4 h-4" />
                </div>
                <div>
                   <p className="font-medium text-slate-800 dark:text-slate-200">Query completed successfully</p>
                   <p className="text-slate-500 dark:text-slate-400 text-xs">{result.row_count} rows · {result.execution_time_ms} ms</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => { setSaveName(result.question || query); setSaveDesc(''); setIsSaveModalOpen(true); }} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-md shadow-sm flex items-center gap-2">
                  <Bookmark className="w-3 h-3" /> Save Query
                </button>
                <button onClick={handleExportCsv} disabled={!result.rows?.length} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-md shadow-sm flex items-center gap-2 disabled:opacity-50">
                  <Download className="w-3 h-3" /> CSV Export
                </button>
                <button onClick={handleCopyData} disabled={!result.rows?.length} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-md shadow-sm flex items-center gap-2 disabled:opacity-50">
                  {copiedData ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3" />} 
                  {copiedData ? 'Copied' : 'Copy Data'}
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Main Area: Tabs (Table/Chart) */}
            <div className="lg:col-span-3 space-y-6">
              
              {isKpi ? (
                 <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{result.columns[0]}</h3>
                    <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">{result.rows[0][result.columns[0]]?.toLocaleString()}</div>
                    <p className="text-slate-400 text-sm italic">"{result.question}"</p>
                 </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[400px]">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
                      <button 
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'table' ? 'bg-white dark:bg-slate-800 dark:border-slate-700 text-navy dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                      >
                        <TableIcon className="w-4 h-4" /> Table
                      </button>
                      <button 
                        onClick={() => setActiveTab('chart')}
                        disabled={numericColumns.length === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'chart' ? 'bg-white dark:bg-slate-800 dark:border-slate-700 text-navy dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                      >
                        <BarChart2 className="w-4 h-4" /> Chart
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-0 overflow-hidden flex flex-col">
                    {activeTab === 'table' && (
                      <div className="flex-1 overflow-auto">
                        {result.rows && result.rows.length > 0 ? (
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 dark:border-slate-700 border-b border-slate-200 dark:border-slate-700 sticky top-0 shadow-sm z-10">
                              <tr>
                                {result.columns.map((col: string) => (
                                  <th key={col} className="px-6 py-3 font-semibold whitespace-nowrap">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {result.rows.map((row: any, i: number) => (
                                <tr key={i} className="bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                  {result.columns.map((col: string, j: number) => {
                                    const val = row[col];
                                    let displayVal = val;
                                    let align = 'text-left';
                                    if (val === null) {
                                      displayVal = <span className="text-slate-300 italic">NULL</span>;
                                    } else if (typeof val === 'number') {
                                      displayVal = val.toLocaleString();
                                      align = 'text-right';
                                    } else if (typeof val === 'boolean') {
                                      displayVal = val ? 'True' : 'False';
                                    }
                                    return (
                                      <td key={j} className={`px-6 py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate ${align}`}>
                                        {displayVal}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-12 text-slate-500 dark:text-slate-400">
                            <Database className="w-12 h-12 text-slate-200 mb-4" />
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300">No results found</h3>
                            <p className="text-sm mt-1">The query executed successfully, but no records matched your request.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'chart' && (
                      <div className="flex-1 p-6 flex flex-col">
                        <div className="flex flex-wrap gap-4 mb-6 items-center">
                          <select 
                            className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                            value={chartConfig.type}
                            onChange={(e) => setChartConfig({...chartConfig, type: e.target.value})}
                          >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="scatter">Scatter Chart</option>
                          </select>
                          
                          {chartConfig.type !== 'pie' && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">X-Axis</span>
                                <select 
                                  className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                                  value={chartConfig.xAxis}
                                  onChange={(e) => setChartConfig({...chartConfig, xAxis: e.target.value})}
                                >
                                  {result.columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                            </>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{chartConfig.type === 'pie' ? 'Value' : 'Y-Axis'}</span>
                            <select 
                              className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                              value={chartConfig.yAxis}
                              onChange={(e) => setChartConfig({...chartConfig, yAxis: e.target.value})}
                            >
                              {numericColumns.map((c: string) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="flex-1 min-h-[300px]">
                          <ResponsiveContainer width="100%" height={400}>
                            {chartConfig.type === 'bar' ? (
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                <XAxis dataKey={chartConfig.xAxis} tick={{fontSize: 12, fill: 'var(--chart-text)'}} tickLine={false} axisLine={false} />
                                <YAxis tick={{fontSize: 12, fill: 'var(--chart-text)'}} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'var(--chart-cursor)'}} contentStyle={{borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend />
                                <Bar dataKey={chartConfig.yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            ) : chartConfig.type === 'line' ? (
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                <XAxis dataKey={chartConfig.xAxis} tick={{fontSize: 12, fill: 'var(--chart-text)'}} tickLine={false} axisLine={false} />
                                <YAxis tick={{fontSize: 12, fill: 'var(--chart-text)'}} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend />
                                <Line type="monotone" dataKey={chartConfig.yAxis} stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                              </LineChart>
                            ) : chartConfig.type === 'pie' ? (
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={2}
                                  dataKey={chartConfig.yAxis}
                                  nameKey={chartConfig.xAxis || result.columns[0]}
                                  label
                                >
                                  {chartData.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend />
                              </PieChart>
                            ) : chartConfig.type === 'scatter' ? (
                              <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis dataKey={chartConfig.xAxis} type={typeof chartData[0]?.[chartConfig.xAxis] === 'number' ? 'number' : 'category'} name={chartConfig.xAxis} tick={{fontSize: 12, fill: 'var(--chart-text)'}} />
                                <YAxis dataKey={chartConfig.yAxis} type="number" name={chartConfig.yAxis} tick={{fontSize: 12, fill: 'var(--chart-text)'}} />
                                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend />
                                <Scatter name={chartConfig.yAxis} data={chartData} fill="#8b5cf6" />
                              </ScatterChart>
                            ) : (
                               <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                                 Select a valid chart type.
                               </div>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: SQL & Insights */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* AI Insight */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30 p-5">
                <h3 className="font-semibold text-blue-900 flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    AI Insight
                  </div>
                  {result.insight_source === 'fallback' && (
                    <span className="text-xs text-blue-500/70 italic font-normal bg-blue-100/50 px-2 py-0.5 rounded-full">
                      Generated from query results
                    </span>
                  )}
                </h3>
                {result.insight ? (
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed text-sm">
                    {result.insight}
                  </p>
                ) : (
                  <p className="text-blue-500/70 italic text-sm">No insight available for this query.</p>
                )}
              </div>

              {/* Generated SQL */}
              <div className="bg-[#0F172A] rounded-xl shadow-sm border border-slate-800 overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                  <h3 className="font-medium text-slate-300 text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Generated SQL
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={handleCopySql} className="text-slate-400 hover:text-white transition-colors" title="Copy SQL">
                       {copiedSql ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-5 overflow-auto max-h-[300px]">
                  <pre className="text-blue-300 font-mono text-xs whitespace-pre-wrap">
                    {result.sql}
                  </pre>
                </div>
              </div>
              
              {/* Data Summary */}
              <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                 <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2 mb-4">
                    <LayoutTemplate className="w-4 h-4 text-violet-500" />
                    Data Summary
                 </h3>
                 <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                       <span className="text-slate-500 dark:text-slate-400">Columns</span>
                       <span className="font-medium text-slate-700 dark:text-slate-300">{result.columns?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-slate-500 dark:text-slate-400">Numeric</span>
                       <span className="font-medium text-slate-700 dark:text-slate-300">{numericColumns.length}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-slate-500 dark:text-slate-400">Categorical</span>
                       <span className="font-medium text-slate-700 dark:text-slate-300">{categoricalColumns.length}</span>
                    </div>
                 </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* Save Query Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-navy dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-500" />
                Save Query
              </h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {saveSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center gap-3">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Query saved successfully!</span>
                </div>
              ) : (
                <>
                  {saveError && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                      {saveError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Query Name *</label>
                    <input 
                      type="text" 
                      value={saveName} 
                      onChange={(e) => setSaveName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Top 5 Students"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                    <textarea 
                      value={saveDesc} 
                      onChange={(e) => setSaveDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px]"
                      placeholder="What does this query do?"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button 
                      onClick={() => setIsSaveModalOpen(false)} 
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveQuery}
                      disabled={isSaving || !saveName.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                      Save Query
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
