import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Upload, FileArrowUp, FileCsv, FileText, CheckCircle, WarningCircle, Clock, Eye, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const fmt = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n?.toLocaleString?.() || '0';
};

const AdminRoyaltyImportPage = () => {
  const [imports, setImports] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedImport, setSelectedImport] = useState(null);
  const [importDetail, setImportDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [assigningEntry, setAssigningEntry] = useState(null);
  const [assignArtistId, setAssignArtistId] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const fetchImports = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/royalties/imports`);
      setImports(res.data.imports || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/royalties/users`);
      setAllUsers(res.data.users || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchImports(); fetchUsers(); }, [fetchImports, fetchUsers]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API}/admin/royalties/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      toast.success(`Import complete: ${res.data.matched} matched, ${res.data.unmatched} unmatched`);
      fetchImports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally { setImporting(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleViewImport = async (importId) => {
    setSelectedImport(importId);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API}/admin/royalties/imports/${importId}`);
      setImportDetail(res.data);
    } catch (err) {
      toast.error('Failed to load import details');
    } finally { setLoadingDetail(false); }
  };

  const handleAssign = async (entryId) => {
    if (!assignArtistId) { toast.error('Select a user'); return; }
    try {
      await axios.put(`${API}/admin/royalties/entries/${entryId}/assign`, { artist_id: assignArtistId });
      toast.success('Entry assigned!');
      setAssigningEntry(null);
      setAssignArtistId('');
      if (selectedImport) handleViewImport(selectedImport);
      fetchImports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Assignment failed');
    }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8" data-testid="admin-royalty-import">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Royalty <span className="text-[#E53935]">Import</span></h1>
          <p className="text-gray-400 mt-1">Upload CSV reports from CD Baby, DistroKid, RouteNote, or any distributor. Auto-match and distribute earnings to platform users.</p>
        </div>

        {/* Upload Section */}
        <div className="card-kalmori p-6" data-testid="admin-import-section">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <FileArrowUp className="w-5 h-5 text-[#E53935]" /> Upload Distributor Report
          </h3>
          <p className="text-xs text-gray-500 mb-5">We'll auto-detect columns and fuzzy-match artist names to users on your platform.</p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragOver ? 'border-[#E53935] bg-[#E53935]/5' : 'border-white/10 hover:border-[#E53935]/40 hover:bg-white/[0.02]'
            } ${importing ? 'pointer-events-none opacity-50' : ''}`}
            data-testid="admin-csv-dropzone"
          >
            <input type="file" ref={fileInputRef} accept=".csv" className="hidden"
              onChange={(e) => { handleFileUpload(e.target.files[0]); e.target.value = ''; }}
              data-testid="admin-csv-file-input" />
            {importing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Parsing CSV and matching users across platform...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#E53935]/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[#E53935]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Drop your CSV file here or <span className="text-[#E53935] font-bold">browse</span></p>
                  <p className="text-xs text-gray-500 mt-1">Supports CSV files from CD Baby, DistroKid, RouteNote, TuneCore, and more</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {['Artist', 'Track', 'Platform', 'Country', 'Streams', 'Revenue', 'Period'].map(col => (
              <span key={col} className="text-[10px] px-2.5 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5">{col}</span>
            ))}
            <span className="text-[10px] text-gray-500 self-center ml-1">columns auto-detected from headers</span>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className="card-kalmori p-6 border-[#E53935]/20" data-testid="admin-import-result">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#1DB954]" /> Import Complete
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold font-mono text-white">{importResult.total_rows}</p>
                <p className="text-[10px] text-gray-500 mt-1">Total Rows</p>
              </div>
              <div className="text-center p-3 bg-[#1DB954]/5 rounded-xl">
                <p className="text-2xl font-bold font-mono text-[#1DB954]">{importResult.matched}</p>
                <p className="text-[10px] text-gray-500 mt-1">Matched</p>
              </div>
              <div className="text-center p-3 bg-[#FF6B6B]/5 rounded-xl">
                <p className="text-2xl font-bold font-mono text-[#FF6B6B]">{importResult.unmatched}</p>
                <p className="text-[10px] text-gray-500 mt-1">Unmatched</p>
              </div>
              <div className="text-center p-3 bg-[#FFD700]/5 rounded-xl">
                <p className="text-2xl font-bold font-mono text-[#FFD700]">${importResult.total_revenue?.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Total Revenue</p>
              </div>
            </div>
            {importResult.column_mapping && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                <span className="text-[10px] text-gray-500">Detected:</span>
                {Object.entries(importResult.column_mapping).map(([field, col]) => (
                  <span key={field} className="text-[10px] px-2 py-0.5 rounded-full bg-[#E53935]/10 text-[#E53935]">{field}: {col}</span>
                ))}
              </div>
            )}
            {importResult.unmatched > 0 && importResult.import_id && (
              <Button onClick={() => handleViewImport(importResult.import_id)}
                className="mt-4 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF6B6B] font-bold text-xs gap-2" data-testid="admin-view-unmatched-btn">
                <WarningCircle className="w-4 h-4" /> Review & Assign Unmatched Entries
              </Button>
            )}
          </div>
        )}

        {/* Import History */}
        <div className="card-kalmori overflow-hidden" data-testid="admin-import-history">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FFD700]" /> Import History
            </h3>
          </div>
          {imports.length === 0 ? (
            <div className="p-10 text-center">
              <FileArrowUp className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No imports yet. Upload a distributor CSV to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">File</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Rows</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Matched</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Unmatched</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Revenue</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                    <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((imp) => (
                    <tr key={imp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`admin-import-row-${imp.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileCsv className="w-4 h-4 text-[#1DB954] flex-shrink-0" />
                          <span className="text-sm text-white truncate max-w-[200px]">{imp.filename}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-gray-300">{imp.total_rows}</td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-[#1DB954]">{imp.matched}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-mono ${imp.unmatched > 0 ? 'text-[#FF6B6B]' : 'text-gray-500'}`}>{imp.unmatched}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-[#FFD700]">${imp.total_revenue?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{imp.created_at ? new Date(imp.created_at).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleViewImport(imp.id)}
                          className="p-1.5 text-[#E53935] hover:bg-[#E53935]/10 rounded-lg transition-colors"
                          data-testid={`admin-view-import-${imp.id}`}>
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Import Detail Modal */}
        {selectedImport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setSelectedImport(null); setImportDetail(null); }}
            data-testid="admin-import-detail-modal">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Import Details</h3>
                  {importDetail?.import && (
                    <p className="text-xs text-gray-500 mt-0.5">{importDetail.import.filename} — {importDetail.import.total_rows} rows</p>
                  )}
                </div>
                <button onClick={() => { setSelectedImport(null); setImportDetail(null); }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" data-testid="admin-close-import-detail">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : importDetail ? (
                <div className="overflow-auto max-h-[calc(85vh-80px)]">
                  <div className="grid grid-cols-4 gap-4 p-5 border-b border-white/5">
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-white">{importDetail.import?.total_rows}</p>
                      <p className="text-[10px] text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-[#1DB954]">{importDetail.import?.matched}</p>
                      <p className="text-[10px] text-gray-500">Matched</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-[#FF6B6B]">{importDetail.import?.unmatched}</p>
                      <p className="text-[10px] text-gray-500">Unmatched</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-[#FFD700]">${importDetail.import?.total_revenue?.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500">Revenue</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="sticky top-0">
                        <tr className="border-b border-white/5 bg-[#0A0A0A]">
                          <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Artist (Raw)</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Matched To</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Track</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Platform</th>
                          <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Streams</th>
                          <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Revenue</th>
                          <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importDetail.entries?.map((entry) => (
                          <tr key={entry.id}
                            className={`border-b border-white/5 transition-colors ${entry.status === 'unmatched' ? 'bg-[#FF6B6B]/[0.03]' : 'hover:bg-white/5'}`}
                            data-testid={`admin-entry-row-${entry.id}`}>
                            <td className="py-3 px-4">
                              {entry.status === 'matched' ? (
                                <span className="inline-flex items-center gap-1 text-xs text-[#1DB954]">
                                  <CheckCircle className="w-3.5 h-3.5" weight="fill" /> Matched
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-[#FF6B6B]">
                                  <WarningCircle className="w-3.5 h-3.5" weight="fill" /> Unmatched
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">{entry.artist_name_raw}</td>
                            <td className="py-3 px-4 text-sm text-white">
                              {entry.matched_artist_name || <span className="text-gray-500 italic">—</span>}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-400 max-w-[140px] truncate">{entry.track || '—'}</td>
                            <td className="py-3 px-4 text-xs text-gray-400">{entry.platform || '—'}</td>
                            <td className="py-3 px-4 text-right text-sm font-mono text-gray-300">{entry.streams?.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-sm font-mono text-[#FFD700]">${entry.revenue?.toFixed(4)}</td>
                            <td className="py-3 px-4 text-center">
                              {entry.status === 'unmatched' && (
                                assigningEntry === entry.id ? (
                                  <div className="flex items-center gap-2 justify-center">
                                    <select value={assignArtistId} onChange={(e) => setAssignArtistId(e.target.value)}
                                      className="bg-[#141414] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#E53935] max-w-[160px]"
                                      data-testid={`admin-assign-select-${entry.id}`}>
                                      <option value="">Select user</option>
                                      {allUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.artist_name || u.name} ({u.email})</option>
                                      ))}
                                    </select>
                                    <button onClick={() => handleAssign(entry.id)}
                                      className="p-1 text-[#1DB954] hover:bg-[#1DB954]/10 rounded" data-testid={`admin-confirm-assign-${entry.id}`}>
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setAssigningEntry(null); setAssignArtistId(''); }}
                                      className="p-1 text-gray-500 hover:bg-white/10 rounded">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => { setAssigningEntry(entry.id); setAssignArtistId(''); }}
                                    className="text-xs text-[#E53935] hover:text-[#E53935]/80 underline underline-offset-2 font-medium"
                                    data-testid={`admin-assign-btn-${entry.id}`}>
                                    Assign
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRoyaltyImportPage;
