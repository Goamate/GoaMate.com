import React from 'react';
import { Calendar, UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartBooking?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartBooking }) => {
  const steps = [
    {
      num: '01',
      title: 'Choose your vehicle & dates',
      description: 'Select your preferred self-drive car, Royal Enfield bike, or scooter. Pick your pickup location in Margao, Madgaon station, or airport delivery.',
      icon: Calendar,
    },
    {
      num: '02',
      title: 'Fill details & upload documents',
      description: 'No customer login required. Simply enter your contact details and securely upload your driving licence and government ID proof from your phone or PC.',
      icon: UploadCloud,
    },
    {
      num: '03',
      title: 'Receive confirmation from GoaMate',
      description: 'Our Margao hub verifies vehicle availability and document validity. You receive instant status updates and personal WhatsApp coordination for vehicle handover.',
      icon: CheckCircle2,
    },
  ];

  const handleStartBooking = () => {
    if (onStartBooking) {
      onStartBooking();
    } else {
      document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="how-it-works" className="py-16 bg-white border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            How Booking Works
          </h2>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            We designed GoaMate to be friction-free for travelers. Book ahead in under 3 minutes with zero unnecessary signups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative bg-slate-50 rounded-2xl p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-300">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleStartBooking}
            className="inline-flex items-center gap-2 px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <span>Book Your Ride Now</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
