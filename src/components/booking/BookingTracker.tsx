import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Clock, XCircle, ArrowRight, Shield, Phone, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { BRAND, getWhatsAppLink } from '../../lib/constants';

interface BookingTrackerProps {
  initialReference?: string;
  onClose: () => void;
}

export const BookingTracker: React.FC<BookingTrackerProps> = ({ initialReference = '', onClose }) => {
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !phone.trim()) {
      setError('Please provide both your Booking Reference and Registered Phone Number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.trackBooking(reference.trim(), phone.trim());
      setBooking(res as any);
    } catch (err: any) {
      setError(err.message || 'No booking found matching these details. Please verify your reference number.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Self-Service Portal</span>
            <h2 className="text-2xl font-extrabold text-slate-900">Track Booking Status</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tracker Form */}
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Booking Reference Number *
            </label>
            <input
              type="text"
              required
              value={reference || ''}
              onChange={e => setReference(e.target.value.toUpperCase())}
              placeholder="e.g. GM-2026-4821"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Phone Number Used During Booking *
            </label>
            <input
              type="tel"
              required
              value={phone || ''}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 9403..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Verifying Reference...' : 'Find My Booking'}</span>
          </button>
        </form>

        {/* Result Card */}
        {booking && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold">Reference</span>
                <div className="font-extrabold text-sm text-slate-900">{booking.referenceNumber}</div>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="font-bold text-slate-700 block">Vehicle:</span>
                <span>{booking.vehicle?.name}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Total Payable:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  ₹{booking.totalEstimatedAmount || (booking as any).priceSnapshot?.totalEstimatedAmount || 0}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Pickup:</span>
                <span>{booking.pickupDatetime.replace('T', ' ')}</span>
                <p className="text-slate-500">{booking.pickupLocation}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Return:</span>
                <span>{booking.returnDatetime.replace('T', ' ')}</span>
                <p className="text-slate-500">{booking.dropoffLocation}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex gap-2">
              <a
                href={getWhatsAppLink(`Hello GoaMate, I am inquiring about my booking ${booking.referenceNumber} for ${booking.vehicle?.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Desk</span>
              </a>
              <a
                href={`tel:${BRAND.phoneRaw}`}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
