import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { MusicNotes, ChartLineUp, Globe, Wallet, Play, ArrowRight, Check, List, X, ArrowUp, User, SpotifyLogo, AppleLogo, YoutubeLogo, TiktokLogo, AmazonLogo } from '@phosphor-icons/react';

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [typedText, setTypedText] = useState('');
  const fullText = "Get your music on Spotify, Apple Music, TikTok, YouTube, Tidal and more. Keep 100% ownership of your music and stay in control of your career.";
  
  const heroImages = [
    'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    'https://images.pexels.com/photos/1644616/pexels-photo-1644616.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
  ];
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((p) => (p + 1) % heroImages.length), 30000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30);
    return () => clearInterval(typeInterval);
  }, []);

  const platforms = [
    { name: 'Spotify', icon: <SpotifyLogo className="w-8 h-8" weight="fill" style={{ color: '#1DB954' }} /> },
    { name: 'Apple Music', icon: <AppleLogo className="w-8 h-8" weight="fill" style={{ color: '#fff' }} /> },
    { name: 'YouTube', icon: <YoutubeLogo className="w-8 h-8" weight="fill" style={{ color: '#FF0000' }} /> },
    { name: 'TikTok', icon: <TiktokLogo className="w-8 h-8" weight="fill" style={{ color: '#fff' }} /> },
    { name: 'Amazon', icon: <AmazonLogo className="w-8 h-8" weight="fill" style={{ color: '#FF9900' }} /> },
    { name: 'Deezer', icon: <MusicNotes className="w-8 h-8" weight="fill" style={{ color: '#FF0092' }} /> },
  ];

  const whyChooseFeatures = [
    "Unlimited music distribution worldwide",
    "Direct access to 150+ digital stores",
    "Detailed sales data to guide your strategy",
    "Keep 100% of your royalties",
    "Free ISRC & UPC codes included"
  ];

  const analyticsFeatures = [
    "Stream & download tracking",
    "Revenue analytics",
    "Audience demographics",
    "Growth insights"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMenuOpen(true)} className="p-2 lg:hidden text-white">
            <List className="w-6 h-6" />
          </button>
          
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 flex flex-col items-center">
            <span className="text-2xl font-black tracking-[4px]" style={{ color: '#E040FB' }}>KALMORI</span>
            <div className="w-12 h-[3px] rounded mt-0.5" style={{ background: 'linear-gradient(90deg, #E040FB, #FF4081)' }} />
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white">Pricing</a>
            <a href="#platforms" className="text-sm text-gray-400 hover:text-white">Platforms</a>
            <a href="#features" className="text-sm text-gray-400 hover:text-white">Features</a>
          </div>
          
          <Link to="/login" className="p-2">
            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#E040FB' }}>
              <User className="w-5 h-5" style={{ color: '#E040FB' }} />
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/80" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-[#0a0a0a] border-r border-white/10">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xl font-bold tracking-[3px]" style={{ color: '#E040FB' }}>KALMORI</span>
              <button onClick={() => setMenuOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
            </div>
            <nav className="p-5 space-y-4">
              <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 py-3 text-white"><MusicNotes className="w-5 h-5" /> Home</Link>
              <Link to="/releases" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 py-3 text-white"><Play className="w-5 h-5" /> My Releases</Link>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 py-3 text-white"><Wallet className="w-5 h-5" /> Pricing</a>
              <div className="border-t border-white/10 my-4" />
              <Link to="/login"><button className="w-full py-3 rounded-full text-white font-semibold" style={{ background: 'linear-gradient(135deg, #7C4DFF, #E040FB)' }}>Sign In</button></Link>
              <Link to="/register"><button className="w-full border py-3 rounded-full font-semibold mt-3" style={{ borderColor: '#E040FB', color: '#E040FB' }}>Create Account</button></Link>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen pt-16 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${heroImages[currentSlide]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,1) 100%)' }} />
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
            <span style={{ color: '#E040FB' }}>G.O.A.T</span> In<br />
            <span style={{ color: '#E040FB' }}>Music Distribution</span>
          </h1>
          <p className="text-gray-300 max-w-lg mb-8 text-sm sm:text-base leading-relaxed">
            {typedText}<span className="animate-pulse" style={{ color: '#E040FB' }}>|</span>
          </p>
          <Link to="/register">
            <button className="px-8 py-4 rounded-full text-white font-bold text-sm tracking-wider flex items-center gap-3" style={{ background: '#E040FB' }} data-testid="hero-cta-btn">
              DISTRIBUTE MY MUSIC ONLINE <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          
          {/* Slide Dots */}
          <div className="absolute bottom-8 right-8 flex gap-2">
            {heroImages.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2.5 rounded-full transition-all ${currentSlide === i ? 'w-6' : 'w-2.5 bg-gray-600'}`} style={currentSlide === i ? { background: '#7C4DFF' } : {}} />
            ))}
          </div>
        </div>
      </section>

      {/* Unlimited Distribution Section */}
      <section className="py-16 px-6 text-center bg-black relative">
        <p className="text-xs font-bold tracking-[3px] mb-3" style={{ color: '#E53935' }}>UNLIMITED DISTRIBUTION</p>
        <h3 className="text-2xl sm:text-3xl font-bold mb-2">
          <span style={{ color: '#E040FB' }}>Unlimited Distribution</span><br />
          <span className="text-white">Starting at</span>
        </h3>
        <p className="my-4">
          <span className="text-5xl font-black" style={{ color: '#FFD700' }}>$20</span>
          <span className="text-white text-lg">/Year</span>
        </p>
        <p className="text-gray-400 max-w-md mx-auto mb-6 text-sm">
          Increase the reach of your music across the most popular streaming platforms worldwide. One payment, 1-year distribution.
        </p>
        <a href="#pricing" className="inline-flex items-center gap-2 font-bold text-sm" style={{ color: '#E53935' }}>
          VIEW PRICING <ArrowRight className="w-4 h-4" />
        </a>
        
        {/* Floating Action Button */}
        <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40" style={{ background: 'linear-gradient(135deg, #7C4DFF, #9C27B0)' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUp className="w-6 h-6 text-white" />
        </button>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-16 px-6 text-center bg-black">
        <div className="max-w-3xl mx-auto">
          {/* Video placeholder */}
          <div className="w-full aspect-video bg-[#111] rounded-3xl mb-8" />
          
          <div className="grid grid-cols-3 gap-3 mb-8">
            {platforms.map((p, i) => (
              <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-white/30 transition-colors">
                {p.icon}
                <p className="text-xs text-gray-400 mt-2">{p.name}</p>
              </div>
            ))}
          </div>
          
          <Link to="/register">
            <button className="px-8 py-4 rounded-full text-white font-bold text-sm tracking-wider flex items-center gap-3 mx-auto" style={{ background: '#E040FB' }}>
              VIEW ALL 150+ STORES <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Global Reach Section */}
      <section className="py-16 px-6 text-center bg-black">
        <div className="max-w-3xl mx-auto">
          <div className="w-full aspect-video mb-8 rounded-2xl overflow-hidden" style={{ backgroundImage: 'url(https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          
          <p className="text-xs font-bold tracking-[3px] mb-3" style={{ color: '#E040FB' }}>GLOBAL REACH</p>
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Get Your Music<br />
            <span style={{ color: '#FFD700' }}>Everywhere</span>
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6 text-sm">
            We distribute your music to every major streaming platform including Spotify, Apple Music, Amazon Music, YouTube Music, TikTok, Instagram, and 150+ more stores worldwide.
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-300"><Check className="w-5 h-5" style={{ color: '#E040FB' }} /> All major streaming platforms</div>
            <div className="flex items-center gap-3 text-sm text-gray-300"><Check className="w-5 h-5" style={{ color: '#E040FB' }} /> Social media platforms</div>
            <div className="flex items-center gap-3 text-sm text-gray-300"><Check className="w-5 h-5" style={{ color: '#E040FB' }} /> Digital download stores</div>
          </div>
        </div>
      </section>

      {/* Need Beats Section */}
      <section className="py-8 px-6">
        <div className="max-w-xl mx-auto rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(180deg, #9C27B0 0%, #E040FB 100%)' }}>
          <MusicNotes className="w-12 h-12 text-white mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Need Beats or<br />Instrumentals?</h3>
          <p className="text-white/80 text-sm mb-6">
            Can't make your own beats? No problem! Get professional instrumentals with full rights or lease options.
          </p>
          <div className="flex flex-col items-start gap-3 mb-6 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-3 text-white"><Check className="w-5 h-5" /> Exclusive Rights Available</div>
            <div className="flex items-center gap-3 text-white"><Check className="w-5 h-5" /> Affordable Lease Options</div>
            <div className="flex items-center gap-3 text-white"><Check className="w-5 h-5" /> All Genres: Hip-Hop, R&B, Afrobeats, Dancehall</div>
            <div className="flex items-center gap-3 text-white"><Check className="w-5 h-5" /> Custom Beats on Request</div>
          </div>
          <button className="bg-white px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 mx-auto" style={{ color: '#9C27B0' }}>
            REQUEST A BEAT <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="features" className="py-16 px-6 text-center bg-black">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold tracking-[3px] mb-3 text-gray-400">WHY CHOOSE US</p>
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">
            Why <span style={{ color: '#E040FB' }}>Choose Kalmori</span>
          </h3>
          <p className="mb-8">
            <span style={{ color: '#E53935' }}>Best Choice</span>
            <span className="text-white"> of Music Distribution Companies</span>
          </p>
          
          <div className="flex flex-col items-start gap-4 mb-8 text-left">
            {whyChooseFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#E53935' }} /> {feature}
              </div>
            ))}
          </div>
          
          <button className="px-8 py-4 rounded-full text-white font-bold text-sm tracking-wider flex items-center gap-3 mx-auto" style={{ background: '#E040FB' }}>
            ALL OUR SERVICES <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-16 px-6 text-center bg-[#0a0a0a]">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold tracking-[3px] mb-3" style={{ color: '#E040FB' }}>TRACK YOUR SUCCESS</p>
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Real-Time<br />
            <span style={{ color: '#FFD700' }}>Analytics</span>
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6 text-sm">
            Monitor your streams, downloads, and earnings across all platforms. Get insights into your audience demographics and track your growth over time.
          </p>
          <div className="flex flex-col items-center gap-3">
            {analyticsFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-5 h-5" style={{ color: '#E040FB' }} /> {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[3px] mb-3" style={{ color: '#E040FB' }}>PRICING</p>
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">Simple, Transparent Pricing</h3>
          <p className="text-gray-400 text-sm mb-12">Choose the plan that works best for you</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
              <div className="text-xs font-bold py-1 px-3 rounded-full inline-block mb-4" style={{ background: '#E53935', color: '#fff' }}>UNLIMITED</div>
              <h4 className="text-lg font-bold mb-1">Single</h4>
              <p className="text-3xl font-black mb-1">$20<span className="text-sm font-normal text-gray-400">/year</span></p>
              <p className="text-xs text-gray-400 mb-4">Up to 3 tracks - 100% royalties</p>
              <Link to="/register"><button className="w-full py-3 rounded-full text-sm font-semibold" style={{ background: '#E040FB', color: '#fff' }}>Get Started</button></Link>
            </div>
            
            <div className="bg-[#111] border-2 rounded-2xl p-6 relative" style={{ borderColor: '#FFD700' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold py-1 px-4 rounded-full" style={{ background: '#FFD700', color: '#000' }}>BEST DEAL</div>
              <h4 className="text-lg font-bold mb-1 mt-4">Album</h4>
              <p className="text-3xl font-black mb-1">$75<span className="text-sm font-normal text-gray-400">/year</span></p>
              <p className="text-xs text-gray-400 mb-4">7+ tracks - 100% royalties</p>
              <Link to="/register"><button className="w-full py-3 rounded-full text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #7C4DFF, #E040FB)', color: '#fff' }}>Get Started</button></Link>
            </div>
            
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
              <div className="bg-gray-600 text-xs font-bold py-1 px-3 rounded-full inline-block mb-4">FREE</div>
              <h4 className="text-lg font-bold mb-1">Start Free</h4>
              <p className="text-3xl font-black mb-1">$0</p>
              <p className="text-xs text-gray-400 mb-4">15-20% revenue share</p>
              <Link to="/register"><button className="w-full border border-white/20 py-3 rounded-full text-sm font-semibold hover:bg-white/5">Start Free</button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(224,64,251,0.1))' }}>
        <h3 className="text-3xl sm:text-4xl font-black mb-4">Ready to Start Your<br />Journey?</h3>
        <p className="text-gray-400 mb-8 text-sm">Join thousands of artists distributing their music worldwide with Kalmori.</p>
        <Link to="/register">
          <button className="bg-white px-8 py-4 rounded-full font-bold text-sm tracking-wider inline-flex items-center gap-2" style={{ color: '#E53935' }}>
            GET STARTED FREE <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-xl font-bold tracking-[3px]" style={{ color: '#E53935' }}>KALMORI</span>
          <p className="text-gray-400 text-sm mt-2 mb-6">Your Music, Your Way</p>
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <a href="#" className="text-sm text-gray-400 hover:text-white">Terms</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white">Privacy</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white">Support</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white">Contact</a>
          </div>
          <p className="text-xs text-gray-600">© 2026 Kalmori. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
