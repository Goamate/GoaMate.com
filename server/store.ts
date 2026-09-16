import crypto from 'crypto';
import {
  Vehicle,
  Vendor,
  Booking,
  BookingDocument,
  BookingFormLink,
  SiteSettings,
  ServiceArea,
  AuditLog,
  BookingPriceBreakdown,
  BookingStatus,
  VendorStatus,
  VehicleStatus,
  Invoice,
} from '../src/types';
import { INITIAL_SERVICE_AREAS } from '../src/lib/constants';

// Initial default settings
export const siteSettings: SiteSettings = {
  acceptNewBookings: true,
  allowVendorRegistration: true,
  allowVendorVehicleUploads: true,
  allowVendorDirectLinks: true,
  showCars: true,
  showBikes: true,
  showScooters: true,
  showWhatsappSupport: true,
  enableEmailNotifications: false,
  maintenanceMode: false,
};

// Default Margao Hub Vendor
export const vendors: Vendor[] = [
  {
    id: 'platform-default',
    userId: 'user-system',
    businessName: 'GoaMate Internal Fleet',
    ownerName: 'System Admin',
    phone: '+91 9999999999',
    whatsapp: '+91 9999999999',
    email: 'system@goamate.com',
    serviceLocation: 'Goa',
    status: 'approved',
    notes: 'Internal system vendor for seed data',
    vehicleCount: 6,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  }
];

