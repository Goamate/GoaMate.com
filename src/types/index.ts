export type VehicleCategory = 'car' | 'bike' | 'scooter';
export type VehicleStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived' | 'inactive';
export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived' | 'inactive';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type IdProofType = 'aadhaar' | 'passport' | 'voter_id' | 'driving_licence' | 'other';
export type UserRole = 'super_admin' | 'vendor' | 'guest';

export interface VehicleImage {
  id: string;
  vehicleId: string;
  storagePath: string;
  publicUrl: string;
  isCover: boolean;
  sortOrder: number;
}

export interface Vehicle {
  id: string;
  vendorId: string;
  vendorBusinessName?: string;
  name: string;
  category: VehicleCategory;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string; // Staff/vendor protected
  transmission: 'Manual' | 'Automatic';
  fuelType: 'Petrol' | 'Diesel' | 'EV';
  seats: number;
  engineCapacityCc?: number;
  dailyPrice: number;
  securityDeposit: number;
  location: string;
  pickupOptions: string[];
  description: string;
  features: string[];
  fuelPolicy: string;
  mileagePolicy: string;
  isActive: boolean;
  status: VehicleStatus;
  rejectionReason?: string;
  images: VehicleImage[];
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  vendorName: string;
  phone: string;
  whatsapp: string;
  email: string;
  serviceLocation: string;
  status: VendorStatus;
  rejectionReason?: string;
  notes?: string;
  vehicleCount?: number;
  rentalCalculationMode?: 'day_rental' | '24_hour';
  dayRentalStartTime?: string;
  dayRentalEndTime?: string;
  gracePeriodMinutes?: number;
  lateReturnPolicy?: 'extra_hour' | 'extra_day' | 'custom_fee';
  extraHourPrice?: number;
  customLateFeeAmount?: number;
  overnightRentalAllowed?: boolean;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface BookingPriceBreakdown {
  dailyRate: number;
  daysCount: number;
  totalHours?: number;
  subtotalAmount: number;
  deliveryFee: number;
  securityDeposit: number;
  totalEstimatedAmount: number;
  durationRule: string;
  rentalCalculationMode?: 'day_rental' | '24_hour';
  rentalStartTime?: string;
  rentalEndTime?: string;
  chargeableDays?: number;
  extraHours?: number;
  lateFee?: number;
  estimatedTotal?: number;
  finalTotal?: number;
}

export interface BookingDocument {
  id: string;
  bookingId: string;
  docType: 'driving_licence_front' | 'driving_licence_back' | 'id_proof_front' | 'id_proof_back';
  idProofType: IdProofType;
  storagePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  previewUrl?: string; // Short-lived signed URL for staff
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  previousStatus?: BookingStatus;
  newStatus: BookingStatus;
  changedByUserId?: string;
  reason?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  vehicleId: string;
  vendorId: string;
  vehicle?: Vehicle;
  vendor?: Vendor;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string;
  customerEmail: string;
  hotelOrDeliveryAddress?: string;
  specialRequests?: string;
  pickupDatetime: string;
  returnDatetime: string;
  pickupLocation: string;
  dropoffLocation: string;
  daysCount: number;
  dailyRate: number;
  subtotalAmount: number;
  deliveryFee: number;
  securityDeposit: number;
  totalEstimatedAmount: number;
  priceSnapshot: BookingPriceBreakdown;
  rentalCalculationMode?: 'day_rental' | '24_hour';
  rentalStartTime?: string;
  rentalEndTime?: string;
  chargeableDays?: number;
  extraHours?: number;
  lateFee?: number;
  estimatedTotal?: number;
  finalTotal?: number;
  status: BookingStatus;
  adminNotes?: string;
  vendorNotes?: string;
  directLinkId?: string;
  documents: BookingDocument[];
  statusHistory?: BookingStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingFormLink {
  id: string;
  vendorId: string;
  vehicleId: string;
  vehicleName?: string;
  token?: string; // only available upon creation
  tokenHash: string;
  presetPickupDatetime?: string;
  presetReturnDatetime?: string;
  expiresAt?: string;
  isRevoked: boolean;
  isUsed: boolean;
  usedAt?: string;
  bookingId?: string;
  createdAt: string;
  directUrl?: string;
}

export interface SiteSettings {
  acceptNewBookings: boolean;
  allowVendorRegistration: boolean;
  allowVendorVehicleUploads: boolean;
  allowVendorDirectLinks: boolean;
  showCars: boolean;
  showBikes: boolean;
  showScooters: boolean;
  showWhatsappSupport: boolean;
  enableEmailNotifications: boolean;
  maintenanceMode: boolean;
}

export interface ServiceArea {
  id: string;
  name: string;
  zone: 'South Goa' | 'North Goa';
  isActive: boolean;
  deliveryCharge: number;
  sortOrder: number;
}

export interface AuditLog {
  id: string;
  actorUserId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ContentPageData {
  slug: string;
  title: string;
  content: string | Record<string, unknown>;
  updatedAt?: string;
}

export interface GuestBookingSubmission {
  vehicleId: string;
  pickupDatetime: string;
  returnDatetime: string;
  pickupLocation: string;
  dropoffLocation: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string;
  customerEmail: string;
  hotelOrDeliveryAddress?: string;
  specialRequests?: string;
  idProofType: IdProofType;
  directLinkToken?: string;
  documents: {
    drivingLicenceFront: { name: string; type: string; size: number; base64: string };
    drivingLicenceBack?: { name: string; type: string; size: number; base64: string };
    idProofFront: { name: string; type: string; size: number; base64: string };
    idProofBack?: { name: string; type: string; size: number; base64: string };
  };
  consentAccepted: boolean;
  termsAccepted: boolean;
}

// -------------------------------------------------------------
// INVOICE SYSTEM TYPES (GoaMate Production Grade)
// -------------------------------------------------------------
export type InvoicePaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'refunded' | 'cancelled';
export type InvoicePaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Online Payment' | 'Other';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded';

export interface InvoiceItem {
  id: string;
  description: string;
  quantityOrDays: string;
  rate: number;
  amount: number;
}

export interface InvoiceCustomerDetails {
  name: string;
  address?: string;
  phone: string;
  email: string;
  whatsapp?: string;
  drivingLicenceNumber?: string;
}

export interface InvoiceVehicleDetails {
  type: string; // e.g. "Car / Sedan", "Scooter / Bike"
  name: string;
  brand: string;
  model: string;
  registrationNumber?: string;
  vendorName?: string;
}

export interface InvoiceRentalDetails {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDatetime: string;
  returnDatetime: string;
  totalDurationDays: number;
  dailyRate: number;
}

export interface InvoiceDocumentAppendixItem {
  id: string;
  docType: 'driving_licence_front' | 'driving_licence_back' | 'id_proof_front' | 'id_proof_back';
  title: string;
  idProofType?: string;
  previewUrl?: string;
  storagePath?: string;
  fileName?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. GM-INV-2026-000125
  bookingId: string;
  bookingReference: string;
  vendorId: string;
  customerId?: string;
  vehicleId?: string;
  invoiceYear: number;
  invoiceDate: string; // ISO date
  
  // Financial breakdown
  subtotalAmount: number;
  discountAmount: number;
  extraCharges: number;
  taxRatePercent: number;
  taxAmount: number;
  securityDeposit: number; // Refundable deposit kept distinct from rental revenue
  totalAmount: number;
  amountPaid: number;
  amountDue: number;

  paymentStatus: InvoicePaymentStatus;
  paymentMethod: InvoicePaymentMethod;
  invoiceStatus: InvoiceStatus;

  items: InvoiceItem[];
  customerDetails: InvoiceCustomerDetails;
  vehicleDetails: InvoiceVehicleDetails;
  rentalDetails: InvoiceRentalDetails;
  documents?: InvoiceDocumentAppendixItem[]; // For internal copy only

  customerPdfPath?: string;
  internalPdfPath?: string;
  notes?: string;
  issuedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
