import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { MusicNotes, House, Disc, ChartLineUp, Wallet, Gear, SignOut, List, X, Plus, ShieldCheck, SpotifyLogo, YoutubeLogo, ArrowLeft, ShoppingBag, Bell, Check, UsersThree, Megaphone, HeartStraight, Lightning, CurrencyDollar, Trophy, Target, Buildings, Lock, Crown, Gift, CalendarBlank, ChatCircle, Star, Sparkle, Vault, MusicNote } from '@phosphor-icons/react';
import axios from 'axios';
import { API } from '../App';
import { isFeatureLocked } from './featureAccess';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { getUserRole } from '../utils/role';
import kalmoriFrontpageLogo from '../assets/kalmori-frontpage-logo.png';

const NOTIFICATION_ROUTES = {
  'new_submission': '/admin/submissions',
  'milestone': '/goals',
  'goal_achieved': '/goals',
  'follower': '/dashboard',
  'referral_reward': '/wallet',
  'referral_welcome': '/dashboard',
  'ai_insight': '/analytics',
  'smart_insight': '/analytics',
  'release_approved': '/releases',
  'release_rejected': '/releases',
  'release_update': '/releases',
  'review_result': '/releases',
  'payout': '/wallet',
  'payout_processed': '/wallet',
  'payment': '/wallet',
  'royalty_update': '/revenue',
  'message': '/messages',
  'new_message': '/messages',
  'collab_invite': '/collaborations',
  'collab_accepted': '/collaborations',
  'collab_rejected': '/collaborations',
  'collab_response': '/collaborations',
  'collaboration_invite': '/collaborations',
  'collaboration_accepted': '/collaborations',
  'collaboration_declined': '/collaborations',
  'content_id_claim': '/content-id',
  'content_id': '/content-id',
  'canvas': '/spotify-canvas',
  'campaign': '/analytics',
  'subscription': '/settings',
  'beat_purchase': '/wallet',
  'beat_sold': '/wallet',
  'contract': '/purchases',
  'split_earned': '/wallet',
  'royalty': '/revenue',
  'spotify': '/spotify',
  'weekly_digest': '/analytics',
  'verification': '/settings',
  'feature_announcement': '/features',
  'draft_reminder': '/releases',
  'schedule_reminder': '/admin',
  'new_signup': '/admin/users',
};

const getMobileTitle = (pathname) => {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/releases') return 'Releases';
  if (pathname === '/analytics') return 'Analytics';
  if (pathname === '/wallet') return 'Wallet';
  if (pathname === '/purchases') return 'My Purchases';
  if (pathname === '/collaborations') return 'Collaborations';
  if (pathname === '/collab-hub') return 'Collaboration Hub';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/spotify') return 'Spotify Data';
  if (pathname === '/spotify-canvas') return 'Spotify Canvas';
  if (pathname === '/content-id') return 'Content ID';
  if (pathname === '/messages') return 'Messages';
  if (pathname === '/features') return "What's New";
  if (pathname.startsWith('/releases/')) return 'Release Details';
  return 'Dashboard';
};

