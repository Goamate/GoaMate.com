import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { Vehicle } from '../../types';
import { BookingWizard } from './BookingWizard';

interface DirectBookingLandingProps {
  token: string;
  onBookingSuccess: (result: { referenceNumber: string; booking: any }) => void;
  onNavigateHome: () => void;
}

export const DirectBookingLanding: React.FC<DirectBookingLandingProps> = ({
  token,
  onBookingSuccess,
  onNavigateHome,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<{
    valid: boolean;
    vehicle: Vehicle;
    presetPickupDatetime?: string;
    presetReturnDatetime?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function resolve() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.resolveDirectLink(token);
        if (active) {
          setLinkData(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'This direct booking link is invalid or has expired.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    resolve();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="font-bold text-slate-800 text-lg">Resolving Secure Booking Link...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to GoaMate fleet verification engine</p>
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Link Unavailable</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {error || 'This direct booking link has expired, been revoked, or has already been used for a reservation.'}
        </p>
        <button
          onClick={onNavigateHome}
          className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Browse All Available Goa Rides
        </button>
      </div>
    );
  }

  return (
    <BookingWizard
      vehicle={linkData.vehicle}
      initialPickupDate={linkData.presetPickupDatetime}
      initialReturnDate={linkData.presetReturnDatetime}
      directLinkToken={token}
      onClose={onNavigateHome}
      onSuccess={onBookingSuccess}
    />
  );
};
