import React, { useState } from 'react';
import { Check, PaperPlaneTilt, Sparkle, Waveform } from '@phosphor-icons/react';
import { toast } from 'sonner';
import PublicLayout from '../components/PublicLayout';
import GlobalFooter from '../components/GlobalFooter';
import { useAuth } from '../App';
import { api } from '../services/api';

const genres = ['Hip-Hop/Rap', 'R&B/Soul', 'Afrobeats', 'Dancehall', 'Reggae', 'Pop', 'Trap', 'Drill', 'Gospel', 'Electronic/EDM', 'Latin', 'Other'];
const moods = ['Energetic/Hype', 'Chill/Laid-back', 'Dark/Moody', 'Emotional/Sad', 'Happy/Uplifting', 'Romantic', 'Aggressive', 'Party/Club'];
const DEFAULT_LICENSE_TYPE = 'basic_lease';

const getInitialForm = () => ({
  artist_name: '',
  email: '',
  phone: '',
  tempo_range: '',
  reference_tracks: '',
  budget: '',
  additional_notes: '',
});

export default function RequestBeatPage() {
  useAuth();
  const [form, setForm] = useState(() => getInitialForm());
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetRequest = () => {
    setForm(getInitialForm());
    setSelectedGenre('');
    setSelectedMood('');
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.artist_name.trim() || !form.email.trim() || !selectedGenre) {
      toast.error('Artist name, email, and genre are required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createInstrumentalRequest({
        artist_name: form.artist_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        genre: selectedGenre,
        mood: selectedMood || null,
        tempo_range: form.tempo_range.trim() || null,
        reference_tracks: form.reference_tracks.trim() || null,
        budget: form.budget.trim() || null,
        additional_notes: form.additional_notes.trim() || null,
        license_type: DEFAULT_LICENSE_TYPE,
      });
      setSubmitted(true);
      toast.success('Beat request submitted successfully.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="relative overflow-hidden bg-black">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(124,77,255,0.24),_transparent_55%)] pointer-events-none" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#00B8D9]/10 blur-[120px] pointer-events-none" />
        <div className="absolute left-0 top-40 h-72 w-72 rounded-full bg-[#E040FB]/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16" data-testid="request-beat-page">
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] px-6 py-7 sm:px-8 sm:py-8 mb-6">
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#7C4DFF]/10 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
              <div>
                <p className="text-[11px] font-bold text-[#E040FB] tracking-[4px] mb-3">CUSTOM PRODUCTION</p>
                <h1 className="text-3xl sm:text-[42px] font-black text-white leading-[0.95] tracking-tight mb-3">
                  Request a Beat Built For Your Sound.
                </h1>
                <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
                  Tell us the vibe, genre, tempo, and references you want. We&apos;ll turn your direction into a custom beat request the Kalmori team can review and follow up on.
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5 text-xs sm:text-sm text-gray-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Sparkle className="w-4 h-4 text-[#E040FB]" weight="fill" />
                    Modern custom production flow
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Waveform className="w-4 h-4 text-[#00B8D9]" weight="fill" />
                    Share BPM, mood, and references
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: '24-48h', label: 'Response window' },
                  { value: '1 form', label: 'Single submission flow' },
                  { value: 'Direct', label: 'Clear producer brief' },
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
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Request A Custom Beat</h2>
              <p className="text-sm sm:text-base text-gray-400 mt-3">
                Fill out the form and we&apos;ll get back to you within 24-48 hours.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-8" data-testid="request-success">
                <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] mx-auto mb-6 flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" weight="bold" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-3">Request Submitted!</h3>
                <p className="text-[15px] text-gray-400 leading-relaxed mb-6 max-w-xl mx-auto">
                  We&apos;ve received your beat request and will contact you within 24-48 hours.
                </p>
                <button
                  onClick={resetRequest}
                  className="px-7 py-3.5 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold tracking-wider hover:bg-white/15 transition-colors"
                >
                  SUBMIT ANOTHER REQUEST
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8" data-testid="beat-request-form">
                <div>
                  <h3 className="text-base font-bold text-[#E040FB] mb-4">Your Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { label: 'Artist/Producer Name *', key: 'artist_name', type: 'text', placeholder: 'Your artist or producer name', testid: 'req-artist-name' },
                      { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'you@example.com', testid: 'req-email' },
                      { label: 'Phone Number (Optional)', key: 'phone', type: 'tel', placeholder: '+1 234 567 890', className: 'md:col-span-2' },
                    ].map(({ label, key, type, testid, className = '' }) => (
                      <div key={key} className={className}>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
                        <input
                          type={type}
                          value={form[key]}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#7C4DFF]/60 focus:ring-1 focus:ring-[#7C4DFF]/30 transition-all"
                          data-testid={testid || undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#E040FB] mb-4">Beat Requirements</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Genre *</label>
                      <div className="flex flex-wrap gap-2.5">
                        {genres.map((genre) => (
                          <button
                            type="button"
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition-all ${
                              selectedGenre === genre
                                ? 'bg-[#7C4DFF] border-[#7C4DFF] text-white shadow-[0_10px_30px_rgba(124,77,255,0.25)]'
                                : 'bg-[#111] border-[#333] text-gray-400 hover:border-white/20 hover:text-white/80'
                            }`}
                            data-testid={`genre-${genre.toLowerCase().replace(/[^a-z]/g, '-')}`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Mood/Vibe</label>
                      <div className="flex flex-wrap gap-2.5">
                        {moods.map((mood) => (
                          <button
                            type="button"
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition-all ${
                              selectedMood === mood
                                ? 'bg-[#E040FB] border-[#E040FB] text-white shadow-[0_10px_30px_rgba(224,64,251,0.25)]'
                                : 'bg-[#111] border-[#333] text-gray-400 hover:border-white/20 hover:text-white/80'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Tempo Range (BPM)</label>
                        <input
                          type="text"
                          value={form.tempo_range}
                          onChange={(e) => handleFieldChange('tempo_range', e.target.value)}
                          placeholder="e.g., 120-140"
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#7C4DFF]/60 focus:ring-1 focus:ring-[#7C4DFF]/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Budget Range</label>
                        <input
                          type="text"
                          value={form.budget}
                          onChange={(e) => handleFieldChange('budget', e.target.value)}
                          placeholder="e.g., $100-$300"
                          className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#7C4DFF]/60 focus:ring-1 focus:ring-[#7C4DFF]/30 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Reference Tracks</label>
                      <textarea
                        value={form.reference_tracks}
                        onChange={(e) => handleFieldChange('reference_tracks', e.target.value)}
                        placeholder="Share links or names of tracks with a similar vibe"
                        rows={4}
                        className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#7C4DFF]/60 focus:ring-1 focus:ring-[#7C4DFF]/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Additional Notes</label>
                      <textarea
                        value={form.additional_notes}
                        onChange={(e) => handleFieldChange('additional_notes', e.target.value)}
                        placeholder="Any specific requirements..."
                        rows={4}
                        className="w-full bg-[#111] border border-[#333] rounded-2xl px-4 py-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#7C4DFF]/60 focus:ring-1 focus:ring-[#7C4DFF]/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#7C4DFF] via-[#6A5BFF] to-[#00B8D9] text-white font-bold tracking-[2px] flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  data-testid="submit-beat-request"
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
