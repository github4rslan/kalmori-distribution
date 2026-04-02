import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import { X, ShareNetwork, Copy, Check, Trophy, MusicNotes, Globe, CurrencyDollar, SpotifyLogo } from '@phosphor-icons/react';
import { toast } from 'sonner';

const PLATFORM_COLORS = { Spotify: '#1DB954', 'Apple Music': '#FC3C44', 'YouTube Music': '#FF0000', 'Amazon Music': '#FF9900', TikTok: '#010101', Tidal: '#00FFFF' };

export default function ShareStatsModal({ onClose }) {
  const [data, setData] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cardRes, milestoneRes] = await Promise.all([
        axios.get(`${API}/stats/share-card`, { withCredentials: true }),
        axios.get(`${API}/stats/milestones`, { withCredentials: true }),
      ]);
      setData(cardRes.data);
      setMilestones(milestoneRes.data.milestones || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const copyStats = () => {
    if (!data) return;
    const text = `${data.artist_name} on Kalmori\n${data.total_streams.toLocaleString()} streams | ${data.release_count} releases | $${data.total_revenue.toFixed(2)} earned\nTop platforms: ${data.top_platforms.map(p => p.name).join(', ')}\n\n#Kalmori #MusicDistribution`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Stats copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const latestMilestone = milestones.filter(m => m.achieved).pop();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="share-stats-modal">
      <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <div className="flex justify-end mb-3">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" data-testid="close-share-modal"><X className="w-6 h-6" /></button>
        </div>

        {/* Card */}
        <div ref={cardRef} className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0014 0%, #1a0030 40%, #0d001a 100%)' }}>
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#7C4DFF] font-bold tracking-[3px]">KALMORI</p>
                <h2 className="text-2xl font-bold text-white mt-1">{data.artist_name}</h2>
              </div>
              {latestMilestone && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20">
                  <Trophy className="w-4 h-4 text-[#FFD700]" weight="fill" />
                  <span className="text-xs font-bold text-[#FFD700]">{latestMilestone.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#7C4DFF]/15 flex items-center justify-center mx-auto mb-2">
                <MusicNotes className="w-6 h-6 text-[#7C4DFF]" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{data.total_streams.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Total Streams</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#4CAF50]/15 flex items-center justify-center mx-auto mb-2">
                <CurrencyDollar className="w-6 h-6 text-[#4CAF50]" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">${data.total_revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400">Total Earned</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E040FB]/15 flex items-center justify-center mx-auto mb-2">
                <Globe className="w-6 h-6 text-[#E040FB]" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{data.release_count}</p>
              <p className="text-xs text-gray-400">Releases</p>
            </div>
          </div>

          {/* Top Platforms */}
          <div className="px-6 pb-6">
            <p className="text-xs text-gray-500 mb-3 tracking-wider">TOP PLATFORMS</p>
            <div className="flex gap-3">
              {data.top_platforms.map(p => (
                <div key={p.name} className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold" style={{ color: PLATFORM_COLORS[p.name] || '#888' }}>{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.streams.toLocaleString()} plays</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones bar */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2">
              {milestones.slice(0, 6).map((m, i) => (
                <div key={i} className="flex-1">
                  <div className={`h-2 rounded-full ${m.achieved ? 'bg-gradient-to-r from-[#7C4DFF] to-[#E040FB]' : 'bg-white/10'}`} />
                  <p className={`text-[9px] mt-1 text-center ${m.achieved ? 'text-[#E040FB]' : 'text-gray-600'}`}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-white/5 flex items-center justify-between">
            <p className="text-[10px] text-gray-500">Generated on Kalmori</p>
            <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button onClick={copyStats} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white font-bold text-sm hover:brightness-110 transition-all" data-testid="copy-stats-btn">
            {copied ? <Check className="w-4 h-4" weight="bold" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Stats'}
          </button>
          <button onClick={onClose} className="px-6 py-3 rounded-full bg-white/10 text-white font-medium text-sm hover:bg-white/15 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
