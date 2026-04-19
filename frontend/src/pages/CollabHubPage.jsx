import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { MagnifyingGlass, Plus, PaperPlaneTilt, Check, X, User, MusicNote, Microphone, Headphones, Waveform, Guitar, Faders, Clock, CurrencyDollar, ChatCircle, CaretDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const API = process.env.REACT_APP_BACKEND_URL;

const ROLES = [
  { value: 'vocalist', label: 'Vocalist', icon: <Microphone className="w-4 h-4" /> },
  { value: 'producer', label: 'Producer', icon: <Faders className="w-4 h-4" /> },
  { value: 'mixer', label: 'Mixer / Engineer', icon: <Waveform className="w-4 h-4" /> },
  { value: 'songwriter', label: 'Songwriter', icon: <MusicNote className="w-4 h-4" /> },
  { value: 'feature', label: 'Feature Artist', icon: <User className="w-4 h-4" /> },
  { value: 'dj', label: 'DJ / Remixer', icon: <Headphones className="w-4 h-4" /> },
  { value: 'instrumentalist', label: 'Instrumentalist', icon: <Guitar className="w-4 h-4" /> },
  { value: 'other', label: 'Other', icon: <MusicNote className="w-4 h-4" /> },
];

const GENRES = ['Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Latin', 'Country', 'Afrobeats', 'Jazz', 'Classical', 'Reggae', 'Other'];
const BUDGETS = ['Free / Credit', 'Negotiable', '$100 - $500', '$500 - $2,000', '$2,000+'];

const getRoleInfo = (val) => ROLES.find(r => r.value === val) || ROLES[7];

export default function CollabHubPage() {
  const [tab, setTab] = useState('browse'); // browse, my-posts, invites
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [invites, setInvites] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteMsg, setInviteMsg] = useState('');
  useBodyScrollLock(showForm || Boolean(inviteModal));
  const [form, setForm] = useState({
    title: '', looking_for: 'vocalist', genre: '', description: '', budget: '', deadline: '',
  });

  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = useCallback(async () => {
    try {
      let url = `${API}/api/collab-hub/posts`;
      const params = [];
      if (filterRole) params.push(`looking_for=${filterRole}`);
      if (filterGenre) params.push(`genre=${filterGenre}`);
      if (params.length) url += `?${params.join('&')}`;

      const [postsRes, myRes, invRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/collab-hub/my-posts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/collab-hub/invites`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (postsRes.ok) setPosts(await postsRes.json());
      if (myRes.ok) setMyPosts(await myRes.json());
      if (invRes.ok) setInvites(await invRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, filterRole, filterGenre]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Enter a title'); return; }
    try {
      await axios.post(`${API}/api/collab-hub/posts`, form, { headers });
      toast.success('Post created!');
      setShowForm(false);
      setForm({ title: '', looking_for: 'vocalist', genre: '', description: '', budget: '', deadline: '' });
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleInvite = async (postId) => {
    try {
      await axios.post(`${API}/api/collab-hub/invite`, { post_id: postId, message: inviteMsg }, { headers });
      toast.success('Invite sent!');
      setInviteModal(null);
      setInviteMsg('');
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleInviteResponse = async (inviteId, action) => {
    try {
      await axios.put(`${API}/api/collab-hub/invites/${inviteId}`, { action }, { headers });
      toast.success(`Invite ${action}ed`);
      fetchAll();
    } catch (e) { toast.error('Failed'); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`${API}/api/collab-hub/posts/${postId}`, { headers });
      toast.success('Deleted');
      fetchAll();
    } catch (e) { toast.error('Failed'); }
  };

  const handleClosePost = async (postId) => {
    try {
      await axios.put(`${API}/api/collab-hub/posts/${postId}`, { status: 'closed' }, { headers });
      toast.success('Post closed');
      fetchAll();
    } catch (e) { toast.error('Failed'); }
  };

  const inputCls = "w-full bg-black border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]";

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="collab-hub-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="collab-hub-title">Collaboration Hub</h1>
            <p className="text-gray-400 text-sm mt-1">Find collaborators, post opportunities, and connect with other artists</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 rounded-lg bg-[#7C4DFF] text-white text-sm font-medium hover:brightness-110 flex items-center gap-2"
            data-testid="create-post-btn"
          >
            <Plus className="w-4 h-4" /> Post Opportunity
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] p-1 rounded-lg w-fit" data-testid="collab-tabs">
          {[
            { key: 'browse', label: 'Browse', count: posts.length },
            { key: 'my-posts', label: 'My Posts', count: myPosts.length },
            { key: 'invites', label: 'Invites', count: invites.received.filter(i => i.status === 'pending').length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === t.key ? 'bg-[#7C4DFF] text-white' : 'text-gray-400 hover:text-white'
              }`}
              data-testid={`tab-${t.key}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-white/70' : 'text-gray-600'}`}>({t.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Filters (Browse tab) */}
        {tab === 'browse' && (
          <div className="flex gap-3 flex-wrap" data-testid="collab-filters">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C4DFF]"
              data-testid="filter-role"
            >
              <option value="" className="bg-black">All Roles</option>
              {ROLES.map(r => <option key={r.value} value={r.value} className="bg-black">{r.label}</option>)}
            </select>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C4DFF]"
              data-testid="filter-genre"
            >
              <option value="" className="bg-black">All Genres</option>
              {GENRES.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
            </select>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : tab === 'browse' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="posts-grid">
            {posts.length === 0 ? (
              <div className="col-span-2 bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <MusicNote className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No collaboration posts yet.</p>
                <p className="text-gray-500 text-sm mt-1">Be the first to post an opportunity!</p>
              </div>
            ) : posts.map(post => {
              const role = getRoleInfo(post.looking_for);
              return (
                <div key={post.id} className="bg-[#111] border border-[#222] rounded-xl p-5 hover:border-[#7C4DFF]/30 transition" data-testid={`post-${post.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#7C4DFF]/20 flex items-center justify-center text-[#7C4DFF]">
                        {role.icon}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{post.title}</p>
                        <p className="text-xs text-gray-500">{post.artist_name}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E040FB]/20 text-[#E040FB] border border-[#E040FB]/30">
                      {role.label}
                    </span>
                  </div>

                  {post.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.description}</p>}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.genre && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-300 border border-white/10">
                        {post.genre}
                      </span>
                    )}
                    {post.budget && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 flex items-center gap-1">
                        <CurrencyDollar className="w-3 h-3" /> {post.budget}
                      </span>
                    )}
                    {post.deadline && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.deadline}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{post.responses} response{post.responses !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => { setInviteModal(post.id); setInviteMsg(''); }}
                      className="px-3 py-1.5 rounded-lg bg-[#7C4DFF] text-white text-xs font-medium hover:brightness-110 flex items-center gap-1.5"
                      data-testid={`invite-btn-${post.id}`}
                    >
                      <PaperPlaneTilt className="w-3.5 h-3.5" /> Send Invite
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === 'my-posts' ? (
          <div className="space-y-3" data-testid="my-posts-list">
            {myPosts.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <p className="text-gray-400">You haven't posted any opportunities yet.</p>
              </div>
            ) : myPosts.map(post => (
              <div key={post.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-4" data-testid={`my-post-${post.id}`}>
                <div className="flex-1">
                  <p className="text-white font-medium">{post.title}</p>
                  <p className="text-xs text-gray-500">Looking for: {getRoleInfo(post.looking_for).label} &middot; {post.responses} responses &middot; {post.status}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  post.status === 'open' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  post.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>{post.status.toUpperCase()}</span>
                {post.status === 'open' && (
                  <button onClick={() => handleClosePost(post.id)} className="text-gray-500 hover:text-yellow-400 text-xs">Close</button>
                )}
                <button onClick={() => handleDeletePost(post.id)} className="text-gray-500 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6" data-testid="invites-section">
            {/* Received */}
            <div>
              <h3 className="text-white font-semibold mb-3">Received Invites</h3>
              {invites.received.length === 0 ? (
                <p className="text-gray-500 text-sm">No invites received yet.</p>
              ) : (
                <div className="space-y-2">
                  {invites.received.map(inv => (
                    <div key={inv.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-4" data-testid={`invite-${inv.id}`}>
                      <div className="w-10 h-10 rounded-full bg-[#E040FB]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#E040FB]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm"><strong>{inv.from_artist_name}</strong> wants to collaborate</p>
                        <p className="text-xs text-gray-500">On: "{inv.post_title}"</p>
                        {inv.message && <p className="text-xs text-gray-400 mt-1 italic">"{inv.message}"</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        inv.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>{inv.status.toUpperCase()}</span>
                      {inv.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInviteResponse(inv.id, 'accept')}
                            className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-white text-xs font-medium hover:brightness-110"
                            data-testid={`accept-${inv.id}`}
                          >
                            <Check className="w-3 h-3 inline mr-1" /> Accept
                          </button>
                          <button
                            onClick={() => handleInviteResponse(inv.id, 'decline')}
                            className="px-3 py-1.5 rounded-lg bg-[#333] text-gray-300 text-xs font-medium hover:bg-[#444]"
                            data-testid={`decline-${inv.id}`}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent */}
            <div>
              <h3 className="text-white font-semibold mb-3">Sent Invites</h3>
              {invites.sent.length === 0 ? (
                <p className="text-gray-500 text-sm">No invites sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {invites.sent.map(inv => (
                    <div key={inv.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-4" data-testid={`sent-${inv.id}`}>
                      <div className="flex-1">
                        <p className="text-white text-sm">Sent to <strong>{inv.to_artist_name}</strong></p>
                        <p className="text-xs text-gray-500">For: "{inv.post_title}"</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        inv.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>{inv.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showForm && (
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="create-post-modal">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Post Collaboration Opportunity</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Title *</label>
                <input className={inputCls} placeholder="e.g. Need a vocalist for my R&B track" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="post-title-input" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Looking For *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} onClick={() => setForm({ ...form, looking_for: r.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
                        form.looking_for === r.value ? 'border-[#7C4DFF] bg-[#7C4DFF]/20 text-[#7C4DFF]' : 'border-[#222] text-gray-400 hover:border-gray-400'
                      }`} data-testid={`role-${r.value}`}>
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Genre</label>
                  <select className={inputCls} value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} data-testid="post-genre">
                    <option value="" className="bg-black">Select genre</option>
                    {GENRES.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Budget</label>
                  <select className={inputCls} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} data-testid="post-budget">
                    <option value="" className="bg-black">Select budget</option>
                    {BUDGETS.map(b => <option key={b} value={b} className="bg-black">{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Description</label>
                <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Describe what you're looking for..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="post-description" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Deadline (optional)</label>
                <input type="date" className={inputCls} value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })} data-testid="post-deadline" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 text-sm">Cancel</button>
                <button onClick={handleCreate} className="px-6 py-2.5 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:brightness-110"
                  data-testid="submit-post-btn">
                  Post Opportunity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {inviteModal && (
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="invite-modal">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 w-full max-w-md mx-4 space-y-4">
              <h3 className="text-white font-bold text-lg">Send Collaboration Invite</h3>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Message (optional)</label>
                <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Introduce yourself and explain why you'd be a great fit..."
                  value={inviteMsg} onChange={(e) => setInviteMsg(e.target.value)} data-testid="invite-message" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setInviteModal(null)} className="px-4 py-2 text-gray-400 text-sm">Cancel</button>
                <button onClick={() => handleInvite(inviteModal)} className="px-6 py-2.5 rounded-lg bg-[#7C4DFF] text-white text-sm font-medium hover:brightness-110 flex items-center gap-2"
                  data-testid="send-invite-btn">
                  <PaperPlaneTilt className="w-4 h-4" /> Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
