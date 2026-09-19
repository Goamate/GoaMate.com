import React, { useState } from 'react';
import {
  Car,
  Bike,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  IndianRupee,
  MessageSquare,
  ArrowLeft,
  Lock,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  ChevronDown,
  HelpCircle,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { Vendor, SiteSettings } from '../../types';
import { BRAND, getWhatsAppLink, DEFAULT_LOCATIONS } from '../../lib/constants';
import { BrandLogo } from '../ui/BrandLogo';
import { registerVendorWithSupabase } from '../../lib/vendorAuth';
import { isSupabaseConfigured } from '../../lib/supabase';

interface VendorRegisterPageProps {
  settings?: SiteSettings | null;
  onNavigateHome: () => void;
  onOpenVendorLogin: () => void;
}

export const VendorRegisterPage: React.FC<VendorRegisterPageProps> = ({
  settings,
  onNavigateHome,
  onOpenVendorLogin,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredVendor, setRegisteredVendor] = useState<Vendor | null>(null);
  const [emailVerificationNotice, setEmailVerificationNotice] = useState<string | null>(null);

  // Form states matching requested registration fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Margao');
  const [customArea, setCustomArea] = useState('');
  const [fleetCategories, setFleetCategories] = useState<string[]>(['car', 'bike']);
  const [fleetSize, setFleetSize] = useState('1-3');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permitDeclaration, setPermitDeclaration] = useState(false);
  const [termsDeclaration, setTermsDeclaration] = useState(false);

  // Active FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleCategory = (cat: string) => {
    if (fleetCategories.includes(cat)) {
      if (fleetCategories.length > 1) {
        setFleetCategories(fleetCategories.filter(c => c !== cat));
      }
    } else {
      setFleetCategories([...fleetCategories, cat]);
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailVerificationNotice(null);

    // Basic Validations for requested fields:
    // Full Name, Business Name, Email, Phone Number, WhatsApp Number, Address, Area, Password, Confirm Password
    if (!fullName.trim() || !businessName.trim() || !email.trim() || !phone.trim() || !address.trim() || !password) {
      setErrorMsg('Please fill in all required fields marked with *.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!permitDeclaration) {
      setErrorMsg('Please confirm the Goa Commercial Permit / Rent-a-Cab declaration.');
      return;
    }

    if (!termsDeclaration) {
      setErrorMsg('Please accept the GoaMate Partner Terms & Fair Pricing Policy.');
      return;
    }

    const selectedArea = area === 'Other' && customArea.trim() ? customArea.trim() : area;
    const finalWhatsApp = sameAsPhone ? phone.trim() : (whatsapp.trim() || phone.trim());

    try {
      setLoading(true);

      // Preferred path: Supabase Authentication email/password signup
      if (isSupabaseConfigured) {
        const signupRes = await registerVendorWithSupabase({
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          whatsapp: finalWhatsApp,
          address: address.trim(),
          area: selectedArea,
          password,
        });

        setEmailVerificationNotice(signupRes.message);

        // Populate registeredVendor for success view
        setRegisteredVendor({
          id: signupRes.user?.id || 'v-' + Date.now(),
          userId: signupRes.user?.id || 'v-' + Date.now(),
          vendorName: fullName.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          whatsapp: finalWhatsApp,
          email: email.trim().toLowerCase(),
          serviceLocation: `${selectedArea}, ${address.trim()}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      } else {
        // Fallback: server API registration
        const res = await api.vendorRegister({
          vendorName: fullName.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          whatsapp: finalWhatsApp,
          email: email.trim().toLowerCase(),
          serviceLocation: `${selectedArea} - ${address.trim()} (Fleet: ${fleetCategories.join(', ')}; Size: ${fleetSize})`,
          password,
        });

        setEmailVerificationNotice('Registration successful. Please check your email and verify your email address.');
        setRegisteredVendor(res.vendor);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does GoaMate partner verification work?',
      a: 'After you submit your registration, our Margao operations team reviews your business details. We verify your contact info and basic commercial credentials (Rent-a-Cab / yellow board permits). Approvals are typically processed within 2 to 4 business hours.',
    },
    {
      q: 'Is there any registration fee or upfront charge?',
      a: 'No. Listing your vehicles on GoaMate is 100% free of any registration or upfront monthly fees. You only fulfill bookings as they arrive.',
    },
    {
      q: 'What is the "Direct Booking Link" feature for vendors?',
      a: 'As a GoaMate vendor, you get your own dashboard tool to generate custom booking links. If a guest contacts you directly on WhatsApp, you can send them a pre-set GoaMate link with your vehicle and chosen dates. The guest fills their details, accepts terms, and uploads their Driving License, saving you manual paperwork.',
    },
    {
      q: 'How do customer identity and document verifications work?',
      a: 'GoaMate mandates valid Indian Driving License (or IDP for foreign tourists) and Aadhaar/Passport uploads for every customer before vehicle handover. You can inspect customer documents in your dashboard prior to dispatching keys.',
    },
    {
      q: 'Can I mark vehicles unavailable when rented locally?',
      a: 'Yes! Your Vendor Dashboard includes an instant toggle for each vehicle. If a car or bike is out on an offline booking or scheduled for maintenance, you can pause its availability with a single click.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-emerald-500 selection:text-white">
      {/* Top Breadcrumb & Quick Action Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Partner Fleet Network</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-700">Vendor Registration</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVendorLogin}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Already a Partner? Login</span>
            </button>
            <a
              href={getWhatsAppLink('Hello GoaMate Team, I am a vehicle fleet owner in Goa interested in partnering.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Partner Desk: +91 9403784132</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* If Registration is completed successfully */}
        {registeredVendor ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Registration Received • Status: Pending Approval
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              Welcome to GoaMate, {registeredVendor.vendorName}!
            </h1>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Your partner account for <strong className="text-slate-900">{registeredVendor.businessName}</strong> has been successfully registered on the GoaMate Fleet Network.
            </p>

            {/* Verification Notice Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {emailVerificationNotice || 'Registration successful. Please check your email and verify your email address.'}
              </span>
            </div>

            {/* Application Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs text-slate-700 space-y-2 mb-8">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-bold text-slate-900">{registeredVendor.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Contact / WhatsApp:</span>
                <span className="font-bold text-slate-900">{registeredVendor.whatsapp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Service Location:</span>
                <span className="font-bold text-slate-900">{registeredVendor.serviceLocation}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Account ID:</span>
                <span className="font-mono text-slate-600">{registeredVendor.id}</span>
              </div>
            </div>

            {/* Next Steps Timeline */}
            <div className="text-left mb-8 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Next Steps for Activation:</span>
              </h3>
              <ol className="space-y-3 text-xs text-emerald-950 list-decimal pl-4">
                <li>
                  <strong>Verification Review (2-4 hours):</strong> Our Margao hub team will verify your agency details.
                </li>
                <li>
                  <strong>WhatsApp Connect:</strong> You will receive a confirmation message on <strong>{registeredVendor.whatsapp}</strong> once activated.
                </li>
                <li>
                  <strong>Upload Your Fleet:</strong> Once approved, login to add your cars, scooters, or bikes and start generating direct booking links!
                </li>
              </ol>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={getWhatsAppLink(
                  `Hello GoaMate Admin, I just registered my vendor account for "${registeredVendor.businessName}" (${registeredVendor.email}). Please review and activate my account.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Fast-Track on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onOpenVendorLogin}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-sm border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Go to Partner Login</span>
              </button>

              <button
                type="button"
                onClick={onNavigateHome}
                className="px-5 py-3 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Banner */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Goa Fleet Partner Onboarding</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                List Your Rental Fleet on GoaMate
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Partner with South Goa&apos;s leading car &amp; bike rental platform. Maximize your fleet occupancy, connect with verified tourists arriving in Margao &amp; across Goa, and streamline your customer agreements with automated digital links.
              </p>
            </div>

            {/* Key Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Zero Upfront Cost</h3>
                <p className="text-xs text-slate-500 mt-1">No setup fee, registration charge, or recurring software subscription.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Verified Tourists</h3>
                <p className="text-xs text-slate-500 mt-1">Mandatory Driving License &amp; Aadhaar/Passport verified before every handover.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Direct Booking Links</h3>
                <p className="text-xs text-slate-500 mt-1">Generate pre-filled booking URLs to send to your own WhatsApp customers in seconds.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Margao &amp; All-Goa</h3>
                <p className="text-xs text-slate-500 mt-1">Station, Airport, and doorstep delivery zones supported across South &amp; North Goa.</p>
              </div>
            </div>

            {/* If Platform Registration is currently turned off by Admin */}
            {settings?.allowVendorRegistration === false && (
              <div className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Public Registration Is Temporarily Paused</h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    GoaMate super-admin is currently reviewing existing fleet capacities. You can still onboard directly by connecting with our Margao operations desk via WhatsApp.
                  </p>
                  <a
                    href={getWhatsAppLink('Hello GoaMate Admin, I would like to inquire about manual vendor partner onboarding.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg mt-3 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Inquire via WhatsApp Desk</span>
                  </a>
                </div>
              </div>
            )}

            {/* Registration Form Box */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 mb-12">
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Partner Application Form</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Please provide accurate business details for swift verification.</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Step 1 of 1
                </span>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Please resolve the following:</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Business & Operator Profile */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">1. Agency &amp; Operator Profile</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Francis D'Souza"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Authorized operator or fleet proprietor.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="e.g. Margao Speed Tours &amp; Rentals"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Displayed to tourists on booking confirmations.</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Address & Operating Area */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">2. Address &amp; Operating Area</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="e.g. Shop #4, Station Road, Opp. KTC Bus Stand"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Office or vehicle pickup hub address.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Area *
                      </label>
                      <select
                        value={area}
                        onChange={e => setArea(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {['Margao', 'Colva', 'Benaulim', 'Vasco / Dabolim', 'Mopa / Manohar Airport', 'Panaji', 'Candolim / Calangute', 'Other'].map((ar, idx) => (
                          <option key={idx} value={ar}>
                            {ar}
                          </option>
                        ))}
                      </select>

                      {area === 'Other' && (
                        <input
                          type="text"
                          required
                          value={customArea}
                          onChange={e => setCustomArea(e.target.value)}
                          placeholder="Specify operating area in Goa..."
                          className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Vehicle Types You Offer (Select all that apply) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'car', label: 'Self-Drive Cars', icon: Car },
                        { id: 'bike', label: 'Royal Enfield & Bikes', icon: Bike },
                        { id: 'scooter', label: 'Activa & Scooters', icon: Bike },
                        { id: 'muv', label: '7-Seater / Family MUVs', icon: Car },
                      ].map(item => {
                        const isSelected = fleetCategories.includes(item.id);
                        const Icon = item.icon;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => toggleCategory(item.id)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                            </div>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact & Communication */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">3. Contact &amp; Booking Dispatch</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Official Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        placeholder="+91 9403..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          WhatsApp Number for Bookings *
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sameAsPhone}
                            onChange={e => {
                              setSameAsPhone(e.target.checked);
                              if (e.target.checked) setWhatsapp(phone);
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Same as phone</span>
                        </label>
                      </div>
                      <input
                        type="tel"
                        required
                        disabled={sameAsPhone}
                        value={sameAsPhone ? phone : whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        placeholder="+91 9403..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 ${
                          sameAsPhone ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">We send customer booking alerts directly to this WhatsApp.</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Email Address (Used for Login) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. rentals@margaowheels.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Section 4: Security & Password */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">4. Partner Dashboard Password</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Password *</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Compliance Declarations */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={permitDeclaration}
                      onChange={e => setPermitDeclaration(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                    />
                    <span>
                      <strong>Goa Commercial Permit Declaration:</strong> I confirm that all vehicles listed by my agency hold valid commercial Rent-a-Cab / yellow-board permits, comprehensive insurance, and up-to-date fitness certificates in compliance with the Goa Motor Vehicles Act.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsDeclaration}
                      onChange={e => setTermsDeclaration(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                    />
                    <span>
                      I agree to the <strong>GoaMate Partner Standards</strong>, transparent customer pricing policy, and pledge to provide clean, well-maintained, tourist-ready vehicles.
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-500 text-center sm:text-left">
                    Your details will be reviewed by GoaMate South Goa Operations within 2-4 hours.
                  </p>

                  <button
                    type="submit"
                    disabled={loading || settings?.allowVendorRegistration === false}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Partner Registration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* How It Works for Partners */}
            <div className="mb-14">
              <div className="text-center max-w-xl mx-auto mb-8">
                <h2 className="text-2xl font-bold text-slate-900">How Partnering Works</h2>
                <p className="text-xs text-slate-500 mt-1">From application to receiving your first booking in 3 simple steps.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1">Submit Application</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Fill out the vendor registration form with your fleet location, vehicle categories, and contact details.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1">Quick Verification</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Our Margao team checks your commercial registration and activates your partner credentials within 2-4 hours.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1">Manage &amp; Earn</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upload vehicles, accept bookings, generate custom WhatsApp booking links, and receive prompt weekly or trip payouts.
                  </p>
                </div>
              </div>
            </div>

            {/* Vendor FAQ Accordion */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">Frequently Asked Partner Questions</h2>
              </div>

              <div className="divide-y divide-slate-100">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-800 hover:text-emerald-700 transition-colors py-1 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-600' : ''}`} />
                    </button>
                    {openFaq === idx && (
                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed pl-1 animate-in fade-in duration-200">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <span>Have a specific question about fleet partnerships?</span>
                <a
                  href={getWhatsAppLink('Hello GoaMate Team, I have questions about listing my rental fleet.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat with Partner Relations</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
