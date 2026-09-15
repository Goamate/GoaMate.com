import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { BRAND } from '../../lib/constants';

interface PolicyViewerProps {
  page: 'terms' | 'cancellation' | 'privacy' | 'about';
  onBack: () => void;
}

export const PolicyViewer: React.FC<PolicyViewerProps> = ({ page, onBack }) => {
  return (
    <div className="py-12 bg-slate-50 min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Rides</span>
        </button>

        {/* Notice to owner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">GoaMate Pre-Launch Compliance Check:</span>
            The policy terms below reflect current Goa Motor Vehicles Act regulations and standard tourist self-drive rental practices. Highlighted sections require official review and confirmation by GoaMate business ownership prior to final legal deployment.
          </div>
        </div>

        {/* Policy Content Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-800 text-sm leading-relaxed">
          {page === 'terms' && (
            <>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Legal Agreement</span>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Rental Terms &amp; Conditions</h1>
                <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026 &bull; Operational Base: Margao, Goa</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">1. Eligibility and Document Presentation</h3>
                <p>
                  Renters must be at least 21 years of age for self-drive four-wheelers and 18 years of age for two-wheelers. The primary renter must possess an original, valid Driving Licence with at least one year of driving experience, alongside a verified Government Photo Identification proof (Aadhaar Card, Passport, or Voter ID).
                </p>
                <div className="p-3 bg-slate-50 border-l-4 border-emerald-600 rounded-r-lg text-xs font-medium text-slate-700">
                  Physical inspection of original documents is mandatory at vehicle delivery. Failure to present originals will result in immediate cancellation.
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. Deterministic 24-Hour Rental Calculation</h3>
                <p>
                  All rentals operate on strict 24-hour block durations. Any started 24-hour block is billed as one complete rental day. Vehicles returned exceeding a grace period of 30 minutes enter the subsequent 24-hour billing cycle.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">3. Fuel Policy (Level-to-Level)</h3>
                <p>
                  Vehicles are supplied with a recorded fuel level indicated on the digital handover checklist. Renters are obligated to return the vehicle with an equivalent fuel gauge reading. Differences in returned fuel are debited from the refundable security deposit at prevailing Goa retail rates plus a standard handling fee.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">4. Geographic Boundaries &amp; Prohibited Uses</h3>
                <p>
                  Unless specifically endorsed in writing by GoaMate management, all vehicles are licensed for operation exclusively within the state borders of Goa. Crossing into Maharashtra or Karnataka without valid cross-border permits is strictly prohibited and renders insurance invalid.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">5. Security Deposit &amp; Traffic Penalties</h3>
                <p>
                  Refundable security deposits are collected at vehicle handover via UPI or cash. The deposit is refunded upon safe return after vehicle inspection. The renter remains solely liable for traffic challans, speed camera citations, or parking violations incurred during the rental tenure.
                </p>
              </section>
            </>
          )}

          {page === 'cancellation' && (
            <>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Customer Policy</span>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Cancellation &amp; Refund Policy</h1>
                <p className="text-xs text-slate-500 mt-1">Fair and transparent booking policies for Goa travelers</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">1. Advance Notice Cancellations</h3>
                <p>
                  Bookings cancelled at least <strong>24 hours prior</strong> to the scheduled pickup time receive a 100% refund of any booking advance paid.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. Late Cancellations</h3>
                <p>
                  Bookings cancelled less than 24 hours before the scheduled pickup time are subject to a nominal one-day rental fee to cover vehicle staging and driver coordination.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">3. No-Show Policy</h3>
                <p>
                  If a customer fails to arrive within 3 hours of the scheduled pickup time without prior communication, GoaMate reserves the right to release the vehicle to walk-in travelers.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">4. Refund Processing Timelines</h3>
                <p>
                  Approved refunds are processed via the original payment method or instant UPI transfer within 2 to 4 business hours.
                </p>
              </section>
            </>
          )}

          {page === 'privacy' && (
            <>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Data Protection</span>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Privacy &amp; Document Security</h1>
                <p className="text-xs text-slate-500 mt-1">Commitment to customer identification privacy</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">1. Purpose of Document Collection</h3>
                <p>
                  Under Goa Directorate of Transport guidelines, commercial self-drive vehicle operators are legally mandated to verify driver authorization and identity. Document uploads are utilized exclusively for booking authorization and police compliance records.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. Non-Public Document Storage</h3>
                <p>
                  Identity proofs and driving licences are stored in restricted-access private object repositories. Documents are never exposed through public URLs or indexable search engines.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">3. Document Deletion Rights</h3>
                <p>
                  Customers may request complete deletion of uploaded identity files 30 days after the rental is completed and all traffic fines and challans have cleared.
                </p>
              </section>
            </>
          )}

          {page === 'about' && (
            <>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">About Our Service</span>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-1">About GoaMate</h1>
                <p className="text-xs text-slate-500 mt-1">South Goa's reliable self-drive car and bike mobility partner</p>
              </div>

              <div className="space-y-4">
                <p>
                  Founded in Margao, Goa, <strong>GoaMate</strong> was created to eliminate the typical friction travelers face when renting cars and two-wheelers in Goa. We reject opaque pricing, inflated airport delivery charges, and questionable vehicle condition.
                </p>
                <p>
                  Our primary hub is located minutes away from <strong>Madgaon Railway Junction</strong>, with scheduled doorstep delivery across South Goa beaches, Dabolim Airport, and Panaji.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">Margao Centric</div>
                  <div className="text-xs text-slate-500 mt-1">Prompt South Goa vehicle handover and roadside assistance.</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">Verified Fleet</div>
                  <div className="text-xs text-slate-500 mt-1">Every car and scooter is checked mechanically before handover.</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">No Forced Signups</div>
                  <div className="text-xs text-slate-500 mt-1">Guests can book in minutes without unnecessary account creation.</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
