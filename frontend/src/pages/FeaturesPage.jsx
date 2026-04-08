import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Lightning, Star, Lock, ArrowRight, Crown, Sparkle, ShieldCheck, ChartLineUp, MusicNotes, Users, Globe, CurrencyDollar, Target, Headphones, Trophy, ChatCircleDots } from '@phosphor-icons/react';
import { toast } from 'sonner';

const ICON_MAP = {
  Lightning, Star, ShieldCheck, ChartLineUp, MusicNotes, Users, Globe, CurrencyDollar, Target, Headphones, Trophy, ChatCircleDots, Sparkle, Crown,
};

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/features`, { withCredentials: true })
      .then(r => setFeatures(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const available = features.filter(f => f.has_access);
  const locked = features.filter(f => !f.has_access);

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="features-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white" data-testid="features-heading">What's New</h1>
          <p className="text-sm text-gray-500 mt-1">Latest features and updates on Kalmori</p>
        </div>

        {features.length === 0 && (
          <div className="text-center py-16">
            <Sparkle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No feature announcements yet. Check back soon!</p>
          </div>
        )}

        {/* Available Features */}
        {available.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Available on Your Plan</h2>
              <span className="text-[10px] bg-[#1DB954]/10 text-[#1DB954] px-2 py-0.5 rounded-full font-bold">{user?.plan?.toUpperCase() || 'FREE'}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {available.map(f => {
                const Icon = ICON_MAP[f.icon] || Star;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate(f.action_url || '/dashboard')}
                    className="bg-[#141414] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all group text-left w-full"
                    data-testid={`feature-${f.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}15`, color: f.color }}>
                        <Icon className="w-5 h-5" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{f.title}</h3>
                          <span className="text-[9px] bg-[#1DB954]/10 text-[#1DB954] px-1.5 py-0.5 rounded font-bold flex-shrink-0">ACTIVE</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{f.description}</p>
                        <p className="text-[10px] text-gray-600 mt-2">{new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#E040FB]">
                          Click to view <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Features */}
        {locked.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-3.5 h-3.5 text-[#FFD700]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Upgrade to Unlock</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {locked.map(f => {
                const Icon = ICON_MAP[f.icon] || Star;
                return (
                  <div key={f.id} className="bg-[#141414] border border-white/5 rounded-xl p-5 opacity-80 hover:opacity-100 transition-all relative overflow-hidden" data-testid={`feature-locked-${f.id}`}>
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] bg-[#FFD700]/10 text-[#FFD700] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" weight="fill" /> {f.upgrade_plan}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 opacity-50" style={{ backgroundColor: `${f.color}15`, color: f.color }}>
                        <Icon className="w-5 h-5" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white/70 truncate">{f.title}</h3>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{f.description}</p>
                        <button onClick={() => navigate('/pricing')}
                          className="btn-kalmori-gold mt-3 px-3 py-2 rounded-full text-[11px] font-bold flex items-center gap-1" data-testid={`upgrade-${f.id}`}>
                          Upgrade to {f.upgrade_plan} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
