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
import { AdminPortal } from './components/admin/AdminPortal';
import { PolicyViewer } from './components/pages/PolicyViewer';
import { api } from './services/api';
import { Vehicle, SiteSettings, VehicleCategory, ServiceArea } from './types';
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

  // Parse initial URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
    if (portalParam === 'vendor') {
      setShowVendorPortal(true);
    } else if (portalParam === 'admin') {
      setShowAdminPortal(true);
    }
    if (policyParam && ['terms', 'cancellation', 'privacy', 'about'].includes(policyParam)) {
      setActivePolicyPage(policyParam as any);
    }
  }, []);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Maintenance Mode Banner if active */}
      {settings?.maintenanceMode && (
        <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>GoaMate is currently undergoing scheduled platform maintenance. Some automated booking features may be reviewed manually.</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        currentView={activePolicyPage || 'home'}
        onNavigateHome={() => {
          setActivePolicyPage(null);
          setDirectLinkToken(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={cat => {
          setActivePolicyPage(null);
          setDirectLinkToken(null);
          setSelectedCategory(cat);
          setTimeout(() => {
            const fleetEl = document.getElementById('fleet');
            if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onOpenBooking={() => {
          setActivePolicyPage(null);
          setDirectLinkToken(null);
          const fleetEl = document.getElementById('fleet');
          if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTracker={() => {
          setTrackerInitialRef('');
          setShowTracker(true);
        }}
        onOpenVendor={() => setShowVendorPortal(true)}
        onOpenAdmin={() => setShowAdminPortal(true)}
      />

      {/* Policy Page View (If Active) */}
      {activePolicyPage ? (
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
          <Hero onSearch={handleHeroSearch} />

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
          setActivePolicyPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={cat => {
          setActivePolicyPage(null);
          setDirectLinkToken(null);
          setSelectedCategory(cat);
          setTimeout(() => {
            const fleetEl = document.getElementById('fleet');
            if (fleetEl) fleetEl.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onOpenVendor={() => setShowVendorPortal(true)}
        onOpenAdmin={() => setShowAdminPortal(true)}
        onOpenTracker={() => {
          setTrackerInitialRef('');
          setShowTracker(true);
        }}
      />

      {/* Floating WhatsApp Support Button (Controlled by Site Settings) */}
      {settings?.showWhatsAppSupport !== false && <FloatingWhatsApp />}

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
        />
      )}

      {/* Modal: Super Admin Control Portal */}
      {showAdminPortal && (
        <AdminPortal onClose={() => setShowAdminPortal(false)} />
      )}
    </div>
  );
}
