import React, { useRef, useState } from 'react';
import { XCircle, Printer, Download, Loader2 } from 'lucide-react';
import { Booking } from '../../types';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface InvoiceModalProps {
  booking: Booking;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    try {
      const element = invoiceRef.current;
      
      // Use html2canvas-pro to support oklch colors from Tailwind v4
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add a small margin
      const margin = 10;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      pdf.save(`GoaMate_Invoice_${booking.referenceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback if PDF generation fails
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-4xl flex flex-col max-h-[95vh] shadow-2xl rounded-2xl overflow-hidden print:w-full print:max-w-none print:h-auto print:rounded-none print:shadow-none print:bg-white print:fixed print:inset-0 print:z-[9999] print:overflow-visible">
        
        {/* Modal Header - Hidden when printing */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Invoice: {booking.referenceNumber}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content - This area is printed */}
        <div ref={invoiceRef} className="p-8 sm:p-12 overflow-y-auto bg-white print:p-8 flex-1">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">GoaMate</h1>
              <p className="text-sm text-slate-600 mt-1 font-bold">PREMIUM VEHICLE RENTALS</p>
              <p className="text-sm text-slate-500 mt-1">Margao Hub, South Goa</p>
              <p className="text-sm text-slate-500">support@goamate.com | +91 9403784132</p>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest">INVOICE</h2>
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3 inline-block text-left min-w-[200px]">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Invoice Ref</p>
                <p className="text-sm font-black text-slate-800">{booking.referenceNumber}</p>
                <div className="h-px bg-slate-200 my-2"></div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Date of Issue</p>
                <p className="text-sm font-bold text-slate-800">{new Date(booking.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 print:grid-cols-2">
            {/* Bill To */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4">Billed To (Customer)</h3>
              <p className="font-black text-slate-900 text-xl mb-2">{booking.customerName}</p>
              <p className="text-slate-600 text-sm mb-1 flex justify-between"><span className="text-slate-400">Phone:</span> <span className="font-bold text-slate-800">{booking.customerPhone}</span></p>
              <p className="text-slate-600 text-sm mb-1 flex justify-between"><span className="text-slate-400">Email:</span> <span className="font-bold text-slate-800">{booking.customerEmail}</span></p>
              {booking.hotelOrDeliveryAddress && (
                <p className="text-slate-600 text-sm mt-3 pt-3 border-t border-slate-100">
                  <span className="block text-slate-400 mb-1">Address / Hotel:</span>
                  <span className="font-medium">{booking.hotelOrDeliveryAddress}</span>
                </p>
              )}
            </div>

            {/* Rental Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4">Rental Agreement</h3>
              <p className="font-black text-slate-900 text-lg mb-1">{booking.priceSnapshot?.vehicleDetails?.name || 'Vehicle'}</p>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-4">{booking.priceSnapshot?.vehicleDetails?.category || 'Category'}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Pickup</p>
                  <p className="font-bold text-slate-800">{new Date(booking.pickupDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="text-slate-500 text-xs mt-1 truncate" title={booking.pickupLocation}>{booking.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Return</p>
                  <p className="font-bold text-slate-800">{new Date(booking.returnDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="text-slate-500 text-xs mt-1 truncate" title={booking.dropoffLocation}>{booking.dropoffLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Duration</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Rate</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-bold text-slate-800 text-sm">Vehicle Rental Charges</p>
                    <p className="text-xs text-slate-500 mt-1">{booking.priceSnapshot?.vehicleDetails?.name}</p>
                  </td>
                  <td className="py-4 px-2 text-center text-sm font-medium text-slate-700">{booking.daysCount} Days</td>
                  <td className="py-4 px-2 text-right text-sm font-medium text-slate-700">₹{booking.dailyRate}</td>
                  <td className="py-4 px-2 text-right font-black text-slate-900">₹{booking.subtotalAmount}</td>
                </tr>
                
                {booking.deliveryFee > 0 && (
                  <tr>
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800 text-sm">Location Delivery / Pickup Fee</p>
                      <p className="text-xs text-slate-500 mt-1">To: {booking.dropoffLocation}</p>
                    </td>
                    <td className="py-4 px-2 text-center text-slate-400">-</td>
                    <td className="py-4 px-2 text-right text-slate-400">-</td>
                    <td className="py-4 px-2 text-right font-black text-slate-900">₹{booking.deliveryFee}</td>
                  </tr>
                )}
                
                {booking.securityDeposit > 0 && (
                  <tr>
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800 text-sm">Refundable Security Deposit</p>
                      <p className="text-xs text-slate-500 mt-1">Refunded upon safe return</p>
                    </td>
                    <td className="py-4 px-2 text-center text-slate-400">-</td>
                    <td className="py-4 px-2 text-right text-slate-400">-</td>
                    <td className="py-4 px-2 text-right font-black text-slate-900">₹{booking.securityDeposit}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800">
                  <td colSpan={3} className="py-5 px-2 text-right font-bold text-slate-600 uppercase tracking-wider text-sm">
                    Total Amount Due:
                  </td>
                  <td className="py-5 px-2 text-right font-black text-2xl text-emerald-700">
                    ₹{booking.totalEstimatedAmount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Visual Document Verification Section */}
          {booking.documents && booking.documents.length > 0 && (
            <div className="mb-10 break-before-auto">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-3 mb-5">Customer Identity Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                {booking.documents.map((doc, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 break-inside-avoid shadow-sm">
                    <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                      <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">{doc.docType.replace('_', ' ')}</span>
                      {doc.idProofType && (
                        <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          {doc.idProofType}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-center min-h-[160px] bg-slate-50/50">
                      {doc.previewUrl ? (
                        doc.mimeType.startsWith('image/') ? (
                          <img 
                            src={doc.previewUrl} 
                            alt={doc.fileName} 
                            className="w-full h-auto max-h-56 object-contain rounded border border-slate-200 bg-white shadow-sm"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-12 h-12 bg-white border border-slate-200 rounded flex items-center justify-center mb-3 text-slate-400 font-bold text-xl">
                              PDF
                            </div>
                            <span className="text-xs font-bold text-slate-600 break-all">{doc.fileName}</span>
                          </div>
                        )
                      ) : (
                        <div className="text-xs font-medium text-slate-400 italic text-center p-6">
                          Document securely stored.<br/>Image preview unavailable.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer / Terms */}
          <div className="border-t border-slate-200 pt-6 mt-8 break-inside-avoid">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 print:grid-cols-2">
              <div>
                <p className="font-black text-slate-800 text-xs uppercase tracking-widest mb-2">Terms & Conditions</p>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-500 font-medium leading-relaxed">
                  <li>Rental duration is calculated strictly on a 24-hour basis.</li>
                  <li>Level-to-level fuel policy applies. Return with same fuel.</li>
                  <li>Renter assumes full responsibility for damages & traffic fines.</li>
                  <li>Original ID and Driving Licence must be presented at handover.</li>
                </ol>
              </div>
              <div className="text-left sm:text-right print:text-right">
                <p className="font-black text-slate-800 text-xs uppercase tracking-widest mb-2">Vendor Authorization</p>
                <div className="h-16 w-48 border-b border-slate-300 ml-auto mt-4 mb-2"></div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Authorized Signature</p>
              </div>
            </div>
            <div className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Thank you for choosing GoaMate Rentals
            </div>
          </div>

        </div>
      </div>
      
      {/* Hide the underlying app when printing so only the invoice is printed */}
      <style>{`
        @media print {
          body > *:not(.fixed) {
            display: none !important;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
};
