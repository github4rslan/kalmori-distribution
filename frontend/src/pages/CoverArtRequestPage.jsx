import React, { useState } from 'react';
import { Check, PaperPlaneTilt, Palette, Sparkle, ImagesSquare } from '@phosphor-icons/react';
import { toast } from 'sonner';
import PublicLayout from '../components/PublicLayout';
import GlobalFooter from '../components/GlobalFooter';
import { useAuth } from '../App';
import { api } from '../services/api';
import { getSafeErrorDetail } from '../utils/error';

const releaseTypes = ['Single Cover', 'EP Cover', 'Album Cover', 'Deluxe Cover', 'Promo Asset Pack'];
const styleTags = ['Minimal', 'Cinematic', 'Dark / Moody', 'Luxury', 'Bold / Colorful', 'Street', 'Futuristic', 'Vintage', 'Clean Typography', 'Photo-Based', 'Illustrated'];
const deliverableOptions = ['Main Cover', 'Streaming Crop', 'Social Promo Post', 'Animated Canvas Idea', 'Alternate Version'];

const getInitialForm = () => ({
  artist_name: '',
  email: '',
  phone: '',
  project_title: '',
  visual_style: '',
  color_direction: '',
  reference_links: '',
  deadline: '',
  budget: '',
  additional_notes: '',
});

