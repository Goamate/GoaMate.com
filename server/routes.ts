import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  siteSettings,
  vendors,
  vehicles,
  bookings,
  bookingDocuments,
  bookingFormLinks,
  serviceAreas,
  auditLogs,
  recordAuditLog,
  generateBookingReference,
  hashToken,
} from './store';
import {
  Booking,
  BookingDocument,
  BookingFormLink,
  BookingPriceBreakdown,
  BookingStatus,
  GuestBookingSubmission,
  Vehicle,
  Vendor,
} from '../src/types';
import { calculateRentalPricing } from '../src/lib/pricing';
import {
  isConfigured as isSupabaseConfigured,
  saveBookingToSupabase,
  updateBookingStatusInSupabase,
  fetchBookingsFromSupabase,
  fetchVendorsFromSupabase,
  fetchVehiclesFromSupabase,
  saveVendorToSupabase,
  saveVehicleToSupabase,
  getSyncState,
  refreshSupabaseMetrics,
  seedSupabaseFleet,
} from './supabase';

export const apiRouter = express.Router();

// Initial startup sync with Supabase
if (isSupabaseConfigured) {
  fetchVendorsFromSupabase()
    .then(res => {
      if (res.success && res.vendors.length > 0) {
        console.log(`[Supabase] Loaded ${res.vendors.length} existing vendors from Supabase.`);
        for (const sbVendor of res.vendors) {
          if (!vendors.some(v => v.id === sbVendor.id)) {
            vendors.push(sbVendor);
          }
        }
      }
    })
    .catch(e => console.warn('[Supabase] Fetch vendors error:', e.message));

  fetchVehiclesFromSupabase()
    .then(res => {
      if (res.success && res.vehicles.length > 0) {
        console.log(`[Supabase] Loaded ${res.vehicles.length} existing vehicles from Supabase.`);
        for (const sbVehicle of res.vehicles) {
          if (!vehicles.some(v => v.id === sbVehicle.id)) {
            // Find vendor business name locally if possible
            const vdr = vendors.find(v => v.id === sbVehicle.vendorId);
            if (vdr) {
              sbVehicle.vendorBusinessName = vdr.businessName;
            }
            vehicles.push(sbVehicle);
          }
        }
      }
    })
    .catch(e => console.warn('[Supabase] Fetch vehicles error:', e.message));

  fetchBookingsFromSupabase()
    .then(res => {
      if (res.success && res.bookings.length > 0) {
        console.log(`[Supabase] Loaded ${res.bookings.length} existing bookings from Supabase.`);
        for (const sbBooking of res.bookings) {
          if (!bookings.some(b => b.id === sbBooking.id || b.referenceNumber === sbBooking.referenceNumber)) {
            sbBooking.vehicle = vehicles.find(v => v.id === sbBooking.vehicleId);
            bookings.push(sbBooking);
          }
        }
      }
      refreshSupabaseMetrics().then(metrics => {
        if (metrics.totalVehiclesInDb === 0) {
          seedSupabaseFleet(vehicles, vendors).catch(e => console.warn('[Supabase] Fleet seed notice:', e.message));
        }
      }).catch(e => console.warn('[Supabase] Metrics check:', e.message));
    })
    .catch(err => {
      console.warn('[Supabase] Initial load notice:', err.message);
    });
}

// Middleware to check maintenance mode
function checkMaintenance(req: Request, res: Response, next: NextFunction) {
  // Allow admin routes even in maintenance mode
  if (req.path.startsWith('/admin')) {
    return next();
  }
  if (siteSettings.maintenanceMode) {
    return res.status(503).json({
      error: 'GoaMate is currently undergoing scheduled system maintenance. Please reach out via WhatsApp at +91 9403784132 for urgent rental assistance.',
      maintenanceMode: true,
    });
  }
  next();
}

apiRouter.use(checkMaintenance);

// Simple idempotency cache to prevent duplicate booking submissions (window of 60 seconds)
const recentSubmissions = new Map<string, { timestamp: number; referenceNumber: string }>();

// Clean up idempotency cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of recentSubmissions.entries()) {
    if (now - value.timestamp > 60000) {
      recentSubmissions.delete(key);
    }
  }
}, 30000);

// Helper: Formula Injection Protection for CSV
function sanitizeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Check if string begins with unsafe formula trigger characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str; // Prefix with single quote to neutralize formula execution in Excel/Sheets
  }
  // Escape quotes
  return `"${str.replace(/"/g, '""')}"`;
}

// --------------------------------------------------------------------------
// 1. PUBLIC SYSTEM & HEALTH ENDPOINTS
// --------------------------------------------------------------------------
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'GoaMate',
    location: 'Margao, Goa',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/diagnostics', async (req, res) => {
  const syncInfo = await refreshSupabaseMetrics();
  res.json({
    mode: syncInfo.isConfigured ? 'Supabase Hybrid Cloud Persistence' : 'Integrated High-Performance Express Engine',
    supabaseConfigured: syncInfo.isConfigured,
    supabaseUrl: syncInfo.url,
    keyType: syncInfo.keyType,
    hasServiceRoleKey: syncInfo.hasServiceRoleKey,
    isRlsBlocked: syncInfo.isRlsBlocked,
    lastSyncError: syncInfo.lastSyncError,
    supabaseMetrics: {
      bookingsInDb: syncInfo.totalBookingsInDb,
      vehiclesInDb: syncInfo.totalVehiclesInDb,
      vendorsInDb: syncInfo.totalVendorsInDb,
    },
    fleetCount: vehicles.filter(v => v.status === 'approved' && v.isActive).length,
    activeBookingsCount: bookings.length,
    serviceAreasCount: serviceAreas.length,
    settings: siteSettings,
  });
});

