import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ArrowUpRight } from 'lucide-react';
import { ServiceArea } from '../../types';
import { INITIAL_SERVICE_AREAS } from '../../lib/constants';
import { api } from '../../services/api';

interface ServiceAreasProps {
  areas?: ServiceArea[];
  onSelectArea?: (areaName: string) => void;
}

export const ServiceAreas: React.FC<ServiceAreasProps> = ({ areas: propAreas, onSelectArea }) => {
  const [loadedAreas, setLoadedAreas] = useState<ServiceArea[]>(() => 
    propAreas && propAreas.length > 0 ? propAreas : INITIAL_SERVICE_AREAS
  );

  useEffect(() => {
    if (propAreas && propAreas.length > 0) {
      setLoadedAreas(propAreas);
      return;
    }

    let isMounted = true;
    api.getServiceAreas()
      .then(data => {
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setLoadedAreas(data);
        }
      })
      .catch(err => {
        console.warn('Failed to load service areas from API:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [propAreas]);

  const activeList = Array.isArray(propAreas) && propAreas.length > 0
    ? propAreas
    : (Array.isArray(loadedAreas) && loadedAreas.length > 0 ? loadedAreas : INITIAL_SERVICE_AREAS);

  const southGoa = (activeList || []).filter(a => a && a.zone === 'South Goa' && a.isActive);
  const northGoa = (activeList || []).filter(a => a && a.zone === 'North Goa' && a.isActive);

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Navigation className="w-3.5 h-3.5" />
              <span>Coverage &amp; Delivery</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Supported Goa Service Areas
            </h2>
          </div>
          <p className="text-slate-500 text-sm max-w-sm mt-2 sm:mt-0">
            Convenient vehicle pickup at our Margao hub or scheduled delivery right to your terminal or accommodation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* South Goa Hubs */}
          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">South Goa Focus (Primary Fleet Hub)</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                Margao Center
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {southGoa.map(area => (
                <div
                  key={area.id}
                  onClick={() => onSelectArea && onSelectArea(area.name)}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">{area.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {area.deliveryCharge === 0 ? 'Free Hub Pickup' : `+₹${area.deliveryCharge}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* North Goa & Airport Hubs */}
          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Transit Terminals &amp; North Goa</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
                Scheduled Drop
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {northGoa.map(area => (
                <div
                  key={area.id}
                  onClick={() => onSelectArea && onSelectArea(area.name)}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">{area.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {area.deliveryCharge === 0 ? 'Free Hub' : `+₹${area.deliveryCharge}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
