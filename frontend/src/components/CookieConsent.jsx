import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from '@phosphor-icons/react';

const COOKIE_KEY = 'kalmori_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = (level) => {
    const consentData = {
      level, // 'all', 'essential', 'declined'
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consentData));
    setVisible(false);

    // Log consent to backend for compliance
    try {
      const API = process.env.REACT_APP_BACKEND_URL;
      fetch(`${API}/api/cookie-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentData),
        credentials: 'include',
      }).catch(() => {});
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up" data-testid="cookie-banner">
      <div className="max-w-3xl mx-auto bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#7C4DFF]/15 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-[#7C4DFF]" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white mb-1">We Value Your Privacy</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze site traffic, and personalize content. 
                By clicking "Accept All", you consent to our use of cookies.
              </p>

              {showDetails && (
                <div className="mt-4 space-y-3 bg-white/[0.02] rounded-xl p-4 border border-white/5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#1DB954] flex-shrink-0 mt-0.5" weight="fill" />
                    <div>
                      <p className="text-xs font-bold text-white">Essential Cookies</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Required for the site to function. Includes authentication, security, and basic preferences. Always active.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cookie className="w-4 h-4 text-[#7C4DFF] flex-shrink-0 mt-0.5" weight="fill" />
                    <div>
                      <p className="text-xs font-bold text-white">Analytics Cookies</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Help us understand how visitors interact with our website. Used to improve our services, track page views, and measure campaign effectiveness.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cookie className="w-4 h-4 text-[#E040FB] flex-shrink-0 mt-0.5" weight="fill" />
                    <div>
                      <p className="text-xs font-bold text-white">Marketing Cookies</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Used to deliver personalized ads and track conversions. May be shared with advertising partners to show you relevant content across platforms.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button onClick={() => handleAccept('all')}
                  className="px-5 py-2 bg-[#7C4DFF] text-white text-xs font-bold rounded-full hover:bg-[#7C4DFF]/80 transition-all"
                  data-testid="accept-all-cookies">
                  Accept All
                </button>
                <button onClick={() => handleAccept('essential')}
                  className="px-5 py-2 bg-white/5 text-white/70 text-xs font-medium rounded-full hover:bg-white/10 transition-all border border-white/10"
                  data-testid="accept-essential-cookies">
                  Essential Only
                </button>
                <button onClick={() => handleAccept('declined')}
                  className="px-5 py-2 text-white/40 text-xs font-medium hover:text-white/60 transition-all"
                  data-testid="decline-cookies">
                  Decline
                </button>
                <button onClick={() => setShowDetails(!showDetails)}
                  className="px-3 py-2 text-[#7C4DFF] text-xs font-medium hover:underline transition-all ml-auto"
                  data-testid="cookie-details-toggle">
                  {showDetails ? 'Hide Details' : 'Learn More'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
      `}</style>
    </div>
  );
}
