import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { PaperPlaneTilt, Eye, ChartLineUp, CalendarBlank, UsersThree, CheckCircle, XCircle } from '@phosphor-icons/react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdminAnalyticsReportsPage() {
  const [period, setPeriod] = useState('weekly');
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewStats, setPreviewStats] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const sendReports = async () => {
    setSending(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post(`${API}/api/admin/analytics-report/send`, { period, target: 'all' }, { headers });
      setResult(res.data);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to send reports');
    }
    setSending(false);
  };

  const previewReport = async () => {
    setPreviewing(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/admin/analytics-report/preview`, { period }, { headers });
      setPreviewHtml(res.data.html);
      setPreviewStats(res.data.stats);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to preview');
    }
    setPreviewing(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="admin-analytics-reports">
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="analytics-reports-title">Analytics Email Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Send performance reports to your artists to keep them engaged</p>
        </div>

        {/* Controls */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-5" data-testid="report-controls">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Report Period</label>
              <div className="flex gap-2">
                {['weekly', 'monthly'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                      period === p
                        ? 'border-[#7C4DFF] bg-[#7C4DFF]/20 text-[#7C4DFF]'
                        : 'border-[#333] text-gray-500 hover:border-gray-400'
                    }`}
                    data-testid={`period-${p}`}
                  >
                    <CalendarBlank className="w-4 h-4 inline mr-1.5" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            <button
              onClick={previewReport}
              disabled={previewing}
              className="px-5 py-2.5 rounded-lg border border-[#333] text-white text-sm font-medium hover:bg-white/5 transition flex items-center gap-2 disabled:opacity-50"
              data-testid="preview-report-btn"
            >
              <Eye className="w-4 h-4" /> {previewing ? 'Loading...' : 'Preview'}
            </button>

            <button
              onClick={sendReports}
              disabled={sending}
              className="px-5 py-2.5 rounded-lg bg-[#7C4DFF] text-white text-sm font-medium hover:brightness-110 transition flex items-center gap-2 disabled:opacity-50"
              data-testid="send-reports-btn"
            >
              <PaperPlaneTilt className="w-4 h-4" /> {sending ? 'Sending...' : 'Send to All Artists'}
            </button>
          </div>

          <p className="text-gray-600 text-xs mt-3">
            This will send a {period} performance summary email to every registered artist and producer.
          </p>
        </div>

        {/* Result */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {result && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2" data-testid="send-result">
            <CheckCircle className="w-4 h-4 shrink-0" /> {result.message}
          </div>
        )}

        {/* Preview Stats */}
        {previewStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111] border border-[#222] rounded-xl p-5 text-center">
              <ChartLineUp className="w-6 h-6 text-[#7C4DFF] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{previewStats.total_streams?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Streams ({period})</p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-5 text-center">
              <UsersThree className="w-6 h-6 text-[#22C55E] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">${previewStats.total_revenue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">Revenue ({period})</p>
            </div>
          </div>
        )}

        {/* Email Preview */}
        {previewHtml && (
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden" data-testid="email-preview">
            <div className="p-4 border-b border-[#222] flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#E040FB]" /> Email Preview
              </h3>
              <span className="text-xs text-gray-500">{period === 'weekly' ? 'Weekly' : 'Monthly'} Report</span>
            </div>
            <div className="p-4">
              <div
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                className="max-w-[600px] mx-auto"
                data-testid="email-preview-content"
              />
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-5" data-testid="report-info">
          <h3 className="text-white font-semibold mb-3">What's Included</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E] mt-0.5 shrink-0" /> Total streams and revenue for the period</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E] mt-0.5 shrink-0" /> Top performing platforms (Spotify, Apple Music, etc.)</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E] mt-0.5 shrink-0" /> Top releases by stream count</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E] mt-0.5 shrink-0" /> Top countries for listeners</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E] mt-0.5 shrink-0" /> Direct link to the artist's full dashboard</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
