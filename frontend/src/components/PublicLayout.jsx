import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import {
  List, X, ArrowUp, User, ShoppingCart, House, Disc, CloudArrowUp, MusicNotes, PlusCircle,
  Megaphone, FileText, ChartLine, Speedometer, ChartBar, CurrencyDollar, Wallet as WalletIcon,
  ArrowCircleUp, CreditCard, UserCircle, Palette, Bell, CaretDown, CaretUp,
  Tag, MusicNote, Briefcase, Info, Headset, Storefront, ShieldCheck, SignIn, UserPlus, ArrowLeft
} from '@phosphor-icons/react';

const PublicLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [animColor, setAnimColor] = useState('#7C4DFF');
  const [taglineColor, setTaglineColor] = useState('#FF4444');
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // Animated color cycling (purple -> magenta -> pink)
  useEffect(() => {
    const colors = ['#7C4DFF', '#E040FB', '#FF4081'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % colors.length;
      setAnimColor(colors[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Tagline color cycling (red -> gold -> pink-red)
  useEffect(() => {
    const colors = ['#FF4444', '#FFD700', '#FF6B6B'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % colors.length;
      setTaglineColor(colors[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if we're on a sub-page (dashboard sub-pages)
  const isDashboardSubPage = user && location.pathname !== '/dashboard' && location.pathname !== '/' &&
    ['/releases', '/analytics', '/wallet', '/settings'].some(p => location.pathname.startsWith(p));

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Guest menu items (matching GitHub exactly)
  const guestMenuItems = [
    { path: '/', icon: <House className="w-5 h-5" />, label: 'Home' },
    { path: '/releases', icon: <Disc className="w-5 h-5" />, label: 'My Releases' },
    { path: '/pricing', icon: <Tag className="w-5 h-5" />, label: 'Pricing' },
    { path: '/leasing', icon: <MusicNote className="w-5 h-5" />, label: 'Leasing' },
    { path: '/promoting', icon: <Megaphone className="w-5 h-5" />, label: 'Promoting' },
    { path: '/publishing', icon: <FileText className="w-5 h-5" />, label: 'Publishing' },
    { path: '/services', icon: <Briefcase className="w-5 h-5" />, label: 'Our Services' },
    { path: '/about', icon: <Info className="w-5 h-5" />, label: 'About Us' },
    { path: '/contact', icon: <Headset className="w-5 h-5" />, label: 'Contact / Support' },
    { path: '/stores', icon: <Storefront className="w-5 h-5" />, label: 'Stores' },
  ];

  // Logged-in user menu items (matching GitHub exactly)
  const userMenuItems = [
    { path: '/dashboard', icon: <House className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/releases', icon: <Disc className="w-5 h-5" />, label: 'My Releases' },
    {
      icon: <CloudArrowUp className="w-5 h-5" />, label: 'Distribute',
      submenu: [
        { path: '/releases/new', icon: <MusicNotes className="w-5 h-5" />, label: 'Upload Music' },
        { path: '/releases', icon: <PlusCircle className="w-5 h-5" />, label: 'Add Tracks' },
      ]
    },
    { path: '/promoting', icon: <Megaphone className="w-5 h-5" />, label: 'Promoting' },
    { path: '/publishing', icon: <FileText className="w-5 h-5" />, label: 'Publishing' },
    {
      icon: <ChartLine className="w-5 h-5" />, label: 'Analytics',
      submenu: [
        { path: '/analytics', icon: <Speedometer className="w-5 h-5" />, label: 'Overview' },
        { path: '/analytics', icon: <ChartBar className="w-5 h-5" />, label: 'Stream Reports' },
        { path: '/wallet', icon: <CurrencyDollar className="w-5 h-5" />, label: 'Revenue' },
      ]
    },
    {
      icon: <WalletIcon className="w-5 h-5" />, label: 'Wallet',
      submenu: [
        { path: '/wallet', icon: <WalletIcon className="w-5 h-5" />, label: 'Balance' },
        { path: '/wallet', icon: <ArrowCircleUp className="w-5 h-5" />, label: 'Withdrawals' },
        { path: '/wallet', icon: <CreditCard className="w-5 h-5" />, label: 'Payment Methods' },
      ]
    },
  ];

  const handleNav = (path) => {
    closeMenu();
    setTimeout(() => navigate(path), 200);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setActiveSubmenu(null);
  };

  const toggleSubmenu = (label) => {
    setActiveSubmenu(activeSubmenu === label ? null : label);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - exact match to TopNavigation.tsx */}
      <header className="sticky top-0 z-50 bg-black border-b border-[#1a1a1a]" data-testid="public-header">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back button on sub-pages, Menu button otherwise */}
          {isDashboardSubPage ? (
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 p-1 min-w-[44px] min-h-[44px]" data-testid="back-to-dashboard">
              <ArrowLeft className="w-6 h-6" style={{ color: animColor, transition: 'color 2s ease' }} />
              <span className="text-white text-sm font-medium">Dashboard</span>
            </button>
          ) : (
            <button onClick={() => setMenuOpen(true)} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center" data-testid="menu-toggle">
              <List className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Center: KALMORI logo */}
          <button onClick={() => navigate('/')} className="absolute left-0 right-0 flex flex-col items-center pointer-events-auto z-10" style={{ pointerEvents: 'none' }}>
            <span className="text-[24px] font-extrabold tracking-[4px] pointer-events-auto" style={{ color: animColor, transition: 'color 2s ease' }}>KALMORI</span>
            <div className="w-10 h-[3px] rounded-sm mt-1 pointer-events-auto" style={{ backgroundColor: animColor, transition: 'background-color 2s ease' }} />
          </button>

          {/* Right: Cart + Profile/Login */}
          <div className="flex items-center gap-2 z-20">
            {/* Cart Icon (logged-in only) */}
            {user && (
              <button onClick={() => navigate('/releases')} className="relative p-1" data-testid="header-cart-btn">
                <ShoppingCart className="w-6 h-6" style={{ color: animColor, transition: 'color 2s ease' }} />
              </button>
            )}

            {/* Profile / Login */}
            {isDashboardSubPage ? (
              <button onClick={() => setMenuOpen(true)} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-end" data-testid="menu-toggle-right">
                <List className="w-6 h-6 text-white" />
              </button>
            ) : user ? (
              <button onClick={() => navigate('/settings')} className="p-1" data-testid="header-profile-btn">
                <User className="w-6 h-6" style={{ color: animColor, transition: 'color 2s ease' }} />
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="p-1" data-testid="header-account-btn">
                <User className="w-6 h-6" style={{ color: animColor, transition: 'color 2s ease' }} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Slide-out Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]" data-testid="slide-menu">
          <div className="absolute inset-0 bg-black/70" onClick={closeMenu} />
          <div className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col animate-slideIn">
            {/* Menu Header */}
            <div className="flex items-center justify-between px-5 pt-[50px] pb-2">
              <div className="flex flex-col">
                <span className="text-[22px] font-extrabold tracking-[3px]" style={{ color: animColor, transition: 'color 2s ease' }}>KALMORI</span>
                <div className="w-10 h-[3px] rounded-sm mt-1" style={{ backgroundColor: animColor, transition: 'background-color 2s ease' }} />
              </div>
              <button onClick={closeMenu} className="p-1"><X className="w-6 h-6 text-white" /></button>
            </div>

            {/* Tagline */}
            <p className="px-5 mb-3 text-[13px] font-semibold tracking-wider" style={{ color: taglineColor, transition: 'color 2s ease' }}>Your Music, Your Way</p>

            {/* Animated border */}
            <div className="h-[2px] mx-0 mb-4" style={{ backgroundColor: taglineColor, transition: 'background-color 2s ease' }} />
            <div className="h-px bg-[#333] mx-5 mb-4" />

            {/* Scrollable Menu Content */}
            <div className="flex-1 overflow-y-auto px-5">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center bg-[#111] rounded-xl p-3.5 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#E53935] flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-white text-lg font-bold">{user.artist_name?.charAt(0) || user.name?.charAt(0) || 'K'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-base font-semibold truncate">{user.artist_name || user.name}</p>
                      <p className="text-white text-[13px] mt-0.5 truncate opacity-80">{user.email}</p>
                    </div>
                  </div>

                  {/* Logged-in Menu Items with Submenus */}
                  {userMenuItems.map((item) => (
                    <div key={item.label}>
                      <button
                        onClick={() => {
                          if (item.submenu) {
                            toggleSubmenu(item.label);
                          } else if (item.path) {
                            handleNav(item.path);
                          }
                        }}
                        className="flex items-center gap-3.5 w-full py-3.5 text-left"
                        data-testid={`menu-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
                      >
                        <span style={{ color: animColor, transition: 'color 2s ease' }}>{item.icon}</span>
                        <span className="flex-1 text-white text-base font-medium">{item.label}</span>
                        {item.submenu && (
                          activeSubmenu === item.label
                            ? <CaretUp className="w-4 h-4 text-gray-500" />
                            : <CaretDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {/* Submenu */}
                      {item.submenu && activeSubmenu === item.label && (
                        <div className="pl-9 pb-2">
                          {item.submenu.map((sub) => (
                            <button key={sub.label} onClick={() => handleNav(sub.path)}
                              className="flex items-center gap-3 w-full py-2.5 text-left"
                              data-testid={`submenu-${sub.label.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                              <span className="text-gray-500">{sub.icon}</span>
                              <span className="text-[#ccc] text-sm">{sub.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="h-px bg-[#222] my-4" />

                  {/* Settings & Profile */}
                  <button onClick={() => handleNav('/settings')} className="flex items-center gap-3.5 w-full py-3.5 text-left">
                    <span style={{ color: animColor, transition: 'color 2s ease' }}><UserCircle className="w-5 h-5" /></span>
                    <span className="text-white text-base font-medium">Profile</span>
                  </button>
                  <button onClick={() => handleNav('/settings')} className="flex items-center gap-3.5 w-full py-3.5 text-left">
                    <span style={{ color: animColor, transition: 'color 2s ease' }}><Palette className="w-5 h-5" /></span>
                    <span className="text-white text-base font-medium">Theme Settings</span>
                  </button>
                  <button onClick={() => handleNav('/dashboard')} className="flex items-center gap-3.5 w-full py-3.5 text-left">
                    <span style={{ color: animColor, transition: 'color 2s ease' }}><Bell className="w-5 h-5" /></span>
                    <span className="text-white text-base font-medium">Notifications</span>
                  </button>

                  <div className="h-px bg-[#222] my-4" />

                  {/* Legal Links */}
                  <button onClick={() => handleNav('/terms')} className="flex items-center gap-3.5 w-full py-3.5 text-left">
                    <span style={{ color: animColor, transition: 'color 2s ease' }}><FileText className="w-5 h-5" /></span>
                    <span className="text-white text-base font-medium">Terms & Conditions</span>
                  </button>
                  <button onClick={() => handleNav('/privacy')} className="flex items-center gap-3.5 w-full py-3.5 text-left">
                    <span style={{ color: animColor, transition: 'color 2s ease' }}><ShieldCheck className="w-5 h-5" /></span>
                    <span className="text-white text-base font-medium">Privacy Policy</span>
                  </button>

                  {/* Logout */}
                  <button onClick={async () => { closeMenu(); await logout(); navigate('/'); }}
                    className="flex items-center gap-3.5 w-full py-3.5 text-left" data-testid="menu-logout">
                    <span className="text-[#E53935]"><SignIn className="w-5 h-5" /></span>
                    <span className="text-[#E53935] text-base font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Guest Menu Items */}
                  {guestMenuItems.map((item) => (
                    <button key={item.path} onClick={() => handleNav(item.path)}
                      className="flex items-center gap-3.5 w-full py-[14px] text-left"
                      data-testid={`menu-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                      <span style={{ color: animColor, transition: 'color 2s ease' }}>{item.icon}</span>
                      <span className="text-white text-base font-medium">{item.label}</span>
                    </button>
                  ))}

                  <div className="h-px bg-[#222] my-4" />

                  {/* Legal Links */}
                  <button onClick={() => handleNav('/terms')} className="flex items-center gap-3.5 w-full py-[14px] text-left">
                    <span style={{ color: animColor, transition: 'color 2s ease' }}><FileText className="w-5 h-5" /></span>
                    <span className="text-white text-base font-medium">Terms & Conditions</span>
                  </button>
                  <button onClick={() => handleNav('/privacy')} className="flex items-center gap-3.5 w-full py-[14px] text-left">
                    <span style={{ color: animColor, transition: 'color 2s ease' }}><ShieldCheck className="w-5 h-5" /></span>
                    <span className="text-white text-base font-medium">Privacy Policy</span>
                  </button>

                  <div className="h-px bg-[#222] my-4" />

                  {/* Auth Buttons */}
                  <button onClick={() => handleNav('/login')}
                    className="w-full py-3.5 rounded-lg bg-[#E040FB] text-center text-white text-base font-semibold mb-3"
                    data-testid="menu-signin">
                    Sign In
                  </button>
                  <button onClick={() => handleNav('/register')}
                    className="w-full py-3.5 rounded-lg border border-[#E040FB] text-center text-[#E040FB] text-base font-semibold"
                    data-testid="menu-create-account">
                    Create Account
                  </button>
                </>
              )}
            </div>

            {/* Menu Footer */}
            <div className="px-5 py-4 border-t border-[#1a1a1a]">
              <p className="text-[#666] text-xs text-center">&copy; 2026 Kalmori. All rights reserved.</p>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-[90px] right-5 z-50 w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-lg shadow-[#7C4DFF]/30" style={{ backgroundColor: animColor, transition: 'background-color 2s ease' }} data-testid="scroll-to-top">
          <ArrowUp className="w-6 h-6 text-white" weight="bold" />
        </button>
      )}
    </div>
  );
};

export default PublicLayout;