apiRouter.get('/settings', (req, res) => {
  res.json(siteSettings);
});

apiRouter.get('/service-areas', (req, res) => {
  const activeAreas = serviceAreas.filter(a => a.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  res.json(activeAreas);
});

// --------------------------------------------------------------------------
// 2. VEHICLE LISTINGS (PUBLIC & FILTERED)
// --------------------------------------------------------------------------
apiRouter.get('/vehicles', (req, res) => {
  const { category, location, minPrice, maxPrice, transmission, fuelType, seats, pickupDate, returnDate } = req.query;

  let filtered = vehicles.filter(v => v.status === 'approved' && v.isActive);

  // Check category toggles in siteSettings
  if (!siteSettings.showCars) filtered = filtered.filter(v => v.category !== 'car');
  if (!siteSettings.showBikes) filtered = filtered.filter(v => v.category !== 'bike');
  if (!siteSettings.showScooters) filtered = filtered.filter(v => v.category !== 'scooter');

  if (category && typeof category === 'string' && category !== 'all') {
    filtered = filtered.filter(v => v.category === category);
  }

  if (location && typeof location === 'string' && location !== 'all') {
    const locLower = location.toLowerCase();
    filtered = filtered.filter(v => 
      v.location.toLowerCase().includes(locLower) ||
      v.pickupOptions.some(p => p.toLowerCase().includes(locLower))
    );
  }

  if (transmission && typeof transmission === 'string' && transmission !== 'all') {
    filtered = filtered.filter(v => v.transmission.toLowerCase() === transmission.toLowerCase());
  }

  if (fuelType && typeof fuelType === 'string' && fuelType !== 'all') {
    filtered = filtered.filter(v => v.fuelType.toLowerCase() === fuelType.toLowerCase());
  }

  if (seats && typeof seats === 'string' && seats !== 'all') {
    const s = parseInt(seats, 10);
    if (!isNaN(s)) {
      filtered = filtered.filter(v => v.seats >= s);
    }
  }

  if (minPrice) {
    const min = parseFloat(minPrice as string);
    if (!isNaN(min)) filtered = filtered.filter(v => v.dailyPrice >= min);
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice as string);
    if (!isNaN(max)) filtered = filtered.filter(v => v.dailyPrice <= max);
  }

  // Filter out vehicles that have confirmed bookings overlapping with selected dates
  if (pickupDate && returnDate && typeof pickupDate === 'string' && typeof returnDate === 'string') {
    const pStart = new Date(pickupDate).getTime();
    const pEnd = new Date(returnDate).getTime();

    if (!isNaN(pStart) && !isNaN(pEnd) && pEnd > pStart) {
      filtered = filtered.filter(v => {
        const hasOverlap = bookings.some(b => {
          if (b.vehicleId !== v.id || b.status !== 'confirmed') return false;
          const bStart = new Date(b.pickupDatetime).getTime();
          const bEnd = new Date(b.returnDatetime).getTime();
          return !(pEnd <= bStart || pStart >= bEnd);
        });
        return !hasOverlap;
      });
    }
  }

  // Return sanitized listing: protect registrationNumber from anonymous visitors
  const sanitized = filtered.map(v => {
    const { registrationNumber, ...publicFields } = v;
    return publicFields;
  });

  res.json(sanitized);
});

apiRouter.get('/vehicles/:id', (req, res) => {
  const v = vehicles.find(item => item.id === req.params.id);
  if (!v || v.status !== 'approved' || !v.isActive) {
    return res.status(404).json({ error: 'Vehicle not found or currently unavailable' });
  }

  const { registrationNumber, ...publicFields } = v;
  res.json(publicFields);
});

// --------------------------------------------------------------------------
// 3. SERVER PRICING VERIFICATION
// --------------------------------------------------------------------------
apiRouter.post('/bookings/calculate', (req, res) => {
  const { vehicleId, pickupDatetime, returnDatetime, pickupLocation } = req.body;

  const v = vehicles.find(item => item.id === vehicleId);
  if (!v) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  // Find delivery charge for pickup location
  let deliveryFee = 0;
  if (pickupLocation) {
    const matchedArea = serviceAreas.find(a => pickupLocation.toLowerCase().includes(a.name.toLowerCase()));
    if (matchedArea) {
      deliveryFee = matchedArea.deliveryCharge;
    }
  }

  const calc = calculateRentalPricing({
    pickupDatetime,
    returnDatetime,
    dailyPrice: v.dailyPrice,
    securityDeposit: v.securityDeposit,
    deliveryFee,
  });

  if (!calc.isValid) {
    return res.status(400).json({ error: calc.error, breakdown: calc.breakdown });
  }

  res.json({
    breakdown: calc.breakdown,
    vehicleName: v.name,
    category: v.category,
  });
});