const NotificationPanel = ({ notifications, onMarkRead, onMarkAllRead, onClose, onNavigate, userRole, panelRef }) => {
  useBodyScrollLock(true);
  if (typeof document === 'undefined') return null;

  const content = (
    <>
      <div className="fixed inset-0 z-dropdown bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.75rem)] bottom-3 z-dropdown overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111111]/95 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:bottom-auto sm:mt-3 sm:h-auto sm:max-h-[28rem] sm:w-[26rem] sm:rounded-2xl"
        data-testid="notification-panel">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <p className="mt-0.5 text-xs text-white/45 sm:hidden">Stay on top of releases, payments, and activity.</p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button onClick={onMarkAllRead} className="touch-target rounded-full px-3 text-xs font-semibold text-[#B58CFF] hover:bg-white/5" data-testid="mark-all-read-btn">Mark all read</button>
            )}
            <button onClick={onClose} className="touch-target inline-flex items-center justify-center rounded-full text-white/60 hover:bg-white/5 sm:hidden" aria-label="Close notifications">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="h-[calc(100%-4.5rem)] overflow-y-auto px-3 pb-3 pt-2 sm:max-h-[23rem] sm:h-auto sm:px-0 sm:pb-0 sm:pt-0">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No notifications yet</div>
          ) : (
            notifications.map(n => {
              const isAdmin = userRole === 'admin';
              const targetUrl = n.action_url
                || (n.type === 'new_submission' ? (isAdmin ? '/admin/submissions' : '/releases') : null)
                || (n.type === 'new_signup' ? (isAdmin ? '/admin/users' : '/dashboard') : null)
                || NOTIFICATION_ROUTES[n.type]
                || '/dashboard';
              return (
                <div
                  key={n.id}
                  className={`group mb-2 cursor-pointer rounded-2xl border border-white/6 p-4 transition-colors hover:bg-white/[0.04] sm:mb-0 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-white/5 ${!n.read ? (n.type === 'ai_insight' ? 'bg-[#E040FB]/10 border-[#E040FB]/20' : 'bg-[#7C4DFF]/10 border-[#7C4DFF]/20') : 'bg-white/[0.02] sm:bg-transparent'}`}
                  onClick={async () => { if (!n.read) { try { await onMarkRead(n.id); } catch {} } onClose(); onNavigate(targetUrl); }}
                  data-testid={`notification-${n.id}`}>
                  <div className="flex items-start gap-3.5">
                    {n.type === 'ai_insight' || n.type === 'smart_insight' ? (
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C4DFF] to-[#E040FB]">
                        <Lightning className="w-4 h-4 text-white" weight="fill" />
                      </div>
                    ) : n.type === 'feature_announcement' ? (
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${n.color || '#7C4DFF'}20`, color: n.color || '#7C4DFF' }}>
                        <Star className="w-4 h-4" weight="fill" />
                      </div>
                    ) : (
                      <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${n.read ? 'bg-white/10' : 'bg-[#7C4DFF]'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      {(n.type === 'ai_insight' || n.type === 'smart_insight') && (
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#E040FB] uppercase tracking-wider">AI Insight</span>
                          {n.metric_value && <span className="text-[10px] font-bold text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded">{n.metric_value}</span>}
                        </div>
                      )}
                      {n.type === 'feature_announcement' && (
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: n.color || '#7C4DFF' }}>New Feature</span>
                          {n.has_access ? (
                            <span className="text-[10px] font-bold text-[#1DB954] bg-[#1DB954]/10 px-1.5 py-0.5 rounded">Available</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded">{n.min_plan?.charAt(0).toUpperCase() + n.min_plan?.slice(1)} Plan</span>
                          )}
                        </div>
                      )}
                      <p className="text-sm leading-snug text-white sm:text-[13px]">{n.message}</p>
                      {n.action_suggestion && (
                        <p className="mt-2 text-xs leading-snug text-[#B58CFF]">{n.action_suggestion}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-gray-500">
                          {n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                        <span className="text-[11px] font-semibold text-[#B58CFF] sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">View &rarr;</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const notifPanelRef = useRef(null);
  useBodyScrollLock(sidebarOpen);

  // Fetch notifications and unread count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        notifRef.current
        && !notifRef.current.contains(e.target)
        && notifPanelRef.current
        && !notifPanelRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${API}/notifications/unread-count`, { withCredentials: true });
      setUnreadCount(res.data.count || 0);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, { withCredentials: true });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const toggleNotifications = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications(!showNotifications);
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const plan = user?.plan || 'free';
  const planStatusLabel = plan === 'free' ? 'FREE PLAN' : `${plan.toUpperCase()} ACTIVE`;
  const isLocked = (feat) => isFeatureLocked(plan, feat);
  const userRole = getUserRole(user);

  const producerRoles = ['producer', 'label', 'label_producer'];
  const isProducerOrLabel = producerRoles.includes(userRole);
  const isLabelRole = ['label', 'label_producer'].includes(userRole);

  const navItems = [
    { path: '/dashboard', icon: <House className="w-5 h-5" />, label: 'Dashboard' },
    ...(isLabelRole ? [{ path: '/label', icon: <Buildings className="w-5 h-5" />, label: 'Label Dashboard' }] : []),
    ...(isProducerOrLabel ? [{ path: '/beat-bank', icon: <MusicNote className="w-5 h-5" />, label: 'Beat Bank' }] : []),
    { path: '/releases', icon: <Disc className="w-5 h-5" />, label: 'Releases' },
    { path: '/analytics', icon: <ChartLineUp className="w-5 h-5" />, label: 'Analytics' },
    { path: '/wallet', icon: <Wallet className="w-5 h-5" />, label: 'Wallet' },
    { path: '/revenue', icon: <CurrencyDollar className="w-5 h-5" />, label: 'Revenue' },
    { path: '/spotify', icon: <SpotifyLogo className="w-5 h-5" weight="fill" />, label: 'Spotify Data' },
    { path: '/spotify-canvas', icon: <SpotifyLogo className="w-5 h-5" />, label: 'Spotify Canvas', feat: 'spotify_canvas' },
    { path: '/content-id', icon: <YoutubeLogo className="w-5 h-5" />, label: 'Content ID', feat: 'content_id' },
    { path: '/purchases', icon: <ShoppingBag className="w-5 h-5" />, label: 'My Purchases' },
    ...(plan !== 'free' ? [{ path: '/collab-hub', icon: <Lightning className="w-5 h-5" />, label: 'Collab Hub' }] : []),
    { path: '/collaborations', icon: <UsersThree className="w-5 h-5" />, label: 'Collaborations' },
    { path: '/messages', icon: <ChatCircle className="w-5 h-5" />, label: 'Messages', feat: 'messaging' },
    { path: '/royalty-splits', icon: <CurrencyDollar className="w-5 h-5" />, label: 'Royalty Splits', feat: 'royalty_splits' },
    { path: '/presave-manager', icon: <Megaphone className="w-5 h-5" />, label: 'Pre-Save', feat: 'presave' },
    { path: '/fan-analytics', icon: <HeartStraight className="w-5 h-5" />, label: 'Fan Analytics', feat: 'fan_analytics' },
    { path: '/leaderboard', icon: <Trophy className="w-5 h-5" />, label: 'Leaderboard', feat: 'leaderboard' },
    { path: '/goals', icon: <Target className="w-5 h-5" />, label: 'Goals', feat: 'goals' },
    { path: '/referrals', icon: <Gift className="w-5 h-5" />, label: 'Referrals' },
    { path: '/calendar', icon: <CalendarBlank className="w-5 h-5" />, label: 'Calendar' },
    { path: '/features', icon: <Sparkle className="w-5 h-5" />, label: "What's New" },
    { path: '/settings', icon: <Gear className="w-5 h-5" />, label: 'Settings' },
  ];

  const handleLogout = async () => { await logout(); navigate('/'); };
  const mobileTitle = getMobileTitle(location.pathname);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-nav lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-nav w-[86vw] max-w-[18rem] lg:w-64 bg-[#0a0a0a] border-r border-white/10 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link to="/dashboard" className="flex flex-col items-start">
              <img
                src={kalmoriFrontpageLogo}
                alt="Kalmori"
                className="w-[128px] h-auto object-contain drop-shadow-[0_0_8px_rgba(224,64,251,0.25)]"
              />
              <div className="gradient-underline mt-1" />
            </Link>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const itemLocked = item.feat && isLocked(item.feat);
              return (
                <Link key={item.path} to={itemLocked ? '/pricing' : item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                    itemLocked ? 'text-gray-600 hover:bg-white/[0.02]' :
                    location.pathname === item.path ? 'bg-[#7C4DFF]/10 text-[#7C4DFF] border border-[#7C4DFF]/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  title={itemLocked ? `Upgrade to unlock ${item.label}` : ''}>
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {itemLocked && <Lock className="w-3.5 h-3.5 text-gray-600" />}
                </Link>
              );
            })}
            {userRole === 'admin' && (
              <>
                <div className="border-t border-white/10 my-3" />
                <Link to="/admin" onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#E53935] hover:bg-[#E53935]/10 transition-all"
                  data-testid="nav-admin">
                  <ShieldCheck className="w-5 h-5" /> Admin Panel
                </Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#E040FB] flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{user?.name || 'Artist'}</p>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider ${
                    plan === 'pro' ? 'bg-[#FFD700]/15 text-[#FFD700]' :
                    plan === 'rise' ? 'bg-[#7C4DFF]/15 text-[#7C4DFF]' :
                    'bg-white/5 text-gray-500'
                  }`}>{plan.toUpperCase()}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            {plan !== 'pro' && (
              <Link to="/pricing" className="block mx-4 mb-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/20 text-center" data-testid="upgrade-cta">
                <span className="text-[10px] font-bold text-[#FFD700] flex items-center justify-center gap-1">
                  <Crown className="w-3 h-3" weight="fill" /> UPGRADE TO PRO — KEEP 100%
                </span>
              </Link>
            )}
            <Button variant="ghost" className="w-full mt-2 text-gray-400 hover:text-white hover:bg-white/5 justify-start" onClick={handleLogout} data-testid="logout-btn">
              <SignOut className="w-5 h-5 mr-3" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex min-h-screen min-w-0 flex-col overflow-x-hidden">
        <header className="safe-top-pad sticky top-0 z-nav border-b border-white/10 bg-black/85 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 sm:flex sm:justify-between sm:px-5 sm:py-4 lg:px-6">
            <div className="flex items-center gap-2">
              <button className="touch-target inline-flex items-center justify-center rounded-xl hover:bg-white/5 lg:hidden" onClick={() => navigate(-1)} data-testid="dashboard-back-btn"><ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              <span className="truncate text-[15px] font-semibold text-white sm:hidden">{mobileTitle}</span>
            </div>
            <div className="hidden sm:block" />
            <div className="flex items-center justify-end gap-1.5 sm:gap-3">
              <button className="touch-target inline-flex items-center justify-center rounded-xl hover:bg-white/5 lg:hidden" onClick={() => setSidebarOpen(true)}><List className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 sm:inline">
                {planStatusLabel}
              </span>
              <div className="relative" ref={notifRef}>
                <button onClick={toggleNotifications} className="touch-target relative inline-flex items-center justify-center rounded-xl text-gray-300 transition-colors hover:bg-white/5" data-testid="notification-bell">
                  <Bell className="w-5 h-5 text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#E040FB] rounded-full flex items-center justify-center text-[10px] font-bold text-white" data-testid="unread-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationPanel notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onClose={() => setShowNotifications(false)} onNavigate={(url) => navigate(url)} userRole={userRole} panelRef={notifPanelRef} />
                )}
              </div>
              <Link to="/releases/new" className="sm:hidden">
                <button className="touch-target btn-animated inline-flex items-center justify-center rounded-full px-3 text-white" aria-label="Create new release" data-testid="new-release-btn-mobile">
                  <Plus className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/releases/new" className="hidden sm:inline-flex">
                <button className="btn-animated rounded-full px-4 py-2 text-sm font-semibold text-white flex items-center gap-2" data-testid="new-release-btn">
                  <Plus className="w-4 h-4" /> New Release
                </button>
              </Link>
            </div>
          </div>
        </header>
        <main tabIndex={-1} className="mobile-page-shell flex-1 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
