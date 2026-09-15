import React from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  MessageSquare,
  Phone,
  ArrowRight,
  Shield,
  FileText,
  MapPin,
  Info,
} from 'lucide-react';
import { BRAND, getWhatsAppLink } from '../../lib/constants';
import { Booking } from '../../types';

interface BookingSuccessProps {
  referenceNumber: string;
  booking?: Partial<Booking>;
  onClose: () => void;
  onTrackBooking: (ref: string) => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  referenceNumber,
  booking,
  onClose,
  onTrackBooking,
}) => {
  const vehicleName = booking?.vehicle?.name || 'Selected Vehicle';
  const whatsappMsg = `Hello GoaMate, I have submitted booking request ${referenceNumber} for ${vehicleName}. Please confirm availability and handover details.`;

  // Generate safe customer receipt without embedded ID documents
  const handleDownloadReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GoaMate Rental Receipt - ${referenceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .brand { font-size: 24px; font-weight: 800; color: #047857; }
          .meta { font-size: 14px; color: #64748b; }
          .ref { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 20px; border-radius: 8px; margin: 24px 0; font-size: 18px; font-weight: bold; color: #065f46; }
          .section { margin: 24px 0; }
          .title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .total { font-size: 16px; font-weight: bold; color: #047857; }
          .notice { background: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; font-size: 12px; color: #92400e; margin-top: 30px; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">GOAMATE</div>
            <div class="meta">Car & Bike Rental Service &bull; Margao, Goa</div>
            <div class="meta">Phone / WhatsApp: +91 9403784132 &bull; Email: goamate.com@gmail.com</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold;">BOOKING ACKNOWLEDGEMENT</div>
            <div class="meta">Date: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <div class="ref">
          Booking Reference: ${referenceNumber} (Status: Awaiting Verification)
        </div>

        <div class="section">
          <div class="title">Rental Details</div>
          <table>
            <tr><td><strong>Vehicle:</strong></td><td>${vehicleName}</td></tr>
            <tr><td><strong>Pickup Time:</strong></td><td>${booking?.pickupDatetime?.replace('T', ' ') || 'Confirmed on Call'}</td></tr>
            <tr><td><strong>Return Time:</strong></td><td>${booking?.returnDatetime?.replace('T', ' ') || 'Confirmed on Call'}</td></tr>
            <tr><td><strong>Pickup Location:</strong></td><td>${booking?.pickupLocation || 'Margao Hub'}</td></tr>
            <tr><td><strong>Dropoff Location:</strong></td><td>${booking?.dropoffLocation || 'Margao Hub'}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="title">Estimated Rental Charges</div>
          <table>
            <tr><td>Rental Duration</td><td>${booking?.priceSnapshot?.daysCount || 1} Day(s) (${booking?.priceSnapshot?.totalHours?.toFixed(1) || 24} hrs)</td></tr>
            <tr><td>Daily Rate</td><td>₹${booking?.priceSnapshot?.dailyRate || 0}</td></tr>
            <tr><td>Subtotal Amount</td><td>₹${booking?.priceSnapshot?.subtotalAmount || 0}</td></tr>
            <tr><td>Delivery & Handling Fee</td><td>₹${booking?.priceSnapshot?.deliveryFee || 0}</td></tr>
            <tr><td>Refundable Security Deposit</td><td>₹${booking?.priceSnapshot?.securityDeposit || 0}</td></tr>
            <tr class="total"><td>Estimated Total Payable</td><td>₹${booking?.priceSnapshot?.totalEstimatedAmount || 0}</td></tr>
          </table>
        </div>

        <div class="notice">
          <strong>Mandatory Handover Instructions:</strong><br/>
          1. Original Driving Licence & Government ID must be physically presented during vehicle pickup.<br/>
          2. Rental operates on a 24-hour block calculation and Level-to-Level fuel policy.<br/>
          3. Security deposit is collected at handover and refunded promptly upon vehicle return after inspection.<br/>
          4. This booking acknowledgment does not guarantee vehicle dispatch until confirmed by GoaMate operations desk.
        </div>

        <div class="footer">
          GoaMate Car &amp; Bike Rental Service &bull; Margao, South Goa &bull; Helpline: +91 9403784132
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Request Successfully Submitted
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Booking Request Received!
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Thank you for choosing GoaMate. Your reservation request is in queue.
          </p>
        </div>

        {/* Highlighted Reference Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-emerald-500/40 text-left space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Booking Reference Number</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
              Status: Pending Verification
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wider">
            {referenceNumber}
          </div>
          <div className="text-xs text-slate-600">
            Vehicle: <strong>{vehicleName}</strong>
          </div>
        </div>

        {/* Clear Notice: Does not guarantee until verified */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Notice:</strong> Submission of this request does not charge your card or guarantee confirmed rental until our Margao operations hub verifies vehicle availability and document validity.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-3">
          <a
            href={getWhatsAppLink(whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Connect on WhatsApp with Reference</span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Receipt</span>
            </button>

            <a
              href={`tel:${BRAND.phoneRaw}`}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Call Helpline</span>
            </a>
          </div>
        </div>

        {/* Footer Close / Track */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={() => onTrackBooking(referenceNumber)}
            className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            <span>Track Booking Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-semibold"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
