import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { YoutubeLogo, ShieldCheck, CurrencyDollar, Eye, Prohibit, Plus, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';

const POLICIES = [
  { value: 'monetize', label: 'Monetize', desc: 'Earn revenue from matching videos', icon: <CurrencyDollar className="w-5 h-5" />, color: '#4CAF50' },
  { value: 'track', label: 'Track', desc: 'Track usage without monetization', icon: <Eye className="w-5 h-5" />, color: '#2196F3' },
  { value: 'block', label: 'Block', desc: 'Block matching videos', icon: <Prohibit className="w-5 h-5" />, color: '#F44336' },
];

export default function ContentIdPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [releases, setReleases] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState('');
  const [ownershipType, setOwnershipType] = useState('composition_and_recording');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [regRes, relRes] = await Promise.all([
        axios.get(`${API}/youtube-content-id`, { withCredentials: true }),
        axios.get(`${API}/releases`, { withCredentials: true })
      ]);
      setRegistrations(regRes.data);
      setReleases(relRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const registerContentId = async () => {
    if (!selectedRelease) { toast.error('Select a release'); return; }
    try {
      await axios.post(`${API}/youtube-content-id`, {
        release_id: selectedRelease, ownership_type: ownershipType
      }, { withCredentials: true });
      toast.success('Content ID registration submitted!');
      fetchData();
      setSelectedRelease('');
    } catch (err) { toast.error(err.response?.data?.detail || 'Registration failed'); }
  };

  const updatePolicy = async (regId, policy) => {
    try {
      await axios.put(`${API}/youtube-content-id/${regId}/policy`, { policy }, { withCredentials: true });
      toast.success(`Policy updated to ${policy}`);
      fetchData();
    } catch { toast.error('Policy update failed'); }
  };

  const statusColors = { pending: 'text-yellow-400 bg-yellow-400/10', active: 'text-green-400 bg-green-400/10', rejected: 'text-red-400 bg-red-400/10' };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="content-id-page">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <YoutubeLogo className="w-8 h-8 text-red-500" weight="fill" /> YouTube Content ID
          </h1>
          <p className="text-[#A1A1AA] mt-1">Protect and monetize your music on YouTube</p>
        </div>

        {/* Info */}
        <div className="bg-[#141414] border border-white/10 rounded-md p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-red-500" /> How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-[#4CAF50]/10 mx-auto mb-3 flex items-center justify-center text-[#4CAF50] font-bold">1</div>
              <p className="text-sm font-medium">Register</p>
              <p className="text-xs text-[#A1A1AA] mt-1">Submit your release for Content ID</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-[#2196F3]/10 mx-auto mb-3 flex items-center justify-center text-[#2196F3] font-bold">2</div>
              <p className="text-sm font-medium">Scan</p>
              <p className="text-xs text-[#A1A1AA] mt-1">YouTube scans all videos for your audio</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-[#FFD700]/10 mx-auto mb-3 flex items-center justify-center text-[#FFD700] font-bold">3</div>
              <p className="text-sm font-medium">Earn</p>
              <p className="text-xs text-[#A1A1AA] mt-1">Monetize matching videos automatically</p>
            </div>
          </div>
        </div>

        {/* Register */}
        <div className="bg-[#141414] border border-white/10 rounded-md p-6">
          <h2 className="text-lg font-medium mb-4">Register New Release</h2>
          <div className="space-y-4">
            <select value={selectedRelease} onChange={e => setSelectedRelease(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-md px-4 py-3 text-white" data-testid="cid-release-select">
              <option value="">Select a release...</option>
              {releases.filter(r => !registrations.some(reg => reg.release_id === r.id)).map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
            <select value={ownershipType} onChange={e => setOwnershipType(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-md px-4 py-3 text-white">
              <option value="composition_and_recording">Composition & Sound Recording</option>
              <option value="composition_only">Composition Only</option>
              <option value="recording_only">Sound Recording Only</option>
            </select>
            <Button onClick={registerContentId} className="bg-red-500 hover:bg-red-600 text-white" data-testid="register-cid-btn">
              <Plus className="w-4 h-4 mr-2" /> Register for Content ID
            </Button>
          </div>
        </div>

        {/* Registrations List */}
        <div className="space-y-4">
          {registrations.length === 0 ? (
            <div className="bg-[#141414] border border-white/10 rounded-md p-12 text-center">
              <YoutubeLogo className="w-12 h-12 text-red-500/30 mx-auto mb-4" />
              <p className="text-[#A1A1AA]">No Content ID registrations yet.</p>
            </div>
          ) : registrations.map(reg => (
            <div key={reg.id} className="bg-[#141414] border border-white/10 rounded-md p-6" data-testid={`cid-${reg.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium">{reg.release_title || 'Release'}</h3>
                  <p className="text-xs text-[#A1A1AA] mt-1">Asset ID: {reg.asset_id}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[reg.status] || statusColors.pending}`}>
                  {reg.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-[#A1A1AA] mr-2">Policy:</span>
                {POLICIES.map(p => (
                  <button key={p.value} onClick={() => updatePolicy(reg.id, p.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      reg.policy === p.value ? `border-current bg-opacity-10` : 'border-white/10 text-gray-400'
                    }`}
                    style={reg.policy === p.value ? { color: p.color, backgroundColor: `${p.color}15` } : {}}>
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
