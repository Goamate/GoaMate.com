import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  Calendar,
  MapPin,
  Shield,
  Upload,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Lock,
  FileText,
  FileCheck,
  Trash2,
  Eye,
  Info,
  IndianRupee,
} from 'lucide-react';
import {
  Vehicle,
  BookingPriceBreakdown,
  GuestBookingSubmission,
  ServiceArea,
} from '../../types';
import { api } from '../../services/api';
import { DEFAULT_LOCATIONS } from '../../lib/constants';

interface BookingWizardProps {
  vehicle: Vehicle;
  initialPickupDate?: string;
  initialReturnDate?: string;
  initialLocation?: string;
  directLinkToken?: string;
  onClose: () => void;
  onSuccess: (result: { referenceNumber: string; booking: any }) => void;
}

interface UploadedDoc {
  name: string;
  type: string;
  size: number;
  base64: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  vehicle,
  initialPickupDate,
  initialReturnDate,
  initialLocation,
  directLinkToken,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Rental details
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setHours(10, 0, 0, 0);
  const dayAfter = new Date(Date.now() + 2 * 86400000);
  dayAfter.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatInputDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const [pickupDatetime, setPickupDatetime] = useState<string>(
    initialPickupDate || formatInputDate(tomorrow)
  );
  const [returnDatetime, setReturnDatetime] = useState<string>(
    initialReturnDate || formatInputDate(dayAfter)
  );
  const [pickupLocation, setPickupLocation] = useState<string>(
    initialLocation || 'Margao Hub (Near Madgaon Railway Station)'
  );
  const [dropoffLocation, setDropoffLocation] = useState<string>(
    initialLocation || 'Margao Hub (Near Madgaon Railway Station)'
  );
  const [priceBreakdown, setPriceBreakdown] = useState<BookingPriceBreakdown | null>(null);

  // Step 2: Customer details
  const [customerName, setCustomerName] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [sameWhatsapp, setSameWhatsapp] = useState<boolean>(true);
  const [customerWhatsapp, setCustomerWhatsapp] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [hotelAddress, setHotelAddress] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Step 3: Documents
  const [idProofType, setIdProofType] = useState<GuestBookingSubmission['idProofType']>('aadhaar');
  const [licenceFront, setLicenceFront] = useState<UploadedDoc | null>(null);
  const [licenceBack, setLicenceBack] = useState<UploadedDoc | null>(null);
  const [idFront, setIdFront] = useState<UploadedDoc | null>(null);
  const [idBack, setIdBack] = useState<UploadedDoc | null>(null);

  // Step 4: Checkboxes
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // Recalculate price when dates or pickup location change
  useEffect(() => {
    let active = true;
    async function fetchPricing() {
      try {
        setError(null);
        const res = await api.calculatePrice({
          vehicleId: vehicle.id,
          pickupDatetime,
          returnDatetime,
          pickupLocation,
        });
        if (active) {
          setPriceBreakdown(res.breakdown);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Invalid rental period');
          setPriceBreakdown(null);
        }
      }
    }

    if (pickupDatetime && returnDatetime) {
      fetchPricing();
    }
    return () => {
      active = false;
    };
  }, [vehicle.id, pickupDatetime, returnDatetime, pickupLocation]);

