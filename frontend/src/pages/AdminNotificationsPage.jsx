import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Bell, MagnifyingGlass, Funnel, Eye, Trash, ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'new_signup', label: 'New Signups' },
  { value: 'feature_announcement', label: 'Feature Announcements' },
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

export default function AdminNotificationsPage() {
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

  const handleMarkRead = async (id) => {
    try {
      await axios.put(`${API}/admin/notifications-bank/${id}/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/admin/notifications-bank/${id}`, {}, { withCredentials: true });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API}/admin/notifications-bank/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const totalPages = Math.ceil(total / perPage);

  const getTypeColor = (type) => {
    const colors = {
      new_signup: '#1DB954', feature_announcement: '#7C4DFF', new_message: '#0095FF',
      collab_invite: '#E040FB', ai_insight: '#FF9500', smart_insight: '#FF9500',
      release_approved: '#22C55E', release_rejected: '#EF4444', payout_completed: '#FFD700',
      beat_purchased: '#00FFFF', subscription_upgraded: '#E040FB',
    };
    return colors[type] || '#A1A1AA';
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-notifications-bank">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notification Bank</h1>
            <p className="text-sm text-[#A1A1AA] mt-1">Browse and manage all admin notifications. {total} total.</p>
          </div>
          <Button onClick={handleMarkAllRead} variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2" data-testid="mark-all-read-bank">
            <CheckCircle className="w-4 h-4" /> Mark All as Read
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap" data-testid="notification-filters">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notifications..."
              className="pl-9 bg-[#141414] border-white/10 text-white" data-testid="notification-search" />
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-md bg-[#141414] border border-white/10 text-white text-sm" data-testid="notification-type-filter">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={readFilter} onChange={e => { setReadFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-md bg-[#141414] border border-white/10 text-white text-sm" data-testid="notification-read-filter">
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#141414] border border-white/10 rounded-lg p-12 text-center">
            <Bell className="w-10 h-10 text-[#A1A1AA] mx-auto mb-3" />
            <p className="text-[#A1A1AA]">No notifications found.</p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="notifications-bank-list">
            {notifications.map(n => (
              <div key={n.id} className={`bg-[#141414] border rounded-lg p-4 flex items-start gap-4 transition-all ${!n.read ? 'border-[#7C4DFF]/30 bg-[#7C4DFF]/5' : 'border-white/10'}`}
                data-testid={`bank-notif-${n.id}`}>
                <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: !n.read ? getTypeColor(n.type) : 'transparent', border: n.read ? '1px solid #333' : 'none' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getTypeColor(n.type)}20`, color: getTypeColor(n.type) }}>
                      {(n.type || 'general').replace(/_/g, ' ')}
                    </span>
                    {!n.read && <span className="text-[10px] font-bold text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded-full">NEW</span>}
                  </div>
                  <p className="text-sm text-white leading-snug">{n.message}</p>
                  <p className="text-[10px] text-[#555] mt-1.5">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button onClick={() => handleMarkRead(n.id)} className="p-2 text-[#A1A1AA] hover:text-[#7C4DFF] hover:bg-[#7C4DFF]/10 rounded-lg transition-all" title="Mark as read" data-testid={`mark-read-${n.id}`}>
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} className="p-2 text-[#A1A1AA] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Delete" data-testid={`delete-notif-${n.id}`}>
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#A1A1AA]">Page {page} of {totalPages} ({total} total)</p>
            <div className="flex items-center gap-2">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5 gap-1" data-testid="prev-page">
                <ArrowLeft className="w-3 h-3" /> Prev
              </Button>
              <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5 gap-1" data-testid="next-page">
                Next <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
