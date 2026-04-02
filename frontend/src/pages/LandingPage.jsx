import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import GlobalFooter from '../components/GlobalFooter';
import { ArrowRight, Check, SpotifyLogo, AppleLogo, YoutubeLogo, TiktokLogo, InstagramLogo, Envelope, MusicNote, Playlist, Rocket, CheckCircle } from '@phosphor-icons/react';

// Hero images
const heroSlideImages = [
  'https://customer-assets.emergentagent.com/job_9d65d3d0-8e4c-4ca7-97e3-3472b806edee/artifacts/oldly27j_vecteezy_professional-microphone-on-stage-in-a-bar-in-the-pink-rays_46833147_1.jpg',
  'https://customer-assets.emergentagent.com/job_9d65d3d0-8e4c-4ca7-97e3-3472b806edee/artifacts/3rjo6nvi_large-vecteezy_music-recording-studio-with-professional-equipment-and_34430986_large.jpg',
];

// Promotion card images
const promoImages = {
  instagram: 'https://images.pexels.com/photos/8488289/pexels-photo-8488289.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  tiktok: 'https://images.pexels.com/photos/17781869/pexels-photo-17781869.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  email: 'https://images.unsplash.com/photo-1705484228982-fd9655904a07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxlbWFpbCUyMGtleWJvYXJkJTIwbGV0dGVycyUyMHNjcmFiYmxlfGVufDB8fHx8MTc3NTExNTQ2OHww&ixlib=rb-4.1.0&q=85',
  playlists: 'https://images.unsplash.com/photo-1748781208325-18107f54fa57?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwyfHx2aW55bCUyMHJlY29yZCUyMHR1cm50YWJsZSUyMGNsb3NlJTIwdXB8ZW58MHx8fHwxNzc1MTE1NDY4fDA&ixlib=rb-4.1.0&q=85',
};
const studioImage = 'https://images.pexels.com/photos/7586656/pexels-photo-7586656.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

// Animated Color Text (purple/magenta/pink cycling)
const AnimatedColorText = ({ children, className = '' }) => (
  <span className={`animate-color-cycle ${className}`}>{children}</span>
);

// Typewriter for hero
const HeroTypewriterSequence = () => {
  const [phase, setPhase] = useState(0);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [desc, setDesc] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const LINE1 = "G.O.A.T In";
  const LINE2 = "Music Distribution";
  const DESC = "Get your music on Spotify, Apple Music, TikTok, YouTube, Tidal and more. Keep 100% ownership of your music and stay in control of your career.";

  useEffect(() => {
    let timeout;
    if (phase === 0) {
      if (line1.length < LINE1.length) timeout = setTimeout(() => setLine1(LINE1.slice(0, line1.length + 1)), 120);
      else timeout = setTimeout(() => setPhase(1), 500);
    } else if (phase === 1) {
      if (line2.length < LINE2.length) timeout = setTimeout(() => setLine2(LINE2.slice(0, line2.length + 1)), 80);
      else timeout = setTimeout(() => setPhase(2), 500);
    } else if (phase === 2) {
      if (!isDeleting) {
        if (desc.length < DESC.length) timeout = setTimeout(() => setDesc(DESC.slice(0, desc.length + 1)), 30);
        else timeout = setTimeout(() => setIsDeleting(true), 3000);
      } else {
        if (desc.length > 0) timeout = setTimeout(() => setDesc(DESC.slice(0, desc.length - 1)), 15);
        else timeout = setTimeout(() => setIsDeleting(false), 1000);
      }
    }
    return () => clearTimeout(timeout);
  }, [phase, line1, line2, desc, isDeleting]);

  return (
    <div className="text-center">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-2">
        <AnimatedColorText>{line1}</AnimatedColorText>
        {phase === 0 && <span className="animate-blink text-[#7C4DFF]">|</span>}
      </h1>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
        <AnimatedColorText>{line2}</AnimatedColorText>
        {phase === 1 && <span className="animate-blink text-[#7C4DFF]">|</span>}
      </h2>
      <p className="text-[15px] text-gray-300 leading-relaxed max-w-lg mx-auto min-h-[80px]">
        {desc}<span className={`animate-blink text-[#7C4DFF] ${phase < 2 ? 'hidden' : ''}`}>|</span>
      </p>
    </div>
  );
};

