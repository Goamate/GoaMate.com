import React, { useState } from 'react';
import { Phone, MessageSquare, Menu, X, Car, Bike, Shield, User, ArrowRight, Search, FileSearch, Building2 } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { BRAND, getWhatsAppLink } from '../../lib/constants';

interface NavbarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
  onSelectCategory?: (category: string) => void;
  onOpenBooking?: () => void;
  onOpenTracker?: () => void;
  onOpenVendor: () => void;
  onOpenVendorRegister?: () => void;
  onOpenAdmin: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onSelectCategory,
  onOpenBooking,
  onOpenTracker,
  onOpenVendor,
  onOpenVendorRegister,
  onOpenAdmin,
  onNavigateHome,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGoHome = () => {
    setMobileMenuOpen(false);
    if (onNavigateHome) {
      onNavigateHome();
    } else if (onNavigate) {
      onNavigate('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCars = () => {
    setMobileMenuOpen(false);
    if (onNavigateHome) onNavigateHome();
    if (onSelectCategory) onSelectCategory('car');
    if (onNavigate) onNavigate('cars');
    setTimeout(() => {
      document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSelectBikes = () => {
    setMobileMenuOpen(false);
    if (onNavigateHome) onNavigateHome();
    if (onSelectCategory) onSelectCategory('bike');
    if (onNavigate) onNavigate('bikes');
    setTimeout(() => {
      document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleScrollToSection = (id: string, viewName: string) => {
    setMobileMenuOpen(false);
    if (onNavigateHome) onNavigateHome();
    if (onNavigate) onNavigate(viewName);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handlePrimaryBookNow = () => {
    setMobileMenuOpen(false);
    if (onOpenBooking) {
      onOpenBooking();
    } else {
      const fleet = document.getElementById('fleet') || document.getElementById('search-panel');
      fleet?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top micro-bar: Location & Quick Helplines */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Primary Hub: Margao, South Goa &bull; Airport &amp; Madgaon Station Delivery
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Self-Drive Cars, RE Bikes &amp; Scooters</span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={`tel:${BRAND.phoneRaw}`}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call: {BRAND.phone}</span>
            </a>

            <a
              href={getWhatsAppLink('Hello GoaMate, I would like to enquire about vehicle rental in Goa.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp: +91 9403784132</span>
            </a>

            {onOpenTracker && (
              <button
                onClick={onOpenTracker}
                className="text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
              >
                <FileSearch className="w-3 h-3 text-emerald-400" />
                <span>Track Booking</span>
              </button>
            )}

            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-slate-200 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Super Admin Management Portal"
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <button
            onClick={handleGoHome}
            className="flex items-center text-left focus:outline-none cursor-pointer"
            aria-label="GoaMate Home"
          >
            <BrandLogo size="md" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={handleGoHome}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                currentView === 'home' || !currentView
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            <button
              onClick={handleSelectCars}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cars
            </button>

            <button
              onClick={handleSelectBikes}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Bikes &amp; Scooters
            </button>

            <button
              onClick={() => handleScrollToSection('how-it-works', 'how-it-works')}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              How It Works
            </button>

            <button
              onClick={() => handleScrollToSection('faq', 'faq')}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              FAQ
            </button>

            <button
              onClick={() => handleScrollToSection('contact', 'contact')}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Header Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Track Booking Button */}
            {onOpenTracker && (
              <button
                onClick={onOpenTracker}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Lookup existing booking status"
              >
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span>Track Booking</span>
              </button>
            )}

            {/* Vendor Portal button */}
            <button
              onClick={onOpenVendor}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Vendor Login</span>
            </button>

            {/* Vendor Partner Registration button */}
            {onOpenVendorRegister && (
              <button
                onClick={onOpenVendorRegister}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                title="Register your fleet as partner in Goa"
              >
                <span>Partner with Us</span>
              </button>
            )}

            {/* Quick WhatsApp Action */}
            <a
              href={getWhatsAppLink('Hello GoaMate, I want to book a car/bike in Goa.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
              aria-label="Chat on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xl:inline">WhatsApp</span>
            </a>

            {/* Primary Book Now CTA */}
            <button
              onClick={handlePrimaryBookNow}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            {onOpenTracker && (
              <button
                onClick={onOpenTracker}
                className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                title="Track Booking"
              >
                <Search className="w-5 h-5 text-emerald-600" />
              </button>
            )}
            <button
              onClick={handlePrimaryBookNow}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg sm:hidden cursor-pointer"
            >
              Book Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 pb-2">
            <a
              href={`tel:${BRAND.phoneRaw}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold bg-slate-100 text-slate-800 rounded-lg"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Call Helpline</span>
            </a>
            <a
              href={getWhatsAppLink('Hello GoaMate, I want to book a vehicle.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-lg"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp Chat</span>
            </a>
          </div>

          <div className="space-y-1">
            <button
              onClick={handleGoHome}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Home</span>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>

            <button
              onClick={handleSelectCars}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>Cars Fleet</span>
              </span>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>

            <button
              onClick={handleSelectBikes}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Bikes &amp; Scooters</span>
              </span>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>

            <button
              onClick={() => handleScrollToSection('how-it-works', 'how-it-works')}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>How It Works</span>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>

            <button
              onClick={() => handleScrollToSection('faq', 'faq')}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Frequently Asked Questions</span>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>

            <button
              onClick={() => handleScrollToSection('contact', 'contact')}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Contact Desk</span>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {onOpenTracker && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTracker();
                }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Track Booking Reference</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenVendor();
              }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-2"
            >
              <User className="w-4 h-4 text-slate-600" />
              <span>Vendor Login &amp; Fleet Dashboard</span>
            </button>

            {onOpenVendorRegister && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenVendorRegister();
                }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Register as Vendor Partner (/vendor/register)</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full text-left px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Super Admin Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
