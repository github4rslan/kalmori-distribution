import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import GlobalFooter from '../components/GlobalFooter';
import { useAuth } from '../App';
import { Check, ArrowRight, Star, Crown, Lightning, Rocket, ShieldCheck } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const plans = [
  {
    id: 'free', name: 'Free', price: 0, period: '',
    desc: 'Start distributing for free with revenue share',
    badge: 'FREE', badge_color: 'green', highlight: false,
    icon: <Lightning className="w-6 h-6" />,
    features: ['1 release per year', '15-20% revenue share', 'Basic analytics', 'Standard support', 'Free ISRC codes'],
  },
  {
    id: 'rise', name: 'Rise', price: 9.99, period: '/mo',
    desc: 'Keep 100% of your royalties',
    badge: 'POPULAR', badge_color: 'purple', highlight: false,
    icon: <Rocket className="w-6 h-6" />,
    features: ['Unlimited releases', '100% royalties', 'All 150+ stores', 'Free ISRC & UPC codes', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'pro', name: 'Pro', price: 19.99, period: '/mo',
    desc: 'Everything you need to grow your career',
    badge: 'BEST VALUE', badge_color: 'gold', highlight: true,
    icon: <Crown className="w-6 h-6" />,
    features: ['Everything in Rise', 'YouTube Content ID', 'Spotify Canvas uploads', 'Spotify playlist pitching', 'AI metadata suggestions', 'Split payments', 'Dedicated support'],
  },
];

const badgeGradients = {
  gold: 'from-[#FFD700] to-[#FFA500]',
  green: 'from-[#4CAF50] to-[#2E7D32]',
  purple: 'from-[#7C4DFF] to-[#E040FB]',
};

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upgrading, setUpgrading] = useState(null);

  const currentPlan = user?.plan || 'free';
  const planOrder = ['free', 'rise', 'pro'];

  const handlePlanAction = async (planId) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (planId === currentPlan) return;

    setUpgrading(planId);
    try {
      // For paid plans, create Stripe checkout
      if (planId !== 'free') {
        const planData = plans.find(p => p.id === planId);
        const res = await axios.post(`${API_URL}/api/subscriptions/checkout`, {
          plan: planId,
          origin_url: window.location.origin,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          withCredentials: true,
        });

        if (res.data.checkout_url) {
          window.location.href = res.data.checkout_url;
          return;
        }
      }

      // For free plan downgrade or direct upgrade
      const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
        || localStorage.getItem('access_token');
      await axios.post(`${API_URL}/api/subscriptions/upgrade?plan=${planId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success(`Plan changed to ${plans.find(p => p.id === planId)?.name}!`);
      window.location.reload();
    } catch (err) {
      // If checkout endpoint doesn't exist, fall back to direct upgrade
      try {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1]
          || localStorage.getItem('access_token');
        await axios.post(`${API_URL}/api/subscriptions/upgrade?plan=${planId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        toast.success(`Plan changed to ${plans.find(p => p.id === planId)?.name}!`);
        window.location.reload();
      } catch (e2) {
        toast.error('Failed to change plan');
      }
    } finally {
      setUpgrading(null);
    }
  };

  const getButtonText = (planId) => {
    if (!user) return 'GET STARTED';
    if (planId === currentPlan) return 'CURRENT PLAN';
    const currentIdx = planOrder.indexOf(currentPlan);
    const targetIdx = planOrder.indexOf(planId);
    return targetIdx > currentIdx ? 'UPGRADE' : 'DOWNGRADE';
  };

  const getButtonStyle = (plan) => {
    if (user && plan.id === currentPlan) {
      return 'bg-white/10 text-gray-400 cursor-default';
    }
    if (plan.highlight) return 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:brightness-110';
    return 'bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white hover:brightness-110';
  };

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto" data-testid="pricing-page">
        {/* Header */}
        <div className="p-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[4px] bg-gradient-to-r from-[#7C4DFF] via-[#E040FB] to-[#FF4081] bg-clip-text text-transparent">
            PRICING
          </h1>
          <p className="text-gray-400 mt-2">Choose the plan that fits your music career</p>
          {user && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E040FB]/10 border border-[#E040FB]/30">
              <ShieldCheck className="w-4 h-4 text-[#E040FB]" />
              <span className="text-sm text-[#E040FB] font-medium">
                Current plan: <span className="font-bold uppercase">{currentPlan}</span>
              </span>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="px-4 space-y-5 pb-8">
          {plans.map((plan) => {
            const isCurrent = user && plan.id === currentPlan;
            return (
              <div key={plan.id}
                className={`bg-[#111] rounded-2xl overflow-hidden border-2 transition-all ${
                  isCurrent ? 'border-[#E040FB] shadow-lg shadow-[#E040FB]/10' :
                  plan.highlight ? 'border-[#FFD700]' : 'border-[#222]'
                }`}
                data-testid={`plan-${plan.id}`}
              >
                {/* Badge */}
                {(plan.badge || isCurrent) && (
                  <div className={`py-2 px-4 text-center ${
                    isCurrent ? 'bg-[#E040FB]' :
                    `bg-gradient-to-r ${badgeGradients[plan.badge_color] || badgeGradients.purple}`
                  }`}>
                    <span className="text-xs font-extrabold text-white tracking-wider">
                      {isCurrent ? 'YOUR CURRENT PLAN' : plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-[#E040FB]">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-[2px] text-white mb-4">{plan.name.toUpperCase()}</h3>

                  {plan.price > 0 ? (
                    <div className="flex items-baseline justify-center mb-3">
                      <span className="text-2xl font-semibold text-[#E040FB]">$</span>
                      <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-base text-gray-400 ml-1">{plan.period}</span>
                    </div>
                  ) : (
                    <p className="text-5xl font-extrabold text-white mb-3">FREE</p>
                  )}
                  <p className="text-sm text-gray-400 mb-6">{plan.desc}</p>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2.5 justify-center">
                        <Check className="w-4 h-4 text-[#4CAF50] flex-shrink-0" weight="bold" />
                        <span className="text-sm text-gray-300">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePlanAction(plan.id)}
                    disabled={isCurrent || upgrading === plan.id}
                    className={`px-8 py-3.5 rounded-full text-sm font-bold tracking-[2px] transition-all ${getButtonStyle(plan)}`}
                    data-testid={`plan-cta-${plan.id}`}
                  >
                    {upgrading === plan.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      getButtonText(plan.id)
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison note */}
        <div className="mx-4 p-5 bg-[#111] rounded-2xl border border-white/5 mb-8">
          <h3 className="text-sm font-bold text-[#E040FB] tracking-[2px] mb-3">WHY UPGRADE?</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>Free plan takes 15-20% of your royalties. Rise & Pro plans let you <span className="text-white font-semibold">keep 100%</span>.</p>
            <p>On $1,000 monthly royalties, that's <span className="text-[#4CAF50] font-semibold">$150-200 saved</span> per month.</p>
          </div>
        </div>

        {/* Bottom CTA */}
        {!user && (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Ready to distribute your music?</h2>
            <p className="text-sm text-gray-400 mb-6">Join thousands of artists who trust Kalmori</p>
            <button onClick={() => navigate('/register')}
              className="w-full max-w-xs mx-auto py-4 rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white font-bold tracking-[2px] flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              data-testid="pricing-start-now">
              <Star className="w-5 h-5" weight="fill" /> START NOW
            </button>
          </div>
        )}

        <GlobalFooter />
      </div>
    </PublicLayout>
  );
}
