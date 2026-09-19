import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { loginVendorWithSupabase } from '../../lib/vendorAuth';
import { VendorApprovalStatus } from '../../types';

interface VendorLoginPageProps {
  onNavigateHome: () => void;
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  onLoginSuccess: (status: VendorApprovalStatus) => void;
}

export const VendorLoginPage: React.FC<VendorLoginPageProps> = ({
  onNavigateHome,
  onNavigateRegister,
  onNavigateForgotPassword,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'rejected' | 'suspended' | 'pending';
    title: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusNotice(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your registered email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginVendorWithSupabase(email.trim(), password);

      const status: VendorApprovalStatus = res.profile?.approval_status || 'pending';

      if (status === 'approved') {
        onLoginSuccess('approved');
      } else if (status === 'pending') {
        onLoginSuccess('pending');
      } else if (status === 'rejected') {
        setStatusNotice({
          type: 'rejected',
          title: 'Partner Application Rejected',
          message:
            'Your vendor partner application was not approved by the GoaMate administration. If you believe this is in error or wish to re-apply with updated documents, please contact our Margao support desk.',
        });
      } else if (status === 'suspended') {
        setStatusNotice({
          type: 'suspended',
          title: 'Partner Account Suspended',
          message:
            'Your vendor partner account has been suspended by the platform administrator. Access to fleet management, vehicle publishing, and customer reservations is revoked.',
        });
      } else {
        // Default treat as pending
        onLoginSuccess('pending');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <BrandLogo />
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 pl-2 border-l border-slate-300">
              Vendor Partner Portal
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateRegister}
              className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Become a Partner
            </button>
            <button
              onClick={onNavigateHome}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Back to Site
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vendor Partner Sign In</h1>
              <p className="text-xs text-slate-500 mt-1">
                Access your Goa fleet inventory, customer reservations, and direct links
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Account Status Notice (Rejected / Suspended) */}
            {statusNotice && (
              <div
                className={`mb-6 p-4 rounded-2xl border text-xs leading-relaxed ${
                  statusNotice.type === 'suspended'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{statusNotice.title}</span>
                </div>
                <p>{statusNotice.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="partner@agency.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password *</label>
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Vendor Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                Don&apos;t have a vendor account yet?{' '}
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Register as Fleet Partner
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Protected by Supabase Authentication &amp; Row Level Security
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} GoaMate Car &amp; Bike Rental. Margao, Goa.
      </footer>
    </div>
  );
};
