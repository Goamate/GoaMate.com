import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { DEFAULT_RENTAL_RULES } from '../../lib/constants';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the booking request process work?',
      a: 'Choose your desired vehicle and dates on GoaMate, fill in your contact information, and upload your driving licence and ID proofs. After submitting, you receive a unique booking reference. Our team reviews fleet availability and connects with you on WhatsApp/phone to confirm vehicle handover details.',
    },
    {
      q: 'Which documents are strictly required for renting?',
      a: 'You must provide a valid Driving Licence (minimum 1 year old) and one Government-issued photo ID (Aadhaar Card, Passport, or Voter ID). The original documents must be physically shown at the time of vehicle handover.',
    },
    {
      q: 'How is the rental period and duration calculated?',
      a: `${DEFAULT_RENTAL_RULES.durationRule} For example, if you pick up a scooter at 10:00 AM on Monday and return it at 10:00 AM on Tuesday, that is billed as 1 day. Any extension past the 24-hour mark enters the next day block.`,
    },
    {
      q: 'How does the refundable security deposit work?',
      a: 'A refundable security deposit (typically ₹1,000 for scooters, ₹2,500–₹3,000 for bikes, and ₹3,000–₹5,000 for cars) is held during the rental. It is promptly refunded via UPI or cash upon return after inspecting for traffic violations and vehicle condition.',
    },
    {
      q: 'What is the fuel policy?',
      a: 'We operate on a Level-to-Level fuel policy. You receive the vehicle with a certain fuel mark (noted on the digital handover sheet) and must return it with the same level. If returned with less fuel, the cost of refueling will be deducted from the security deposit.',
    },
    {
      q: 'Can I get the vehicle delivered to Madgaon Railway Station or Dabolim / Mopa Airport?',
      a: 'Yes! Free vehicle pickup is available at our primary Margao hub. Station and Airport deliveries are scheduled with nominal delivery fees configured based on distance.',
    },
    {
      q: 'What is the cancellation policy?',
      a: 'Cancellations notified at least 24 hours prior to scheduled pickup time receive a full refund of any advance booking deposit. Cancellations made within 24 hours of scheduled pickup are subject to a nominal 1-day rental charge.',
    },
  ];

  return (
    <section id="faq" className="py-16 bg-slate-50 border-b border-slate-200 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Clear terms, straightforward rules, and zero surprises for your Goa holiday.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-emerald-700 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transform transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
