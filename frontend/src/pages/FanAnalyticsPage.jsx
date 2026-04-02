import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Users, Globe, ChartLineUp, Clock, TrendUp, MusicNote, Lightning, CalendarBlank, MapPin, Rocket, Star, Target, ArrowRight, SpinnerGap } from '@phosphor-icons/react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COUNTRY_NAMES = { US: 'United States', UK: 'United Kingdom', NG: 'Nigeria', DE: 'Germany', CA: 'Canada', AU: 'Australia', BR: 'Brazil', JP: 'Japan', FR: 'France', IN: 'India', JM: 'Jamaica', KE: 'Kenya', GH: 'Ghana', ZA: 'South Africa' };
const COUNTRY_FLAGS = { US: '\u{1F1FA}\u{1F1F8}', UK: '\u{1F1EC}\u{1F1E7}', NG: '\u{1F1F3}\u{1F1EC}', DE: '\u{1F1E9}\u{1F1EA}', CA: '\u{1F1E8}\u{1F1E6}', AU: '\u{1F1E6}\u{1F1FA}', BR: '\u{1F1E7}\u{1F1F7}', JP: '\u{1F1EF}\u{1F1F5}', FR: '\u{1F1EB}\u{1F1F7}', IN: '\u{1F1EE}\u{1F1F3}', JM: '\u{1F1EF}\u{1F1F2}', KE: '\u{1F1F0}\u{1F1EA}', GH: '\u{1F1EC}\u{1F1ED}', ZA: '\u{1F1FF}\u{1F1E6}' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function FanAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState(null);
  const [releaseTitle, setReleaseTitle] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/fan-analytics/overview`, { withCredentials: true });
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateStrategy = async () => {
    setStrategyLoading(true);
    setStrategyError(null);
    try {
      const res = await axios.post(`${API}/ai/release-strategy`, {
        release_title: releaseTitle || null,
        genre: genre || null,
      }, { withCredentials: true });
      setStrategy(res.data);
    } catch (err) {
      console.error(err);
      setStrategyError('Failed to generate strategy. Please try again.');
    } finally {
      setStrategyLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!data) return <DashboardLayout><p className="text-gray-400">Failed to load fan analytics.</p></DashboardLayout>;

  const totalStreams = data.platform_engagement.reduce((s, p) => s + p.streams, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="fan-analytics-page">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Fan Analytics</h1>
          <p className="text-gray-400 mt-1">Understand your audience — where they listen, when, and on which platforms</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-[#7C4DFF]" />} value={data.total_subscribers} label="Pre-Save Subs" color="#7C4DFF" />
          <StatCard icon={<Globe className="w-5 h-5 text-[#E040FB]" />} value={data.top_countries?.length || 0} label="Countries" color="#E040FB" />
          <StatCard icon={<MusicNote className="w-5 h-5 text-[#1DB954]" />} value={totalStreams.toLocaleString()} label="Total Streams" color="#1DB954" />
          <StatCard icon={<TrendUp className="w-5 h-5 text-[#FFD700]" />} value={data.total_campaigns} label="Campaigns" color="#FFD700" />
        </div>

        {/* Listener Growth Chart */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <ChartLineUp className="w-5 h-5 text-[#7C4DFF]" /> Listener Growth (30 Days)
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.listener_growth}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="listeners" stroke="#7C4DFF" fill="url(#growthGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Countries */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#E040FB]" /> Top Listener Countries
            </h2>
            <div className="space-y-3">
              {data.top_countries?.slice(0, 8).map((c, i) => (
                <div key={c.country} className="flex items-center gap-3" data-testid={`country-${c.country}`}>
                  <span className="text-lg w-8">{COUNTRY_FLAGS[c.country] || ''}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium">{COUNTRY_NAMES[c.country] || c.country}</span>
                      <span className="text-xs text-gray-400">{c.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB]" style={{ width: `${c.percentage}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono w-16 text-right">{c.streams.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Engagement */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <MusicNote className="w-5 h-5 text-[#1DB954]" /> Platform Engagement
            </h2>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.platform_engagement.slice(0, 6)} dataKey="streams" innerRadius={35} outerRadius={70} paddingAngle={2}>
                      {data.platform_engagement.slice(0, 6).map((p, i) => (
                        <Cell key={i} fill={p.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {data.platform_engagement?.slice(0, 6).map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-gray-300 flex-1">{p.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Peak Listening Hours */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFD700]" /> Peak Listening Hours (UTC)
          </h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peak_hours}>
                <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={v => `${v}:00`} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#FFD700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Best times to release new music and run campaigns</p>
        </div>

        {/* AI Release Strategy Section */}
        <div className="bg-gradient-to-br from-[#1a0a2e] to-[#111] border border-[#7C4DFF]/30 rounded-2xl p-6" data-testid="ai-strategy-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#7C4DFF]/20 flex items-center justify-center">
              <Lightning className="w-5 h-5 text-[#7C4DFF]" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Release Strategy</h2>
              <p className="text-xs text-gray-400">Get personalized release recommendations powered by your fan data</p>
            </div>
          </div>

          {!strategy && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Upcoming Release Title (optional)</label>
                  <input
                    type="text"
                    value={releaseTitle}
                    onChange={e => setReleaseTitle(e.target.value)}
                    placeholder="e.g. My New Single"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#7C4DFF]/50 focus:outline-none transition-colors"
                    data-testid="strategy-release-title"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Target Genre (optional)</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    placeholder="e.g. Hip-Hop, R&B"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#7C4DFF]/50 focus:outline-none transition-colors"
                    data-testid="strategy-genre"
                  />
                </div>
              </div>
              <button
                onClick={generateStrategy}
                disabled={strategyLoading}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="generate-strategy-btn"
              >
                {strategyLoading ? (
                  <>
                    <SpinnerGap className="w-5 h-5 animate-spin" />
                    Analyzing your audience data...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Generate AI Strategy
                  </>
                )}
              </button>
              {strategyError && <p className="text-red-400 text-sm" data-testid="strategy-error">{strategyError}</p>}
            </div>
          )}

          {strategy && <AIStrategyResults strategy={strategy} onReset={() => setStrategy(null)} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function AIStrategyResults({ strategy, onReset }) {
  const s = strategy.strategy;
  const summary = strategy.data_summary;

  const priorityColor = (p) => {
    if (p === 'high') return 'text-green-400 bg-green-400/10';
    if (p === 'medium') return 'text-yellow-400 bg-yellow-400/10';
    return 'text-gray-400 bg-gray-400/10';
  };

  return (
    <div className="space-y-5 animate-in fade-in" data-testid="strategy-results">
      {/* Data Summary Bar */}
      {summary && (
        <div className="flex flex-wrap gap-3 text-xs">
          {summary.total_streams > 0 && (
            <span className="bg-[#7C4DFF]/10 text-[#7C4DFF] px-3 py-1 rounded-full">{summary.total_streams.toLocaleString()} streams analyzed</span>
          )}
          {summary.top_platform && (
            <span className="bg-[#1DB954]/10 text-[#1DB954] px-3 py-1 rounded-full">Top: {summary.top_platform}</span>
          )}
          {summary.top_country && (
            <span className="bg-[#E040FB]/10 text-[#E040FB] px-3 py-1 rounded-full">Top Market: {summary.top_country}</span>
          )}
          {summary.peak_hour !== null && summary.peak_hour !== undefined && (
            <span className="bg-[#FFD700]/10 text-[#FFD700] px-3 py-1 rounded-full">Peak: {summary.peak_hour}:00 UTC</span>
          )}
        </div>
      )}

      {/* Optimal Release Timing */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarBlank className="w-5 h-5 text-[#7C4DFF]" />
          <h3 className="font-semibold text-white">Optimal Release Window</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <div className="bg-[#7C4DFF]/5 border border-[#7C4DFF]/20 rounded-lg p-3">
            <p className="text-xs text-gray-400">Best Day</p>
            <p className="text-lg font-bold text-[#7C4DFF]" data-testid="optimal-day">{s.optimal_release_day}</p>
          </div>
          <div className="bg-[#E040FB]/5 border border-[#E040FB]/20 rounded-lg p-3">
            <p className="text-xs text-gray-400">Best Time</p>
            <p className="text-lg font-bold text-[#E040FB]" data-testid="optimal-time">{s.optimal_release_time}</p>
          </div>
        </div>
        <p className="text-sm text-gray-300">{s.release_day_reasoning}</p>
      </div>

      {/* Target Platforms */}
      {s.target_platforms?.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-[#1DB954]" />
            <h3 className="font-semibold text-white">Platform Strategy</h3>
          </div>
          <div className="space-y-3">
            {s.target_platforms.map((p, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#111] border border-white/5 rounded-lg p-3" data-testid={`platform-strategy-${i}`}>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-0.5 ${priorityColor(p.priority)}`}>{p.priority}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{p.platform}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.tactic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geographic Strategy */}
      {s.geographic_strategy?.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-[#E040FB]" />
            <h3 className="font-semibold text-white">Geographic Targeting</h3>
          </div>
          <div className="space-y-2">
            {s.geographic_strategy.map((g, i) => (
              <div key={i} className="flex items-start gap-2" data-testid={`geo-strategy-${i}`}>
                <ArrowRight className="w-4 h-4 text-[#E040FB] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-white">{g.region}:</span>
                  <span className="text-sm text-gray-400 ml-1">{g.tactic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Release Timeline */}
      {s.pre_release_timeline?.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-[#FFD700]" />
            <h3 className="font-semibold text-white">Pre-Release Timeline</h3>
          </div>
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-[#7C4DFF] via-[#E040FB] to-[#FFD700]" />
            <div className="space-y-4">
              {s.pre_release_timeline.sort((a, b) => b.days_before - a.days_before).map((t, i) => (
                <div key={i} className="flex items-start gap-4 pl-1" data-testid={`timeline-${i}`}>
                  <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border-2 border-[#7C4DFF] flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-[10px] font-bold text-[#7C4DFF]">
                      {t.days_before === 0 ? 'D' : `-${t.days_before}`}
                    </span>
                  </div>
                  <div className="pt-1.5">
                    <p className="text-xs text-gray-500 font-mono">
                      {t.days_before === 0 ? 'Release Day' : `${t.days_before} days before`}
                    </p>
                    <p className="text-sm text-white">{t.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promotion Tips */}
      {s.promotion_tips?.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-[#FFD700]" weight="fill" />
            <h3 className="font-semibold text-white">Promotion Tips</h3>
          </div>
          <ul className="space-y-2">
            {s.promotion_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300" data-testid={`promo-tip-${i}`}>
                <span className="text-[#FFD700] mt-1 flex-shrink-0">*</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Estimated Range + Confidence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {s.estimated_first_week_range && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Estimated First Week</p>
            <p className="text-base font-bold text-white" data-testid="estimated-range">{s.estimated_first_week_range}</p>
          </div>
        )}
        {s.confidence_note && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Confidence Note</p>
            <p className="text-xs text-gray-300" data-testid="confidence-note">{s.confidence_note}</p>
          </div>
        )}
      </div>

      {/* Regenerate button */}
      <button
        onClick={onReset}
        className="text-sm text-[#7C4DFF] hover:text-[#E040FB] transition-colors flex items-center gap-1"
        data-testid="regenerate-strategy-btn"
      >
        <Lightning className="w-4 h-4" /> Generate a new strategy
      </button>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold font-mono">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
