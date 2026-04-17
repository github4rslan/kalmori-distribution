import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Bell, MagnifyingGlass, Eye, Trash, ArrowLeft, ArrowRight,
  CheckCircle, UserPlus, MusicNote, ChatCircle, Handshake,
  CurrencyDollar, Star, ArrowUpRight, Lightning, Warning,
} from '@phosphor-icons/react';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'new_signup', label: 'New Signups' },
  { value: 'new_submission', label: 'Submissions' },
  { value: 'feature_announcement', label: 'Announcements' },
  { value: 'new_message', label: 'Messages' },
  { value: 'collab_invite', label: 'Collab Invites' },
  { value: 'ai_insight', label: 'AI Insights' },
  { value: 'smart_insight', label: 'Smart Insights' },
  { value: 'release_approved', label: 'Release Approved' },
  { value: 'release_rejected', label: 'Release Rejected' },
  { value: 'payout_completed', label: 'Payouts' },
  { value: 'beat_purchased', label: 'Beat Purchases' },
  { value: 'subscription_upgraded', label: 'Subscription Upgrades' },
];

const TYPE_META = {
  new_signup:            { color: '#1DB954', icon: UserPlus,        label: 'New Signup' },
  new_submission:        { color: '#7C4DFF', icon: MusicNote,       label: 'Submission' },
  feature_announcement:  { color: '#E040FB', icon: Lightning,       label: 'Announcement' },
  new_message:           { color: '#0095FF', icon: ChatCircle,      label: 'Message' },
  collab_invite:         { color: '#E040FB', icon: Handshake,       label: 'Collab Invite' },
  collab_response:       { color: '#E040FB', icon: Handshake,       label: 'Collab Response' },
  ai_insight:            { color: '#FF9500', icon: Star,            label: 'AI Insight' },
  smart_insight:         { color: '#FF9500', icon: Star,            label: 'Smart Insight' },
  release_approved:      { color: '#22C55E', icon: CheckCircle,     label: 'Approved' },
  release_rejected:      { color: '#EF4444', icon: Warning,         label: 'Rejected' },
  payout_completed:      { color: '#FFD700', icon: CurrencyDollar,  label: 'Payout' },
  beat_purchased:        { color: '#00FFFF', icon: CurrencyDollar,  label: 'Beat Purchase' },
  subscription_upgraded: { color: '#E040FB', icon: ArrowUpRight,    label: 'Subscription' },
};