// AnimatedButton component (same as before)
const AnimatedButton = ({ children, onClick, className = '' }) => (
  <button onClick={onClick} className={`animate-btn-gradient text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 tracking-[1px] hover:brightness-110 transition-all ${className}`}>
    {children}
  </button>
);

// Platform data for the 3x2 grid
const platforms = [
  { name: 'Spotify', icon: <SpotifyLogo className="w-8 h-8" weight="fill" />, color: '#1DB954' },
  { name: 'Apple Music', icon: <AppleLogo className="w-8 h-8" weight="fill" />, color: '#FC3C44' },
  { name: 'YouTube', icon: <YoutubeLogo className="w-8 h-8" weight="fill" />, color: '#FF0000' },
  { name: 'TikTok', icon: <TiktokLogo className="w-8 h-8" weight="fill" />, color: '#00F2EA' },
  { name: 'Amazon', icon: <MusicNote className="w-8 h-8" weight="fill" />, color: '#00A8E1' },
  { name: 'Deezer', icon: <MusicNote className="w-8 h-8" weight="fill" />, color: '#FEAA2D' },
];

// Promotion channels
const promoChannels = [
  { name: 'Instagram', desc: 'Stories, Reels & Posts', icon: <InstagramLogo className="w-7 h-7" weight="fill" />, color: '#E4405F', image: promoImages.instagram },
  { name: 'TikTok', desc: 'Viral Marketing', icon: <TiktokLogo className="w-7 h-7" weight="fill" />, color: '#00F2EA', image: promoImages.tiktok },
  { name: 'Email', desc: 'Curator Outreach', icon: <Envelope className="w-7 h-7" weight="fill" />, color: '#FFD700', image: promoImages.email },
  { name: 'Playlists', desc: 'Editorial Pitching', icon: <Playlist className="w-7 h-7" weight="fill" />, color: '#1DB954', image: promoImages.playlists },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((p) => (p + 1) % heroSlideImages.length), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentSlide === 1) {
      setZoomScale(1);
      const zoomInterval = setInterval(() => setZoomScale(prev => Math.min(prev + 0.009, 1.25)), 1000);
      return () => clearInterval(zoomInterval);
    } else setZoomScale(1);
  }, [currentSlide]);

  return (
    <PublicLayout>
      {/* CSS Animations */}
      <style>{`
        @keyframes colorCycle { 0%{color:#7C4DFF} 33%{color:#E040FB} 66%{color:#FF4081} 100%{color:#7C4DFF} }
        @keyframes taglineCycle { 0%{color:#FF4444} 50%{color:#FFD700} 100%{color:#FF4444} }
        @keyframes btnGradient { 0%{background:#7C4DFF} 33%{background:#E040FB} 66%{background:#FF4081} 100%{background:#7C4DFF} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .animate-color-cycle { animation: colorCycle 6s ease-in-out infinite; }
        .animate-tagline-cycle { animation: taglineCycle 4s ease-in-out infinite; }
        .animate-btn-gradient { animation: btnGradient 6s ease-in-out infinite; }
        .animate-blink { animation: blink 1s step-end infinite; }
      `}</style>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen overflow-hidden" data-testid="hero-section">
        {heroSlideImages.map((img, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-[2000ms]" style={{ opacity: currentSlide === i ? 1 : 0 }}>
            <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-[30000ms]"
              style={{ transform: currentSlide === i ? `scale(${i === 1 ? zoomScale : 1.1})` : 'scale(1)' }} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
          <HeroTypewriterSequence />
          <div className="mt-10">
            <Link to="/register">
              <button className="bg-[#E53935] px-10 py-4 rounded-full text-white font-bold text-sm tracking-[2px] flex items-center gap-3 hover:brightness-110 transition-all" data-testid="hero-cta-btn">
                DISTRIBUTE MY MUSIC ONLINE <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
          {/* Slide dots */}
          <div className="mt-8 flex gap-2">
            {heroSlideImages.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === i ? 'bg-[#E53935] w-8' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== AVAILABLE EVERYWHERE - Platform Grid ===== */}
      <section className="py-16 px-4 bg-black" data-testid="platforms-section">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-[#E040FB] tracking-[3px] mb-3">AVAILABLE EVERYWHERE</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Distribute to <span className="text-[#E040FB]">150+ Platforms</span></h2>
        </div>
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {platforms.map((p, i) => (
            <div key={i} className="bg-[#111] rounded-2xl py-6 px-3 flex flex-col items-center gap-2.5 border border-[#1a1a1a]" data-testid={`platform-${p.name.toLowerCase().replace(' ', '-')}`}>
              <div style={{ color: p.color }}>{p.icon}</div>
              <span className="text-[13px] font-semibold text-white">{p.name}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button onClick={() => navigate('/stores')} className="px-8 py-3.5 rounded-full bg-[#7C4DFF] text-white text-sm font-bold tracking-[1px] inline-flex items-center gap-2 hover:brightness-110 transition-all" data-testid="view-all-stores-btn">
            VIEW ALL 150+ STORES <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-16 px-4 bg-[#0a0a0a]" data-testid="why-choose-section">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold text-[#E53935] tracking-[3px] mb-3 text-center">WHY CHOOSE US</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-2">
            Why <span className="text-[#E53935]">Choose</span> Kalmori
          </h2>
          <h3 className="text-lg sm:text-xl font-bold text-white text-center mb-8">
            <span className="text-[#E53935]">Best Choice</span> of Music Distribution Companies
          </h3>

          <div className="space-y-5">
            {[
              'Keep 100% ownership and control of your master recordings',
              'Distribute to 150+ major platforms worldwide including Spotify, Apple Music, TikTok, and more',
              'Get paid directly with transparent royalty reporting and no hidden fees',
              'Free ISRC and UPC codes included with every release',
              'Professional promotion tools to grow your fanbase',
              'AI-powered metadata suggestions and analytics insights',
              'Dedicated support team available to help you succeed',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-[#E040FB] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" weight="bold" />
                </div>
                <p className="text-[15px] text-gray-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate('/services')} className="px-8 py-3.5 rounded-full bg-[#7C4DFF] text-white text-sm font-bold tracking-[1px] inline-flex items-center gap-2 hover:brightness-110 transition-all" data-testid="all-services-btn">
              ALL OUR SERVICES <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== PROMOTION SERVICES ===== */}
      <section className="py-16 px-4 bg-black" data-testid="promotion-section">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold text-[#E040FB] tracking-[3px] mb-3 text-center">PROMOTION SERVICES</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-8">
            Promotion <span className="text-[#E040FB]">Services</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {promoChannels.map((ch, i) => (
              <div key={i} className="bg-[#111] rounded-2xl overflow-hidden border border-[#1a1a1a]" data-testid={`promo-card-${ch.name.toLowerCase()}`}>
                <div className="h-28 overflow-hidden relative">
                  <img src={ch.image} alt={ch.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                </div>
                <div className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${ch.color}20`, color: ch.color }}>
                    {ch.icon}
                  </div>
                  <h3 className="text-base font-bold text-white">{ch.name}</h3>
                  <p className="text-[13px] text-gray-400 mt-1">{ch.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button onClick={() => navigate('/promoting')} className="text-[#E040FB] text-sm font-bold tracking-[1px] inline-flex items-center gap-2 hover:underline" data-testid="learn-promo-link">
              LEARN MORE ABOUT PROMOTION <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== ACCELERATOR / CTA SECTION ===== */}
      <section className="py-16 px-4 bg-[#0a0a0a]" data-testid="accelerator-section">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Reach More Fans. Increase Your Streams. Grow Your Music <span className="text-[#E53935]">Career.</span>
          </h2>
          <p className="text-[15px] text-gray-300 leading-relaxed mb-6">
            Kalmori accelerator is designed to help emerging artists break through the noise. Our comprehensive suite of tools, analytics, and promotion services gives you everything you need to build a sustainable music career.
          </p>
          <div className="flex gap-3 mb-8">
            <button onClick={() => navigate('/register')} className="px-8 py-3.5 rounded-full bg-[#7C4DFF] text-white text-sm font-bold tracking-[1px] inline-flex items-center gap-2 hover:brightness-110 transition-all" data-testid="accelerator-signup-btn">
              SIGN UP <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/about')} className="px-8 py-3.5 rounded-full border-2 border-[#7C4DFF] text-[#7C4DFF] text-sm font-bold tracking-[1px] hover:bg-[#7C4DFF]/10 transition-all" data-testid="accelerator-report-btn">
              READ THE REPORT
            </button>
          </div>
          {/* Studio Image */}
          <div className="rounded-2xl overflow-hidden">
            <img src={studioImage} alt="Recording studio" className="w-full h-48 sm:h-64 object-cover" />
          </div>
        </div>
      </section>

      {/* ===== BUILT FOR YOUNG ARTISTS ===== */}
      <section className="py-16 px-4 bg-black" data-testid="young-artists-section">
        <div className="max-w-lg mx-auto">
          <div className="bg-[#111] rounded-3xl p-8 text-center border border-[#1a1a1a]">
            <div className="w-16 h-16 rounded-full bg-[#7C4DFF]/20 flex items-center justify-center mx-auto mb-5">
              <Rocket className="w-8 h-8 text-[#7C4DFF]" weight="fill" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Built for Young Artists & Producers</h2>
            <p className="text-[15px] text-gray-300 leading-relaxed">
              Whether you're just starting out or ready to take your career to the next level, Kalmori provides the tools, distribution, and support you need to succeed in the music industry.
            </p>
          </div>
        </div>
      </section>

      {/* ===== PRICING QUICK SECTION ===== */}
      <section className="py-16 px-4 bg-[#0a0a0a]" data-testid="pricing-section">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-[#E040FB] tracking-[3px] mb-3">SIMPLE PRICING</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Plans That <span className="text-[#E040FB]">Scale</span> With You</h2>
        </div>
        <div className="max-w-lg mx-auto space-y-4">
          {[
            { name: 'FREE', price: '$0', desc: 'Start distributing with revenue share', color: '#4CAF50' },
            { name: 'UNLIMITED SINGLE', price: '$20/yr', desc: 'Perfect for single releases', color: '#7C4DFF' },
            { name: 'ALBUM', price: '$75/yr', desc: 'Best value for full albums', color: '#FFD700', highlight: true },
          ].map((plan, i) => (
            <div key={i} className={`bg-[#111] rounded-2xl p-5 flex items-center justify-between border-2 ${plan.highlight ? 'border-[#FFD700]' : 'border-[#1a1a1a]'}`} data-testid={`home-plan-${plan.name.toLowerCase().replace(/\s/g, '-')}`}>
              <div>
                <h3 className="text-base font-bold text-white">{plan.name}</h3>
                <p className="text-[13px] text-gray-400 mt-0.5">{plan.desc}</p>
              </div>
              <span className="text-2xl font-extrabold" style={{ color: plan.color }}>{plan.price}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/register')} className="px-8 py-3.5 rounded-full bg-[#E53935] text-white text-sm font-bold tracking-[1px] inline-flex items-center gap-2 hover:brightness-110 transition-all" data-testid="home-start-free-btn">
            START FREE <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/pricing')} className="px-8 py-3.5 rounded-full border-2 border-[#E53935] text-[#E53935] text-sm font-bold tracking-[1px] hover:bg-[#E53935]/10 transition-all" data-testid="home-pricing-btn">
            PRICING
          </button>
        </div>
      </section>

      {/* ===== READY TO START JOURNEY - Gradient CTA ===== */}
      <section className="py-20 px-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,77,255,0.4), rgba(224,64,251,0.3))' }} data-testid="journey-section">
        <h3 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Start Your<br/>Journey?</h3>
        <p className="text-gray-300 mb-8 text-[15px] max-w-md mx-auto">Join thousands of artists distributing their music worldwide with Kalmori.</p>
        <Link to="/register">
          <button className="bg-[#E040FB] text-white px-10 py-4 rounded-full font-bold text-sm tracking-[2px] inline-flex items-center gap-2 hover:brightness-110 transition-all" data-testid="journey-cta-btn">
            GET STARTED FREE <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </section>

      <GlobalFooter />
    </PublicLayout>
  );
};

export default LandingPage;
