import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GoogleLogo, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getSafeErrorDetail } from '../utils/error';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(returnPath, { replace: true });
    } catch (err) {
      setError(getSafeErrorDetail(err, err.message || 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.info('Google login coming soon. Please use email and password.');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #7C4DFF 0%, #9C27B0 30%, #E040FB 70%, #FF4081 100%)' }} />
      <div className="absolute inset-0 bg-black/50" />

      <style>{`
        @keyframes shimmer-blue {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .btn-animated-blue {
          background: linear-gradient(90deg, #0095FF, #7468F8, #0095FF, #7468F8);
          background-size: 300% 100%;
          animation: shimmer-blue 3s ease-in-out infinite;
        }
        .logo-animated-blue {
          background: linear-gradient(90deg, #0095FF, #7468F8, #0095FF, #7468F8);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-blue 3s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 py-12 text-center">
        <Link to="/" className="inline-block mb-10">
          <span className="text-3xl font-black tracking-[6px] logo-animated-blue">
            KALMORI
          </span>
        </Link>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-left" data-testid="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Email Address</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-gray-600 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0095FF] transition-colors"
              required data-testid="login-email-input"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0095FF] transition-colors pr-10"
                required data-testid="login-password-input"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                data-testid="toggle-password-visibility"
              >
                {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit" disabled={loading}
              className="btn-animated-blue hover:brightness-110 text-white text-sm font-bold tracking-[1.5px] uppercase px-10 py-3 rounded-full transition-all min-w-[140px]"
              data-testid="login-submit-btn"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'LOG IN'}
            </button>
          </div>
        </form>

        <div className="mt-5">
          <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-[#0095FF] underline transition-colors" data-testid="forgot-password-link">
            Forgot your password?
          </Link>
        </div>

        <div className="mt-4">
          <Link to="/register" state={location.state} className="text-sm text-[#0095FF] hover:brightness-125 transition-colors" data-testid="signup-link">
            I need an account
          </Link>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
          <div className="relative flex justify-center"><span className="px-4 bg-black/50 text-xs text-gray-500 backdrop-blur-sm">or</span></div>
        </div>

        <button type="button" onClick={handleGoogleLogin}
          className="w-full border border-gray-600 hover:border-[#0095FF] text-white py-3 rounded-full flex items-center justify-center gap-2 transition-all text-sm font-medium"
          data-testid="google-login-btn"
        >
          <GoogleLogo className="w-5 h-5" weight="bold" /> Continue with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
