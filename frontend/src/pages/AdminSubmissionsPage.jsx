import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import AdminLayout from '../components/AdminLayout';
import { CheckCircle, XCircle, Clock, Eye, CaretLeft, CaretRight, FunnelSimple, ClipboardText, MusicNotes, Waveform, DownloadSimple } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';

const formatList = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return '—';
  const values = items
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item) return '';
      return [item.role, item.name].filter(Boolean).join(': ');
    })
    .filter(Boolean);
  return values.length > 0 ? values.join(', ') : '—';
};

const detailFields = (fields) =>
  fields.filter((field) => field.value !== undefined && field.value !== null && field.value !== '');

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
    try {
      const res = await axios.get(`${API}/admin/submissions/${releaseId}`);
      setDetail(res.data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleReview = async (action) => {
    if (!selectedSub) return;
    setReviewing(true);
    try {
      await axios.put(`${API}/admin/submissions/${selectedSub}/review`, {
        action,
        notes: reviewNotes || null
      });
      setSelectedSub(null);
      setDetail(null);
      setReviewNotes('');
      fetchSubmissions(page, filter);
    } catch (err) { console.error(err); alert(err.response?.data?.detail || 'Review failed'); }
    finally { setReviewing(false); }
  };

  const statusColor = (s) => {
    if (s === 'pending_review') return 'bg-[#FFD700]/10 text-[#FFD700]';
    if (s === 'approved') return 'bg-[#4CAF50]/10 text-[#4CAF50]';
    if (s === 'rejected') return 'bg-[#E53935]/10 text-[#E53935]';
    return 'bg-gray-600/20 text-gray-400';
  };

  const statusIcon = (s) => {
    if (s === 'pending_review') return <Clock className="w-4 h-4 text-[#FFD700]" />;
    if (s === 'approved') return <CheckCircle className="w-4 h-4 text-[#4CAF50]" />;
    if (s === 'rejected') return <XCircle className="w-4 h-4 text-[#E53935]" />;
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-submissions">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ingestion <span className="text-[#E53935]">Queue</span></h1>
            <p className="text-gray-400 mt-1">Review and approve artist submissions</p>
          </div>
          <div className="flex items-center gap-2" data-testid="submission-filters">
            <FunnelSimple className="w-4 h-4 text-gray-400" />
            {['', 'pending_review', 'approved', 'rejected'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${filter === f ? 'bg-[#E53935] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                data-testid={`filter-${f || 'all'}`}>
                {f ? f.replace('_', ' ') : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="card-kalmori overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No submissions {filter ? `with status "${filter.replace('_', ' ')}"` : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="submissions-table">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Release</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Artist</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Tracks</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Submitted</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.release_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{sub.release_title}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{sub.artist_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-400 capitalize">{sub.release_type}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{sub.track_count}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusColor(sub.status)}`}>
                          {statusIcon(sub.status)} {sub.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => openDetail(sub.release_id)}
                          className="text-xs text-[#7C4DFF] hover:underline flex items-center gap-1"
                          data-testid={`review-btn-${sub.release_id}`}>
                          <Eye className="w-4 h-4" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/10">
              <p className="text-xs text-gray-500">{total} total submissions</p>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchSubmissions(page - 1, filter)} disabled={page <= 1} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><CaretLeft className="w-5 h-5" /></button>
                <span className="text-sm text-gray-400">Page {page} of {pages}</span>
                <button onClick={() => fetchSubmissions(page + 1, filter)} disabled={page >= pages} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><CaretRight className="w-5 h-5" /></button>
              </div>
            </div>
          )}
        </div>

        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="review-modal">
            <div className="absolute inset-0 bg-black/70" onClick={() => { setSelectedSub(null); setDetail(null); setReviewNotes(''); }} />
            <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" /></div>
              ) : detail ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">Review Submission</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(detail.submission.status)}`}>{detail.submission.status.replace('_', ' ')}</span>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
                    <div className="bg-white/5 p-4 rounded-lg space-y-4">
                      <div className="flex items-center gap-2">
                        <MusicNotes className="w-4 h-4 text-[#E040FB]" />
                        <h3 className="font-medium text-sm text-gray-300">General Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {detailFields([
                          { label: 'Submitted', value: detail.submission?.submitted_at ? new Date(detail.submission.submitted_at).toLocaleString() : '—' },
                          { label: 'Payment Status', value: detail.submission?.payment_status || detail.release?.payment_status || 'pending' },
                          { label: 'Release Title', value: detail.release?.title || '—' },
                          { label: 'Title Version', value: detail.release?.title_version || '—' },
                          { label: 'Release Type', value: detail.release?.release_type ? detail.release.release_type.charAt(0).toUpperCase() + detail.release.release_type.slice(1) : '—' },
                          { label: 'Main Artist', value: detail.release?.main_artist || detail.artist?.artist_name || detail.artist?.name || '—' },
                          { label: 'Label', value: detail.release?.label || '—' },
                          { label: 'Genre', value: detail.release?.genre || '—' },
                          { label: 'Subgenre', value: detail.release?.subgenre || '—' },
                          { label: 'Metadata Language', value: detail.release?.language || '—' },
                          { label: 'Release Date', value: detail.release?.release_date || '—' },
                          { label: 'UPC', value: detail.release?.upc || '—', mono: true },
                          { label: 'Catalog Number', value: detail.release?.catalog_number || '—' },
                          { label: 'Production Year', value: detail.release?.production_year || '—' },
                          { label: 'Compilation', value: detail.release?.is_compilation ? 'Yes' : 'No' },
                          { label: 'Explicit Release', value: detail.release?.explicit ? 'Yes' : 'No' },
                          { label: 'Territory', value: detail.release?.territory || '—' },
                          { label: 'Stores', value: detail.submission?.stores?.join(', ') || detail.release?.distributed_platforms?.join(', ') || '—' },
                          { label: 'Rights Confirmed', value: detail.release?.rights_confirmed ? 'Yes' : 'No' },
                          { label: 'Tracks Stored', value: detail.audio_bank?.length || detail.tracks?.length || 0 },
                          { label: 'Artist Email', value: detail.artist?.email || '—' },
                          { label: 'Artist Name', value: detail.artist?.artist_name || detail.artist?.name || '—' },
                          { label: 'Full Name', value: detail.artist?.name || '—' },
                          { label: 'Plan', value: detail.artist?.plan ? detail.artist.plan.charAt(0).toUpperCase() + detail.artist.plan.slice(1) : '—' },
                          { label: 'Role', value: detail.artist?.user_role || detail.artist?.role || 'artist' },
                          { label: 'Legal Name', value: detail.artist?.legal_name || '—' },
                          { label: 'Phone Number', value: detail.artist?.phone_number || '—' },
                          { label: 'Country', value: detail.artist?.country || detail.artist_profile?.country || '—' },
                          { label: 'State', value: detail.artist?.state || '—' },
                          { label: 'Town / City', value: detail.artist?.town || '—' },
                          { label: 'Post Code', value: detail.artist?.post_code || '—' },
                          { label: 'Website', value: detail.artist_profile?.website || '—' },
                          { label: 'Spotify URL', value: detail.artist_profile?.spotify_url || '—' },
                          { label: 'Apple Music URL', value: detail.artist_profile?.apple_music_url || '—' },
                          { label: 'Instagram', value: detail.artist_profile?.instagram || '—' },
                          { label: 'Twitter', value: detail.artist_profile?.twitter || '—' },
                        ]).map((field) => (
                          <div key={field.label}>
                            <span className="text-gray-500">{field.label}:</span>
                            <span className={`ml-2 break-words ${field.mono ? 'font-mono' : ''}`}>{field.value}</span>
                          </div>
                        ))}
                      </div>

                      {detail.release?.copyright_line && (
                        <div className="text-sm">
                          <span className="text-gray-500">Copyright Line:</span>
                          <p className="mt-1 text-gray-300">{detail.release.copyright_line}</p>
                        </div>
                      )}

                      {detail.release?.production_line && (
                        <div className="text-sm">
                          <span className="text-gray-500">Production Line:</span>
                          <p className="mt-1 text-gray-300">{detail.release.production_line}</p>
                        </div>
                      )}

                      {detail.artist_profile?.bio && (
                        <div className="text-sm">
                          <span className="text-gray-500">Bio:</span>
                          <p className="mt-1 text-gray-300 leading-relaxed">{detail.artist_profile.bio}</p>
                        </div>
                      )}

                      {detail.release?.description && (
                        <div className="text-sm">
                          <span className="text-gray-500">Description:</span>
                          <p className="mt-1 text-gray-300 leading-relaxed">{detail.release.description}</p>
                        </div>
                      )}

                      {detail.release?.cover_art_url && (
                        <div className="pt-1">
                          <p className="text-sm text-gray-500 mb-2">Cover Art</p>
                          <img
                            src={detail.release.cover_art_url}
                            alt={detail.release?.title || 'Cover art'}
                            className="w-28 h-28 rounded-xl object-cover border border-white/10"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg space-y-4">
                      <div className="flex items-center gap-2">
                        <Waveform className="w-4 h-4 text-[#7C4DFF]" />
                        <h3 className="font-medium text-sm text-gray-300">Audio Information</h3>
                      </div>

                      {detail.tracks?.length > 0 ? (
                        <div className="space-y-3">
                          {detail.tracks.map((track, index) => {
                            const audioItem = detail.audio_bank?.find((item) => item.track_id === track.id) || {};
                            return (
                              <div key={track.id || `${track.track_number}-${index}`} className="rounded-lg border border-white/5 bg-black/20 p-3 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-white">{track.track_number}. {track.title}</p>
                                    <p className="text-xs text-gray-500">{track.title_version || 'Original version'}</p>
                                  </div>
                                  <span className={`text-xs ${track.audio_url ? 'text-[#4CAF50]' : 'text-[#E53935]'}`}>
                                    {track.audio_url ? 'Audio uploaded' : 'No audio'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                                  {detailFields([
                                    { label: 'Audio File', value: track.audio_file_name || audioItem.audio_file_name || '—' },
                                    { label: 'Audio Format', value: audioItem.audio_format ? audioItem.audio_format.toUpperCase() : '—' },
                                    { label: 'Track Language', value: track.audio_language || '—' },
                                    { label: 'Explicit', value: track.explicit ? 'Yes' : 'No' },
                                    { label: 'ISRC', value: track.isrc || '—', mono: true },
                                    { label: 'Dolby Atmos ISRC', value: track.dolby_atmos_isrc || '—', mono: true },
                                    { label: 'ISWC', value: track.iswc || '—', mono: true },
                                    { label: 'Main Artist', value: track.main_artist || detail.release?.main_artist || '—' },
                                    { label: 'Artists', value: formatList(track.artists) },
                                    { label: 'Main Contributors', value: formatList(track.main_contributors) },
                                    { label: 'Contributors', value: formatList(track.contributors) },
                                    { label: 'Publisher', value: track.publisher || '—' },
                                    { label: 'Production', value: track.production || '—' },
                                    { label: 'Preview Start', value: track.preview_start || '—' },
                                    { label: 'Preview End', value: track.preview_end || '—' },
                                    { label: 'Duration', value: track.duration ? `${track.duration}s` : '—' },
                                  ]).map((field) => (
                                    <div key={field.label}>
                                      <span className="text-gray-500">{field.label}:</span>
                                      <span className={`ml-2 break-words ${field.mono ? 'font-mono' : ''}`}>{field.value}</span>
                                    </div>
                                  ))}
                                </div>

                                {audioItem.audio_url && (
                                  <>
                                    <a
                                      href={`${API}/tracks/${audioItem.track_id}/stream`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-kalmori-ghost inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold"
                                    >
                                      <DownloadSimple className="w-3.5 h-3.5" /> Open Audio
                                    </a>
                                    <audio controls className="w-full">
                                      <source src={`${API}/tracks/${audioItem.track_id}/stream`} />
                                    </audio>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No audio information stored for this submission.</p>
                      )}
                    </div>
                  </div>

                  {detail.submission.status === 'pending_review' && (
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <label className="block text-sm text-gray-400">Review Notes (optional)</label>
                      <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full p-3 rounded-lg text-sm resize-none h-20" placeholder="Add notes about this submission..."
                        data-testid="review-notes-input" />
                      <div className="flex gap-3">
                        <Button onClick={() => handleReview('approve')} disabled={reviewing}
                          className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white" data-testid="approve-btn">
                          <CheckCircle className="w-4 h-4 mr-2" /> {reviewing ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button onClick={() => handleReview('reject')} disabled={reviewing}
                          className="flex-1 bg-[#E53935] hover:bg-[#d32f2f] text-white" data-testid="reject-btn">
                          <XCircle className="w-4 h-4 mr-2" /> {reviewing ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {detail.submission.status !== 'pending_review' && (
                    <div className="p-4 bg-white/5 rounded-lg text-sm">
                      <p className="text-gray-400">Reviewed on {new Date(detail.submission.reviewed_at).toLocaleString()}</p>
                      {detail.submission.review_notes && <p className="mt-1 text-gray-300">Notes: {detail.submission.review_notes}</p>}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubmissionsPage;
