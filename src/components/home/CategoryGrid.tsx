import React from 'react';
import { Car, Bike, Sparkles, ArrowRight } from 'lucide-react';

interface CategoryGridProps {
  onSelectCategory: (cat: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
  const categories = [
    {
      id: 'car',
      name: 'Self-Drive Cars',
      tagline: 'Hatchbacks, Sedans, 7-Seaters & 4x4 SUVs',
      priceFrom: '₹1,800/day',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      icon: Car,
      features: ['Air conditioning', 'Automatic & Manual', 'Clean Interiors'],
    },
    {
      id: 'bike',
      name: 'Motorcycles & Royal Enfield',
      tagline: 'Classic 350, Himalayan & Cruisers',
      priceFrom: '₹1,100/day',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
      icon: Bike,
      features: ['Dual-Channel ABS', 'Crash Guards', '2 ISI Helmets'],
    },
    {
      id: 'scooter',
      name: 'Activa & Scooters',
      tagline: 'Honda Activa 6G, Vespa & Jupiter',
      priceFrom: '₹450/day',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      icon: Bike,
      features: ['Twist & Go Automatic', 'High Fuel Mileage', 'Mobile Mount'],
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Choose Your Category</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Rent by Vehicle Type
            </h2>
          </div>
          <p className="text-slate-500 text-sm max-w-md mt-2 sm:mt-0">
            All vehicles are mechanically inspected, washed before delivery, and accompanied by proper legal rental paperwork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image header with category pill */}
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-xs">
                      Starts from {cat.priceFrom}
                    </span>
                    <Icon className="w-5 h-5 text-amber-300" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">{cat.tagline}</p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cat.features.map(f => (
                        <span
                          key={f}
                          className="inline-block text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span>Browse {cat.name}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
