import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  User, 
  MusicNotes,
  MusicNote,
  Globe,
  Gear,
  Crown,
  CheckCircle,
  UploadSimple,
  Bell,
  SpotifyLogo,
  Link as LinkIcon,
  PlugsConnected,
  ShareNetwork,
  Copy,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const NOTIF_PREF_LABELS = {
  email_releases: { label: 'Release Updates', desc: 'Email when releases are approved or distributed' },
  email_collaborations: { label: 'Collaboration Invites', desc: 'Email when someone invites you to collaborate' },
  email_payments: { label: 'Payment Receipts', desc: 'Email receipts for purchases and subscriptions' },
  email_marketing: { label: 'Marketing & Tips', desc: 'Promotional emails and distribution tips' },
  email_weekly_digest: { label: 'Weekly Performance Digest', desc: 'AI-powered weekly email with streaming trends, top markets, and growth recommendations' },
  email_analytics_report: { label: 'Analytics Reports', desc: 'Periodic email reports showing your streams, revenue, and top releases' },
  push_releases: { label: 'Release Notifications', desc: 'In-app notifications for release status changes' },
  push_collaborations: { label: 'Collaboration Updates', desc: 'In-app notifications for collaboration activity' },
  push_payments: { label: 'Payment Alerts', desc: 'In-app notifications for payments and earnings' },
  push_milestones: { label: 'Milestone Celebrations', desc: 'In-app notifications when you hit streaming milestones' },
};

