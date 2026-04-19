import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useAuth, API } from '../App';
import {
  MusicNote, Plus, Trash, PencilSimple, Upload, Play, Pause,
  X, Check, CurrencyDollar, User, Percent, ChartBar, ShoppingBag,
  Waveform, ArrowClockwise, Funnel, Archive, DotsThreeVertical
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const GENRES = ['Hip-Hop/Rap', 'R&B/Soul', 'Afrobeats', 'Dancehall', 'Reggae', 'Pop', 'Trap', 'Drill', 'Gospel', 'Electronic/EDM', 'Latin', 'Other'];
const MOODS = ['Energetic', 'Chill', 'Dark', 'Emotional', 'Happy', 'Uplifting', 'Romantic', 'Aggressive', 'Party'];
const KEYS = ['Am', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb', 'Ab', 'F#m', 'C#m', 'G#m'];

const PRIMARY = '#7C4DFF';
const SECONDARY = '#E040FB';
const HIGHLIGHT = '#FFD700';

const inputCls = "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30 transition-all placeholder-white/30";
const selectCls = `${inputCls} cursor-pointer`;

const StatCard = ({ label, value, icon, color, onClick, hint }) => (
  <div
    onClick={onClick}
    className={`bg-[#111] border border-white/5 rounded-2xl p-4 transition-all duration-200 group relative overflow-hidden
      ${onClick ? 'cursor-pointer hover:border-white/20 active:scale-[0.97]' : ''}`}
  >
    {onClick && (
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
    )}
    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
      style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <p className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">{value}</p>
    <p className="text-[10px] text-white/40 mt-1.5 uppercase tracking-wider">{label}</p>
  </div>
);

export default function AdminBeatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [beats, setBeats] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('beats');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState({});
  const [playingId, setPlayingId] = useState(null);
  const [platformFee, setPlatformFee] = useState(15);
  const [savingFee, setSavingFee] = useState(false);
  const [newFee, setNewFee] = useState(15);
  const [filterProducer, setFilterProducer] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const audioRef = useRef(null);
  useBodyScrollLock(showForm);

  const [form, setForm] = useState({
    title: '', genre: 'Hip-Hop/Rap', bpm: 120, key: 'Cm', mood: 'Energetic', description: '',
    price_basic: 29.99, price_premium: 79.99, price_unlimited: 149.99, price_exclusive: 499.99
  });

  useEffect(() => {
    fetchAll();
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  // close action menu on outside tap
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const fetchAll = async () => {
    try {
      const [beatsRes, salesRes, feeRes] = await Promise.all([
        axios.get(`${API}/beats/admin/all`, { withCredentials: true }),
        axios.get(`${API}/beats/admin/sales`, { withCredentials: true }),
        axios.get(`${API}/beats/platform-fee`, { withCredentials: true }),
      ]);
      setBeats(beatsRes.data.beats || []);
      setSales(salesRes.data.sales || []);
      const fee = feeRes.data.fee_percentage ?? 15;
      setPlatformFee(fee);
      setNewFee(fee);
    } catch (e) {
      toast.error('Failed to load beats data');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((a, s) => a + (s.amount || 0), 0);
  const platformRevenue = sales.reduce((a, s) => a + (s.platform_fee_amount || 0), 0);

  const producers = [...new Map(beats.map(b => [b.created_by, {
    id: b.created_by,
    name: b.producer_name || b.producer_email?.split('@')[0] || `Producer ${b.created_by?.slice(-4)}`,
    email: b.producer_email,
    role: b.producer_role,
  }])).values()];

  const filteredBeats = filterProducer ? beats.filter(b => b.created_by === filterProducer) : beats;

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
      setShowForm(false); resetForm();
      toast.success('Beat created!');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create beat'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        title: form.title, genre: form.genre, bpm: form.bpm, key: form.key,
        mood: form.mood, description: form.description,
        prices: { basic_lease: form.price_basic, premium_lease: form.price_premium, unlimited_lease: form.price_unlimited, exclusive: form.price_exclusive }
      };
      const res = await axios.put(`${API}/beats/${editing}`, updateData, { withCredentials: true });
      setBeats(prev => prev.map(b => b.id === editing ? res.data : b));
      setEditing(null); setShowForm(false); resetForm();
      toast.success('Beat updated!');
    } catch (e) { toast.error('Failed to update beat'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this beat permanently?')) return;
    try {
      await axios.delete(`${API}/beats/${id}`, { withCredentials: true });
      setBeats(prev => prev.filter(b => b.id !== id));
      toast.success('Beat deleted');
    } catch (e) { toast.error('Failed to delete'); }
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
      toast.success('Audio uploaded!');
    } catch (e) { toast.error('Audio upload failed'); }
    finally { setUploading(prev => ({ ...prev, [beatId]: false })); }
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
    } catch (e) { toast.error('Stems upload failed'); }
    finally { setUploading(prev => ({ ...prev, [`stems_${beatId}`]: false })); }
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
    } catch (e) { toast.error('Cover upload failed'); }
    finally { setUploading(prev => ({ ...prev, [`cover_${beatId}`]: false })); }
  };

  const togglePlay = (beat) => {
    if (playingId === beat.id) {
      audioRef.current?.pause(); setPlayingId(null);
    } else {
      audioRef.current?.pause();
      if (beat.audio_url) {
        const audio = new Audio(`${API}/beats/${beat.id}/stream`);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        audioRef.current = audio;
        setPlayingId(beat.id);
      } else {
        toast.error('No audio for this beat');
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
    setEditing(beat.id); setShowForm(true);
  };

  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      await axios.put(`${API}/beats/platform-fee`, { fee_percentage: parseFloat(newFee) }, { withCredentials: true });
      setPlatformFee(parseFloat(newFee));
      toast.success(`Platform fee updated to ${newFee}%`);
    } catch (e) { toast.error('Failed to update fee'); }
    finally { setSavingFee(false); }
  };

  const tabs = [
    { id: 'beats', label: 'Beats', count: beats.length },
    { id: 'sales', label: 'Sales', count: sales.length },
    { id: 'producers', label: 'Producers', count: producers.length },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto" data-testid="admin-beats-page">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Beat Bank</h1>
            <p className="text-xs text-white/40 mt-0.5">Platform fee: {platformFee}%</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll}
              className="w-9 h-9 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
              title="Refresh">
              <ArrowClockwise className="w-4 h-4" />
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-full transition-all active:scale-95"
              style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
              data-testid="add-beat-btn">
              <Plus className="w-4 h-4" weight="bold" />
              <span>Add Beat</span>
            </button>
          </div>
        </div>

        {/* Stats — 2×2 on mobile, 4 cols on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Beats" value={beats.length} icon={<MusicNote className="w-4 h-4" weight="fill" />} color={PRIMARY}
            onClick={() => setActiveTab('beats')} />
          <StatCard label="Producers" value={producers.length} icon={<User className="w-4 h-4" weight="fill" />} color={SECONDARY}
            onClick={() => setActiveTab('producers')} />
          <StatCard label="Total Sales" value={sales.length} icon={<ShoppingBag className="w-4 h-4" weight="fill" />} color="#FF4081"
            onClick={() => setActiveTab('sales')} />
          <StatCard label="Platform Rev." value={`$${platformRevenue.toFixed(2)}`} icon={<CurrencyDollar className="w-4 h-4" weight="fill" />} color={HIGHLIGHT}
            onClick={() => setActiveTab('settings')} />
        </div>

        {/* Tabs — scrollable row on mobile */}
        <div className="flex gap-1 mb-5 bg-[#111] border border-white/5 rounded-xl p-1 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
              style={activeTab === tab.id ? { background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` } : {}}
              data-testid={`admin-tab-${tab.id}`}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 &&
                <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* ── BEATS TAB ── */}
        {activeTab === 'beats' && (
          <div>
            {producers.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
                <Funnel className="w-4 h-4 text-white/40 flex-shrink-0" />
                <select value={filterProducer} onChange={(e) => setFilterProducer(e.target.value)}
                  className="flex-1 bg-[#111] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]">
                  <option value="">All Producers</option>
                  {producers.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.email}</option>
                  ))}
                </select>
                {filterProducer && (
                  <button onClick={() => setFilterProducer('')} className="text-xs text-white/40 hover:text-white transition-colors flex-shrink-0">
                    Clear
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${SECONDARY} transparent transparent transparent` }} />
              </div>
            ) : filteredBeats.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <MusicNote className="w-12 h-12 mx-auto mb-3" />
                <p>No beats found</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredBeats.map((beat) => (
                  <div key={beat.id}
                    className="bg-[#111] border border-white/5 rounded-2xl p-3 sm:p-4 hover:border-white/10 transition-all"
                    data-testid={`admin-beat-${beat.id}`}>

                    {/* Top row: play + info + menu */}
                    <div className="flex items-center gap-3">
                      {/* Cover / Play button */}
                      <button onClick={() => togglePlay(beat)}
                        className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden transition-all active:scale-95"
                        style={{ background: beat.cover_url ? undefined : playingId === beat.id ? `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` : '#1a1a1a' }}
                        data-testid={`admin-play-${beat.id}`}>
                        {beat.cover_url && (
                          <img src={beat.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center rounded-xl transition-opacity ${beat.cover_url ? 'bg-black/40' : ''}`}>
                          {playingId === beat.id
                            ? <Pause className="w-5 h-5 text-white" weight="fill" />
                            : <Play className={`w-5 h-5 text-white ${!beat.audio_url ? 'opacity-30' : ''}`} weight="fill" />}
                        </div>
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{beat.title}</h3>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${beat.audio_url ? 'bg-green-400' : 'bg-yellow-400'}`} />
                          {beat.has_stems && (
                            <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full border border-[#7C4DFF]/40 text-[#7C4DFF] flex-shrink-0">STEMS</span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 truncate">{beat.genre} · {beat.bpm} BPM · {beat.key}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: PRIMARY }}>
                          {beat.producer_name || beat.producer_email || 'Unknown'}
                        </p>
                      </div>

                      {/* Price — visible on all sizes */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: HIGHLIGHT }}>${beat.prices?.basic_lease || 0}</p>
                        <p className="text-[10px] text-white/30">basic</p>
                      </div>

                      {/* 3-dot menu — mobile */}
                      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setOpenMenuId(openMenuId === beat.id ? null : beat.id)}>
                          <DotsThreeVertical className="w-5 h-5" weight="bold" />
                        </button>
                        {openMenuId === beat.id && (
                          <div className="absolute right-0 top-9 z-dropdown bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden w-44">
                            <label className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                              <Upload className="w-4 h-4 flex-shrink-0" />
                              <span>Upload Audio</span>
                              <input type="file" accept="audio/*" className="hidden"
                                onChange={(e) => { e.target.files[0] && handleAudioUpload(beat.id, e.target.files[0]); setOpenMenuId(null); }}
                                data-testid={`upload-audio-${beat.id}`} />
                            </label>
                            <label className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                              <Archive className="w-4 h-4 flex-shrink-0" style={{ color: beat.has_stems ? PRIMARY : undefined }} />
                              <span>{beat.has_stems ? 'Replace Stems' : 'Upload Stems'}</span>
                              <input type="file" accept=".zip,.wav,.mp3,.flac,audio/*,application/zip" className="hidden"
                                onChange={(e) => { e.target.files[0] && handleStemsUpload(beat.id, e.target.files[0]); setOpenMenuId(null); }}
                                data-testid={`upload-stems-${beat.id}`} />
                            </label>
                            <label className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                              <Waveform className="w-4 h-4 flex-shrink-0" />
                              <span>Upload Cover</span>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => { e.target.files[0] && handleCoverUpload(beat.id, e.target.files[0]); setOpenMenuId(null); }} />
                            </label>
                            <div className="border-t border-white/5" />
                            <button
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                              onClick={() => { startEdit(beat); setOpenMenuId(null); }}
                              data-testid={`edit-beat-${beat.id}`}>
                              <PencilSimple className="w-4 h-4 flex-shrink-0" />
                              <span>Edit Details</span>
                            </button>
                            <button
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                              onClick={() => { handleDelete(beat.id); setOpenMenuId(null); }}
                              data-testid={`delete-beat-${beat.id}`}>
                              <Trash className="w-4 h-4 flex-shrink-0" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom stats row — only on sm+ */}
                    <div className="hidden sm:flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-white/40">
                      <span>{beat.plays || 0} plays</span>
                      <span>{beat.sales_count || 0} sales</span>
                      <span className="capitalize">{beat.mood}</span>
                      {beat.has_stems && <span className="text-[#7C4DFF]">Stems included</span>}
                      {uploading[beat.id] && <span className="text-yellow-400">Uploading audio…</span>}
                      {uploading[`stems_${beat.id}`] && <span className="text-yellow-400">Uploading stems…</span>}
                      {uploading[`cover_${beat.id}`] && <span className="text-yellow-400">Uploading cover…</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SALES TAB ── */}
        {activeTab === 'sales' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-xl font-bold font-mono" style={{ color: HIGHLIGHT }}>${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Platform ({platformFee}%)</p>
                <p className="text-xl font-bold font-mono" style={{ color: SECONDARY }}>${platformRevenue.toFixed(2)}</p>
              </div>
            </div>
            {sales.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <CurrencyDollar className="w-12 h-12 mx-auto mb-3" />
                <p>No sales yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sales.map((sale) => (
                  <div key={sale.id} className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
                    data-testid={`sale-${sale.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{sale.beat_title}</h4>
                        <p className="text-xs text-white/40 mt-0.5 truncate">
                          <span style={{ color: PRIMARY }}>{sale.producer_name}</span>
                          {' · '}{sale.license_type?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5">{new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white">${sale.amount?.toFixed(2)}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: SECONDARY }}>+${sale.platform_fee_amount?.toFixed(2)}</p>
                        <p className="text-[10px] text-green-400">${sale.producer_amount?.toFixed(2)} to producer</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCERS TAB ── */}
        {activeTab === 'producers' && (
          <div className="space-y-2.5">
            {producers.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <User className="w-12 h-12 mx-auto mb-3" />
                <p>No producers yet</p>
              </div>
            ) : producers.map((p) => {
              const producerBeats = beats.filter(b => b.created_by === p.id);
              const producerSales = sales.filter(s => s.producer_id === p.id);
              const producerRevenue = producerSales.reduce((a, s) => a + (s.producer_amount || 0), 0);
              return (
                <div key={p.id}
                  onClick={() => navigate(`/admin/users/${p.id}`)}
                  className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-white/20 transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-2xl"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }} />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm"
                      style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
                      {(p.name || p.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{p.name}</p>
                      <p className="text-xs text-white/40 truncate">{p.email || 'No email'}</p>
                    </div>
                    {/* Stats — stacked on mobile */}
                    <div className="flex items-center gap-3 sm:gap-6 text-xs text-white/40 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-white font-bold text-sm leading-none">{producerBeats.length}</p>
                        <p className="mt-0.5">beats</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm leading-none" style={{ color: HIGHLIGHT }}>${producerRevenue.toFixed(0)}</p>
                        <p className="mt-0.5">earned</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="max-w-md">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${HIGHLIGHT}20`, color: HIGHLIGHT }}>
                  <Percent className="w-5 h-5" weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Platform Fee</h3>
                  <p className="text-xs text-white/40">% taken from every beat sale</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number" min={0} max={100} step={0.5}
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#7C4DFF] transition-all"
                    data-testid="platform-fee-input"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-lg font-bold">%</span>
                </div>
                <button onClick={handleSaveFee} disabled={savingFee}
                  className="px-5 py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                  style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
                  data-testid="save-fee-btn">
                  {savingFee ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" weight="bold" />}
                  Save
                </button>
              </div>
              <div className="mt-4 p-3 rounded-xl border border-white/5" style={{ backgroundColor: `${PRIMARY}10` }}>
                <p className="text-xs text-white/50">
                  At <span className="text-white font-bold">{platformFee}%</span> — on a $100 sale:
                  Platform earns <span style={{ color: SECONDARY }}>${(100 * platformFee / 100).toFixed(2)}</span>,
                  Producer earns <span className="text-green-400">${(100 * (100 - platformFee) / 100).toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── CREATE / EDIT MODAL ── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-modal flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setShowForm(false); resetForm(); }}>
            <div className="bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              {/* drag handle on mobile */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">{editing ? 'Edit Beat' : 'New Beat'}</h2>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputCls} required data-testid="beat-form-title" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputCls} resize-none`} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Genre</label>
                    <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className={selectCls}>
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Mood</label>
                    <select value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} className={selectCls}>
                      {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">BPM</label>
                    <input type="number" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: parseInt(e.target.value) || 120 })}
                      className={inputCls} min={40} max={300} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Key</label>
                    <select value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className={selectCls}>
                      {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-3">Pricing</label>
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
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                    className="flex-1 border border-white/10 text-white/50 hover:text-white py-3 rounded-full text-sm font-medium transition-all hover:bg-white/5">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 text-white py-3 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
                    data-testid="beat-form-submit">
                    <Check className="w-4 h-4" weight="bold" /> {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
