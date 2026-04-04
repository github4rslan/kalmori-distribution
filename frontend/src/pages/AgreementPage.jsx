import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { FileText, ArrowLeft, Printer } from '@phosphor-icons/react';

export default function AgreementPage() {
  const [tab, setTab] = useState('artist');
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-10" data-testid="agreement-page">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <FileText className="w-6 h-6 text-[#0095FF]" />
          <h1 className="text-2xl font-bold text-white">Kalmori Distribution Agreement</h1>
        </div>

        <div className="flex gap-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-1 w-fit mb-8" data-testid="agreement-tabs">
          <button onClick={() => setTab('artist')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'artist' ? 'bg-[#0095FF]/20 text-[#0095FF]' : 'text-gray-500 hover:text-gray-300'}`}
            data-testid="tab-artist">Artist Agreement</button>
          <button onClick={() => setTab('producer')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'producer' ? 'bg-[#E040FB]/20 text-[#E040FB]' : 'text-gray-500 hover:text-gray-300'}`}
            data-testid="tab-producer">Producer / Label Agreement</button>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 sm:p-10 prose prose-invert max-w-none">
          <style>{`
            .agreement h2 { font-size: 1.1rem; font-weight: 700; color: #fff; margin-top: 2rem; margin-bottom: 0.5rem; }
            .agreement h3 { font-size: 0.95rem; font-weight: 600; color: #ccc; margin-top: 1.25rem; margin-bottom: 0.4rem; }
            .agreement p { font-size: 0.875rem; color: #999; line-height: 1.8; margin-bottom: 0.75rem; }
            .agreement ol, .agreement ul { font-size: 0.875rem; color: #999; line-height: 1.8; padding-left: 1.5rem; }
            .agreement li { margin-bottom: 0.4rem; }
            .agreement strong { color: #fff; }
          `}</style>

          {tab === 'artist' && (
            <div className="agreement" data-testid="artist-agreement">
              <div className="text-center mb-8">
                <p className="text-xs text-gray-500 tracking-[3px] uppercase mb-2">Kalmori Distribution</p>
                <h1 className="text-xl font-black text-white">Artist Distribution Agreement</h1>
                <p className="text-xs text-gray-500 mt-2">Effective Date: Upon account registration</p>
              </div>

              <p>This Artist Distribution Agreement ("Agreement") is entered into between <strong>Kalmori Distribution</strong> ("Company," "we," "us") and you ("Artist," "you"), collectively referred to as the "Parties."</p>

              <h2>1. Services</h2>
              <p>Kalmori Distribution agrees to distribute your musical recordings ("Content") to digital streaming platforms ("DSPs") including but not limited to Spotify, Apple Music, YouTube Music, Amazon Music, Tidal, Deezer, and 150+ additional platforms worldwide.</p>

              <h2>2. Grant of Rights</h2>
              <p>You grant Kalmori Distribution a <strong>non-exclusive</strong> license to distribute, reproduce, and make available your Content on participating DSPs for the duration of this Agreement. You retain full ownership of your Content at all times.</p>

              <h2>3. Revenue & Royalties</h2>
              <ol>
                <li>Revenue share depends on your subscription tier:
                  <ul>
                    <li><strong>Free Plan</strong>: Kalmori retains 20% of gross royalties; Artist receives 80%.</li>
                    <li><strong>Rise Plan</strong>: Kalmori retains 10% of gross royalties; Artist receives 90%.</li>
                    <li><strong>Pro Plan</strong>: Kalmori retains 0% of gross royalties; Artist receives 100%.</li>
                  </ul>
                </li>
                <li>Royalties are calculated based on reports received from DSPs and are paid monthly, subject to a minimum threshold of $100.00 USD.</li>
                <li>Payments are made via the payment method on file in your Kalmori account.</li>
              </ol>

              <h2>4. Artist Representations & Warranties</h2>
              <p>You represent and warrant that:</p>
              <ol>
                <li>You are the sole owner or authorized representative of the Content submitted.</li>
                <li>The Content does not infringe on any third-party copyrights, trademarks, or other intellectual property rights.</li>
                <li>You have obtained all necessary licenses, clearances, and permissions for any samples, beats, or third-party material used.</li>
                <li>All metadata (artist name, track titles, ISRC codes) is accurate and truthful.</li>
              </ol>

              <h2>5. Content Standards</h2>
              <p>Content must meet Kalmori's quality standards and DSP requirements. We reserve the right to reject Content that contains hate speech, illegal material, or violates platform guidelines.</p>

              <h2>6. Term & Termination</h2>
              <ol>
                <li>This Agreement is effective upon account creation and continues until terminated by either party.</li>
                <li>Either party may terminate with 30 days' written notice.</li>
                <li>Upon termination, Kalmori will initiate takedown of your Content from DSPs within a reasonable timeframe (typically 2-4 weeks).</li>
                <li>Any accrued but unpaid royalties will be paid within 60 days of termination.</li>
              </ol>

              <h2>7. Indemnification</h2>
              <p>You agree to indemnify and hold harmless Kalmori Distribution from any claims, damages, or expenses arising from your breach of this Agreement or infringement of third-party rights.</p>

              <h2>8. Limitation of Liability</h2>
              <p>Kalmori Distribution's total liability shall not exceed the total royalties paid to you in the 12 months preceding the claim. We are not liable for DSP policy changes, platform outages, or delays beyond our control.</p>

              <h2>9. Modifications</h2>
              <p>Kalmori reserves the right to modify this Agreement with 30 days' notice. Continued use of the platform after modification constitutes acceptance of the updated terms.</p>

              <h2>10. Governing Law</h2>
              <p>This Agreement shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration.</p>

              <div className="mt-10 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500">By creating a Kalmori account, you acknowledge that you have read, understood, and agree to be bound by this Agreement.</p>
                <p className="text-xs text-gray-600 mt-2">Last updated: April 2026</p>
              </div>
            </div>
          )}

          {tab === 'producer' && (
            <div className="agreement" data-testid="producer-agreement">
              <div className="text-center mb-8">
                <p className="text-xs text-gray-500 tracking-[3px] uppercase mb-2">Kalmori Distribution</p>
                <h1 className="text-xl font-black text-white">Producer / Label Distribution Agreement</h1>
                <p className="text-xs text-gray-500 mt-2">Effective Date: Upon account registration</p>
              </div>

              <p>This Producer/Label Distribution Agreement ("Agreement") is entered into between <strong>Kalmori Distribution</strong> ("Company," "we," "us") and you ("Producer," "Label," "you"), collectively referred to as the "Parties."</p>

              <h2>1. Services</h2>
              <p>Kalmori Distribution agrees to distribute musical recordings, beats, instrumentals, and related content ("Content") submitted by you or your roster artists to 150+ digital streaming platforms worldwide.</p>

              <h2>2. Grant of Rights</h2>
              <p>You grant Kalmori Distribution a <strong>non-exclusive</strong> license to distribute and make available Content on participating platforms. You warrant that you have the authority to grant this license on behalf of all artists in your roster.</p>

              <h2>3. Revenue & Royalties</h2>
              <ol>
                <li>Revenue share depends on your subscription tier:
                  <ul>
                    <li><strong>Free Plan</strong>: Kalmori retains 20% of gross royalties; Producer/Label receives 80%.</li>
                    <li><strong>Rise Plan</strong>: Kalmori retains 10% of gross royalties; Producer/Label receives 90%.</li>
                    <li><strong>Pro Plan</strong>: Kalmori retains 0% of gross royalties; Producer/Label receives 100%.</li>
                  </ul>
                </li>
                <li>Royalty splits between Label and signed artists are configured within your Kalmori dashboard and are your responsibility to manage.</li>
                <li>Payments are processed monthly with a minimum payout threshold of $100.00 USD.</li>
              </ol>

              <h2>4. Roster Management</h2>
              <ol>
                <li>You are responsible for managing your roster of artists within the Kalmori platform.</li>
                <li>You must have written authorization from each artist to distribute their Content.</li>
                <li>Royalty split agreements between you and your roster artists are separate from this Agreement.</li>
              </ol>

              <h2>5. Representations & Warranties</h2>
              <p>You represent and warrant that:</p>
              <ol>
                <li>You have the legal authority to enter into this Agreement on behalf of your label/production company.</li>
                <li>All Content submitted has proper clearances, master rights, and publishing permissions.</li>
                <li>You have executed agreements with all artists whose Content you distribute through Kalmori.</li>
                <li>No Content violates any third-party intellectual property rights.</li>
              </ol>

              <h2>6. Beat & Instrumental Licensing</h2>
              <p>For Producers selling beats through the Kalmori marketplace:</p>
              <ol>
                <li>You retain ownership of all beats and instrumentals uploaded.</li>
                <li>License types (lease, exclusive, etc.) and pricing are set by you.</li>
                <li>Kalmori facilitates the transaction and delivery but is not party to the license agreement between Producer and buyer.</li>
              </ol>

              <h2>7. White-Label Distribution</h2>
              <p>All client-facing reports, payout statements, and communications will be branded as "Kalmori Distribution." Original distributor sources will not be disclosed to your roster artists.</p>

              <h2>8. Term & Termination</h2>
              <ol>
                <li>This Agreement is effective upon account creation and continues until terminated.</li>
                <li>Either party may terminate with 30 days' written notice.</li>
                <li>Upon termination, Content takedown will be processed within 2-4 weeks.</li>
                <li>Outstanding royalties will be paid within 60 days of termination.</li>
              </ol>

              <h2>9. Indemnification & Liability</h2>
              <p>You agree to indemnify Kalmori Distribution from claims arising from your Content or your artists' Content. Kalmori's liability is limited to royalties paid in the preceding 12 months.</p>

              <h2>10. Governing Law</h2>
              <p>This Agreement is governed by applicable law. Disputes shall be resolved through binding arbitration.</p>

              <div className="mt-10 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500">By creating a Kalmori account as a Producer or Label, you acknowledge that you have read, understood, and agree to be bound by this Agreement.</p>
                <p className="text-xs text-gray-600 mt-2">Last updated: April 2026</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors" data-testid="print-btn">
            <Printer className="w-4 h-4" /> Print
          </button>
          <Link to="/register" className="px-6 py-2 bg-[#0095FF] text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all" data-testid="back-to-register">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
