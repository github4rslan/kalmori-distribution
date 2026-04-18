import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import GlobalFooter from '../components/GlobalFooter';
import { useAuth } from '../App';
import {
  MusicNote, Lightning, ShieldCheck, Headset, Check, Star,
  PaperPlaneTilt, Play, Pause, SpeakerHigh, ShoppingCart,
  MagnifyingGlass, Sliders, X, ShareNetwork, SkipBack, SkipForward,
  DotsThreeVertical, Copy, Heart, DownloadSimple, Flag
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Seeded pseudo-random so each beat's waveform is stable across renders
const seededRandom = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 13), 2654435761);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

// Shared 3-dot action menu for beat rows
const BeatMenu = ({ isFav, onFav, onShare, onDownload, onReport }) => (
  <div className="absolute right-0 bottom-10 z-30 bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-48">
    <button onClick={onFav}
      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors">
      <Heart className={`w-4 h-4 flex-shrink-0 ${isFav ? 'text-[#E040FB]' : ''}`} weight={isFav ? 'fill' : 'regular'} />
      {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
    </button>
    <button onClick={onShare}
      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors">
      <Copy className="w-4 h-4 flex-shrink-0" />
      Copy Link
    </button>
    <button onClick={onDownload}
      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors border-t border-white/5">
      <DownloadSimple className="w-4 h-4 flex-shrink-0" />
      Download Preview
    </button>
    <button onClick={onReport}
      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-red-400 transition-colors border-t border-white/5">
      <Flag className="w-4 h-4 flex-shrink-0" />
      Report Beat
    </button>
  </div>
);

// Waveform visualizer — bars colored progressively based on playhead
const Waveform = ({ seed, progressPct, isPlaying, onSeek, bars = 48, barColor = '#7C4DFF', dimColor = '#3a2a5c' }) => {
  const heights = React.useMemo(() => {
    const rand = seededRandom(seed || 'beat');
    return Array.from({ length: bars }, (_, i) => {
      // Soft envelope so middle bars are taller, edges shorter
      const t = i / (bars - 1);
      const envelope = 0.45 + 0.55 * Math.sin(Math.PI * t);
      return Math.max(0.18, Math.min(1, rand() * envelope + 0.15));
    });
  }, [seed, bars]);

  return (
    <div
      className="relative w-full h-10 flex items-center gap-[2px] cursor-pointer select-none"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek?.((e.clientX - rect.left) / rect.width);
      }}>
      {heights.map((h, i) => {
        const barPct = ((i + 0.5) / bars) * 100;
        const played = barPct <= progressPct;
        return (
          <div
            key={i}
            className="flex-1 rounded-[2px] transition-[height,background] duration-200"
            style={{
              height: `${h * 100}%`,
              background: played ? barColor : dimColor,
              opacity: played ? (isPlaying ? 1 : 0.9) : 0.55,
              transform: isPlaying && played ? `scaleY(${0.85 + Math.abs(Math.sin((Date.now() / 400) + i * 0.6)) * 0.15})` : 'scaleY(1)',
            }}
          />
        );
      })}
    </div>
  );
};

const licenseTiers = [
  { id: 'basic_lease', name: 'Basic Lease', price: 29.99, desc: 'Perfect for demos and mixtapes', features: ['MP3 File (320kbps)', 'Up to 5,000 streams', 'Non-exclusive license', 'Credit required'], color: '#7C4DFF' },
  { id: 'premium_lease', name: 'Premium Lease', price: 79.99, desc: 'For serious releases', features: ['WAV + MP3 Files', 'Up to 50,000 streams', 'Trackouts included', 'Non-exclusive license', 'Credit required'], color: '#E040FB', popular: true },
  { id: 'unlimited_lease', name: 'Unlimited Lease', price: 149.99, desc: 'Maximum flexibility', features: ['WAV + MP3 + Stems', 'Unlimited streams', 'Music video rights', 'Non-exclusive license', 'Credit required'], color: '#FF4081' },
  { id: 'exclusive', name: 'Exclusive Rights', price: 499.99, desc: 'Full ownership', features: ['All files + Stems', 'Unlimited usage', 'Full ownership', 'Beat removed from catalog', 'No credit required'], color: '#FFD700' },
];

const whyItems = [
  { icon: <MusicNote className="w-6 h-6" />, title: 'Industry Quality', desc: 'Professional studio-quality beats mixed and mastered to perfection', color: '#7C4DFF' },
  { icon: <Lightning className="w-6 h-6" />, title: 'Fast Delivery', desc: 'Get your beats delivered within 24-48 hours after purchase', color: '#E040FB' },
  { icon: <ShieldCheck className="w-6 h-6" />, title: '100% Original', desc: 'All beats are original compositions with no samples', color: '#FF4081' },
  { icon: <Headset className="w-6 h-6" />, title: 'Support', desc: 'Direct communication with the producer for revisions', color: '#FFD700' },
];

