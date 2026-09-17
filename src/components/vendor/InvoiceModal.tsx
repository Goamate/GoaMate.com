import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  FileText,
  User,
  Car,
  Calendar,
  IndianRupee,
  Lock,
  Plus,
  Trash2,
  Save,
  QrCode,
  Sparkles,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  Bike,
  AlignLeft,
  CheckSquare
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { Booking, Invoice, InvoiceItem, InvoicePaymentStatus, InvoicePaymentMethod } from '../../types';
import { api } from '../../services/api';

interface InvoiceModalProps {
  booking: Booking;
  invoice?: Invoice | null;
  onClose: () => void;
  onInvoiceGenerated?: (invoice: Invoice) => void;
  onInvoiceUpdated?: (invoice: Invoice) => void;
  vendorToken?: string | null;
  adminToken?: string | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  booking,
  invoice: initialInvoice,
  onClose,
  onInvoiceGenerated,
  onInvoiceUpdated,
  vendorToken,
  adminToken,
}) => {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(initialInvoice || null);
  const [loading, setLoading] = useState<boolean>(!initialInvoice);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // View mode vs Generation form mode
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Active Copy Type: 'customer' (safe, no KYC) or 'internal' (with KYC document appendix)
  const [copyType, setCopyType] = useState<'customer' | 'internal'>('customer');

  // Generation form state
  const [formItems, setFormItems] = useState<InvoiceItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);
  const [securityDeposit, setSecurityDeposit] = useState<number>(booking.securityDeposit || 0);
  const [amountPaid, setAmountPaid] = useState<number>(booking.totalEstimatedAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>('paid');
  const [notes, setNotes] = useState<string>('Thank you for renting with GoaMate! Please retain this invoice for your records.');

  // Calculation breakdown from backend
  const [calcSummary, setCalcSummary] = useState<{
    subtotalAmount: number;
    discountAmount: number;
    extraCharges: number;
    taxRatePercent: number;
    taxAmount: number;
    securityDeposit: number;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
  }>({
    subtotalAmount: booking.subtotalAmount || 0,
    discountAmount: 0,
    extraCharges: booking.deliveryFee || 0,
    taxRatePercent: 0,
    taxAmount: 0,
    securityDeposit: booking.securityDeposit || 0,
    totalAmount: booking.totalEstimatedAmount || 0,
    amountPaid: booking.totalEstimatedAmount || 0,
    amountDue: 0,
  });

  // Edit payment modal inside existing invoice
  const [isEditingPayment, setIsEditingPayment] = useState<boolean>(false);
  const [editPaymentStatus, setEditPaymentStatus] = useState<InvoicePaymentStatus>('paid');
  const [editAmountPaid, setEditAmountPaid] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<InvoicePaymentMethod>('UPI');

  // Check if invoice exists on mount
  useEffect(() => {
    let isMounted = true;

    async function checkInvoice() {
      if (initialInvoice) {
        setCurrentInvoice(initialInvoice);
        setEditPaymentStatus(initialInvoice.paymentStatus);
        setEditAmountPaid(initialInvoice.amountPaid);
        setEditPaymentMethod(initialInvoice.paymentMethod || 'UPI');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.getInvoiceForBooking(booking.id);
        if (!isMounted) return;

        if (res.hasInvoice && res.invoice) {
          setCurrentInvoice(res.invoice);
          setEditPaymentStatus(res.invoice.paymentStatus);
          setEditAmountPaid(res.invoice.amountPaid);
          setEditPaymentMethod(res.invoice.paymentMethod || 'UPI');
          setIsCreatingNew(false);
        } else {
          // Initialize default items for generator form
          initFormDefaults();
          setIsCreatingNew(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        initFormDefaults();
        setIsCreatingNew(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkInvoice();
    return () => {
      isMounted = false;
    };
  }, [booking.id, initialInvoice]);

  const initFormDefaults = () => {
    const days = booking.daysCount || 1;
    const vehicleName = booking.vehicle?.name || booking.priceSnapshot?.vehicleDetails?.name || 'Vehicle Rental';
    const rentalCharge = (booking.dailyRate || 0) * days;

    const initialItems: InvoiceItem[] = [
      {
        id: 'item-1',
        description: `${vehicleName} Rental (${days} ${days > 1 ? 'days' : 'day'})`,
        quantityOrDays: `${days} ${days > 1 ? 'days' : 'day'}`,
        rate: booking.dailyRate || 0,
        amount: rentalCharge,
      },
    ];

    if (booking.deliveryFee && booking.deliveryFee > 0) {
      initialItems.push({
        id: 'item-2',
        description: `Delivery & Pickup Service (${booking.pickupLocation} to ${booking.dropoffLocation})`,
        quantityOrDays: '1 trip',
        rate: booking.deliveryFee,
        amount: booking.deliveryFee,
      });
    }
    if (booking.lateFee && booking.lateFee > 0) {
      initialItems.push({
        id: 'item-late-fee',
        description: `Late Return Fee`,
        quantityOrDays: '1',
        rate: booking.lateFee,
        amount: booking.lateFee,
      });
    }

    setFormItems(initialItems);
    setSecurityDeposit(booking.securityDeposit || 0);
    setAmountPaid(booking.totalEstimatedAmount || rentalCharge + (booking.deliveryFee || 0));

    // Request initial backend calculation
    calculateTotals(initialItems, 0, 0, booking.securityDeposit || 0, booking.totalEstimatedAmount || 0);
  };

  // Trigger backend calculation
  const calculateTotals = async (
    items: InvoiceItem[],
    disc: number,
    taxPct: number,
    deposit: number,
    paid: number
  ) => {
    try {
      const res = await api.calculateInvoice({
        bookingId: booking.id,
        items,
        discountAmount: disc,
        taxRatePercent: taxPct,
        securityDeposit: deposit,
        amountPaid: paid,
      });

      setCalcSummary({
        subtotalAmount: res.subtotalAmount,
        discountAmount: res.discountAmount,
        extraCharges: res.extraCharges,
        taxRatePercent: res.taxRatePercent,
        taxAmount: res.taxAmount,
        securityDeposit: res.securityDeposit,
        totalAmount: res.totalAmount,
        amountPaid: res.amountPaid,
        amountDue: res.amountDue,
      });
    } catch (err) {
      // Fallback local calc
      const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const taxable = Math.max(0, subtotal - disc);
      const tax = (taxable * taxPct) / 100;
      const total = taxable + tax;
      setCalcSummary({
        subtotalAmount: subtotal,
        discountAmount: disc,
        extraCharges: 0,
        taxRatePercent: taxPct,
        taxAmount: tax,
        securityDeposit: deposit,
        totalAmount: total,
        amountPaid: paid,
        amountDue: Math.max(0, total - paid),
      });
    }
  };

  // Form item handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...formItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'rate') {
      item.amount = Number(value) || 0;
    }
    updated[index] = item;
    setFormItems(updated);
    calculateTotals(updated, discountAmount, taxRatePercent, securityDeposit, amountPaid);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Extra Service / Fuel / Helmet',
      quantityOrDays: '1',
      rate: 200,
      amount: 200,
    };
    const updated = [...formItems, newItem];
    setFormItems(updated);
    calculateTotals(updated, discountAmount, taxRatePercent, securityDeposit, amountPaid);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length <= 1) return;
    const updated = formItems.filter((_, i) => i !== index);
    setFormItems(updated);
    calculateTotals(updated, discountAmount, taxRatePercent, securityDeposit, amountPaid);
  };

  // Submit and create invoice on server
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        bookingId: booking.id,
        items: formItems,
        discountAmount,
        taxRatePercent,
        securityDeposit,
        amountPaid,
        paymentMethod,
        paymentStatus,
        notes,
      };

      const res = await api.createInvoice(payload, { vendorToken, adminToken });
      setCurrentInvoice(res.invoice);
      setIsCreatingNew(false);
      setEditPaymentStatus(res.invoice.paymentStatus);
      setEditAmountPaid(res.invoice.amountPaid);
      setEditPaymentMethod(res.invoice.paymentMethod || 'UPI');
      if (onInvoiceGenerated) onInvoiceGenerated(res.invoice);
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice.');
    } finally {
      setSaving(false);
    }
  };

  // Quick payment status update on existing invoice
  const handleUpdatePayment = async () => {
    if (!currentInvoice) return;
    try {
      setSaving(true);
      setError(null);
      const res = await api.updateInvoice(
        currentInvoice.id,
        {
          paymentStatus: editPaymentStatus,
          amountPaid: editAmountPaid,
          paymentMethod: editPaymentMethod,
        },
        { vendorToken, adminToken }
      );
      setCurrentInvoice(res.invoice);
      setIsEditingPayment(false);
      if (onInvoiceUpdated) onInvoiceUpdated(res.invoice);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment status.');
    } finally {
      setSaving(false);
    }
  };

  // Print / PDF download trigger
  const handlePrint = async () => {
    if (currentInvoice) {
      api.auditInvoiceDownload(currentInvoice.id, copyType);
    }
    
    const element = document.getElementById('official-invoice-print-container');
    if (element) {
      try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        let pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Scale down to fit exactly in 2 pages if it overflows
        const maxPages = 2;
        if (imgHeight > pageHeight * maxPages) {
          const ratio = (pageHeight * maxPages) / imgHeight;
          imgHeight = imgHeight * ratio;
          pdfWidth = pdfWidth * ratio;
        }
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Center horizontally if scaled
        const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;

        pdf.addImage(imgData, 'PNG', xOffset, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 1) { // > 1 to avoid floating point precision blank pages
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', xOffset, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`Invoice_${currentInvoice?.invoiceNumber || booking.referenceNumber}.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
        window.print(); // Fallback to native print if PDF generation fails
      }
    } else {
      window.print();
    }
  };

  const renderStatusBadge = (status: InvoicePaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            PAID IN FULL
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PARTIALLY PAID
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            PAYMENT PENDING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl flex flex-col my-auto shadow-2xl rounded-2xl overflow-hidden print:w-full print:max-w-none print:h-auto print:rounded-none print:shadow-none print:bg-white print:fixed print:inset-0 print:z-[9999] print:overflow-visible">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                {currentInvoice ? (
                  <>
                    <span>Invoice: {currentInvoice.invoiceNumber}</span>
                    <span className="text-xs text-slate-400 font-normal">({currentInvoice.bookingReference})</span>
                  </>
                ) : (
                  <span>Generate New Invoice ({booking.referenceNumber})</span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Customer: {booking.customerName} • {booking.vehicle?.name || 'Vehicle'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {currentInvoice && (
              <>
                {/* Copy selector toggle */}
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setCopyType('customer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      copyType === 'customer'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Customer Copy
                  </button>
                  <button
                    onClick={() => setCopyType('internal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      copyType === 'internal'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Internal Copy (KYC)
                  </button>
                </div>

                {/* Print & PDF Button */}
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / PDF</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 print:hidden">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading invoice details...</p>
          </div>
        ) : isCreatingNew ? (
          /* ========================================================================= */
          /* INVOICE GENERATOR FORM                                                   */
          /* ========================================================================= */
          <form onSubmit={handleCreateInvoice} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Create Official Rental Invoice</h4>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  Review and customize line items. Amounts, discounts, taxes, and balance due are computed securely on the server.
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Invoice Line Items</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 sm:gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="col-span-12 sm:col-span-6">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qty / Days</label>
                      <input
                        type="text"
                        value={item.quantityOrDays}
                        onChange={e => handleItemChange(index, 'quantityOrDays', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 text-center font-medium"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={e => handleItemChange(index, 'rate', Number(e.target.value))}
                        required
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formItems.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Adjustments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setDiscountAmount(val);
                    calculateTotals(formItems, val, taxRatePercent, securityDeposit, amountPaid);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tax / GST (%)</label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={taxRatePercent}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setTaxRatePercent(val);
                    calculateTotals(formItems, discountAmount, val, securityDeposit, amountPaid);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Security Deposit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSecurityDeposit(val);
                    calculateTotals(formItems, discountAmount, taxRatePercent, val, amountPaid);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Refundable upon return</span>
              </div>
            </div>

            {/* Payment Collection Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Payment Collection Details</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as InvoicePaymentStatus)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                  >
                    <option value="paid">Paid in Full</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="pending">Pending Collection</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as InvoicePaymentMethod)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash on Delivery</option>
                    <option value="Credit Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking / IMPS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAmountPaid(val);
                      calculateTotals(formItems, discountAmount, taxRatePercent, securityDeposit, val);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Invoice Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Terms or specific notes for this invoice..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {/* Calculated Breakdown Box */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="space-y-1 text-xs text-slate-300 w-full sm:w-auto">
                <div className="flex justify-between sm:justify-start gap-6">
                  <span>Subtotal:</span>
                  <span className="font-bold text-white">₹{calcSummary.subtotalAmount}</span>
                </div>
                {calcSummary.discountAmount > 0 && (
                  <div className="flex justify-between sm:justify-start gap-6 text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-bold">-₹{calcSummary.discountAmount}</span>
                  </div>
                )}
                {calcSummary.taxAmount > 0 && (
                  <div className="flex justify-between sm:justify-start gap-6">
                    <span>GST ({calcSummary.taxRatePercent}%):</span>
                    <span className="font-bold text-white">+₹{calcSummary.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between sm:justify-start gap-6 text-amber-400 font-semibold">
                  <span>Refundable Deposit:</span>
                  <span>₹{calcSummary.securityDeposit}</span>
                </div>
              </div>

              <div className="text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Invoice Amount</p>
                <p className="text-3xl font-black text-emerald-400">₹{calcSummary.totalAmount}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Balance Due: <span className="font-bold text-white">₹{calcSummary.amountDue}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Official Invoice...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Generate & Issue Invoice</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* INVOICE DISPLAY & PRINT VIEW                                             */
          /* ========================================================================= */
          <div className="p-6 sm:p-10 overflow-y-auto max-h-[85vh] bg-white print:p-8 print:max-h-none print:overflow-visible">
            
            {/* Action banner for updating payment status (Hidden in print) */}
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment:</span>
                {renderStatusBadge(currentInvoice?.paymentStatus || 'pending')}
                <span className="text-xs font-bold text-slate-700">
                  Paid: ₹{currentInvoice?.amountPaid || 0} / Due: ₹{currentInvoice?.amountDue || 0}
                </span>
              </div>

              <button
                onClick={() => setIsEditingPayment(!isEditingPayment)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
              >
                {isEditingPayment ? 'Close Update' : 'Update Payment'}
              </button>
            </div>

            {/* Payment editing expandable bar (Hidden in print) */}
            {isEditingPayment && (
              <div className="mb-6 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 print:hidden">
                <h6 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Update Payment Details</h6>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={e => setEditPaymentStatus(e.target.value as InvoicePaymentStatus)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-bold"
                    >
                      <option value="paid">Paid in Full</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editAmountPaid}
                      onChange={e => setEditAmountPaid(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Method</label>
                    <select
                      value={editPaymentMethod}
                      onChange={e => setEditPaymentMethod(e.target.value as InvoicePaymentMethod)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-bold"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleUpdatePayment}
                      disabled={saving}
                      className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      {saving ? 'Saving...' : 'Save Update'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* OFFICIAL INVOICE DOCUMENT TEMPLATE                                         */}
            {/* ========================================================================= */}
                        <div id="official-invoice-print-container" className="bg-white font-sans text-slate-900 border border-slate-200">
              
              {/* Header section */}
              <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 py-6 border-b-[6px] border-emerald-700">
                {/* Logo & Brand Left */}
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <img src="/goamate-logo-round.png" alt="GoaMate Logo" className="w-24 h-24 object-contain shrink-0" />
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-emerald-700 m-0 leading-none">GOA MATE</h1>
                    <h2 className="text-xl font-black text-slate-900 m-0 tracking-tight leading-tight">CAR & BIKE RENTAL</h2>
                    <p className="text-sm font-semibold italic text-emerald-800 mt-1" style={{fontFamily: 'cursive'}}>Explore Goa Together</p>
                  </div>
                </div>

                {/* Slogan Middle */}
                <div className="hidden lg:flex flex-col items-center justify-center border-l-2 border-slate-200 px-6">
                   <div className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
                     <span>CARS</span> <span className="text-emerald-500">|</span> <span>BIKES</span> <span className="text-emerald-500">|</span> <span>GOOD VIBES</span>
                   </div>
                   <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
                     <span>DRIVE</span> <span>&bull;</span> <span>EXPLORE</span> <span>&bull;</span> <span>BELONG</span>
                   </div>
                </div>

                {/* Contact Right */}
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-800 mt-4 sm:mt-0">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-700" /> +91 9403784132</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-500" /> +91 9403784132 (WhatsApp)</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-700" /> goamate.com@gmail.com</div>
                  <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-700" /> www.goamate.com</div>
                  <div className="flex items-start gap-2 mt-1"><MapPin className="w-5 h-5 text-emerald-700 shrink-0" /> <span className="max-w-[150px]">Shop No. 5, Naik Waddo, Calangute, Bardez, Goa 403516, India</span></div>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-8 py-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">INVOICE</h2>
                  <p className="text-emerald-700 text-sm font-black tracking-[0.2em] uppercase mt-1">RENTALS FOR A BRIGHTER GOA</p>
                </div>
                <div className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-sm mt-3 sm:mt-0">
                  <FileText className="w-6 h-6" />
                  <span className="font-bold text-lg">{copyType === 'internal' ? 'Vendor / Admin Copy' : 'Customer Copy'}</span>
                </div>
              </div>

              {/* 4 Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 sm:px-8 pb-4">
                {/* Card 1 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-11">
                  <div className="bg-emerald-700 w-10 flex items-center justify-center text-white shrink-0"><FileText className="w-5 h-5" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase">Invoice No:</span>
                    <span className="text-xs font-black leading-[11px] mt-0.5 text-slate-900">{currentInvoice?.invoiceNumber || booking.referenceNumber}</span>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-11">
                  <div className="bg-emerald-700 w-10 flex items-center justify-center text-white shrink-0"><AlignLeft className="w-5 h-5" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase">Booking No:</span>
                    <span className="text-xs font-black leading-[11px] mt-0.5 text-slate-900">{currentInvoice?.bookingReference || booking.referenceNumber}</span>
                  </div>
                </div>
                {/* Card 3 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-11">
                  <div className="bg-emerald-700 w-10 flex items-center justify-center text-white shrink-0"><Calendar className="w-5 h-5" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase">Invoice Date:</span>
                    <span className="text-xs font-black leading-[11px] mt-0.5 text-slate-900">
                      {new Date(currentInvoice?.invoiceDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {/* Card 4 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-11">
                  <div className="bg-emerald-700 w-10 flex items-center justify-center text-white shrink-0"><Clock className="w-5 h-5" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase">Payment Status:</span>
                    <div className="mt-0.5">
                      {currentInvoice?.paymentStatus === 'paid' && <span className="bg-emerald-300 text-emerald-900 px-2 py-0.5 rounded font-bold text-[9px] uppercase">PAID IN FULL</span>}
                      {currentInvoice?.paymentStatus === 'partially_paid' && <span className="bg-orange-300 text-amber-950 px-2 py-0.5 rounded font-bold text-[9px] uppercase">Partially Paid</span>}
                      {currentInvoice?.paymentStatus === 'pending' && <span className="bg-rose-300 text-rose-950 px-2 py-0.5 rounded font-bold text-[9px] uppercase">Payment Pending</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Columns Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-8 pb-6">
                {/* Col 1 */}
                <div className="border border-emerald-700 bg-emerald-50/50 rounded-t-lg overflow-hidden flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <User className="w-5 h-5" /> CUSTOMER DETAILS
                  </div>
                  <div className="p-4 text-xs flex-1 space-y-2">
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Name:</span><span className="font-bold text-slate-900">{currentInvoice?.customerDetails?.name || booking.customerName}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Address:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.address || 'Not Provided'}</span></div>
                    <div className="grid grid-cols-[100px_1fr] mt-2"><span className="text-slate-600 font-semibold">Phone:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.phone || booking.customerPhone}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Email:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.email || booking.customerEmail || 'Not Provided'}</span></div>
                    <div className="grid grid-cols-[100px_1fr] items-center"><span className="text-slate-600 font-semibold">WhatsApp:</span><span className="font-semibold text-slate-800 flex items-center gap-1"><span className="w-4 h-4 bg-emerald-500 rounded-full text-white flex items-center justify-center"><Phone className="w-2.5 h-2.5" /></span> {currentInvoice?.customerDetails?.phone || booking.customerPhone}</span></div>
                    <div className="grid grid-cols-[125px_1fr] pt-2"><span className="text-slate-600 font-semibold">Driving Licence No:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.drivingLicenceNumber || 'Verified in Person'}</span></div>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="border border-emerald-700 bg-emerald-50/50 rounded-t-lg overflow-hidden flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <Bike className="w-5 h-5" /> VEHICLE DETAILS
                  </div>
                  <div className="p-4 text-xs flex-1 space-y-2">
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Vehicle Type:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.type || booking.vehicleCategory}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Vehicle Name:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.name || booking.vehicleName}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Brand:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.name?.split(' ')[0] || '-'}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Model:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.name?.split(' ').slice(1).join(' ') || '-'}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Registration No:</span><span className="font-semibold text-slate-800 uppercase">{currentInvoice?.vehicleDetails?.registrationNumber || 'Pending'}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Vendor:</span><span className="font-semibold text-slate-800">{booking.vendorName || '-'}</span></div>
                  </div>
                </div>

                {/* Col 3 */}
                <div className="border border-emerald-700 bg-emerald-50/50 rounded-t-lg overflow-hidden flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <Calendar className="w-5 h-5" /> RENTAL INFORMATION
                  </div>
                  <div className="p-4 text-xs flex-1 space-y-2">
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Pickup Location:</span><span className="font-semibold text-slate-800">{currentInvoice?.rentalDetails?.pickupLocation || booking.pickupLocation}</span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Drop-off Location:</span><span className="font-semibold text-slate-800">{currentInvoice?.rentalDetails?.dropoffLocation || booking.dropoffLocation}</span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Pickup Date & Time:</span><span className="font-semibold text-slate-800">
                      {new Date(currentInvoice?.rentalDetails?.pickupDatetime || booking.pickupDatetime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }).toUpperCase()}
                    </span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Return Date & Time:</span><span className="font-semibold text-slate-800">
                      {new Date(currentInvoice?.rentalDetails?.returnDatetime || booking.returnDatetime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }).toUpperCase()}
                    </span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Total Duration:</span><span className="font-semibold text-slate-800">{currentInvoice?.rentalDetails?.totalDurationDays || booking.totalDays} Days</span></div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="px-4 sm:px-8 pb-6">
                <table className="w-full text-left text-sm border-collapse border border-emerald-700">
                  <thead className="bg-emerald-700 text-white font-bold">
                    <tr>
                      <th className="py-2 px-3 border border-emerald-700 w-12 text-center">#</th>
                      <th className="py-2 px-3 border border-emerald-700">Description</th>
                      <th className="py-2 px-3 border border-emerald-700 text-center w-28">Qty/Days</th>
                      <th className="py-2 px-3 border border-emerald-700 text-center w-32">Rate (₹)</th>
                      <th className="py-2 px-3 border border-emerald-700 text-center w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice?.items?.map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-medium text-slate-700">{i + 1}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 font-semibold text-slate-800">{item.description}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">{item.quantityOrDays} {item.description.includes('Rental') ? 'Days' : ''}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">{Number(item.rate).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">{Number(item.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {/* Fill empty rows if items < 4 */}
                    {Array.from({ length: Math.max(0, 4 - (currentInvoice?.items?.length || 0)) }).map((_, i) => (
                      <tr key={`empty-${i}`} className={(currentInvoice?.items?.length || 0 + i) % 2 !== 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-medium text-slate-700">{(currentInvoice?.items?.length || 0) + i + 1}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 font-semibold text-slate-800">-</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">-</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">-</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Section: Notes & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 px-4 sm:px-8 pb-6">
                {/* Notes */}
                <div className="bg-emerald-50/50 rounded-t-lg overflow-hidden border border-emerald-700 flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <AlignLeft className="w-5 h-5" /> Notes / Terms
                  </div>
                  <div className="p-4 text-xs font-semibold text-slate-800 leading-relaxed flex-1">
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li>Customer provided valid driving licence and ID proof at the time of booking.</li>
                      {copyType === 'internal' && <li>Copy of customer documents are attached below.</li>}
                      <li>This is an {copyType === 'internal' ? 'internal' : 'official'} invoice for {copyType === 'internal' ? 'vendor/admin use only' : 'customer record'}.</li>
                      <li>All information is for operational purposes. Not a legal document.</li>
                    </ol>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-emerald-50/50 rounded-t-lg overflow-hidden border border-emerald-700 flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <AlignLeft className="w-5 h-5" /> INVOICE SUMMARY
                  </div>
                  <div className="p-4 text-sm font-semibold text-slate-800 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between py-1 border-b border-emerald-200">
                      <span>Subtotal</span>
                      <span className="font-bold">₹ {(currentInvoice?.subtotalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200 text-red-600">
                      <span>Discount</span>
                      <span className="font-bold">- ₹ {(currentInvoice?.discountAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200">
                      <span>GST ({currentInvoice?.taxRatePercent || 0}%)</span>
                      <span className="font-bold">₹ {(currentInvoice?.taxAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-emerald-200/50 px-2 my-1 rounded border border-emerald-300">
                      <span className="font-bold text-slate-900">Total Amount</span>
                      <span className="font-bold text-emerald-800 text-base">₹ {(currentInvoice?.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200 text-emerald-700">
                      <span>Amount Paid</span>
                      <span className="font-bold">₹ {(currentInvoice?.amountPaid || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200 text-red-600">
                      <span className="font-bold">Balance Due</span>
                      <span className="font-bold">₹ {(currentInvoice?.amountDue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 mt-1">
                      <div>
                        <div className="font-bold">Refundable Security Deposit</div>
                        <div className="text-[10px] font-normal text-slate-500">(Not included in total)</div>
                      </div>
                      <span className="font-bold text-slate-800 mt-0.5">₹ {(currentInvoice?.securityDeposit || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Section (Only if Internal Copy) */}
              {copyType === 'internal' && (
                <div className="px-4 sm:px-8 pb-6">
                  <div className="border-t-[3px] border-emerald-700 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <div className="bg-emerald-700 text-white rounded-full p-1"><CheckSquare className="w-5 h-5" /></div>
                        <h3 className="text-lg font-black uppercase tracking-tight">CUSTOMER ID DETAILS WITH PHOTO &ndash; SAMPLE / CONFIDENTIAL</h3>
                      </div>
                      <div className="bg-red-50 text-red-700 border border-red-200 p-2 text-center text-[10px] font-bold rounded-lg w-full sm:w-72">
                        Confidential customer identification documents. Authorized business use only. Do not distribute publicly.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {booking.documents && booking.documents.length > 0 ? (
                         booking.documents.map((doc, idx) => (
                            <div key={idx} className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                              <div className="bg-emerald-100 text-emerald-900 text-center py-1.5 text-xs font-bold uppercase border-b border-emerald-200">
                                {doc.docType.replace(/_/g, ' ')} {doc.idProofType ? `(${doc.idProofType})` : ''}
                              </div>
                              <div className="p-3 flex items-center justify-center min-h-[160px] relative">
                                {doc.previewUrl ? (
                                  <img src={doc.previewUrl} alt="KYC Doc" className="w-full h-auto object-contain rounded" />
                                ) : (
                                  <span className="text-xs text-slate-400">Image unavailable</span>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                  <div className="text-4xl font-black text-red-500 -rotate-12 border-4 border-red-500 px-4 py-1 rounded-lg uppercase">SAMPLE</div>
                                </div>
                              </div>
                            </div>
                         ))
                      ) : (
                        <div className="col-span-1 sm:col-span-3 text-center py-8 text-slate-500 font-semibold border-2 border-dashed border-slate-300 rounded-xl">
                          No ID documents uploaded for this booking.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-[6px] border-emerald-700 px-4 sm:px-8 py-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-3">
                   <Sparkles className="w-10 h-10 text-emerald-600" />
                   <div>
                     <h4 className="text-3xl font-black text-emerald-700 italic leading-none">Goa</h4>
                     <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest mt-0.5">More Than a Destination</p>
                   </div>
                 </div>
                 
                 <div className="text-center">
                   <h3 className="text-2xl font-black text-emerald-700 italic">Thank you for choosing GoaMate</h3>
                   <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-800 uppercase tracking-widest mt-1">
                     <Car className="w-4 h-4 text-emerald-600" /> <span>Rent</span> <span className="text-slate-300">|</span> <span>Drive</span> <span className="text-slate-300">|</span> <span>Explore</span> <span className="text-slate-300">|</span> <span>Create Memories</span>
                   </div>
                 </div>

                 <div className="flex items-center justify-end gap-3 text-right">
                   <div>
                     <h4 className="text-2xl font-black text-emerald-700 italic leading-none">Good Rides</h4>
                     <p className="text-xs font-bold text-emerald-900 italic mt-0.5">Happier Stories</p>
                   </div>
                   <Sparkles className="w-10 h-10 text-emerald-600" />
                 </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Print stylesheet to ensure only official invoice prints without background overlays */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(.fixed) {
            display: none !important;
          }
          .fixed {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #official-invoice-print-container {
            width: 100% !important;
            margin: 0 !important;
          }
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  );
};
