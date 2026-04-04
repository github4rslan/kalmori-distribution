import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { FileText, DownloadSimple, Check, Clock, MagnifyingGlass } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const LICENSE_COLORS = {
  basic_lease: '#7C4DFF', premium_lease: '#E040FB', unlimited_lease: '#FF4081', exclusive: '#FFD700',
};

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchContracts(); }, []);

  const fetchContracts = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/contracts`, { withCredentials: true });
      setContracts(res.data.contracts || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDownloadPdf = async (contract) => {
    try {
      const res = await axios.get(`${API}/api/beats/contract/${contract.id}/pdf`, {
        withCredentials: true, responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kalmori_License_${contract.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Contract downloaded');
    } catch (err) { toast.error('Download failed'); }
  };

  const filtered = contracts.filter(c => {
    const matchSearch = !search || c.beat_title?.toLowerCase().includes(search.toLowerCase())
      || c.buyer_name?.toLowerCase().includes(search.toLowerCase())
      || c.signer_name?.toLowerCase().includes(search.toLowerCase())
      || c.buyer_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.payment_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.filter(c => c.payment_status === 'paid').reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-contracts-page">
        <div>
          <h1 className="text-2xl font-bold">License Contracts</h1>
          <p className="text-gray-400 text-sm mt-1">View all signed beat license agreements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#111] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-500">Total Contracts</p>
            <p className="text-2xl font-bold text-white">{contracts.length}</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-[#4CAF50]">{contracts.filter(c => c.payment_status === 'paid').length}</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-[#FFD700]">{contracts.filter(c => c.payment_status === 'pending').length}</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-[#E040FB]">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, beat..."
              className="w-full bg-[#111] border border-[#333] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]"
              data-testid="contract-search" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm" data-testid="contract-filter-status">
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Contracts Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No contracts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="text-xs text-gray-500 font-medium pb-3 pr-4">Contract</th>
                  <th className="text-xs text-gray-500 font-medium pb-3 pr-4">Buyer</th>
                  <th className="text-xs text-gray-500 font-medium pb-3 pr-4">Beat</th>
                  <th className="text-xs text-gray-500 font-medium pb-3 pr-4">License</th>
                  <th className="text-xs text-gray-500 font-medium pb-3 pr-4">Amount</th>
                  <th className="text-xs text-gray-500 font-medium pb-3 pr-4">Status</th>
                  <th className="text-xs text-gray-500 font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const licColor = LICENSE_COLORS[c.license_type] || '#7C4DFF';
                  return (
                    <tr key={c.id} className="border-b border-[#181818] hover:bg-white/[0.02]" data-testid={`contract-row-${c.id}`}>
                      <td className="py-3 pr-4">
                        <p className="text-xs text-gray-400 font-mono">{c.id}</p>
                        <p className="text-[10px] text-gray-600">{c.signed_at?.slice(0, 10)}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm text-white">{c.signer_name}</p>
                        <p className="text-xs text-gray-500">{c.buyer_email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm text-white">{c.beat_title}</p>
                        <p className="text-xs text-gray-500">{c.beat_genre} &middot; {c.beat_bpm} BPM</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${licColor}20`, color: licColor }}>
                          {c.license_name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-bold text-white font-mono">${c.amount?.toFixed(2)}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.payment_status === 'paid' ? 'bg-[#4CAF50]/15 text-[#4CAF50]' : 'bg-[#FFD700]/15 text-[#FFD700]'}`}>
                          {c.payment_status === 'paid' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {c.payment_status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        <button onClick={() => handleDownloadPdf(c)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#333] text-gray-400 text-xs hover:text-white hover:border-[#7C4DFF] transition"
                          data-testid={`admin-download-contract-${c.id}`}>
                          <DownloadSimple className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
