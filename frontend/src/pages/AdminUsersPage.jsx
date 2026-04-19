import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import AdminLayout from '../components/AdminLayout';
import { Users, MagnifyingGlass, CaretLeft, CaretRight, PencilSimple, X, Trash, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

import { toast } from 'sonner';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', plan: '', status: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useBodyScrollLock(Boolean(editUser) || Boolean(deleteTarget));

  const fetchUsers = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (q) params.append('search', q);
      const res = await axios.get(`${API}/admin/users?${params}`);
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(p);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(1, search); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({ role: user.role, plan: user.plan, status: user.status || 'active' });
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await axios.put(`${API}/admin/users/${editUser.id}`, editForm);
      setEditUser(null);
      toast.success('User updated');
      fetchUsers(page, search);
    } catch (err) { toast.error(err.response?.data?.detail || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${API}/admin/users/${deleteTarget.id}`);
      toast.success(res.data.message || 'User deleted');
      setDeleteTarget(null);
      fetchUsers(page, search);
    } catch (err) { toast.error(err.response?.data?.detail || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const planColor = (p) => {
    if (p === 'pro') return 'bg-[#E040FB]/10 text-[#E040FB]';
    if (p === 'rise') return 'bg-[#FFD700]/10 text-[#FFD700]';
    return 'bg-gray-600/20 text-gray-400';
  };

  const roleColor = (r) => {
    if (r === 'admin') return 'text-[#E53935]';
    return 'text-gray-400';
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6" data-testid="admin-users">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User <span className="text-[#E53935]">Management</span></h1>
            <p className="text-gray-400 mt-1">Manage platform users and permissions</p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..." className="w-full rounded-xl border border-white/10 bg-[#111] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500"
                data-testid="user-search-input" />
            </div>
            <Button type="submit" className="bg-[#E53935] hover:bg-[#d32f2f] text-white text-sm sm:min-w-[7rem]" data-testid="user-search-btn">Search</Button>
          </form>
        </div>

        <div className="card-kalmori overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {users.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#E040FB] text-sm font-bold text-white">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{u.artist_name || u.name}</p>
                          <span className={`text-xs capitalize ${roleColor(u.role)}`}>{u.role}</span>
                          <span className={`rounded-full px-2 py-1 text-[11px] capitalize ${planColor(u.plan)}`}>{u.plan}</span>
                        </div>
                        <p className="mt-1 break-words text-xs text-gray-400">{u.email}</p>
                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                          <span>{u.release_count} releases</span>
                          <span>{new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={`/admin/users/${u.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E53935]/20 bg-[#E53935]/10 px-3 text-xs font-semibold text-[#E53935]" data-testid={`view-user-${u.id}`}>
                        View Profile
                      </Link>
                      <button onClick={() => openEdit(u)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[#7C4DFF]/20 bg-[#7C4DFF]/10 px-3 text-xs font-semibold text-[#7C4DFF]" data-testid={`edit-user-${u.id}`}>
                        <PencilSimple className="w-3.5 h-3.5" /> Edit
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => setDeleteTarget(u)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-semibold text-red-400" data-testid={`delete-user-${u.id}`}>
                          <Trash className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full" data-testid="users-table">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Role</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Plan</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Releases</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Joined</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#E040FB] flex items-center justify-center text-xs font-bold text-white">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.artist_name || u.name}</p>
                              <p className="text-xs text-gray-500">{u.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">{u.email}</td>
                        <td className="py-3 px-4 text-sm capitalize"><span className={roleColor(u.role)}>{u.role}</span></td>
                        <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full capitalize ${planColor(u.plan)}`}>{u.plan}</span></td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-400">{u.release_count}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/users/${u.id}`} className="text-xs text-[#E53935] hover:underline flex items-center gap-1" data-testid={`view-user-${u.id}`}>
                              View
                            </Link>
                            <button onClick={() => openEdit(u)} className="text-xs text-[#7C4DFF] hover:underline flex items-center gap-1" data-testid={`edit-user-${u.id}`}>
                              <PencilSimple className="w-3.5 h-3.5" /> Edit
                            </button>
                            {u.role !== 'admin' && (
                              <button onClick={() => setDeleteTarget(u)} className="text-xs text-red-500 hover:underline flex items-center gap-1" data-testid={`delete-user-${u.id}`}>
                                <Trash className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {pages > 1 && (
            <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">{total} total users</p>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchUsers(page - 1, search)} disabled={page <= 1} className="touch-target rounded-xl p-1 text-gray-400 hover:text-white disabled:opacity-30"><CaretLeft className="w-5 h-5" /></button>
                <span className="text-sm text-gray-400">Page {page} of {pages}</span>
                <button onClick={() => fetchUsers(page + 1, search)} disabled={page >= pages} className="touch-target rounded-xl p-1 text-gray-400 hover:text-white disabled:opacity-30"><CaretRight className="w-5 h-5" /></button>
              </div>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editUser && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4" data-testid="edit-user-modal">
            <div className="absolute inset-0 bg-black/70" onClick={() => setEditUser(null)} />
            <div className="relative w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#111] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Edit User</h2>
                <button onClick={() => setEditUser(null)} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="text-sm text-gray-400 bg-white/5 p-3 rounded-lg">
                <p className="font-medium text-white">{editUser.artist_name || editUser.name}</p>
                <p>{editUser.email}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full p-2 rounded-lg text-sm" data-testid="edit-role-select">
                    <option value="artist">Artist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Plan</label>
                  <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full p-2 rounded-lg text-sm" data-testid="edit-plan-select">
                    <option value="free">Free</option>
                    <option value="rise">Rise</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full p-2 rounded-lg text-sm" data-testid="edit-status-select">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button onClick={() => setEditUser(null)} variant="outline" className="flex-1 border-white/10 text-gray-400">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#E53935] hover:bg-[#d32f2f] text-white" data-testid="save-user-btn">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4" data-testid="delete-user-modal">
            <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteTarget(null)} />
            <div className="relative w-full max-w-md space-y-5 rounded-2xl border border-red-500/30 bg-[#111] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <WarningCircle className="w-6 h-6 text-red-500" weight="fill" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Delete User Account</h2>
                  <p className="text-xs text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-2">
                <p className="text-sm text-white font-medium">{deleteTarget.artist_name || deleteTarget.name}</p>
                <p className="text-xs text-gray-400">{deleteTarget.email}</p>
                <p className="text-xs text-red-400 mt-2">This will permanently delete the user and ALL their data including releases, tracks, beats, messages, analytics, and wallet information.</p>
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button onClick={() => setDeleteTarget(null)} variant="outline" className="flex-1 border-white/10 text-gray-400">Cancel</Button>
                <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white" data-testid="confirm-delete-user-btn">
                  {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
