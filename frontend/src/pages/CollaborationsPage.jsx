import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { UsersThree, PaperPlaneTilt, Check, X, MusicNotes, Percent, UserPlus, Crown, Guitar, Microphone, Sparkle } from '@phosphor-icons/react';
import { getSafeErrorDetail } from '../utils/error';

const ROLE_OPTIONS = ['Featured Artist', 'Producer', 'Songwriter', 'Mixer', 'Vocalist', 'Other'];

const STATUS_STYLES = {
  pending: { bg: 'bg-[#FFD700]/15', text: 'text-[#FFD700]', label: 'Pending' },
  accepted: { bg: 'bg-[#4CAF50]/15', text: 'text-[#4CAF50]', label: 'Accepted' },
  declined: { bg: 'bg-[#F44336]/15', text: 'text-[#F44336]', label: 'Declined' },
};

export default function CollaborationsPage() {
  const { user } = useAuth();
  const canManageCollaborations = (user?.plan || 'free') !== 'free';
  const [owned, setOwned] = useState([]);
  const [collaboratingOn, setCollaboratingOn] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    release_id: '', collaborator_email: '', collaborator_name: '', role: 'Featured Artist', split_percentage: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [collabRes, inviteRes, releasesRes] = await Promise.all([
        axios.get(`${API}/collaborations`, { withCredentials: true }),
        axios.get(`${API}/collaborations/invitations`, { withCredentials: true }),
        axios.get(`${API}/releases`, { withCredentials: true }).catch(() => ({ data: [] })),
      ]);
      setOwned(collabRes.data.owned || []);
      setCollaboratingOn(collabRes.data.collaborating_on || []);
      setInvitations(inviteRes.data.invitations || []);
      const relData = Array.isArray(releasesRes.data) ? releasesRes.data : releasesRes.data.releases || [];
      setReleases(relData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.release_id || !inviteData.collaborator_email || !inviteData.collaborator_name) {
      return toast.error('Fill in all required fields');
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/collaborations/invite`, inviteData, { withCredentials: true });
      toast.success('Invitation sent!');
      setShowInviteForm(false);
      setInviteData({ release_id: '', collaborator_email: '', collaborator_name: '', role: 'Featured Artist', split_percentage: 10 });
      fetchAll();
    } catch (err) {
      toast.error(getSafeErrorDetail(err, 'Failed to send invite'));
    } finally { setSubmitting(false); }
  };

  const handleInvitation = async (id, action) => {
    try {
      await axios.put(`${API}/collaborations/${id}/${action}`, {}, { withCredentials: true });
      toast.success(`Invitation ${action}ed`);
      fetchAll();
    } catch (err) { toast.error(getSafeErrorDetail(err, 'Failed')); }
  };

  const removeCollab = async (id) => {
    if (!window.confirm('Remove this collaborator?')) return;
    try {
      await axios.delete(`${API}/collaborations/${id}`, { withCredentials: true });
      toast.success('Collaborator removed');
      fetchAll();
    } catch (err) { toast.error(getSafeErrorDetail(err, 'Failed')); }
  };

  const groupedByRelease = owned.reduce((acc, c) => {
    const key = c.release_id;
    if (!acc[key]) acc[key] = { title: c.release_title, collabs: [] };
    acc[key].collabs.push(c);
    return acc;
  }, {});

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="collaborations-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Collaborations</h1>
            <p className="text-gray-400 mt-1">
              {canManageCollaborations ? 'Manage collaborators and royalty splits' : 'Review your invitations and the releases you collaborate on'}
            </p>
          </div>
          {canManageCollaborations ? (
            <Button onClick={() => setShowInviteForm(!showInviteForm)} className="btn-animated rounded-full gap-2" data-testid="invite-collaborator-btn">
              <UserPlus className="w-4 h-4" /> Invite
            </Button>
          ) : (
            <div className="rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFD700]">
              Participate Only
            </div>
          )}
        </div>

        {!canManageCollaborations && (
          <div className="rounded-2xl border border-[#7C4DFF]/20 bg-[#7C4DFF]/10 p-5" data-testid="collaborations-participation-note">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-[#7C4DFF]/15 p-2 text-[#C6B2FF]">
                <Crown className="w-4 h-4" weight="fill" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">You can join collaborations on the Free plan.</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-300">
                  Accept or decline invites and track releases you are part of. Upgrade to Rise or Pro to send invites, manage collaborators, and control royalty splits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#FFD700] tracking-[2px]">PENDING INVITATIONS</h2>
            {invitations.map(inv => (
              <div key={inv.id} className="bg-[#111] border border-[#FFD700]/20 rounded-2xl p-5" data-testid={`invitation-${inv.id}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{inv.owner_name} invited you to collaborate on <span className="text-[#E040FB] font-bold">"{inv.release_title}"</span></p>
                    <p className="text-sm text-gray-400 mt-1">Role: {inv.role} | Split: {inv.split_percentage}%</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleInvitation(inv.id, 'accept')} className="bg-[#4CAF50] hover:bg-[#4CAF50]/80 rounded-full gap-1" data-testid={`accept-${inv.id}`}>
                      <Check className="w-4 h-4" weight="bold" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleInvitation(inv.id, 'decline')} className="rounded-full gap-1 border-[#F44336]/30 text-[#F44336] hover:bg-[#F44336]/10" data-testid={`decline-${inv.id}`}>
                      <X className="w-4 h-4" weight="bold" /> Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invite Form */}
        {canManageCollaborations && showInviteForm && (
          <form onSubmit={sendInvite} className="bg-[#111] border border-[#7C4DFF]/30 rounded-2xl p-6 space-y-4" data-testid="invite-form">
            <h2 className="text-lg font-bold flex items-center gap-2"><PaperPlaneTilt className="w-5 h-5 text-[#7C4DFF]" /> Send Collaboration Invite</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Release</Label>
                <select value={inviteData.release_id} onChange={e => setInviteData(p => ({ ...p, release_id: e.target.value }))}
                  className="w-full mt-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" data-testid="invite-release-select">
                  <option value="">Select a release...</option>
                  {releases.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
              <div>
                <Label>Collaborator Name</Label>
                <Input value={inviteData.collaborator_name} onChange={e => setInviteData(p => ({ ...p, collaborator_name: e.target.value }))}
                  placeholder="Artist name" className="mt-1 bg-[#0a0a0a] border-white/10" data-testid="invite-name-input" />
              </div>
              <div>
                <Label>Collaborator Email</Label>
                <Input type="email" value={inviteData.collaborator_email} onChange={e => setInviteData(p => ({ ...p, collaborator_email: e.target.value }))}
                  placeholder="email@example.com" className="mt-1 bg-[#0a0a0a] border-white/10" data-testid="invite-email-input" />
              </div>
              <div>
                <Label>Role</Label>
                <select value={inviteData.role} onChange={e => setInviteData(p => ({ ...p, role: e.target.value }))}
                  className="w-full mt-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm" data-testid="invite-role-select">
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label>Royalty Split %</Label>
                <Input type="number" min="0" max="100" step="0.5" value={inviteData.split_percentage}
                  onChange={e => setInviteData(p => ({ ...p, split_percentage: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 bg-[#0a0a0a] border-white/10" data-testid="invite-split-input" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="btn-animated rounded-full gap-2" data-testid="send-invite-btn">
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PaperPlaneTilt className="w-4 h-4" />}
                Send Invite
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)} className="rounded-full">Cancel</Button>
            </div>
          </form>
        )}

        {/* My Collaborations (as owner) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#7C4DFF] tracking-[2px]">MY RELEASES - COLLABORATORS</h2>
          {Object.keys(groupedByRelease).length === 0 ? (
            <div className="card-kalmori p-8 text-center">
              <UsersThree className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {canManageCollaborations
                  ? 'No collaborators yet. Invite artists to your releases!'
                  : 'No owned collaboration records yet. Upgrade when you are ready to invite collaborators to your releases.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedByRelease).map(([releaseId, { title, collabs }]) => {
              const totalSplit = collabs.filter(c => c.status !== 'declined').reduce((s, c) => s + (c.split_percentage || 0), 0);
              return (
                <div key={releaseId} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden" data-testid={`release-collabs-${releaseId}`}>
                  <div className="p-4 bg-[#0a0a0a] flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <MusicNotes className="w-5 h-5 text-[#E040FB]" />
                      <span className="font-bold text-white">{title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">Your split: <span className="text-[#4CAF50] font-bold">{100 - totalSplit}%</span></span>
                      <div className="w-24 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB]" style={{ width: `${totalSplit}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{totalSplit}% split</span>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {collabs.map(c => {
                      const style = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
                      return (
                        <div key={c.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#7C4DFF]/20 flex items-center justify-center text-sm font-bold text-[#7C4DFF]">
                              {(c.collaborator_name || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{c.collaborator_name}</p>
                              <p className="text-xs text-gray-500">{c.collaborator_email} | {c.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-[#E040FB] font-bold">{c.split_percentage}%</span>
                            <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{style.label}</span>
                            {canManageCollaborations && (
                              <button onClick={() => removeCollab(c.id)} className="text-gray-600 hover:text-[#F44336] transition-colors" data-testid={`remove-collab-${c.id}`}>
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Collaborations I'm Part Of */}
        {collaboratingOn.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#E040FB] tracking-[2px]">COLLABORATING ON</h2>
            {collaboratingOn.map(c => {
              const style = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
              return (
                <div key={c.id} className="bg-[#111] border border-white/10 rounded-2xl p-5" data-testid={`my-collab-${c.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{c.release_title} <span className="text-gray-500">by</span> <span className="text-[#7C4DFF]">{c.owner_name}</span></p>
                      <p className="text-xs text-gray-400 mt-1">Role: {c.role} | Split: {c.split_percentage}%</p>
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider px-3 py-1 rounded-full ${style.bg} ${style.text}`}>{style.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
