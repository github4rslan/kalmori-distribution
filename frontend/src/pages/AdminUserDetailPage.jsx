import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API, BACKEND_URL } from '../App';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { ArrowLeft, User, Disc, ChartLineUp, CurrencyDollar, Globe, Target, Users as UsersIcon, MusicNotes, PencilSimple, X, CheckCircle, SpotifyLogo, AppleLogo, InstagramLogo, TwitterLogo, ArrowSquareOut, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'sonner';

const StatCard = ({ label, value, icon, color, testId }) => (
  <div className="mobile-card rounded-2xl border border-white/10 bg-[#141414] p-4" data-testid={testId}>
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
    </div>
    <p className="text-xl font-bold font-mono text-white">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

const fmt = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [beats, setBeats] = useState([]);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => { fetchDetail(); }, [userId]);

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`${API}/admin/users/${userId}/detail`);
      setData(res.data);
      setEditForm({
        name: res.data.user.name || '',
        artist_name: res.data.user.artist_name || '',
        bio: res.data.user.bio || '',
        genre: res.data.user.genre || '',
        country: res.data.user.country || '',
        website: res.data.user.website || '',
        spotify_url: res.data.user.spotify_url || '',
        apple_music_url: res.data.user.apple_music_url || '',
        instagram: res.data.user.instagram || '',
        twitter: res.data.user.twitter || '',
        role: res.data.user.role || 'artist',
        plan: res.data.user.plan || 'free',
        status: res.data.user.status || 'active',
      });
    } catch { toast.error('Failed to load user'); navigate('/admin/users'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/users/${userId}/profile`, editForm);
      toast.success('Profile updated!');
      setEditing(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally { setSaving(false); }
  };

  useEffect(() => {
    if (data) {
      const user = data.user;
      axios.get(`${API}/admin/beats`, { withCredentials: true })
        .then(r => setBeats((r.data.beats || []).filter(b => b.created_by === user.id)))
        .catch(() => {});
      axios.get(`${API}/admin/promotion-orders`, { withCredentials: true })
        .then(r => setPromotions((r.data.orders || r.data || []).filter(o => o.user_id === user.id)))
        .catch(() => {});
    }
  }, [data]);

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  if (!data) return null;

  const { user, stats, releases, platform_breakdown, country_breakdown, weekly_trends, goals } = data;
  const STATUS_LABEL = { distributed: 'Live', pending_review: 'Under Review', processing: 'Processing', rejected: 'Rejected', draft: 'Draft' };
  const statusColor = (s) => s === 'distributed' ? 'text-[#22C55E]' : s === 'pending_review' ? 'text-[#FFD700]' : s === 'rejected' ? 'text-[#EF4444]' : s === 'processing' ? 'text-[#7C4DFF]' : 'text-gray-400';
  const planColors = { pro: '#E040FB', rise: '#FFD700', free: '#666', single: '#7C4DFF', album: '#FF6B6B' };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6" data-testid="admin-user-detail">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:p-5 lg:flex-row lg:items-center">
          <button onClick={() => navigate('/admin/users')} className="touch-target inline-flex items-center justify-center self-start rounded-xl hover:bg-white/5" data-testid="back-to-users-btn">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {user.avatar_url ? (
              <img src={`${BACKEND_URL}/api/files/${user.avatar_url}`} alt="" className="w-14 h-14 rounded-full border-2 border-white/10 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#E040FB] flex items-center justify-center text-xl font-bold text-white">
                {user.artist_name?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-white" data-testid="user-detail-name">
                {user.artist_name || user.name}
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${planColors[user.plan] || '#666'}20`, color: planColors[user.plan] || '#666' }}>{user.plan}</span>
                <span className={`text-xs capitalize ${user.role === 'admin' ? 'text-[#E53935]' : 'text-gray-500'}`}>{user.role}</span>
              </h1>
              <p className="mt-1 break-words text-sm text-gray-500">{user.email} &middot; Joined {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            {user.slug && (
              <a href={`/artist/${user.slug}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400 transition-all hover:bg-white/10"
                data-testid="view-public-profile-link">
                <ArrowSquareOut className="w-3.5 h-3.5" /> Public Profile
              </a>
            )}
            <Button onClick={() => setEditing(!editing)} className="min-h-11 bg-[#7C4DFF] text-xs text-white hover:bg-[#7C4DFF]/80" data-testid="edit-profile-btn">
              <PencilSimple className="w-4 h-4 mr-1.5" /> {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="mobile-card rounded-2xl border border-[#7C4DFF]/30 bg-[#141414] p-5 sm:p-6 space-y-5" data-testid="admin-edit-profile-form">
            <h2 className="text-sm font-bold text-[#7C4DFF] uppercase tracking-wider">Edit Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'name', label: 'Legal Name' },
                { key: 'artist_name', label: 'Artist / Stage Name' },
                { key: 'genre', label: 'Genre' },
                { key: 'country', label: 'Country' },
                { key: 'website', label: 'Website' },
                { key: 'spotify_url', label: 'Spotify URL' },
                { key: 'apple_music_url', label: 'Apple Music URL' },
                { key: 'instagram', label: 'Instagram' },
                { key: 'twitter', label: 'Twitter / X' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input value={editForm[f.key] || ''} onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C4DFF]"
                    data-testid={`edit-field-${f.key}`} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bio</label>
              <textarea value={editForm.bio || ''} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3} className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C4DFF] resize-none"
                data-testid="edit-field-bio" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" data-testid="edit-field-role">
                  <option value="artist">Artist</option>
                  <option value="producer">Producer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Plan</label>
                <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" data-testid="edit-field-plan">
                  <option value="free">Free</option>
                  <option value="single">Single</option>
                  <option value="album">Album</option>
                  <option value="rise">Rise</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" data-testid="edit-field-status">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setEditing(false)} variant="outline" className="border-white/10 text-gray-400">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#E53935] hover:bg-[#d32f2f] text-white" data-testid="save-profile-btn">
                <FloppyDisk className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total Streams" value={fmt(stats.total_streams)} icon={<ChartLineUp className="w-4 h-4" />} color="#7C4DFF" testId="stat-streams" />
          <StatCard label="Revenue" value={`$${stats.total_revenue.toFixed(2)}`} icon={<CurrencyDollar className="w-4 h-4" />} color="#1DB954" testId="stat-revenue" />
          <StatCard label="Releases" value={stats.total_releases} icon={<Disc className="w-4 h-4" />} color="#E040FB" testId="stat-releases" />
          <StatCard label="Pre-Saves" value={fmt(stats.presave_subscribers)} icon={<UsersIcon className="w-4 h-4" />} color="#FFD700" testId="stat-presaves" />
          <StatCard label="Goals" value={`${stats.goals_completed}/${stats.goals_active + stats.goals_completed}`} icon={<Target className="w-4 h-4" />} color="#FF6B6B" testId="stat-goals" />
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Platform Breakdown */}
          <div className="mobile-card rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5" data-testid="platform-breakdown">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <MusicNotes className="w-4 h-4 text-[#7C4DFF]" /> Platform Breakdown
            </h3>
            {platform_breakdown.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No streaming data yet</p>
            ) : (
              <div className="space-y-3">
                {platform_breakdown.map((p, i) => {
                  const maxStreams = platform_breakdown[0]?.streams || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 truncate text-xs text-gray-400 sm:w-24">{p.platform}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7C4DFF] rounded-full" style={{ width: `${(p.streams / maxStreams) * 100}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs font-mono text-white sm:w-16">{fmt(p.streams)}</span>
                      <span className="hidden w-16 shrink-0 text-right text-xs text-gray-500 sm:block">${p.revenue.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Country Breakdown */}
          <div className="mobile-card rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5" data-testid="country-breakdown">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#E040FB]" /> Top Markets
            </h3>
            {country_breakdown.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No geographic data yet</p>
            ) : (
              <div className="space-y-3">
                {country_breakdown.map((c, i) => {
                  const maxStreams = country_breakdown[0]?.streams || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 truncate text-xs text-gray-400 sm:w-24">{c.country}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E040FB] rounded-full" style={{ width: `${(c.streams / maxStreams) * 100}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs font-mono text-white sm:w-16">{fmt(c.streams)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Trend (mini sparkline bars) */}
        {weekly_trends.some(w => w.streams > 0) && (
          <div className="mobile-card rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5" data-testid="weekly-trends">
            <h3 className="text-sm font-bold text-white mb-4">Weekly Stream Trend</h3>
            <div className="overflow-x-auto pb-1">
              <div className="flex h-24 min-w-[24rem] items-end gap-2">
                {weekly_trends.map((w, i) => {
                  const maxW = Math.max(...weekly_trends.map(t => t.streams), 1);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="relative w-full rounded-t bg-[#7C4DFF]/20" style={{ height: `${Math.max((w.streams / maxW) * 80, 4)}px` }}>
                        <div className="absolute inset-0 rounded-t bg-[#7C4DFF]" style={{ height: '100%' }} />
                      </div>
                      <span className="text-[9px] text-gray-500">{w.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Releases Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]" data-testid="releases-table">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">Releases ({releases.length})</h3>
          </div>
          {releases.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No releases yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">Title</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">Type</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">Genre</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">Tracks</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/admin/submissions?release=${r.id}`)}>
                      <td className="py-2.5 px-4 text-sm font-medium text-white flex items-center gap-2">
                        {r.cover_art_url && <img src={r.cover_art_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />}
                        <span className="truncate max-w-[120px]">{r.title}</span>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-400 capitalize">{r.release_type}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-400">{r.genre || '-'}</td>
                      <td className="py-2.5 px-4"><span className={`text-xs font-semibold ${statusColor(r.status)}`}>{STATUS_LABEL[r.status] || r.status?.replace('_', ' ') || '—'}</span></td>
                      <td className="py-2.5 px-4 text-xs text-gray-400 font-mono">{r.track_count || 0}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Goals */}
        {goals.length > 0 && (
          <div className="mobile-card rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5" data-testid="user-goals">
            <h3 className="text-sm font-bold text-white mb-4">Goals & Milestones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map(g => {
                const pct = Math.min(((g.current_value || 0) / (g.target_value || 1)) * 100, 100);
                const isComplete = g.status === 'completed';
                return (
                  <div key={g.id} className={`p-4 rounded-lg border ${isComplete ? 'border-[#FFD700]/30 bg-[#FFD700]/5' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white truncate">{g.title || g.type}</p>
                      {isComplete && <CheckCircle className="w-4 h-4 text-[#FFD700]" weight="fill" />}
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isComplete ? '#FFD700' : '#7C4DFF' }} />
                    </div>
                    <p className="text-[10px] text-gray-500">{fmt(g.current_value || 0)} / {fmt(g.target_value)} &middot; {pct.toFixed(0)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Beats Section */}
        {beats.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
              <h3 className="text-sm font-bold text-white">Beats ({beats.length})</h3>
              <Link to="/admin/beats" className="text-xs text-[#7C4DFF] hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {beats.map(b => (
                <div key={b.id} className="flex flex-col gap-3 p-4 hover:bg-white/5 cursor-pointer sm:flex-row sm:items-center" onClick={() => navigate('/admin/beats')}>
                  {b.cover_url
                    ? <img src={b.cover_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded bg-[#1a1a1a] flex items-center justify-center flex-shrink-0"><MusicNotes className="w-5 h-5 text-gray-600" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{b.title}</p>
                    <p className="text-xs text-gray-500">{b.genre} · {b.bpm} BPM · {b.key}</p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-xs text-[#FFD700] font-mono">${b.prices?.basic_lease || 0}</p>
                    <p className="text-xs text-gray-500">{b.sales_count || 0} sales</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promotion Orders */}
        {promotions.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Promotion Orders ({promotions.length})</h3>
            </div>
            <div className="divide-y divide-white/5">
              {promotions.map(o => (
                <div key={o.id} className="flex flex-col gap-3 p-4 hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{o.package_name || o.package_id}</p>
                    <p className="text-xs text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="ml-0 flex-shrink-0 text-left sm:ml-3 sm:text-right">
                    <p className="text-xs text-[#FFD700] font-mono">${o.amount}</p>
                    <span className={`text-xs capitalize ${o.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{o.payment_status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminUserDetailPage;
