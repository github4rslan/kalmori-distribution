import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Megaphone, FloppyDisk, ToggleLeft, ToggleRight, CheckCircle, Rocket, Crown, Tag } from '@phosphor-icons/react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const RISE_PRICE = 24.99;
const PRO_PRICE = 49.99;

const inputCls = 'w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#7C4DFF]/60 focus:outline-none transition';

export default function AdminPlansPage() {
  const [sale, setSale] = useState({ name: '', rise_discount: 0, pro_discount: 0, ends_at: '', active: false });
  const [saleLoading, setSaleLoading] = useState(true);
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState('');
  const [saleError, setSaleError] = useState('');

  const fetchSale = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/admin/plan-sale`, { withCredentials: true });
      if (res.data && res.data.name !== undefined) {
        setSale({
          name: res.data.name || '',
          rise_discount: res.data.rise_discount ?? 0,
          pro_discount: res.data.pro_discount ?? 0,
          ends_at: res.data.ends_at ? res.data.ends_at.split('T')[0] : '',
          active: res.data.active ?? false,
        });
      }
    } catch (e) { /* no sale yet */ }
    setSaleLoading(false);
  }, []);

  useEffect(() => { fetchSale(); }, [fetchSale]);

  const handleSaveSale = async () => {
    setSaleSaving(true); setSaleSuccess(''); setSaleError('');
    try {
      const payload = {
        name: sale.name,
        rise_discount: parseFloat(sale.rise_discount) || 0,
        pro_discount: parseFloat(sale.pro_discount) || 0,
        ends_at: sale.ends_at ? new Date(sale.ends_at).toISOString() : null,
        active: sale.active,
      };
      await axios.put(`${API}/api/admin/plan-sale`, payload, { withCredentials: true });
      setSaleSuccess('Campaign saved!');
      setTimeout(() => setSaleSuccess(''), 3000);
    } catch (e) {
      setSaleError(e.response?.data?.detail || 'Failed to save campaign');
    }
    setSaleSaving(false);
  };

  const riseSalePrice = Math.max(RISE_PRICE - RISE_PRICE * parseFloat(sale.rise_discount || 0) / 100, 0.50).toFixed(2);
  const proSalePrice = Math.max(PRO_PRICE - PRO_PRICE * parseFloat(sale.pro_discount || 0) / 100, 0.50).toFixed(2);

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl" data-testid="admin-plans-page">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Plan <span className="text-[#7C4DFF]">Management</span></h1>
          <p className="text-xs text-gray-500 mt-1">Control sitewide pricing campaigns and plan discounts.</p>
        </div>

        {/* Plan overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'free', name: 'Free', price: '$0', period: '', color: '#888', icon: <Tag className="w-5 h-5" weight="fill" />, note: '20% revenue share' },
            { id: 'rise', name: 'Rise', price: `$${RISE_PRICE}`, period: '/release', color: '#7C4DFF', icon: <Rocket className="w-5 h-5" weight="fill" />, note: '5% revenue share' },
            { id: 'pro', name: 'Pro', price: `$${PRO_PRICE}`, period: '/mo', color: '#FFD700', icon: <Crown className="w-5 h-5" weight="fill" />, note: '0% revenue share' },
          ].map(plan => (
            <div key={plan.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${plan.color}22`, color: plan.color }}>
                {plan.icon}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-bold">{plan.name}</span>
                  <span className="text-sm font-bold" style={{ color: plan.color }}>{plan.price}</span>
                  <span className="text-xs text-gray-500">{plan.period}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{plan.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plan Sale Campaign */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#E040FB,#7C4DFF)' }}>
              <Megaphone className="w-5 h-5 text-white" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Plan Sale Campaign</h2>
              <p className="text-gray-500 text-xs mt-0.5">Set a sitewide discount on Rise &amp; Pro — shows everywhere prices appear and applies at checkout</p>
            </div>
          </div>

          {saleLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
          ) : (
            <div className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-5">

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Campaign Active</p>
                  <p className="text-xs text-gray-500 mt-0.5">Turn on to show discounted prices across the site</p>
                </div>
                <button
                  onClick={() => setSale(s => ({ ...s, active: !s.active }))}
                  className="transition-colors"
                  data-testid="sale-active-toggle"
                >
                  {sale.active
                    ? <ToggleRight className="w-8 h-8 text-[#22C55E]" />
                    : <ToggleLeft className="w-8 h-8 text-gray-600" />}
                </button>
              </div>

              {/* Campaign name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1.5 block">Campaign Name</label>
                <input
                  className={inputCls}
                  placeholder='e.g. "Black Friday Sale", "Launch Week"'
                  value={sale.name}
                  onChange={e => setSale(s => ({ ...s, name: e.target.value }))}
                  data-testid="sale-name-input"
                />
              </div>

              {/* Discounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1.5 block">Rise Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number" min="0" max="100" step="1"
                      className={inputCls}
                      value={sale.rise_discount}
                      onChange={e => setSale(s => ({ ...s, rise_discount: e.target.value }))}
                      data-testid="sale-rise-input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#E040FB] mb-1.5 block">Pro Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number" min="0" max="100" step="1"
                      className={inputCls}
                      value={sale.pro_discount}
                      onChange={e => setSale(s => ({ ...s, pro_discount: e.target.value }))}
                      data-testid="sale-pro-input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* End date */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1.5 block">End Date (optional — auto-expires)</label>
                <input
                  type="date"
                  className={inputCls}
                  value={sale.ends_at}
                  onChange={e => setSale(s => ({ ...s, ends_at: e.target.value }))}
                  data-testid="sale-ends-input"
                />
              </div>

              {/* Live preview */}
              {(parseFloat(sale.rise_discount) > 0 || parseFloat(sale.pro_discount) > 0) && (
                <div className="bg-black/40 border border-white/8 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Live Preview</p>
                  {parseFloat(sale.rise_discount) > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#7C4DFF] shrink-0" />
                        <span className="text-sm font-semibold text-white">Rise Plan</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C4DFF]/20 text-[#7C4DFF] font-bold">{sale.rise_discount}% OFF</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-gray-500 line-through">${RISE_PRICE}</span>
                        <span className="text-sm font-bold text-[#22C55E]">${riseSalePrice}</span>
                        <span className="text-xs text-gray-500">/release</span>
                      </div>
                    </div>
                  )}
                  {parseFloat(sale.pro_discount) > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#E040FB] shrink-0" />
                        <span className="text-sm font-semibold text-white">Pro Plan</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#E040FB]/20 text-[#E040FB] font-bold">{sale.pro_discount}% OFF</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-gray-500 line-through">${PRO_PRICE}</span>
                        <span className="text-sm font-bold text-[#22C55E]">${proSalePrice}</span>
                        <span className="text-xs text-gray-500">/mo</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {saleError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                  {saleError}
                </div>
              )}

              {saleSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
                  <CheckCircle className="w-4 h-4" /> {saleSuccess}
                </div>
              )}

              <button
                onClick={handleSaveSale}
                disabled={saleSaving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg,#7C4DFF,#E040FB)' }}
                data-testid="save-sale-btn"
              >
                <FloppyDisk className="w-4 h-4" weight="bold" />
                {saleSaving ? 'Saving...' : 'Save Campaign'}
              </button>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
