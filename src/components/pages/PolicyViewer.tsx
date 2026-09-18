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
                <h3 className="text-base font-bold text-slate-900">1. Eligibility &amp; Documentation</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Age Limit:</strong> The rider/driver must be at least 18 years old for bikes and 21 years old for cars.</li>
                  <li><strong>License:</strong> A valid original Indian Driving License (DL) is mandatory. International tourists must provide an International Driving Permit (IDP).</li>
                  <li><strong>ID Proof:</strong> A copy of your Aadhaar Card or Passport must be submitted at the time of pickup.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. Rental Period &amp; Extensions</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Duration:</strong> The rental period is calculated on a 24-hour basis.</li>
                  <li><strong>Late Return:</strong> A grace period of 30 minutes is allowed. Beyond that, hourly charges or a full day's rent will apply.</li>
                  <li><strong>Extensions:</strong> If you wish to extend the rental, you must inform us at least 6 hours in advance, subject to vehicle availability.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">3. Payment &amp; Security Deposit</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Full Payment:</strong> All rental charges must be paid in advance at the time of vehicle delivery.</li>
                  <li><strong>Security Deposit:</strong> A refundable security deposit may be required. This will be returned after inspecting the vehicle for damages or traffic fines.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">4. Fuel &amp; Maintenance</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Fuel Policy:</strong> We provide a minimum amount of fuel to reach the nearest petrol pump. The vehicle must be returned with the same level of fuel as provided, or fuel charges will apply.</li>
                  <li><strong>Breakdowns:</strong> In case of a mechanical failure, contact us immediately. Do not attempt local repairs without our consent.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">5. Damage, Theft, and Accidents</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>User Responsibility:</strong> The hirer is responsible for any damage caused to the vehicle during the rental period.</li>
                  <li><strong>Major Damage/Theft:</strong> In case of an accident or theft, the hirer must file an FIR and inform RNC Car Rental immediately. Insurance claims are subject to the insurance company's terms; any gap in cost must be covered by the hirer.</li>
                  <li><strong>Tyres &amp; Keys:</strong> Damage to tyres or loss of keys is not covered by insurance and must be paid for by the hirer.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">6. Usage Restrictions</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Permit:</strong> Our vehicles have Goa taxi/rental permits. Crossing the Goa state border without a valid interstate permit (and our prior permission) is strictly prohibited.</li>
                  <li><strong>Prohibited Acts:</strong> Driving under the influence of alcohol/drugs, overspeeding, or using the vehicle for commercial transport/racing is strictly forbidden.</li>
                  <li><strong>Cleaning:</strong> If the vehicle is returned excessively dirty (sand inside the car, stains on seats), a cleaning fee will be charged.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">7. Traffic Violations</h3>
                <p>
                  All traffic fines (e.g., no-helmet, overspeeding, wrong parking) incurred during the rental period are the sole responsibility of the hirer. If a fine arrives later via e-challan, it will be recovered from the security deposit or the hirer.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">8. Feedback and Online Review</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Experience Sharing:</strong> RNC Car Rental constantly strives to provide the best possible service to our customers. Therefore, sharing your feedback/Google Review is considered an essential part of our vehicle return process.</li>
                  <li><strong>Service Improvement:</strong> Your reviews help us maintain high standards and improve our services. We kindly request you to take a minute during the vehicle hand-over to share your genuine experience on our Google Business page.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">9. Pickup &amp; Drop-off Policy</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Free Service Zone:</strong> We offer Free Pickup and Drop-off within a 10 km radius of Margao Railway Station. Our team will pick you up from your shared location and bring you to our office.</li>
                  <li><strong>Mandatory Office Visit:</strong> For security and verification, all customers must visit our office to complete the necessary documentation and formalities before the vehicle is handed over.</li>
                  <li><strong>Outside Service Zone:</strong> For any pickup or drop-off location beyond the 10 km radius, a flat convenience fee of ₹300 will be applicable.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">10. Booking Advance &amp; Confirmation</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Reservation Amount:</strong> To confirm your booking, a non-refundable advance payment is mandatory:
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                      <li>Two-Wheelers (Bikes/Scooters): ₹500 advance.</li>
                      <li>Four-Wheelers (Cars): ₹1,000 advance.</li>
                    </ul>
                  </li>
                  <li><strong>Final Payment:</strong> The remaining rental balance must be cleared at the office during the documentation process.</li>
                </ul>
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
