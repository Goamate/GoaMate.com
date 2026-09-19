import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { Hero } from './components/home/Hero';
import { CategoryGrid } from './components/home/CategoryGrid';
import { FeaturedVehicles } from './components/home/FeaturedVehicles';
import { HowItWorks } from './components/home/HowItWorks';
import { WhyGoaMate } from './components/home/WhyGoaMate';
import { ServiceAreas } from './components/home/ServiceAreas';
import { FAQSection } from './components/home/FAQSection';
import { ContactSection } from './components/home/ContactSection';
import { BookingWizard } from './components/booking/BookingWizard';
import { BookingSuccess } from './components/booking/BookingSuccess';
import { BookingTracker } from './components/booking/BookingTracker';
import { DirectBookingLanding } from './components/booking/DirectBookingLanding';
import { VehicleDetailModal } from './components/vehicles/VehicleDetailModal';
import { VendorPortal } from './components/vendor/VendorPortal';
import { VendorRegisterPage } from './components/vendor/VendorRegisterPage';
import { VendorLoginPage } from './components/vendor/VendorLoginPage';
import { VendorPendingApprovalPage } from './components/vendor/VendorPendingApprovalPage';
import { VendorForgotPasswordPage } from './components/vendor/VendorForgotPasswordPage';
import { VendorResetPasswordPage } from './components/vendor/VendorResetPasswordPage';
import { AdminPortal } from './components/admin/AdminPortal';
import { PolicyViewer } from './components/pages/PolicyViewer';
import { api } from './services/api';
import { Vehicle, SiteSettings, VehicleCategory, ServiceArea, VendorApprovalStatus, VendorProfile } from './types';
import { supabase } from './lib/supabase';
import { getVendorProfile } from './lib/vendorAuth';
import { AlertTriangle, X } from 'lucide-react';

