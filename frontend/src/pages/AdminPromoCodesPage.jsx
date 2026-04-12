import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Tag, Plus, Trash, ToggleLeft, ToggleRight, Copy, CheckCircle, XCircle, Percent, CurrencyDollar, Megaphone, FloppyDisk } from '@phosphor-icons/react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const RISE_PRICE = 24.99;
const PRO_PRICE = 49.99;

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discount_type: 'percent', discount_value: 50,
    applicable_plans: ['rise', 'pro'], max_uses: 100,
    duration_months: 3, expires_at: '', active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState('');

  // Plan Sale Campaign state
  const [sale, setSale] = useState({ name: '', rise_discount: 0, pro_discount: 0, ends_at: '', active: false });
  const [saleLoading, setSaleLoading] = useState(true);
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/promo-codes`, { headers });
      if (res.ok) setCodes(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

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

  const handleSaveSale = async () => {
    setSaleSaving(true); setSaleSuccess('');
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
    } catch (e) { setError(e.response?.data?.detail || 'Failed to save campaign'); }
    setSaleSaving(false);
  };

  useEffect(() => { fetchCodes(); fetchSale(); }, [fetchCodes, fetchSale]);

  const handleCreate = async () => {
    if (!form.code.trim()) { setError('Enter a promo code'); return; }
    if (form.discount_value <= 0) { setError('Discount must be positive'); return; }
    setError('');
    try {
      const res = await fetch(`${API}/api/admin/promo-codes`, {
        method: 'POST', headers, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSuccess(`Promo code "${data.code}" created!`);
      setShowForm(false);
      setForm({ code: '', discount_type: 'percent', discount_value: 50, applicable_plans: ['rise', 'pro'], max_uses: 100, duration_months: 3, expires_at: '', active: true });
      fetchCodes();
    } catch (e) { setError(e.message); }
  };

  const toggleActive = async (promo) => {
    await fetch(`${API}/api/admin/promo-codes/${promo.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ active: !promo.active }),
    });
    fetchCodes();
  };

  const deleteCode = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    await fetch(`${API}/api/admin/promo-codes/${id}`, { method: 'DELETE', headers });
    fetchCodes();
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const togglePlan = (plan) => {
    setForm(prev => ({
      ...prev,
      applicable_plans: prev.applicable_plans.includes(plan)
        ? prev.applicable_plans.filter(p => p !== plan)
        : [...prev.applicable_plans, plan]
    }));
  };

  const inputCls = "w-full bg-black border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]";

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="admin-promo-codes">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="promo-title">Promo Codes</h1>
            <p className="text-gray-400 text-sm mt-1">Create discount codes for subscription sign-ups</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-lg bg-[#7C4DFF] text-white text-sm font-medium hover:brightness-110 flex items-center gap-2"
            data-testid="create-promo-btn"
          >
            <Plus className="w-4 h-4" /> New Promo Code
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-4" data-testid="promo-form">
            <h3 className="text-white font-semibold">Create Promo Code</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Code</label>
                <input
                  className={inputCls}
                  placeholder="e.g. LAUNCH50"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  data-testid="promo-code-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Discount Type</label>
                <select
                  className={inputCls}
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  data-testid="promo-type-select"
                >
                  <option value="percent" className="bg-black">Percentage Off</option>
                  <option value="fixed" className="bg-black">Fixed Amount Off</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">
                  Discount Value {form.discount_type === 'percent' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                  data-testid="promo-value-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Max Uses</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 0 })}
                  data-testid="promo-max-uses"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Duration (months)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="0 = forever"
                  value={form.duration_months}
                  onChange={(e) => setForm({ ...form, duration_months: parseInt(e.target.value) || 0 })}
                  data-testid="promo-duration"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-2 block">Applicable Plans</label>
              <div className="flex gap-3">
                {['rise', 'pro'].map(plan => (
                  <button
                    key={plan}
                    onClick={() => togglePlan(plan)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      form.applicable_plans.includes(plan)
                        ? 'border-[#7C4DFF] bg-[#7C4DFF]/20 text-[#7C4DFF]'
                        : 'border-[#333] text-gray-500 hover:border-gray-400'
                    }`}
                    data-testid={`plan-toggle-${plan}`}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Expires At (optional)</label>
              <input
                type="date"
                className={inputCls}
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                data-testid="promo-expires"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:brightness-110"
                data-testid="save-promo-btn"
              >
                Create Code
              </button>
            </div>
          </div>
        )}

        {/* Codes List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : codes.length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center" data-testid="no-promos">
            <Tag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No promo codes yet.</p>
            <p className="text-gray-500 text-sm mt-1">Create your first promo code to boost sign-ups.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((promo) => (
              <div key={promo.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-4" data-testid={`promo-card-${promo.id}`}>
                {/* Code */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <button onClick={() => copyCode(promo.code)} className="flex items-center gap-2 group" data-testid={`copy-${promo.code}`}>
                    <span className="font-mono font-bold text-white text-lg tracking-wider">{promo.code}</span>
                    <Copy className={`w-4 h-4 ${copied === promo.code ? 'text-green-400' : 'text-gray-600 group-hover:text-white'}`} />
                  </button>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-1.5 min-w-[100px]">
                  {promo.discount_type === 'percent' ? (
                    <Percent className="w-4 h-4 text-[#E040FB]" />
                  ) : (
                    <CurrencyDollar className="w-4 h-4 text-[#E040FB]" />
                  )}
                  <span className="text-[#E040FB] font-bold">
                    {promo.discount_type === 'percent' ? `${promo.discount_value}% off` : `$${promo.discount_value} off`}
                  </span>
                </div>

                {/* Plans */}
                <div className="flex gap-1">
                  {promo.applicable_plans?.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C4DFF]/20 text-[#7C4DFF] border border-[#7C4DFF]/30">
                      {p.toUpperCase()}
                    </span>
                  ))}
                </div>

                {/* Duration */}
                <span className="text-gray-500 text-xs min-w-[80px]">
                  {promo.duration_months > 0 ? `${promo.duration_months} months` : 'Forever'}
                </span>

                {/* Usage */}
                <span className="text-gray-400 text-xs min-w-[70px]">
                  {promo.used_count}/{promo.max_uses} used
                </span>

                {/* Status */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  promo.active
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {promo.active ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <div className="flex-1" />

                {/* Actions */}
                <button
                  onClick={() => toggleActive(promo)}
                  className="text-gray-500 hover:text-white transition"
                  title={promo.active ? 'Deactivate' : 'Activate'}
                  data-testid={`toggle-${promo.id}`}
                >
                  {promo.active ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => deleteCode(promo.id)}
                  className="text-gray-500 hover:text-red-400 transition"
                  data-testid={`delete-${promo.id}`}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* ===== PLAN SALE CAMPAIGN ===== */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#E040FB,#7C4DFF)' }}>
              <Megaphone className="w-5 h-5 text-white" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Plan Sale Campaign</h2>
              <p className="text-gray-500 text-xs mt-0.5">Set a sitewide discount on Rise &amp; Pro — shows everywhere prices appear</p>
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
                  <p className="text-xs text-gray-500 mt-0.5">Turn on to show discounted prices on the site</p>
                </div>
                <button onClick={() => setSale(s => ({ ...s, active: !s.active }))}
                  className="transition-colors" data-testid="sale-active-toggle">
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
                    <input type="number" min="0" max="100" step="1"
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
                    <input type="number" min="0" max="100" step="1"
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
                <input type="date" className={inputCls}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-2 h-2 rounded-full bg-[#7C4DFF] shrink-0" />
                        <span className="text-sm font-semibold text-white">Rise Plan</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C4DFF]/20 text-[#7C4DFF] font-bold">{sale.rise_discount}% OFF</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-gray-500 line-through">${RISE_PRICE}</span>
                        <span className="text-sm font-bold text-[#22C55E]">
                          ${Math.max(RISE_PRICE - RISE_PRICE * parseFloat(sale.rise_discount) / 100, 0.50).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">/mo</span>
                      </div>
                    </div>
                  )}
                  {parseFloat(sale.pro_discount) > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-2 h-2 rounded-full bg-[#E040FB] shrink-0" />
                        <span className="text-sm font-semibold text-white">Pro Plan</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#E040FB]/20 text-[#E040FB] font-bold">{sale.pro_discount}% OFF</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-gray-500 line-through">${PRO_PRICE}</span>
                        <span className="text-sm font-bold text-[#22C55E]">
                          ${Math.max(PRO_PRICE - PRO_PRICE * parseFloat(sale.pro_discount) / 100, 0.50).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">/mo</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {saleSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
                  <CheckCircle className="w-4 h-4" /> {saleSuccess}
                </div>
              )}

              <button onClick={handleSaveSale} disabled={saleSaving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg,#7C4DFF,#E040FB)' }}
                data-testid="save-sale-btn">
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
