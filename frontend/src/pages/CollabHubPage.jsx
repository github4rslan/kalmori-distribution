import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import PublicLayout from '../components/PublicLayout';
import { Plus, PaperPlaneTilt, Check, X, User, MusicNote, Microphone, Headphones, Waveform, Guitar, Faders, Clock, CurrencyDollar, SignIn, UserPlus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { getSafeErrorDetail } from '../utils/error';

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
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('browse');
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [invites, setInvites] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteMsg, setInviteMsg] = useState('');
  const [form, setForm] = useState({
    title: '',
    looking_for: 'vocalist',
    genre: '',
    description: '',
    budget: '',
    deadline: '',
  });

  useBodyScrollLock(showForm || Boolean(inviteModal));

  const isAuthenticated = Boolean(user);
  const Layout = isAuthenticated ? DashboardLayout : PublicLayout;
  const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
  const axiosConfig = {
    withCredentials: true,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      let url = `${API}/api/collab-hub/posts`;
      const params = [];
      const requestHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      if (filterRole) params.push(`looking_for=${filterRole}`);
      if (filterGenre) params.push(`genre=${filterGenre}`);
      if (params.length) url += `?${params.join('&')}`;

      const postsRequest = fetch(url, {
        credentials: 'include',
        headers: requestHeaders,
      });

      const authedRequests = isAuthenticated
        ? Promise.all([
            fetch(`${API}/api/collab-hub/my-posts`, {
              credentials: 'include',
              headers: requestHeaders,
            }),
            fetch(`${API}/api/collab-hub/invites`, {
              credentials: 'include',
              headers: requestHeaders,
            }),
          ])
        : Promise.resolve([null, null]);

      const [postsRes, [myRes, invRes]] = await Promise.all([postsRequest, authedRequests]);

      if (postsRes.ok) setPosts(await postsRes.json());
      else setPosts([]);

      if (myRes?.ok) setMyPosts(await myRes.json());
      else setMyPosts([]);

      if (invRes?.ok) setInvites(await invRes.json());
      else setInvites({ received: [], sent: [] });
    } catch (e) {
      console.error(e);
      setPosts([]);
      setMyPosts([]);
      setInvites({ received: [], sent: [] });
    } finally {
      setLoading(false);
    }
  }, [filterGenre, filterRole, isAuthenticated, token]);

  useEffect(() => {
    if (authLoading) return;
    fetchAll();
  }, [authLoading, fetchAll]);

  useEffect(() => {
    if (isAuthenticated || tab === 'browse') return;
    setTab('browse');
  }, [isAuthenticated, tab]);

  const promptForAuth = (path = '/register') => {
    toast('Sign in or create an account to continue.');
    navigate(path, { state: { from: { pathname: '/collab-hub' } } });
  };

  const handleCreate = async () => {
    if (!isAuthenticated) {
      promptForAuth('/register');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Enter a title');
      return;
    }

    try {
      await axios.post(`${API}/api/collab-hub/posts`, form, axiosConfig);
      toast.success('Post created!');
      setShowForm(false);
      setForm({ title: '', looking_for: 'vocalist', genre: '', description: '', budget: '', deadline: '' });
      fetchAll();
    } catch (e) {
      toast.error(getSafeErrorDetail(e, 'Failed'));
    }
  };

  const handleInvite = async (postId) => {
    if (!isAuthenticated) {
      setInviteModal(null);
      promptForAuth('/login');
      return;
    }

    try {
      await axios.post(`${API}/api/collab-hub/invite`, { post_id: postId, message: inviteMsg }, axiosConfig);
      toast.success('Invite sent!');
      setInviteModal(null);
      setInviteMsg('');
      fetchAll();
    } catch (e) {
      toast.error(getSafeErrorDetail(e, 'Failed'));
    }
  };

  const handleInviteResponse = async (inviteId, action) => {
    try {
      await axios.put(`${API}/api/collab-hub/invites/${inviteId}`, { action }, axiosConfig);
      toast.success(`Invite ${action}ed`);
      fetchAll();
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      await axios.delete(`${API}/api/collab-hub/posts/${postId}`, axiosConfig);
      toast.success('Deleted');
      fetchAll();
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleClosePost = async (postId) => {
    try {
      await axios.put(`${API}/api/collab-hub/posts/${postId}`, { status: 'closed' }, axiosConfig);
      toast.success('Post closed');
      fetchAll();
    } catch (e) {
      toast.error('Failed');
    }
  };

  const inputCls = 'w-full bg-black border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]';
  const tabs = [
    { key: 'browse', label: 'Browse', count: posts.length },
    ...(isAuthenticated
      ? [
          { key: 'my-posts', label: 'My Posts', count: myPosts.length },
          { key: 'invites', label: 'Invites', count: invites.received.filter(i => i.status === 'pending').length },
        ]
      : []),
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="collab-hub-page">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="collab-hub-title">Collaboration Hub</h1>
            <p className="mt-1 text-sm text-gray-400">Find collaborators, post opportunities, and connect with other artists.</p>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-[#7C4DFF] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110"
              data-testid="create-post-btn"
            >
              <Plus className="w-4 h-4" /> Post Opportunity
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/login', { state: { from: { pathname: '/collab-hub' } } })}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                data-testid="guest-sign-in-btn"
              >
                <SignIn className="w-4 h-4" /> Sign In
              </button>
              <button
                onClick={() => navigate('/register', { state: { from: { pathname: '/collab-hub' } } })}
                className="flex items-center gap-2 rounded-lg bg-[#7C4DFF] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110"
                data-testid="guest-register-btn"
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </button>
            </div>
          )}
        </div>

        {!isAuthenticated && (
          <div className="rounded-2xl border border-[#7C4DFF]/20 bg-gradient-to-br from-[#111111] to-[#0a0a0a] p-5">
            <p className="text-sm font-semibold text-white">Browse the collaboration board without signing in.</p>
            <p className="mt-1 text-sm text-gray-400">You can explore open opportunities now. Sign in when you want to post your own opportunity or send an invite.</p>
          </div>
        )}

        <div className="flex w-fit gap-1 rounded-lg bg-[#111] p-1" data-testid="collab-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === t.key ? 'bg-[#7C4DFF] text-white' : 'text-gray-400 hover:text-white'}`}
              data-testid={`tab-${t.key}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-white/70' : 'text-gray-600'}`}>({t.count})</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <div className="flex flex-wrap gap-3" data-testid="collab-filters">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-[#222] bg-[#111] px-3 py-2 text-sm text-white focus:border-[#7C4DFF] focus:outline-none"
              data-testid="filter-role"
            >
              <option value="" className="bg-black">All Roles</option>
              {ROLES.map(r => <option key={r.value} value={r.value} className="bg-black">{r.label}</option>)}
            </select>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="rounded-lg border border-[#222] bg-[#111] px-3 py-2 text-sm text-white focus:border-[#7C4DFF] focus:outline-none"
              data-testid="filter-genre"
            >
              <option value="" className="bg-black">All Genres</option>
              {GENRES.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
            </select>
          </div>
        )}

        {loading || authLoading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : tab === 'browse' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="posts-grid">
            {posts.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-[#222] bg-[#111] p-8 text-center">
                <MusicNote className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                <p className="text-gray-400">No collaboration posts yet.</p>
                <p className="mt-1 text-sm text-gray-500">
                  {isAuthenticated ? 'Be the first to post an opportunity!' : 'Create an account to post the first opportunity.'}
                </p>
              </div>
            ) : posts.map(post => {
              const role = getRoleInfo(post.looking_for);

              return (
                <div key={post.id} className="rounded-xl border border-[#222] bg-[#111] p-5 transition hover:border-[#7C4DFF]/30" data-testid={`post-${post.id}`}>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C4DFF]/20 text-[#7C4DFF]">
                        {role.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{post.title}</p>
                        <p className="text-xs text-gray-500">{post.artist_name}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#E040FB]/30 bg-[#E040FB]/20 px-2 py-0.5 text-[10px] font-bold text-[#E040FB]">
                      {role.label}
                    </span>
                  </div>

                  {post.description && <p className="mb-3 line-clamp-2 text-sm text-gray-400">{post.description}</p>}

                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.genre && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                        {post.genre}
                      </span>
                    )}
                    {post.budget && (
                      <span className="flex items-center gap-1 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-medium text-[#22C55E]">
                        <CurrencyDollar className="h-3 w-3" /> {post.budget}
                      </span>
                    )}
                    {post.deadline && (
                      <span className="flex items-center gap-1 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2 py-0.5 text-[10px] font-medium text-[#FFD700]">
                        <Clock className="h-3 w-3" /> {post.deadline}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{post.responses} response{post.responses !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          promptForAuth('/login');
                          return;
                        }
                        setInviteModal(post.id);
                        setInviteMsg('');
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#7C4DFF] px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
                      data-testid={`invite-btn-${post.id}`}
                    >
                      <PaperPlaneTilt className="h-3.5 w-3.5" /> {isAuthenticated ? 'Send Invite' : 'Sign In to Invite'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === 'my-posts' ? (
          <div className="space-y-3" data-testid="my-posts-list">
            {myPosts.length === 0 ? (
              <div className="rounded-xl border border-[#222] bg-[#111] p-8 text-center">
                <p className="text-gray-400">You have not posted any opportunities yet.</p>
              </div>
            ) : myPosts.map(post => (
              <div key={post.id} className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4" data-testid={`my-post-${post.id}`}>
                <div className="flex-1">
                  <p className="font-medium text-white">{post.title}</p>
                  <p className="text-xs text-gray-500">Looking for: {getRoleInfo(post.looking_for).label} &middot; {post.responses} responses &middot; {post.status}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  post.status === 'open'
                    ? 'border-green-500/30 bg-green-500/20 text-green-400'
                    : post.status === 'in_progress'
                      ? 'border-blue-500/30 bg-blue-500/20 text-blue-400'
                      : 'border-gray-500/30 bg-gray-500/20 text-gray-400'
                }`}>{post.status.toUpperCase()}</span>
                {post.status === 'open' && (
                  <button onClick={() => handleClosePost(post.id)} className="text-xs text-gray-500 hover:text-yellow-400">Close</button>
                )}
                <button onClick={() => handleDeletePost(post.id)} className="text-gray-500 hover:text-red-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6" data-testid="invites-section">
            <div>
              <h3 className="mb-3 font-semibold text-white">Received Invites</h3>
              {invites.received.length === 0 ? (
                <p className="text-sm text-gray-500">No invites received yet.</p>
              ) : (
                <div className="space-y-2">
                  {invites.received.map(inv => (
                    <div key={inv.id} className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4" data-testid={`invite-${inv.id}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E040FB]/20">
                        <User className="h-5 w-5 text-[#E040FB]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white"><strong>{inv.from_artist_name}</strong> wants to collaborate</p>
                        <p className="text-xs text-gray-500">On: "{inv.post_title}"</p>
                        {inv.message && <p className="mt-1 text-xs italic text-gray-400">"{inv.message}"</p>}
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        inv.status === 'pending'
                          ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                          : inv.status === 'accepted'
                            ? 'border-green-500/30 bg-green-500/20 text-green-400'
                            : 'border-red-500/30 bg-red-500/20 text-red-400'
                      }`}>{inv.status.toUpperCase()}</span>
                      {inv.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInviteResponse(inv.id, 'accept')}
                            className="rounded-lg bg-[#22C55E] px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
                            data-testid={`accept-${inv.id}`}
                          >
                            <Check className="mr-1 inline h-3 w-3" /> Accept
                          </button>
                          <button
                            onClick={() => handleInviteResponse(inv.id, 'decline')}
                            className="rounded-lg bg-[#333] px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#444]"
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

            <div>
              <h3 className="mb-3 font-semibold text-white">Sent Invites</h3>
              {invites.sent.length === 0 ? (
                <p className="text-sm text-gray-500">No invites sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {invites.sent.map(inv => (
                    <div key={inv.id} className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4" data-testid={`sent-${inv.id}`}>
                      <div className="flex-1">
                        <p className="text-sm text-white">Sent to <strong>{inv.to_artist_name}</strong></p>
                        <p className="text-xs text-gray-500">For: "{inv.post_title}"</p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        inv.status === 'pending'
                          ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                          : inv.status === 'accepted'
                            ? 'border-green-500/30 bg-green-500/20 text-green-400'
                            : 'border-red-500/30 bg-red-500/20 text-red-400'
                      }`}>{inv.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showForm && isAuthenticated && (
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="create-post-modal">
            <div className="mx-4 max-h-[85vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-[#222] bg-[#111] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Post Collaboration Opportunity</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF]">Title *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Need a vocalist for my R&B track"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="post-title-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF]">Looking For *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setForm({ ...form, looking_for: r.value })}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        form.looking_for === r.value ? 'border-[#7C4DFF] bg-[#7C4DFF]/20 text-[#7C4DFF]' : 'border-[#222] text-gray-400 hover:border-gray-400'
                      }`}
                      data-testid={`role-${r.value}`}
                    >
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF]">Genre</label>
                  <select className={inputCls} value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} data-testid="post-genre">
                    <option value="" className="bg-black">Select genre</option>
                    {GENRES.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF]">Budget</label>
                  <select className={inputCls} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} data-testid="post-budget">
                    <option value="" className="bg-black">Select budget</option>
                    {BUDGETS.map(b => <option key={b} value={b} className="bg-black">{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF]">Description</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Describe what you are looking for..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="post-description"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF]">Deadline (optional)</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  data-testid="post-deadline"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
                <button onClick={handleCreate} className="rounded-lg bg-[#22C55E] px-6 py-2.5 text-sm font-medium text-white hover:brightness-110" data-testid="submit-post-btn">
                  Post Opportunity
                </button>
              </div>
            </div>
          </div>
        )}

        {inviteModal && isAuthenticated && (
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="invite-modal">
            <div className="mx-4 w-full max-w-md space-y-4 rounded-2xl border border-[#222] bg-[#111] p-6">
              <h3 className="text-lg font-bold text-white">Send Collaboration Invite</h3>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF]">Message (optional)</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Introduce yourself and explain why you would be a great fit..."
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  data-testid="invite-message"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setInviteModal(null)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
                <button onClick={() => handleInvite(inviteModal)} className="flex items-center gap-2 rounded-lg bg-[#7C4DFF] px-6 py-2.5 text-sm font-medium text-white hover:brightness-110" data-testid="send-invite-btn">
                  <PaperPlaneTilt className="h-4 w-4" /> Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
