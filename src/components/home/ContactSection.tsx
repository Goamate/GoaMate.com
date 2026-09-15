import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { BRAND, getWhatsAppLink } from '../../lib/constants';

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hello GoaMate, I am ${formData.name} (Phone: ${formData.phone}). Enquiry: ${formData.message}`;
    const url = getWhatsAppLink(msg);
    try {
      window.open(url, '_blank');
    } catch {
      window.location.href = url;
    }
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-16 bg-white border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Contact Info */}
          <div className="space-y-6">
            <div>
              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">
                We are based in South Goa
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Connect with the GoaMate Team
              </h2>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Whether you need a quick quote for a 5-day holiday or have questions about delivery at Madgaon Railway Station or Dabolim Airport, we are available on call and WhatsApp.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <a
                href={`tel:${BRAND.phoneRaw}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Direct Call Helpline</div>
                  <div className="text-base font-bold text-slate-900">{BRAND.phone}</div>
                </div>
              </a>

              <a
                href={getWhatsAppLink('Hello GoaMate, I would like to speak to customer support.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 hover:border-emerald-400 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-emerald-800 font-semibold">Instant WhatsApp Chat</div>
                  <div className="text-base font-bold text-emerald-950">+91 9403784132 (Click to Chat)</div>
                </div>
              </a>

              <a
                href={`mailto:${BRAND.email}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Email Enquiries</div>
                  <div className="text-base font-bold text-slate-900">{BRAND.email}</div>
                </div>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Primary Hub: Margao, South Goa (Near Madgaon Junction)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Operational Hours: 07:00 AM to 10:30 PM (Asia/Kolkata)</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Direct Contact Card */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Send an Enquiry Message</h3>
            <p className="text-xs text-slate-500 mb-6">
              Fill this quick form to instantly launch a pre-structured WhatsApp chat with our booking desk.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900">Enquiry Prepared!</h4>
                <p className="text-xs text-emerald-800">
                  WhatsApp conversation has been opened. Our team will assist you with availability.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-semibold text-emerald-700 underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Message / Travel Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message || ''}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us vehicle type, arrival date, and preferred pickup location..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send via WhatsApp Desk</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
