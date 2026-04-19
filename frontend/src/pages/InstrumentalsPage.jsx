import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import GlobalFooter from '../components/GlobalFooter';
import { useAuth } from '../App';
import {
  MusicNote, Lightning, ShieldCheck, Headset, Check, Star,
  Play, Pause, SpeakerHigh, ShoppingCart,
  MagnifyingGlass, Sliders, X, ShareNetwork, SkipBack, SkipForward,
  DotsThreeVertical, Copy, Heart, DownloadSimple, Flag, Sparkle, Gift, Crown
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
const Waveform = ({ seed, progressPct, isPlaying, onSeek, bars = 48, barColor = '#7C4DFF', dimColor = '#3a2a5c', heightClass = 'h-10' }) => {
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
      className={`relative w-full ${heightClass} flex items-center gap-[2px] cursor-pointer select-none`}
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
  const [quickFilter, setQuickFilter] = useState('all'); // all | new | free | exclusive

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

  const currentBeat = beats.find(b => b.id === currentBeatId) || null;
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  // Quick-filter derived list
  const visibleBeats = beats.filter(b => {
    if (quickFilter === 'free') return Number(b.prices?.basic_lease || 0) === 0;
    if (quickFilter === 'exclusive') return !b.exclusive_sold && (b.prices?.exclusive != null);
    if (quickFilter === 'new') {
      if (!b.created_at) return true;
      const age = Date.now() - new Date(b.created_at).getTime();
      return age < 1000 * 60 * 60 * 24 * 30; // last 30 days
    }
    return true;
  });

  const quickFilterPills = [
    { id: 'all', label: 'All Beats', icon: MusicNote, color: '#7C4DFF' },
    { id: 'new', label: 'New', icon: Sparkle, color: '#7C4DFF' },
    { id: 'free', label: 'Free', icon: Gift, color: '#E040FB' },
    { id: 'exclusive', label: 'Exclusive', icon: Crown, color: '#FFD700' },
  ];

  const isFreeBeat = (b) => Number(b?.prices?.basic_lease || 0) === 0;
  const isExclusiveAvailable = (b) => !b?.exclusive_sold && b?.prices?.exclusive != null;
  const isNewBeat = (b) => {
    if (!b?.created_at) return false;
    return (Date.now() - new Date(b.created_at).getTime()) < 1000 * 60 * 60 * 24 * 14; // 14 days for badge
  };
  const beatTags = (b) => {
    const raw = [b?.genre, b?.mood, ...(Array.isArray(b?.tags) ? b.tags : [])]
      .filter(Boolean).map(s => String(s).trim()).filter(Boolean);
    return Array.from(new Set(raw)).slice(0, 3);
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto bg-[#0a0a0a]" data-testid="instrumentals-page"
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
          <p className="text-xs text-gray-600 mb-4">{visibleBeats.length} beat{visibleBeats.length !== 1 ? 's' : ''} available</p>

          {/* Featured beat hero — picks most-played, or first if tied */}
          {!loadingBeats && visibleBeats.length > 0 && quickFilter === 'all' && (() => {
            const featured = [...visibleBeats].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0];
            if (!featured) return null;
            const isFeaturedPlaying = currentBeatId === featured.id && isPlaying;
            return (
              <div className="relative mb-5 rounded-3xl overflow-hidden border border-white/[0.08]"
                style={{ background: 'linear-gradient(135deg,#1a0f2e 0%,#0d0820 60%,#000 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle,#7C4DFF,transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-25 blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle,#E040FB,transparent 70%)' }} />
                <div className="relative flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 p-4 sm:p-6">
                  {/* Cover */}
                  <button onClick={() => toggleBeat(featured)}
                    className="relative w-full sm:w-48 md:w-56 aspect-square rounded-2xl overflow-hidden flex-shrink-0 group"
                    style={{ background: featured.cover_url ? undefined : 'linear-gradient(135deg,#1a1a2e,#16213e)' }}
                    aria-label={isFeaturedPlaying ? 'Pause' : 'Play'}>
                    {featured.cover_url
                      ? <img src={featured.cover_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center"><MusicNote className="w-14 h-14 text-white/20" weight="fill" /></div>
                    }
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isFeaturedPlaying ? 'bg-black/40 opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>
                        {isFeaturedPlaying
                          ? <Pause className="w-7 h-7 text-white" weight="fill" />
                          : <Play className="w-7 h-7 text-white ml-0.5" weight="fill" />
                        }
                      </div>
                    </div>
                  </button>
                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black tracking-[2px] text-white"
                          style={{ background: 'linear-gradient(135deg,#FFD700,#E040FB)' }}>★ FEATURED</span>
                        {isNewBeat(featured) && (
                          <span className="px-2 py-1 rounded-full text-[9px] font-black tracking-wider text-white"
                            style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>NEW</span>
                        )}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white truncate">{featured.title}</h3>
                      <p className="text-sm text-gray-400 mt-1 truncate">
                        by {featured.producer_name || 'Kalmori'}
                        {typeof featured.plays === 'number' && featured.plays > 0 && (
                          <span className="ml-2 text-gray-500">· {featured.plays >= 1000 ? `${(featured.plays / 1000).toFixed(1)}k` : featured.plays} plays</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-[11px] font-mono text-gray-300 bg-white/5 px-2 py-1 rounded">{featured.bpm} BPM</span>
                        <span className="text-[11px] text-gray-300 bg-white/5 px-2 py-1 rounded">{featured.key}</span>
                        {beatTags(featured).slice(0, 3).map((t, i) => (
                          <span key={i} className="px-2 py-1 rounded text-[10px] font-semibold text-[#7C4DFF] bg-[#7C4DFF]/10 border border-[#7C4DFF]/20">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 flex-wrap">
                      <button onClick={() => openPurchaseModal(featured)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold transition-all active:scale-95 shadow-lg hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>
                        <ShoppingCart className="w-4 h-4" weight="fill" />
                        Buy from ${Number(featured.prices?.basic_lease || 29.99) % 1 === 0 ? Number(featured.prices?.basic_lease || 29.99).toFixed(0) : Number(featured.prices?.basic_lease || 29.99).toFixed(2)}
                      </button>
                      <button onClick={() => toggleBeat(featured)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                        {isFeaturedPlaying ? <Pause className="w-4 h-4" weight="fill" /> : <Play className="w-4 h-4" weight="fill" />}
                        {isFeaturedPlaying ? 'Pause preview' : 'Play preview'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick filter pills row */}
          <div className="flex items-center gap-3 mb-3 md:justify-between">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pr-8 md:mx-0 md:px-0 md:pr-0 md:flex-wrap flex-1 md:flex-initial">
              {quickFilterPills.map(p => {
                const active = quickFilter === p.id;
                const Icon = p.icon;
                return (
                  <button key={p.id}
                    onClick={() => setQuickFilter(p.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${active ? 'text-white shadow-lg' : 'text-gray-400 bg-[#111] border border-[#222] hover:text-white hover:border-white/20'}`}
                    style={active ? { background: `linear-gradient(135deg, ${p.color}, #E040FB)`, boxShadow: `0 4px 16px ${p.color}40` } : undefined}
                    data-testid={`quick-filter-${p.id}`}>
                    <Icon className="w-3.5 h-3.5" weight={active ? 'fill' : 'regular'} />
                    {p.label}
                  </button>
                );
              })}
            </div>
            {/* Sort — desktop only on this row (mobile has its own below) */}
            <div className="relative flex-shrink-0 hidden md:block">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-[#111] border border-[#222] hover:border-white/20 rounded-full pl-3 pr-8 h-[38px] text-[12px] font-semibold text-gray-300 cursor-pointer focus:outline-none focus:border-[#7C4DFF]/60 transition-colors"
                data-testid="inline-sort">
                <option value="newest">Newest</option>
                <option value="plays">Most Played</option>
                <option value="price_low">Price ↑</option>
                <option value="price_high">Price ↓</option>
                <option value="bpm_low">BPM ↑</option>
                <option value="bpm_high">BPM ↓</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Mobile sort — compact pill below filters */}
          <div className="flex md:hidden items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Sort</span>
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="appearance-none min-w-[126px] h-9 rounded-full border border-white/10 bg-white/[0.04] pl-3.5 pr-9 text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] cursor-pointer focus:outline-none focus:border-[#7C4DFF]/60"
                data-testid="inline-sort-mobile">
                <option value="newest">Newest</option>
                <option value="plays">Most Played</option>
                <option value="price_low">Price ↑</option>
                <option value="price_high">Price ↓</option>
                <option value="bpm_low">BPM ↑</option>
                <option value="bpm_high">BPM ↓</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

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
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-white/[0.04] last:border-b-0">
                  {/* Mobile skeleton */}
                  <div className="flex md:hidden items-center gap-3 px-3 py-2.5">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] animate-pulse" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-2.5 w-1/2 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                    <div className="w-20 h-9 rounded-xl bg-white/[0.06] animate-pulse" />
                  </div>
                  {/* Desktop skeleton */}
                  <div className="hidden md:grid grid-cols-[64px_minmax(180px,1.1fr)_minmax(160px,1.4fr)_60px_60px_170px_130px_40px] items-center gap-4 px-5 py-3.5">
                    <div className="w-14 h-14 rounded-xl bg-white/[0.06] animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-3 w-1/2 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-2.5 w-1/3 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                    <div className="h-6 w-full rounded bg-white/[0.04] animate-pulse" />
                    <div className="h-3 w-10 mx-auto rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-3 w-8 mx-auto rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-5 w-20 mx-auto rounded-full bg-white/[0.06] animate-pulse" />
                    <div className="h-9 w-28 mx-auto rounded-xl bg-white/[0.06] animate-pulse" />
                    <div className="h-5 w-5 mx-auto rounded bg-white/[0.04] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleBeats.length === 0 ? (
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
              <div className="hidden md:grid grid-cols-[64px_minmax(180px,1.1fr)_minmax(160px,1.4fr)_60px_60px_170px_130px_40px] items-center gap-4 px-5 py-3 bg-[#0a0a0a] border-b border-white/10 text-[10px] uppercase tracking-[2px] text-gray-500 font-semibold">
                <span />
                <span>Track</span>
                <span className="text-center">Preview</span>
                <span className="text-center">BPM</span>
                <span className="text-center">Key</span>
                <span className="text-center">Tags</span>
                <span className="text-center">Price</span>
                <span />
              </div>

              {visibleBeats.map((beat, idx) => {
                const isCurrent = currentBeatId === beat.id;
                const isThisPlaying = isCurrent && isPlaying;
                const isFav = favorites.has(beat.id);
                return (
                  <div
                    key={beat.id}
                    className={`relative transition-all border-b border-white/[0.04] last:border-b-0 group ${isCurrent ? 'bg-gradient-to-r from-[#7C4DFF]/15 via-[#7C4DFF]/5 to-transparent' : 'bg-[#111] hover:bg-[#181820] active:bg-[#181818]'}`}
                    data-testid={`beat-${beat.id}`}>

                    {/* Active left bar */}
                    {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'linear-gradient(180deg,#7C4DFF,#E040FB)' }} />}

                    {/* Mobile layout — priority: title > price > badges > tags */}
                    <div className="flex md:hidden items-center gap-2.5 px-3 py-2.5">
                      <button onClick={() => toggleBeat(beat)}
                        className={`relative w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden group transition-all ${isCurrent ? 'ring-2 ring-[#7C4DFF]/60 shadow-[0_0_12px_rgba(124,77,255,0.4)]' : ''}`}
                        style={{ background: beat.cover_url ? undefined : 'linear-gradient(135deg,#1a1a2e,#16213e)' }}
                        data-testid={`play-beat-${beat.id}`}
                        aria-label={isThisPlaying ? 'Pause' : 'Play'}>
                        {beat.cover_url
                          ? <img src={beat.cover_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><MusicNote className="w-5 h-5 text-white/20" weight="fill" /></div>
                        }
                        <div className={`absolute inset-0 flex items-center justify-center rounded-xl transition-opacity ${isThisPlaying ? 'bg-black/55 opacity-100' : 'bg-black/60 opacity-0 group-hover:opacity-100 group-active:opacity-100'}`}>
                          {isThisPlaying ? (
                            <div className="flex items-end justify-center gap-[2px] h-4">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="w-[3px] rounded-full animate-pulse"
                                  style={{ height: `${6 + (i % 2) * 5}px`, background: 'linear-gradient(180deg,#fff,#E040FB)', animationDelay: `${i * 0.12}s` }} />
                              ))}
                            </div>
                          ) : (
                            <Play className="w-4 h-4 text-white drop-shadow ml-0.5" weight="fill" />
                          )}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleBeat(beat)}>
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[13px] font-semibold truncate leading-tight ${isCurrent ? 'text-white' : 'text-gray-100'}`}>{beat.title}</p>
                          {/* Single-priority inline badge: FREE > EXCL > NEW */}
                          {isFreeBeat(beat) ? (
                            <span className="flex-shrink-0 px-1.5 py-px rounded text-[8px] font-black tracking-wider text-white"
                              style={{ background: 'linear-gradient(135deg,#E040FB,#7C4DFF)' }}>FREE</span>
                          ) : isExclusiveAvailable(beat) ? (
                            <span className="flex-shrink-0 px-1.5 py-px rounded text-[8px] font-black tracking-wider text-black"
                              style={{ background: '#FFD700' }}>EXCL</span>
                          ) : isNewBeat(beat) ? (
                            <span className="flex-shrink-0 px-1.5 py-px rounded text-[8px] font-black tracking-wider text-white"
                              style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>NEW</span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {beat.producer_name || 'Kalmori'} · {beat.bpm} BPM · {beat.key}
                        </p>
                      </div>
                      {/* Price chip — icon + price, compact */}
                      <button onClick={() => openPurchaseModal(beat)}
                        className="flex items-center gap-1 pl-2 pr-2.5 h-9 rounded-full text-white text-[11px] font-bold flex-shrink-0 transition-all active:scale-95 shadow-md"
                        style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}
                        aria-label={`Buy for $${beat.prices?.basic_lease || '29.99'}`}
                        data-testid={`buy-beat-${beat.id}`}>
                        <ShoppingCart className="w-3.5 h-3.5" weight="fill" />
                        <span className="tabular-nums">${Number(beat.prices?.basic_lease || 29.99) % 1 === 0 ? Number(beat.prices?.basic_lease || 29.99).toFixed(0) : Number(beat.prices?.basic_lease || 29.99).toFixed(2)}</span>
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
                    <div className="hidden md:grid grid-cols-[64px_minmax(180px,1.1fr)_minmax(160px,1.4fr)_60px_60px_170px_130px_40px] items-center gap-4 px-5 py-3.5">
                      {/* Cover */}
                      <button onClick={() => toggleBeat(beat)}
                        className={`relative w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden transition-all duration-300 group-hover:scale-[1.06] group-hover:shadow-[0_0_20px_rgba(124,77,255,0.3)] ${isCurrent ? 'ring-2 ring-[#7C4DFF]/60 shadow-[0_0_16px_rgba(124,77,255,0.4)]' : ''}`}
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
                        {isFreeBeat(beat) ? (
                          <span className="absolute top-1 left-1 px-1.5 py-px rounded text-[9px] font-black tracking-wider text-white shadow"
                            style={{ background: 'linear-gradient(135deg,#E040FB,#7C4DFF)' }}>FREE</span>
                        ) : isExclusiveAvailable(beat) ? (
                          <span className="absolute top-1 left-1 px-1.5 py-px rounded text-[9px] font-black tracking-wider text-black shadow"
                            style={{ background: '#FFD700' }}>EXCL</span>
                        ) : null}
                      </button>
                      {/* Title + producer */}
                      <div className="min-w-0 cursor-pointer" onClick={() => toggleBeat(beat)}>
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[14px] font-semibold truncate leading-tight ${isCurrent ? 'text-white' : 'text-gray-100'}`}>{beat.title}</p>
                          {/* NEW only shows if no cover badge is occupying attention */}
                          {isNewBeat(beat) && !isFreeBeat(beat) && !isExclusiveAvailable(beat) && (
                            <span className="flex-shrink-0 px-1.5 py-px rounded text-[9px] font-black tracking-wider text-white"
                              style={{ background: 'linear-gradient(135deg,#7C4DFF,#E040FB)' }}>NEW</span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500 truncate mt-0.5">
                          {beat.producer_name || 'Kalmori'}
                          {typeof beat.plays === 'number' && beat.plays > 0 && (
                            <span className="ml-1.5 text-gray-600">· {beat.plays >= 1000 ? `${(beat.plays / 1000).toFixed(1)}k` : beat.plays} plays</span>
                          )}
                        </p>
                      </div>
                      {/* Waveform preview */}
                      <div className="px-1">
                        <Waveform
                          seed={beat.id || beat.title || 'beat'}
                          progressPct={isCurrent ? progressPct : 0}
                          isPlaying={isThisPlaying}
                          bars={36}
                          heightClass="h-7"
                          onSeek={(pct) => { if (isCurrent) seekTo(pct); else toggleBeat(beat); }}
                        />
                      </div>
                      {/* BPM */}
                      <span className="text-center text-[13px] text-gray-300 font-mono tabular-nums">{beat.bpm}</span>
                      {/* Key */}
                      <span className="text-center text-[13px] text-gray-300">{beat.key}</span>
                      {/* Tags — colored pills */}
                      <div className="flex items-center justify-center gap-1 overflow-hidden">
                        {beatTags(beat).length === 0 ? (
                          <span className="text-[11px] text-gray-600">—</span>
                        ) : (
                          beatTags(beat).slice(0, 2).map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#7C4DFF] bg-[#7C4DFF]/10 border border-[#7C4DFF]/20 whitespace-nowrap">{t}</span>
                          ))
                        )}
                      </div>
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
                className={`w-full bg-[#1a1a1a] rounded-2xl p-6 text-left border relative overflow-hidden transition-all ${
                  selectedLicense === tier.id
                    ? 'border-white/20 bg-white/[0.03] shadow-[0_14px_40px_rgba(0,0,0,0.28)]'
                    : 'border-white/8 hover:border-white/14'
                }`}
                style={selectedLicense === tier.id ? { boxShadow: `0 0 0 1px ${tier.color}30, 0 14px 40px rgba(0,0,0,0.28)` } : undefined}
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

              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
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
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          selectedLicense === tier.id
                            ? 'bg-white/5 border-white/20'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        style={selectedLicense === tier.id ? { boxShadow: `0 0 0 1px ${tier.color}30` } : undefined}
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