  // File helper: Converts file to base64 with max 10MB check
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (doc: UploadedDoc | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size: max 10MB
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('Selected file exceeds maximum limit of 10 MB. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setter({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Step validation
  const canProceedStep1 = Boolean(priceBreakdown && priceBreakdown.daysCount >= 1 && !error);

  const canProceedStep2 = Boolean(
    customerName.trim().length >= 3 &&
    customerPhone.trim().length >= 8 &&
    customerEmail.includes('@')
  );

  const canProceedStep3 = Boolean(licenceFront && idFront);

  const canSubmit = Boolean(
    canProceedStep1 && canProceedStep2 && canProceedStep3 && consentAccepted && termsAccepted
  );

  // Final Submit
  const handleSubmit = async () => {
    if (!canSubmit || !licenceFront || !idFront) return;

    setLoading(true);
    setError(null);

    const fullPhone = `${countryCode} ${customerPhone.trim()}`;
    const fullWhatsapp = sameWhatsapp ? fullPhone : `${countryCode} ${customerWhatsapp.trim()}`;

    try {
      const submission: GuestBookingSubmission = {
        vehicleId: vehicle.id,
        pickupDatetime,
        returnDatetime,
        pickupLocation,
        dropoffLocation,
        customerName: customerName.trim(),
        customerPhone: fullPhone,
        customerWhatsapp: fullWhatsapp,
        customerEmail: customerEmail.trim().toLowerCase(),
        hotelOrDeliveryAddress: hotelAddress.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        idProofType,
        directLinkToken,
        documents: {
          drivingLicenceFront: licenceFront,
          drivingLicenceBack: licenceBack || undefined,
          idProofFront: idFront,
          idProofBack: idBack || undefined,
        },
        consentAccepted,
        termsAccepted,
      };

      const result = await api.submitBooking(submission);
      onSuccess({ referenceNumber: result.referenceNumber, booking: result.booking });
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check details and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header with Step Tracker */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <span>Step {step} of 4</span>
              <span>&bull;</span>
              <span>No Customer Login Required</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {step === 1 && 'Rental Period & Location'}
              {step === 2 && 'Customer Contact Details'}
              {step === 3 && 'Upload Driving Licence & Govt ID'}
              {step === 4 && 'Review & Submit Request'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Scrollable Step Content */}
        <div className="overflow-y-auto p-5 sm:p-7 flex-1 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: RENTAL DETAILS ================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Selected Vehicle Banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={vehicle.coverImage}
                  alt={vehicle.name}
                  className="w-20 h-16 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    {vehicle.category} &bull; {vehicle.transmission}
                  </div>
                  <h3 className="font-extrabold text-slate-900 truncate text-base sm:text-lg">
                    {vehicle.name}
                  </h3>
                  <div className="text-xs text-slate-500">
                    ₹{vehicle.dailyPrice} / 24h &bull; Deposit: ₹{vehicle.securityDeposit} (Refundable)
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Date &amp; Time
                  </label>
                  <DatePicker
                    selected={pickupDatetime ? new Date(pickupDatetime) : null}
                    onChange={(date: Date | null) => date && setPickupDatetime(formatInputDate(date))}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy h:mm aa"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    wrapperClassName="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Return Date &amp; Time
                  </label>
                  <DatePicker
                    selected={returnDatetime ? new Date(returnDatetime) : null}
                    onChange={(date: Date | null) => date && setReturnDatetime(formatInputDate(date))}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy h:mm aa"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    wrapperClassName="w-full"
                    required
                  />
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Location
                  </label>
                  <select
                    value={pickupLocation || ''}
                    onChange={e => setPickupLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {DEFAULT_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Return / Dropoff Location
                  </label>
                  <select
                    value={dropoffLocation || ''}
                    onChange={e => setDropoffLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {DEFAULT_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Pricing Breakdown from Server */}
              {priceBreakdown && (
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                  {priceBreakdown.rentalCalculationMode === 'day_rental' && (
                    <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-200 text-xs font-semibold">
                      Day Rental Policy: This vehicle is rented on a day-rental basis from {priceBreakdown.rentalStartTime} to {priceBreakdown.rentalEndTime}. Returning the vehicle after the permitted return time may result in additional charges.
                    </div>
                  )}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                      Rental Calculation ({priceBreakdown.rentalCalculationMode === 'day_rental' ? 'Day Rental' : '24h Rule'})
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      {priceBreakdown.daysCount} Day{priceBreakdown.daysCount > 1 ? 's' : ''} {priceBreakdown.rentalCalculationMode !== 'day_rental' && `(${priceBreakdown.totalHours != null ? priceBreakdown.totalHours.toFixed(1) : (priceBreakdown.daysCount * 24)} hrs)`}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Daily Rate ({priceBreakdown.daysCount} &times; ₹{priceBreakdown.dailyRate}):</span>
                      <span className="font-semibold text-white">₹{priceBreakdown.subtotalAmount}</span>
                    </div>
                    
                    {priceBreakdown.lateFee ? (
                      <div className="flex justify-between text-rose-300">
                        <span>Late Return Fee:</span>
                        <span className="font-semibold">₹{priceBreakdown.lateFee}</span>
                      </div>
                    ) : null}

                    <div className="flex justify-between">
                      <span>Delivery &amp; Pickup Fee:</span>
                      <span className="font-semibold text-white">
                        {priceBreakdown.deliveryFee === 0 ? 'Free (Margao Hub)' : `₹${priceBreakdown.deliveryFee}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-amber-300">
                      <span>Refundable Security Deposit:</span>
                      <span className="font-semibold">₹{priceBreakdown.securityDeposit}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Total Estimated Payable:</div>
                      <div className="text-xl font-extrabold text-emerald-400">
                        ₹{priceBreakdown.totalEstimatedAmount}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400 max-w-[200px]">
                      Deposit refunded after vehicle return. Pay at handover.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: CUSTOMER CONTACT ================= */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name (As on Government ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName || ''}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Aditya Verma"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Phone & Country Code */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mobile Calling Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode || '+91'}
                    onChange={e => setCountryCode(e.target.value)}
                    className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+7">+7 (RU)</option>
                  </select>

                  <input
                    type="tel"
                    required
                    value={customerPhone || ''}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="9403784132"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* WhatsApp Option */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={sameWhatsapp}
                    onChange={e => setSameWhatsapp(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                  />
                  <span>WhatsApp number is the same as calling number</span>
                </label>

                {!sameWhatsapp && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Dedicated WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerWhatsapp || ''}
                      onChange={e => setCustomerWhatsapp(e.target.value)}
                      placeholder="WhatsApp number with country code"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail || ''}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Hotel or Stay Address in Goa (Optional)
                </label>
                <input
                  type="text"
                  value={hotelAddress || ''}
                  onChange={e => setHotelAddress(e.target.value)}
                  placeholder="e.g. Resort in Colva / Benaulim / Margao"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Special Requests / Arrival Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequests || ''}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Need extra helmet, arriving via Goa Express Train #12780..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 3: DOCUMENT UPLOADS ================= */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Security Privacy Warning Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Secure Document Verification:</span>
                  Uploaded documents are securely processed for rental verification and Goa traffic authority compliance only. Documents are never made public. Original documents must be physically presented at vehicle handover.
                </div>
              </div>

              {/* 1. Driving Licence Upload */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Driving Licence <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Max 10 MB (JPG, PNG, PDF)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* DL Front */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-white">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Front Side <span className="text-rose-500">*</span>
                    </span>
                    {licenceFront ? (
                      <div className="space-y-2">
                        {licenceFront.type.startsWith('image/') ? (
                          <img
                            src={licenceFront.base64}
                            alt="DL Front Preview"
                            className="h-24 w-full object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="h-24 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                            {licenceFront.name}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setLicenceFront(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center justify-center gap-1 mx-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-4 hover:bg-slate-50 rounded-lg transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-emerald-700">Choose or Capture Front</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          capture="environment"
                          onChange={e => handleFileUpload(e, setLicenceFront)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* DL Back */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-white">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Back Side (Optional)
                    </span>
                    {licenceBack ? (
                      <div className="space-y-2">
                        {licenceBack.type.startsWith('image/') ? (
                          <img
                            src={licenceBack.base64}
                            alt="DL Back Preview"
                            className="h-24 w-full object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="h-24 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                            {licenceBack.name}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setLicenceBack(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center justify-center gap-1 mx-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-4 hover:bg-slate-50 rounded-lg transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-slate-600">Choose or Capture Back</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          capture="environment"
                          onChange={e => handleFileUpload(e, setLicenceBack)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Identity Proof Upload */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Government Identity Proof <span className="text-rose-500">*</span>
                    </span>
                  </div>

                  <select
                    value={idProofType || 'aadhaar'}
                    onChange={e => setIdProofType(e.target.value as any)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-emerald-500"
                  >
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="passport">Passport</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="driving_licence">Driving Licence (ID Copy)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* ID Front */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-white">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Front Side <span className="text-rose-500">*</span>
                    </span>
                    {idFront ? (
                      <div className="space-y-2">
                        {idFront.type.startsWith('image/') ? (
                          <img
                            src={idFront.base64}
                            alt="ID Front Preview"
                            className="h-24 w-full object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="h-24 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                            {idFront.name}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIdFront(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center justify-center gap-1 mx-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-4 hover:bg-slate-50 rounded-lg transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-emerald-700">Choose or Capture Front</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          capture="environment"
                          onChange={e => handleFileUpload(e, setIdFront)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* ID Back */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-white">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Back Side (Optional)
                    </span>
                    {idBack ? (
                      <div className="space-y-2">
                        {idBack.type.startsWith('image/') ? (
                          <img
                            src={idBack.base64}
                            alt="ID Back Preview"
                            className="h-24 w-full object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="h-24 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                            {idBack.name}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIdBack(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center justify-center gap-1 mx-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-4 hover:bg-slate-50 rounded-lg transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-slate-600">Choose or Capture Back</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          capture="environment"
                          onChange={e => handleFileUpload(e, setIdBack)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: REVIEW & SUBMIT ================= */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Summary card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={vehicle.coverImage}
                      alt={vehicle.name}
                      className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{vehicle.name}</h4>
                      <span className="text-xs text-slate-500 uppercase">{vehicle.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Days</span>
                    <div className="text-sm font-bold text-slate-900">{priceBreakdown?.daysCount} Day(s)</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="font-bold text-slate-700 block">Pickup:</span>
                    <span>{pickupDatetime.replace('T', ' ')}</span>
                    <p className="text-slate-500">{pickupLocation}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Return:</span>
                    <span>{returnDatetime.replace('T', ' ')}</span>
                    <p className="text-slate-500">{dropoffLocation}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Customer:</span>
                    <span>{customerName}</span>
                    <p className="text-slate-500">{countryCode} {customerPhone}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Documents Attached:</span>
                    <span className="text-emerald-700 font-semibold">
                      DL Front, {idProofType.toUpperCase()} Front
                    </span>
                  </div>
                </div>

                {/* Pricing Summary */}
                {priceBreakdown && (
                  <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span>Rental Subtotal ({priceBreakdown.daysCount} Days):</span>
                      <span className="font-semibold">₹{priceBreakdown.subtotalAmount}</span>
                    </div>
                    {priceBreakdown.lateFee ? (
                      <div className="flex justify-between text-rose-600">
                        <span>Late Return Fee:</span>
                        <span className="font-semibold">₹{priceBreakdown.lateFee}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span className="font-semibold">
                        {priceBreakdown.deliveryFee === 0 ? 'Free' : `₹${priceBreakdown.deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-800">
                      <span>Security Deposit (Refundable):</span>
                      <span className="font-semibold">₹{priceBreakdown.securityDeposit}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                      <span>Total Estimated Payable:</span>
                      <span className="text-emerald-700 text-base">₹{priceBreakdown.totalEstimatedAmount}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Required Terms Checkboxes */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={e => setConsentAccepted(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 mt-0.5"
                  />
                  <span>
                    <strong>Document Verification Consent:</strong> I confirm that I will present the original Driving Licence and Government Photo ID physically at vehicle delivery.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 mt-0.5"
                  />
                  <span>
                    <strong>Terms &amp; Cancellation:</strong> I accept the GoaMate Rental Terms, 24-hour calculation policy, Level-to-Level fuel policy, and Cancellation Policy.
                  </span>
                </label>
              </div>

              {/* Explanatory Notice */}
              <div className="p-3.5 rounded-xl bg-slate-100 text-slate-600 text-xs leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>No Immediate Payment Required:</strong> Submitting this form sends your rental request to the GoaMate team. It does not charge your card or guarantee vehicle availability until verified by our Margao hub.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="py-2.5 px-4 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              onClick={() => setStep(step + 1)}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Booking Request</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
