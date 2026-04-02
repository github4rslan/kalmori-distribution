import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { SpotifyLogo, Upload, Play, Trash, Check, Warning, VideoCamera } from '@phosphor-icons/react';
import { toast } from 'sonner';

const CANVAS_SPECS = {
  format: 'MP4 (H.264)', aspect_ratio: '9:16 (vertical)', resolution: '720x1280 min, 1080x1920 recommended',
  duration: '3-8 seconds', max_size: '20MB', audio: 'No audio (video only)', loop: 'Must loop seamlessly'
};

export default function SpotifyCanvasPage() {
  const { user } = useAuth();
  const [canvases, setCanvases] = useState([]);
  const [releases, setReleases] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [canvasRes, releasesRes] = await Promise.all([
        axios.get(`${API}/spotify-canvas`, { withCredentials: true }),
        axios.get(`${API}/releases`, { withCredentials: true })
      ]);
      setCanvases(canvasRes.data);
      setReleases(releasesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createCanvas = async () => {
    if (!selectedRelease) { toast.error('Select a release first'); return; }
    try {
      await axios.post(`${API}/spotify-canvas`, { release_id: selectedRelease }, { withCredentials: true });
      toast.success('Canvas created! Now upload your video.');
      fetchData();
      setSelectedRelease('');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create canvas'); }
  };

  const uploadVideo = async (canvasId, file) => {
    if (!file.type.startsWith('video/')) { toast.error('Please upload an MP4 video'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('File too large. Max 20MB.'); return; }
    setUploading(canvasId);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API}/spotify-canvas/${canvasId}/upload`, formData, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000
      });
      toast.success('Video uploaded!');
      fetchData();
    } catch (err) { toast.error('Upload failed'); }
    finally { setUploading(null); }
  };

  const submitCanvas = async (canvasId) => {
    try {
      await axios.post(`${API}/spotify-canvas/${canvasId}/submit`, {}, { withCredentials: true });
      toast.success('Canvas submitted for Spotify review!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Submit failed'); }
  };

  const deleteCanvas = async (canvasId) => {
    try {
      await axios.delete(`${API}/spotify-canvas/${canvasId}`, { withCredentials: true });
      toast.success('Canvas deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const statusColors = { draft: 'text-gray-400 bg-gray-400/10', uploaded: 'text-blue-400 bg-blue-400/10', submitted: 'text-yellow-400 bg-yellow-400/10', approved: 'text-green-400 bg-green-400/10', rejected: 'text-red-400 bg-red-400/10' };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="spotify-canvas-page">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <SpotifyLogo className="w-8 h-8 text-[#1DB954]" weight="fill" /> Spotify Canvas
            </h1>
            <p className="text-[#A1A1AA] mt-1">Upload looping videos that play behind your tracks on Spotify</p>
          </div>
        </div>

        {/* Specs Card */}
        <div className="bg-[#141414] border border-white/10 rounded-md p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><VideoCamera className="w-5 h-5 text-[#1DB954]" /> Canvas Requirements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(CANVAS_SPECS).map(([key, val]) => (
              <div key={key} className="bg-[#0a0a0a] rounded-lg p-3">
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wider mb-1">{key.replace('_', ' ')}</p>
                <p className="text-sm font-medium">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Create New */}
        <div className="bg-[#141414] border border-white/10 rounded-md p-6">
          <h2 className="text-lg font-medium mb-4">Create New Canvas</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <select value={selectedRelease} onChange={e => setSelectedRelease(e.target.value)}
              className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-md px-4 py-3 text-white" data-testid="canvas-release-select">
              <option value="">Select a release...</option>
              {releases.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            <Button onClick={createCanvas} className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white" data-testid="create-canvas-btn">
              <SpotifyLogo className="w-4 h-4 mr-2" /> Create Canvas
            </Button>
          </div>
        </div>

        {/* Canvas List */}
        <div className="space-y-4">
          {canvases.length === 0 ? (
            <div className="bg-[#141414] border border-white/10 rounded-md p-12 text-center">
              <SpotifyLogo className="w-12 h-12 text-[#1DB954]/30 mx-auto mb-4" />
              <p className="text-[#A1A1AA]">No canvases yet. Create one to get started!</p>
            </div>
          ) : canvases.map(canvas => (
            <div key={canvas.id} className="bg-[#141414] border border-white/10 rounded-md p-6" data-testid={`canvas-${canvas.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium">{canvas.release_title || 'Untitled Release'}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[canvas.status] || statusColors.draft}`}>
                    {canvas.status.toUpperCase()}
                  </span>
                </div>
                <button onClick={() => deleteCanvas(canvas.id)} className="text-gray-500 hover:text-red-500 transition-colors" data-testid={`delete-canvas-${canvas.id}`}>
                  <Trash className="w-5 h-5" />
                </button>
              </div>

              {canvas.status === 'draft' && (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-8 cursor-pointer hover:border-[#1DB954]/50 transition-colors">
                  {uploading === canvas.id ? (
                    <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#A1A1AA] mb-2" />
                      <p className="text-sm text-[#A1A1AA]">Upload MP4 video (3-8s, 9:16, max 20MB)</p>
                    </>
                  )}
                  <input type="file" accept="video/mp4,video/*" className="hidden" onChange={e => e.target.files[0] && uploadVideo(canvas.id, e.target.files[0])} />
                </label>
              )}

              {canvas.status === 'uploaded' && (
                <Button onClick={() => submitCanvas(canvas.id)} className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white" data-testid={`submit-canvas-${canvas.id}`}>
                  <Check className="w-4 h-4 mr-2" /> Submit for Spotify Review
                </Button>
              )}

              {canvas.status === 'submitted' && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Warning className="w-4 h-4" /> Under review. Expected approval: 24-48 hours.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
