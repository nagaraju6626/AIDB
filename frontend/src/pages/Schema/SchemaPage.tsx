import { useEffect, useState, useMemo } from 'react';
import { 
  Database, Table2, Search, Key, Link as LinkIcon, RefreshCw, 
  ChevronRight, AlignLeft, Info, Eye
} from 'lucide-react';
import { 
  getSchema, getTableSchema, getTablePreview 
} from '../../services/api';
import { ApiErrorAlert } from '../../components/UI/ApiErrorAlert';
import { useAuthStore } from '../../store/authStore';

interface TableOverview {
  name: string;
  columns: number;
  records: number;
}

interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key: { table: string; column: string } | null;
}

interface TableDetail {
  name: string;
  columns: ColumnDef[];
  indexes: any[];
}

interface TablePreview {
  name: string;
  rows: any[];
}

export const SchemaPage = () => {
  const { token } = useAuthStore();
  
  // State
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [tables, setTables] = useState<TableOverview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [tableDetail, setTableDetail] = useState<TableDetail | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [tablePreview, setTablePreview] = useState<TablePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load database tables list
  const fetchDatabaseSchema = async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoadingSchema(true);
    setError(null);
    try {
      const res = await getSchema();
      setTables(res.data?.tables || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load database schema.');
    } finally {
      setLoadingSchema(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDatabaseSchema();
  }, [token]);

  // Load selected table details and preview
  useEffect(() => {
    if (!selectedTableName || !token) return;

    const fetchTableDetails = async () => {
      setLoadingDetails(true);
      setDetailsError(null);
      setTablePreview(null);
      setPreviewError(null);
      setShowPreview(false);
      
      try {
        const res = await getTableSchema(selectedTableName);
        setTableDetail(res.data);
      } catch (err: any) {
        setDetailsError(err.message || 'Failed to load table details.');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchTableDetails();
  }, [selectedTableName, token]);

  const handleLoadPreview = async () => {
    if (!selectedTableName) return;
    setLoadingPreview(true);
    setPreviewError(null);
    setShowPreview(true);
    try {
      const res = await getTablePreview(selectedTableName);
      setTablePreview(res.data);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to load table preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const lowerQ = searchQuery.toLowerCase();
    return tables.filter(t => t.name.toLowerCase().includes(lowerQ));
  }, [tables, searchQuery]);

  // Extract relationships from table columns
  const relationships = useMemo(() => {
    if (!tableDetail) return [];
    return tableDetail.columns.filter(c => c.foreign_key !== null);
  }, [tableDetail]);

  const handleRefresh = () => {
    fetchDatabaseSchema(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-slate-900/30">
      
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 dark:border-slate-700 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Schema Explorer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Explore your database structure, relationships, and data.</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing || loadingSchema}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg shadow-sm transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Schema
        </button>
      </div>

      {error && (
        <div className="p-6">
          <ApiErrorAlert message={error} onRetry={handleRefresh} />
        </div>
      )}

      {/* Main Layout - 3 Columns on large screens */}
      {!error && (
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Column: Tables List */}
          <div className="w-full lg:w-[25%] xl:w-[20%] flex-shrink-0 bg-white dark:bg-slate-800 dark:border-slate-700 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tables..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {loadingSchema ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="p-6 text-center">
                  <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No tables found</p>
                  {searchQuery && <p className="text-xs text-slate-400 mt-1">Try a different search term</p>}
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredTables.map(table => (
                    <li key={table.name}>
                      <button 
                        onClick={() => setSelectedTableName(table.name)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${selectedTableName === table.name ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Table2 className={`w-4 h-4 flex-shrink-0 ${selectedTableName === table.name ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                          <span className={`text-sm truncate ${selectedTableName === table.name ? 'font-semibold text-blue-900' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {table.name}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedTableName === table.name ? 'text-blue-500 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Center & Right Area (Scrollable container for Mobile, Split for Desktop) */}
          <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-900/30">
            
            {!selectedTableName ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/30">
                  <Table2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-navy dark:text-white">Select a table</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Choose a table from the database explorer to view its schema, relationships, and preview data.</p>
              </div>
            ) : (
              <>
                {/* Center Column: Schema Table Details */}
                <div className="flex-1 lg:overflow-y-auto p-4 md:p-6 lg:border-r border-slate-200 dark:border-slate-700">
                  
                  {loadingDetails ? (
                    <div className="space-y-6">
                      <div className="h-20 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"></div>
                      <div className="h-64 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"></div>
                    </div>
                  ) : detailsError ? (
                    <ApiErrorAlert message={detailsError} />
                  ) : tableDetail ? (
                    <div className="space-y-6 max-w-4xl mx-auto">
                      
                      {/* Table Info Card */}
                      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
                              <Table2 className="w-6 h-6 text-indigo-500" />
                              {tableDetail.name}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
                              <span className="flex items-center gap-1"><AlignLeft className="w-4 h-4" /> {tableDetail.columns.length} Columns</span>
                              {tables.find(t => t.name === tableDetail.name) && (
                                <span className="flex items-center gap-1"><Database className="w-4 h-4" /> {(tables.find(t => t.name === tableDetail.name)?.records || 0).toLocaleString()} Rows</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Columns List */}
                      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Table Schema</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-slate-800 dark:border-slate-700 border-b border-slate-100 text-slate-500 dark:text-slate-400">
                              <tr>
                                <th className="px-4 py-3 font-medium">Column</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Nullable</th>
                                <th className="px-4 py-3 font-medium">Key</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {tableDetail.columns.map(col => (
                                <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                    {col.name}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:text-slate-400 rounded text-xs font-mono">{col.type}</span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                    {col.nullable ? 'YES' : 'NO'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                      {col.primary_key && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 w-fit">
                                          <Key className="w-3 h-3" /> PK
                                        </span>
                                      )}
                                      {col.foreign_key && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200 w-fit">
                                          <LinkIcon className="w-3 h-3" /> FK → {col.foreign_key.table}.{col.foreign_key.column}
                                        </span>
                                      )}
                                      {!col.primary_key && !col.foreign_key && (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  ) : null}
                </div>

                {/* Right Column: Relationships & Preview */}
                <div className="w-full lg:w-[60%] xl:w-[55%] flex-shrink-0 lg:overflow-y-auto p-4 md:p-6 space-y-6">
                  
                  {tableDetail && (
                    <>
                      {/* Relationships View */}
                      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-indigo-500" />
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Relationships</h3>
                        </div>
                        <div className="p-5">
                          {relationships.length > 0 ? (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent hidden-before-empty">
                              {/* Simple CSS-based visualization */}
                              <div className="relative z-10 bg-white dark:bg-slate-800 dark:border-slate-700 border border-indigo-200 rounded-lg p-3 text-center shadow-sm">
                                <span className="font-semibold text-indigo-900 text-sm">{tableDetail.name}</span>
                              </div>
                              
                              <div className="relative z-10 flex flex-col gap-4 items-center">
                                {relationships.map(rel => (
                                  <div key={rel.name} className="flex flex-col items-center">
                                    <div className="w-px h-6 bg-slate-300"></div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 mb-1 z-10">
                                      {rel.name} → {rel.foreign_key?.column}
                                    </div>
                                    <div className="w-px h-6 bg-slate-300"></div>
                                    <div className="bg-white dark:bg-slate-800 dark:border-slate-700 border border-blue-200 rounded-lg p-3 text-center shadow-sm w-full max-w-[200px]">
                                      <span className="font-medium text-blue-900 text-sm">{rel.foreign_key?.table}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                              <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                              <p className="text-sm">No foreign key relationships detected by the backend metadata.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Data Preview */}
                      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Data Preview</h3>
                          </div>
                          {!showPreview && (
                            <button 
                              onClick={handleLoadPreview}
                              className="text-xs bg-white dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-md font-medium transition-colors"
                            >
                              Load Preview
                            </button>
                          )}
                        </div>
                        
                        <div className="p-0 max-h-[400px] overflow-auto">
                          {showPreview ? (
                            loadingPreview ? (
                              <div className="p-5 space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse"></div>)}
                              </div>
                            ) : previewError ? (
                              <div className="p-5">
                                <ApiErrorAlert message={previewError} onRetry={handleLoadPreview} />
                              </div>
                            ) : tablePreview && tablePreview.rows.length > 0 ? (
                              <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700 sticky top-0 shadow-sm">
                                  <tr>
                                    {Object.keys(tablePreview.rows[0]).map(key => (
                                      <th key={key} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400">{key}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                  {tablePreview.rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                      {Object.values(row).map((val: any, vIdx) => (
                                        <td key={vIdx} className="px-4 py-2 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                          {val === null ? <span className="text-slate-300 italic">null</span> : String(val)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                Table is empty. No rows to display.
                              </div>
                            )
                          ) : (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                              Click 'Load Preview' to view a sample of the data.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
