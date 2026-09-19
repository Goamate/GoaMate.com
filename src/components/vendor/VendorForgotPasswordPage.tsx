import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Send, KeyRound } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { sendVendorPasswordReset } from '../../lib/vendorAuth';

interface VendorForgotPasswordPageProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export const VendorForgotPasswordPage: React.FC<VendorForgotPasswordPageProps> = ({
  onNavigateHome,
  onNavigateLogin,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      await sendVendorPasswordReset(email.trim());
      setSentSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <BrandLogo />
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 pl-2 border-l border-slate-300">
              Password Recovery
            </span>
          </button>

          <button
            onClick={onNavigateLogin}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Password</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your vendor account email to receive a secure recovery link
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {sentSuccess ? (
              <div className="text-center space-y-4 py-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recovery Link Sent!</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    We have dispatched a password reset link to <strong>{email}</strong> via Supabase Authentication. Please check your inbox and spam folder.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={onNavigateLogin}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Return to Vendor Login
                  </button>
                </div>
              </div>
            ) : (
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Password Reset Email</span>
                    </>
                  )}
                </button>

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    Remember your password? Sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} GoaMate Car &amp; Bike Rental. Margao, Goa.
      </footer>
    </div>
  );
};
