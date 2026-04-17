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
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8" data-testid="features-page">
        <div className="mobile-card overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.24),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-5 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#B58CFF]">Feature Feed</p>
              <h1 className="text-2xl font-black text-white sm:text-3xl" data-testid="features-heading">What's New</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">Latest features and updates on Kalmori, redesigned for quick scanning on mobile.</p>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Plan</p>
              <p className="mt-1 text-sm font-semibold text-white">{user?.plan?.toUpperCase() || 'FREE'}</p>
            </div>
          </div>
        </div>

        {features.length === 0 && (
          <div className="py-16 text-center">
            <Sparkle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No feature announcements yet. Check back soon!</p>
          </div>
        )}

        {/* Available Features */}
        {available.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Available on Your Plan</h2>
              <span className="text-[10px] bg-[#1DB954]/10 text-[#1DB954] px-2 py-0.5 rounded-full font-bold">{user?.plan?.toUpperCase() || 'FREE'}</span>
            </div>
            <div className="space-y-3">
              {available.map(f => {
                const Icon = ICON_MAP[f.icon] || Star;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate(f.action_url || '/dashboard')}
                    className="group w-full overflow-hidden rounded-2xl border border-white/10 bg-[#141414] text-left transition-all hover:border-white/20"
                    data-testid={`feature-${f.id}`}>
                    <div className="flex items-start gap-4 p-4 sm:p-5">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${f.color}15`, color: f.color }}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold leading-snug text-white sm:text-lg">{f.title}</h3>
                          <span className="text-[9px] bg-[#1DB954]/10 text-[#1DB954] px-1.5 py-0.5 rounded font-bold flex-shrink-0">ACTIVE</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-gray-300 sm:text-[15px]">{f.description}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] text-gray-500">{new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#E040FB]">
                          Click to view <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {locked.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#FFD700]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Upgrade to Unlock</h2>
            </div>
            <div className="space-y-3">
              {locked.map(f => {
                const Icon = ICON_MAP[f.icon] || Star;
                return (
                  <div key={f.id} className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#141414] p-4 opacity-90 transition-all hover:opacity-100 sm:p-5" data-testid={`feature-locked-${f.id}`}>
                    <div className="mb-3 flex justify-start sm:absolute sm:right-3 sm:top-3 sm:mb-0">
                      <span className="text-[9px] bg-[#FFD700]/10 text-[#FFD700] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" weight="fill" /> {f.upgrade_plan}
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl opacity-60" style={{ backgroundColor: `${f.color}15`, color: f.color }}>
                        <Icon className="w-5 h-5" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white/80 sm:pr-20">{f.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.description}</p>
                        <button onClick={() => navigate('/pricing')}
                          className="btn-kalmori-gold mt-4 rounded-full px-4 py-2 text-[11px] font-bold flex items-center gap-1" data-testid={`upgrade-${f.id}`}>
                          Upgrade to {f.upgrade_plan} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
