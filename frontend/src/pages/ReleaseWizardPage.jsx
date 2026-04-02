import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth, API } from '../App';
import { ArrowLeft, ArrowRight, MusicNote, Image, Disc, Globe, PaperPlaneTilt, Check, Upload, Plus, Trash, X } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Release Info', icon: <MusicNote className="w-5 h-5" /> },
  { id: 2, title: 'Cover Art', icon: <Image className="w-5 h-5" /> },
  { id: 3, title: 'Tracks', icon: <Disc className="w-5 h-5" /> },
  { id: 4, title: 'Stores', icon: <Globe className="w-5 h-5" /> },
  { id: 5, title: 'Review', icon: <PaperPlaneTilt className="w-5 h-5" /> },
];

const GENRES = ['Hip-Hop/Rap', 'R&B/Soul', 'Pop', 'Afrobeats', 'Dancehall', 'Reggae', 'Drill', 'Trap', 'Gospel', 'Electronic/EDM', 'Latin', 'Rock', 'Country', 'Jazz', 'Classical', 'Other'];

export default function ReleaseWizardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Release info
  const [releaseForm, setReleaseForm] = useState({
    title: '', release_type: 'single', genre: 'Hip-Hop/Rap', subgenre: '',
    release_date: '', description: '', explicit: false, language: 'en',
  });

  // Step 2: Cover art
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [releaseId, setReleaseId] = useState(null);

  // Step 3: Tracks
  const [tracks, setTracks] = useState([{ title: '', track_number: 1, explicit: false, audioFile: null, audioName: '' }]);

  // Step 4: Stores
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);

  const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
    || localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/distributions/stores`).then(res => {
      setStores(res.data || []);
      setSelectedStores((res.data || []).map(s => s.store_id));
    }).catch(() => {});
  }, []);

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addTrack = () => {
    setTracks(prev => [...prev, { title: '', track_number: prev.length + 1, explicit: false, audioFile: null, audioName: '' }]);
  };

  const removeTrack = (idx) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, track_number: i + 1 })));
  };

  const updateTrack = (idx, field, value) => {
    setTracks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleAudioSelect = (idx, file) => {
    if (file) updateTrack(idx, 'audioFile', file);
    updateTrack(idx, 'audioName', file?.name || '');
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!releaseForm.title || !releaseForm.release_date) {
        toast.error('Title and release date are required');
        return;
      }
      // Create release
      if (!releaseId) {
        setLoading(true);
        try {
          const res = await axios.post(`${API}/releases`, releaseForm, { headers });
          setReleaseId(res.data.id);
          toast.success('Release created!');
        } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create release'); setLoading(false); return; }
        setLoading(false);
      }
    }

    if (step === 2 && coverFile && releaseId) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', coverFile);
        await axios.post(`${API}/releases/${releaseId}/cover`, formData, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cover art uploaded!');
      } catch (e) { toast.error('Failed to upload cover'); }
      setLoading(false);
    }

    if (step === 3 && releaseId) {
      setLoading(true);
      try {
        for (const track of tracks) {
          if (!track.title) continue;
          // Create track
          const trackRes = await axios.post(`${API}/tracks`, {
            release_id: releaseId, title: track.title,
            track_number: track.track_number, explicit: track.explicit,
          }, { headers });

          // Upload audio if selected
          if (track.audioFile) {
            const formData = new FormData();
            formData.append('file', track.audioFile);
            await axios.post(`${API}/tracks/${trackRes.data.id}/audio`, formData, {
              headers: { ...headers, 'Content-Type': 'multipart/form-data' },
            });
          }
        }
        toast.success('Tracks saved!');
      } catch (e) { toast.error('Failed to save tracks'); }
      setLoading(false);
    }

    setStep(s => Math.min(s + 1, 5));
  };

  const handleSubmit = async () => {
    if (!releaseId || selectedStores.length === 0) {
      toast.error('Select at least one store');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/distributions/submit/${releaseId}`, selectedStores, { headers });
      toast.success('Release submitted for review!');
      navigate(`/releases/${releaseId}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit');
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto" data-testid="release-wizard">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button onClick={() => { if (s.id < step) setStep(s.id); }}
                className={`flex flex-col items-center gap-1.5 transition-all ${step >= s.id ? 'text-white' : 'text-gray-600'}`}
                data-testid={`step-${s.id}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step > s.id ? 'bg-[#4CAF50] border-[#4CAF50]' : step === s.id ? 'bg-[#E040FB] border-[#E040FB]' : 'bg-transparent border-gray-600'
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" weight="bold" /> : s.icon}
                </div>
                <span className="text-[10px] font-semibold tracking-wider hidden sm:block">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.id ? 'bg-[#4CAF50]' : 'bg-gray-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Release Info */}
        {step === 1 && (
          <div className="card-kalmori p-6 space-y-5" data-testid="step-release-info">
            <h2 className="text-xl font-bold">Release Information</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Release Title *</label>
              <input value={releaseForm.title} onChange={e => setReleaseForm({...releaseForm, title: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white" data-testid="wiz-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Release Type</label>
                <select value={releaseForm.release_type} onChange={e => setReleaseForm({...releaseForm, release_type: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white" data-testid="wiz-type">
                  <option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Genre</label>
                <select value={releaseForm.genre} onChange={e => setReleaseForm({...releaseForm, genre: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white" data-testid="wiz-genre">
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Release Date *</label>
              <input type="date" value={releaseForm.release_date} onChange={e => setReleaseForm({...releaseForm, release_date: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white" data-testid="wiz-date" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea value={releaseForm.description} onChange={e => setReleaseForm({...releaseForm, description: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white resize-none" rows={3} data-testid="wiz-desc" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border flex items-center justify-center ${releaseForm.explicit ? 'bg-[#E040FB] border-[#E040FB]' : 'border-gray-600'}`}
                onClick={() => setReleaseForm({...releaseForm, explicit: !releaseForm.explicit})}>
                {releaseForm.explicit && <Check className="w-3 h-3 text-white" weight="bold" />}
              </div>
              <span className="text-sm text-gray-300">Contains explicit content</span>
            </label>
          </div>
        )}

        {/* Step 2: Cover Art */}
        {step === 2 && (
          <div className="card-kalmori p-6 space-y-5" data-testid="step-cover-art">
            <h2 className="text-xl font-bold">Cover Art</h2>
            <p className="text-sm text-gray-400">Upload a square image (3000x3000px recommended, minimum 1400x1400px)</p>
            <div className="flex justify-center">
              <label className="cursor-pointer">
                {coverPreview ? (
                  <div className="relative group">
                    <img src={coverPreview} alt="Cover" className="w-60 h-60 rounded-2xl object-cover" />
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-bold">Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-60 h-60 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center hover:border-[#E040FB] transition-colors">
                    <Upload className="w-10 h-10 text-gray-500 mb-3" />
                    <span className="text-sm text-gray-400">Upload cover art</span>
                    <span className="text-xs text-gray-600 mt-1">JPG, PNG (max 10MB)</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} data-testid="wiz-cover-input" />
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Tracks */}
        {step === 3 && (
          <div className="card-kalmori p-6 space-y-5" data-testid="step-tracks">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Tracks</h2>
              <button onClick={addTrack} className="flex items-center gap-1.5 text-sm text-[#E040FB] hover:brightness-125" data-testid="add-track-btn">
                <Plus className="w-4 h-4" /> Add Track
              </button>
            </div>
            <div className="space-y-4">
              {tracks.map((track, idx) => (
                <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3" data-testid={`track-${idx}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">TRACK {track.track_number}</span>
                    {tracks.length > 1 && (
                      <button onClick={() => removeTrack(idx)} className="text-red-400 hover:text-red-300 p-1"><Trash className="w-4 h-4" /></button>
                    )}
                  </div>
                  <input value={track.title} onChange={e => updateTrack(idx, 'title', e.target.value)}
                    placeholder="Track title" className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm" data-testid={`track-title-${idx}`} />
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-lg hover:border-[#E040FB]/50 transition-colors">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400 truncate">{track.audioName || 'Upload audio (WAV, MP3)'}</span>
                      </div>
                      <input type="file" accept="audio/*" className="hidden" onChange={e => handleAudioSelect(idx, e.target.files[0])} data-testid={`track-audio-${idx}`} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${track.explicit ? 'bg-[#E040FB] border-[#E040FB]' : 'border-gray-600'}`}
                        onClick={() => updateTrack(idx, 'explicit', !track.explicit)}>
                        {track.explicit && <Check className="w-2.5 h-2.5 text-white" weight="bold" />}
                      </div>
                      E
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Stores */}
        {step === 4 && (
          <div className="card-kalmori p-6 space-y-5" data-testid="step-stores">
            <h2 className="text-xl font-bold">Distribution Stores</h2>
            <p className="text-sm text-gray-400">Select where you want your music available</p>
            <button onClick={() => setSelectedStores(selectedStores.length === stores.length ? [] : stores.map(s => s.store_id))}
              className="text-sm text-[#E040FB] hover:brightness-125" data-testid="toggle-all-stores">
              {selectedStores.length === stores.length ? 'Deselect All' : 'Select All'}
            </button>
            <div className="grid grid-cols-2 gap-3">
              {stores.map(store => (
                <button key={store.store_id} onClick={() => {
                  setSelectedStores(prev => prev.includes(store.store_id) ? prev.filter(s => s !== store.store_id) : [...prev, store.store_id]);
                }} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  selectedStores.includes(store.store_id) ? 'border-[#E040FB] bg-[#E040FB]/5' : 'border-white/10 hover:border-white/20'
                }`} data-testid={`store-${store.store_id}`}>
                  {selectedStores.includes(store.store_id) && <Check className="w-4 h-4 text-[#E040FB] flex-shrink-0" weight="bold" />}
                  <span className="text-sm font-medium text-white">{store.store_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="card-kalmori p-6 space-y-5" data-testid="step-review">
            <h2 className="text-xl font-bold">Review & Submit</h2>
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2">RELEASE</p>
                <p className="text-white font-semibold">{releaseForm.title}</p>
                <p className="text-sm text-gray-400">{releaseForm.release_type} &middot; {releaseForm.genre} &middot; {releaseForm.release_date}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2">COVER ART</p>
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-16 h-16 rounded-lg object-cover" />
                ) : <p className="text-sm text-yellow-500">No cover uploaded</p>}
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2">TRACKS ({tracks.filter(t => t.title).length})</p>
                {tracks.filter(t => t.title).map((t, i) => (
                  <p key={i} className="text-sm text-white">{t.track_number}. {t.title} {t.audioFile ? '(audio attached)' : ''}</p>
                ))}
                {tracks.filter(t => t.title).length === 0 && <p className="text-sm text-yellow-500">No tracks added</p>}
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2">STORES ({selectedStores.length})</p>
                <p className="text-sm text-gray-300">{selectedStores.map(s => stores.find(st => st.store_id === s)?.store_name).filter(Boolean).join(', ') || 'None selected'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <button onClick={() => step === 1 ? navigate('/releases') : setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
            data-testid="wiz-back">
            <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 5 ? (
            <button onClick={nextStep} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#E040FB] text-white text-sm font-bold hover:brightness-110 transition-all"
              data-testid="wiz-next">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                <>Next <ArrowRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white text-sm font-bold hover:brightness-110 transition-all"
              data-testid="wiz-submit">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                <><PaperPlaneTilt className="w-4 h-4" /> Submit for Review</>}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