export default function App() {
  // Global App States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('Margao Hub (Madgaon Junction)');

  // Modal / Screen States
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [successBookingResult, setSuccessBookingResult] = useState<{
    referenceNumber: string;
    booking: any;
  } | null>(null);

  const [showTracker, setShowTracker] = useState(false);
  const [trackerInitialRef, setTrackerInitialRef] = useState('');
  const [showVendorPortal, setShowVendorPortal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [activePolicyPage, setActivePolicyPage] = useState<'terms' | 'cancellation' | 'privacy' | 'about' | null>(null);

  // Direct Booking Link Token (e.g. ?token=...)
  const [directLinkToken, setDirectLinkToken] = useState<string | null>(null);

  // Dedicated Routes:
  // /vendor/register, /vendor/login, /vendor/dashboard, /vendor/forgot-password, /vendor/reset-password, /vendor/pending
  type VendorRoute = 'register' | 'login' | 'dashboard' | 'forgot-password' | 'reset-password' | 'pending' | null;

  const getActiveVendorRoute = (): VendorRoute => {
    const pathname = window.location.pathname.replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    const routeParam = params.get('route');

    if (pathname === '/vendor/register' || routeParam === '/vendor/register' || params.get('page') === 'vendor-register') {
      return 'register';
    }
    if (pathname === '/vendor/login' || routeParam === '/vendor/login' || params.get('page') === 'vendor-login') {
      return 'login';
    }
    if (pathname === '/vendor/dashboard' || routeParam === '/vendor/dashboard' || params.get('page') === 'vendor-dashboard') {
      return 'dashboard';
    }
    if (pathname === '/vendor/forgot-password' || routeParam === '/vendor/forgot-password' || params.get('page') === 'vendor-forgot-password') {
      return 'forgot-password';
    }
    if (pathname === '/vendor/reset-password' || routeParam === '/vendor/reset-password' || params.get('page') === 'vendor-reset-password') {
      return 'reset-password';
    }
    if (pathname === '/vendor/pending' || routeParam === '/vendor/pending' || params.get('page') === 'vendor-pending') {
      return 'pending';
    }
    return null;
  };

  const [activeVendorRoute, setActiveVendorRoute] = useState<VendorRoute>(getActiveVendorRoute);
  const isVendorRegisterRoute = activeVendorRoute === 'register';

  // Vendor session state for dashboard and pending checks
  const [vendorSessionUser, setVendorSessionUser] = useState<any | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  // Navigation handlers for history API
  const navigateToVendorRoute = (route: VendorRoute) => {
    const url = route ? `/vendor/${route}` : '/';
    window.history.pushState(null, '', url);
    setActiveVendorRoute(route);
    setActivePolicyPage(null);
    setDirectLinkToken(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateVendorRegister = () => navigateToVendorRoute('register');
  const handleNavigateVendorLogin = () => navigateToVendorRoute('login');
  const handleNavigateVendorForgotPassword = () => navigateToVendorRoute('forgot-password');
  const handleNavigateVendorDashboard = () => navigateToVendorRoute('dashboard');
  const handleNavigateVendorPending = () => navigateToVendorRoute('pending');

  const handleNavigateHome = () => {
    if (window.location.pathname.startsWith('/vendor/')) {
      window.history.pushState(null, '', '/');
    }
    setActiveVendorRoute(null);
    setActivePolicyPage(null);
    setDirectLinkToken(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check and listen to Supabase Auth state for vendor routes
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setVendorSessionUser(session.user);
        const profile = await getVendorProfile(session.user.id);
        setVendorProfile(profile);
      } else {
        setVendorSessionUser(null);
        setVendorProfile(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setVendorSessionUser(session.user);
        const profile = await getVendorProfile(session.user.id);
        setVendorProfile(profile);
      } else {
        setVendorSessionUser(null);
        setVendorProfile(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        navigateToVendorRoute('reset-password');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Parse initial URL query parameters and listen for browser popstate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname.replace(/\/+$/, '');
    const tokenParam = params.get('token');
    const trackParam = params.get('track');
    const portalParam = params.get('portal');
    const policyParam = params.get('policy');

    if (tokenParam) {
      setDirectLinkToken(tokenParam);
    }
    if (trackParam) {
      setTrackerInitialRef(trackParam);
      setShowTracker(true);
    }
    if (portalParam === 'vendor' && params.get('tab') !== 'register') {
      setShowVendorPortal(true);
    }
    if (pathname === '/admin' || portalParam === 'admin') {
      setShowAdminPortal(true);
    }
    if (policyParam && ['terms', 'cancellation', 'privacy', 'about'].includes(policyParam)) {
      setActivePolicyPage(policyParam as any);
    }

    const handleLocationChange = () => {
      setActiveVendorRoute(getActiveVendorRoute());
      const p = new URLSearchParams(window.location.search);
      const pol = p.get('policy');
      if (pol && ['terms', 'cancellation', 'privacy', 'about'].includes(pol)) {
        setActivePolicyPage(pol as any);
      } else if (!pol && activePolicyPage) {
        setActivePolicyPage(null);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [activePolicyPage]);

  // Fetch Vehicles & Settings
  const fetchData = async () => {
    try {
      setLoading(true);
      const [vList, siteSettings, areasList] = await Promise.all([
        api.getVehicles(),
        api.getSettings(),
        api.getServiceAreas().catch(() => []),
      ]);
      setVehicles(vList || []);
      setSettings(siteSettings);
      if (areasList && areasList.length > 0) {
        setServiceAreas(areasList);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Hero Search Trigger
  const handleHeroSearch = (params: {
    category: string;
    pickupDate: string;
    returnDate: string;
    location: string;
  }) => {
    setSelectedCategory(params.category);
    setPickupDate(params.pickupDate);
    setReturnDate(params.returnDate);
    setPickupLocation(params.location);

    // Smooth scroll to catalog
    const fleetEl = document.getElementById('fleet');
    if (fleetEl) {
      fleetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Category Card Click from CategoryGrid
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    const fleetEl = document.getElementById('fleet');
    if (fleetEl) {
      fleetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Booking Success
  const handleBookingCompleted = (result: { referenceNumber: string; booking: any }) => {
    setBookingVehicle(null);
    setDirectLinkToken(null);
    setSuccessBookingResult(result);
  };

  // Track Booking from Success Screen
  const handleTrackFromSuccess = (ref: string) => {
    setSuccessBookingResult(null);
    setTrackerInitialRef(ref);
    setShowTracker(true);
  };

  return (
    <div id="app-container" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Maintenance Mode Banner if active */}
      {settings?.maintenanceMode && (
        <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>GoaMate is currently undergoing scheduled platform maintenance. Some automated booking features may be reviewed manually.</span>
        </div>
      )}

      {/* Main Navigation Bar (Hidden when on standalone vendor auth / dashboard screens) */}
      {!activeVendorRoute && (
        <Navbar
          currentView={activePolicyPage || 'home'}
          onNavigateHome={handleNavigateHome}
          onSelectCategory={cat => {
            handleNavigateHome();
            setSelectedCategory(cat);
            setTimeout(() => {
              const fleetEl = document.getElementById('fleet');
              if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
          onOpenBooking={() => {
            handleNavigateHome();
            const fleetEl = document.getElementById('fleet');
            if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenTracker={() => {
            setTrackerInitialRef('');
            setShowTracker(true);
          }}
          onOpenVendor={() => {
            // If logged in as vendor and approved, go to dashboard
            if (vendorProfile?.approval_status === 'approved') {
              handleNavigateVendorDashboard();
            } else if (vendorProfile?.approval_status === 'pending') {
              handleNavigateVendorPending();
            } else {
              handleNavigateVendorLogin();
            }
          }}
          onOpenVendorRegister={handleNavigateVendorRegister}
          onOpenAdmin={() => setShowAdminPortal(true)}
        />
      )}

      {/* Main Content Area */}
      {activeVendorRoute === 'register' ? (
        <main className="flex-1">
          <VendorRegisterPage
            settings={settings}
            onNavigateHome={handleNavigateHome}
            onOpenVendorLogin={handleNavigateVendorLogin}
          />
        </main>
      ) : activeVendorRoute === 'login' ? (
        <main className="flex-1">
          <VendorLoginPage
            onNavigateHome={handleNavigateHome}
            onNavigateRegister={handleNavigateVendorRegister}
            onNavigateForgotPassword={handleNavigateVendorForgotPassword}
            onLoginSuccess={(status: VendorApprovalStatus) => {
              if (status === 'approved') {
                handleNavigateVendorDashboard();
              } else {
                handleNavigateVendorPending();
              }
            }}
          />
        </main>
      ) : activeVendorRoute === 'pending' ? (
        <main className="flex-1">
          <VendorPendingApprovalPage
            profile={vendorProfile}
            userEmail={vendorSessionUser?.email}
            onNavigateHome={handleNavigateHome}
            onNavigateLogin={handleNavigateVendorLogin}
          />
        </main>
      ) : activeVendorRoute === 'forgot-password' ? (
        <main className="flex-1">
          <VendorForgotPasswordPage
            onNavigateHome={handleNavigateHome}
            onNavigateLogin={handleNavigateVendorLogin}
          />
        </main>
      ) : activeVendorRoute === 'reset-password' ? (
        <main className="flex-1">
          <VendorResetPasswordPage
            onNavigateHome={handleNavigateHome}
            onNavigateLogin={handleNavigateVendorLogin}
          />
        </main>
      ) : activeVendorRoute === 'dashboard' ? (
        <main className="flex-1 min-h-screen bg-slate-900">
          <VendorPortal
            onClose={handleNavigateHome}
            onOpenDirectLink={token => {
              handleNavigateHome();
              setDirectLinkToken(token);
            }}
            onOpenRegisterPage={handleNavigateVendorRegister}
          />
        </main>
      ) : activePolicyPage ? (
        <main className="flex-1">
          <PolicyViewer page={activePolicyPage} onBack={() => setActivePolicyPage(null)} />
        </main>
      ) : directLinkToken ? (
        /* Direct Customer Booking Link Landing View */
        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <DirectBookingLanding
              token={directLinkToken}
              onBookingSuccess={handleBookingCompleted}
              onNavigateHome={() => setDirectLinkToken(null)}
            />
          </div>
        </main>
      ) : (
        /* Standard Homepage Layout */
        <main className="flex-1">
          {/* Hero Section with Quick Booking Bar */}
          <Hero
            onSearch={handleHeroSearch}
            onOpenBooking={() => {
              const fleetEl = document.getElementById('fleet');
              if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Category Exploration Grid */}
          <CategoryGrid onSelectCategory={handleCategorySelect} />

          {/* Interactive Fleet Catalog */}
          <FeaturedVehicles
            vehicles={vehicles}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            pickupDate={pickupDate}
            returnDate={returnDate}
            onBookVehicle={vehicle => setBookingVehicle(vehicle)}
            onViewDetails={vehicle => setDetailVehicle(vehicle)}
          />

          {/* Why Choose GoaMate */}
          <WhyGoaMate />

          {/* How It Works */}
          <HowItWorks
            onStartBooking={() => {
              const fleetEl = document.getElementById('fleet');
              if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Service Areas & Delivery Locations */}
          <ServiceAreas
            areas={serviceAreas}
            onSelectArea={(areaName) => {
              setPickupLocation(areaName);
              const fleetEl = document.getElementById('fleet');
              if (fleetEl) {
                fleetEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />

          {/* FAQ Section */}
          <FAQSection />

          {/* Contact & Margao Hub Location */}
          <ContactSection />
        </main>
      )}

      {/* Footer */}
      <Footer
        onOpenPolicy={page => {
          if (activeVendorRoute) {
            window.history.pushState(null, '', `/?policy=${page}`);
            setActiveVendorRoute(null);
          }
          setActivePolicyPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={cat => {
          handleNavigateHome();
          setSelectedCategory(cat);
          setTimeout(() => {
            const fleetEl = document.getElementById('fleet');
            if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onOpenVendor={() => setShowVendorPortal(true)}
        onOpenVendorRegister={handleNavigateVendorRegister}
        onOpenAdmin={() => setShowAdminPortal(true)}
        onOpenTracker={() => {
          setTrackerInitialRef('');
          setShowTracker(true);
        }}
      />

      {/* Floating WhatsApp Support Button (Controlled by Site Settings) */}
      {settings?.showWhatsappSupport !== false && <FloatingWhatsApp />}

      {/* Modal: Vehicle Details Preview */}
      {detailVehicle && (
        <VehicleDetailModal
          vehicle={detailVehicle}
          pickupDate={pickupDate}
          returnDate={returnDate}
          onClose={() => setDetailVehicle(null)}
          onBookNow={v => {
            const chosen = v || detailVehicle;
            setDetailVehicle(null);
            setBookingVehicle(chosen);
          }}
        />
      )}

      {/* Modal: Booking Wizard (Guest 4-Step Checkout) */}
      {bookingVehicle && (
        <BookingWizard
          vehicle={bookingVehicle}
          initialPickupDate={pickupDate}
          initialReturnDate={returnDate}
          initialLocation={pickupLocation}
          onClose={() => setBookingVehicle(null)}
          onSuccess={handleBookingCompleted}
        />
      )}

      {/* Modal: Booking Success & Customer Receipt */}
      {successBookingResult && (
        <BookingSuccess
          referenceNumber={successBookingResult.referenceNumber}
          booking={successBookingResult.booking}
          onClose={() => setSuccessBookingResult(null)}
          onTrackBooking={handleTrackFromSuccess}
        />
      )}

      {/* Modal: Booking Status Tracker */}
      {showTracker && (
        <BookingTracker
          initialReference={trackerInitialRef}
          onClose={() => setShowTracker(false)}
        />
      )}

      {/* Modal: Vendor Partner Portal */}
      {showVendorPortal && (
        <VendorPortal
          onClose={() => setShowVendorPortal(false)}
          onOpenDirectLink={token => {
            setShowVendorPortal(false);
            setDirectLinkToken(token);
          }}
          onOpenRegisterPage={() => {
            setShowVendorPortal(false);
            handleNavigateVendorRegister();
          }}
        />
      )}

      {/* Modal: Super Admin Control Portal */}
      {showAdminPortal && (
        <AdminPortal onClose={() => setShowAdminPortal(false)} />
      )}
    </div>
  );
}