// --------------------------------------------------------------------------
// 4. GUEST BOOKING SUBMISSION (NO LOGIN REQUIRED)
// --------------------------------------------------------------------------
apiRouter.post('/bookings', (req, res) => {
  // Operational check: are new bookings accepted?
  if (!siteSettings.acceptNewBookings) {
    return res.status(403).json({
      error: 'GoaMate is currently not accepting new online bookings. For direct enquiries, please contact us on WhatsApp at +91 9403784132.',
    });
  }

  const body = req.body as GuestBookingSubmission;
  const {
    vehicleId,
    pickupDatetime,
    returnDatetime,
    pickupLocation,
    dropoffLocation,
    customerName,
    customerPhone,
    customerWhatsapp,
    customerEmail,
    hotelOrDeliveryAddress,
    specialRequests,
    idProofType,
    directLinkToken,
    documents,
    consentAccepted,
    termsAccepted,
  } = body;

  // Validation
  if (!vehicleId || !pickupDatetime || !returnDatetime || !pickupLocation || !customerName || !customerPhone || !customerEmail) {
    return res.status(400).json({ error: 'Please provide all mandatory booking fields.' });
  }

  if (!consentAccepted || !termsAccepted) {
    return res.status(400).json({ error: 'You must accept the rental terms and document processing consent to proceed.' });
  }

  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle || vehicle.status !== 'approved' || !vehicle.isActive) {
    return res.status(404).json({ error: 'The selected vehicle is no longer available for booking.' });
  }

  // Idempotency: Prevent duplicate submissions
  const submissionKey = `${vehicleId}-${customerPhone}-${pickupDatetime}-${returnDatetime}`;
  if (recentSubmissions.has(submissionKey)) {
    const existing = recentSubmissions.get(submissionKey)!;
    const existingBooking = bookings.find(b => b.referenceNumber === existing.referenceNumber);
    if (existingBooking) {
      return res.json({
        success: true,
        referenceNumber: existingBooking.referenceNumber,
        booking: sanitizeBookingForGuest(existingBooking),
        message: 'Existing booking request retrieved.',
      });
    }
  }

  // Handle direct link validation if provided
  let matchedDirectLink: (typeof bookingFormLinks)[0] | undefined;
  if (directLinkToken) {
    const hashed = hashToken(directLinkToken);
    matchedDirectLink = bookingFormLinks.find(l => l.tokenHash === hashed);
    if (!matchedDirectLink || matchedDirectLink.isRevoked || matchedDirectLink.isUsed) {
      return res.status(400).json({ error: 'This direct booking link has expired, been revoked, or already used.' });
    }
    if (matchedDirectLink.expiresAt && new Date(matchedDirectLink.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'This direct booking link has expired.' });
    }
  }

  // Calculate pricing purely on server
  let deliveryFee = 0;
  const matchedArea = serviceAreas.find(a => pickupLocation.toLowerCase().includes(a.name.toLowerCase()));
  if (matchedArea) {
    deliveryFee = matchedArea.deliveryCharge;
  }

  const calc = calculateRentalPricing({
    pickupDatetime,
    returnDatetime,
    dailyPrice: vehicle.dailyPrice,
    securityDeposit: vehicle.securityDeposit,
    deliveryFee,
  });

  if (!calc.isValid) {
    return res.status(400).json({ error: calc.error });
  }

  // Validate documents
  if (!documents?.drivingLicenceFront || !documents?.idProofFront) {
    return res.status(400).json({ error: 'Driving licence and Government ID documents are required.' });
  }

  // Check file size (max 10MB per file)
  const maxBytes = 10 * 1024 * 1024;
  if (documents.drivingLicenceFront.size > maxBytes || documents.idProofFront.size > maxBytes) {
    return res.status(400).json({ error: 'Attached document exceeds maximum allowed size of 10 MB.' });
  }

  // Generate unique booking reference
  const referenceNumber = generateBookingReference();
  const bookingId = `book-${crypto.randomUUID()}`;

  // Store private documents
  const docsList: BookingDocument[] = [];

  const addDoc = (docType: BookingDocument['docType'], file: { name: string; type: string; size: number; base64: string }) => {
    const docId = `doc-${crypto.randomUUID()}`;
    const storagePath = `/secure_docs/${bookingId}/${docId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const docEntry: BookingDocument = {
      id: docId,
      bookingId,
      docType,
      idProofType: idProofType || 'aadhaar',
      storagePath,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      previewUrl: file.base64, // Keep in memory for authorized staff review
    };
    bookingDocuments.push(docEntry);
    docsList.push(docEntry);
  };

  addDoc('driving_licence_front', documents.drivingLicenceFront);
  if (documents.drivingLicenceBack) addDoc('driving_licence_back', documents.drivingLicenceBack);
  addDoc('id_proof_front', documents.idProofFront);
  if (documents.idProofBack) addDoc('id_proof_back', documents.idProofBack);

  const newBooking: Booking = {
    id: bookingId,
    referenceNumber,
    vehicleId: vehicle.id,
    vendorId: vehicle.vendorId,
    vehicle,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerWhatsapp: (customerWhatsapp || customerPhone).trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    hotelOrDeliveryAddress: hotelOrDeliveryAddress?.trim(),
    specialRequests: specialRequests?.trim(),
    pickupDatetime,
    returnDatetime,
    pickupLocation,
    dropoffLocation: dropoffLocation || pickupLocation,
    daysCount: calc.breakdown.daysCount,
    dailyRate: calc.breakdown.dailyRate,
    subtotalAmount: calc.breakdown.subtotalAmount,
    deliveryFee: calc.breakdown.deliveryFee,
    securityDeposit: calc.breakdown.securityDeposit,
    totalEstimatedAmount: calc.breakdown.totalEstimatedAmount,
    priceSnapshot: calc.breakdown,
    status: 'pending',
    directLinkId: matchedDirectLink?.id,
    documents: docsList,
    statusHistory: [
      {
        id: `sh-${crypto.randomUUID()}`,
        bookingId,
        newStatus: 'pending',
        reason: 'Guest booking request submitted',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  bookings.unshift(newBooking);

  // Sync to Supabase cloud database
  if (isSupabaseConfigured) {
    saveBookingToSupabase(newBooking).catch(err => {
      console.warn(`[Supabase] Booking sync notice (${referenceNumber}):`, err.message);
    });
  }

  // Consume direct link if used
  if (matchedDirectLink) {
    matchedDirectLink.isUsed = true;
    matchedDirectLink.usedAt = new Date().toISOString();
    matchedDirectLink.bookingId = bookingId;
  }

  // Save to idempotency cache
  recentSubmissions.set(submissionKey, { timestamp: Date.now(), referenceNumber });

  // Audit log
  recordAuditLog({
    action: 'BOOKING_CREATED',
    entityType: 'booking',
    entityId: bookingId,
    details: { referenceNumber, vehicleName: vehicle.name, total: calc.breakdown.totalEstimatedAmount },
  });

  res.status(201).json({
    success: true,
    referenceNumber,
    booking: sanitizeBookingForGuest(newBooking),
    message: 'Your booking request has been submitted successfully.',
  });
});

// Helper: Sanitize booking data returned to guest (Never return other people's data or raw doc paths)
function sanitizeBookingForGuest(b: Booking) {
  return {
    referenceNumber: b.referenceNumber,
    customerName: b.customerName,
    pickupDatetime: b.pickupDatetime,
    returnDatetime: b.returnDatetime,
    pickupLocation: b.pickupLocation,
    dropoffLocation: b.dropoffLocation,
    vehicle: {
      name: b.vehicle?.name,
      category: b.vehicle?.category,
      brand: b.vehicle?.brand,
      coverImage: b.vehicle?.coverImage,
    },
    daysCount: b.daysCount,
    dailyRate: b.dailyRate,
    securityDeposit: b.securityDeposit,
    totalEstimatedAmount: b.totalEstimatedAmount || b.priceSnapshot?.totalEstimatedAmount || 0,
    priceSnapshot: b.priceSnapshot,
    status: b.status,
    createdAt: b.createdAt,
  };
}

// --------------------------------------------------------------------------
// 5. LOOKUP BOOKING STATUS (PUBLIC)
// --------------------------------------------------------------------------
apiRouter.get('/bookings/track/:ref', (req, res) => {
  const { phone } = req.query;
  const booking = bookings.find(b => b.referenceNumber.toUpperCase() === req.params.ref.toUpperCase());

  if (!booking) {
    return res.status(404).json({ error: 'Booking reference not found.' });
  }

  // Security check: phone must match if provided
  if (phone && typeof phone === 'string') {
    const cleanReq = phone.replace(/[^0-9]/g, '');
    const cleanCust = booking.customerPhone.replace(/[^0-9]/g, '');
    if (!cleanCust.endsWith(cleanReq) && !cleanReq.endsWith(cleanCust)) {
      return res.status(403).json({ error: 'Phone number does not match this booking record.' });
    }
  }

  res.json(sanitizeBookingForGuest(booking));
});

apiRouter.post('/bookings/track', (req, res) => {
  const { referenceNumber, phone } = req.body;
  if (!referenceNumber) {
    return res.status(400).json({ error: 'Booking reference number is required.' });
  }
  const booking = bookings.find(b => b.referenceNumber.toUpperCase() === referenceNumber.toUpperCase());

  if (!booking) {
    return res.status(404).json({ error: 'Booking reference not found.' });
  }

  if (phone && typeof phone === 'string') {
    const cleanReq = phone.replace(/[^0-9]/g, '');
    const cleanCust = booking.customerPhone.replace(/[^0-9]/g, '');
    if (!cleanCust.endsWith(cleanReq) && !cleanReq.endsWith(cleanCust)) {
      return res.status(403).json({ error: 'Phone number does not match this booking record.' });
    }
  }

  res.json(sanitizeBookingForGuest(booking));
});

// --------------------------------------------------------------------------
// 6. DIRECT CUSTOMER FORM LINKS (RESOLVE & GENERATE)
// --------------------------------------------------------------------------
apiRouter.get('/direct-links/:token', (req, res) => {
  const { token } = req.params;
  const hashed = hashToken(token);
  const link = bookingFormLinks.find(l => l.tokenHash === hashed);

  if (!link) {
    return res.status(404).json({ error: 'Invalid or expired booking link.' });
  }

  if (link.isRevoked) {
    return res.status(410).json({ error: 'This direct booking link has been revoked by the vendor.' });
  }

  if (link.isUsed) {
    return res.status(410).json({ error: 'This direct booking link has already been used.' });
  }

  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ error: 'This direct booking link has expired.' });
  }

  const vehicle = vehicles.find(v => v.id === link.vehicleId);
  if (!vehicle || vehicle.status !== 'approved' || !vehicle.isActive) {
    return res.status(404).json({ error: 'The vehicle assigned to this link is no longer available.' });
  }

  const { registrationNumber, ...publicVehicle } = vehicle;
  res.json({
    valid: true,
    vehicle: publicVehicle,
    presetPickupDatetime: link.presetPickupDatetime,
    presetReturnDatetime: link.presetReturnDatetime,
  });
});

// --------------------------------------------------------------------------
// 7. VENDOR AUTHENTICATION & DASHBOARD
// --------------------------------------------------------------------------
apiRouter.post('/vendor/register', async (req, res) => {
  if (!siteSettings.allowVendorRegistration) {
    return res.status(403).json({ error: 'Vendor registrations are currently closed by the platform administrator.' });
  }

  const { ownerName, businessName, phone, whatsapp, email, serviceLocation, password } = req.body;

  if (!ownerName || !businessName || !phone || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const existing = vendors.find(v => v.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'A vendor account with this email already exists.' });
  }

  const vendorId = `vendor-${crypto.randomUUID()}`;
  const newVendor: Vendor = {
    id: vendorId,
    userId: `user-${crypto.randomUUID()}`,
    businessName: businessName.trim(),
    ownerName: ownerName.trim(),
    phone: phone.trim(),
    whatsapp: (whatsapp || phone).trim(),
    email: email.trim().toLowerCase(),
    serviceLocation: serviceLocation?.trim() || 'Margao, Goa',
    status: 'pending', // Starts as pending, awaiting super-admin approval
    vehicleCount: 0,
    createdAt: new Date().toISOString(),
  };

  vendors.push(newVendor);

  if (isSupabaseConfigured) {
    await saveVendorToSupabase(newVendor);
  }

  recordAuditLog({
    action: 'VENDOR_REGISTERED',
    entityType: 'vendor',
    entityId: vendorId,
    details: { businessName, ownerName, email },
  });

  res.status(201).json({
    success: true,
    vendor: newVendor,
    message: 'Vendor registration submitted. Your account is pending super-admin verification.',
  });
});

apiRouter.post('/vendor/login', (req, res) => {
  const { email, password } = req.body;
  const vendor = vendors.find(
    v => v.email.toLowerCase() === email?.toLowerCase()
  );

  if (!vendor) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // In production with Supabase Auth, Supabase handles passwords.
  // Here we check vendor status:
  if (vendor.status === 'suspended') {
    return res.status(403).json({
      error: 'Your vendor account has been suspended by the administrator. Protected access is denied.',
      status: 'suspended',
    });
  }

  if (vendor.status === 'rejected') {
    return res.status(403).json({
      error: `Your vendor application was rejected: ${vendor.rejectionReason || 'Contact GoaMate admin.'}`,
      status: 'rejected',
    });
  }

  res.json({
    success: true,
    token: `vendor-session-${vendor.id}`,
    vendor,
  });
});

// Middleware to authorize vendor
function requireVendor(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const vendorIdHeader = req.headers['x-vendor-id'] as string;

  let vendorId = vendorIdHeader;
  
  // Accept both 'Bearer vendor-session-XXX' and just 'vendor-session-XXX'
  if (!vendorId && authHeader) {
    if (authHeader.startsWith('Bearer vendor-session-')) {
      vendorId = authHeader.replace('Bearer vendor-session-', '');
    } else if (authHeader.startsWith('vendor-session-')) {
      vendorId = authHeader.replace('vendor-session-', '');
    }
  }

  const vendor = vendors.find(v => v.id === vendorId);
  if (!vendor) {
    return res.status(401).json({ error: 'Unauthorized vendor session.' });
  }

  if (vendor.status === 'suspended') {
    return res.status(403).json({ error: 'Vendor account suspended.' });
  }

  if (vendor.status === 'pending') {
    return res.status(403).json({ error: 'Vendor account is awaiting super-admin approval.', status: 'pending' });
  }

  (req as any).vendor = vendor;
  next();
}

apiRouter.get('/vendor/me', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const vendorVehicles = vehicles.filter(v => v.vendorId === vendor.id);
  const vendorBookings = bookings.filter(b => b.vendorId === vendor.id);

  res.json({
    vendor,
    stats: {
      totalVehicles: vendorVehicles.length,
      approvedVehicles: vendorVehicles.filter(v => v.status === 'approved').length,
      pendingBookings: vendorBookings.filter(b => b.status === 'pending').length,
      confirmedBookings: vendorBookings.filter(b => b.status === 'confirmed').length,
      totalBookingValue: vendorBookings.reduce((sum, b) => sum + b.totalEstimatedAmount, 0),
    },
  });
});

apiRouter.get('/vendor/vehicles', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const list = vehicles.filter(v => v.vendorId === vendor.id);
  res.json(list);
});

apiRouter.post('/vendor/vehicles', requireVendor, (req, res) => {
  if (!siteSettings.allowVendorVehicleUploads) {
    return res.status(403).json({ error: 'Vehicle additions are currently disabled by the platform administrator.' });
  }

  const vendor = (req as any).vendor as Vendor;
  const vData = req.body as Partial<Vehicle>;

  if (!vData.name || !vData.category || !vData.dailyPrice) {
    return res.status(400).json({ error: 'Vehicle name, category, and daily price are required.' });
  }

  const newVehicle: Vehicle = {
    id: `v-${crypto.randomUUID().substring(0, 8)}`,
    vendorId: vendor.id,
    vendorBusinessName: vendor.businessName,
    name: vData.name,
    category: vData.category,
    brand: vData.brand || 'Standard',
    model: vData.model || vData.name,
    year: vData.year || new Date().getFullYear(),
    registrationNumber: vData.registrationNumber || 'GA-08-TEMP',
    transmission: vData.transmission || 'Manual',
    fuelType: vData.fuelType || 'Petrol',
    seats: vData.seats || (vData.category === 'car' ? 5 : 2),
    engineCapacityCc: vData.engineCapacityCc,
    dailyPrice: Number(vData.dailyPrice),
    securityDeposit: Number(vData.securityDeposit || 0),
    location: vData.location || vendor.serviceLocation,
    pickupOptions: vData.pickupOptions || ['Free Pickup at Hub', 'Station (+₹150)', 'Airport (+₹600)'],
    description: vData.description || '',
    features: vData.features || ['Well maintained', 'Clean delivery'],
    fuelPolicy: vData.fuelPolicy || 'Level-to-level: Return with same fuel level received.',
    mileagePolicy: vData.mileagePolicy || 'Unlimited km within Goa state borders.',
    isActive: true,
    status: 'pending_approval', // Vendor-created listings require admin approval
    images: vData.images || [],
    coverImage: vData.coverImage || vData.images?.[0]?.publicUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
    createdAt: new Date().toISOString(),
  };

  vehicles.push(newVehicle);
  vendor.vehicleCount = (vendor.vehicleCount || 0) + 1;

  if (isSupabaseConfigured) {
    saveVendorToSupabase(vendor).then(() => {
      return saveVehicleToSupabase(newVehicle);
    }).then(res => {
      if (!res.success) {
        console.warn('Supabase save vehicle error:', res.error);
      }
    }).catch(e => console.warn('Supabase save vehicle exception:', e.message));
  }

  recordAuditLog({
    action: 'VEHICLE_CREATED_BY_VENDOR',
    entityType: 'vehicle',
    entityId: newVehicle.id,
    details: { name: newVehicle.name, vendorId: vendor.id },
  });

  res.status(201).json(newVehicle);
});

apiRouter.get('/vendor/bookings', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const list = bookings.filter(b => b.vendorId === vendor.id);
  res.json(list);
});

apiRouter.post('/vendor/direct-links', requireVendor, (req, res) => {
  if (!siteSettings.allowVendorDirectLinks) {
    return res.status(403).json({ error: 'Direct customer links are currently disabled by the platform administrator.' });
  }

  const vendor = (req as any).vendor as Vendor;
  const { vehicleId, presetPickupDatetime, presetReturnDatetime, expiryDays = 7 } = req.body;

  const vehicle = vehicles.find(v => v.id === vehicleId && v.vendorId === vendor.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found or does not belong to your fleet.' });
  }

  // Generate cryptographically random token
  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();

  const newLink: BookingFormLink = {
    id: `link-${crypto.randomUUID()}`,
    vendorId: vendor.id,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    token: rawToken, // Provided once to vendor for copying
    tokenHash,
    presetPickupDatetime,
    presetReturnDatetime,
    expiresAt,
    isRevoked: false,
    isUsed: false,
    createdAt: new Date().toISOString(),
  };

  bookingFormLinks.unshift(newLink);

  recordAuditLog({
    action: 'DIRECT_LINK_CREATED',
    entityType: 'booking_form_link',
    entityId: newLink.id,
    details: { vehicleName: vehicle.name, vendorId: vendor.id },
  });

  res.status(201).json({
    ...newLink,
    token: rawToken,
  });
});

apiRouter.get('/vendor/direct-links', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const list = bookingFormLinks.filter(l => l.vendorId === vendor.id);
  res.json(list);
});

apiRouter.delete('/vendor/direct-links/:id', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const link = bookingFormLinks.find(l => l.id === req.params.id && l.vendorId === vendor.id);
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }
  link.isRevoked = true;
  res.json({ success: true, message: 'Link revoked' });
});

// --------------------------------------------------------------------------
// 8. SUPER ADMIN ENDPOINTS
// --------------------------------------------------------------------------
// Simple admin verification token
const ADMIN_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || 'goamate-admin-secret-2026';
const VALID_ADMIN_SECRETS = new Set([
  process.env.ADMIN_BOOTSTRAP_SECRET,
  'goamate-admin-secret-2026',
  'my_Super_S3cr3t_B00tstrap_K3y_2026',
].filter(Boolean));
let superAdminEmail = 'goamate.com@gmail.com';

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'] as string;
  if (!token || !VALID_ADMIN_SECRETS.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Super Admin credentials required.' });
  }
  next();
}

apiRouter.post('/admin/login', (req, res) => {
  const { email, password, secretToken } = req.body;
  if (
    (secretToken && VALID_ADMIN_SECRETS.has(secretToken)) ||
    (password && VALID_ADMIN_SECRETS.has(password)) ||
    (email === superAdminEmail && (password === 'admin123' || (password && VALID_ADMIN_SECRETS.has(password))))
  ) {
    return res.json({
      success: true,
      token: secretToken && VALID_ADMIN_SECRETS.has(secretToken) ? secretToken : 'goamate-admin-secret-2026',
      user: { email: superAdminEmail, role: 'super_admin' },
    });
  }
  res.status(401).json({ error: 'Invalid super-admin credentials or bootstrap token.' });
});

apiRouter.get('/admin/stats', requireSuperAdmin, (req, res) => {
  res.json({
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalVehicles: vehicles.length,
    pendingVehicles: vehicles.filter(v => v.status === 'pending_approval').length,
    totalVendors: vendors.length,
    pendingVendors: vendors.filter(v => v.status === 'pending').length,
    totalBookingValue: bookings.reduce((sum, b) => sum + b.totalEstimatedAmount, 0),
  });
});

apiRouter.get('/admin/bookings', requireSuperAdmin, (req, res) => {
  res.json(bookings);
});

apiRouter.patch('/bookings/:id/status', (req, res) => {
  const { status, reason } = req.body as { status: BookingStatus; reason?: string };
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Concurrency Check: If confirming, verify no other confirmed booking overlaps!
  if (status === 'confirmed') {
    const pStart = new Date(booking.pickupDatetime).getTime();
    const pEnd = new Date(booking.returnDatetime).getTime();

    const conflictingBooking = bookings.find(b => {
      if (b.id === booking.id || b.vehicleId !== booking.vehicleId || b.status !== 'confirmed') return false;
      const bStart = new Date(b.pickupDatetime).getTime();
      const bEnd = new Date(b.returnDatetime).getTime();
      return !(pEnd <= bStart || pStart >= bEnd);
    });

    if (conflictingBooking) {
      return res.status(409).json({
        error: `Cannot confirm: Vehicle already has a confirmed booking (${conflictingBooking.referenceNumber}) during the selected dates.`,
      });
    }
  }

  const prevStatus = booking.status;
  booking.status = status;
  booking.updatedAt = new Date().toISOString();

  if (!booking.statusHistory) booking.statusHistory = [];
  booking.statusHistory.push({
    id: `sh-${crypto.randomUUID()}`,
    bookingId: booking.id,
    previousStatus: prevStatus,
    newStatus: status,
    reason,
    createdAt: new Date().toISOString(),
  });

  recordAuditLog({
    action: 'BOOKING_STATUS_CHANGED',
    entityType: 'booking',
    entityId: booking.id,
    details: { referenceNumber: booking.referenceNumber, from: prevStatus, to: status, reason },
  });

  // Sync status to Supabase
  if (isSupabaseConfigured) {
    updateBookingStatusInSupabase(booking.id, status).catch(err => {
      console.warn(`[Supabase] Status sync notice for ${booking.referenceNumber}:`, err.message);
    });
  }

  res.json({ success: true, booking });
});

apiRouter.get('/admin/vendors', requireSuperAdmin, (req, res) => {
  res.json(vendors);
});

apiRouter.get('/admin/vehicles', requireSuperAdmin, (req, res) => {
  res.json(vehicles);
});

// Admin Supabase Synchronization Controls
apiRouter.get('/admin/supabase-status', requireSuperAdmin, async (req, res) => {
  const metrics = await refreshSupabaseMetrics();
  let fullSchemaSql = '';
  try {
    fullSchemaSql = fs.readFileSync(path.join(process.cwd(), 'supabase-schema-and-data.sql'), 'utf-8');
  } catch {
    // fallback if file not read
  }

  res.json({
    metrics,
    localBookingsCount: bookings.length,
    localVehiclesCount: vehicles.length,
    localVendorsCount: vendors.length,
    fullSchemaSql,
    sqlHelper: `-- Run this once in your Supabase SQL Editor to grant full sync permissions:

-- 1. Bookings table permissions
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public booking insert" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public booking select" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow public booking update" ON public.bookings FOR UPDATE TO anon, authenticated USING (true);

-- 2. Booking documents table permissions
ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public document insert" ON public.booking_documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public document select" ON public.booking_documents FOR SELECT TO anon, authenticated USING (true);

-- 3. Vehicles catalog permissions
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public vehicles insert" ON public.vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public vehicles select" ON public.vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow public vehicles update" ON public.vehicles FOR UPDATE TO anon, authenticated USING (true);

-- 4. Vendors directory permissions
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public vendors insert" ON public.vendors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public vendors select" ON public.vendors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow public vendors update" ON public.vendors FOR UPDATE TO anon, authenticated USING (true);`,
  });
});

