import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  Briefcase,
  Code,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { User, UserRole } from '../types/baton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  apiBaseUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  apiBaseUrl = 'http://127.0.0.1:8000',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = async (demoEmail: string, demoRole: UserRole, demoName: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Attempt backend API login first
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Authenticated as ${data.user.full_name} (${data.user.role.toUpperCase()})`);
        setTimeout(() => {
          onLoginSuccess(data.user, data.access_token);
          onClose();
        }, 500);
        return;
      }
    } catch {
      // Backend not running / offline fallback
    }

    // Local simulated auth fallback
    const fallbackUser: User = {
      id: `usr-demo-${demoRole}`,
      email: demoEmail,
      full_name: demoName,
      role: demoRole,
      created_at: new Date().toISOString(),
    };
    const mockToken = `mock-jwt-token-${demoRole}-${Date.now()}`;
    setSuccessMsg(`Authenticated as ${fallbackUser.full_name} (${fallbackUser.role.toUpperCase()})`);
    setTimeout(() => {
      onLoginSuccess(fallbackUser, mockToken);
      onClose();
    }, 400);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const isLogin = tab === 'login';
    const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload = isLogin
      ? { email, password }
      : { email, password, full_name: fullName, role };

    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication request failed');
      }

      setSuccessMsg(
        isLogin
          ? `Welcome back, ${data.user.full_name}!`
          : `Account successfully created! Welcome, ${data.user.full_name}.`
      );

      setTimeout(() => {
        onLoginSuccess(data.user, data.access_token);
        onClose();
      }, 600);
    } catch (err: any) {
      // If network failed completely and it's demo credentials, fallback gracefully
      if (email && password) {
        setErrorMsg(err.message || 'Unable to connect to authentication server.');
      } else {
        setErrorMsg('Please enter your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Header gradient banner */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Title & Tagline */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
              <KeyRound className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                BATON Knowledge Access
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Role-Based Access Control (Admin • Project Manager • Employee)
              </p>
            </div>
          </div>

          {/* Quick 1-Click Demo Login Bar */}
          <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Quick 1-Click Demo Switcher
              </span>
              <span className="text-[10px] font-mono text-slate-400">Instant Access</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@baton.ai', 'admin', 'Antigravity Admin')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center group cursor-pointer"
              >
                <Shield className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Admin</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">Full Access</span>
              </button>

              {/* Project Manager Button */}
              <button
                type="button"
                onClick={() => handleDemoLogin('pm@baton.ai', 'project_manager', 'Rushikesh Bobade')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all text-center group cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Project Mgr</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Ingest & Signoff</span>
              </button>

              {/* Employee Button */}
              <button
                type="button"
                onClick={() => handleDemoLogin('employee@baton.ai', 'employee', 'Afroz Khan')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-center group cursor-pointer"
              >
                <Code className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Employee</span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">Successor/Review</span>
              </button>
            </div>
          </div>

          {/* Form Tabs (Login / Register) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2.5 px-4 text-sm font-semibold transition-colors relative cursor-pointer ${
                tab === 'login'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
              {tab === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2.5 px-4 text-sm font-semibold transition-colors relative cursor-pointer ${
                tab === 'register'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Create New Account
              {tab === 'register' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Error & Success Feedback Banners */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Role selection on Register */}
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select System Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      role === 'admin'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="sr-only"
                    />
                    <Shield className="w-4 h-4 mb-1 text-purple-400" />
                    <span className="text-xs">Admin</span>
                    <span className="text-[9px] opacity-75">All Permissions</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      role === 'project_manager'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="project_manager"
                      checked={role === 'project_manager'}
                      onChange={() => setRole('project_manager')}
                      className="sr-only"
                    />
                    <Briefcase className="w-4 h-4 mb-1 text-emerald-400" />
                    <span className="text-xs">Project Mgr</span>
                    <span className="text-[9px] opacity-75">Ingest & Approve</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      role === 'employee'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="employee"
                      checked={role === 'employee'}
                      onChange={() => setRole('employee')}
                      className="sr-only"
                    />
                    <Code className="w-4 h-4 mb-1 text-cyan-400" />
                    <span className="text-xs">Employee</span>
                    <span className="text-[9px] opacity-75">Review & Resolve</span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
