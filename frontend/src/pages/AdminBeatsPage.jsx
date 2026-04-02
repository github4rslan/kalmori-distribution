import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAuth, API } from '../App';
import { MusicNote, Plus, Trash, PencilSimple, Upload, Play, Pause, Eye, X, Check } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

const GENRES = ['Hip-Hop/Rap', 'R&B/Soul', 'Afrobeats', 'Dancehall', 'Reggae', 'Pop', 'Trap', 'Drill', 'Gospel', 'Electronic/EDM', 'Latin', 'Other'];
const MOODS = ['Energetic', 'Chill', 'Dark', 'Emotional', 'Happy', 'Uplifting', 'Romantic', 'Aggressive', 'Party'];

export default function AdminBeatsPage() {
  const { user } = useAuth();
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState({});
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  const [form, setForm] = useState({
    title: '', genre: 'Hip-Hop/Rap', bpm: 120, key: 'Cm', mood: 'Energetic',
    price_basic: 29.99, price_premium: 79.99, price_unlimited: 149.99, price_exclusive: 499.99
  });

  const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
    || localStorage.getItem('access_token');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchBeats(); }, []);

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const fetchBeats = async () => {
    try {
      const res = await axios.get(`${API}/beats`);
      setBeats(res.data.beats || []);
    } catch (e) { toast.error('Failed to load beats'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/beats`, form, { headers });
      setBeats(prev => [res.data, ...prev]);
      setShowForm(false);
      resetForm();
      toast.success('Beat created!');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create beat'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        title: form.title, genre: form.genre, bpm: form.bpm, key: form.key, mood: form.mood,
        prices: { basic_lease: form.price_basic, premium_lease: form.price_premium, unlimited_lease: form.price_unlimited, exclusive: form.price_exclusive }
      };
      const res = await axios.put(`${API}/beats/${editing}`, updateData, { headers });
      setBeats(prev => prev.map(b => b.id === editing ? res.data : b));
      setEditing(null);
      setShowForm(false);
      resetForm();
      toast.success('Beat updated!');
    } catch (e) { toast.error('Failed to update beat'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this beat?')) return;
    try {
      await axios.delete(`${API}/beats/${id}`, { headers });
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
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      await fetchBeats();
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
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      await fetchBeats();
      toast.success('Cover uploaded!');
    } catch (e) { toast.error('Cover upload failed'); }
    finally { setUploading(prev => ({ ...prev, [`cover_${beatId}`]: false })); }
  };

  const togglePlay = (beat) => {
    if (playingId === beat.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      audioRef.current?.pause();
      if (beat.audio_url) {
        const audio = new Audio(`${API}/beats/${beat.id}/stream`);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        audioRef.current = audio;
        setPlayingId(beat.id);
      } else {
        toast.error('No audio uploaded for this beat');
      }
    }
  };

  const startEdit = (beat) => {
    setForm({
      title: beat.title, genre: beat.genre, bpm: beat.bpm, key: beat.key, mood: beat.mood,
      price_basic: beat.prices?.basic_lease || 29.99, price_premium: beat.prices?.premium_lease || 79.99,
      price_unlimited: beat.prices?.unlimited_lease || 149.99, price_exclusive: beat.prices?.exclusive || 499.99
    });
    setEditing(beat.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ title: '', genre: 'Hip-Hop/Rap', bpm: 120, key: 'Cm', mood: 'Energetic',
      price_basic: 29.99, price_premium: 79.99, price_unlimited: 149.99, price_exclusive: 499.99 });
    setEditing(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto" data-testid="admin-beats-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Beat Manager</h1>
            <p className="text-sm text-gray-400 mt-1">{beats.length} beats in catalog</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#E040FB] hover:brightness-110 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all"
            data-testid="add-beat-btn">
            <Plus className="w-4 h-4" /> Add Beat
          </button>
        </div>

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); resetForm(); }}>
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">{editing ? 'Edit Beat' : 'New Beat'}</h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm" required data-testid="beat-form-title" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Genre</label>
                    <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm" data-testid="beat-form-genre">
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Mood</label>
                    <select value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm" data-testid="beat-form-mood">
                      {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">BPM</label>
                    <input type="number" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: parseInt(e.target.value) || 120 })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm" data-testid="beat-form-bpm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Key</label>
                    <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm" data-testid="beat-form-key" />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <label className="block text-sm text-gray-400 mb-3">Pricing</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Basic Lease</label>
                      <input type="number" step="0.01" value={form.price_basic} onChange={(e) => setForm({ ...form, price_basic: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Premium Lease</label>
                      <input type="number" step="0.01" value={form.price_premium} onChange={(e) => setForm({ ...form, price_premium: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unlimited Lease</label>
                      <input type="number" step="0.01" value={form.price_unlimited} onChange={(e) => setForm({ ...form, price_unlimited: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Exclusive</label>
                      <input type="number" step="0.01" value={form.price_exclusive} onChange={(e) => setForm({ ...form, price_exclusive: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                    className="flex-1 border border-white/10 text-gray-400 py-2.5 rounded-full text-sm font-medium hover:bg-white/5">Cancel</button>
                  <button type="submit"
                    className="flex-1 bg-[#E040FB] text-white py-2.5 rounded-full text-sm font-bold hover:brightness-110 flex items-center justify-center gap-2"
                    data-testid="beat-form-submit">
                    <Check className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Beats Table */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#E040FB] border-t-transparent rounded-full animate-spin" /></div>
        ) : beats.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MusicNote className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-lg font-medium">No beats yet</p>
            <p className="text-sm mt-1">Click "Add Beat" to create your first beat</p>
          </div>
        ) : (
          <div className="space-y-3">
            {beats.map((beat) => (
              <div key={beat.id} className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all" data-testid={`admin-beat-${beat.id}`}>
                <div className="flex items-center gap-4">
                  {/* Play button */}
                  <button onClick={() => togglePlay(beat)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      playingId === beat.id ? 'bg-[#E040FB]' : beat.audio_url ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40'
                    }`} data-testid={`admin-play-${beat.id}`}>
                    {playingId === beat.id ? <Pause className="w-5 h-5 text-white" weight="fill" /> : <Play className="w-5 h-5 text-white" weight="fill" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{beat.title}</h3>
                    <p className="text-xs text-gray-500">{beat.genre} &middot; {beat.bpm} BPM &middot; {beat.key} &middot; {beat.mood}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">{beat.plays || 0}</p>
                      <p>plays</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">${beat.prices?.basic_lease || '—'}</p>
                      <p>basic</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${beat.audio_url ? 'bg-green-500' : 'bg-yellow-500'}`} title={beat.audio_url ? 'Audio uploaded' : 'No audio'} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-[#E040FB] transition-colors" title="Upload Audio">
                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files[0] && handleAudioUpload(beat.id, e.target.files[0])}
                        data-testid={`upload-audio-${beat.id}`} />
                      {uploading[beat.id] ? <div className="w-4 h-4 border-2 border-[#E040FB] border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                    </label>
                    <button onClick={() => startEdit(beat)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" data-testid={`edit-beat-${beat.id}`}>
                      <PencilSimple className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(beat.id)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors" data-testid={`delete-beat-${beat.id}`}>
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Audio/Cover upload status */}
                <div className="flex items-center gap-3 mt-2 pl-14 text-xs">
                  {beat.audio_url ? (
                    <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Audio</span>
                  ) : (
                    <label className="text-yellow-500 hover:text-yellow-400 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload audio
                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files[0] && handleAudioUpload(beat.id, e.target.files[0])} />
                    </label>
                  )}
                  {beat.cover_url ? (
                    <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Cover</span>
                  ) : (
                    <label className="text-gray-500 hover:text-gray-400 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload cover
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleCoverUpload(beat.id, e.target.files[0])} />
                    </label>
                  )}
                  <span className="text-gray-600">{beat.duration || '--:--'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