// Curated verified initial vehicles for Goa with real high-resolution imagery
export const vehicles: Vehicle[] = [
  {
    id: 'v-activa-6g',
    vendorId: 'platform-default',
    vendorBusinessName: 'GoaMate Internal Fleet',
    name: 'Honda Activa 6G',
    category: 'scooter',
    brand: 'Honda',
    model: 'Activa 6G H-Smart',
    year: 2024,
    registrationNumber: 'GA-08-N-4412',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 2,
    engineCapacityCc: 110,
    dailyPrice: 450,
    securityDeposit: 1000,
    location: 'Margao, Goa',
    pickupOptions: ['Free Pickup at Margao Hub', 'Madgaon Railway Station (+₹100)', 'Colva Delivery (+₹150)'],
    description: 'The definitive Goa explorer scooter. Smooth, high-fuel-economy 110cc engine with telescopic suspension, tubeless tyres, and electric start. Perfect for cruising South Goa beaches, market errands, and coastal roads.',
    features: ['2 ISI Helmets Included', 'Tubeless Tyres', 'Front Luggage Hook', 'Mobile Holder with USB Port', 'Underseat Storage'],
    fuelPolicy: 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'approved',
    images: [
      {
        id: 'img-activa-1',
        vehicleId: 'v-activa-6g',
        storagePath: '/vehicles/activa-6g.jpg',
        publicUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
        isCover: true,
        sortOrder: 1,
      },
    ],
    coverImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-vespa-125',
    vendorId: 'platform-default',
    vendorBusinessName: 'GoaMate Internal Fleet',
    name: 'Vespa VXL 125',
    category: 'scooter',
    brand: 'Vespa',
    model: 'VXL 125 Classic',
    year: 2024,
    registrationNumber: 'GA-08-Q-7821',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 2,
    engineCapacityCc: 125,
    dailyPrice: 650,
    securityDeposit: 1500,
    location: 'Margao, Goa',
    pickupOptions: ['Free Pickup at Margao Hub', 'Madgaon Railway Station (+₹100)', 'Benaulim Delivery (+₹200)'],
    description: 'Iconic retro Italian styling with punchy 125cc electronic fuel injection. Premium disc brake with CBS for confident stopping along Goa’s scenic coastal highways.',
    features: ['Premium Retro Finish', 'Front Disc Brake', '2 Helmets Provided', 'Underseat USB Charger', 'Digital-Analog Cluster'],
    fuelPolicy: 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'approved',
    images: [
      {
        id: 'img-vespa-1',
        vehicleId: 'v-vespa-125',
        storagePath: '/vehicles/vespa.jpg',
        publicUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
        isCover: true,
        sortOrder: 1,
      },
    ],
    coverImage: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-classic-350',
    vendorId: 'platform-default',
    vendorBusinessName: 'GoaMate Internal Fleet',
    name: 'Royal Enfield Classic 350',
    category: 'bike',
    brand: 'Royal Enfield',
    model: 'Classic 350 Reborn',
    year: 2023,
    registrationNumber: 'GA-08-M-1988',
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 2,
    engineCapacityCc: 349,
    dailyPrice: 1100,
    securityDeposit: 2500,
    location: 'Margao, Goa',
    pickupOptions: ['Free Pickup at Margao Hub', 'Madgaon Railway Station (+₹150)', 'Airport Delivery (+₹600)'],
    description: 'The quintessential touring motorcycle for Goa. Smooth J-series counterbalanced engine, dual-channel ABS, comfortable touring seat, and that signature thump as you ride down South Goa coconut tree avenues.',
    features: ['Dual-Channel ABS', 'Crash Guard Installed', 'Pillion Backrest', 'Mobile Phone Mount', '2 Full Face ISI Helmets'],
    fuelPolicy: 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'approved',
    images: [
      {
        id: 'img-re-1',
        vehicleId: 'v-classic-350',
        storagePath: '/vehicles/classic-350.jpg',
        publicUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80',
        isCover: true,
        sortOrder: 1,
      },
    ],
    coverImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-himalayan-411',
    vendorId: 'platform-default',
    vendorBusinessName: 'GoaMate Internal Fleet',
    name: 'Royal Enfield Himalayan',
    category: 'bike',
    brand: 'Royal Enfield',
    model: 'Himalayan Adventure',
    year: 2023,
    registrationNumber: 'GA-08-P-9022',
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 2,
    engineCapacityCc: 411,
    dailyPrice: 1400,
    securityDeposit: 3000,
    location: 'Margao, Goa',
    pickupOptions: ['Free Pickup at Margao Hub', 'Madgaon Station (+₹150)', 'Airport Drop (+₹600)'],
    description: 'Rugged dual-sport adventure tourer with long travel suspension, high ground clearance, and switchable ABS. Built to conquer both smooth ghat routes and hidden rocky beach trails.',
    features: ['Switchable ABS', 'High Windscreen', 'Heavy Duty Luggage Rack', 'Sump Guard', 'All-Terrain Tyres'],
    fuelPolicy: 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'approved',
    images: [
      {
        id: 'img-him-1',
        vehicleId: 'v-himalayan-411',
        storagePath: '/vehicles/himalayan.jpg',
        publicUrl: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
        isCover: true,
        sortOrder: 1,
      },
    ],
    coverImage: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-swift-dzire',
    vendorId: 'platform-default',
    vendorBusinessName: 'GoaMate Internal Fleet',
    name: 'Maruti Suzuki Dzire (Automatic)',
    category: 'car',
    brand: 'Maruti Suzuki',
    model: 'Dzire VXi AGS',
    year: 2024,
    registrationNumber: 'GA-08-T-3120',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    dailyPrice: 1800,
    securityDeposit: 3000,
    location: 'Margao, Goa',
    pickupOptions: ['Free Pickup at Margao Hub', 'Madgaon Railway Station (+₹150)', 'Dabolim Airport (+₹600)', 'Mopa Airport (+₹1400)'],
    description: 'High comfort 5-seater sedan with effortless automatic transmission and excellent fuel efficiency. Equipped with chilled air conditioning, Bluetooth touchscreen, and ample boot space for luggage.',
    features: ['Chilled Air Conditioning', 'Touchscreen Infotainment', 'Bluetooth & USB', 'Power Windows', 'Reverse Parking Sensors', '378L Boot Space'],
    fuelPolicy: 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'approved',
    images: [
      {
        id: 'img-dzire-1',
        vehicleId: 'v-swift-dzire',
        storagePath: '/vehicles/dzire.jpg',
        publicUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
        isCover: true,
        sortOrder: 1,
      },
    ],
    coverImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-thar-4x4',
    vendorId: 'platform-default',
    vendorBusinessName: 'GoaMate Internal Fleet',
    name: 'Mahindra Thar 4x4 (Hard Top)',
    category: 'car',
    brand: 'Mahindra',
    model: 'Thar LX 4WD AT',
    year: 2023,
    registrationNumber: 'GA-08-Z-6719',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 4,
    dailyPrice: 3800,
    securityDeposit: 5000,
    location: 'Margao, Goa',
    pickupOptions: ['Free Pickup at Margao Hub', 'Madgaon Railway Station (+₹200)', 'Dabolim Airport (+₹600)', 'Mopa Airport (+₹1400)'],
    description: 'The ultimate Goa lifestyle SUV. Powerful 4WD turbo diesel with automatic transmission, commanding road presence, rugged all-terrain capability, and high quality sound system for memorable road trips.',
    features: ['4x4 All-Wheel Drive', 'Automatic Transmission', 'Apple CarPlay & Android Auto', 'Chilled Climate Control', 'Roll Cage & Dual Airbags', 'High Ground Clearance'],
    fuelPolicy: 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'approved',
    images: [
      {
        id: 'img-thar-1',
        vehicleId: 'v-thar-4x4',
        storagePath: '/vehicles/thar.jpg',
        publicUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
        isCover: true,
        sortOrder: 1,
      },
    ],
    coverImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v-ertiga-7seater',
    vendorId: 'platform-default',
    vendorBusinessName: 'GoaMate Internal Fleet',
    name: 'Maruti Suzuki Ertiga (7 Seater)',
    category: 'car',
    brand: 'Maruti Suzuki',
    model: 'Ertiga ZXi Smart Hybrid',
    year: 2024,
    registrationNumber: 'GA-08-V-8812',
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 7,
    dailyPrice: 2600,
    securityDeposit: 4000,
    location: 'Margao, Goa',
    pickupOptions: ['Free Pickup at Margao Hub', 'Madgaon Railway Station (+₹150)', 'Airport Delivery (+₹600)'],
    description: 'Spacious 7-seater MPV ideal for family vacations and groups traveling across Goa. Generous legroom across all three rows with rear AC vents and fold-flat third row for heavy luggage.',
    features: ['7 Comfortable Adult Seats', 'Roof-Mounted Rear AC Vents', 'Touchscreen Display', 'Smart Hybrid Efficiency', 'Foldable Seats for Huge Boot Space'],
    fuelPolicy: 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'approved',
    images: [
      {
        id: 'img-ertiga-1',
        vehicleId: 'v-ertiga-7seater',
        storagePath: '/vehicles/ertiga.jpg',
        publicUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80',
        isCover: true,
        sortOrder: 1,
      },
    ],
    coverImage: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  },
];

// In-memory collections with persistent storage semantics
export const bookings: Booking[] = [];
export const bookingDocuments: BookingDocument[] = [];
export const bookingFormLinks: BookingFormLink[] = [];
export const serviceAreas: ServiceArea[] = [...INITIAL_SERVICE_AREAS];
export const auditLogs: AuditLog[] = [];
export const invoices: Invoice[] = [];

// Helper to log audit events
export function recordAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>) {
  const entry: AuditLog = {
    ...log,
    id: `audit-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 500) {
    auditLogs.pop();
  }
}

// Generate unique booking reference number
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `GM-${year}-${randomPart}`;
}

// Generate sequential, unique invoice number: GM-INV-YYYY-XXXXXX
export function generateInvoiceNumber(year?: number): string {
  const invYear = year || new Date().getFullYear();
  const prefix = `GM-INV-${invYear}-`;
  
  // Find highest current sequence number for this year
  let maxSeq = 0;
  for (const inv of invoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)) {
      const seqStr = inv.invoiceNumber.replace(prefix, '');
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }
  
  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(6, '0')}`;
}

// SHA-256 hash helper
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