export default function CoverArtRequestPage() {
  useAuth();
  const [form, setForm] = useState(() => getInitialForm());
  const [selectedReleaseType, setSelectedReleaseType] = useState('');
  const [selectedStyleTag, setSelectedStyleTag] = useState('');
  const [selectedDeliverables, setSelectedDeliverables] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDeliverable = (value) => {
    setSelectedDeliverables((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const resetRequest = () => {
    setForm(getInitialForm());
    setSelectedReleaseType('');
    setSelectedStyleTag('');
    setSelectedDeliverables([]);
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.artist_name.trim() || !form.email.trim() || !form.project_title.trim()) {
      toast.error('Artist name, email, and project title are required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createCoverArtRequest({
        artist_name: form.artist_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        project_title: form.project_title.trim(),
        release_type: selectedReleaseType || null,
        visual_style: [selectedStyleTag, form.visual_style.trim()].filter(Boolean).join(' | ') || null,
        color_direction: form.color_direction.trim() || null,
        reference_links: form.reference_links.trim() || null,
        deadline: form.deadline || null,
        budget: form.budget.trim() || null,
        deliverables: selectedDeliverables,
        additional_notes: form.additional_notes.trim() || null,
      });
      setSubmitted(true);
      toast.success('Cover art request submitted successfully.');
    } catch (error) {
      toast.error(getSafeErrorDetail(error, 'Failed to submit request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="relative overflow-hidden bg-black">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(224,64,251,0.22),_transparent_55%)] pointer-events-none" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#7C4DFF]/10 blur-[120px] pointer-events-none" />
        <div className="absolute left-0 top-40 h-72 w-72 rounded-full bg-[#FF4D8D]/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16" data-testid="cover-art-request-page">
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] px-6 py-7 sm:px-8 sm:py-8 mb-6">
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#E040FB]/10 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
              <div>
                <p className="text-[11px] font-bold text-[#E040FB] tracking-[4px] mb-3">RELEASE SUPPORT</p>
                <h1 className="text-3xl sm:text-[42px] font-black text-white leading-[0.95] tracking-tight mb-3">
                  Request Cover Art That Fits The Release.
                </h1>
                <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
                  Share the song title, look, references, and deadline. We&apos;ll turn your direction into a clean cover-art request the Kalmori team can review and follow up on.
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5 text-xs sm:text-sm text-gray-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Palette className="w-4 h-4 text-[#E040FB]" weight="fill" />
                    Cover art request flow
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <ImagesSquare className="w-4 h-4 text-[#7C4DFF]" weight="fill" />
                    Send references, style, and deliverables
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: '24-48h', label: 'Response window' },
                  { value: 'Email', label: 'Sent to admin inbox' },
                  { value: 'Clear', label: 'Structured creative brief' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <p className="text-xl sm:text-2xl font-black text-white">{item.value}</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0b0b0b] p-6 sm:p-8 lg:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="text-center mb-7">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Request Cover Art</h2>
              <p className="text-sm sm:text-base text-gray-400 mt-3">
                Fill out the brief and we&apos;ll email your request details through to the team.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-8" data-testid="cover-art-success">
                <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] mx-auto mb-6 flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" weight="bold" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-3">Request Submitted!</h3>
                <p className="text-[15px] text-gray-400 leading-relaxed mb-6 max-w-xl mx-auto">
                  We&apos;ve sent your cover art brief to the Kalmori team and emailed a confirmation to you.
                </p>
                <button
                  onClick={resetRequest}
                  className="px-7 py-3.5 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold tracking-wider hover:bg-white/15 transition-colors"
                >
                  SUBMIT ANOTHER REQUEST
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8" data-testid="cover-art-request-form">
                <div>
                  <h3 className="text-base font-bold text-[#E040FB] mb-4">Your Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { label: 'Artist/Brand Name *', key: 'artist_name', type: 'text', placeholder: 'Your artist or brand name', testid: 'cover-artist-name' },
                      { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'you@example.com', testid: 'cover-email' },
                      { label: 'Phone Number (Optional)', key: 'phone', type: 'tel', placeholder: '+1 234 567 890', className: 'md:col-span-2' },
                    ].map(({ label, key, type, placeholder, testid, className = '' }) => (
                      <div key={key} className={className}>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
                        <input
                          type={type}
                          value={form[key]}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                          data-testid={testid || undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#E040FB] mb-4">Project Details</h3>
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Song / Project Title *</label>
                        <input
                          type="text"
                          value={form.project_title}
                          onChange={(e) => handleFieldChange('project_title', e.target.value)}
                          placeholder="e.g., Midnight Drive"
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                          data-testid="cover-project-title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Budget Range</label>
                        <input
                          type="text"
                          value={form.budget}
                          onChange={(e) => handleFieldChange('budget', e.target.value)}
                          placeholder="e.g., $100-$250"
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Release Type</label>
                      <div className="flex flex-wrap gap-2.5">
                        {releaseTypes.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => setSelectedReleaseType(item)}
                            className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition-all ${
                              selectedReleaseType === item
                                ? 'bg-[#7C4DFF] border-[#7C4DFF] text-white shadow-[0_10px_30px_rgba(124,77,255,0.25)]'
                                : 'bg-[#111] border-[#333] text-gray-400 hover:border-white/20 hover:text-white/80'
                            }`}
                            data-testid={`cover-release-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Style Direction</label>
                      <div className="flex flex-wrap gap-2.5 mb-4">
                        {styleTags.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => setSelectedStyleTag(item)}
                            className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition-all ${
                              selectedStyleTag === item
                                ? 'bg-[#E040FB] border-[#E040FB] text-white shadow-[0_10px_30px_rgba(224,64,251,0.25)]'
                                : 'bg-[#111] border-[#333] text-gray-400 hover:border-white/20 hover:text-white/80'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={form.visual_style}
                        onChange={(e) => handleFieldChange('visual_style', e.target.value)}
                        placeholder="Describe the overall look you want, mood, typography, imagery, or art direction."
                        rows={4}
                        className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Color Direction</label>
                        <input
                          type="text"
                          value={form.color_direction}
                          onChange={(e) => handleFieldChange('color_direction', e.target.value)}
                          placeholder="e.g., purple neon, chrome, black & gold"
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Deadline</label>
                        <input
                          type="date"
                          value={form.deadline}
                          onChange={(e) => handleFieldChange('deadline', e.target.value)}
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Deliverables Needed</label>
                      <div className="flex flex-wrap gap-2.5">
                        {deliverableOptions.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleDeliverable(item)}
                            className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition-all ${
                              selectedDeliverables.includes(item)
                                ? 'bg-[#FF4D8D] border-[#FF4D8D] text-white shadow-[0_10px_30px_rgba(255,77,141,0.25)]'
                                : 'bg-[#111] border-[#333] text-gray-400 hover:border-white/20 hover:text-white/80'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Reference Links</label>
                      <textarea
                        value={form.reference_links}
                        onChange={(e) => handleFieldChange('reference_links', e.target.value)}
                        placeholder="Paste links to artwork references, Pinterest boards, Spotify covers, moodboards, or visuals."
                        rows={4}
                        className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Additional Notes</label>
                      <textarea
                        value={form.additional_notes}
                        onChange={(e) => handleFieldChange('additional_notes', e.target.value)}
                        placeholder="Anything else the designer should know about the release, audience, branding, or file needs?"
                        rows={4}
                        className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#E040FB]/60 focus:ring-1 focus:ring-[#E040FB]/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF4D8D] via-[#E040FB] to-[#7C4DFF] text-white font-bold tracking-[2px] flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  data-testid="submit-cover-art-request"
                >
                  <PaperPlaneTilt className="w-5 h-5" weight="fill" />
                  {submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </button>
              </form>
            )}
          </section>
        </div>

        <GlobalFooter />
      </div>
    </PublicLayout>
  );
}
