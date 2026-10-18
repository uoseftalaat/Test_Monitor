import React, { useState } from 'react';
import { signInWithEmail } from '../../firebase/authService';
import { isFirebaseConfigured } from '../../firebase/config';
import { Lock, Mail, Key, AlertCircle, LogIn, ShieldCheck, Database, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function AuthModal({ onBypassFallback }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const configured = isFirebaseConfigured();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      let msg = 'Authentication failed. Please check your credentials.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This account has been disabled. Contact your administrator.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm mb-3">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">QA Staff Login</h2>
          <p className="text-xs text-gray-500 mt-1">
            Sign in with your authorized credentials to monitor live test suites, pipeline health, and failure logs.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {!configured && (
            <div className="p-3.5 rounded-lg bg-warning-50 border border-warning-200 text-warning-700 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-warning-500 shrink-0" />
                <span>Sign-in isn't set up yet</span>
              </div>
              <p className="text-warning-700/90 leading-relaxed">
                Contact your administrator to connect an account, or continue with local data.
              </p>
              {onBypassFallback && (
                <button
                  type="button"
                  onClick={onBypassFallback}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-white hover:bg-warning-100 border border-warning-300 text-warning-700 font-medium text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>Continue with Local Data</span>
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive-50 border border-destructive-200 text-destructive-600 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="qa-engineer@company.com"
                  disabled={loading || !configured}
                  required
                  autoFocus
                  className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Key className="h-4 w-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading || !configured}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || !configured}
                  className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-gray-600 transition focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !configured}
              className="w-full py-2.5 px-4 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
            <span>Self-registration is disabled. Contact your QA administrator for access.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success-500" />
            <span>Secure sign-in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
