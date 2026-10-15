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
        msg = 'Invalid email or password. Access is restricted to provisioned QA accounts.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This QA account has been disabled. Contact your administrator.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">QA Staff Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with your authorized credentials to monitor live test suites, pipeline health, and failure logs.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {!configured && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Firebase Configuration Needed</span>
              </div>
              <p className="text-amber-300/80 leading-relaxed">
                Add your Firebase Web App credentials to <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-200 font-mono">.env.local</code> to connect project <strong className="text-amber-100">test-monitor-46836</strong>.
              </p>
              {onBypassFallback && (
                <button
                  type="button"
                  onClick={onBypassFallback}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-100 font-medium text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>Preview with Local Data (Offline Mode)</span>
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="qa-engineer@company.com"
                  disabled={loading || !configured}
                  required
                  autoFocus
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Key className="h-4 w-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading || !configured}
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || !configured}
                  className="absolute right-3 top-2.5 p-1 text-slate-500 hover:text-slate-300 transition focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !configured}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Notice: Accounts created via Console */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
            <span>
              Self-registration is disabled. New accounts are provisioned exclusively by the QA Administrator in Firebase Console.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Secured via Firebase Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
