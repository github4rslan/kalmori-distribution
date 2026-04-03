import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { API, BACKEND_URL, useAuth } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Users, ChartLineUp, CurrencyDollar, Disc, MusicNotes, Globe, Plus, X, Trash, ArrowSquareOut, Lightning, Envelope, Percent, FloppyDisk, DownloadSimple, Upload, FileText, FileCsv, CheckCircle, WarningCircle, Clock, ArrowRight, CaretDown, Eye, FileArrowUp } from '@phosphor-icons/react';
import { toast } from 'sonner';

const fmt = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n?.toLocaleString?.() || '0';
};

const StatCard = ({ label, value, icon, color, testId }) => (
  <div className="bg-[#141414] border border-white/10 rounded-xl p-5" data-testid={testId}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
    </div>
    <p className="text-2xl font-bold font-mono text-white">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

const LabelDashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [royalties, setRoyalties] = useState(null);
  const [editingSplit, setEditingSplit] = useState(null);
  const [splitValue, setSplitValue] = useState(70);
  const [savingSplit, setSavingSplit] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [imports, setImports] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedImport, setSelectedImport] = useState(null);
  const [importDetail, setImportDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [assigningEntry, setAssigningEntry] = useState(null);
  const [assignArtistId, setAssignArtistId] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [exporting, setExporting] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, artistsRes, royaltiesRes] = await Promise.all([
        axios.get(`${API}/label/dashboard`, { withCredentials: true }),
        axios.get(`${API}/label/artists`, { withCredentials: true }),
        axios.get(`${API}/label/royalties`, { withCredentials: true }),
      ]);
      setDashboard(dashRes.data);
      setArtists(artistsRes.data.artists || []);
      setRoyalties(royaltiesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchImports = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/label/royalties/imports`, { withCredentials: true });
      setImports(res.data.imports || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { if (activeTab === 'payouts') fetchImports(); }, [activeTab, fetchImports]);

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
      const res = await axios.post(`${API}/label/royalties/import`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      toast.success(`Import complete: ${res.data.matched} matched, ${res.data.unmatched} unmatched`);
      fetchImports();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally { setImporting(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await axios.get(`${API}/label/royalties/export/${format}`, {
        withCredentials: true,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kalmori_payout_report.${format === 'csv' ? 'csv' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally { setExporting(null); }
  };

  const handleViewImport = async (importId) => {
    setSelectedImport(importId);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API}/label/royalties/imports/${importId}`, { withCredentials: true });
      setImportDetail(res.data);
    } catch (err) {
      toast.error('Failed to load import details');
    } finally { setLoadingDetail(false); }
  };

  const handleAssign = async (entryId) => {
    if (!assignArtistId) { toast.error('Select an artist'); return; }
    try {
      await axios.put(`${API}/label/royalties/entries/${entryId}/assign`, { artist_id: assignArtistId }, { withCredentials: true });
      toast.success('Entry assigned!');
      setAssigningEntry(null);
      setAssignArtistId('');
      if (selectedImport) handleViewImport(selectedImport);
      fetchImports();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await axios.post(`${API}/label/artists/invite`, { email: inviteEmail }, { withCredentials: true });
      toast.success(res.data.message);
      setInviteEmail('');
      setShowInvite(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add artist');
    } finally { setInviting(false); }
  };

  const handleRemove = async (artistId, name) => {
    if (!window.confirm(`Remove ${name} from your roster?`)) return;
    try {
      await axios.delete(`${API}/label/artists/${artistId}`, { withCredentials: true });
      toast.success(`${name} removed`);
      fetchAll();
    } catch { toast.error('Failed to remove artist'); }
  };

  const handleSaveSplit = async (artistId) => {
    setSavingSplit(true);
    try {
      await axios.put(`${API}/label/artists/${artistId}/split`, {
        artist_split: splitValue,
        label_split: 100 - splitValue,
      }, { withCredentials: true });
      toast.success('Royalty split updated!');
      setEditingSplit(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update split');
    } finally { setSavingSplit(false); }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  const d = dashboard || {};
  const statusColor = (s) => s === 'distributed' ? 'text-[#1DB954]' : s === 'pending_review' ? 'text-[#FFD700]' : s === 'rejected' ? 'text-[#E53935]' : 'text-gray-400';

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="label-dashboard">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Label <span className="text-[#FFD700]">Dashboard</span></h1>
            <p className="text-gray-400 text-sm mt-1">Manage your roster, track collective performance</p>
          </div>
          <Button onClick={() => setShowInvite(!showInvite)} className="bg-[#FFD700] hover:bg-[#FFC107] text-black font-bold" data-testid="add-artist-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Artist
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#141414] p-1 rounded-xl w-fit border border-white/10">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'royalties', label: 'Royalty Splits' },
            { id: 'payouts', label: 'Payouts & Import' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#FFD700] text-black' : 'text-gray-400 hover:text-white'}`}
              data-testid={`tab-${tab.id}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Invite Modal */}
        {showInvite && (
          <div className="bg-[#141414] border border-[#FFD700]/30 rounded-xl p-6" data-testid="invite-artist-form">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#FFD700]">Add Artist to Roster</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Enter the email of an existing Kalmori user to add them to your label roster.</p>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center bg-[#0A0A0A] border border-white/10 rounded-lg overflow-hidden">
                <Envelope className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="artist@email.com" className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()} data-testid="invite-email-input" />
              </div>
              <Button onClick={handleInvite} disabled={inviting} className="bg-[#FFD700] hover:bg-[#FFC107] text-black font-bold px-6" data-testid="send-invite-btn">
                {inviting ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {activeTab === 'overview' && <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Artists" value={d.total_artists || 0} icon={<Users className="w-5 h-5" />} color="#FFD700" testId="label-stat-artists" />
          <StatCard label="Total Streams" value={fmt(d.total_streams || 0)} icon={<ChartLineUp className="w-5 h-5" />} color="#7C4DFF" testId="label-stat-streams" />
          <StatCard label="Revenue" value={`$${(d.total_revenue || 0).toFixed(2)}`} icon={<CurrencyDollar className="w-5 h-5" />} color="#1DB954" testId="label-stat-revenue" />
          <StatCard label="Releases" value={d.total_releases || 0} icon={<Disc className="w-5 h-5" />} color="#E040FB" testId="label-stat-releases" />
          <StatCard label="This Week" value={fmt(d.week_streams || 0)} icon={<Lightning className="w-5 h-5" />} color="#FF6B6B" testId="label-stat-week" />
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Breakdown */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5" data-testid="label-platform-breakdown">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <MusicNotes className="w-4 h-4 text-[#7C4DFF]" /> Platform Streams
            </h3>
            {d.platform_breakdown?.length > 0 ? (
              <div className="space-y-3">
                {d.platform_breakdown.map((p, i) => {
                  const max = d.platform_breakdown[0]?.streams || 1;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20 truncate">{p.platform}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] rounded-full" style={{ width: `${(p.streams / max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-white font-mono w-12 text-right">{fmt(p.streams)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-gray-500 text-sm text-center py-4">Add artists to see data</p>}
          </div>

          {/* Country Breakdown */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5" data-testid="label-country-breakdown">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#E040FB]" /> Top Markets
            </h3>
            {d.country_breakdown?.length > 0 ? (
              <div className="space-y-3">
                {d.country_breakdown.map((c, i) => {
                  const max = d.country_breakdown[0]?.streams || 1;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20 truncate">{c.country}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#E040FB] to-[#FF4081] rounded-full" style={{ width: `${(c.streams / max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-white font-mono w-12 text-right">{fmt(c.streams)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-gray-500 text-sm text-center py-4">Add artists to see data</p>}
          </div>

          {/* Top Artists (from roster) */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5" data-testid="label-top-artists">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <ChartLineUp className="w-4 h-4 text-[#FFD700]" /> Top Performers
            </h3>
            {d.top_artists?.length > 0 ? (
              <div className="space-y-3">
                {d.top_artists.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-4 font-mono">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF6B6B] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {a.artist_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{a.artist_name || a.name}</p>
                      <p className="text-[10px] text-gray-500">{a.releases} releases</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#7C4DFF] font-mono">{fmt(a.streams)}</p>
                      <p className="text-[10px] text-[#1DB954]">${a.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm text-center py-4">Add artists to see data</p>}
          </div>
        </div>

        {/* Artist Roster Table */}
        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden" data-testid="label-artist-roster">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Artist Roster ({artists.length})</h2>
          </div>
          {artists.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-2">Your roster is empty</p>
              <p className="text-gray-500 text-xs mb-4">Add artists by their email to start managing their releases and tracking analytics.</p>
              <Button onClick={() => setShowInvite(true)} className="bg-[#FFD700] hover:bg-[#FFC107] text-black font-bold text-xs" data-testid="empty-add-artist-btn">
                <Plus className="w-4 h-4 mr-1" /> Add Your First Artist
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Artist</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Plan</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Streams</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Revenue</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Releases</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Added</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artists.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`roster-artist-${a.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {a.avatar_url ? (
                            <img src={`${BACKEND_URL}/api/files/${a.avatar_url}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#E040FB] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {a.artist_name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{a.artist_name || a.name}</p>
                            <p className="text-[10px] text-gray-500">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{
                          backgroundColor: a.plan === 'pro' ? '#E040FB20' : a.plan === 'rise' ? '#FFD70020' : '#66666620',
                          color: a.plan === 'pro' ? '#E040FB' : a.plan === 'rise' ? '#FFD700' : '#666'
                        }}>{a.plan}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-[#7C4DFF]">{fmt(a.streams)}</td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-[#1DB954]">${a.revenue.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-gray-300">{a.releases}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{a.added_at ? new Date(a.added_at).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleRemove(a.id, a.artist_name || a.name)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          data-testid={`remove-artist-${a.id}`}>
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Releases Across Roster */}
        {d.recent_releases?.length > 0 && (
          <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden" data-testid="label-recent-releases">
            <div className="p-5 border-b border-white/10">
              <h2 className="text-base font-bold text-white">Recent Releases</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Release</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Artist</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent_releases.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-sm font-medium text-white">{r.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{r.artist_name}</td>
                      <td className="py-3 px-4 text-xs text-gray-400 capitalize">{r.release_type}</td>
                      <td className="py-3 px-4"><span className={`text-xs capitalize ${statusColor(r.status)}`}>{r.status?.replace('_', ' ')}</span></td>
                      <td className="py-3 px-4 text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>}

        {/* ===== ROYALTY SPLITS TAB ===== */}
        {activeTab === 'royalties' && royalties && (
          <div className="space-y-6" data-testid="royalty-splits-section">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#141414] border border-white/10 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Total Gross Revenue</p>
                <p className="text-2xl font-bold font-mono text-white" data-testid="royalty-total-revenue">${royalties.summary.total_revenue.toFixed(2)}</p>
              </div>
              <div className="bg-[#141414] border border-[#1DB954]/20 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Artist Payouts</p>
                <p className="text-2xl font-bold font-mono text-[#1DB954]" data-testid="royalty-artist-payouts">${royalties.summary.total_artist_payouts.toFixed(2)}</p>
              </div>
              <div className="bg-[#141414] border border-[#FFD700]/20 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Label Earnings</p>
                <p className="text-2xl font-bold font-mono text-[#FFD700]" data-testid="royalty-label-earnings">${royalties.summary.total_label_earnings.toFixed(2)}</p>
              </div>
            </div>

            {/* Per-Artist Royalty Table */}
            <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden" data-testid="royalty-table">
              <div className="p-5 border-b border-white/10">
                <h2 className="text-base font-bold text-white">Royalty Splits by Artist</h2>
                <p className="text-xs text-gray-500 mt-1">Default split is 70% Artist / 30% Label. Click to customize.</p>
              </div>
              {royalties.artists.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">Add artists to your roster to manage royalty splits</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Artist</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Gross Revenue</th>
                        <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Artist %</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Artist Earnings</th>
                        <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Label %</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Label Earnings</th>
                        <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {royalties.artists.map((a) => (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`royalty-row-${a.id}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#E040FB] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {a.artist_name?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{a.artist_name || a.name}</p>
                                <p className="text-[10px] text-gray-500">{fmt(a.streams)} streams</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-mono text-white">${a.gross_revenue.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            {editingSplit === a.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <input type="number" value={splitValue} min={0} max={100} step={5}
                                  onChange={(e) => setSplitValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                                  className="w-14 bg-[#0A0A0A] border border-[#FFD700]/30 rounded px-2 py-1 text-xs text-white text-center focus:outline-none"
                                  data-testid={`split-input-${a.id}`} />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            ) : (
                              <span className="text-sm font-mono text-[#1DB954]" data-testid={`artist-split-${a.id}`}>{a.artist_split}%</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-mono text-[#1DB954]">${a.artist_earnings.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            {editingSplit === a.id ? (
                              <span className="text-sm font-mono text-[#FFD700]">{100 - splitValue}%</span>
                            ) : (
                              <span className="text-sm font-mono text-[#FFD700]" data-testid={`label-split-${a.id}`}>{a.label_split}%</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-mono text-[#FFD700]">${a.label_earnings.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            {editingSplit === a.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleSaveSplit(a.id)} disabled={savingSplit}
                                  className="p-1.5 text-[#1DB954] hover:bg-[#1DB954]/10 rounded-lg" data-testid={`save-split-${a.id}`}>
                                  <FloppyDisk className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingSplit(null)} className="p-1.5 text-gray-500 hover:bg-white/10 rounded-lg">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingSplit(a.id); setSplitValue(a.artist_split); }}
                                className="p-1.5 text-[#7C4DFF] hover:bg-[#7C4DFF]/10 rounded-lg" data-testid={`edit-split-${a.id}`}>
                                <Percent className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Visual Split Breakdown */}
            {royalties.artists.length > 0 && (
              <div className="bg-[#141414] border border-white/10 rounded-xl p-5" data-testid="split-visual">
                <h3 className="text-sm font-bold text-white mb-4">Revenue Split Visualization</h3>
                <div className="space-y-4">
                  {royalties.artists.map((a) => (
                    <div key={a.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{a.artist_name || a.name}</span>
                        <span className="text-[10px] text-gray-500">${a.gross_revenue.toFixed(2)} total</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                        <div className="bg-[#1DB954] transition-all" style={{ width: `${a.artist_split}%` }} title={`Artist: ${a.artist_split}%`} />
                        <div className="bg-[#FFD700] transition-all" style={{ width: `${a.label_split}%` }} title={`Label: ${a.label_split}%`} />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#1DB954]">Artist {a.artist_split}% (${a.artist_earnings.toFixed(2)})</span>
                        <span className="text-[#FFD700]">Label {a.label_split}% (${a.label_earnings.toFixed(2)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== PAYOUTS & IMPORT TAB ===== */}
        {activeTab === 'payouts' && (
          <div className="space-y-6" data-testid="payouts-import-section">
            {/* Export Section */}
            <div className="bg-[#141414] border border-white/10 rounded-xl p-6" data-testid="export-section">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <DownloadSimple className="w-5 h-5 text-[#7C4DFF]" /> Export Payout Reports
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Download detailed reports with split calculations for all roster artists.</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => handleExport('csv')} disabled={exporting === 'csv'}
                    className="bg-[#1DB954] hover:bg-[#1DB954]/80 text-white font-bold text-xs gap-2" data-testid="export-csv-btn">
                    <FileCsv className="w-4 h-4" />
                    {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                  </Button>
                  <Button onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}
                    className="bg-[#7C4DFF] hover:bg-[#7C4DFF]/80 text-white font-bold text-xs gap-2" data-testid="export-pdf-btn">
                    <FileText className="w-4 h-4" />
                    {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Import Section */}
            <div className="bg-[#141414] border border-white/10 rounded-xl p-6" data-testid="import-section">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <FileArrowUp className="w-5 h-5 text-[#E040FB]" /> Import External Royalties
              </h3>
              <p className="text-xs text-gray-500 mb-5">Upload CSV files from DistroKid, TuneCore, CD Baby, or any distributor. We'll auto-match artists to your roster.</p>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-[#E040FB] bg-[#E040FB]/5' : 'border-white/10 hover:border-[#7C4DFF]/40 hover:bg-white/[0.02]'
                } ${importing ? 'pointer-events-none opacity-50' : ''}`}
                data-testid="csv-dropzone"
              >
                <input type="file" ref={fileInputRef} accept=".csv" className="hidden"
                  onChange={(e) => { handleFileUpload(e.target.files[0]); e.target.value = ''; }}
                  data-testid="csv-file-input" />
                {importing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-[#E040FB] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Parsing and matching artists...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#E040FB]/10 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-[#E040FB]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Drop your CSV file here or <span className="text-[#E040FB]">browse</span></p>
                      <p className="text-xs text-gray-500 mt-1">Supports CSV files from any major distributor</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Expected Columns Info */}
              <div className="mt-4 flex flex-wrap gap-2">
                {['Artist', 'Track', 'Platform', 'Country', 'Streams', 'Revenue', 'Period'].map(col => (
                  <span key={col} className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5">{col}</span>
                ))}
                <span className="text-[10px] text-gray-500 self-center ml-1">auto-detected from headers</span>
              </div>
            </div>

            {/* Import Result (shows right after upload) */}
            {importResult && (
              <div className="bg-[#141414] border border-[#E040FB]/20 rounded-xl p-6 animate-in fade-in" data-testid="import-result">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#1DB954]" /> Latest Import Result
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold font-mono text-white">{importResult.total_rows}</p>
                    <p className="text-[10px] text-gray-500">Total Rows</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold font-mono text-[#1DB954]">{importResult.matched}</p>
                    <p className="text-[10px] text-gray-500">Matched</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold font-mono text-[#FF6B6B]">{importResult.unmatched}</p>
                    <p className="text-[10px] text-gray-500">Unmatched</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold font-mono text-[#FFD700]">${importResult.total_revenue?.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">Total Revenue</p>
                  </div>
                </div>
                {importResult.column_mapping && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-gray-500">Detected columns:</span>
                    {Object.entries(importResult.column_mapping).map(([field, col]) => (
                      <span key={field} className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C4DFF]/10 text-[#7C4DFF]">{field}: {col}</span>
                    ))}
                  </div>
                )}
                {importResult.unmatched > 0 && importResult.import_id && (
                  <Button onClick={() => handleViewImport(importResult.import_id)}
                    className="mt-4 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF6B6B] font-bold text-xs gap-2" data-testid="view-unmatched-btn">
                    <WarningCircle className="w-4 h-4" /> Review Unmatched Entries
                  </Button>
                )}
              </div>
            )}

            {/* Import History */}
            <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden" data-testid="import-history">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FFD700]" /> Import History
                </h3>
              </div>
              {imports.length === 0 ? (
                <div className="p-8 text-center">
                  <FileArrowUp className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No imports yet. Upload a CSV to get started.</p>
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
                        <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {imports.map((imp) => (
                        <tr key={imp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`import-row-${imp.id}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <FileCsv className="w-4 h-4 text-[#1DB954] flex-shrink-0" />
                              <span className="text-sm text-white truncate max-w-[180px]">{imp.filename}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-mono text-gray-300">{imp.total_rows}</td>
                          <td className="py-3 px-4 text-right text-sm font-mono text-[#1DB954]">{imp.matched}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-sm font-mono ${imp.unmatched > 0 ? 'text-[#FF6B6B]' : 'text-gray-500'}`}>
                              {imp.unmatched}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-mono text-[#FFD700]">${imp.total_revenue?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {imp.created_at ? new Date(imp.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => handleViewImport(imp.id)}
                              className="p-1.5 text-[#7C4DFF] hover:bg-[#7C4DFF]/10 rounded-lg transition-colors"
                              data-testid={`view-import-${imp.id}`}>
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
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedImport(null); setImportDetail(null); }}
                data-testid="import-detail-modal">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Import Details</h3>
                      {importDetail?.import && (
                        <p className="text-xs text-gray-500 mt-0.5">{importDetail.import.filename} — {importDetail.import.total_rows} rows</p>
                      )}
                    </div>
                    <button onClick={() => { setSelectedImport(null); setImportDetail(null); }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" data-testid="close-import-detail">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-8 h-8 border-2 border-[#E040FB] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : importDetail ? (
                    <div className="overflow-auto max-h-[calc(85vh-80px)]">
                      {/* Summary Stats */}
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

                      {/* Entries Table */}
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
                              <tr key={entry.id} className={`border-b border-white/5 transition-colors ${entry.status === 'unmatched' ? 'bg-[#FF6B6B]/[0.03]' : 'hover:bg-white/5'}`}
                                data-testid={`entry-row-${entry.id}`}>
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
                                <td className="py-3 px-4 text-xs text-gray-400 max-w-[120px] truncate">{entry.track || '—'}</td>
                                <td className="py-3 px-4 text-xs text-gray-400">{entry.platform || '—'}</td>
                                <td className="py-3 px-4 text-right text-sm font-mono text-gray-300">{entry.streams?.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-sm font-mono text-[#FFD700]">${entry.revenue?.toFixed(4)}</td>
                                <td className="py-3 px-4 text-center">
                                  {entry.status === 'unmatched' && (
                                    assigningEntry === entry.id ? (
                                      <div className="flex items-center gap-2 justify-center">
                                        <select value={assignArtistId} onChange={(e) => setAssignArtistId(e.target.value)}
                                          className="bg-[#141414] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C4DFF] max-w-[140px]"
                                          data-testid={`assign-select-${entry.id}`}>
                                          <option value="">Select artist</option>
                                          {artists.map(a => (
                                            <option key={a.id} value={a.id}>{a.artist_name || a.name}</option>
                                          ))}
                                        </select>
                                        <button onClick={() => handleAssign(entry.id)}
                                          className="p-1 text-[#1DB954] hover:bg-[#1DB954]/10 rounded" data-testid={`confirm-assign-${entry.id}`}>
                                          <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setAssigningEntry(null); setAssignArtistId(''); }}
                                          className="p-1 text-gray-500 hover:bg-white/10 rounded">
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setAssigningEntry(entry.id); setAssignArtistId(''); }}
                                        className="text-xs text-[#E040FB] hover:text-[#E040FB]/80 underline underline-offset-2"
                                        data-testid={`assign-btn-${entry.id}`}>
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default LabelDashboardPage;
