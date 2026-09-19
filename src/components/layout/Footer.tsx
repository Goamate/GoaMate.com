import React from 'react';
import { Phone, MessageSquare, Mail, MapPin, ShieldCheck, Clock, FileText, CheckCircle2, Search, Facebook, Instagram } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { BRAND, getWhatsAppLink } from '../../lib/constants';

interface FooterProps {
  onOpenPolicy?: (page: 'terms' | 'cancellation' | 'privacy' | 'about') => void;
  onSelectCategory?: (cat: string) => void;
  onOpenTracker?: () => void;
  onOpenVendor: () => void;
  onOpenVendorRegister?: () => void;
  onOpenAdmin: () => void;
  onNavigate?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onSelectCategory,
  onOpenTracker,
  onOpenVendor,
  onOpenVendorRegister,
  onOpenAdmin,
  onNavigate,
}) => {
  const handleFleetClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    if (onNavigate) {
      onNavigate(cat === 'car' ? 'cars' : 'bikes');
    }
    setTimeout(() => {
      document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSectionClick = (id: string, viewName: string) => {
    if (onNavigate) {
      onNavigate(viewName);
    }
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handlePolicyClick = (page: 'terms' | 'cancellation' | 'privacy' | 'about') => {
    if (onOpenPolicy) {
      onOpenPolicy(page);
    } else if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/10 p-3 rounded-2xl inline-block backdrop-blur-xs">
              <BrandLogo size="md" theme="dark" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Official self-drive car, bike, and scooter rental service in Margao, South Goa. 
              Transparent daily pricing, clean verified fleet, and prompt on-ground support across Goa.
            </p>

            <div className="pt-2 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Primary Operations: Margao, South Goa, India (403601)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Desk Hours: 7:00 AM – 10:30 PM (Asia/Kolkata)</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-4 flex items-center gap-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61562843115233" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-emerald-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/goamate2026/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-emerald-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Col 2: Vehicle Fleets */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Our Fleet</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => handleFleetClick('car')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Self-Drive Cars in Goa
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFleetClick('bike')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Royal Enfield &amp; Bikes
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFleetClick('scooter')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Activa &amp; Scooters
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFleetClick('car')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  7-Seater Family Cars
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFleetClick('car')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Thar 4x4 &amp; Convertibles
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links & Help */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Information</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => handleSectionClick('how-it-works', 'how-it-works')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  How Booking Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePolicyClick('about')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  About GoaMate
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSectionClick('faq', 'faq')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSectionClick('contact', 'contact')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
              {onOpenTracker && (
                <li>
                  <button
                    onClick={onOpenTracker}
                    className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer text-emerald-300"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Track Booking Status</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={onOpenVendor}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Vendor Partner Portal
                </button>
              </li>
              {onOpenVendorRegister && (
                <li>
                  <button
                    onClick={onOpenVendorRegister}
                    className="hover:text-emerald-400 text-emerald-300 font-medium transition-colors text-left cursor-pointer"
                  >
                    Register as Vendor Partner
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Policies &amp; Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => handlePolicyClick('terms')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rental Terms &amp; Conditions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePolicyClick('cancellation')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cancellation &amp; Refund</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePolicyClick('privacy')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Privacy Notice</span>
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenAdmin}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline cursor-pointer"
                >
                  Super Admin Management
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="py-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-6">
            <a href={`tel:${BRAND.phoneRaw}`} className="flex items-center gap-2 text-slate-300 hover:text-white">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{BRAND.phone}</span>
            </a>
            <a
              href={getWhatsAppLink('Hello GoaMate team, I would like to enquire about vehicle rental.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Helpline</span>
            </a>
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-2 text-slate-300 hover:text-white">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>{BRAND.email}</span>
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-300/80 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Valid Driving Licence &amp; Original Govt ID required at pickup.</span>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} GoaMate. All rights reserved. Self-drive rental service based in Margao, South Goa.</p>
          <div className="flex items-center gap-4">
            <span>Currency: INR (₹)</span>
            <span>&bull;</span>
            <span>Timezone: Asia/Kolkata</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
