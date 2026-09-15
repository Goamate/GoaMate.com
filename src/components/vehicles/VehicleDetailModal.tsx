import React, { useState } from 'react';
import {
  X,
  MapPin,
  Fuel,
  Gauge,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ArrowRight,
  Info,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Vehicle } from '../../types';
import { BRAND, getVehicleWhatsAppLink } from '../../lib/constants';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onBook?: (vehicle: Vehicle) => void;
  onBookNow?: (vehicle: Vehicle) => void;
  pickupDate?: string;
  returnDate?: string;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  onBook,
  onBookNow,
  pickupDate,
  returnDate,
}) => {
  if (!vehicle) return null;

  const handleBook = () => {
    onClose();
    if (onBookNow) {
      onBookNow(vehicle);
    } else if (onBook) {
      onBook(vehicle);
    }
  };

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const images = vehicle.images.length > 0 ? vehicle.images : [{ id: '1', publicUrl: vehicle.coverImage, isCover: true }];

  const formattedDailyRate = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(vehicle.dailyPrice);

  const formattedDeposit = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(vehicle.securityDeposit);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header with Close */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {vehicle.category} &bull; {vehicle.brand}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">{vehicle.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-8 flex-1">
          {/* Gallery View */}
          <div className="space-y-3">
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={images[activeImageIdx]?.publicUrl || vehicle.coverImage}
                alt={vehicle.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-xl shadow-md border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Daily Rate: </span>
                <span className="text-lg font-extrabold text-slate-900">{formattedDailyRate}</span>
              </div>
            </div>

            {/* Thumbnail slider if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      activeImageIdx === idx ? 'border-emerald-600' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img.publicUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Gauge className="w-4 h-4 text-slate-400" />
                <span>Transmission</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{vehicle.transmission}</div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Fuel className="w-4 h-4 text-slate-400" />
                <span>Fuel Type</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{vehicle.fuelType}</div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Capacity</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {vehicle.category === 'car' ? `${vehicle.seats} Seater` : vehicle.engineCapacityCc ? `${vehicle.engineCapacityCc} cc` : '2 Seater'}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security Deposit</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{formattedDeposit}</div>
            </div>
          </div>

          {/* Description & Included Features */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">About this Vehicle</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {vehicle.description || 'Mechanically inspected, thoroughly washed, and fully licensed for legal tourist rental within the state of Goa.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {vehicle.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policies Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Rental Policies &amp; Terms</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Fuel Policy:</span>
                <p>{vehicle.fuelPolicy}</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Kilometer / Mileage:</span>
                <p>{vehicle.mileagePolicy}</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Pickup Hub (Free):</span>
                <p>Margao Primary Hub (Near Madgaon Railway Station)</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Documents Required:</span>
                <p>Original Driving Licence + Government Photo ID</p>
              </div>
            </div>
          </div>

          {/* 24-Hour Pricing Rule reminder */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">24-Hour Rental Calculation: </span>
              Every started 24-hour block counts as one rental day. Clear and deterministic pricing without surge surprises.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={getVehicleWhatsAppLink(vehicle.name, pickupDate, returnDate)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Chat about this on WhatsApp</span>
          </a>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-1/3 sm:w-auto py-2.5 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleBook}
              className="flex-1 sm:w-auto py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Proceed to Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
