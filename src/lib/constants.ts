export const BRAND = {
  name: 'GoaMate',
  tagline: 'Car & Bike Rental Service in Goa',
  phone: '+91 9403784132',
  phoneRaw: '+919403784132',
  whatsapp: '+91 9403784132',
  whatsappRaw: '919403784132',
  email: 'goamate.com@gmail.com',
  primaryLocation: 'Margao, Goa',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  whatsappBaseUrl: 'https://wa.me/919403784132',
};

export const getWhatsAppLink = (message: string) => {
  return `${BRAND.whatsappBaseUrl}?text=${encodeURIComponent(message)}`;
};

export const getVehicleWhatsAppLink = (vehicleName: string, pickupDate?: string, returnDate?: string) => {
  let msg = `Hello GoaMate, I would like to enquire about ${vehicleName}`;
  if (pickupDate && returnDate) {
    msg += ` from ${pickupDate} to ${returnDate}`;
  }
  msg += `. Please let me know availability.`;
  return getWhatsAppLink(msg);
};

export const getBookingSuccessWhatsAppLink = (refNumber: string, vehicleName: string) => {
  const msg = `Hello GoaMate, I have submitted a booking request for ${vehicleName} (Ref: ${refNumber}). Please verify my details and confirm availability.`;
  return getWhatsAppLink(msg);
};

export const DEFAULT_LOCATIONS = [
  'Margao Hub (Near Madgaon Railway Station)',
  'Madgaon Railway Station (Platform 1 / East Exit)',
  'Colva Beach Circle',
  'Benaulim Main Road',
  'Dabolim International Airport (GOI)',
  'Vasco da Gama',
  'Panaji KTC Bus Stand',
  'Manohar International Airport, Mopa (GOX)',
  'Candolim Beach Road',
  'Calangute Circle',
];

export const INITIAL_SERVICE_AREAS = [
  { id: 'area-1', name: 'Margao (City Hub & Office)', zone: 'South Goa' as const, isActive: true, deliveryCharge: 0, sortOrder: 1 },
  { id: 'area-2', name: 'Madgaon Railway Station (MAO)', zone: 'South Goa' as const, isActive: true, deliveryCharge: 150, sortOrder: 2 },
  { id: 'area-3', name: 'Colva Beach & Circle', zone: 'South Goa' as const, isActive: true, deliveryCharge: 200, sortOrder: 3 },
  { id: 'area-4', name: 'Benaulim & Varca', zone: 'South Goa' as const, isActive: true, deliveryCharge: 250, sortOrder: 4 },
  { id: 'area-5', name: 'Dabolim International Airport (GOI)', zone: 'South Goa' as const, isActive: true, deliveryCharge: 600, sortOrder: 5 },
  { id: 'area-6', name: 'Vasco da Gama', zone: 'South Goa' as const, isActive: true, deliveryCharge: 500, sortOrder: 6 },
  { id: 'area-7', name: 'Panaji (City Center)', zone: 'North Goa' as const, isActive: true, deliveryCharge: 700, sortOrder: 7 },
  { id: 'area-8', name: 'Manohar International Airport, Mopa (GOX)', zone: 'North Goa' as const, isActive: true, deliveryCharge: 1400, sortOrder: 8 },
  { id: 'area-9', name: 'Candolim & Calangute Hub', zone: 'North Goa' as const, isActive: true, deliveryCharge: 900, sortOrder: 9 },
];

export const DEFAULT_RENTAL_RULES = {
  durationRule: 'Each started 24-hour period from pickup time is billed as one rental day.',
  maxFileUploadBytes: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
};
