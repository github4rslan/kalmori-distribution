import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { ArrowLeft, EnvelopeSimple, Check, Lock } from '@phosphor-icons/react';

export default function ResetPasswordPage() {
  const [step, setStep] = useState('request'); // request | sent | reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract token from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) { setToken(t); setStep('reset'); }
  }, []);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setStep('sent');
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 12) { setError('Password must be at least 12 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, new_password: newPassword })
      });
      const d = await res.json();
      if (!res.ok) { throw new Error(d.detail || 'Failed'); }
      setStep('done');
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Could not connect to server. Please try again.');
      } else {
        setError(err.message);
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" data-testid="reset-password-page">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        {step === 'request' && (
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#7C4DFF]/20 mx-auto mb-4 flex items-center justify-center">
                <EnvelopeSimple className="w-8 h-8 text-[#7C4DFF]" />
              </div>
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-gray-400 mt-2 text-sm">Enter your email to receive a reset link</p>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white" data-testid="reset-email-input" />
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white font-bold" data-testid="reset-submit-btn">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {step === 'sent' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Check Your Email</h2>
            <p className="text-gray-400 text-sm">If an account with that email exists, we've sent a password reset link.</p>
            <Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-full bg-[#333] text-white font-semibold text-sm">
              Return to Login
            </Link>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#E040FB]/20 mx-auto mb-4 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#E040FB]" />
              </div>
              <h1 className="text-2xl font-bold">New Password</h1>
              <p className="text-gray-400 mt-2 text-sm">Enter your new password</p>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" required
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white" data-testid="new-password-input" />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-4 text-white" data-testid="confirm-password-input" />
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white font-bold" data-testid="set-password-btn">
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Password Reset!</h2>
            <p className="text-gray-400 text-sm">Your password has been updated. You can now log in.</p>
            <Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#E040FB] text-white font-bold text-sm"
              data-testid="back-to-login-btn">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
