import React from 'react';
import { Clock, CheckCircle2, MessageSquare, ArrowRight, LogOut, Shield } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { getWhatsAppLink } from '../../lib/constants';
import { logoutVendor } from '../../lib/vendorAuth';
import { VendorProfile } from '../../types';

interface VendorPendingApprovalPageProps {
  profile?: VendorProfile | null;
  userEmail?: string | null;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export const VendorPendingApprovalPage: React.FC<VendorPendingApprovalPageProps> = ({
  profile,
  userEmail,
  onNavigateHome,
  onNavigateLogin,
}) => {
  const handleSignOut = async () => {
    await logoutVendor();
    onNavigateLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <BrandLogo />
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 pl-2 border-l border-slate-300">
              Partner Verification Desk
            </span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
            <Clock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Account Status: Pending Approval
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Application Under Review
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
            Thank you for registering with the GoaMate Fleet Network. Your vendor partner profile has been safely created and is awaiting manual verification by our Super Admin team.
          </p>

          {/* Profile Summary Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left text-xs text-slate-700 space-y-2 mb-6">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Business / Agency:</span>
              <span className="font-bold text-slate-900">{profile?.business_name || 'Fleet Partner'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Partner Full Name:</span>
              <span className="font-bold text-slate-900">{profile?.full_name || 'Registered Partner'}</span>
            </div>
            {userEmail && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-bold text-slate-900">{userEmail}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Operating Area:</span>
              <span className="font-bold text-slate-900">{profile?.area || 'Goa Hub'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Current Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Pending Verification</span>
              </span>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-left text-xs text-emerald-950 space-y-2.5 mb-8">
            <div className="font-bold text-emerald-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>What happens next?</span>
            </div>
            <p className="leading-relaxed">
              1. Our South Goa operations desk will verify your commercial permit details and contact information.
            </p>
            <p className="leading-relaxed">
              2. Once approved, you will receive full access to the <strong>Vendor Dashboard</strong>, vehicle catalog publishing, and digital customer reservation links.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={getWhatsAppLink('Hello GoaMate Admin, I registered as a vendor partner and would like an update on my approval status.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Admin Desk on WhatsApp</span>
            </a>

            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Sign Out &amp; Return to Login
            </button>
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