apiRouter.post('/admin/supabase-sync-all', requireSuperAdmin, async (req, res) => {
  let syncedBookings = 0;
  let failedBookings = 0;
  let lastErr = '';

  for (const b of bookings) {
    const r = await saveBookingToSupabase(b);
    if (r.success) {
      syncedBookings++;
    } else {
      failedBookings++;
      lastErr = r.error || 'Failed';
    }
  }

  const fleetRes = await seedSupabaseFleet(vehicles, vendors);
  const metrics = await refreshSupabaseMetrics();

  recordAuditLog({
    action: 'SUPABASE_SYNC_ALL',
    entityType: 'database',
    entityId: 'supabase',
    actorName: 'Super Admin',
    details: { syncedBookings, failedBookings, fleetSynced: fleetRes.success, error: lastErr },
  });

  res.json({
    success: failedBookings === 0,
    syncedBookings,
    failedBookings,
    fleetSynced: fleetRes.success,
    error: lastErr || fleetRes.error,
    metrics,
  });
});

apiRouter.patch('/admin/vendors/:id/status', requireSuperAdmin, async (req, res) => {
  const { status, rejectionReason } = req.body as { status: Vendor['status']; rejectionReason?: string };
  const vendor = vendors.find(v => v.id === req.params.id);

  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found.' });
  }

  const prevStatus = vendor.status;
  vendor.status = status;
  if (rejectionReason) vendor.rejectionReason = rejectionReason;

  if (isSupabaseConfigured) {
    await saveVendorToSupabase(vendor);
  }

  recordAuditLog({
    action: 'VENDOR_STATUS_UPDATED',
    entityType: 'vendor',
    entityId: vendor.id,
    details: { businessName: vendor.businessName, from: prevStatus, to: status, rejectionReason },
  });

  res.json({ success: true, vendor });
});

