import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import AdminLayout from '../components/AdminLayout';
import {
  CheckCircle, XCircle, Clock, Eye, CaretLeft, CaretRight,
  FunnelSimple, ClipboardText, MusicNotes, Waveform, Play, Pause,
  SpeakerHigh, SpeakerX, DownloadSimple, X, User, Globe,
  Storefront, MusicNote, ArrowSquareOut,
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';

/* ── helpers ─────────────────────────────────────────── */
const fmtList = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return '—';
  return items.map(i => (typeof i === 'string' ? i : [i.role, i.name].filter(Boolean).join(': '))).filter(Boolean).join(', ') || '—';
};
const val = (v) => (v !== undefined && v !== null && v !== '') ? v : null;

const statusCfg = {
  pending_review: { cls: 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20', dot: 'bg-[#FFD700]', label: 'Pending Review' },
  approved:       { cls: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20', dot: 'bg-[#22C55E]', label: 'Approved' },
  rejected:       { cls: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20', dot: 'bg-[#EF4444]', label: 'Rejected' },
};
const scfg = (s) => statusCfg[s] || { cls: 'bg-white/10 text-gray-400 border border-white/10', dot: 'bg-gray-400', label: s };

/* ── custom audio player ─────────────────────────────── */
function AudioPlayer({ src, title }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      setLoading(true);
      try { await a.play(); setPlaying(true); } catch {}
      setLoading(false);
    }
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * duration;
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-r from-[#0d0d0d] to-[#111]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
        muted={muted}
        preload="metadata"
      />
      <div className="px-4 py-3 flex items-center gap-3">
        {/* play button */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}
        >
          {loading
            ? <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            : playing
              ? <Pause className="w-4 h-4 text-white" weight="fill" />
              : <Play className="w-4 h-4 text-white" weight="fill" />
          }
        </button>

        {/* waveform / scrub */}
        <div className="flex-1 space-y-1">
          {title && <p className="text-[11px] text-[#A1A1AA] truncate">{title}</p>}
          <div
            className="h-1.5 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
            onClick={seek}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: duration ? `${(progress / duration) * 100}%` : '0%',
                background: 'linear-gradient(90deg,#7C4DFF,#E040FB)',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#555]">
            <span>{fmtTime(progress)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        {/* mute + download */}
        <button onClick={() => setMuted(m => !m)} className="text-[#A1A1AA] hover:text-white transition-colors">
          {muted ? <SpeakerX className="w-4 h-4" /> : <SpeakerHigh className="w-4 h-4" />}
        </button>
        <a href={src} target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-[#7C4DFF] transition-colors">
          <DownloadSimple className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

/* ── field row ───────────────────────────────────────── */
const Field = ({ label, value, mono, full }) => {
  if (!val(value)) return null;
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[11px] text-[#555] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-white break-words leading-snug ${mono ? 'font-mono text-[#E040FB]' : ''}`}>{value}</p>
    </div>
  );
};

/* ── section card ────────────────────────────────────── */
const Section = ({ icon: Icon, title, color = '#7C4DFF', children }) => (
  <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/8" style={{ background: `${color}08` }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ── main component ──────────────────────────────────── */
const AdminSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState('release');

  // handle ?release= query param from notification deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const releaseId = params.get('release');
    if (releaseId) openDetail(releaseId);
  }, []);

  const fetchSubmissions = async (p = 1, status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (status) params.append('status', status);
      const res = await axios.get(`${API}/admin/submissions?${params}`);
      setSubmissions(res.data.submissions);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(p);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubmissions(1, filter); }, [filter]);

  const openDetail = async (releaseId) => {
    setSelectedSub(releaseId);
    setDetailLoading(true);
    setActiveTab('release');
    try {
      const res = await axios.get(`${API}/admin/submissions/${releaseId}`);
      setDetail(res.data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const closeModal = () => { setSelectedSub(null); setDetail(null); setReviewNotes(''); };

  const handleReview = async (action) => {
    if (!selectedSub) return;
    setReviewing(true);
    try {
      await axios.put(`${API}/admin/submissions/${selectedSub}/review`, { action, notes: reviewNotes || null });
      closeModal();
      fetchSubmissions(page, filter);
    } catch (err) { alert(err.response?.data?.detail || 'Review failed'); }
    finally { setReviewing(false); }
  };

  const FILTERS = [
    { v: '', label: 'All' },
    { v: 'pending_review', label: 'Pending' },
    { v: 'approved', label: 'Approved' },
    { v: 'rejected', label: 'Rejected' },
  ];

  const TABS = [
    { id: 'release', label: 'Release', icon: MusicNote },
    { id: 'artist', label: 'Artist', icon: User },
    { id: 'stores', label: 'Stores', icon: Storefront },
    { id: 'audio', label: 'Audio', icon: Waveform },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5" data-testid="admin-submissions">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Ingestion <span className="text-[#E53935]">Queue</span>
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-0.5">Review and approve artist submissions</p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-[#111] border border-white/10 rounded-xl" data-testid="submission-filters">
            {FILTERS.map(f => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                  filter === f.v
                    ? 'bg-[#E53935] text-white shadow-sm'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                }`}
                data-testid={`filter-${f.v || 'all'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-[#A1A1AA]">
              <ClipboardText className="w-12 h-12 mx-auto mb-3 text-[#333]" />
              <p className="text-sm">No submissions {filter ? `with status "${filter.replace('_', ' ')}"` : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="submissions-table">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3">
                    <th className="text-left py-3 px-4 text-[11px] text-[#555] font-semibold uppercase tracking-wider">Release</th>
                    <th className="text-left py-3 px-4 text-[11px] text-[#555] font-semibold uppercase tracking-wider">Artist</th>
                    <th className="text-left py-3 px-4 text-[11px] text-[#555] font-semibold uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="text-left py-3 px-4 text-[11px] text-[#555] font-semibold uppercase tracking-wider hidden md:table-cell">Tracks</th>
                    <th className="text-left py-3 px-4 text-[11px] text-[#555] font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-[11px] text-[#555] font-semibold uppercase tracking-wider hidden lg:table-cell">Submitted</th>
                    <th className="text-left py-3 px-4 text-[11px] text-[#555] font-semibold uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const cfg = scfg(sub.status);
                    return (
                      <tr
                        key={sub.release_id}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                        onClick={() => openDetail(sub.release_id)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {sub.cover_art_url
                              ? <img src={sub.cover_art_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                              : <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0"><MusicNotes className="w-4 h-4 text-[#333]" /></div>
                            }
                            <span className="text-sm font-medium text-white truncate max-w-[120px]">{sub.release_title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-[#A1A1AA]">{sub.artist_name}</td>
                        <td className="py-3.5 px-4 text-sm text-[#A1A1AA] capitalize hidden sm:table-cell">{sub.release_type}</td>
                        <td className="py-3.5 px-4 text-sm text-[#A1A1AA] font-mono hidden md:table-cell">{sub.track_count}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#555] hidden lg:table-cell">
                          {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(sub.release_id); }}
                            className="flex items-center gap-1 text-xs text-[#7C4DFF] hover:text-[#E040FB] font-medium transition-colors"
                            data-testid={`review-btn-${sub.release_id}`}
                          >
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <p className="text-xs text-[#555]">{total} submissions</p>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchSubmissions(page - 1, filter)} disabled={page <= 1}
                  className="p-1.5 text-[#A1A1AA] hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-all">
                  <CaretLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#A1A1AA] px-1">{page} / {pages}</span>
                <button onClick={() => fetchSubmissions(page + 1, filter)} disabled={page >= pages}
                  className="p-1.5 text-[#A1A1AA] hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-all">
                  <CaretRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────── */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-testid="review-modal">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-5xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">

            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detail ? (
              <>
                {/* Modal header */}
                <div className="flex items-center gap-4 px-5 sm:px-6 py-4 border-b border-white/8 flex-shrink-0">
                  {detail.release?.cover_art_url ? (
                    <img src={detail.release.cover_art_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C4DFF]/30 to-[#E040FB]/30 flex items-center justify-center flex-shrink-0">
                      <MusicNotes className="w-5 h-5 text-[#7C4DFF]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-white truncate">{detail.release?.title || 'Review Submission'}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scfg(detail.submission.status).cls}`}>
                        {scfg(detail.submission.status).label}
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      by {detail.artist?.artist_name || detail.artist?.name || '—'} &middot; {detail.release?.release_type} &middot; {detail.release?.genre}
                    </p>
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-white/8 rounded-xl text-[#A1A1AA] hover:text-white transition-all flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-5 sm:px-6 py-3 border-b border-white/8 overflow-x-auto flex-shrink-0 scrollbar-hide">
                  {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-[#7C4DFF] text-white'
                            : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">

                  {/* ─ Release tab ─ */}
                  {activeTab === 'release' && (
                    <div className="space-y-4">
                      <Section icon={MusicNotes} title="Release Details" color="#7C4DFF">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                          <Field label="Title" value={detail.release?.title} />
                          <Field label="Title Version" value={detail.release?.title_version} />
                          <Field label="Type" value={detail.release?.release_type} />
                          <Field label="Main Artist" value={detail.release?.main_artist || detail.artist?.artist_name} />
                          <Field label="Label" value={detail.release?.label} />
                          <Field label="Genre" value={detail.release?.genre} />
                          <Field label="Subgenre" value={detail.release?.subgenre} />
                          <Field label="Language" value={detail.release?.language} />
                          <Field label="Release Date" value={detail.release?.release_date} />
                          <Field label="Production Year" value={detail.release?.production_year} />
                          <Field label="UPC" value={detail.release?.upc} mono />
                          <Field label="Catalog #" value={detail.release?.catalog_number} mono />
                          <Field label="Explicit" value={detail.release?.explicit ? 'Yes' : 'No'} />
                          <Field label="Compilation" value={detail.release?.is_compilation ? 'Yes' : 'No'} />
                          <Field label="Territory" value={detail.release?.territory} />
                          <Field label="Rights Confirmed" value={detail.release?.rights_confirmed ? 'Yes' : 'No'} />
                          <Field label="Payment Status" value={detail.submission?.payment_status || detail.release?.payment_status || 'pending'} />
                          <Field label="Submitted" value={detail.submission?.submitted_at ? new Date(detail.submission.submitted_at).toLocaleString() : null} />
                          <Field label="Copyright Line" value={detail.release?.copyright_line} full />
                          <Field label="Production Line" value={detail.release?.production_line} full />
                          <Field label="Description" value={detail.release?.description} full />
                        </div>
                        {detail.release?.cover_art_url && (
                          <div className="mt-5 pt-4 border-t border-white/8">
                            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-3">Cover Art</p>
                            <div className="flex items-start gap-4">
                              <div className="relative group">
                                <img
                                  src={detail.release.cover_art_url}
                                  alt="Cover Art"
                                  className="w-36 h-36 rounded-xl object-cover border border-white/10"
                                />
                                <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <a
                                    href={detail.release.cover_art_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                    title="Download cover art"
                                  >
                                    <DownloadSimple className="w-5 h-5 text-white" weight="bold" />
                                  </a>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 pt-1">
                                <p className="text-xs text-white font-medium">{detail.release?.title}</p>
                                <p className="text-[11px] text-[#A1A1AA]">3000 × 3000 px recommended</p>
                                <a
                                  href={detail.release.cover_art_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white mt-1"
                                  style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}
                                >
                                  <DownloadSimple className="w-3.5 h-3.5" weight="bold" />
                                  Download Cover Art
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </Section>
                    </div>
                  )}

                  {/* ─ Artist tab ─ */}
                  {activeTab === 'artist' && (
                    <Section icon={User} title="Artist Profile" color="#E040FB">
                      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-white/8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C4DFF]/40 to-[#E040FB]/40 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                          {(detail.artist?.artist_name || detail.artist?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base">{detail.artist?.artist_name || detail.artist?.name || '—'}</p>
                          <p className="text-xs text-[#A1A1AA]">{detail.artist?.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#7C4DFF]/20 text-[#7C4DFF] capitalize">{detail.artist?.plan || 'free'}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/8 text-[#A1A1AA] capitalize">{detail.artist?.user_role || detail.artist?.role || 'artist'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                        <Field label="Artist Name" value={detail.artist?.artist_name || detail.artist?.name} />
                        <Field label="Legal Name" value={detail.artist?.legal_name || detail.artist?.name} />
                        <Field label="Phone" value={detail.artist?.phone_number} />
                        <Field label="Country" value={detail.artist?.country || detail.artist_profile?.country} />
                        <Field label="State" value={detail.artist?.state} />
                        <Field label="City" value={detail.artist?.town} />
                        <Field label="Post Code" value={detail.artist?.post_code} />
                        <Field label="Website" value={detail.artist_profile?.website} />
                        <Field label="Spotify" value={detail.artist_profile?.spotify_url} />
                        <Field label="Apple Music" value={detail.artist_profile?.apple_music_url} />
                        <Field label="Instagram" value={detail.artist_profile?.instagram} />
                        <Field label="Twitter" value={detail.artist_profile?.twitter} />
                        <Field label="Bio" value={detail.artist_profile?.bio} full />
                      </div>
                    </Section>
                  )}

                  {/* ─ Stores tab ─ */}
                  {activeTab === 'stores' && (
                    <Section icon={Storefront} title="Distribution Stores" color="#FFD700">
                      {(() => {
                        const stores = detail.submission?.stores || detail.release?.distributed_platforms || [];
                        if (stores.length === 0) return <p className="text-sm text-[#555]">No stores selected.</p>;
                        return (
                          <div className="flex flex-wrap gap-2">
                            {stores.map((s, i) => (
                              <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/15 capitalize">
                                {s.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                      <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-3 gap-4">
                        <Field label="Tracks" value={String(detail.audio_bank?.length || detail.tracks?.length || 0)} />
                        <Field label="Artist Selected" value={String((detail.submission?.stores || detail.release?.distributed_platforms || []).length)} />
                        <Field label="Platform Coverage" value="150+ Stores" />
                      </div>
                    </Section>
                  )}

                  {/* ─ Audio tab ─ */}
                  {activeTab === 'audio' && (
                    <div className="space-y-4">
                      {detail.tracks?.length > 0 ? (
                        detail.tracks.map((track, index) => {
                          const audioItem = detail.audio_bank?.find(a => a.track_id === track.id) || {};
                          const streamUrl = audioItem.audio_url ? `${API}/tracks/${audioItem.track_id}/stream` : null;
                          return (
                            <Section key={track.id || index} icon={Waveform} title={`${track.track_number || index + 1}. ${track.title}`} color="#7C4DFF">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 mb-4">
                                <Field label="Format" value={audioItem.audio_format ? audioItem.audio_format.toUpperCase() : null} />
                                <Field label="Language" value={track.audio_language} />
                                <Field label="Explicit" value={track.explicit ? 'Yes' : 'No'} />
                                <Field label="ISRC" value={track.isrc} mono />
                                <Field label="Dolby Atmos ISRC" value={track.dolby_atmos_isrc} mono />
                                <Field label="ISWC" value={track.iswc} mono />
                                <Field label="Main Artist" value={track.main_artist || detail.release?.main_artist} />
                                <Field label="Artists" value={fmtList(track.artists)} />
                                <Field label="Contributors" value={fmtList(track.main_contributors)} />
                                <Field label="Publisher" value={track.publisher} />
                                <Field label="Preview Start" value={track.preview_start} />
                                <Field label="Preview End" value={track.preview_end} />
                                <Field label="Duration" value={track.duration ? `${track.duration}s` : null} />
                                <Field label="Version" value={track.title_version || 'Original'} />
                                <Field label="Audio File" value={track.audio_file_name || audioItem.audio_file_name} full />
                              </div>

                              {/* Status badge */}
                              <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3 ${track.audio_url || audioItem.audio_url ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${track.audio_url || audioItem.audio_url ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                                {track.audio_url || audioItem.audio_url ? 'Audio uploaded' : 'No audio'}
                              </div>

                              {/* Custom audio player */}
                              {streamUrl && (
                                <AudioPlayer src={streamUrl} title={track.audio_file_name || audioItem.audio_file_name} />
                              )}
                            </Section>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-[#555]">
                          <Waveform className="w-10 h-10 mx-auto mb-3" />
                          <p className="text-sm">No audio information stored for this submission.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Review actions — always visible at bottom */}
                <div className="flex-shrink-0 border-t border-white/8 px-5 sm:px-6 py-4 bg-[#0a0a0a]">
                  {detail.submission.status === 'pending_review' ? (
                    <div className="space-y-3">
                      <textarea
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] resize-none h-16 focus:outline-none focus:border-[#7C4DFF] transition-colors"
                        placeholder="Review notes (optional)..."
                        data-testid="review-notes-input"
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleReview('approve')}
                          disabled={reviewing}
                          className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] text-white font-semibold h-10"
                          data-testid="approve-btn"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" weight="fill" />
                          {reviewing ? 'Processing…' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleReview('reject')}
                          disabled={reviewing}
                          className="flex-1 bg-[#EF4444] hover:bg-[#dc2626] text-white font-semibold h-10"
                          data-testid="reject-btn"
                        >
                          <XCircle className="w-4 h-4 mr-2" weight="fill" />
                          {reviewing ? 'Processing…' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${scfg(detail.submission.status).dot}`} />
                      <div className="text-sm text-[#A1A1AA]">
                        <span className="capitalize font-medium text-white">{scfg(detail.submission.status).label}</span>
                        {detail.submission.reviewed_at && <span> · {new Date(detail.submission.reviewed_at).toLocaleString()}</span>}
                        {detail.submission.review_notes && <span> · {detail.submission.review_notes}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSubmissionsPage;
