import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth, API } from '../App';
import {
  MusicNote, Plus, Trash, PencilSimple, Upload, Play, Pause,
  X, Check, CurrencyDollar, ShoppingBag, Waveform, Tag, DownloadSimple, Archive
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const GENRES = ['Hip-Hop/Rap', 'R&B/Soul', 'Afrobeats', 'Dancehall', 'Reggae', 'Pop', 'Trap', 'Drill', 'Gospel', 'Electronic/EDM', 'Latin', 'Other'];
const MOODS = ['Energetic', 'Chill', 'Dark', 'Emotional', 'Happy', 'Uplifting', 'Romantic', 'Aggressive', 'Party'];
const KEYS = ['Am', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb', 'Ab', 'F#m', 'C#m', 'G#m'];

// Brand colors from design_guidelines.json
const PRIMARY = '#7C4DFF';
const SECONDARY = '#E040FB';
const ALERT = '#FF3B30';
const HIGHLIGHT = '#FFD700';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-white font-mono">{value}</p>
    <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">{label}</p>
    {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
  </div>
);

const inputCls = "w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30 transition-all placeholder-white/30";
const selectCls = `${inputCls} cursor-pointer`;

export default function ProducerBeatBankPage() {
  const { user } = useAuth();
  const [beats, setBeats] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('beats');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState({});
  const [playingId, setPlayingId] = useState(null);
  const [platformFee, setPlatformFee] = useState(15);
  const audioRef = useRef(null);
  useBodyScrollLock(showForm);

  const [form, setForm] = useState({
    title: '', genre: 'Hip-Hop/Rap', bpm: 120, key: 'Cm', mood: 'Energetic',
    description: '',
    price_basic: 29.99, price_premium: 79.99, price_unlimited: 149.99, price_exclusive: 499.99
  });

  const role = user?.user_role || user?.role || '';
  const ALLOWED = ['producer', 'label', 'label_producer', 'admin'];

  useEffect(() => {
    if (!ALLOWED.includes(role)) {
      setLoading(false);
      return undefined;
    }
    fetchAll();
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [role]);

  const fetchAll = async () => {
    try {
      const [beatsRes, salesRes, feeRes] = await Promise.all([
        axios.get(`${API}/beats/my`, { withCredentials: true }),
        axios.get(`${API}/beats/my/sales`, { withCredentials: true }),
        axios.get(`${API}/beats/platform-fee`, { withCredentials: true }),
      ]);
      setBeats(beatsRes.data.beats || []);
      setSales(salesRes.data.sales || []);
      setPlatformFee(feeRes.data.fee_percentage ?? 15);
    } catch (e) {
      toast.error('Failed to load beat bank');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((a, s) => a + (s.producer_amount || 0), 0);
  const totalPlays = beats.reduce((a, b) => a + (b.plays || 0), 0);
  const totalSales = sales.length;

  const resetForm = () => {
    setForm({ title: '', genre: 'Hip-Hop/Rap', bpm: 120, key: 'Cm', mood: 'Energetic', description: '',
      price_basic: 29.99, price_premium: 79.99, price_unlimited: 149.99, price_exclusive: 499.99 });
    setEditing(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/beats`, form, { withCredentials: true });
      setBeats(prev => [res.data, ...prev]);
      setShowForm(false);
      resetForm();
      toast.success('Beat added to your bank!');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create beat');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        title: form.title, genre: form.genre, bpm: form.bpm, key: form.key,
        mood: form.mood, description: form.description,
        prices: {
          basic_lease: form.price_basic, premium_lease: form.price_premium,
          unlimited_lease: form.price_unlimited, exclusive: form.price_exclusive
        }
      };
      const res = await axios.put(`${API}/beats/${editing}`, updateData, { withCredentials: true });
      setBeats(prev => prev.map(b => b.id === editing ? res.data : b));
      setEditing(null); setShowForm(false); resetForm();
      toast.success('Beat updated!');
    } catch (e) {
      toast.error('Failed to update beat');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this beat? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/beats/${id}`, { withCredentials: true });
      setBeats(prev => prev.filter(b => b.id !== id));
      toast.success('Beat deleted');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleAudioUpload = async (beatId, file) => {
    setUploading(prev => ({ ...prev, [beatId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API}/beats/${beatId}/audio`, formData, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchAll();
      toast.success('Audio uploaded with watermark preview!');
    } catch (e) {
      toast.error('Audio upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [beatId]: false }));
    }
  };

  const handleStemsUpload = async (beatId, file) => {
    setUploading(prev => ({ ...prev, [`stems_${beatId}`]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API}/beats/${beatId}/stems`, formData, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchAll();
      toast.success('Stems uploaded!');
    } catch (e) {
      toast.error('Stems upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [`stems_${beatId}`]: false }));
    }
  };

  const handleCoverUpload = async (beatId, file) => {
    setUploading(prev => ({ ...prev, [`cover_${beatId}`]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API}/beats/${beatId}/cover`, formData, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchAll();
      toast.success('Cover uploaded!');
    } catch (e) {
      toast.error('Cover upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [`cover_${beatId}`]: false }));
    }
  };

  const togglePlay = (beat) => {
    if (playingId === beat.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      audioRef.current?.pause();
      if (beat.audio_url || beat.preview_url) {
        const audio = new Audio(`${API}/beats/${beat.id}/stream`);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        audioRef.current = audio;
        setPlayingId(beat.id);
      } else {
        toast.error('Upload audio first');
      }
    }
  };

  const startEdit = (beat) => {
    setForm({
      title: beat.title, genre: beat.genre, bpm: beat.bpm, key: beat.key,
      mood: beat.mood, description: beat.description || '',
      price_basic: beat.prices?.basic_lease || 29.99,
      price_premium: beat.prices?.premium_lease || 79.99,
      price_unlimited: beat.prices?.unlimited_lease || 149.99,
      price_exclusive: beat.prices?.exclusive || 499.99
    });
    setEditing(beat.id);
    setShowForm(true);
  };

  const producerShare = ((100 - platformFee) / 100);

  const tabs = [
    { id: 'beats', label: 'My Beats', count: beats.length },
    { id: 'sales', label: 'Sales Log', count: sales.length },
  ];

  if (!ALLOWED.includes(role)) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto" data-testid="producer-beat-bank">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Beat Bank</h1>
            <p className="text-white/40 text-sm mt-1">
              Upload & manage your beats — earn {(100 - platformFee).toFixed(0)}% of every sale
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all active:scale-95"
            style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
            data-testid="add-beat-btn">
            <Plus className="w-4 h-4" weight="bold" /> Add Beat
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Beats" value={beats.length} icon={<MusicNote className="w-5 h-5" weight="fill" />} color={PRIMARY} />
          <StatCard label="Total Plays" value={totalPlays.toLocaleString()} icon={<Waveform className="w-5 h-5" weight="fill" />} color={SECONDARY} />
          <StatCard label="Total Sales" value={totalSales} icon={<ShoppingBag className="w-5 h-5" weight="fill" />} color="#FF4081" />
          <StatCard
            label="Your Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={<CurrencyDollar className="w-5 h-5" weight="fill" />}
            color={HIGHLIGHT}
            sub={`Platform takes ${platformFee}%`}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#141414] border border-white/10 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              style={activeTab === tab.id ? { background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` } : {}}
              data-testid={`tab-${tab.id}`}>
              {tab.label} {tab.count > 0 && <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Beats Tab */}
        {activeTab === 'beats' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${SECONDARY} transparent transparent transparent` }} />
              </div>
            ) : beats.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${PRIMARY}20` }}>
                  <MusicNote className="w-8 h-8" style={{ color: PRIMARY }} weight="fill" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">No beats yet</h3>
                <p className="text-white/40 text-sm mb-5">Upload your first beat to start selling</p>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                  className="px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all active:scale-95"
                  style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}>
                  <Plus className="w-4 h-4 inline mr-1.5" weight="bold" />Add Your First Beat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {beats.map((beat) => (
                  <div key={beat.id}
                    className="bg-[#141414] border border-white/5 rounded-2xl p-4 hover:border-white/15 transition-all group"
                    data-testid={`beat-row-${beat.id}`}>
                    <div className="flex items-center gap-4">
                      {/* Cover / Play */}
                      <div className="relative flex-shrink-0">
                        {beat.cover_url ? (
                          <img src={`${API}/beats/${beat.id}/cover`} alt={beat.title}
                            className="w-14 h-14 rounded-xl object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${PRIMARY}30, ${SECONDARY}30)` }}>
                            <MusicNote className="w-6 h-6 text-white/30" weight="fill" />
                          </div>
                        )}
                        <button onClick={() => togglePlay(beat)}
                          className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: `${PRIMARY}cc` }}
                          data-testid={`play-beat-${beat.id}`}>
                          {playingId === beat.id
                            ? <Pause className="w-5 h-5 text-white" weight="fill" />
                            : <Play className="w-5 h-5 text-white" weight="fill" />}
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{beat.title}</h3>
                          {playingId === beat.id && (
                            <div className="flex items-center gap-0.5">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-0.5 rounded-full animate-pulse"
                                  style={{ height: `${8 + i * 3}px`, backgroundColor: SECONDARY, animationDelay: `${i * 0.1}s` }} />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          {beat.genre} · {beat.bpm} BPM · {beat.key} · {beat.mood}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs" style={{ color: PRIMARY }}>${beat.prices?.basic_lease}</span>
                          <span className="text-xs text-white/30">·</span>
                          <span className="text-xs text-white/40">{beat.plays || 0} plays</span>
                          <span className="text-xs text-white/30">·</span>
                          <span className="text-xs text-white/40">{beat.sales_count || 0} sold</span>
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="hidden sm:flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${beat.audio_url ? 'bg-green-400' : 'bg-yellow-400'}`}
                          title={beat.audio_url ? 'Audio ready' : 'No audio'} />
                        {beat.has_stems && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[#7C4DFF]/40 text-[#7C4DFF]">STEMS</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          beat.status === 'active' ? 'border-green-400/30 text-green-400' : 'border-yellow-400/30 text-yellow-400'
                        }`}>{beat.status}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* Upload audio */}
                        <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Upload Audio">
                          <input type="file" accept="audio/*" className="hidden"
                            onChange={(e) => e.target.files[0] && handleAudioUpload(beat.id, e.target.files[0])}
                            data-testid={`upload-audio-${beat.id}`} />
                          {uploading[beat.id]
                            ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${SECONDARY} transparent transparent transparent` }} />
                            : <Upload className="w-4 h-4" />}
                        </label>
                        {/* Upload stems */}
                        <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors"
                          style={{ color: beat.has_stems ? '#7C4DFF' : 'rgba(255,255,255,0.4)' }}
                          title={beat.has_stems ? 'Replace Stems' : 'Upload Stems (ZIP/WAV)'}>
                          <input type="file" accept=".zip,.wav,.mp3,.flac,audio/*,application/zip" className="hidden"
                            onChange={(e) => e.target.files[0] && handleStemsUpload(beat.id, e.target.files[0])}
                            data-testid={`upload-stems-${beat.id}`} />
                          {uploading[`stems_${beat.id}`]
                            ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${PRIMARY} transparent transparent transparent` }} />
                            : <Archive className="w-4 h-4" />}
                        </label>
                        {/* Upload cover */}
                        <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Upload Cover">
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => e.target.files[0] && handleCoverUpload(beat.id, e.target.files[0])} />
                          {uploading[`cover_${beat.id}`]
                            ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${SECONDARY} transparent transparent transparent` }} />
                            : <Tag className="w-4 h-4" />}
                        </label>
                        <button onClick={() => startEdit(beat)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                          data-testid={`edit-beat-${beat.id}`}>
                          <PencilSimple className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(beat.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                          data-testid={`delete-beat-${beat.id}`}>
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div>
            {sales.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${HIGHLIGHT}20` }}>
                  <CurrencyDollar className="w-8 h-8" style={{ color: HIGHLIGHT }} weight="fill" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">No sales yet</h3>
                <p className="text-white/40 text-sm">Sales will appear here once artists purchase your beats</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <div key={sale.id} className="bg-[#141414] border border-white/5 rounded-2xl p-4 hover:border-white/15 transition-all"
                    data-testid={`sale-row-${sale.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{sale.beat_title}</h4>
                        <p className="text-xs text-white/40 mt-0.5">
                          {sale.license_type?.replace(/_/g, ' ')} · {new Date(sale.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: HIGHLIGHT }}>${sale.producer_amount?.toFixed(2)}</p>
                        <p className="text-xs text-white/30">of ${sale.amount?.toFixed(2)} total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowForm(false); resetForm(); }}>
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">{editing ? 'Edit Beat' : 'Add Beat to Bank'}</h2>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Beat Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputCls} required placeholder="e.g. Midnight Vibes" data-testid="beat-form-title" />
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputCls} resize-none`} rows={2} placeholder="Describe your beat..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Genre</label>
                    <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
                      className={selectCls} data-testid="beat-form-genre">
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Mood</label>
                    <select value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}
                      className={selectCls}>
                      {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">BPM</label>
                    <input type="number" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: parseInt(e.target.value) || 120 })}
                      className={inputCls} min={40} max={300} data-testid="beat-form-bpm" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Key</label>
                    <select value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className={selectCls}>
                      {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-white/50 uppercase tracking-wider">Pricing</label>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
                      You earn {(100 - platformFee).toFixed(0)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Basic Lease', key: 'price_basic' },
                      { label: 'Premium Lease', key: 'price_premium' },
                      { label: 'Unlimited Lease', key: 'price_unlimited' },
                      { label: 'Exclusive Rights', key: 'price_exclusive' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="block text-xs text-white/30 mb-1">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                          <input type="number" step="0.01" value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                            className={`${inputCls} pl-7`} />
                        </div>
                        <p className="text-xs text-white/20 mt-0.5">
                          You get ${((form[key] || 0) * (100 - platformFee) / 100).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                    className="flex-1 border border-white/10 text-white/50 hover:text-white py-2.5 rounded-full text-sm font-medium transition-all hover:bg-white/5">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 text-white py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
                    data-testid="beat-form-submit">
                    <Check className="w-4 h-4" weight="bold" />
                    {editing ? 'Update Beat' : 'Add to Bank'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
