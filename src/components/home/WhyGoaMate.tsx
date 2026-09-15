import React from 'react';
import { ShieldCheck, MessageSquare, Wrench, FileCheck, IndianRupee, MapPin } from 'lucide-react';

export const WhyGoaMate: React.FC = () => {
  const benefits = [
    {
      icon: MessageSquare,
      title: 'Dedicated WhatsApp Support',
      desc: 'Real human assistance before, during, and after your trip. Quick coordinate handover at station or airport with zero bot frustration.',
    },
    {
      icon: IndianRupee,
      title: 'Transparent Pricing in ₹ INR',
      desc: 'Standardized 24-hour block calculations with clearly stated refundable security deposits. No surprise hidden charges at delivery.',
    },
    {
      icon: Wrench,
      title: 'Mechanically Inspected Fleet',
      desc: 'Brakes, tyres, fluids, and battery tested before handover. All two-wheelers provided with sanitized ISI approved helmets.',
    },
    {
      icon: FileCheck,
      title: 'Legitimate Rental Paperwork',
      desc: 'All vehicles carry valid insurance, PUC, and proper yellow/black rental permits adhering strictly to Goa Transport regulations.',
    },
    {
      icon: MapPin,
      title: 'South Goa Hub & Broad Delivery',
      desc: 'Direct hub base in Margao with delivery available to Madgaon Railway Station, Dabolim Airport, Colva, Benaulim, and Panaji.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Document Handling',
      desc: 'Your driving licence and identification proofs are encrypted, reviewed solely for booking verification, and never stored in public URLs.',
    },
  ];

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">
            Verifiable Standards
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Why Choose GoaMate
          </h2>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">
            Reliable mobility backed by local ground presence in Margao. We believe in honest pricing and hassle-free vehicle delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/40 transition-colors space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
