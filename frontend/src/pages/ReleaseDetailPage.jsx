import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import {
  Disc,
  UploadSimple,
  Play,
  Pause,
  Trash,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  CurrencyDollar,
  MusicNotes,
  SpotifyLogo,
  AppleLogo,
  YoutubeLogo,
  PencilSimple,
  FloppyDisk,
  X
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Japanese',
  'Korean', 'Chinese', 'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish',
  'Norwegian', 'Danish', 'Finnish', 'Polish', 'Turkish', 'Indonesian',
];

const TrackForm = ({ track, onChange, onSave, onCancel, onGenerateISRC, isNew, saving, trackId }) => {
  const inputCls = "w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF] placeholder-gray-600";
  const labelCls = "text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1";

  return (
    <div className="p-4 bg-[#0A0A0A] border-t border-white/5 space-y-4" data-testid={isNew ? "new-track-form" : `edit-track-form-${trackId}`}>
      {/* Title Section */}
      <div className="space-y-2">
        <p className={labelCls}>TITLE</p>
        <input
          className={inputCls}
          placeholder="Track title *"
          value={track.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          data-testid={isNew ? "new-track-title-input" : `edit-title-${trackId}`}
        />
        <input
          className={inputCls}
          placeholder="Title Version (e.g. Remix, Acoustic)"
          value={track.title_version || ''}
          onChange={(e) => onChange('title_version', e.target.value)}
          data-testid={isNew ? "new-track-version" : `edit-version-${trackId}`}
        />
      </div>

      {/* Audio Upload (new tracks only) */}
      {isNew && (
        <div className="flex items-center gap-3">
          <label className={`flex-1 flex items-center gap-2 ${inputCls} cursor-pointer`}>
            <UploadSimple className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500">Upload audio (WAV, MP3, FLAC)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={track.explicit || false}
              onChange={(e) => onChange('explicit', e.target.checked)}
              className="rounded border-white/20 bg-transparent"
              data-testid="new-track-explicit"
            />
            Explicit
          </label>
        </div>
      )}

      {!isNew && (
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={track.explicit || false}
            onChange={(e) => onChange('explicit', e.target.checked)}
            className="rounded border-white/20 bg-transparent"
            data-testid={`edit-explicit-${trackId}`}
          />
          Explicit
        </label>
      )}

      {/* Information Section */}
      <div className="space-y-2">
        <p className={labelCls}>INFORMATION</p>
        <div className="flex gap-2">
          <input
            className={`flex-1 ${inputCls}`}
            placeholder="Audio ISRC *"
            value={track.isrc || ''}
            onChange={(e) => onChange('isrc', e.target.value)}
            data-testid={isNew ? "new-track-isrc" : `edit-isrc-${trackId}`}
          />
          <button
            type="button"
            onClick={() => onGenerateISRC('isrc')}
            className="px-3 py-2 bg-[#7C4DFF]/20 text-[#7C4DFF] text-xs font-bold rounded-lg hover:bg-[#7C4DFF]/30 whitespace-nowrap"
            data-testid={isNew ? "new-generate-isrc" : `edit-generate-isrc-${trackId}`}
          >
            Generate ISRC
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className={`flex-1 ${inputCls}`}
            placeholder="Dolby Atmos ISRC"
            value={track.dolby_atmos_isrc || ''}
            onChange={(e) => onChange('dolby_atmos_isrc', e.target.value)}
            data-testid={isNew ? "new-track-dolby-isrc" : `edit-dolby-isrc-${trackId}`}
          />
          <button
            type="button"
            onClick={() => onGenerateISRC('dolby_atmos_isrc')}
            className="px-3 py-2 bg-[#7C4DFF]/20 text-[#7C4DFF] text-xs font-bold rounded-lg hover:bg-[#7C4DFF]/30 whitespace-nowrap"
          >
            Generate ISRC
          </button>
        </div>
        <input
          className={inputCls}
          placeholder="ISWC"
          value={track.iswc || ''}
          onChange={(e) => onChange('iswc', e.target.value)}
          data-testid={isNew ? "new-track-iswc" : `edit-iswc-${trackId}`}
        />
        <select
          className={inputCls}
          value={track.audio_language || 'English'}
          onChange={(e) => onChange('audio_language', e.target.value)}
          data-testid={isNew ? "new-track-language" : `edit-language-${trackId}`}
        >
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang} className="bg-black text-white">{lang}</option>
          ))}
        </select>
        <input
          className={inputCls}
          placeholder="Production"
          value={track.production || ''}
          onChange={(e) => onChange('production', e.target.value)}
          data-testid={isNew ? "new-track-production" : `edit-production-${trackId}`}
        />
        <input
          className={inputCls}
          placeholder="Publisher"
          value={track.publisher || ''}
          onChange={(e) => onChange('publisher', e.target.value)}
          data-testid={isNew ? "new-track-publisher" : `edit-publisher-${trackId}`}
        />
      </div>

      {/* Preview Times */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={labelCls}>Preview Start Time *</p>
          <input
            className={inputCls}
            placeholder="00:30"
            value={track.preview_start || '00:30'}
            onChange={(e) => onChange('preview_start', e.target.value)}
            data-testid={isNew ? "new-track-preview-start" : `edit-preview-start-${trackId}`}
          />
        </div>
        <div>
          <p className={labelCls}>Preview End Time</p>
          <input
            className={inputCls}
            placeholder="00:00"
            value={track.preview_end || '00:00'}
            onChange={(e) => onChange('preview_end', e.target.value)}
            data-testid={isNew ? "new-track-preview-end" : `edit-preview-end-${trackId}`}
          />
        </div>
      </div>

      {/* Artists */}
      <div className="space-y-2">
        <p className={labelCls}>ARTISTS *</p>
        <input
          className={inputCls}
          placeholder="Enter the name of the main artist"
          value={track.main_artist || ''}
          onChange={(e) => onChange('main_artist', e.target.value)}
          data-testid={isNew ? "new-track-artist" : `edit-artist-${trackId}`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
          data-testid={isNew ? "cancel-new-track" : `cancel-edit-${trackId}`}
        >
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
          data-testid={isNew ? "save-track-btn" : `save-edit-${trackId}`}
        >
          <FloppyDisk className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

const ReleaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [distributing, setDistributing] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeRegion, setStoreRegion] = useState('All');
  const [newTrack, setNewTrack] = useState({
    title: '', title_version: '', track_number: 1, explicit: false,
    isrc: '', dolby_atmos_isrc: '', iswc: '', audio_language: 'English',
    production: '', publisher: '', preview_start: '00:30', preview_end: '00:00',
    main_artist: ''
  });
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingTrack, setSavingTrack] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [audioRef] = useState(new Audio());

  const fetchRelease = useCallback(async () => {
    try {
      const [releaseRes, storesRes] = await Promise.all([
        axios.get(`${API}/releases/${id}`),
        axios.get(`${API}/distributions/stores`)
      ]);
      setRelease(releaseRes.data);
      setStores(storesRes.data);
      setSelectedStores(storesRes.data.map(s => s.store_id));
    } catch (error) {
      toast.error('Failed to load release');
      navigate('/releases');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchRelease();
    
    // Check for payment status from URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      pollPaymentStatus(sessionId);
    }
    
    return () => {
      audioRef.pause();
    };
  }, [fetchRelease, audioRef]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      toast.info('Payment status check timed out. Please refresh.');
      return;
    }
    
    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      if (response.data.payment_status === 'paid') {
        toast.success('Payment successful!');
        fetchRelease();
        // Clean URL
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setUploadingCover(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`${API}/releases/${id}/cover`, formData);
      toast.success('Cover art uploaded!');
      fetchRelease();
    } catch (error) {
      toast.error('Failed to upload cover art');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAddTrack = async () => {
    if (!newTrack.title) {
      toast.error('Please enter a track title');
      return;
    }
    
    try {
      await axios.post(`${API}/tracks`, {
        release_id: id,
        title: newTrack.title,
        title_version: newTrack.title_version,
        track_number: release.tracks?.length + 1 || 1,
        explicit: newTrack.explicit,
        isrc: newTrack.isrc,
        dolby_atmos_isrc: newTrack.dolby_atmos_isrc,
        iswc: newTrack.iswc,
        audio_language: newTrack.audio_language,
        production: newTrack.production,
        publisher: newTrack.publisher,
        preview_start: newTrack.preview_start,
        preview_end: newTrack.preview_end,
        main_artist: newTrack.main_artist,
      });
      toast.success('Track added!');
      setNewTrack({
        title: '', title_version: '', track_number: 1, explicit: false,
        isrc: '', dolby_atmos_isrc: '', iswc: '', audio_language: 'English',
        production: '', publisher: '', preview_start: '00:30', preview_end: '00:00',
        main_artist: ''
      });
      setShowAddTrack(false);
      fetchRelease();
    } catch (error) {
      toast.error('Failed to add track');
    }
  };

  const generateISRC = () => {
    return 'US' + 'KAL' + new Date().getFullYear().toString().slice(-2) + Math.floor(10000 + Math.random() * 90000);
  };

  const startEditTrack = (track) => {
    setEditingTrack(track.id);
    setEditForm({
      title: track.title || '',
      title_version: track.title_version || '',
      explicit: track.explicit || false,
      isrc: track.isrc || '',
      dolby_atmos_isrc: track.dolby_atmos_isrc || '',
      iswc: track.iswc || '',
      audio_language: track.audio_language || 'English',
      production: track.production || '',
      publisher: track.publisher || '',
      preview_start: track.preview_start || '00:30',
      preview_end: track.preview_end || '00:00',
      main_artist: track.main_artist || '',
    });
  };

  const handleUpdateTrack = async (trackId) => {
    setSavingTrack(trackId);
    try {
      await axios.put(`${API}/tracks/${trackId}`, editForm);
      toast.success('Track updated!');
      setEditingTrack(null);
      fetchRelease();
    } catch (error) {
      toast.error('Failed to update track');
    }
    setSavingTrack(null);
  };

  const handleAudioUpload = async (trackId, file) => {
    if (!file) return;
    
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav', 'audio/flac'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload WAV, MP3, or FLAC');
      return;
    }
    
    setUploadingAudio(trackId);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`${API}/tracks/${trackId}/audio`, formData);
      toast.success('Audio uploaded!');
      fetchRelease();
    } catch (error) {
      toast.error('Failed to upload audio');
    } finally {
      setUploadingAudio(null);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!window.confirm('Are you sure you want to delete this track?')) return;
    
    try {
      await axios.delete(`${API}/tracks/${trackId}`);
      toast.success('Track deleted');
      fetchRelease();
    } catch (error) {
      toast.error('Failed to delete track');
    }
  };

  const togglePlay = (track) => {
    if (playingTrack === track.id) {
      audioRef.pause();
      setPlayingTrack(null);
    } else {
      audioRef.src = `${API}/tracks/${track.id}/stream`;
      audioRef.play();
      setPlayingTrack(track.id);
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await axios.post(`${API}/payments/checkout`, {
        release_id: id,
        origin_url: window.location.origin
      });
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        // Free tier
        toast.success('Free tier activated!');
        fetchRelease();
      }
    } catch (error) {
      toast.error('Failed to initiate checkout');
    }
  };

  const handleDistribute = async () => {
    if (!release.cover_art_url) {
      toast.error('Please upload cover art first');
      return;
    }
    
    const readyTracks = release.tracks?.filter(t => t.audio_url);
    if (!readyTracks?.length) {
      toast.error('Please upload at least one track');
      return;
    }
    
    setDistributing(true);
    try {
      await axios.post(`${API}/distributions/submit/${id}`, selectedStores);
      toast.success('Distribution submitted!');
      fetchRelease();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Distribution failed';
      toast.error(typeof msg === 'string' ? msg : 'Distribution failed');
    } finally {
      setDistributing(false);
    }
  };

  const toggleStore = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(s => s !== storeId)
        : [...prev, storeId]
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!release) return null;

  const STORE_BRAND = {
    spotify:        { text: 'Spotify',       color: '#1DB954' },
    apple_music:    { text: '♪ Apple',       color: '#FC3C44' },
    youtube_music:  { text: '▶ YT Music',    color: '#FF0000' },
    amazon_music:   { text: 'amazon music',  color: '#00A8E1' },
    tidal:          { text: 'TIDAL',         color: '#FFFFFF' },
    deezer:         { text: 'DEEZER',        color: '#FEAA2D' },
    soundcloud:     { text: '☁ SoundCloud',  color: '#FF5500' },
    pandora:        { text: 'PANDORA',       color: '#3668FF' },
    tiktok:         { text: '♪ TikTok',      color: '#00F2EA' },
    instagram:      { text: '📷 Instagram',  color: '#E4405F' },
    shazam:         { text: 'Shazam',        color: '#0088FF' },
    iheartradio:    { text: 'iHeart',        color: '#CC0000' },
    napster:        { text: 'Napster',       color: '#FF0090' },
    audiomack:      { text: 'Audiomack',     color: '#FFA200' },
    tencent:        { text: 'QQ Music',      color: '#FCAD18' },
    boomplay:       { text: 'Boomplay',      color: '#FACD00' },
    mdundo:         { text: 'Mdundo',        color: '#00BCD4' },
    anghami:        { text: 'Anghami',       color: '#7C4DFF' },
    kkbox:          { text: 'KKBOX',         color: '#009E60' },
    joox:           { text: 'JOOX',          color: '#00C853' },
    yandex:         { text: 'Yandex',        color: '#FF0000' },
    vk:             { text: 'VK Music',      color: '#4A76A8' },
    gaana:          { text: 'Gaana',         color: '#E72323' },
    jiosaavn:       { text: 'JioSaavn',      color: '#2BC5B4' },
    wynk:           { text: 'Wynk',          color: '#7B2FF7' },
    hungama:        { text: 'Hungama',       color: '#FF6D00' },
    melon:          { text: 'Melon',         color: '#00C73C' },
    genie:          { text: 'Genie',         color: '#0080FF' },
    bugs:           { text: 'Bugs!',         color: '#FF4444' },
    flo:            { text: 'FLO',           color: '#6C5CE7' },
    netease:        { text: 'NetEase',       color: '#CC0000' },
    kuwo:           { text: 'Kuwo',          color: '#FF6600' },
    kugou:          { text: 'Kugou',         color: '#0099FF' },
  };

  const getStoreIcon = (storeId) => {
    const brand = STORE_BRAND[storeId];
    if (brand) {
      return (
        <span className="text-[10px] font-bold leading-tight text-center" style={{ color: brand.color }}>
          {brand.text}
        </span>
      );
    }
    return <Globe className="w-5 h-5" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8" data-testid="release-detail-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover Art */}
          <div className="w-48 h-48 flex-shrink-0">
            <label className="relative block w-full h-full bg-[#141414] border border-white/10 rounded-md overflow-hidden cursor-pointer group">
              {release.cover_art_url ? (
                <img
                  src={release.cover_art_url}
                  alt={release.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A] group-hover:text-white transition-colors">
                  <UploadSimple className="w-8 h-8 mb-2" />
                  <span className="text-xs">Upload Cover</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={uploadingCover}
                data-testid="cover-upload-input"
              />
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </label>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#FF3B30] font-semibold">
                  {release.release_type}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{release.title}</h1>
                <p className="text-[#A1A1AA] mt-1">{release.artist_name}</p>
              </div>
              {(() => {
                const sCfg = {
                  distributed:    { label: 'Live on Stores', color: '#22C55E' },
                  pending_review: { label: 'Under Review',   color: '#FFD700' },
                  processing:     { label: 'Processing',     color: '#FF9500' },
                  rejected:       { label: 'Rejected',       color: '#EF4444' },
                  draft:          { label: 'Draft',          color: '#A1A1AA' },
                }[release.status] || { label: release.status, color: '#A1A1AA' };
                return (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${sCfg.color}15`, color: sCfg.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sCfg.color }} />
                    {sCfg.label}
                  </span>
                );
              })()}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-xs text-[#71717A] uppercase">UPC</p>
                <p className="font-mono text-sm mt-1">{release.upc}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase">Genre</p>
                <p className="text-sm mt-1">{release.genre}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase">Release Date</p>
                <p className="text-sm mt-1">{release.release_date}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A] uppercase">Tracks</p>
                <p className="text-sm mt-1">{release.track_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div className="bg-[#141414] border border-white/10 rounded-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <MusicNotes className="w-5 h-5 text-[#FF3B30]" />
              Tracks
            </h2>
            <Button
              size="sm"
              onClick={() => setShowAddTrack(!showAddTrack)}
              className="bg-white/10 hover:bg-white/20 text-white"
              data-testid="add-track-btn"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Track
            </Button>
          </div>

          {showAddTrack && (
            <TrackForm
              track={newTrack}
              onChange={(field, val) => setNewTrack(prev => ({ ...prev, [field]: val }))}
              onSave={handleAddTrack}
              onCancel={() => setShowAddTrack(false)}
              onGenerateISRC={(field) => setNewTrack(prev => ({ ...prev, [field]: generateISRC() }))}
              isNew
            />
          )}

          {release.tracks?.length === 0 ? (
            <div className="text-center py-8 text-[#71717A]">
              <Disc className="w-12 h-12 mx-auto mb-3" />
              <p>No tracks yet. Add your first track above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {release.tracks?.map((track, index) => (
                <div key={track.id} className="border border-white/10 rounded-lg overflow-hidden">
                  {/* Track header row */}
                  <div className="flex items-center gap-4 p-3 bg-[#0A0A0A]">
                    <span className="w-6 text-center text-sm text-[#71717A] font-mono">
                      {index + 1}
                    </span>
                    
                    {track.audio_url ? (
                      <button
                        onClick={() => togglePlay(track)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FF3B30] hover:bg-[#FF3B30]/80 transition-colors"
                        data-testid={`play-track-${track.id}`}
                      >
                        {playingTrack === track.id ? (
                          <Pause className="w-4 h-4 text-white" weight="fill" />
                        ) : (
                          <Play className="w-4 h-4 text-white" weight="fill" />
                        )}
                      </button>
                    ) : (
                      <label className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
                        <UploadSimple className="w-4 h-4" />
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleAudioUpload(track.id, e.target.files?.[0])}
                          className="hidden"
                          data-testid={`upload-audio-${track.id}`}
                        />
                      </label>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-xs text-[#71717A] font-mono">{track.isrc}</p>
                    </div>
                    
                    {track.duration > 0 && (
                      <span className="text-sm text-[#71717A] font-mono">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                    
                    <span className={`text-xs px-2 py-1 rounded ${
                      track.status === 'ready' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#FFCC00]/10 text-[#FFCC00]'
                    }`}>
                      {track.status}
                    </span>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editingTrack === track.id ? setEditingTrack(null) : startEditTrack(track)}
                      className={editingTrack === track.id ? 'text-[#7C4DFF]' : 'text-[#71717A] hover:text-[#7C4DFF]'}
                      data-testid={`edit-track-${track.id}`}
                    >
                      <PencilSimple className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTrack(track.id)}
                      className="text-[#71717A] hover:text-[#FF3B30]"
                      data-testid={`delete-track-${track.id}`}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Expanded edit form */}
                  {editingTrack === track.id && (
                    <TrackForm
                      track={editForm}
                      onChange={(field, val) => setEditForm(prev => ({ ...prev, [field]: val }))}
                      onSave={() => handleUpdateTrack(track.id)}
                      onCancel={() => setEditingTrack(null)}
                      onGenerateISRC={(field) => setEditForm(prev => ({ ...prev, [field]: generateISRC() }))}
                      saving={savingTrack === track.id}
                      trackId={track.id}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribution */}
        {release.status !== 'distributed' && (
          <div className="bg-[#141414] border border-white/10 rounded-md p-6">
            <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#007AFF]" />
              Distribution — {stores.length} Platforms
            </h2>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="text" placeholder="Search platforms..." value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="bg-[#0A0A0A] border border-white/10 rounded px-3 py-2 text-sm text-white w-48 focus:outline-none focus:border-[#7C4DFF]"
                data-testid="store-search-input"
              />
              <div className="flex flex-wrap gap-1.5">
                {['All', ...new Set(stores.map(s => s.region).filter(Boolean))].map(r => (
                  <button key={r} onClick={() => setStoreRegion(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      storeRegion === r ? 'bg-[#7C4DFF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                    data-testid={`region-filter-${r.toLowerCase().replace(/\s/g, '-')}`}
                  >{r}</button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">{selectedStores.length}/{stores.length} selected</span>
                <button onClick={() => {
                  const filteredIds = stores
                    .filter(s => (!storeSearch || s.store_name.toLowerCase().includes(storeSearch.toLowerCase())) && (storeRegion === 'All' || s.region === storeRegion))
                    .map(s => s.store_id);
                  const allSelected = filteredIds.every(id => selectedStores.includes(id));
                  if (allSelected) setSelectedStores(prev => prev.filter(id => !filteredIds.includes(id)));
                  else setSelectedStores(prev => [...new Set([...prev, ...filteredIds])]);
                }}
                  className="text-xs text-[#7C4DFF] font-semibold hover:text-[#E040FB] transition-colors"
                  data-testid="select-all-stores-btn"
                >
                  {stores
                    .filter(s => (!storeSearch || s.store_name.toLowerCase().includes(storeSearch.toLowerCase())) && (storeRegion === 'All' || s.region === storeRegion))
                    .every(s => selectedStores.includes(s.store_id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-6 max-h-[400px] overflow-y-auto pr-1">
              {stores
                .filter(s => (!storeSearch || s.store_name.toLowerCase().includes(storeSearch.toLowerCase())) && (storeRegion === 'All' || s.region === storeRegion))
                .map((store) => (
                <button
                  key={store.store_id}
                  onClick={() => toggleStore(store.store_id)}
                  className={`p-3 rounded-md border transition-all ${
                    selectedStores.includes(store.store_id)
                      ? 'border-[#FF3B30] bg-[#FF3B30]/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  data-testid={`store-${store.store_id}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {getStoreIcon(store.store_id)}
                    <span className="text-xs">{store.store_name}</span>
                    {selectedStores.includes(store.store_id) && (
                      <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {release.payment_status !== 'paid' && release.payment_status !== 'free_tier' ? (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* Rise Plan Card */}
                <div className="flex-1 rounded-xl p-4 border border-[#7C4DFF]/40 bg-[#7C4DFF]/8 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7C4DFF,#9C6FFF)' }}>
                      <MusicNotes className="w-5 h-5 text-white" weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Rise Plan</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">Keep 95% of your revenue. Pay per single — no monthly fee required.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#7C4DFF]/20">
                    <span className="text-xs text-[#7C4DFF] font-semibold">$24.99/mo · 5% share</span>
                    <Button
                      onClick={handleCheckout}
                      size="sm"
                      className="text-xs px-3 h-7 text-white border-0"
                      style={{ background: 'linear-gradient(135deg,#7C4DFF,#9C6FFF)' }}
                      data-testid="checkout-btn"
                    >
                      Upgrade to Rise
                    </Button>
                  </div>
                </div>

                {/* Pro Plan Card */}
                <div className="flex-1 rounded-xl p-4 border border-[#E040FB]/40 bg-[#E040FB]/8 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#E040FB,#FF6FFF)' }}>
                      <CurrencyDollar className="w-5 h-5 text-white" weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Pro Plan</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">Keep 100% of your revenue. Unlimited releases, AI features, albums & more.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E040FB]/20">
                    <span className="text-xs text-[#E040FB] font-semibold">$49.99/mo · 0% share</span>
                    <Button
                      onClick={handleCheckout}
                      size="sm"
                      className="text-xs px-3 h-7 text-white border-0"
                      style={{ background: 'linear-gradient(135deg,#E040FB,#FF6FFF)' }}
                      data-testid="checkout-btn-pro"
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleDistribute}
                disabled={distributing || selectedStores.length === 0}
                className="w-full bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white"
                data-testid="distribute-btn"
              >
                {distributing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Distribute to {selectedStores.length} Platforms</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Distribution Status — shown when live */}
        {release.status === 'distributed' && (
          <div className="bg-[#0d0d0d] border border-[#22C55E]/25 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#22C55E]/15" style={{ background: '#22C55E08' }}>
              <CheckCircle className="w-5 h-5 text-[#22C55E]" weight="fill" />
              <div>
                <h2 className="text-base font-bold text-[#22C55E]">Live on Streaming Platforms</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Approved and distributed · Allow 24–48 hours to appear on all stores</p>
              </div>
            </div>
            {release.distributed_platforms?.length > 0 && (
              <div className="p-6">
                <p className="text-xs text-[#555] uppercase tracking-wider font-semibold mb-3">
                  Distributed to {release.distributed_platforms.length} platform{release.distributed_platforms.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {release.distributed_platforms.map((platform, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-full bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 capitalize font-medium"
                    >
                      {platform.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejection notice */}
        {release.status === 'rejected' && (
          <div className="bg-[#0d0d0d] border border-[#EF4444]/25 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-[#EF4444]" weight="fill" />
              <h2 className="text-base font-bold text-[#EF4444]">Release Not Approved</h2>
            </div>
            {release.rejection_reason && (
              <p className="text-sm text-[#A1A1AA] mt-1">Reason: {release.rejection_reason}</p>
            )}
            <p className="text-xs text-[#555] mt-3">Please fix the issues and resubmit your release.</p>
          </div>
        )}

        {/* Pending review notice */}
        {release.status === 'pending_review' && (
          <div className="bg-[#0d0d0d] border border-[#FFD700]/25 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FFD700]" />
              <div>
                <h2 className="text-base font-bold text-[#FFD700]">Under Review</h2>
                <p className="text-sm text-[#A1A1AA] mt-0.5">Your release has been submitted and is awaiting admin review. This usually takes 1–3 business days.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReleaseDetailPage;
