import React, { useState, useMemo } from 'react';
import { Fuel, Gauge, Users, MapPin, MessageSquare, ArrowRight, Shield, Search, Car, Bike, Sparkles, Filter } from 'lucide-react';
import { Vehicle } from '../../types';
import { BRAND, getVehicleWhatsAppLink } from '../../lib/constants';

interface FeaturedVehiclesProps {
  vehicles: Vehicle[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onViewDetails?: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
  pickupDate?: string;
  returnDate?: string;
}

export const FeaturedVehicles: React.FC<FeaturedVehiclesProps> = ({
  vehicles,
  selectedCategory = 'all',
  onSelectCategory,
  onSelectVehicle,
  onViewDetails,
  onBookVehicle,
  pickupDate,
  returnDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [transmissionFilter, setTransmissionFilter] = useState('all');

  // Handle click on View Details safely with both prop names
  const handleViewDetails = (vehicle: Vehicle) => {
    if (onViewDetails) {
      onViewDetails(vehicle);
    } else if (onSelectVehicle) {
      onSelectVehicle(vehicle);
    }
  };

  // Filter list by category, search query, transmission
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Category filter
      if (selectedCategory && selectedCategory !== 'all') {
        if (v.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      // Transmission filter
      if (transmissionFilter !== 'all') {
        if (v.transmission.toLowerCase() !== transmissionFilter.toLowerCase()) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.name.toLowerCase().includes(q);
        const matchBrand = v.brand.toLowerCase().includes(q);
        const matchModel = v.model?.toLowerCase().includes(q) || false;
        const matchLocation = v.location?.toLowerCase().includes(q) || false;
        if (!matchName && !matchBrand && !matchModel && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, selectedCategory, transmissionFilter, searchQuery]);

  const carCount = vehicles.filter(v => v.category === 'car').length;
  const bikeCount = vehicles.filter(v => v.category === 'bike').length;
  const scooterCount = vehicles.filter(v => v.category === 'scooter').length;

  return (
    <section id="fleet" className="py-16 bg-slate-50 scroll-mt-20 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Verified Fleet &bull; Margao Hub &bull; Station &amp; Airport Delivery</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Rides Available in Goa
            </h2>
          </div>
          <p className="text-slate-500 text-sm max-w-sm mt-2 sm:mt-0">
            Book online without upfront login. Free pickup at Margao Hub or delivery to your hotel, station, or airport.
          </p>
        </div>

        {/* Category Filter Tabs & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Fleet', count: vehicles.length, icon: Sparkles },
              { id: 'car', label: 'Cars', count: carCount, icon: Car },
              { id: 'bike', label: 'Bikes', count: bikeCount, icon: Bike },
              { id: 'scooter', label: 'Scooters', count: scooterCount, icon: Bike },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectCategory && onSelectCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Quick Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Activa, Thar, Swift..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            <select
              value={transmissionFilter}
              onChange={e => setTransmissionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Transmission: All</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <p className="text-base font-bold text-slate-700">No vehicles match your search.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your category filter or search keywords. You can also message our Margao Hub desk directly on WhatsApp.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTransmissionFilter('all');
                  if (onSelectCategory) onSelectCategory('all');
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredVehicles.map(vehicle => {
              const formattedPrice = new Intl.NumberFormat('en-IN', {
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
                <div
                  key={vehicle.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Vehicle Image Header */}
                  <div>
                    <div className="relative h-56 bg-slate-100 overflow-hidden">
                      <img
                        src={vehicle.coverImage || vehicle.images[0]?.publicUrl}
                        alt={`${vehicle.brand} ${vehicle.model} for rent in Goa`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                          {vehicle.category}
                        </span>
                        {vehicle.year && (
                          <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-white/90 text-slate-800 shadow-xs">
                            {vehicle.year} Model
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">From </span>
                        <span className="text-base font-extrabold text-slate-900">{formattedPrice}</span>
                        <span className="text-xs text-slate-500 font-medium"> / day</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                          {vehicle.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{vehicle.location}</span>
                        </div>
                      </div>

                      {/* Specs pills */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vehicle.transmission}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vehicle.fuelType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {vehicle.category === 'car'
                              ? `${vehicle.seats} Seats`
                              : vehicle.engineCapacityCc
                              ? `${vehicle.engineCapacityCc} cc`
                              : '2 Seats'}
                          </span>
                        </div>
                      </div>

                      {/* Policy & Deposit note */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Security Deposit:</span>
                        <span className="font-semibold text-slate-700">{formattedDeposit} (Refundable)</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleViewDetails(vehicle)}
                        className="w-full py-2.5 px-3 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => onBookVehicle(vehicle)}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Book Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <a
                      href={getVehicleWhatsAppLink(vehicle.name, pickupDate, returnDate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 text-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Enquiry</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
