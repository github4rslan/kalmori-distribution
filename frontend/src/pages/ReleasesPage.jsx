import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import {
  Disc, Plus, MagnifyingGlass, CheckCircle, Clock, Warning,
  XCircle, ArrowRight, Radio,
} from '@phosphor-icons/react';

const STATUS_CFG = {
  distributed:    { label: 'Live',           color: '#22C55E', bg: 'bg-[#22C55E]/10', icon: CheckCircle },
  pending_review: { label: 'Under Review',   color: '#FFD700', bg: 'bg-[#FFD700]/10', icon: Clock },
  processing:     { label: 'Processing',     color: '#FF9500', bg: 'bg-[#FF9500]/10', icon: Radio },
  rejected:       { label: 'Rejected',       color: '#EF4444', bg: 'bg-[#EF4444]/10', icon: XCircle },
  draft:          { label: 'Draft',          color: '#A1A1AA', bg: 'bg-white/8',      icon: Warning },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg}`} style={{ color: cfg.color }}>
      <Icon className="w-3 h-3" weight={status === 'distributed' ? 'fill' : 'regular'} />
      {cfg.label}
    </span>
  );
};

const FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'distributed',  label: 'Live' },
  { value: 'pending_review', label: 'Under Review' },
  { value: 'processing',   label: 'Processing' },
  { value: 'rejected',     label: 'Rejected' },
  { value: 'draft',        label: 'Draft' },
];

const ReleasesPage = () => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchReleases(); }, []);

  const fetchReleases = async () => {
    try {
      const res = await axios.get(`${API}/releases`);
      setReleases(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = releases.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // counts for filter tabs
  const counts = FILTERS.reduce((acc, f) => {
    acc[f.value] = f.value === 'all' ? releases.length : releases.filter(r => r.status === f.value).length;
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
      <div className="space-y-5" data-testid="releases-page">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Releases</h1>
            <p className="text-sm text-[#A1A1AA] mt-0.5">
              {releases.length} release{releases.length !== 1 ? 's' : ''} · {releases.filter(r => r.status === 'distributed').length} live
            </p>
          </div>
          <Link to="/releases/new">
            <Button className="bg-[#7C4DFF] hover:bg-[#7C4DFF]/90 text-white h-9 text-sm" data-testid="create-release-btn">
              <Plus className="w-4 h-4 mr-1.5" /> New Release
            </Button>
          </Link>
        </div>

        {/* Search + Filter tabs */}
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              placeholder="Search releases…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#111] border border-white/10 rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#7C4DFF] transition-colors"
              data-testid="search-releases-input"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.filter(f => counts[f.value] > 0 || f.value === 'all').map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === f.value
                    ? 'bg-[#7C4DFF] text-white'
                    : 'bg-[#111] border border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/20'
                }`}
                data-testid={`filter-${f.value}`}
              >
                {f.label}
                {counts[f.value] > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === f.value ? 'bg-white/20' : 'bg-white/8'}`}>
                    {counts[f.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
            <Disc className="w-14 h-14 text-[#222] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">
              {releases.length === 0 ? 'No releases yet' : 'No matches'}
            </h3>
            <p className="text-sm text-[#A1A1AA] mb-6">
              {releases.length === 0
                ? 'Create your first release to start distributing your music'
                : 'Try adjusting your search or filter'}
            </p>
            {releases.length === 0 && (
              <Link to="/releases/new">
                <Button className="bg-[#7C4DFF] hover:bg-[#7C4DFF]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Create Release
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(release => {
              const cfg = STATUS_CFG[release.status] || STATUS_CFG.draft;
              return (
                <Link
                  key={release.id}
                  to={`/releases/${release.id}`}
                  className="group flex items-center gap-4 bg-[#111] border border-white/8 rounded-2xl p-3 sm:p-4 hover:border-[#7C4DFF]/40 hover:bg-[#7C4DFF]/3 transition-all"
                  data-testid={`release-row-${release.id}`}
                >
                  {/* Cover */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a] border border-white/8">
                    {release.cover_art_url
                      ? <img src={release.cover_art_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Disc className="w-5 h-5 text-[#333]" /></div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{release.title}</p>
                      <span className="text-[10px] text-[#555] capitalize hidden sm:inline">{release.release_type}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <StatusBadge status={release.status} />
                      {release.status === 'distributed' && release.track_count > 0 && (
                        <span className="text-[11px] text-[#555]">{release.track_count} track{release.track_count !== 1 ? 's' : ''}</span>
                      )}
                      {release.status === 'rejected' && release.rejection_reason && (
                        <span className="text-[11px] text-[#EF4444] truncate max-w-[200px]">{release.rejection_reason}</span>
                      )}
                      {release.status === 'pending_review' && (
                        <span className="text-[11px] text-[#555]">Awaiting admin review</span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {release.upc && (
                      <span className="text-[10px] font-mono text-[#444] hidden lg:block">{release.upc}</span>
                    )}
                    <span className="text-[11px] text-[#555] hidden sm:block">
                      {release.release_date || (release.created_at ? new Date(release.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#7C4DFF] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReleasesPage;