const genres = ['Hip-Hop/Rap', 'R&B/Soul', 'Afrobeats', 'Dancehall', 'Reggae', 'Pop', 'Trap', 'Drill', 'Gospel', 'Electronic/EDM', 'Latin', 'Other'];
const moods = ['Energetic/Hype', 'Chill/Laid-back', 'Dark/Moody', 'Emotional/Sad', 'Happy/Uplifting', 'Romantic', 'Aggressive', 'Party/Club'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

const licenseTermsMap = {
  basic_lease: { name: 'Basic Lease', rights: 'Non-exclusive license', files: 'MP3 (320kbps)', streams: 'Up to 5,000', sales: 'Up to 500', video: 'Not included', credit: 'Required', ownership: 'Producer retains ownership', duration: 'Perpetual (non-exclusive)' },
  premium_lease: { name: 'Premium Lease', rights: 'Non-exclusive license', files: 'WAV + MP3 + Trackouts', streams: 'Up to 50,000', sales: 'Up to 5,000', video: '1 music video', credit: 'Required', ownership: 'Producer retains ownership', duration: 'Perpetual (non-exclusive)' },
  unlimited_lease: { name: 'Unlimited Lease', rights: 'Non-exclusive license', files: 'WAV + MP3 + Stems', streams: 'Unlimited', sales: 'Unlimited', video: 'Unlimited', credit: 'Required', ownership: 'Producer retains ownership', duration: 'Perpetual (non-exclusive)' },
  exclusive: { name: 'Exclusive Rights', rights: 'Full ownership transfer', files: 'All files + Stems + Sessions', streams: 'Unlimited', sales: 'Unlimited', video: 'Unlimited', credit: 'Not required', ownership: 'Full ownership to buyer', duration: 'Perpetual (exclusive)' },
};

export default function InstrumentalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Purchase modal state
  const [selectedLicense, setSelectedLicense] = useState('');
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [purchaseStep, setPurchaseStep] = useState('license');
  const [signerName, setSignerName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signingContract, setSigningContract] = useState(false);

  // Filter state
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [filterKey, setFilterKey] = useState('');
  const [bpmRange, setBpmRange] = useState([60, 200]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom beat request
  const [form, setForm] = useState({ artist_name: '', email: '', phone: '', tempo_range: '', reference_tracks: '', budget: '', additional_notes: '' });
  const [submitted, setSubmitted] = useState(false);

  // Beats & player
  const [beats, setBeats] = useState([]);
  const [loadingBeats, setLoadingBeats] = useState(true);
  const [currentBeatId, setCurrentBeatId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [wavePulse, setWavePulse] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('kalmori_beat_favorites') || '[]')); }
    catch { return new Set(); }
  });

  const toggleFavorite = (beatId) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(beatId)) { next.delete(beatId); toast.success('Removed from favorites'); }
      else { next.add(beatId); toast.success('Added to favorites'); }
      localStorage.setItem('kalmori_beat_favorites', JSON.stringify([...next]));
      return next;
    });
  };

  const downloadPreview = (beat) => {
    const a = document.createElement('a');
    a.href = `${API_URL}/api/beats/${beat.id}/stream`;
    a.download = `${beat.title}-preview.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  const reportBeat = (beat) => {
    window.location.href = `mailto:admin@kalmori.org?subject=Report Beat: ${encodeURIComponent(beat.title)}&body=${encodeURIComponent(`Beat: ${beat.title}\nProducer: ${beat.producer_name || 'Kalmori'}\nReason: `)}`;
  };

  // Drive waveform animation at ~20fps while playing
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setWavePulse(p => p + 1), 90);
    return () => clearInterval(id);
  }, [isPlaying]);

  const audioRef = useRef(null);
  const searchTimeout = useRef(null);
  const beatListRef = useRef(null);

  useEffect(() => {
    fetchBeats();
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') === 'cancelled') {
      toast.error('Purchase was cancelled');
      window.history.replaceState({}, '', '/instrumentals');
    }
  }, []);

  // Close 3-dot menu on outside tap
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  const fetchBeats = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search || searchQuery) queryParams.set('search', params.search || searchQuery);
      if (params.genre || selectedGenre) queryParams.set('genre', params.genre || selectedGenre);
      if (params.mood || selectedMood) queryParams.set('mood', params.mood || selectedMood);
      if (params.key || filterKey) queryParams.set('key', params.key || filterKey);
      if (bpmRange[0] > 60) queryParams.set('bpm_min', bpmRange[0]);
      if (bpmRange[1] < 200) queryParams.set('bpm_max', bpmRange[1]);
      if (sortBy !== 'newest') queryParams.set('sort_by', sortBy);
      const qs = queryParams.toString();
      const res = await axios.get(`${API_URL}/api/beats${qs ? '?' + qs : ''}`);
      setBeats(res.data.beats || []);
    } catch (err) {
      console.error('Failed to fetch beats:', err);
    } finally {
      setLoadingBeats(false);
    }
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchBeats({ search: val }), 300);
  };

  const applyFilters = () => { setLoadingBeats(true); fetchBeats(); setShowFilters(false); };

  const clearFilters = () => {
    setSearchQuery(''); setSelectedGenre(''); setSelectedMood(''); setFilterKey('');
    setBpmRange([60, 200]); setSortBy('newest'); setShowFilters(false);
    setLoadingBeats(true); fetchBeats({ search: '', genre: '', mood: '', key: '' });
  };

  const toggleBeat = (beat) => {
    // Same beat — toggle play/pause without unloading
    if (currentBeatId === beat.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    // Different (or new) beat — swap audio source
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (beat.audio_url) {
      const audio = new Audio(`${API_URL}/api/beats/${beat.id}/stream`);
      audio.onloadedmetadata = () => setDuration(audio.duration || 0);
      audio.ontimeupdate = () => setProgress(audio.currentTime || 0);
      audio.onended = () => setIsPlaying(false);
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
    setCurrentBeatId(beat.id);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
  };

  const closePlayer = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setCurrentBeatId(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  };

  const seekTo = (pct) => {
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = pct * duration;
      setProgress(pct * duration);
    }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const skipBeat = (dir) => {
    if (!beats.length) return;
    const idx = beats.findIndex(b => b.id === currentBeatId);
    const next = beats[(idx + dir + beats.length) % beats.length];
    if (next && next.id !== currentBeatId) {
      // Force swap by clearing first
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setCurrentBeatId(null);
      setTimeout(() => toggleBeat(next), 0);
    }
  };

  const openPurchaseModal = (beat) => {
    setSelectedBeat(beat);
    setSelectedLicense('basic_lease');
    setPurchaseStep('license');
    setSignerName('');
    setAgreedToTerms(false);
  };

  const handleBuyBeat = async (beat, licenseType) => {
    if (!user) { navigate('/login'); return; }
    if (!signerName.trim() || !agreedToTerms) { toast.error('Please sign the contract first'); return; }
    setSigningContract(true);
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
        || localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      const contractRes = await axios.post(`${API_URL}/api/beats/contract/sign`, {
        beat_id: beat.id, license_type: licenseType, signer_name: signerName.trim(),
      }, { headers, withCredentials: true });
      const contractId = contractRes.data.id;
      const res = await axios.post(`${API_URL}/api/beats/purchase/checkout`, {
        beat_id: beat.id, license_type: licenseType, contract_id: contractId, origin_url: window.location.origin,
      }, { headers, withCredentials: true });
      if (res.data.checkout_url) window.location.href = res.data.checkout_url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process order');
    } finally { setSigningContract(false); }
  };

  const shareBeat = (beat) => {
    const url = `${window.location.origin}/instrumentals?beat=${beat.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Beat link copied!'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.artist_name || !form.email || !selectedGenre) return;
    setSubmitted(true);
  };

  const currentBeat = beats.find(b => b.id === currentBeatId) || null;
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto bg-[#0a0a0a]" data-testid="instrumentals-page"
        style={{ paddingBottom: currentBeat ? '130px' : '0' }}>

        {/* ── PAGE HEADER ── */}
        <div className="px-4 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>
              <MusicNote className="w-4 h-4 text-white" weight="fill" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Beat Store</h1>
          </div>
          <p className="text-sm text-gray-500 ml-11">Preview & license beats from top producers</p>
        </div>

        {/* ══════════════════════════════════════════
            BEAT CATALOG — Airbit-style list
        ══════════════════════════════════════════ */}
        <div className="px-4 pb-2" data-reveal data-reveal-variant="rise" ref={beatListRef}>
          <p className="text-xs text-gray-600 mb-4">{beats.length} beat{beats.length !== 1 ? 's' : ''} available</p>

          {/* Search bar */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search beats..."
                className="w-full bg-[#111] border border-[#222] rounded-xl pl-10 pr-9 py-3 text-white text-sm focus:border-[#7C4DFF]/60 focus:outline-none placeholder-gray-600"
                data-testid="beat-search-input"
              />
              {searchQuery && (
                <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${showFilters ? 'bg-[#7C4DFF]/15 border-[#7C4DFF]/40 text-[#7C4DFF]' : 'bg-[#111] border-[#222] text-gray-400'}`}
              data-testid="toggle-filters-btn">
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 mb-4 space-y-4" data-testid="filters-panel">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wider">Genre</label>
                  <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" data-testid="filter-genre">
                    <option value="">All</option>
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wider">Mood</label>
                  <select value={selectedMood} onChange={e => setSelectedMood(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" data-testid="filter-mood">
                    <option value="">All</option>
                    {moods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wider">Key</label>
                  <select value={filterKey} onChange={e => setFilterKey(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" data-testid="filter-key">
                    <option value="">All</option>
                    {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wider">Sort</label>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" data-testid="filter-sort">
                    <option value="newest">Newest</option>
                    <option value="price_low">Price ↑</option>
                    <option value="price_high">Price ↓</option>
                    <option value="bpm_low">BPM ↑</option>
                    <option value="bpm_high">BPM ↓</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wider">BPM: {bpmRange[0]} – {bpmRange[1]}</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="60" max="200" value={bpmRange[0]} onChange={e => setBpmRange([parseInt(e.target.value), bpmRange[1]])}
                    className="flex-1 accent-[#7C4DFF]" data-testid="bpm-min-slider" />
                  <input type="range" min="60" max="200" value={bpmRange[1]} onChange={e => setBpmRange([bpmRange[0], parseInt(e.target.value)])}
                    className="flex-1 accent-[#7C4DFF]" data-testid="bpm-max-slider" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={applyFilters}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(90deg, #7C4DFF, #E040FB)' }}
                  data-testid="apply-filters-btn">
                  Apply
                </button>
                <button onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-gray-400 text-sm font-medium hover:text-white transition-all"
                  data-testid="clear-filters-btn">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Beat list */}
          {loadingBeats ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : beats.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C4DFF20,#E040FB20)' }}>
                <MusicNote className="w-8 h-8 opacity-40" weight="fill" />
              </div>
              <p className="text-sm font-medium">No beats available yet</p>
              <p className="text-xs text-gray-600 mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
              {/* Desktop column header */}
              <div className="hidden md:grid grid-cols-[56px_1fr_80px_70px_100px_90px_40px] items-center gap-4 px-4 py-2.5 bg-[#0a0a0a] border-b border-white/10 text-[10px] uppercase tracking-[2px] text-gray-500 font-semibold">
                <span />
                <span>Track</span>
                <span className="text-center">BPM</span>
                <span className="text-center">Key</span>
                <span className="text-center">Tags</span>
                <span className="text-center">Price</span>
                <span />
              </div>

              {beats.map((beat, idx) => {
                const isCurrent = currentBeatId === beat.id;
                const isThisPlaying = isCurrent && isPlaying;
                const isFav = favorites.has(beat.id);
                return (
                  <div
                    key={beat.id}
                    className={`relative transition-all border-b border-white/[0.04] last:border-b-0 ${isCurrent ? 'bg-gradient-to-r from-[#7C4DFF]/15 via-[#7C4DFF]/5 to-transparent' : 'bg-[#111] hover:bg-[#161616] active:bg-[#181818]'}`}
                    data-testid={`beat-${beat.id}`}>

                    {/* Active left bar */}
                    {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'linear-gradient(180deg,#7C4DFF,#E040FB)' }} />}

                    {/* Mobile layout (compact row) */}
                    <div className="flex md:hidden items-center gap-3 px-3 py-2.5">
                      <button onClick={() => toggleBeat(beat)}
                        className={`relative w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden group transition-all ${isCurrent ? 'ring-2 ring-[#7C4DFF]/60 shadow-[0_0_12px_rgba(124,77,255,0.4)]' : ''}`}
                        style={{ background: beat.cover_url ? undefined : 'linear-gradient(135deg,#1a1a2e,#16213e)' }}
                        data-testid={`play-beat-${beat.id}`}
                        aria-label={isThisPlaying ? 'Pause' : 'Play'}>
                        {beat.cover_url
                          ? <img src={beat.cover_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><MusicNote className="w-5 h-5 text-white/20" weight="fill" /></div>
                        }
                        {isThisPlaying ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55 rounded-xl">
                            <div className="flex items-end justify-center gap-[2px] h-4">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="w-[3px] rounded-full animate-pulse"
                                  style={{ height: `${6 + (i % 2) * 5}px`, background: 'linear-gradient(180deg,#fff,#E040FB)', animationDelay: `${i * 0.12}s` }} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white drop-shadow ml-0.5" weight="fill" />
                          </div>
                        )}
                      </button>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleBeat(beat)}>
                        <p className={`text-[13px] font-semibold truncate leading-tight ${isCurrent ? 'text-white' : 'text-gray-100'}`}>{beat.title}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{beat.producer_name || 'Kalmori'} · {beat.bpm} BPM · {beat.key}</p>
                      </div>
                      <button onClick={() => openPurchaseModal(beat)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-bold flex-shrink-0 transition-all active:scale-95 shadow-md"
                        style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}
                        data-testid={`buy-beat-${beat.id}`}>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        ${beat.prices?.basic_lease || '29.99'}
                      </button>
                      <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setOpenMenuId(openMenuId === beat.id ? null : beat.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                          aria-label="More options">
                          <DotsThreeVertical className="w-4 h-4" weight="bold" />
                        </button>
                        {openMenuId === beat.id && (
                          <BeatMenu beat={beat} isFav={isFav}
                            onFav={() => { toggleFavorite(beat.id); setOpenMenuId(null); }}
                            onShare={() => { shareBeat(beat); setOpenMenuId(null); }}
                            onDownload={() => { downloadPreview(beat); setOpenMenuId(null); }}
                            onReport={() => { reportBeat(beat); setOpenMenuId(null); }} />
                        )}
                      </div>
                    </div>

                    {/* Desktop layout (grid columns) */}
                    <div className="hidden md:grid grid-cols-[56px_1fr_80px_70px_100px_90px_40px] items-center gap-4 px-4 py-3 group">
                      {/* Cover */}
                      <button onClick={() => toggleBeat(beat)}
                        className={`relative w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-[#7C4DFF]/60 shadow-[0_0_16px_rgba(124,77,255,0.4)]' : ''}`}
                        style={{ background: beat.cover_url ? undefined : 'linear-gradient(135deg,#1a1a2e,#16213e)' }}
                        aria-label={isThisPlaying ? 'Pause' : 'Play'}>
                        {beat.cover_url
                          ? <img src={beat.cover_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><MusicNote className="w-6 h-6 text-white/20" weight="fill" /></div>
                        }
                        {isThisPlaying ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55 rounded-xl">
                            <div className="flex items-end justify-center gap-[2px] h-5">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="w-[3px] rounded-full animate-pulse"
                                  style={{ height: `${8 + (i % 2) * 6}px`, background: 'linear-gradient(180deg,#fff,#E040FB)', animationDelay: `${i * 0.12}s` }} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-white drop-shadow ml-0.5" weight="fill" />
                          </div>
                        )}
                      </button>
                      {/* Title + producer */}
                      <div className="min-w-0 cursor-pointer" onClick={() => toggleBeat(beat)}>
                        <p className={`text-[14px] font-semibold truncate leading-tight ${isCurrent ? 'text-white' : 'text-gray-100'}`}>{beat.title}</p>
                        <p className="text-[12px] text-gray-500 truncate mt-0.5">{beat.producer_name || 'Kalmori'}</p>
                      </div>
                      {/* BPM */}
                      <span className="text-center text-[13px] text-gray-300 font-mono tabular-nums">{beat.bpm}</span>
                      {/* Key */}
                      <span className="text-center text-[13px] text-gray-300">{beat.key}</span>
                      {/* Tags */}
                      <span className="text-center text-[11px] text-gray-500 truncate px-1">{beat.genre || beat.mood || '—'}</span>
                      {/* Price + actions */}
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => toggleFavorite(beat.id)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isFav ? 'text-[#E040FB] opacity-100' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                          aria-label="Favorite">
                          <Heart className="w-4 h-4" weight={isFav ? 'fill' : 'regular'} />
                        </button>
                        <button onClick={() => openPurchaseModal(beat)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[12px] font-bold transition-all hover:brightness-110 active:scale-95 shadow-md"
                          style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          ${beat.prices?.basic_lease || '29.99'}
                        </button>
                      </div>
                      {/* 3-dot */}
                      <div className="relative flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setOpenMenuId(openMenuId === beat.id ? null : beat.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                          aria-label="More options">
                          <DotsThreeVertical className="w-4 h-4" weight="bold" />
                        </button>
                        {openMenuId === beat.id && (
                          <BeatMenu beat={beat} isFav={isFav}
                            onFav={() => { toggleFavorite(beat.id); setOpenMenuId(null); }}
                            onShare={() => { shareBeat(beat); setOpenMenuId(null); }}
                            onDownload={() => { downloadPreview(beat); setOpenMenuId(null); }}
                            onReport={() => { reportBeat(beat); setOpenMenuId(null); }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-3 bg-[#111] rounded-xl flex items-center gap-3">
            <SpeakerHigh className="w-5 h-5 text-[#7C4DFF] flex-shrink-0" />
            <p className="text-xs text-gray-500">Previews play tagged samples. Full untagged files delivered after purchase.</p>
          </div>
        </div>

        {/* ── LICENSING OPTIONS ── */}
        <div className="p-6 mt-2" data-reveal data-reveal-variant="flip">
          <h2 className="text-sm font-bold text-[#E040FB] tracking-[3px] text-center mb-2">LICENSING OPTIONS</h2>
          <p className="text-sm text-gray-400 text-center mb-6">Choose the right license for your project</p>
          <div className="space-y-4">
            {licenseTiers.map((tier) => (
              <button key={tier.id} onClick={() => setSelectedLicense(tier.id)}
                className={`w-full bg-[#1a1a1a] rounded-2xl p-6 text-left border-2 relative overflow-hidden transition-all ${selectedLicense === tier.id ? 'border-opacity-100' : 'border-opacity-30'}`}
                style={{ borderColor: tier.color }}
                data-testid={`tier-${tier.id}`}>
                {tier.popular && (
                  <span className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[10px] font-bold text-white tracking-wider" style={{ backgroundColor: tier.color }}>MOST POPULAR</span>
                )}
                {selectedLicense === tier.id && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white mb-3" style={{ backgroundColor: tier.color }}>
                    <Check className="w-3 h-3" weight="bold" /> SELECTED
                  </span>
                )}
                <h3 className="text-lg font-bold mb-2" style={{ color: tier.color }}>{tier.name}</h3>
                <div className="flex items-start mb-2">
                  <span className="text-xl font-bold text-white mt-1">$</span>
                  <span className="text-5xl font-extrabold text-white leading-none">{Math.floor(tier.price)}</span>
                  <span className="text-xl font-bold text-white mt-1">.{String(Math.round((tier.price % 1) * 100)).padStart(2, '0')}</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">{tier.desc}</p>
                <div className="space-y-2.5">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: tier.color }} weight="bold" />
                      <span className="text-sm text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── WHY CHOOSE US ── */}
        <div className="p-6" data-reveal data-reveal-variant="zoom">
          <h2 className="text-sm font-bold text-[#E040FB] tracking-[3px] text-center mb-6">WHY CHOOSE US</h2>
          <div className="grid grid-cols-2 gap-4">
            {whyItems.map((item, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl p-5 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${item.color}20`, color: item.color }}>{item.icon}</div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CUSTOM BEAT REQUEST ── */}
        <div className="mx-4 mt-6 mb-8 rounded-3xl p-6 border border-[#333] bg-[#0a0a0a]" data-testid="beat-request-form" data-reveal data-reveal-variant="scale">
          <div className="text-center mb-2">
            <h2 className="text-xl font-extrabold text-white tracking-[2px]">REQUEST A CUSTOM BEAT</h2>
          </div>
          <p className="text-sm text-gray-400 text-center mb-6">Fill out the form and we'll get back to you within 24-48 hours</p>

          {submitted ? (
            <div className="text-center py-8" data-testid="request-success">
              <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] mx-auto mb-6 flex items-center justify-center">
                <Check className="w-10 h-10 text-white" weight="bold" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3">Request Submitted!</h3>
              <p className="text-[15px] text-gray-400 leading-relaxed mb-6">We've received your beat request and will contact you within 24-48 hours.</p>
              <button onClick={() => { setSubmitted(false); setForm({ artist_name: '', email: '', phone: '', tempo_range: '', reference_tracks: '', budget: '', additional_notes: '' }); setSelectedGenre(''); setSelectedMood(''); }}
                className="px-7 py-3.5 rounded-full bg-[#333] text-white text-sm font-bold tracking-wider">
                SUBMIT ANOTHER REQUEST
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#E040FB] mb-4">Your Information</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Artist/Producer Name *', key: 'artist_name', type: 'text', testid: 'req-artist-name' },
                    { label: 'Email Address *', key: 'email', type: 'email', testid: 'req-email' },
                    { label: 'Phone Number (Optional)', key: 'phone', type: 'tel', testid: '' },
                  ].map(({ label, key, type, testid }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
                      <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                        className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#7C4DFF]/50"
                        data-testid={testid || undefined} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#E040FB] mb-4">Beat Requirements</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Genre *</label>
                    <div className="flex flex-wrap gap-2">
                      {genres.map(g => (
                        <button type="button" key={g} onClick={() => setSelectedGenre(g)}
                          className={`px-3 py-2 rounded-full text-xs font-medium border transition-all ${selectedGenre === g ? 'bg-[#7C4DFF] border-[#7C4DFF] text-white' : 'bg-[#111] border-[#333] text-gray-400'}`}
                          data-testid={`genre-${g.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Mood/Vibe</label>
                    <div className="flex flex-wrap gap-2">
                      {moods.map(m => (
                        <button type="button" key={m} onClick={() => setSelectedMood(m)}
                          className={`px-3 py-2 rounded-full text-xs font-medium border transition-all ${selectedMood === m ? 'bg-[#E040FB] border-[#E040FB] text-white' : 'bg-[#111] border-[#333] text-gray-400'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Tempo Range (BPM)</label>
                    <input type="text" value={form.tempo_range} onChange={e => setForm({ ...form, tempo_range: e.target.value })} placeholder="e.g., 120-140"
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#7C4DFF]/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Reference Tracks</label>
                    <textarea value={form.reference_tracks} onChange={e => setForm({ ...form, reference_tracks: e.target.value })} placeholder="Share links or names of tracks with a similar vibe" rows={3}
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#7C4DFF]/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Budget Range</label>
                    <input type="text" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="e.g., $100-$300"
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#7C4DFF]/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Additional Notes</label>
                    <textarea value={form.additional_notes} onChange={e => setForm({ ...form, additional_notes: e.target.value })} placeholder="Any specific requirements..." rows={3}
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#7C4DFF]/50" />
                  </div>
                </div>
              </div>
              <button type="submit"
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white font-bold tracking-[2px] flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                data-testid="submit-beat-request">
                <PaperPlaneTilt className="w-5 h-5" /> SUBMIT REQUEST
              </button>
            </form>
          )}
        </div>

        <GlobalFooter />

        {/* ══════════════════════════════════════════
            STICKY BOTTOM PLAYER BAR
        ══════════════════════════════════════════ */}
        {currentBeat && (
          <div className="fixed bottom-0 left-0 right-0 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {/* Gradient fade above player */}
            <div className="h-6 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
            <div className="bg-gradient-to-b from-[#131214] to-[#0a0a0a] border-t border-white/10 shadow-2xl"
              style={{ boxShadow: '0 -8px 40px rgba(124,77,255,0.2)' }}>

              <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5">
                {/* Row 1 — cover, title, controls, buy, close */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Cover art */}
                  <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 overflow-hidden ${isPlaying ? 'ring-2 ring-[#7C4DFF]/50' : ''}`}
                    style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
                    {currentBeat.cover_url
                      ? <img src={currentBeat.cover_url} alt="" className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`} />
                      : <div className="w-full h-full flex items-center justify-center">
                          <MusicNote className="w-6 h-6 text-white/20" weight="fill" />
                        </div>
                    }
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-[14px] font-bold text-white truncate leading-tight">{currentBeat.title}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{currentBeat.producer_name || 'Kalmori'} · {currentBeat.bpm} BPM · {currentBeat.key}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                    <button onClick={() => skipBeat(-1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white active:scale-95 transition-all">
                      <SkipBack className="w-4 h-4" weight="fill" />
                    </button>
                    <button onClick={() => toggleBeat(currentBeat)}
                      className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-lg"
                      style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)', boxShadow: '0 4px 20px rgba(124,77,255,0.5)' }}
                      data-testid="player-toggle-btn">
                      {isPlaying
                        ? <Pause className="w-5 h-5 text-white" weight="fill" />
                        : <Play className="w-5 h-5 text-white ml-0.5" weight="fill" />
                      }
                    </button>
                    <button onClick={() => skipBeat(1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white active:scale-95 transition-all">
                      <SkipForward className="w-4 h-4" weight="fill" />
                    </button>
                  </div>

                  {/* Buy + Close */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openPurchaseModal(currentBeat)}
                      className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
                      style={{ background: 'linear-gradient(90deg,#7C4DFF,#E040FB)', boxShadow: '0 2px 12px rgba(124,77,255,0.4)' }}>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Buy
                    </button>
                    <button
                      onClick={() => openPurchaseModal(currentBeat)}
                      className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={closePlayer}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                      data-testid="player-close-btn"
                      aria-label="Close player">
                      <X className="w-4 h-4" weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Row 2 — waveform + timestamps */}
                <div className="flex items-center gap-2.5 sm:gap-3 mt-2.5">
                  <span className="text-[10px] sm:text-[11px] text-gray-500 font-mono tabular-nums flex-shrink-0 w-10 text-center">
                    {formatTime(progress)}
                  </span>
                  <div className="flex-1 min-w-0" data-wave-pulse={wavePulse}>
                    <Waveform
                      seed={currentBeat.id}
                      progressPct={progressPct}
                      isPlaying={isPlaying}
                      onSeek={seekTo}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-gray-500 font-mono tabular-nums flex-shrink-0 w-10 text-center">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PURCHASE MODAL ── */}
        {selectedBeat && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedBeat(null)}>
            <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="purchase-modal">
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5 sm:hidden" />

              <div className="flex items-center justify-center gap-2 mb-5">
                {[1, 2, 3].map(n => (
                  <React.Fragment key={n}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      (n === 1 && purchaseStep === 'license') ? 'text-white' :
                      (n === 2 && purchaseStep === 'contract') ? 'text-white' :
                      'bg-[#333] text-gray-500'
                    }`}
                    style={(n === 1 && purchaseStep === 'license') ? { background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }
                      : (n === 2 && purchaseStep === 'contract') ? { background: 'linear-gradient(135deg,#E040FB,#FF4081)' } : {}}>
                      {n}
                    </div>
                    {n < 3 && <div className="w-8 h-0.5 bg-[#333]" />}
                  </React.Fragment>
                ))}
              </div>

              <h3 className="text-lg font-extrabold text-white mb-1">{selectedBeat.title}</h3>
              <p className="text-sm text-gray-400 mb-5">{selectedBeat.genre} · {selectedBeat.bpm} BPM · {selectedBeat.key}</p>

              {purchaseStep === 'license' && (
                <>
                  <p className="text-xs font-bold text-[#E040FB] tracking-[2px] mb-3">SELECT LICENSE</p>
                  <div className="space-y-2.5 mb-5">
                    {licenseTiers.map(tier => (
                      <button key={tier.id} onClick={() => setSelectedLicense(tier.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedLicense === tier.id ? 'bg-white/5' : ''}`}
                        style={{ borderColor: tier.color, borderOpacity: selectedLicense === tier.id ? 1 : 0.3 }}
                        data-testid={`modal-tier-${tier.id}`}>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{tier.name}</p>
                          <p className="text-xs text-gray-500">{tier.desc}</p>
                        </div>
                        <span className="text-lg font-extrabold" style={{ color: tier.color }}>
                          ${selectedBeat.prices?.[tier.id] || tier.price}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { if (!user) { navigate('/login'); return; } setPurchaseStep('contract'); }}
                    disabled={!selectedLicense}
                    className="w-full py-4 rounded-full text-white font-bold tracking-[2px] hover:brightness-110 transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg, #7C4DFF, #E040FB)' }}
                    data-testid="proceed-to-contract-btn">
                    REVIEW CONTRACT
                  </button>
                </>
              )}

              {purchaseStep === 'contract' && (() => {
                const terms = licenseTermsMap[selectedLicense] || {};
                const price = selectedBeat.prices?.[selectedLicense] || licenseTiers.find(t => t.id === selectedLicense)?.price || 0;
                return (
                  <>
                    <p className="text-xs font-bold text-[#E040FB] tracking-[2px] mb-3">LICENSE AGREEMENT</p>
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold tracking-wider">ORDER SUMMARY</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{selectedBeat.title}</span>
                        <span className="text-sm font-bold text-white">${price}</span>
                      </div>
                      <p className="text-xs text-[#7C4DFF] font-medium">{terms.name}</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-3 font-semibold tracking-wider">LICENSE TERMS</p>
                      <div className="space-y-2">
                        {[['Rights', terms.rights], ['Files', terms.files], ['Streams', terms.streams], ['Sales', terms.sales], ['Music Video', terms.video], ['Credit', terms.credit], ['Ownership', terms.ownership], ['Duration', terms.duration]].map(([label, val]) => (
                          <div key={label} className="flex justify-between text-xs">
                            <span className="text-gray-500">{label}</span>
                            <span className="text-gray-300 text-right max-w-[60%]">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold tracking-wider">BINDING TERMS</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        By signing below, you agree to the terms of this license for "{selectedBeat.title}".
                        {selectedLicense === 'exclusive' ? ' Upon payment, full ownership transfers to you and the beat will be removed from the catalog.' : ' The producer retains ownership and may continue licensing this beat to others.'}
                        {' '}This contract is legally binding upon digital signature and payment.
                      </p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-3 font-semibold tracking-wider">DIGITAL SIGNATURE</p>
                      <label className="block text-xs text-gray-400 mb-1.5">Full Legal Name *</label>
                      <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)}
                        placeholder="Type your full name to sign"
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7C4DFF] placeholder-gray-600 mb-3"
                        data-testid="signer-name-input" />
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-[#333] bg-[#111] accent-[#7C4DFF]"
                          data-testid="agree-terms-checkbox" />
                        <span className="text-xs text-gray-400 leading-relaxed">
                          I have read and agree to the license terms above. I understand this is a legally binding agreement.
                        </span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setPurchaseStep('license')}
                        className="flex-1 py-4 rounded-full border border-[#333] text-gray-400 font-bold text-sm hover:border-white hover:text-white transition-all"
                        data-testid="back-to-license-btn">
                        BACK
                      </button>
                      <button onClick={() => handleBuyBeat(selectedBeat, selectedLicense)}
                        disabled={!signerName.trim() || !agreedToTerms || signingContract}
                        className="flex-[2] py-4 rounded-full text-white font-bold tracking-[2px] flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(90deg, #7C4DFF, #E040FB)' }}
                        data-testid="confirm-purchase-btn">
                        {signingContract
                          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <><ShoppingCart className="w-5 h-5" /> SIGN & PAY — ${price}</>}
                      </button>
                    </div>
                  </>
                );
              })()}

              <button onClick={() => setSelectedBeat(null)} className="w-full py-3 text-gray-400 text-sm mt-2 hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
