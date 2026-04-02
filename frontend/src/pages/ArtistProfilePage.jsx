import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, SpotifyLogo, AppleLogo, InstagramLogo, TwitterLogo, MusicNotes, Disc, Play, ShareNetwork, CheckCircle, Copy, ArrowLeft, Users } from '@phosphor-icons/react';
import { API, BACKEND_URL } from '../App';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] } })
};

const SocialIcon = ({ url, icon: Icon, label, testId }) => {
  if (!url) return null;
  const href = url.startsWith('http') ? url : (url.startsWith('@') ? `https://instagram.com/${url.replace('@', '')}` : `https://${url}`);
  return (
    <motion.a
      href={href} target="_blank" rel="noopener noreferrer"
      className="w-12 h-12 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center text-white/80 hover:bg-white hover:text-black transition-all duration-300 hover:scale-110"
      whileTap={{ scale: 0.9 }}
      title={label}
      data-testid={testId}
    >
      <Icon className="w-5 h-5" weight="fill" />
    </motion.a>
  );
};

const ReleaseCard = ({ release, index, artistSlug }) => {
  const coverUrl = release.cover_art_url
    ? `${BACKEND_URL}/api/files/${release.cover_art_url}`
    : null;

  return (
    <motion.div
      custom={index + 4}
      initial="hidden" animate="visible" variants={fadeUp}
      className="group flex items-center gap-4 p-3 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-[#7C4DFF]/40 transition-all duration-300 hover:-translate-y-0.5"
      data-testid={`release-card-${release.id}`}
    >
      {coverUrl ? (
        <img src={coverUrl} alt={release.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#7C4DFF]/20 to-[#E040FB]/20 flex items-center justify-center flex-shrink-0">
          <Disc className="w-7 h-7 text-[#7C4DFF]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{release.title}</p>
        <p className="text-xs text-white/50 mt-0.5">
          {release.release_type && <span className="capitalize">{release.release_type}</span>}
          {release.genre && <span> &middot; {release.genre}</span>}
        </p>
        {release.total_streams > 0 && (
          <p className="text-[11px] text-[#7C4DFF] font-medium mt-1">
            {release.total_streams.toLocaleString()} streams
          </p>
        )}
      </div>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#7C4DFF] transition-colors">
        <Play className="w-4 h-4 text-white/60 group-hover:text-white" weight="fill" />
      </div>
    </motion.div>
  );
};

const PreSaveCard = ({ campaign, index }) => {
  const coverUrl = campaign.cover_art_url
    ? `${BACKEND_URL}/api/files/${campaign.cover_art_url}`
    : null;

  const releaseDate = campaign.release_date
    ? new Date(campaign.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <motion.div
      custom={index + 6}
      initial="hidden" animate="visible" variants={fadeUp}
      className="relative bg-[#141414] rounded-2xl border border-white/10 overflow-hidden group"
      data-testid={`presave-card-${campaign.id}`}
    >
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#7C4DFF] via-[#E040FB] to-[#7C4DFF] opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" />

      <div className="relative p-5">
        <div className="flex items-center gap-4 mb-4">
          {coverUrl ? (
            <img src={coverUrl} alt={campaign.release_title} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#7C4DFF]/30 to-[#E040FB]/30 flex items-center justify-center">
              <MusicNotes className="w-8 h-8 text-[#E040FB]" />
            </div>
          )}
          <div>
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FFD700] bg-[#FFD700]/10 rounded-full mb-1">
              Upcoming
            </span>
            <p className="text-lg font-bold text-white">{campaign.release_title}</p>
            {releaseDate && (
              <p className="text-xs text-white/50 mt-0.5">Dropping {releaseDate}</p>
            )}
          </div>
        </div>

        {campaign.subscriber_count > 0 && (
          <p className="text-xs text-white/40 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {campaign.subscriber_count.toLocaleString()} pre-saves
          </p>
        )}

        <Link
          to={`/presave/${campaign.id}`}
          className="block w-full py-3 bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white text-sm font-bold rounded-full text-center hover:shadow-[0_0_20px_rgba(224,64,251,0.4)] transition-all duration-300 active:scale-95"
          data-testid={`presave-button-${campaign.id}`}
        >
          Pre-Save Now
        </Link>
      </div>
    </motion.div>
  );
};

const ShareButton = ({ slug }) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/artist/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = profileUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full text-sm font-medium text-white hover:bg-white/20 transition-all active:scale-95"
      whileTap={{ scale: 0.95 }}
      data-testid="share-profile-btn"
    >
      {copied ? (
        <><CheckCircle className="w-4 h-4 text-[#22C55E]" weight="fill" /> Copied!</>
      ) : (
        <><Copy className="w-4 h-4" /> Share Profile</>
      )}
    </motion.button>
  );
};

const formatNumber = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const ArtistProfilePage = () => {
  const { slug } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArtist();
  }, [slug]);

  const fetchArtist = async () => {
    try {
      const res = await fetch(`${API}/artist/${slug}`);
      if (!res.ok) {
        if (res.status === 404) setError('not_found');
        else setError('error');
        return;
      }
      const data = await res.json();
      setArtist(data);
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6" data-testid="artist-not-found">
        <MusicNotes className="w-16 h-16 text-white/20 mb-6" />
        <h1 className="text-2xl font-bold mb-2">
          {error === 'not_found' ? 'Artist Not Found' : 'Something went wrong'}
        </h1>
        <p className="text-white/50 text-sm mb-8">
          {error === 'not_found' ? "This profile doesn't exist or hasn't been set up yet." : 'Please try again later.'}
        </p>
        <Link to="/" className="px-6 py-2.5 bg-[#7C4DFF] rounded-full text-sm font-semibold hover:bg-[#7C4DFF]/80 transition-colors" data-testid="back-home-btn">
          Back to Home
        </Link>
      </div>
    );
  }

  const avatarUrl = artist.avatar_url
    ? `${BACKEND_URL}/api/files/${artist.avatar_url}`
    : null;

  const hasSocials = artist.website || artist.spotify_url || artist.apple_music_url || artist.instagram || artist.twitter;
  const distributedReleases = artist.releases?.filter(r => r.status === 'distributed') || [];
  const pendingReleases = artist.releases?.filter(r => r.status === 'pending_review') || [];
  const allReleases = [...distributedReleases, ...pendingReleases];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden" data-testid="artist-profile-page">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#7C4DFF]/8 via-[#E040FB]/4 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Powered by KALMORI */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-full" data-testid="kalmori-badge">
          <MusicNotes className="w-3.5 h-3.5 text-[#7C4DFF]" weight="fill" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-white/60 uppercase">Kalmori</span>
        </Link>
      </motion.div>

      <div className="relative max-w-xl mx-auto px-4 sm:px-6 w-full pt-16 pb-28">
        {/* Hero: Avatar + Name + Bio */}
        <motion.div
          custom={0} initial="hidden" animate="visible" variants={fadeUp}
          className="flex flex-col items-center text-center mb-8"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl} alt={artist.artist_name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-white/10 shadow-[0_0_40px_rgba(124,77,255,0.25)] object-cover mb-6"
              data-testid="artist-avatar"
            />
          ) : (
            <div
              className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#E040FB] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(124,77,255,0.25)]"
              data-testid="artist-avatar"
            >
              <span className="text-5xl md:text-6xl font-extrabold text-white">
                {artist.artist_name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70" data-testid="artist-name">
            {artist.artist_name}
          </h1>

          {artist.genre && (
            <motion.p custom={1} initial="hidden" animate="visible" variants={fadeUp} className="text-sm uppercase tracking-[0.2em] text-white/40 mt-2 font-medium">
              {artist.genre}{artist.country ? ` \u00b7 ${artist.country}` : ''}
            </motion.p>
          )}

          {artist.bio && (
            <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp} className="text-base leading-relaxed text-white/60 mt-4 max-w-md">
              {artist.bio}
            </motion.p>
          )}

          {/* Stats */}
          {(artist.stats?.total_streams > 0 || artist.stats?.total_releases > 0) && (
            <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp} className="flex items-center gap-6 mt-5">
              {artist.stats.total_streams > 0 && (
                <div className="text-center" data-testid="stat-streams">
                  <p className="text-xl font-bold text-white">{formatNumber(artist.stats.total_streams)}</p>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider">Streams</p>
                </div>
              )}
              {artist.stats.total_releases > 0 && (
                <div className="text-center" data-testid="stat-releases">
                  <p className="text-xl font-bold text-white">{artist.stats.total_releases}</p>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider">Releases</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Social Links */}
        {hasSocials && (
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-center flex-wrap gap-3 mb-10">
            <SocialIcon url={artist.spotify_url} icon={SpotifyLogo} label="Spotify" testId="social-link-spotify" />
            <SocialIcon url={artist.apple_music_url} icon={AppleLogo} label="Apple Music" testId="social-link-apple" />
            <SocialIcon url={artist.instagram} icon={InstagramLogo} label="Instagram" testId="social-link-instagram" />
            <SocialIcon url={artist.twitter} icon={TwitterLogo} label="Twitter" testId="social-link-twitter" />
            <SocialIcon url={artist.website} icon={Globe} label="Website" testId="social-link-website" />
          </motion.div>
        )}

        {/* Pre-Save Campaigns */}
        {artist.presave_campaigns?.length > 0 && (
          <div className="mb-10" data-testid="presave-section">
            <motion.h2 custom={5} initial="hidden" animate="visible" variants={fadeUp} className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-4">
              Upcoming Releases
            </motion.h2>
            <div className="space-y-4">
              {artist.presave_campaigns.map((c, i) => (
                <PreSaveCard key={c.id} campaign={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Released Music */}
        {allReleases.length > 0 && (
          <div className="mb-10" data-testid="releases-section">
            <motion.h2 custom={4} initial="hidden" animate="visible" variants={fadeUp} className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-4">
              Music
            </motion.h2>
            <div className="space-y-3">
              {allReleases.map((r, i) => (
                <ReleaseCard key={r.id} release={r} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {allReleases.length === 0 && !artist.presave_campaigns?.length && (
          <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp} className="text-center py-12">
            <Disc className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">No releases yet. Stay tuned!</p>
          </motion.div>
        )}
      </div>

      {/* Sticky bottom share bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="backdrop-blur-2xl bg-[#0A0A0A]/80 border-t border-white/10 p-4 flex justify-center"
            data-testid="share-bar"
          >
            <ShareButton slug={slug} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfilePage;