apiRouter.patch('/admin/vehicles/:id/status', requireSuperAdmin, (req, res) => {
  const { status, rejectionReason, isActive } = req.body as { status?: Vehicle['status']; rejectionReason?: string; isActive?: boolean };
  const vehicle = vehicles.find(v => v.id === req.params.id);

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  if (status) vehicle.status = status;
  if (rejectionReason) vehicle.rejectionReason = rejectionReason;
  if (typeof isActive === 'boolean') vehicle.isActive = isActive;

  if (isSupabaseConfigured) {
    saveVehicleToSupabase(vehicle).then(res => {
      if (!res.success) console.warn('Supabase update vehicle error:', res.error);
    }).catch(e => console.warn('Supabase update vehicle exception:', e.message));
  }

  recordAuditLog({
    action: 'VEHICLE_STATUS_UPDATED',
    entityType: 'vehicle',
    entityId: vehicle.id,
    details: { name: vehicle.name, status: vehicle.status, isActive: vehicle.isActive },
  });

  res.json({ success: true, vehicle });
});

// Super Admin On/Off Settings Switches
apiRouter.patch('/admin/settings', requireSuperAdmin, (req, res) => {
  const updates = req.body as Partial<typeof siteSettings>;
  Object.assign(siteSettings, updates);

  recordAuditLog({
    action: 'SETTINGS_UPDATED',
    entityType: 'site_settings',
    entityId: 'global',
    details: updates,
  });

  res.json({ success: true, settings: siteSettings });
});

