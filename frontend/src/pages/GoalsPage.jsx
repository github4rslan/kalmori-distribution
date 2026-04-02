import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { Target, Trophy, Plus, Trash, CalendarBlank, Clock, Check, Fire, X, SpinnerGap, ChartLineUp, Globe, CurrencyDollar, MusicNote, UsersThree, Megaphone } from '@phosphor-icons/react';
import { toast } from 'sonner';

const GOAL_ICONS = {
  streams: <ChartLineUp className="w-5 h-5" />,
  monthly_streams: <Fire className="w-5 h-5" />,
  countries: <Globe className="w-5 h-5" />,
  revenue: <CurrencyDollar className="w-5 h-5" />,
  releases: <MusicNote className="w-5 h-5" />,
  presave_subs: <Megaphone className="w-5 h-5" />,
  collaborations: <UsersThree className="w-5 h-5" />,
};

const GOAL_COLORS = {
  streams: '#7C4DFF', monthly_streams: '#E040FB', countries: '#1DB954',
  revenue: '#FFD700', releases: '#FF6B6B', presave_subs: '#00BCD4', collaborations: '#FF9800',
};

const GOAL_TYPES = [
  { key: 'streams', label: 'Total Streams', unit: 'streams', presets: [1000, 5000, 10000, 50000, 100000] },
  { key: 'monthly_streams', label: 'Monthly Streams', unit: 'streams/mo', presets: [500, 1000, 5000, 10000] },
  { key: 'countries', label: 'Countries Reached', unit: 'countries', presets: [3, 5, 10, 20] },
  { key: 'revenue', label: 'Revenue Earned', unit: 'USD', presets: [10, 50, 100, 500, 1000] },
  { key: 'releases', label: 'Releases Published', unit: 'releases', presets: [5, 10, 25, 50] },
  { key: 'presave_subs', label: 'Pre-Save Subscribers', unit: 'subs', presets: [10, 50, 100, 500] },
  { key: 'collaborations', label: 'Collaborations', unit: 'collabs', presets: [1, 3, 5, 10] },
];

