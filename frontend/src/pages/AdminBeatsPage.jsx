import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAuth, API } from '../App';
import {
  MusicNote, Plus, Trash, PencilSimple, Upload, Play, Pause,
  X, Check, CurrencyDollar, User, Percent, ChartBar, ShoppingBag,
  Waveform, ArrowClockwise, Funnel
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

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
    className={`bg-[#111] border border-white/5 rounded-2xl p-5 transition-all duration-200 group relative overflow-hidden
      ${onClick ? 'cursor-pointer hover:border-white/20 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]' : ''}`}
    style={onClick ? { '--hover-color': color } : {}}
  >
    {onClick && (
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
    )}
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
      style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-white font-mono">{value}</p>
    <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">{label}</p>
    {onClick && hint && (
      <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium" style={{ color }}>
        {hint} →
      </p>
    )}
  </div>
);

export default function AdminBeatsPage() {
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
  const [savingFee, setSavingFee] = useState(false);
  const [newFee, setNewFee] = useState(15);
  const [filterProducer, setFilterProducer] = useState('');
  const audioRef = useRef(null);

  const [form, setForm] = useState({
    title: '', genre: 'Hip-Hop/Rap', bpm: 120, key: 'Cm', mood: 'Energetic', description: '',
    price_basic: 29.99, price_premium: 79.99, price_unlimited: 149.99, price_exclusive: 499.99
  });

  useEffect(() => {
    fetchAll();
    return () => { if (audioRef.current) audioRef.current.pause(); };
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

  // Unique producers — fallback chain for name
  const producers = [...new Map(beats.map(b => [b.created_by, {
    id: b.created_by,
    name: b.producer_name || b.producer_email?.split('@')[0] || `Producer ${b.created_by?.slice(-4)}`,
    email: b.producer_email,
    role: b.producer_role,
  }])).values()];

  const filteredBeats = filterProducer
    ? beats.filter(b => b.created_by === filterProducer)
    : beats;

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
    { id: 'beats', label: 'All Beats', count: beats.length },
    { id: 'sales', label: 'Sales', count: sales.length },
    { id: 'producers', label: 'Producers', count: producers.length },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto" data-testid="admin-beats-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Beat Bank Manager</h1>
            <p className="text-sm text-white/40 mt-1">Manage all producer beats · Platform fee: {platformFee}%</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="p-2.5 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Refresh">
              <ArrowClockwise className="w-4 h-4" />
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all active:scale-95"
              style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
              data-testid="add-beat-btn">
              <Plus className="w-4 h-4" weight="bold" /> Add Beat
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Beats" value={beats.length} icon={<MusicNote className="w-5 h-5" weight="fill" />} color={PRIMARY}
            onClick={() => setActiveTab('beats')} hint="View all beats" />
          <StatCard label="Producers" value={producers.length} icon={<User className="w-5 h-5" weight="fill" />} color={SECONDARY}
            onClick={() => setActiveTab('producers')} hint="View producers" />
          <StatCard label="Total Sales" value={sales.length} icon={<ShoppingBag className="w-5 h-5" weight="fill" />} color="#FF4081"
            onClick={() => setActiveTab('sales')} hint="View sales" />
          <StatCard label="Platform Revenue" value={`$${platformRevenue.toFixed(2)}`} icon={<CurrencyDollar className="w-5 h-5" weight="fill" />} color={HIGHLIGHT}
            onClick={() => setActiveTab('settings')} hint="Manage fee" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111] border border-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
              style={activeTab === tab.id ? { background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` } : {}}
              data-testid={`admin-tab-${tab.id}`}>
              {tab.label}{tab.count !== undefined && tab.count > 0 && <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Beats Tab */}
        {activeTab === 'beats' && (
          <div>
            {/* Filter by producer */}
            {producers.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
                <Funnel className="w-4 h-4 text-white/40" />
                <select value={filterProducer} onChange={(e) => setFilterProducer(e.target.value)}
                  className="bg-[#111] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]">
                  <option value="">All Producers</option>
                  {producers.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.email}</option>
                  ))}
                </select>
                {filterProducer && (
                  <button onClick={() => setFilterProducer('')} className="text-xs text-white/40 hover:text-white transition-colors">
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
              <div className="space-y-3">
                {filteredBeats.map((beat) => (
                  <div key={beat.id} className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group"
                    data-testid={`admin-beat-${beat.id}`}>
                    <div className="flex items-center gap-4">
                      {/* Play */}
                      <button onClick={() => togglePlay(beat)}
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          playingId === beat.id ? 'opacity-100' : beat.audio_url ? 'opacity-60 hover:opacity-100' : 'opacity-20'
                        }`}
                        style={{ background: playingId === beat.id ? `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` : '#333' }}
                        data-testid={`admin-play-${beat.id}`}>
                        {playingId === beat.id ? <Pause className="w-5 h-5 text-white" weight="fill" /> : <Play className="w-5 h-5 text-white" weight="fill" />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{beat.title}</h3>
                        <p className="text-xs text-white/40">{beat.genre} · {beat.bpm} BPM · {beat.key} · {beat.mood}</p>
                        {/* Producer badge */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${PRIMARY}30` }}>
                            <User className="w-2.5 h-2.5" style={{ color: PRIMARY }} />
                          </div>
                          <span className="text-xs" style={{ color: PRIMARY }}>{beat.producer_name || beat.producer_email || 'Unknown'}</span>
                          <span className="text-xs text-white/20">·</span>
                          <span className="text-xs text-white/30 capitalize">{beat.producer_role}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-4 text-xs text-white/40">
                        <div className="text-center">
                          <p className="text-white font-bold text-sm">{beat.plays || 0}</p>
                          <p>plays</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-sm">{beat.sales_count || 0}</p>
                          <p>sales</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm" style={{ color: HIGHLIGHT }}>${beat.prices?.basic_lease}</p>
                          <p>basic</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${beat.audio_url ? 'bg-green-400' : 'bg-yellow-400'}`}
                          title={beat.audio_url ? 'Audio ready' : 'No audio'} />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Upload Audio">
                          <input type="file" accept="audio/*" className="hidden"
                            onChange={(e) => e.target.files[0] && handleAudioUpload(beat.id, e.target.files[0])}
                            data-testid={`upload-audio-${beat.id}`} />
                          {uploading[beat.id]
                            ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${SECONDARY} transparent` }} />
                            : <Upload className="w-4 h-4" />}
                        </label>
                        <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Upload Cover">
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => e.target.files[0] && handleCoverUpload(beat.id, e.target.files[0])} />
                          {uploading[`cover_${beat.id}`]
                            ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${SECONDARY} transparent` }} />
                            : <Waveform className="w-4 h-4" />}
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Sales Revenue</p>
                <p className="text-2xl font-bold font-mono" style={{ color: HIGHLIGHT }}>${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Platform Earnings ({platformFee}%)</p>
                <p className="text-2xl font-bold font-mono" style={{ color: SECONDARY }}>${platformRevenue.toFixed(2)}</p>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{sale.beat_title}</h4>
                        <p className="text-xs text-white/40 mt-0.5">
                          By <span style={{ color: PRIMARY }}>{sale.producer_name}</span> · {sale.license_type?.replace(/_/g, ' ')} · {new Date(sale.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">${sale.amount?.toFixed(2)}</p>
                        <p className="text-xs mt-0.5">
                          <span style={{ color: SECONDARY }}>Platform: ${sale.platform_fee_amount?.toFixed(2)}</span>
                          <span className="text-white/30"> · </span>
                          <span className="text-green-400">Producer: ${sale.producer_amount?.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Producers Tab */}
        {activeTab === 'producers' && (
          <div className="space-y-3">
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
                  onClick={() => { setFilterProducer(p.id); setActiveTab('beats'); }}
                  className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-2xl"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-transform duration-200 group-hover:scale-110"
                        style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
                        {(p.name || p.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{p.name}</p>
                        <p className="text-xs text-white/40">{p.email || 'No email'}</p>
                        {p.role && <span className="text-xs px-2 py-0.5 rounded-full capitalize mt-1 inline-block"
                          style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>{p.role.replace(/_/g, ' ')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-white/40">
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">{producerBeats.length}</p>
                        <p>beats</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">{producerSales.length}</p>
                        <p>sales</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm" style={{ color: HIGHLIGHT }}>${producerRevenue.toFixed(2)}</p>
                        <p>earned</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium" style={{ color: PRIMARY }}>
                        View beats →
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-md">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${HIGHLIGHT}20`, color: HIGHLIGHT }}>
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
                  className="px-5 py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
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

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowForm(false); resetForm(); }}>
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
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
                    className="flex-1 border border-white/10 text-white/50 hover:text-white py-2.5 rounded-full text-sm font-medium transition-all hover:bg-white/5">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 text-white py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
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
