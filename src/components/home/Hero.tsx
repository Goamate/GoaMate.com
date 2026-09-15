import React, { useState } from 'react';
import { Search, Calendar, MapPin, MessageSquare, Car, Bike, Sparkles, Shield, Clock, ChevronRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { BRAND, getWhatsAppLink, DEFAULT_LOCATIONS } from '../../lib/constants';

interface HeroProps {
  onSearch: (params: {
    category: string;
    location: string;
    pickupDate: string;
    returnDate: string;
  }) => void;
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, onOpenBooking }) => {
  const [category, setCategory] = useState<string>('all');
  const [location, setLocation] = useState<string>('Margao Hub (Near Madgaon Railway Station)');

  // Default dates: tomorrow 10:00 to day after tomorrow 10:00
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setHours(10, 0, 0, 0);
  const dayAfter = new Date(Date.now() + 2 * 86400000);
  dayAfter.setHours(10, 0, 0, 0);

  const formatInputDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [pickupDate, setPickupDate] = useState<string>(formatInputDate(tomorrow));
  const [returnDate, setReturnDate] = useState<string>(formatInputDate(dayAfter));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      category,
      location,
      pickupDate,
      returnDate,
    });
  };

  return (
    <div className="relative bg-slate-900 text-white overflow-hidden">
      {/* Background imagery with subtle dark tropical overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=80"
          alt="Scenic coastal road in Goa with palm trees"
          className="w-full h-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-3xl space-y-6">
          {/* Margao badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Margao Hub &bull; Direct Station &amp; Airport Delivery</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Explore Goa Your Way
          </h1>

          <p className="text-lg sm:text-xl text-slate-200 leading-relaxed font-normal">
            Find a car, bike or scooter for your Goa trip. Choose your ride and send your booking request in minutes.
          </p>

          {/* Quick CTA buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                const searchEl = document.getElementById('search-panel');
                if (searchEl) searchEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <span>Find My Ride</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <a
              href={getWhatsAppLink('Hello GoaMate, I would like to enquire about vehicle rental in Goa.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/20 rounded-xl font-semibold text-sm sm:text-base transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* Trust points */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Zero hidden fees &bull; ₹ INR</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Doorstep Delivery available</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Bike className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Helmets &amp; chargers provided</span>
            </div>
          </div>
        </div>

        {/* Prominent Search Panel */}
        <div id="search-panel" className="mt-10 lg:mt-14 scroll-mt-24">
          <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200">
            {/* Category tabs */}
            <div className="flex items-center gap-2 pb-5 border-b border-slate-100 overflow-x-auto">
              {[
                { id: 'all', label: 'All Rides', icon: Sparkles },
                { id: 'car', label: 'Self-Drive Cars', icon: Car },
                { id: 'bike', label: 'Bikes & Enfield', icon: Bike },
                { id: 'scooter', label: 'Activa & Scooters', icon: Bike },
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategory(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Form Inputs */}
            <form onSubmit={handleSubmit} className="pt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pickup &amp; Return Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-600 pointer-events-none" />
                  <select
                    value={location || ''}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {DEFAULT_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pickup Date & Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pickup Date &amp; Time
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 z-10 text-slate-400 pointer-events-none" />
                  <DatePicker
                    selected={pickupDate ? new Date(pickupDate) : null}
                    onChange={(date: Date | null) => date && setPickupDate(formatInputDate(date))}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy h:mm aa"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    wrapperClassName="w-full"
                    required
                  />
                </div>
              </div>

              {/* Return Date & Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Return Date &amp; Time
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 z-10 text-slate-400 pointer-events-none" />
                  <DatePicker
                    selected={returnDate ? new Date(returnDate) : null}
                    onChange={(date: Date | null) => date && setReturnDate(formatInputDate(date))}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy h:mm aa"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    wrapperClassName="w-full"
                    required
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 h-[46px]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Available Rides</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
