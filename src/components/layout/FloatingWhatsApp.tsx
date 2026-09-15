import React, { useState } from 'react';
import { MessageSquare, X, Phone, ArrowUpRight } from 'lucide-react';
import { BRAND, getWhatsAppLink } from '../../lib/constants';

interface FloatingWhatsAppProps {
  showWhatsApp?: boolean;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ showWhatsApp = true }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!showWhatsApp) return null;

  const defaultMsg = 'Hello GoaMate, I would like to enquire about car/bike rental in Goa.';

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded quick panel if hovered or toggled */}
      {showTooltip && (
        <div className="mb-3 bg-white text-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 max-w-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-900">GoaMate Support</span>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm"
              aria-label="Close tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-600 my-2 leading-relaxed">
            Need quick vehicle availability or have questions about Margao, Airport, or Station delivery?
          </p>
          <a
            href={getWhatsAppLink(defaultMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <span>Start WhatsApp Chat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Floating Button */}
      <div className="flex items-center gap-2">
        <a
          href={getWhatsAppLink(defaultMsg)}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowTooltip(true)}
          className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          aria-label="Chat on WhatsApp with GoaMate Support"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 fill-current" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-emerald-600" />
          </div>
          <span className="hidden sm:inline font-bold text-sm tracking-wide">
            Chat on WhatsApp
          </span>
        </a>
      </div>
    </div>
  );
};
