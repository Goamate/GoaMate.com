export type VehicleCategory = 'car' | 'bike' | 'scooter';
export type VehicleStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived';
export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived';
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
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  serviceLocation: string;
  status: VendorStatus;
  rejectionReason?: string;
  notes?: string;
  vehicleCount?: number;
  createdAt: string;
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