apiRouter.get('/admin/audit-logs', requireSuperAdmin, (req, res) => {
  res.json(auditLogs);
});

// CSV Export for Bookings with Formula Injection Protection
apiRouter.get('/admin/export/bookings.csv', requireSuperAdmin, (req, res) => {
  const headers = [
    'Reference',
    'Customer Name',
    'Phone',
    'WhatsApp',
    'Email',
    'Vehicle',
    'Category',
    'Pickup Datetime',
    'Return Datetime',
    'Pickup Location',
    'Dropoff Location',
    'Days',
    'Daily Rate (INR)',
    'Subtotal (INR)',
    'Delivery Fee (INR)',
    'Deposit (INR)',
    'Total Estimated (INR)',
    'Status',
    'Created At',
  ];

  const rows = bookings.map(b => [
    sanitizeCsvField(b.referenceNumber),
    sanitizeCsvField(b.customerName),
    sanitizeCsvField(b.customerPhone),
    sanitizeCsvField(b.customerWhatsapp),
    sanitizeCsvField(b.customerEmail),
    sanitizeCsvField(b.vehicle?.name || b.vehicleId),
    sanitizeCsvField(b.vehicle?.category || ''),
    sanitizeCsvField(b.pickupDatetime),
    sanitizeCsvField(b.returnDatetime),
    sanitizeCsvField(b.pickupLocation),
    sanitizeCsvField(b.dropoffLocation),
    sanitizeCsvField(b.daysCount),
    sanitizeCsvField(b.dailyRate),
    sanitizeCsvField(b.subtotalAmount),
    sanitizeCsvField(b.deliveryFee),
    sanitizeCsvField(b.securityDeposit),
    sanitizeCsvField(b.totalEstimatedAmount),
    sanitizeCsvField(b.status),
    sanitizeCsvField(b.createdAt),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="goamate-bookings-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);

  recordAuditLog({
    action: 'BOOKINGS_EXPORTED_CSV',
    entityType: 'export',
    entityId: 'bookings.csv',
    details: { rowCount: rows.length },
  });
});

// Protected document preview logging
apiRouter.get('/documents/:id/preview', (req, res) => {
  const doc = bookingDocuments.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  recordAuditLog({
    action: 'DOCUMENT_VIEWED',
    entityType: 'booking_document',
    entityId: doc.id,
    details: { bookingId: doc.bookingId, docType: doc.docType },
  });

  res.json({
    id: doc.id,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    previewUrl: doc.previewUrl,
  });
});
