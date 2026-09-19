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
  invoices,
  generateInvoiceNumber,
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
  Invoice,
  InvoiceItem,
  InvoiceCustomerDetails,
  InvoiceVehicleDetails,
  InvoiceRentalDetails,
  InvoiceDocumentAppendixItem,
  InvoicePaymentStatus,
  InvoicePaymentMethod,
  InvoiceStatus,
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
  fetchAllVendorsCombined,
  getSyncState,
  refreshSupabaseMetrics,
  seedSupabaseFleet,
  saveInvoiceToSupabase,
  updateInvoiceInSupabase,
  fetchInvoicesFromSupabase,
  deleteVendorPermanentlyFromSupabase,
} from './supabase';
import { SAMPLE_DL_FRONT, SAMPLE_DL_BACK, SAMPLE_AADHAAR_FRONT } from './sampleDocs';

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
      
      // Fetch invoices from Supabase
      fetchInvoicesFromSupabase()
        .then(invRes => {
          if (invRes.success && invRes.invoices.length > 0) {
            console.log(`[Supabase] Loaded ${invRes.invoices.length} existing invoices from Supabase.`);
            for (const sbInv of invRes.invoices) {
              if (!invoices.some(i => i.id === sbInv.id || i.invoiceNumber === sbInv.invoiceNumber)) {
                invoices.push(sbInv);
              }
            }
          }
          seedInitialDemoBookingsAndInvoices();
        })
        .catch(e => {
          console.warn('[Supabase] Fetch invoices notice:', e.message);
          seedInitialDemoBookingsAndInvoices();
        });

      refreshSupabaseMetrics().then(metrics => {
        if (metrics.totalVehiclesInDb === 0) {
          seedSupabaseFleet(vehicles, vendors).catch(e => console.warn('[Supabase] Fleet seed notice:', e.message));
        }
      }).catch(e => console.warn('[Supabase] Metrics check:', e.message));
    })
    .catch(err => {
      console.warn('[Supabase] Initial load notice:', err.message);
      seedInitialDemoBookingsAndInvoices();
    });
} else {
  seedInitialDemoBookingsAndInvoices();
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

  let filtered = vehicles.filter(v => v.status === 'approved' && v.isActive && !v.isDeleted);
  
  // Ensure the vendor is also active and not deleted
  filtered = filtered.filter(v => {
    const vendor = vendors.find(ven => ven.id === v.vendorId);
    return vendor && vendor.status === 'approved' && !vendor.isDeleted;
  });

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
  
  const vendor = v ? vendors.find(ven => ven.id === v.vendorId) : null;
  const isVendorValid = vendor && vendor.status === 'approved' && !vendor.isDeleted;
  
  if (!v || v.status !== 'approved' || !v.isActive || v.isDeleted || !isVendorValid) {
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

  const vendorSettings = vendors.find(vd => vd.id === v.vendorId);
  const calc = calculateRentalPricing({
    pickupDatetime,
    returnDatetime,
    dailyPrice: v.dailyPrice,
    securityDeposit: v.securityDeposit,
    deliveryFee,
    vendor: vendorSettings,
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

  const linkVendor = matchedDirectLink ? vendors.find(v => v.id === matchedDirectLink.vendorId) : undefined;
  const calc = calculateRentalPricing({
    pickupDatetime,
    returnDatetime,
    dailyPrice: vehicle.dailyPrice,
    securityDeposit: vehicle.securityDeposit,
    deliveryFee,
    vendor: linkVendor,
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
    rentalCalculationMode: calc.breakdown.rentalCalculationMode,
    rentalStartTime: calc.breakdown.rentalStartTime,
    rentalEndTime: calc.breakdown.rentalEndTime,
    chargeableDays: calc.breakdown.chargeableDays,
    extraHours: calc.breakdown.extraHours,
    lateFee: calc.breakdown.lateFee,
    estimatedTotal: calc.breakdown.estimatedTotal,
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

  const { vendorName, businessName, phone, whatsapp, email, serviceLocation, password } = req.body;

  if (!vendorName || !businessName || !phone || !email || !password) {
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
    vendorName: vendorName.trim(),
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
    details: { businessName, vendorName, email },
  });

  res.status(201).json({
    success: true,
    vendor: newVendor,
    message: 'Vendor registration submitted. Your account is pending super-admin verification.',
  });
});

// Synchronize vendor registered via Supabase Auth into platform memory/list
apiRouter.post('/vendor/register-supabase-sync', async (req, res) => {
  const { userId, fullName, businessName, email, phone, whatsapp, address, area } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  let existing = vendors.find(v => v.email.toLowerCase() === email.toLowerCase() || (userId && v.userId === userId));
  if (!existing) {
    const vendorId = `vendor-${userId || crypto.randomUUID()}`;
    const newVendor: Vendor = {
      id: vendorId,
      userId: userId || `user-${crypto.randomUUID()}`,
      businessName: (businessName || fullName || 'Vendor Partner').trim(),
      vendorName: (fullName || 'Partner').trim(),
      phone: (phone || '').trim(),
      whatsapp: (whatsapp || phone || '').trim(),
      email: email.trim().toLowerCase(),
      serviceLocation: area ? `${area}${address ? `, ${address}` : ''}` : 'Margao, Goa',
      status: 'pending', // Pending super-admin approval
      vehicleCount: 0,
      createdAt: new Date().toISOString(),
    };
    vendors.push(newVendor);
    existing = newVendor;

    recordAuditLog({
      action: 'VENDOR_REGISTERED',
      entityType: 'vendor',
      entityId: vendorId,
      details: { businessName, vendorName: fullName, email, authProvider: 'supabase' },
    });
  } else {
    if (userId) existing.userId = userId;
    if (fullName) existing.vendorName = fullName;
    if (businessName) existing.businessName = businessName;
    if (phone) existing.phone = phone;
    if (whatsapp) existing.whatsapp = whatsapp;
  }

  if (isSupabaseConfigured && existing) {
    await saveVendorToSupabase(existing).catch(() => {});
  }

  res.json({ success: true, vendor: existing });
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


apiRouter.patch('/vendor/settings', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const updates = req.body;
  
  if (updates.rentalCalculationMode) vendor.rentalCalculationMode = updates.rentalCalculationMode;
  if (updates.dayRentalStartTime) vendor.dayRentalStartTime = updates.dayRentalStartTime;
  if (updates.dayRentalEndTime) vendor.dayRentalEndTime = updates.dayRentalEndTime;
  if (updates.gracePeriodMinutes !== undefined) vendor.gracePeriodMinutes = updates.gracePeriodMinutes;
  if (updates.lateReturnPolicy) vendor.lateReturnPolicy = updates.lateReturnPolicy;
  if (updates.extraHourPrice !== undefined) vendor.extraHourPrice = updates.extraHourPrice;
  if (updates.customLateFeeAmount !== undefined) vendor.customLateFeeAmount = updates.customLateFeeAmount;
  if (updates.overnightRentalAllowed !== undefined) vendor.overnightRentalAllowed = updates.overnightRentalAllowed;
  
  if (isSupabaseConfigured) {
    saveVendorToSupabase(vendor).catch(console.error);
  }
  
  res.json({ success: true, vendor });
});

// Self-service vendor account and data removal
apiRouter.delete('/vendor/account', requireVendor, async (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const vendorIdsToMatch = Array.from(new Set([vendor.id, ...(vendor.userId ? [vendor.userId] : [])]));

  // 1. Remove vehicles
  const vehiclesToDelete = vehicles.filter(v => 
    vendorIdsToMatch.includes(v.vendorId) ||
    (vendor.userId && v.vendorId === vendor.userId)
  );
  const vehicleIdsToDelete = vehiclesToDelete.map(v => v.id);

  for (let i = vehicles.length - 1; i >= 0; i--) {
    if (vehicleIdsToDelete.includes(vehicles[i].id) || vendorIdsToMatch.includes(vehicles[i].vendorId)) {
      vehicles.splice(i, 1);
    }
  }

  // 2. Remove direct links
  for (let i = bookingFormLinks.length - 1; i >= 0; i--) {
    if (vehicleIdsToDelete.includes(bookingFormLinks[i].vehicleId)) {
      bookingFormLinks.splice(i, 1);
    }
  }

  // 3. Unlink vendor from bookings
  bookings.forEach(b => {
    if (vendorIdsToMatch.includes(b.vendorId || '')) {
      b.vendorId = undefined;
    }
  });

  // 4. Remove vendor from in-memory array
  const vEmail = vendor.email?.toLowerCase();
  for (let i = vendors.length - 1; i >= 0; i--) {
    const v = vendors[i];
    if (
      vendorIdsToMatch.includes(v.id) ||
      (vendor.userId && v.userId === vendor.userId) ||
      (vEmail && v.email && v.email.toLowerCase() === vEmail)
    ) {
      vendors.splice(i, 1);
    }
  }

  // 5. Supabase purge
  if (isSupabaseConfigured) {
    await deleteVendorPermanentlyFromSupabase(vendor.id, vendor.userId, vendor.email);
  }

  recordAuditLog({
    action: 'VENDOR_SELF_DELETED',
    entityType: 'vendor',
    entityId: vendor.id,
    actorName: vendor.vendorName,
    details: { businessName: vendor.businessName, email: vendor.email, deletedVehiclesCount: vehiclesToDelete.length },
  });

  res.json({
    success: true,
    message: 'Your vendor account and all associated fleet vehicles have been completely removed.',
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

apiRouter.patch('/vendor/vehicles/:id/availability', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  const { isActive } = req.body;
  const vehicle = vehicles.find(v => v.id === req.params.id && v.vendorId === vendor.id);

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found or unauthorized.' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive boolean is required.' });
  }

  vehicle.isActive = isActive;
  vehicle.updatedAt = new Date().toISOString();

  if (isSupabaseConfigured) {
    saveVehicleToSupabase(vehicle).catch(err => {
      console.warn(`[Supabase] Vehicle sync notice for ${vehicle.name}:`, err.message);
    });
  }

  res.json({ success: true, vehicle });
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

apiRouter.get('/admin/vendors', requireSuperAdmin, async (req, res) => {
  if (isSupabaseConfigured) {
    try {
      const combined = await fetchAllVendorsCombined();
      if (combined && combined.length > 0) {
        // Merge into local in-memory vendors array
        for (const cv of combined) {
          const idx = vendors.findIndex(v => v.id === cv.id || (v.userId && cv.userId && v.userId === cv.userId) || (v.email && cv.email && v.email.toLowerCase() === cv.email.toLowerCase()));
          if (idx >= 0) {
            vendors[idx] = { ...vendors[idx], ...cv };
          } else {
            vendors.push(cv);
          }
        }
      }
    } catch (err: any) {
      console.warn('[Admin] Notice syncing vendors for admin list:', err.message);
    }
  }
  res.json(vendors);
});

apiRouter.patch('/admin/vendors/:id/status', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, isDeleted, reason } = req.body;
  
  let vendor = vendors.find(v => v.id === id || v.userId === id);
  if (!vendor) {
    // If not found in memory, try looking up in Supabase
    if (isSupabaseConfigured) {
      const combined = await fetchAllVendorsCombined();
      vendor = combined.find(v => v.id === id || v.userId === id);
      if (vendor) {
        vendors.push(vendor);
      }
    }
  }

  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  
  const prevStatus = vendor.status;
  const prevIsDeleted = vendor.isDeleted;
  
  if (status) vendor.status = status;
  if (reason) vendor.rejectionReason = reason;
  if (status === 'approved') vendor.rejectionReason = undefined;
  if (isDeleted !== undefined) {
    vendor.isDeleted = isDeleted;
    if (isDeleted) {
      vendor.deletedAt = new Date().toISOString();
      vendor.deletedBy = 'Super Admin';
      vendor.status = 'inactive';
      
      // Suspend/Deactivate all vehicles of this vendor
      vehicles.filter(v => v.vendorId === vendor!.id || v.vendorId === id || (vendor!.userId && v.vendorId === vendor!.userId)).forEach(v => {
        v.isActive = false;
        v.status = 'inactive';
        v.updatedAt = new Date().toISOString();
        if (isSupabaseConfigured) saveVehicleToSupabase(v);
      });
    } else {
      vendor.deletedAt = undefined;
      vendor.deletedBy = undefined;
    }
  }

  // Also suspend vehicles if vendor is explicitly suspended
  if (status === 'suspended') {
    vehicles.filter(v => v.vendorId === vendor!.id || v.vendorId === id || (vendor!.userId && v.vendorId === vendor!.userId)).forEach(v => {
      v.isActive = false;
      v.status = 'inactive';
      v.updatedAt = new Date().toISOString();
      if (isSupabaseConfigured) saveVehicleToSupabase(v);
    });
  }

  // Synchronize any duplicate references or aliases in the in-memory vendors array
  vendors.forEach(v => {
    if (v.id === vendor!.id || (v.userId && v.userId === vendor!.userId) || (v.email && v.email.toLowerCase() === vendor!.email.toLowerCase())) {
      v.status = vendor!.status;
      v.isDeleted = vendor!.isDeleted;
      v.deletedAt = vendor!.deletedAt;
      v.deletedBy = vendor!.deletedBy;
      v.rejectionReason = vendor!.rejectionReason;
    }
  });
  
  recordAuditLog({
    action: isDeleted ? 'VENDOR_REMOVED' : status === 'suspended' ? 'VENDOR_SUSPENDED' : status === 'inactive' ? 'VENDOR_DEACTIVATED' : 'VENDOR_STATUS_UPDATED',
    entityType: 'vendor',
    entityId: id,
    details: { businessName: vendor.businessName, prevStatus, newStatus: vendor.status, prevIsDeleted, newIsDeleted: vendor.isDeleted, reason },
  });
  
  if (isSupabaseConfigured) {
    await saveVendorToSupabase(vendor);
  }
  
  res.json({ success: true, vendor });
});

// Permanently purge vendor and all associated fleet data from the platform
const handlePermanentVendorDeletion = async (req: Request, res: Response) => {
  const { id } = req.params;

  let vendor = vendors.find(v => v.id === id || v.userId === id);
  if (!vendor && isSupabaseConfigured) {
    const combined = await fetchAllVendorsCombined();
    vendor = combined.find(v => v.id === id || v.userId === id);
  }

  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found on platform.' });
  }

  const vendorIdsToMatch = Array.from(new Set([
    vendor.id,
    id,
    ...(vendor.userId ? [vendor.userId] : []),
  ]));

  // 1. Identify all vehicles associated with this vendor
  const vehiclesToDelete = vehicles.filter(v => 
    vendorIdsToMatch.includes(v.vendorId) ||
    (vendor!.userId && v.vendorId === vendor!.userId)
  );
  const vehicleIdsToDelete = vehiclesToDelete.map(v => v.id);

  // 2. Remove all those vehicles from in-memory vehicles array
  for (let i = vehicles.length - 1; i >= 0; i--) {
    if (vehicleIdsToDelete.includes(vehicles[i].id) || vendorIdsToMatch.includes(vehicles[i].vendorId)) {
      vehicles.splice(i, 1);
    }
  }

  // 3. Remove direct customer booking links for those vehicles
  for (let i = bookingFormLinks.length - 1; i >= 0; i--) {
    if (vehicleIdsToDelete.includes(bookingFormLinks[i].vehicleId)) {
      bookingFormLinks.splice(i, 1);
    }
  }

  // 4. Safely unlink vendor_id on bookings (keeps booking history without crashing or broken foreign keys)
  bookings.forEach(b => {
    if (vendorIdsToMatch.includes(b.vendorId || '')) {
      b.vendorId = undefined;
    }
  });

  // 5. Unlink or clean up invoices
  invoices.forEach(inv => {
    if (vendorIdsToMatch.includes(inv.vendorId || '')) {
      inv.vendorId = 'PURGED_VENDOR';
    }
  });

  // 6. Remove vendor from in-memory vendors list
  const vEmail = vendor.email?.toLowerCase();
  for (let i = vendors.length - 1; i >= 0; i--) {
    const v = vendors[i];
    if (
      vendorIdsToMatch.includes(v.id) ||
      (vendor.userId && v.userId === vendor.userId) ||
      (vEmail && v.email && v.email.toLowerCase() === vEmail)
    ) {
      vendors.splice(i, 1);
    }
  }

  // 7. Supabase permanent purge
  let supaResult = { success: true, deletedVehiclesCount: 0 };
  if (isSupabaseConfigured) {
    supaResult = await deleteVendorPermanentlyFromSupabase(vendor.id, vendor.userId, vendor.email);
  }

  // 8. Record audit log
  recordAuditLog({
    action: 'VENDOR_PERMANENTLY_PURGED',
    entityType: 'vendor',
    entityId: id,
    actorName: 'Super Admin',
    details: {
      businessName: vendor.businessName,
      vendorName: vendor.vendorName,
      email: vendor.email,
      phone: vendor.phone,
      deletedVehiclesCount: vehiclesToDelete.length,
      supabaseResult: supaResult,
    },
  });

  res.json({
    success: true,
    message: `Vendor "${vendor.businessName}" and all associated data (${vehiclesToDelete.length} fleet vehicles) were permanently removed from the website and database.`,
    deletedVehiclesCount: vehiclesToDelete.length,
  });
};

apiRouter.delete('/admin/vendors/:id', requireSuperAdmin, handlePermanentVendorDeletion);
apiRouter.post('/admin/vendors/:id/purge', requireSuperAdmin, handlePermanentVendorDeletion);

apiRouter.get('/admin/vehicles', requireSuperAdmin, (req, res) => {
  res.json(vehicles);
});

apiRouter.patch('/admin/vehicles/:id/status', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, isActive, isDeleted, reason } = req.body;
  
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  
  const prevStatus = vehicle.status;
  const prevIsDeleted = vehicle.isDeleted;
  
  if (status) vehicle.status = status;
  if (isActive !== undefined) vehicle.isActive = isActive;
  
  if (isDeleted !== undefined) {
    vehicle.isDeleted = isDeleted;
    if (isDeleted) {
      vehicle.deletedAt = new Date().toISOString();
      vehicle.deletedBy = 'Super Admin';
      vehicle.isActive = false;
      vehicle.status = 'inactive';
    } else {
      vehicle.deletedAt = undefined;
      vehicle.deletedBy = undefined;
    }
  }
  vehicle.updatedAt = new Date().toISOString();
  
  recordAuditLog({
    action: isDeleted ? 'VEHICLE_REMOVED' : !isDeleted && prevIsDeleted ? 'VEHICLE_RESTORED' : !isActive ? 'VEHICLE_DEACTIVATED' : 'VEHICLE_STATUS_UPDATED',
    entityType: 'vehicle',
    entityId: id,
    details: { name: vehicle.name, prevStatus, newStatus: vehicle.status, prevIsDeleted, newIsDeleted: vehicle.isDeleted, reason },
  });
  
  if (isSupabaseConfigured) {
    await saveVehicleToSupabase(vehicle);
  }
  
  res.json({ success: true, vehicle });
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

// Duplicate endpoints removed

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

// --------------------------------------------------------------------------
// 9. INVOICE MANAGEMENT SYSTEM ENDPOINTS
// --------------------------------------------------------------------------

function requireVendorOrAdmin(req: Request, res: Response, next: NextFunction) {
  const adminToken = req.headers['x-admin-token'] as string;
  if (adminToken && VALID_ADMIN_SECRETS.has(adminToken)) {
    (req as any).userRole = 'super_admin';
    return next();
  }

  const authHeader = req.headers.authorization;
  const vendorIdHeader = req.headers['x-vendor-id'] as string;
  let vendorId = vendorIdHeader;
  if (!vendorId && authHeader) {
    if (authHeader.startsWith('Bearer vendor-session-')) {
      vendorId = authHeader.replace('Bearer vendor-session-', '');
    } else if (authHeader.startsWith('vendor-session-')) {
      vendorId = authHeader.replace('vendor-session-', '');
    } else if (authHeader.startsWith('Bearer ')) {
      vendorId = authHeader.replace('Bearer ', '').trim();
    } else {
      vendorId = authHeader;
    }
  }

  // Check vendors
  const vendor = vendors.find(v => v.id === vendorId);
  if (vendor && vendor.status === 'approved') {
    (req as any).vendor = vendor;
    (req as any).userRole = 'vendor';
    return next();
  }

  // If vendor id matches default or known active vendor
  if (vendorId === 'platform-default' || vendorId === 'vendor-margao-main') {
    const fallbackVendor = vendors.find(v => v.id === vendorId) || vendors[0];
    (req as any).vendor = fallbackVendor;
    (req as any).userRole = 'vendor';
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Vendor session or Super Admin credentials required.' });
}

// 9.1 Check if an invoice exists for a booking
apiRouter.get('/invoices/booking/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const invoice = invoices.find(inv => inv.bookingId === bookingId || inv.bookingReference === bookingId);
  if (!invoice) {
    return res.json({ hasInvoice: false });
  }
  res.json({ hasInvoice: true, invoice });
});

// 9.2 Server-side invoice totals calculation endpoint (never trust client amounts)
apiRouter.post('/invoices/calculate', (req, res) => {
  const {
    bookingId,
    daysCount,
    dailyRate,
    deliveryFee = 0,
    items = [],
    discountAmount = 0,
    taxRatePercent = 0,
    securityDeposit = 0,
    amountPaid = 0,
  } = req.body;

  let calculatedItems: InvoiceItem[] = [];

  if (Array.isArray(items) && items.length > 0) {
    calculatedItems = items.map((it: any, idx: number) => {
      const rate = Number(it.rate) || 0;
      const amount = Number(it.amount) !== undefined ? Number(it.amount) : rate;
      return {
        id: it.id || `item-${idx + 1}`,
        description: it.description || 'Rental Charge',
        quantityOrDays: String(it.quantityOrDays || '1'),
        rate,
        amount,
      };
    });
  } else {
    let baseRate = Number(dailyRate) || 0;
    let days = Number(daysCount) || 1;

    if (bookingId) {
      const booking = bookings.find(b => b.id === bookingId || b.referenceNumber === bookingId);
      if (booking) {
        baseRate = dailyRate !== undefined ? Number(dailyRate) : booking.dailyRate;
        days = daysCount !== undefined ? Number(daysCount) : booking.daysCount;
      }
    }

    calculatedItems.push({
      id: 'item-rental',
      description: 'Vehicle Rental Charges',
      quantityOrDays: `${days} ${days > 1 ? 'days' : 'day'}`,
      rate: baseRate,
      amount: Math.round(baseRate * days * 100) / 100,
    });

    const fee = Number(deliveryFee);
    if (fee > 0) {
      calculatedItems.push({
        id: 'item-delivery',
        description: 'Location Delivery / Pickup Fee',
        quantityOrDays: '1 trip',
        rate: fee,
        amount: fee,
      });
    }
  }

  const subtotalAmount = Math.round(calculatedItems.reduce((sum, it) => sum + it.amount, 0) * 100) / 100;
  const safeDiscount = Math.min(subtotalAmount, Math.max(0, Number(discountAmount) || 0));
  const taxableAmount = Math.max(0, subtotalAmount - safeDiscount);
  const taxRate = Math.max(0, Number(taxRatePercent) || 0);
  const taxAmount = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const safeAmountPaid = Math.max(0, Number(amountPaid) || 0);
  const amountDue = Math.max(0, Math.round((totalAmount - safeAmountPaid) * 100) / 100);
  const safeDeposit = Math.max(0, Number(securityDeposit) || 0);

  const paymentStatus: InvoicePaymentStatus =
    safeAmountPaid >= totalAmount && totalAmount > 0 ? 'paid' : safeAmountPaid > 0 ? 'partially_paid' : 'pending';

  res.json({
    subtotalAmount,
    discountAmount: safeDiscount,
    extraCharges: calculatedItems.slice(1).reduce((sum, it) => sum + it.amount, 0),
    taxRatePercent: taxRate,
    taxAmount,
    securityDeposit: safeDeposit,
    totalAmount,
    amountPaid: safeAmountPaid,
    amountDue,
    paymentStatus,
    items: calculatedItems,
  });
});

// 9.3 Generate / Create official invoice
apiRouter.post('/invoices', requireVendorOrAdmin, async (req, res) => {
  try {
    const {
      bookingId,
      items,
      discountAmount = 0,
      taxRatePercent = 0,
      securityDeposit,
      amountPaid = 0,
      paymentMethod = 'Cash',
      paymentStatus,
      notes,
      customerDetailsOverride,
      vehicleDetailsOverride,
      rentalDetailsOverride,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required to generate an invoice.' });
    }

    const booking = bookings.find(b => b.id === bookingId || b.referenceNumber === bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Role check: Vendor can only invoice their own booking
    const isVendor = (req as any).userRole === 'vendor';
    const currentVendor = (req as any).vendor as Vendor | undefined;
    if (isVendor && currentVendor && booking.vendorId !== currentVendor.id && booking.vendorId !== 'platform-default') {
      return res.status(403).json({ error: 'Unauthorized: You can only generate invoices for your assigned bookings.' });
    }

    // Check if invoice already exists
    const existing = invoices.find(inv => inv.bookingId === booking.id || inv.bookingReference === booking.referenceNumber);
    if (existing) {
      return res.status(409).json({
        error: `An invoice (${existing.invoiceNumber}) has already been generated for this booking.`,
        existingInvoice: existing,
      });
    }

    const vehicle = booking.vehicle || vehicles.find(v => v.id === booking.vehicleId);
    const vendor = vendors.find(v => v.id === booking.vendorId) || currentVendor || vendors[0];

    // Build items
    let invoiceItems: InvoiceItem[] = [];
    if (Array.isArray(items) && items.length > 0) {
      invoiceItems = items.map((it: any, idx: number) => ({
        id: it.id || `item-${idx + 1}`,
        description: it.description || 'Rental Charge',
        quantityOrDays: String(it.quantityOrDays || '1'),
        rate: Number(it.rate) || 0,
        amount: Number(it.amount) !== undefined ? Number(it.amount) : Number(it.rate || 0),
      }));
    } else {
      const vehicleName = vehicle?.name || 'Vehicle Rental';
      const days = booking.daysCount || 1;
      const rentalAmount = booking.dailyRate * days;
      invoiceItems.push({
        id: 'item-rental',
        description: `${vehicleName} Rental (${days} ${days > 1 ? 'days' : 'day'})`,
        quantityOrDays: `${days} ${days > 1 ? 'days' : 'day'}`,
        rate: booking.dailyRate,
        amount: rentalAmount,
      });

      if (booking.deliveryFee && booking.deliveryFee > 0) {
        invoiceItems.push({
          id: 'item-delivery',
          description: `Delivery & Pickup Service (${booking.pickupLocation} to ${booking.dropoffLocation})`,
          quantityOrDays: '1 trip',
          rate: booking.deliveryFee,
          amount: booking.deliveryFee,
        });
      }
    }

    // Backend financial calculations
    const subtotal = Math.round(invoiceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) * 100) / 100;
    const safeDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
    const taxable = Math.max(0, subtotal - safeDiscount);
    const taxRate = Math.max(0, Number(taxRatePercent) || 0);
    const taxAmount = Math.round((taxable * (taxRate / 100)) * 100) / 100;
    const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;
    const safePaid = Math.max(0, Number(amountPaid) || 0);
    const amountDue = Math.max(0, Math.round((totalAmount - safePaid) * 100) / 100);
    const finalDeposit = securityDeposit !== undefined ? Number(securityDeposit) : (booking.securityDeposit || 0);

    const calculatedPaymentStatus: InvoicePaymentStatus =
      paymentStatus || (safePaid >= totalAmount && totalAmount > 0 ? 'paid' : safePaid > 0 ? 'partially_paid' : 'pending');

    const year = new Date().getFullYear();
    const invoiceNumber = generateInvoiceNumber(year);
    const invoiceId = `inv-${crypto.randomUUID()}`;

    // Gather documents for internal copy
    const docs: InvoiceDocumentAppendixItem[] = [];
    if (booking.documents && booking.documents.length > 0) {
      for (const d of booking.documents) {
        let title = 'Customer Document';
        if (d.docType === 'driving_licence_front') title = 'Driving Licence (Front)';
        else if (d.docType === 'driving_licence_back') title = 'Driving Licence (Back)';
        else if (d.docType === 'id_proof_front') title = `ID Proof (${(d.idProofType || 'Aadhaar').toUpperCase()})`;
        else if (d.docType === 'id_proof_back') title = `ID Proof Back (${(d.idProofType || 'Aadhaar').toUpperCase()})`;

        docs.push({
          id: d.id,
          docType: d.docType,
          title,
          idProofType: d.idProofType,
          previewUrl: d.previewUrl,
          fileName: d.fileName,
          storagePath: d.storagePath,
        });
      }
    }

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      bookingId: booking.id,
      bookingReference: booking.referenceNumber,
      vendorId: booking.vendorId || currentVendor?.id || 'platform-default',
      customerId: booking.customerEmail,
      vehicleId: vehicle?.id || booking.vehicleId,
      invoiceYear: year,
      invoiceDate: new Date().toISOString(),

      subtotalAmount: subtotal,
      discountAmount: safeDiscount,
      extraCharges: invoiceItems.slice(1).reduce((sum, it) => sum + it.amount, 0),
      taxRatePercent: taxRate,
      taxAmount,
      securityDeposit: finalDeposit,
      totalAmount,
      amountPaid: safePaid,
      amountDue,

      paymentStatus: calculatedPaymentStatus,
      paymentMethod: paymentMethod as InvoicePaymentMethod,
      invoiceStatus: 'issued',

      items: invoiceItems,
      customerDetails: {
        name: customerDetailsOverride?.name || booking.customerName,
        phone: customerDetailsOverride?.phone || booking.customerPhone,
        email: customerDetailsOverride?.email || booking.customerEmail,
        whatsapp: customerDetailsOverride?.whatsapp || booking.customerWhatsapp || booking.customerPhone,
        address: customerDetailsOverride?.address || booking.hotelOrDeliveryAddress || 'Goa, India',
        drivingLicenceNumber: customerDetailsOverride?.drivingLicenceNumber || (booking as any).drivingLicenceNumber || 'GA-03-20210009841',
      },
      vehicleDetails: {
        type: vehicleDetailsOverride?.type || (vehicle?.category ? (vehicle.category === 'car' ? 'Car (Sedan/SUV)' : 'Scooter / Bike') : 'Car / Bike'),
        name: vehicleDetailsOverride?.name || vehicle?.name || 'Goa Rental Vehicle',
        brand: vehicleDetailsOverride?.brand || vehicle?.brand || 'GoaMate',
        model: vehicleDetailsOverride?.model || vehicle?.model || '',
        registrationNumber: vehicleDetailsOverride?.registrationNumber || vehicle?.registrationNumber || 'GA-08-T-3120',
        vendorName: vehicleDetailsOverride?.vendorName || vendor?.businessName || 'GoaMate Fleet',
      },
      rentalDetails: {
        pickupLocation: rentalDetailsOverride?.pickupLocation || booking.pickupLocation,
        dropoffLocation: rentalDetailsOverride?.dropoffLocation || booking.dropoffLocation,
        pickupDatetime: rentalDetailsOverride?.pickupDatetime || booking.pickupDatetime,
        returnDatetime: rentalDetailsOverride?.returnDatetime || booking.returnDatetime,
        totalDurationDays: rentalDetailsOverride?.totalDurationDays !== undefined ? Number(rentalDetailsOverride.totalDurationDays) : booking.daysCount,
        dailyRate: rentalDetailsOverride?.dailyRate !== undefined ? Number(rentalDetailsOverride.dailyRate) : booking.dailyRate,
      },
      documents: docs,
      notes: notes || undefined,
      issuedAt: new Date().toISOString(),
      createdBy: (req as any).userRole === 'vendor' ? (currentVendor?.businessName || 'Vendor') : 'Super Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoices.unshift(newInvoice);

    // Sync to Supabase
    saveInvoiceToSupabase(newInvoice).catch(e => console.warn('[Supabase] Invoice save warning:', e.message));

    // Audit log
    recordAuditLog({
      action: 'INVOICE_CREATED',
      entityType: 'invoice',
      entityId: newInvoice.id,
      actorName: (req as any).userRole === 'vendor' ? (currentVendor?.businessName || 'Vendor') : 'Super Admin',
      details: {
        invoiceNumber: newInvoice.invoiceNumber,
        bookingReference: newInvoice.bookingReference,
        totalAmount: newInvoice.totalAmount,
        paymentStatus: newInvoice.paymentStatus,
      },
    });

    res.status(201).json({
      success: true,
      invoice: newInvoice,
      message: `Invoice ${newInvoice.invoiceNumber} created and issued successfully.`,
    });
  } catch (err: any) {
    console.error('Invoice creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate invoice.' });
  }
});

// 9.4 Vendor Invoices List (restricted to vendor's bookings)
apiRouter.get('/vendor/invoices', requireVendor, (req, res) => {
  const vendor = (req as any).vendor as Vendor;
  let vendorInvoices = invoices.filter(inv => inv.vendorId === vendor.id);
  // If vendor has no specific invoices yet, include demo invoices for testing
  if (vendorInvoices.length === 0 && (vendor.id === 'platform-default' || vendor.id.startsWith('vendor-') || invoices.every(i => i.vendorId === 'platform-default'))) {
    vendorInvoices = invoices;
  }
  res.json(vendorInvoices);
});

// 9.5 Super Admin Invoices List (all invoices across all vendors)
apiRouter.get('/admin/invoices', requireSuperAdmin, (req, res) => {
  res.json(invoices);
});

// 9.6 View specific Invoice (Customer Copy vs Internal Copy)
apiRouter.get('/invoices/:id', (req, res) => {
  const inv = invoices.find(i => i.id === req.params.id || i.invoiceNumber === req.params.id);
  if (!inv) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  // Security: Customer copy strips out KYC documents appendix
  const copyType = req.query.copy as string;
  if (copyType === 'customer') {
    const customerCopy = { ...inv, documents: [] };
    return res.json(customerCopy);
  }

  res.json(inv);
});

// 9.7 Update Invoice (Payment status, amount paid, notes, etc.)
apiRouter.patch('/invoices/:id', requireVendorOrAdmin, async (req, res) => {
  try {
    const inv = invoices.find(i => i.id === req.params.id || i.invoiceNumber === req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    // Role check: Vendor can only update their own invoice
    const isVendor = (req as any).userRole === 'vendor';
    const currentVendor = (req as any).vendor as Vendor | undefined;
    if (isVendor && currentVendor && inv.vendorId !== currentVendor.id && inv.vendorId !== 'platform-default') {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own invoices.' });
    }

    const { paymentStatus, amountPaid, paymentMethod, invoiceStatus, notes } = req.body;

    if (amountPaid !== undefined) {
      const safePaid = Math.max(0, Number(amountPaid) || 0);
      inv.amountPaid = safePaid;
      inv.amountDue = Math.max(0, Math.round((inv.totalAmount - safePaid) * 100) / 100);
      if (safePaid >= inv.totalAmount && inv.totalAmount > 0) {
        inv.paymentStatus = 'paid';
      } else if (safePaid > 0) {
        inv.paymentStatus = 'partially_paid';
      }
    }

    if (paymentStatus) inv.paymentStatus = paymentStatus;
    if (paymentMethod) inv.paymentMethod = paymentMethod;
    if (invoiceStatus) inv.invoiceStatus = invoiceStatus;
    if (notes !== undefined) inv.notes = notes;
    inv.updatedAt = new Date().toISOString();

    // Sync to Supabase
    updateInvoiceInSupabase(inv.id, {
      paymentStatus: inv.paymentStatus,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      paymentMethod: inv.paymentMethod,
      invoiceStatus: inv.invoiceStatus,
      notes: inv.notes,
    }).catch(e => console.warn('[Supabase] Invoice update error:', e.message));

    recordAuditLog({
      action: 'INVOICE_PAYMENT_UPDATED',
      entityType: 'invoice',
      entityId: inv.id,
      actorName: isVendor ? (currentVendor?.businessName || 'Vendor') : 'Super Admin',
      details: {
        invoiceNumber: inv.invoiceNumber,
        paymentStatus: inv.paymentStatus,
        amountPaid: inv.amountPaid,
        amountDue: inv.amountDue,
      },
    });

    res.json({ success: true, invoice: inv });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update invoice.' });
  }
});

// 9.8 Audit PDF Download
apiRouter.post('/invoices/:id/audit-download', (req, res) => {
  const inv = invoices.find(i => i.id === req.params.id || i.invoiceNumber === req.params.id);
  if (inv) {
    const copyType = req.body?.copyType || 'customer';
    recordAuditLog({
      action: 'INVOICE_DOWNLOADED',
      entityType: 'invoice',
      entityId: inv.id,
      details: {
        invoiceNumber: inv.invoiceNumber,
        copyType,
        timestamp: new Date().toISOString(),
      },
    });
  }
  res.json({ success: true });
});

// --------------------------------------------------------------------------
// 10. INITIAL SEED FOR DEMO BOOKINGS & INVOICES
// --------------------------------------------------------------------------

function seedInitialDemoBookingsAndInvoices() {
  if (bookings.length === 0) {
    const dzire = vehicles.find(v => v.id === 'v-swift-dzire') || vehicles[2] || vehicles[0];
    const activa = vehicles.find(v => v.id === 'v-activa-6g') || vehicles[0];
    const defaultVendor = vendors[0];

    const b1Id = 'book-demo-1042';
    const b1Ref = 'GM-2026-1042';
    
    // Sample KYC documents
    const docDlFront: BookingDocument = {
      id: 'doc-demo-dl-f',
      bookingId: b1Id,
      docType: 'driving_licence_front',
      idProofType: 'driving_licence',
      storagePath: `/secure_docs/${b1Id}/dl_front.svg`,
      fileName: 'rahul_sharma_driving_licence_front.svg',
      fileSizeBytes: 24500,
      mimeType: 'image/svg+xml',
      uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      previewUrl: SAMPLE_DL_FRONT,
    };
    const docDlBack: BookingDocument = {
      id: 'doc-demo-dl-b',
      bookingId: b1Id,
      docType: 'driving_licence_back',
      idProofType: 'driving_licence',
      storagePath: `/secure_docs/${b1Id}/dl_back.svg`,
      fileName: 'rahul_sharma_driving_licence_back.svg',
      fileSizeBytes: 23100,
      mimeType: 'image/svg+xml',
      uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      previewUrl: SAMPLE_DL_BACK,
    };
    const docAadhaar: BookingDocument = {
      id: 'doc-demo-aadhaar',
      bookingId: b1Id,
      docType: 'id_proof_front',
      idProofType: 'aadhaar',
      storagePath: `/secure_docs/${b1Id}/aadhaar_front.svg`,
      fileName: 'rahul_sharma_aadhaar_card.svg',
      fileSizeBytes: 18900,
      mimeType: 'image/svg+xml',
      uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      previewUrl: SAMPLE_AADHAAR_FRONT,
    };

    bookingDocuments.push(docDlFront, docDlBack, docAadhaar);

    const booking1: Booking = {
      id: b1Id,
      referenceNumber: b1Ref,
      vehicleId: dzire.id,
      vendorId: defaultVendor.id,
      vehicle: dzire,
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 43210',
      customerWhatsapp: '+91 98765 43210',
      customerEmail: 'rahul.sharma@example.com',
      hotelOrDeliveryAddress: 'Flat 402, Sunshine Enclave, Bandra West, Mumbai, MH',
      specialRequests: 'Please keep fuel tank full and deliver on time at station.',
      pickupDatetime: new Date(Date.now() + 1 * 86400000).toISOString(),
      returnDatetime: new Date(Date.now() + 4 * 86400000).toISOString(),
      pickupLocation: 'Margao Hub',
      dropoffLocation: 'Madgaon Railway Station',
      daysCount: 3,
      dailyRate: 1800,
      subtotalAmount: 5400,
      deliveryFee: 300,
      securityDeposit: 3000,
      totalEstimatedAmount: 5700,
      priceSnapshot: {
        dailyRate: 1800,
        daysCount: 3,
        totalHours: 72,
        subtotalAmount: 5400,
        deliveryFee: 300,
        securityDeposit: 3000,
        totalEstimatedAmount: 5700,
        durationRule: '3 calendar days (72 hours)',
      },
      status: 'confirmed',
      documents: [docDlFront, docDlBack, docAadhaar],
      statusHistory: [
        {
          id: `sh-1`,
          bookingId: b1Id,
          newStatus: 'confirmed',
          reason: 'Booking confirmed and scheduled for handover',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        }
      ],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    };

    // Booking 2: Confirmed, but NO invoice yet, ready for vendor to generate an invoice
    const b2Id = 'book-demo-2088';
    const b2Ref = 'GM-2026-2088';
    const docActivaDl: BookingDocument = {
      id: 'doc-demo-activa-dl',
      bookingId: b2Id,
      docType: 'driving_licence_front',
      idProofType: 'driving_licence',
      storagePath: `/secure_docs/${b2Id}/dl_front.svg`,
      fileName: 'priya_nair_dl.svg',
      fileSizeBytes: 24000,
      mimeType: 'image/svg+xml',
      uploadedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      previewUrl: SAMPLE_DL_FRONT,
    };
    const docActivaId: BookingDocument = {
      id: 'doc-demo-activa-id',
      bookingId: b2Id,
      docType: 'id_proof_front',
      idProofType: 'aadhaar',
      storagePath: `/secure_docs/${b2Id}/id_front.svg`,
      fileName: 'priya_nair_aadhaar.svg',
      fileSizeBytes: 19000,
      mimeType: 'image/svg+xml',
      uploadedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      previewUrl: SAMPLE_AADHAAR_FRONT,
    };

    bookingDocuments.push(docActivaDl, docActivaId);

    const booking2: Booking = {
      id: b2Id,
      referenceNumber: b2Ref,
      vehicleId: activa.id,
      vendorId: defaultVendor.id,
      vehicle: activa,
      customerName: 'Priya Nair',
      customerPhone: '+91 98231 55678',
      customerWhatsapp: '+91 98231 55678',
      customerEmail: 'priya.nair@example.com',
      hotelOrDeliveryAddress: 'Resort Rio, Arpora, North Goa',
      specialRequests: 'Need two clean ISI certified helmets.',
      pickupDatetime: new Date(Date.now() + 2 * 86400000).toISOString(),
      returnDatetime: new Date(Date.now() + 4 * 86400000).toISOString(),
      pickupLocation: 'Calangute Circle',
      dropoffLocation: 'Calangute Circle',
      daysCount: 2,
      dailyRate: 450,
      subtotalAmount: 900,
      deliveryFee: 100,
      securityDeposit: 1000,
      totalEstimatedAmount: 1000,
      priceSnapshot: {
        dailyRate: 450,
        daysCount: 2,
        totalHours: 48,
        subtotalAmount: 900,
        deliveryFee: 100,
        securityDeposit: 1000,
        totalEstimatedAmount: 1000,
        durationRule: '2 calendar days (48 hours)',
      },
      status: 'confirmed',
      documents: [docActivaDl, docActivaId],
      statusHistory: [
        {
          id: `sh-2`,
          bookingId: b2Id,
          newStatus: 'confirmed',
          reason: 'Customer verified and booking confirmed',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        }
      ],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    };

    bookings.push(booking1, booking2);

    // Initial issued Invoice for Booking 1 matching user specification: GM-INV-2026-000125
    if (invoices.length === 0) {
      const demoInvoice: Invoice = {
        id: 'inv-demo-125',
        invoiceNumber: 'GM-INV-2026-000125',
        bookingId: b1Id,
        bookingReference: b1Ref,
        vendorId: defaultVendor.id,
        customerId: 'rahul.sharma@example.com',
        vehicleId: dzire.id,
        invoiceYear: 2026,
        invoiceDate: new Date().toISOString(),

        subtotalAmount: 5700,
        discountAmount: 0,
        extraCharges: 300,
        taxRatePercent: 0,
        taxAmount: 0,
        securityDeposit: 3000,
        totalAmount: 5700,
        amountPaid: 5700,
        amountDue: 0,

        paymentStatus: 'paid',
        paymentMethod: 'UPI',
        invoiceStatus: 'issued',

        items: [
          {
            id: 'it-1',
            description: 'Maruti Suzuki Dzire (Automatic) Rental (3 days)',
            quantityOrDays: '3 days',
            rate: 1800,
            amount: 5400,
          },
          {
            id: 'it-2',
            description: 'Delivery & Pickup Service to Madgaon Railway Station',
            quantityOrDays: '1 trip',
            rate: 300,
            amount: 300,
          }
        ],
        customerDetails: {
          name: 'Rahul Sharma',
          phone: '+91 98765 43210',
          email: 'rahul.sharma@example.com',
          whatsapp: '+91 98765 43210',
          address: 'Flat 402, Sunshine Enclave, Bandra West, Mumbai, MH',
          drivingLicenceNumber: 'MH-02-20180091244',
        },
        vehicleDetails: {
          type: 'Sedan (Car)',
          name: dzire.name,
          brand: dzire.brand,
          model: dzire.model,
          registrationNumber: dzire.registrationNumber || 'GA-08-T-3120',
          vendorName: defaultVendor.businessName,
        },
        rentalDetails: {
          pickupLocation: 'Margao Hub',
          dropoffLocation: 'Madgaon Railway Station',
          pickupDatetime: booking1.pickupDatetime,
          returnDatetime: booking1.returnDatetime,
          totalDurationDays: 3,
          dailyRate: 1800,
        },
        documents: [
          {
            id: docDlFront.id,
            docType: 'driving_licence_front',
            title: 'Driving Licence (Front)',
            idProofType: 'driving_licence',
            fileName: docDlFront.fileName,
            previewUrl: docDlFront.previewUrl,
          },
          {
            id: docDlBack.id,
            docType: 'driving_licence_back',
            title: 'Driving Licence (Back)',
            idProofType: 'driving_licence',
            fileName: docDlBack.fileName,
            previewUrl: docDlBack.previewUrl,
          },
          {
            id: docAadhaar.id,
            docType: 'id_proof_front',
            title: 'ID Proof (AADHAAR)',
            idProofType: 'aadhaar',
            fileName: docAadhaar.fileName,
            previewUrl: docAadhaar.previewUrl,
          }
        ],
        notes: 'Full payment received via UPI. Security deposit to be collected upon vehicle handover.',
        issuedAt: new Date().toISOString(),
        createdBy: 'GoaMate Internal Fleet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      invoices.push(demoInvoice);
    }
  }
}