const getActionUrl = (n) => {
  // Use stored action_url if it's a deep link (not generic)
  if (n.action_url && n.action_url !== '/admin/users' && n.action_url !== '/admin/submissions' && n.action_url !== '/admin') {
    return n.action_url;
  }
  // Smart fallback routing by type
  switch (n.type) {
    case 'new_signup':
      return n.related_id ? `/admin/users/${n.related_id}` : '/admin/users';
    case 'new_submission':
      return n.related_id ? `/admin/submissions?release=${n.related_id}` : '/admin/submissions';
    case 'release_approved':
    case 'release_rejected':
    case 'review_result':
      return n.release_id ? `/admin/submissions?release=${n.release_id}` : '/admin/submissions';
    case 'beat_purchased':
      return '/admin/beats';
    case 'payout_completed':
      return '/admin/payouts';
    case 'subscription_upgraded':
      return '/admin/users';
    case 'new_message':
      return '/admin';
    case 'collab_invite':
    case 'collab_response':
      return '/admin';
    default:
      return n.action_url || '/admin';
  }
};

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('per_page', perPage);
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (readFilter) params.set('read', readFilter);
      const res = await axios.get(`${API}/admin/notifications-bank?${params}`, { withCredentials: true });
      setNotifications(res.data.notifications || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error('Failed to load notifications:', err); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, readFilter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.put(`${API}/admin/notifications-bank/${id}/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { toast.error('Failed to mark notification as read'); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/admin/notifications-bank/${id}`, { withCredentials: true });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
    } catch { toast.error('Failed to delete notification'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API}/admin/notifications-bank/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleClick = async (n) => {
    // Mark as read on click
    if (!n.read) {
      try {
        await axios.put(`${API}/admin/notifications-bank/${n.id}/read`, {}, { withCredentials: true });
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      } catch { /* non-critical, navigation still proceeds */ }
    }
    const url = getActionUrl(n);
    navigate(url);
  };

  const totalPages = Math.ceil(total / perPage);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-5" data-testid="admin-notifications-bank">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Notification Bank
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-[#7C4DFF] text-white px-2 py-0.5 rounded-full">{unreadCount} new</span>
              )}
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-0.5">{total} total notifications</p>
          </div>
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 gap-2 text-xs h-9"
            data-testid="mark-all-read-bank"
          >
            <CheckCircle className="w-4 h-4" /> Mark All Read
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center" data-testid="notification-filters">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notifications..."
              className="pl-9 bg-[#141414] border-white/10 text-white h-9 text-sm"
              data-testid="notification-search"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:w-auto">
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-md border border-white/10 bg-[#141414] px-3 text-sm text-white"
              data-testid="notification-type-filter"
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={readFilter}
              onChange={e => { setReadFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-md border border-white/10 bg-[#141414] px-3 text-sm text-white"
              data-testid="notification-read-filter"
            >
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#141414] border border-white/10 rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-[#A1A1AA] mx-auto mb-3" />
            <p className="text-[#A1A1AA] text-sm">No notifications found.</p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="notifications-bank-list">
            {notifications.map(n => {
              const meta = TYPE_META[n.type] || { color: '#A1A1AA', icon: Bell, label: (n.type || 'general').replace(/_/g, ' ') };
              const Icon = meta.icon;
              const isClickable = !!getActionUrl(n);

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`
                    group relative flex flex-col gap-3 rounded-2xl border bg-[#141414] p-4 transition-all select-none sm:flex-row sm:items-center
                    ${isClickable ? 'cursor-pointer hover:bg-white/5 active:scale-[0.99]' : ''}
                    ${!n.read ? 'border-[#7C4DFF]/30' : 'border-white/10'}
                  `}
                  data-testid={`bank-notif-${n.id}`}
                >
                  {/* Unread indicator bar */}
                  {!n.read && (
                    <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  )}

                  {/* Icon */}
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" weight={!n.read ? 'fill' : 'regular'} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      {!n.read && (
                        <span className="text-[10px] font-bold text-[#FFD700]">NEW</span>
                      )}
                    </div>
                    <p className={`text-sm leading-snug whitespace-normal break-words ${!n.read ? 'text-white font-medium' : 'text-[#ccc]'}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-[#555] mt-1">
                      {n.created_at
                        ? new Date(n.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 sm:flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkRead(e, n.id)}
                        className="touch-target p-2 text-[#A1A1AA] hover:text-[#7C4DFF] hover:bg-[#7C4DFF]/10 rounded-lg transition-all"
                        title="Mark as read"
                        data-testid={`mark-read-${n.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="touch-target p-2 text-[#A1A1AA] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      title="Delete"
                      data-testid={`delete-notif-${n.id}`}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Arrow hint for clickable items on mobile */}
                  {isClickable && (
                    <ArrowUpRight
                      className="w-3.5 h-3.5 text-[#444] flex-shrink-0 sm:hidden group-hover:text-[#666]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#A1A1AA]">Page {page} of {totalPages} &middot; {total} total</p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="border-white/10 text-white hover:bg-white/5 gap-1 h-8 text-xs"
                data-testid="prev-page"
              >
                <ArrowLeft className="w-3 h-3" /> Prev
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
                className="border-white/10 text-white hover:bg-white/5 gap-1 h-8 text-xs"
                data-testid="next-page"
              >
                Next <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