export default function GoalsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGoal, setNewGoal] = useState({ goal_type: 'streams', target_value: 10000, title: '', deadline: '' });
  const [celebrated, setCelebrated] = useState([]);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API}/goals`, { withCredentials: true });
      setData(res.data);
      if (res.data.newly_completed?.length > 0) {
        setCelebrated(res.data.newly_completed);
        res.data.newly_completed.forEach(() => toast.success('Goal achieved! Congratulations!'));
        setTimeout(() => setCelebrated([]), 5000);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createGoal = async () => {
    setCreating(true);
    try {
      await axios.post(`${API}/goals`, {
        goal_type: newGoal.goal_type,
        target_value: parseFloat(newGoal.target_value) || 1,
        title: newGoal.title || null,
        deadline: newGoal.deadline || null,
      }, { withCredentials: true });
      toast.success('Goal created!');
      setShowCreate(false);
      setNewGoal({ goal_type: 'streams', target_value: 10000, title: '', deadline: '' });
      fetchGoals();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create goal');
    } finally { setCreating(false); }
  };

  const deleteGoal = async (id) => {
    try {
      await axios.delete(`${API}/goals/${id}`, { withCredentials: true });
      toast.success('Goal removed');
      setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
    } catch (err) { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const active = (data?.goals || []).filter(g => g.status === 'active');
  const completed = (data?.goals || []).filter(g => g.status === 'completed');
  const metrics = data?.current_metrics || {};

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="goals-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-[#7C4DFF]" weight="fill" /> Goals & Milestones
            </h1>
            <p className="text-gray-400 mt-1">
              {active.length} active goal{active.length !== 1 ? 's' : ''} | {completed.length} completed
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
            data-testid="create-goal-btn"
          >
            {showCreate ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showCreate ? 'Cancel' : 'New Goal'}
          </button>
        </div>

        {/* Current Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3" data-testid="current-metrics">
          {GOAL_TYPES.map(gt => (
            <div key={gt.key} className="bg-[#111] border border-white/10 rounded-xl p-3 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center" style={{ backgroundColor: `${GOAL_COLORS[gt.key]}15`, color: GOAL_COLORS[gt.key] }}>
                {GOAL_ICONS[gt.key]}
              </div>
              <p className="text-lg font-bold font-mono text-white">{(metrics[gt.key] || 0).toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">{gt.label}</p>
            </div>
          ))}
        </div>

        {/* Create Goal Form */}
        {showCreate && (
          <div className="bg-gradient-to-br from-[#1a0a2e] to-[#111] border border-[#7C4DFF]/30 rounded-2xl p-6 space-y-4" data-testid="create-goal-form">
            <h2 className="text-base font-bold text-white">Set a New Goal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Goal Type</label>
                <select
                  value={newGoal.goal_type}
                  onChange={e => {
                    const gt = GOAL_TYPES.find(t => t.key === e.target.value);
                    setNewGoal({ ...newGoal, goal_type: e.target.value, target_value: gt?.presets[2] || 1000 });
                  }}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C4DFF]/50"
                  data-testid="goal-type-select"
                >
                  {GOAL_TYPES.map(gt => (
                    <option key={gt.key} value={gt.key}>{gt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Target ({GOAL_TYPES.find(t => t.key === newGoal.goal_type)?.unit})</label>
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={e => setNewGoal({ ...newGoal, target_value: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#7C4DFF]/50"
                  data-testid="goal-target-input"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {(GOAL_TYPES.find(t => t.key === newGoal.goal_type)?.presets || []).map(p => (
                    <button key={p} onClick={() => setNewGoal({ ...newGoal, target_value: p })}
                      className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${parseFloat(newGoal.target_value) === p ? 'bg-[#7C4DFF] text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                    >{p >= 1000 ? `${p/1000}k` : p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom Title (optional)</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Hit 10k on Spotify"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7C4DFF]/50"
                  data-testid="goal-title-input"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Deadline (optional)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C4DFF]/50"
                  data-testid="goal-deadline-input"
                />
              </div>
            </div>
            <button
              onClick={createGoal} disabled={creating}
              className="px-6 py-3 bg-[#7C4DFF] text-white font-semibold rounded-xl hover:bg-[#7C4DFF]/80 transition-colors flex items-center gap-2 disabled:opacity-50"
              data-testid="submit-goal-btn"
            >
              {creating ? <SpinnerGap className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              Create Goal
            </button>
          </div>
        )}

        {/* Active Goals */}
        {active.length > 0 && (
          <div className="space-y-3" data-testid="active-goals">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Fire className="w-5 h-5 text-orange-400" weight="fill" /> Active Goals
            </h2>
            {active.map(g => <GoalCard key={g.id} goal={g} onDelete={deleteGoal} isCelebrating={celebrated.includes(g.id)} />)}
          </div>
        )}

        {/* Completed Goals */}
        {completed.length > 0 && (
          <div className="space-y-3" data-testid="completed-goals">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FFD700]" weight="fill" /> Completed Milestones
            </h2>
            {completed.map(g => <GoalCard key={g.id} goal={g} onDelete={deleteGoal} />)}
          </div>
        )}

        {/* Empty State */}
        {active.length === 0 && completed.length === 0 && !showCreate && (
          <div className="text-center py-16" data-testid="goals-empty">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-400 mb-1">No goals yet</h3>
            <p className="text-sm text-gray-600 mb-4">Set your first goal to start tracking your progress</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-[#7C4DFF] text-white font-semibold rounded-xl hover:bg-[#7C4DFF]/80 transition-colors">
              Set Your First Goal
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function GoalCard({ goal, onDelete, isCelebrating }) {
  const g = goal;
  const color = GOAL_COLORS[g.goal_type] || '#7C4DFF';
  const isComplete = g.completed || g.status === 'completed';

  return (
    <div
      className={`bg-[#111] border rounded-2xl p-5 transition-all ${isComplete ? 'border-[#FFD700]/30 bg-[#FFD700]/[0.02]' : 'border-white/10'} ${isCelebrating ? 'ring-2 ring-[#FFD700] animate-pulse' : ''}`}
      data-testid={`goal-card-${g.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, color }}>
          {isComplete ? <Trophy className="w-5 h-5 text-[#FFD700]" weight="fill" /> : GOAL_ICONS[g.goal_type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-white truncate">{g.title}</h3>
            {isComplete && (
              <span className="flex items-center gap-1 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" data-testid={`milestone-badge-${g.id}`}>
                <Check className="w-3 h-3" weight="bold" /> ACHIEVED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
            <span style={{ color }}>{g.goal_label}</span>
            {g.deadline && (
              <span className="flex items-center gap-1">
                <CalendarBlank className="w-3 h-3" />
                {g.days_left !== null && g.days_left !== undefined ? (
                  g.days_left === 0 ? <span className="text-red-400">Due today</span> : <span>{g.days_left}d left</span>
                ) : g.deadline}
              </span>
            )}
            {g.completed_at && <span className="text-[#FFD700]">Completed {new Date(g.completed_at).toLocaleDateString()}</span>}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400 font-mono">{g.current_value?.toLocaleString()} / {g.target_value?.toLocaleString()} {g.unit}</span>
              <span className="font-bold font-mono" style={{ color: isComplete ? '#FFD700' : color }}>{g.progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${g.progress}%`, background: isComplete ? 'linear-gradient(90deg, #FFD700, #FFA000)' : `linear-gradient(90deg, ${color}, ${color}88)` }}
              />
            </div>
          </div>

          {/* Countdown for near-deadline active goals */}
          {!isComplete && g.days_left !== null && g.days_left !== undefined && g.days_left <= 7 && g.days_left > 0 && (
            <p className="text-[10px] text-orange-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {g.days_left} day{g.days_left !== 1 ? 's' : ''} remaining — {Math.round(g.target_value - g.current_value)} {g.unit} to go
            </p>
          )}
        </div>

        {/* Delete */}
        <button onClick={() => onDelete(g.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1" data-testid={`delete-goal-${g.id}`}>
          <Trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