const SettingsPage = () => {
  const { user, checkAuth, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    artist_name: '',
    bio: '',
    genre: '',
    country: '',
    website: '',
    spotify_url: '',
    apple_music_url: '',
    instagram: '',
    twitter: ''
  });
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({});
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);
  const [planStatus, setPlanStatus] = useState('free');
  const [spotifyStatus, setSpotifyStatus] = useState(null);
  const [slug, setSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);
  const [themeColor, setThemeColor] = useState('#7C4DFF');
  const [savingTheme, setSavingTheme] = useState(false);

  useEffect(() => {
    fetchData();
    fetchNotifPrefs();
    fetchSpotifyStatus();
    fetchSlug();
    fetchTheme();
    // Handle Spotify OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'success') {
      toast.success('Spotify connected successfully!');
      fetchSpotifyStatus();
      window.history.replaceState({}, '', '/settings');
    } else if (params.get('spotify') === 'error') {
      toast.error(`Spotify connection failed: ${params.get('reason') || 'Unknown error'}`);
      window.history.replaceState({}, '', '/settings');
    }
    // Check for pending upgrade activated from PricingPage redirect
    // (Stripe always redirects to /pricing, which then redirects here after activation)
    const upgraded = params.get('upgraded');
    if (upgraded) {
      toast.success(`You are now on the ${upgraded.charAt(0).toUpperCase() + upgraded.slice(1)} plan!`);
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const fetchSpotifyStatus = async () => {
    try {
      const res = await axios.get(`${API}/spotify/status`, { withCredentials: true });
      setSpotifyStatus(res.data);
    } catch {}
  };

  const fetchSlug = async () => {
    try {
      const res = await axios.get(`${API}/artist/profile/slug`, { withCredentials: true });
      setSlug(res.data.slug || '');
      setSlugInput(res.data.slug || '');
    } catch {}
  };

  const handleSaveSlug = async () => {
    if (!slugInput.trim()) return;
    setSavingSlug(true);
    try {
      const res = await axios.put(`${API}/artist/profile/slug`, { slug: slugInput }, { withCredentials: true });
      setSlug(res.data.slug);
      setSlugInput(res.data.slug);
      toast.success('Profile URL updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update URL');
    } finally {
      setSavingSlug(false);
    }
  };

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/artist/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2000);
      toast.success('Profile link copied!');
    }).catch(() => toast.error('Failed to copy'));
  };

  const fetchTheme = async () => {
    try {
      const res = await axios.get(`${API}/artist/profile/theme`, { withCredentials: true });
      setThemeColor(res.data.theme_color || '#7C4DFF');
    } catch {}
  };

  const handleSaveTheme = async (color) => {
    setThemeColor(color);
    setSavingTheme(true);
    try {
      await axios.put(`${API}/artist/profile/theme`, { theme_color: color }, { withCredentials: true });
      toast.success('Theme color updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save theme');
    } finally {
      setSavingTheme(false);
    }
  };

  const handleDownloadQR = () => {
    if (!slug) return;
    const a = document.createElement('a');
    a.href = `${API}/artist/${slug}/qr`;
    a.download = `${slug}-qr.png`;
    a.click();
  };

  const fetchNotifPrefs = async () => {
    try {
      const res = await axios.get(`${API}/settings/notification-preferences`, { withCredentials: true });
      setNotifPrefs(res.data || {});
    } catch {}
  };

  const toggleNotifPref = async (key) => {
    const newVal = !notifPrefs[key];
    setNotifPrefs(prev => ({ ...prev, [key]: newVal }));
    setSavingNotifPrefs(true);
    try {
      await axios.put(`${API}/settings/notification-preferences`, { [key]: newVal }, { withCredentials: true });
      setNotifPrefs(prev => ({ ...prev, [key]: newVal }));
    } catch {
      setNotifPrefs(prev => ({ ...prev, [key]: !newVal }));
      toast.error('Failed to update preference');
    }
    finally { setSavingNotifPrefs(false); }
  };

  const fetchData = async () => {
    try {
      const [profileRes, plansRes, myPlanRes] = await Promise.all([
        axios.get(`${API}/artists/profile`),
        axios.get(`${API}/subscriptions/plans`),
        axios.get(`${API}/subscriptions/my-plan`, { withCredentials: true }),
      ]);
      setProfile(profileRes.data);
      setPlans(plansRes.data);
      setPlanStatus(myPlanRes.data.status || 'active');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/artists/profile`, profile);
      toast.success('Profile saved!');
      checkAuth();
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`${API}/artists/avatar`, formData);
      toast.success('Avatar uploaded!');
      checkAuth();
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpgradePlan = async (plan) => {
    const API_URL = process.env.REACT_APP_BACKEND_URL;
    try {
      if (plan === 'free') {
        const res = await axios.post(`${API_URL}/api/subscriptions/upgrade?plan=free`, {}, { withCredentials: true });
        updateUser?.({ plan: 'free' });
        setPlanStatus('free');
        await checkAuth();
        toast.success(res.data.message || 'Downgraded to Free plan.');
        return;
      }

      // Paid plan — go to Stripe checkout (always redirects to /pricing on return)
      const checkoutRes = await axios.post(`${API_URL}/api/subscriptions/checkout`, {
        plan,
        origin_url: window.location.origin,
      }, { withCredentials: true });

      if (checkoutRes.data.checkout_url) {
        window.location.href = checkoutRes.data.checkout_url;
        return;
      }

      toast.error('Could not start checkout. Please try again.');
    } catch (error) {
      const detail = error.response?.data?.detail || 'Failed to start upgrade. Please try again.';
      toast.error(detail);
    }
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto" data-testid="settings-page">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-[#141414] border border-white/10">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white">
              <Crown className="w-4 h-4 mr-2" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white" data-testid="notifications-settings-tab">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white" data-testid="integrations-settings-tab">
              <PlugsConnected className="w-4 h-4 mr-2" /> Integrations
            </TabsTrigger>
            <TabsTrigger value="public-profile" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white" data-testid="public-profile-tab">
              <ShareNetwork className="w-4 h-4 mr-2" /> Public Profile
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Avatar */}
            <div className="bg-[#141414] border border-white/10 rounded-md p-6">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF3B30]" />
                Avatar
              </h2>
              
              <div className="flex items-center gap-6">
                <label className="relative w-24 h-24 cursor-pointer group">
                  <div className="w-full h-full rounded-full bg-[#1E1E1E] overflow-hidden">
                    {user?.avatar_url ? (
                      <img 
                        src={`${API.replace('/api', '')}/api/files/${user.avatar_url}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#FF3B30]">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <UploadSimple className="w-6 h-6 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                    data-testid="avatar-upload-input"
                  />
                </label>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-[#A1A1AA]">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Artist Profile */}
            <div className="bg-[#141414] border border-white/10 rounded-md p-6">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
                <MusicNotes className="w-5 h-5 text-[#FF3B30]" />
                Artist Profile
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Artist Name</Label>
                  <Input
                    value={profile.artist_name}
                    onChange={(e) => setProfile({ ...profile, artist_name: e.target.value })}
                    className="bg-[#0A0A0A] border-white/10 text-white"
                    data-testid="artist-name-input"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">Bio</Label>
                  <Textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell your story..."
                    rows={4}
                    className="bg-[#0A0A0A] border-white/10 text-white"
                    data-testid="bio-textarea"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Genre</Label>
                    <Input
                      value={profile.genre || ''}
                      onChange={(e) => setProfile({ ...profile, genre: e.target.value })}
                      placeholder="e.g., Pop, Rock"
                      className="bg-[#0A0A0A] border-white/10 text-white"
                      data-testid="genre-input"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Country</Label>
                    <Input
                      value={profile.country || ''}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      placeholder="e.g., United States"
                      className="bg-[#0A0A0A] border-white/10 text-white"
                      data-testid="country-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[#141414] border border-white/10 rounded-md p-6">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#007AFF]" />
                Social Links
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Website</Label>
                    <Input
                      value={profile.website || ''}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yoursite.com"
                      className="bg-[#0A0A0A] border-white/10 text-white"
                      data-testid="website-input"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Spotify URL</Label>
                    <Input
                      value={profile.spotify_url || ''}
                      onChange={(e) => setProfile({ ...profile, spotify_url: e.target.value })}
                      placeholder="https://spotify.com/artist/..."
                      className="bg-[#0A0A0A] border-white/10 text-white"
                      data-testid="spotify-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Instagram</Label>
                    <Input
                      value={profile.instagram || ''}
                      onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                      placeholder="@username"
                      className="bg-[#0A0A0A] border-white/10 text-white"
                      data-testid="instagram-input"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Twitter</Label>
                    <Input
                      value={profile.twitter || ''}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      placeholder="@username"
                      className="bg-[#0A0A0A] border-white/10 text-white"
                      data-testid="twitter-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white"
                data-testid="save-profile-btn"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="bg-[#141414] border border-white/10 rounded-md p-6">
              <h2 className="text-lg font-medium mb-2">Current Plan</h2>
              <p className="text-[#A1A1AA] text-sm mb-6">
                You are currently on the <span className="text-[#FFCC00] font-semibold uppercase">{user?.plan || 'Free'}</span> plan
                <span className="ml-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {planStatus}
                </span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div 
                    key={key}
                    className={`p-6 rounded-md border ${
                      user?.plan === key 
                        ? 'border-[#FF3B30] bg-[#FF3B30]/10' 
                        : 'border-white/10 bg-[#0A0A0A]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      {user?.plan === key && (
                        <CheckCircle className="w-5 h-5 text-[#22C55E]" weight="fill" />
                      )}
                    </div>
                    
                    <p className="text-2xl font-bold font-mono mb-4">
                      ${plan.price}
                      <span className="text-sm text-[#A1A1AA] font-normal">/mo</span>
                    </p>
                    
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="text-sm text-[#A1A1AA] flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {plan.revenue_share > 0 && (
                      <p className="text-xs text-[#FFCC00] mb-4">
                        Note: {plan.revenue_share}% revenue share
                      </p>
                    )}
                    
                    {user?.plan !== key && (
                      <Button
                        onClick={() => handleUpgradePlan(key)}
                        className={`w-full ${key === 'pro' ? 'btn-kalmori-gold' : key === 'rise' ? 'btn-kalmori' : 'btn-kalmori-ghost'}`}
                        data-testid={`upgrade-${key}-btn`}
                      >
                        {key === 'free' ? 'Downgrade' : 'Upgrade with Payment'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Email Notifications</h2>
                <p className="text-sm text-gray-400">Choose what emails you receive</p>
              </div>
              <div className="space-y-3">
                {Object.entries(NOTIF_PREF_LABELS).filter(([k]) => k.startsWith('email_')).map(([key, { label, desc }]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-[#141414] border border-white/10 rounded-lg" data-testid={`pref-${key}`}>
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Switch checked={!!notifPrefs[key]} onCheckedChange={() => toggleNotifPref(key)} data-testid={`toggle-${key}`} />
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <h2 className="text-lg font-bold text-white mb-1">In-App Notifications</h2>
                <p className="text-sm text-gray-400">Choose what notifications appear in your dashboard</p>
              </div>
              <div className="space-y-3">
                {Object.entries(NOTIF_PREF_LABELS).filter(([k]) => k.startsWith('push_')).map(([key, { label, desc }]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-[#141414] border border-white/10 rounded-lg" data-testid={`pref-${key}`}>
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Switch checked={!!notifPrefs[key]} onCheckedChange={() => toggleNotifPref(key)} data-testid={`toggle-${key}`} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Connected Services</h2>
              <p className="text-sm text-gray-400">Link your streaming accounts for enhanced analytics</p>
            </div>

            {/* Spotify */}
            <div className="p-5 bg-[#141414] border border-white/10 rounded-lg" data-testid="spotify-integration">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1DB954]/15 flex items-center justify-center">
                    <SpotifyLogo className="w-7 h-7 text-[#1DB954]" weight="fill" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Spotify for Artists</p>
                    <p className="text-xs text-gray-500">
                      {spotifyStatus?.connected
                        ? spotifyStatus.spotify_artist_name
                          ? `Linked to ${spotifyStatus.spotify_artist_name} (${(spotifyStatus.spotify_artist_followers || 0).toLocaleString()} followers)`
                          : `Connected as ${spotifyStatus.spotify_display_name || 'your account'}`
                        : 'Connect to import real streaming data'}
                    </p>
                  </div>
                </div>
                {spotifyStatus?.connected ? (
                  <div className="flex items-center gap-2">
                    {spotifyStatus.spotify_artist_image && (
                      <img src={spotifyStatus.spotify_artist_image} alt="" className="w-8 h-8 rounded-full" />
                    )}
                    <button onClick={async () => {
                      await axios.post(`${API}/spotify/disconnect`, {}, { withCredentials: true });
                      setSpotifyStatus({ connected: false });
                      toast.success('Spotify disconnected');
                    }} className="btn-kalmori-danger px-4 py-2 rounded-full text-xs font-medium" data-testid="disconnect-spotify">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button onClick={async () => {
                    try {
                      const res = await axios.get(`${API}/spotify/connect`, { withCredentials: true });
                      if (res.data?.auth_url) window.location.href = res.data.auth_url;
                    } catch { toast.error('Failed to start Spotify connection'); }
                  }}
                    className="btn-kalmori px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2" data-testid="connect-spotify">
                    <LinkIcon className="w-3.5 h-3.5" /> Connect
                  </button>
                )}
              </div>
              {spotifyStatus?.connected && !spotifyStatus.spotify_artist_id && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-yellow-400 mb-2">No artist profile linked yet. Search for your Spotify artist profile:</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your artist name..."
                      className="flex-1 bg-[#0a0a0a] border-white/10 text-white text-xs"
                      id="spotify-artist-search"
                      data-testid="spotify-artist-search"
                    />
                    <button onClick={async () => {
                      const q = document.getElementById('spotify-artist-search')?.value;
                      if (!q) return;
                      try {
                        const res = await axios.post(`${API}/spotify/refresh-artist`, { artist_name: q }, { withCredentials: true });
                        if (res.data.artists?.length) {
                          const first = res.data.artists[0];
                          await axios.post(`${API}/spotify/link-artist`, { artist_id: first.id }, { withCredentials: true });
                          toast.success(`Linked to ${first.name}`);
                          fetchSpotifyStatus();
                        } else {
                          toast.error('No artists found');
                        }
                      } catch { toast.error('Search failed'); }
                    }} className="btn-kalmori px-4 py-2 rounded-lg text-xs font-bold" data-testid="spotify-search-btn">
                      Search & Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Apple Music */}
            <div className="p-5 bg-[#141414] border border-white/10 rounded-lg opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FC3C44]/15 flex items-center justify-center">
                    <MusicNote className="w-7 h-7 text-[#FC3C44]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Apple Music for Artists</p>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-[10px] font-bold text-gray-500 border border-white/10 rounded-full">COMING SOON</span>
              </div>
            </div>

            {/* YouTube */}
            <div className="p-5 bg-[#141414] border border-white/10 rounded-lg opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FF0000]/15 flex items-center justify-center">
                    <MusicNote className="w-7 h-7 text-[#FF0000]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">YouTube Music Analytics</p>
                    <p className="text-xs text-gray-500">Coming soon</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-[10px] font-bold text-gray-500 border border-white/10 rounded-full">COMING SOON</span>
              </div>
            </div>
          </TabsContent>

          {/* Public Profile Tab */}
          <TabsContent value="public-profile" className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Your Public Profile</h2>
              <p className="text-sm text-gray-400">Share your artist page with fans. This link shows your bio, music, and social links.</p>
            </div>

            {/* Profile URL */}
            <div className="bg-[#141414] border border-white/10 rounded-lg p-6" data-testid="public-profile-url-section">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#7C4DFF]" />
                Profile URL
              </h3>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center bg-[#0A0A0A] border border-white/10 rounded-lg overflow-hidden">
                  <span className="px-3 py-2.5 text-sm text-white/40 border-r border-white/10 whitespace-nowrap">
                    {window.location.origin}/artist/
                  </span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-name"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
                    data-testid="slug-input"
                  />
                </div>
                <Button
                  onClick={handleSaveSlug}
                  disabled={savingSlug || slugInput === slug}
                  className="bg-[#7C4DFF] hover:bg-[#7C4DFF]/80 text-white text-sm px-4"
                  data-testid="save-slug-btn"
                >
                  {savingSlug ? 'Saving...' : 'Save'}
                </Button>
              </div>

              {slug && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyProfileUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-all"
                    data-testid="copy-profile-url-btn"
                  >
                    {slugCopied ? (
                      <><CheckCircle className="w-4 h-4 text-[#22C55E]" weight="fill" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy Link</>
                    )}
                  </button>
                  <a
                    href={`/artist/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-all"
                    data-testid="view-profile-btn"
                  >
                    <ArrowSquareOut className="w-4 h-4" /> View Profile
                  </a>
                </div>
              )}
            </div>

            {/* What's shown */}
            <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
              <h3 className="text-sm font-bold text-white mb-4">What fans will see</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Artist name & avatar', done: !!profile.artist_name },
                  { label: 'Bio', done: !!profile.bio },
                  { label: 'Genre & country', done: !!profile.genre },
                  { label: 'Social links (Spotify, Instagram, etc.)', done: !!(profile.spotify_url || profile.instagram || profile.twitter) },
                  { label: 'Released music with audio previews', done: true },
                  { label: 'Pre-save campaigns', done: true },
                  { label: 'Custom theme color', done: themeColor !== '#7C4DFF' },
                  { label: 'QR code for sharing', done: !!slug },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${item.done ? 'text-[#22C55E]' : 'text-white/20'}`} weight={item.done ? 'fill' : 'regular'} />
                    <span className={item.done ? 'text-white/80' : 'text-white/40'}>{item.label}</span>
                    {!item.done && <span className="text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded-full">Customize below</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Theme Color Picker */}
            <div className="bg-[#141414] border border-white/10 rounded-lg p-6" data-testid="theme-color-section">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Gear className="w-4 h-4 text-[#E040FB]" />
                Profile Theme Color
              </h3>
              <p className="text-xs text-gray-400 mb-4">Choose a color that represents your brand. It will style your public profile page.</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { color: '#7C4DFF', name: 'Violet' },
                  { color: '#E040FB', name: 'Magenta' },
                  { color: '#FF4081', name: 'Pink' },
                  { color: '#FF5722', name: 'Orange' },
                  { color: '#FFD700', name: 'Gold' },
                  { color: '#1DB954', name: 'Green' },
                  { color: '#00BCD4', name: 'Cyan' },
                  { color: '#2196F3', name: 'Blue' },
                  { color: '#E53935', name: 'Red' },
                  { color: '#9C27B0', name: 'Purple' },
                ].map((t) => (
                  <button
                    key={t.color}
                    onClick={() => handleSaveTheme(t.color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${themeColor === t.color ? 'border-white scale-110 ring-2 ring-white/20' : 'border-transparent'}`}
                    style={{ backgroundColor: t.color }}
                    title={t.name}
                    data-testid={`theme-color-${t.name.toLowerCase()}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-white/50">Custom:</label>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => handleSaveTheme(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  data-testid="custom-color-picker"
                />
                <span className="text-xs text-white/40 font-mono">{themeColor}</span>
                {savingTheme && <span className="text-xs text-white/30">Saving...</span>}
              </div>
            </div>

            {/* QR Code */}
            {slug && (
              <div className="bg-[#141414] border border-white/10 rounded-lg p-6" data-testid="qr-code-section">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <ShareNetwork className="w-4 h-4 text-[#7C4DFF]" />
                  QR Code
                </h3>
                <p className="text-xs text-gray-400 mb-4">Share your profile with a scannable QR code. Perfect for flyers, merch, and social media.</p>
                <div className="flex items-center gap-6">
                  <div className="bg-[#0A0A0A] rounded-xl p-3 border border-white/5">
                    <img
                      src={`${API}/artist/${slug}/qr`}
                      alt="QR Code"
                      className="w-28 h-28"
                      data-testid="settings-qr-img"
                    />
                  </div>
                  <div className="space-y-3">
                    <Button
                      onClick={handleDownloadQR}
                      className="bg-[#7C4DFF] hover:bg-[#7C4DFF]/80 text-white text-sm"
                      data-testid="download-qr-settings-btn"
                    >
                      Download PNG
                    </Button>
                    <p className="text-[10px] text-white/30">High-res, dark-themed QR</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
