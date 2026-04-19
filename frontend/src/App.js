import React, { createContext, useContext, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from './components/ui/sonner';
import CookieConsent from './components/CookieConsent';
import FeatureRoute from './components/FeatureRoute';
import FocusOnRouteChange from './components/FocusOnRouteChange';
import RoleRoute from './components/RoleRoute';
import ScrollToTop from './components/ScrollToTop';
import { getRequiredPlansForFeature } from './components/featureAccess';
import { api } from './services/api';
import { CartProvider } from './context/CartContext';

// Configure axios for backward compatibility with cookie-based pages
axios.defaults.withCredentials = true;

// Global axios interceptor: auto-refresh token on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve());
  failedQueue = [];
};

axios.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: () => resolve(axios(originalRequest)), reject });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Pages (lazy-loaded for code splitting)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ReleasesPage = lazy(() => import('./pages/ReleasesPage'));
const ReleaseDetailPage = lazy(() => import('./pages/ReleaseDetailPage'));
const ReleaseWizardPage = lazy(() => import('./pages/ReleaseWizardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminSubmissionsPage = lazy(() => import('./pages/AdminSubmissionsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminBeatsPage = lazy(() => import('./pages/AdminBeatsPage'));
const AdminRoyaltyImportPage = lazy(() => import('./pages/AdminRoyaltyImportPage'));
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage'));
const AdminCampaignsPage = lazy(() => import('./pages/AdminCampaignsPage'));
const AdminLeadsPage = lazy(() => import('./pages/AdminLeadsPage'));
const AdminFeatureAnnouncementsPage = lazy(() => import('./pages/AdminFeatureAnnouncementsPage'));
const AdminNotificationsPage = lazy(() => import('./pages/AdminNotificationsPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const AgreementPage = lazy(() => import('./pages/AgreementPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PromotingPage = lazy(() => import('./pages/PromotingPage'));
const PublishingPage = lazy(() => import('./pages/PublishingPage'));
const StoresPage = lazy(() => import('./pages/StoresPage'));
const InstrumentalsPage = lazy(() => import('./pages/InstrumentalsPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const SpotifyCanvasPage = lazy(() => import('./pages/SpotifyCanvasPage'));
const ContentIdPage = lazy(() => import('./pages/ContentIdPage'));
const MyPurchasesPage = lazy(() => import('./pages/MyPurchasesPage'));
const CollaborationsPage = lazy(() => import('./pages/CollaborationsPage'));
const PreSaveManagerPage = lazy(() => import('./pages/PreSavePage'));
const PreSaveLandingPage = lazy(() => import('./pages/PreSavePage').then(m => ({ default: m.PreSaveLandingPage })));
const FanAnalyticsPage = lazy(() => import('./pages/FanAnalyticsPage'));
const RevenueAnalyticsPage = lazy(() => import('./pages/RevenueAnalyticsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const ArtistProfilePage = lazy(() => import('./pages/ArtistProfilePage'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const LabelDashboardPage = lazy(() => import('./pages/LabelDashboardPage'));
const ProducerBeatBankPage = lazy(() => import('./pages/ProducerBeatBankPage'));
const RequestBeatPage = lazy(() => import('./pages/RequestBeatPage'));
const AdminEmailSettingsPage = lazy(() => import('./pages/AdminEmailSettingsPage'));
const AdminPromoCodesPage = lazy(() => import('./pages/AdminPromoCodesPage'));
const AdminPlansPage = lazy(() => import('./pages/AdminPlansPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const AdminReferralsPage = lazy(() => import('./pages/AdminReferralsPage'));
const AdminAnalyticsReportsPage = lazy(() => import('./pages/AdminAnalyticsReportsPage'));
const AdminContractsPage = lazy(() => import('./pages/AdminContractsPage'));
const AdminPayoutsPage = lazy(() => import('./pages/AdminPayoutsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CollabHubPage = lazy(() => import('./pages/CollabHubPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const RoyaltySplitsPage = lazy(() => import('./pages/RoyaltySplitsPage'));
const PageBuilderPage = lazy(() => import('./pages/PageBuilderPage'));
const SpotifyAnalyticsPage = lazy(() => import('./pages/SpotifyAnalyticsPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Inactivity timeout (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Activity tracking for inactivity timeout
  const updateActivity = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  // Check for inactivity timeout
  useEffect(() => {
    if (!user || !token) return;
    const checkInactivity = () => {
      const lastActivityTime = parseInt(localStorage.getItem('lastActivity') || Date.now().toString());
      if (Date.now() - lastActivityTime > INACTIVITY_TIMEOUT) {
        console.log('Session expired due to inactivity');
        performLogout();
      }
    };
    const interval = setInterval(checkInactivity, 60000);
    return () => clearInterval(interval);
  }, [user, token]);

  // Activity listeners
  useEffect(() => {
    const handleActivity = () => updateActivity();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [updateActivity]);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        api.setToken(storedToken);
        updateActivity();
      } else {
        // Fallback: try cookie-based auth check
        try {
          const response = await fetch(`${API}/auth/me`, { credentials: 'include' });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.login(email, password);
    const accessToken = response.access_token;
    const userData = response.user;
    setToken(accessToken);
    setUser(userData);
    api.setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    updateActivity();
    return userData;
  };

  const register = async (data) => {
    const response = await api.register(
      data.email, data.password, data.artist_name || data.name, data.name,
      data.user_role, data.legal_name, data.country,
      data.recaptcha_token, data.state, data.town, data.post_code
    );
    const accessToken = response.access_token;
    const userData = response.user;
    setToken(accessToken);
    setUser(userData);
    api.setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    updateActivity();
    return userData;
  };

  const performLogout = () => {
    setToken(null);
    setUser(null);
    api.setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    performLogout();
  };

  const processGoogleSession = async (sessionId) => {
    const response = await fetch(`${API}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to process session');
    // If the session endpoint returns a token, use it
    if (data.access_token) {
      setToken(data.access_token);
      setUser(data.user);
      api.setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    }
    updateActivity();
    return data;
  };

  const updateUser = (data) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      updateActivity();
    }
  };

  const checkAuth = loadStoredAuth;

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, processGoogleSession, checkAuth, updateUser, updateActivity }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

// Admin Protected Route
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const LabelRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  const role = user?.user_role || user?.role;
  if (!['label', 'label_producer'].includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PageFallback = () => (
  <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
  </div>
);

// App Router
const AppRouter = () => {
  const location = useLocation();
  if (location.hash?.includes('session_id=')) {
    return (
      <>
        <ScrollToTop />
        <FocusOnRouteChange />
        <Suspense fallback={<PageFallback />}><AuthCallback /></Suspense>
      </>
    );
  }
  return (
    <>
      <ScrollToTop />
      <FocusOnRouteChange />
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/releases" element={<ProtectedRoute><ReleasesPage /></ProtectedRoute>} />
        <Route path="/releases/new" element={<ProtectedRoute><ReleaseWizardPage /></ProtectedRoute>} />
        <Route path="/releases/:id" element={<ProtectedRoute><ReleaseDetailPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/spotify-canvas" element={<FeatureRoute requiredPlans={getRequiredPlansForFeature('spotify_canvas')}><SpotifyCanvasPage /></FeatureRoute>} />
        <Route path="/content-id" element={<FeatureRoute requiredPlans={getRequiredPlansForFeature('content_id')}><ContentIdPage /></FeatureRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><MyPurchasesPage /></ProtectedRoute>} />
        <Route path="/collaborations" element={<FeatureRoute requiredPlans={getRequiredPlansForFeature('collaborations')}><CollaborationsPage /></FeatureRoute>} />
              <Route path="/collab-hub" element={<ProtectedRoute><CollabHubPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/royalty-splits" element={<ProtectedRoute><RoyaltySplitsPage /></ProtectedRoute>} />
        <Route path="/presave-manager" element={<FeatureRoute requiredPlans={getRequiredPlansForFeature('presave')}><PreSaveManagerPage /></FeatureRoute>} />
        <Route path="/fan-analytics" element={<FeatureRoute requiredPlans={getRequiredPlansForFeature('fan_analytics')}><FanAnalyticsPage /></FeatureRoute>} />
        <Route path="/revenue" element={<ProtectedRoute><RevenueAnalyticsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<FeatureRoute requiredPlans={getRequiredPlansForFeature('leaderboard')}><LeaderboardPage /></FeatureRoute>} />
        <Route path="/goals" element={<FeatureRoute requiredPlans={getRequiredPlansForFeature('goals')}><GoalsPage /></FeatureRoute>} />
              <Route path="/referrals" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/presave/:campaignId" element={<PreSaveLandingPage />} />
        <Route path="/artist/:slug" element={<ArtistProfilePage />} />
        <Route path="/select-role" element={<RoleSelectionPage />} />
        <Route path="/label" element={<LabelRoute><LabelDashboardPage /></LabelRoute>} />
        <Route path="/beat-bank" element={<RoleRoute allowedRoles={['producer', 'label', 'label_producer']}><ProducerBeatBankPage /></RoleRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/spotify" element={<ProtectedRoute><SpotifyAnalyticsPage /></ProtectedRoute>} />
        <Route path="/features" element={<ProtectedRoute><FeaturesPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissionsPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
              <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetailPage /></AdminRoute>} />
              <Route path="/admin/beats" element={<AdminRoute><AdminBeatsPage /></AdminRoute>} />
              <Route path="/admin/royalty-import" element={<AdminRoute><AdminRoyaltyImportPage /></AdminRoute>} />
              <Route path="/admin/campaigns" element={<AdminRoute><AdminCampaignsPage /></AdminRoute>} />
              <Route path="/admin/leads" element={<AdminRoute><AdminLeadsPage /></AdminRoute>} />
              <Route path="/admin/email-settings" element={<AdminRoute><AdminEmailSettingsPage /></AdminRoute>} />
              <Route path="/admin/promo-codes" element={<AdminRoute><AdminPromoCodesPage /></AdminRoute>} />
              <Route path="/admin/plans" element={<AdminRoute><AdminPlansPage /></AdminRoute>} />
              <Route path="/admin/referrals" element={<AdminRoute><AdminReferralsPage /></AdminRoute>} />
              <Route path="/admin/analytics-reports" element={<AdminRoute><AdminAnalyticsReportsPage /></AdminRoute>} />
              <Route path="/admin/contracts" element={<AdminRoute><AdminContractsPage /></AdminRoute>} />
              <Route path="/admin/payouts" element={<AdminRoute><AdminPayoutsPage /></AdminRoute>} />
              <Route path="/admin/page-builder" element={<AdminRoute><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/page-builder/:slug" element={<AdminRoute><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/feature-announcements" element={<AdminRoute><AdminFeatureAnnouncementsPage /></AdminRoute>} />
              <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationsPage /></AdminRoute>} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/agreement" element={<AgreementPage />} />
        <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/promoting" element={<PromotingPage />} />
        <Route path="/publishing" element={<PublishingPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/leasing" element={<InstrumentalsPage />} />
        <Route path="/instrumentals" element={<InstrumentalsPage />} />
        <Route path="/request-beat" element={<RequestBeatPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
          <Toaster position="top-center" offset={16} />
          <CookieConsent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { API, BACKEND_URL };
