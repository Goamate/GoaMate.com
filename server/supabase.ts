import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Booking, Vehicle, Vendor, BookingDocument, Invoice } from '../src/types';

// Detect Supabase environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Prefer service_role key for backend operations to bypass RLS, fallback to anon/publishable key
const primaryKey = serviceRoleKey || anonKey;

export const isConfigured = Boolean(
  supabaseUrl &&
  primaryKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('YOUR_PROJECT_ID')
);

// Determine key type
export function getKeyType(): 'service_role' | 'publishable_anon' | 'none' {
  if (!primaryKey) return 'none';
  if (serviceRoleKey && (serviceRoleKey.startsWith('sb_secret_') || serviceRoleKey.includes('service_role'))) {
    return 'service_role';
  }
  // If serviceRoleKey was set to sb_publishable..., it is actually an anon key
  if (primaryKey.startsWith('sb_publish') || primaryKey.startsWith('pk_')) {
    return 'publishable_anon';
  }
  try {
    const parts = primaryKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.role === 'service_role') return 'service_role';
      if (payload.role === 'anon') return 'publishable_anon';
    }
  } catch {
    // Ignore parse error
  }
  return serviceRoleKey ? 'service_role' : 'publishable_anon';
}

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, primaryKey, {
      auth: { persistSession: false },
    })
  : null;

// Track sync diagnostics
export interface SupabaseSyncState {
  isConfigured: boolean;
  url: string;
  keyType: 'service_role' | 'publishable_anon' | 'none';
  hasServiceRoleKey: boolean;
  lastSyncAttempt?: string;
  lastSyncSuccess?: string;
  lastSyncError?: string;
  lastErrorCode?: string;
  isRlsBlocked: boolean;
  totalBookingsInDb: number;
  totalVehiclesInDb: number;
  totalVendorsInDb: number;
  totalInvoicesInDb: number;
}

const syncState: SupabaseSyncState = {
  isConfigured,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 24)}...` : 'Not configured',
  keyType: getKeyType(),
  hasServiceRoleKey: getKeyType() === 'service_role',
  isRlsBlocked: false,
  totalBookingsInDb: 0,
  totalVehiclesInDb: 0,
  totalVendorsInDb: 0,
  totalInvoicesInDb: 0,
};

export function getSyncState(): SupabaseSyncState {
  return { ...syncState };
}

/**
 * Maps an internal Booking object to public.bookings schema in Supabase
 */
export function mapBookingToRow(b: Booking) {
  return {
    id: b.id,
    reference_number: b.referenceNumber,
    vehicle_id: b.vehicleId,
    vendor_id: b.vendorId,
    customer_name: b.customerName,
    customer_phone: b.customerPhone,
    customer_whatsapp: b.customerWhatsapp,
    customer_email: b.customerEmail,
    pickup_datetime: b.pickupDatetime,
    return_datetime: b.returnDatetime,
    pickup_location: b.pickupLocation,
    dropoff_location: b.dropoffLocation,
    hotel_or_delivery_address: b.hotelOrDeliveryAddress || null,
    special_requests: b.specialRequests || null,
    days_count: b.daysCount,
    daily_rate: b.dailyRate,
    subtotal_amount: b.subtotalAmount,
    delivery_fee: b.deliveryFee,
    security_deposit: b.securityDeposit,
    total_estimated_amount: b.totalEstimatedAmount,
    rental_calculation_mode: b.rentalCalculationMode || null,
    rental_start_time: b.rentalStartTime || null,
    rental_end_time: b.rentalEndTime || null,
    chargeable_days: b.chargeableDays || null,
    extra_hours: b.extraHours || null,
    late_fee: b.lateFee || null,
    estimated_total: b.estimatedTotal || null,
    final_total: b.finalTotal || null,
    status: b.status,
    price_snapshot: b.priceSnapshot,
    direct_link_id: b.directLinkId || null,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
}

/**
 * Maps a Supabase row back to internal Booking format
 */
export function mapRowToBooking(row: any, docs: BookingDocument[] = []): Booking {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    vehicleId: row.vehicle_id,
    vendorId: row.vendor_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerWhatsapp: row.customer_whatsapp || row.customer_phone,
    customerEmail: row.customer_email,
    hotelOrDeliveryAddress: row.hotel_or_delivery_address || undefined,
    specialRequests: row.special_requests || undefined,
    pickupDatetime: row.pickup_datetime,
    returnDatetime: row.return_datetime,
    pickupLocation: row.pickup_location,
    dropoffLocation: row.dropoff_location,
    daysCount: Number(row.days_count),
    dailyRate: Number(row.daily_rate),
    subtotalAmount: Number(row.subtotal_amount),
    deliveryFee: Number(row.delivery_fee || 0),
    securityDeposit: Number(row.security_deposit || 0),
    totalEstimatedAmount: Number(row.total_estimated_amount),
    priceSnapshot: row.price_snapshot || {
      dailyRate: Number(row.daily_rate),
      daysCount: Number(row.days_count),
      subtotalAmount: Number(row.subtotal_amount),
      deliveryFee: Number(row.delivery_fee || 0),
      securityDeposit: Number(row.security_deposit || 0),
      totalEstimatedAmount: Number(row.total_estimated_amount),
      durationRule: '24-hour block interval',
    },
    status: row.status || 'pending',
    directLinkId: row.direct_link_id || undefined,
    documents: docs,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

/**
 * Saves a new or updated booking into Supabase
 */
export async function saveBookingToSupabase(booking: Booking): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  isRlsBlocked?: boolean;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  syncState.lastSyncAttempt = new Date().toISOString();

  try {
    const row = mapBookingToRow(booking);
    
    // Prepare candidate rows: standard row, and FK fallback row (with null vehicle/vendor if not yet in DB)
    const fallbackRow = {
      ...row,
      vehicle_id: null,
      vendor_id: null,
      price_snapshot: {
        ...(typeof row.price_snapshot === 'object' ? row.price_snapshot : {}),
        vehicleDetails: booking.vehicle ? {
          id: booking.vehicle.id,
          name: booking.vehicle.name,
          category: booking.vehicle.category,
          brand: booking.vehicle.brand,
          model: booking.vehicle.model,
        } : undefined,
      },
    };

    // Try upsert first
    let { error: bookingErr } = await supabase
      .from('bookings')
      .upsert(row, { onConflict: 'id' });

    // If upsert hits USING expression (due to UPDATE RLS policy), attempt direct INSERT
    if (bookingErr && (bookingErr.message.includes('USING expression') || bookingErr.code === '42501')) {
      const insRes = await supabase.from('bookings').insert(row);
      bookingErr = insRes.error;
    }

    // If foreign key constraint fails because vehicle/vendor hasn't been synced to Supabase yet
    if (bookingErr && (bookingErr.code === '23503' || bookingErr.message.includes('foreign key constraint'))) {
      console.warn(`[Supabase] Vehicle or Vendor foreign key missing. Retrying with standalone booking row...`);
      // Try upsert fallback
      let retry = await supabase.from('bookings').upsert(fallbackRow, { onConflict: 'id' });
      // If upsert hits USING expression, try insert fallback
      if (retry.error && (retry.error.message.includes('USING expression') || retry.error.code === '42501')) {
        retry = await supabase.from('bookings').insert(fallbackRow);
      }
      bookingErr = retry.error;
    }

    if (bookingErr) {
      syncState.lastSyncError = bookingErr.message;
      syncState.lastErrorCode = bookingErr.code;
      if (bookingErr.code === '42501' || bookingErr.message.includes('row-level security')) {
        syncState.isRlsBlocked = true;
        console.warn('⚠️ Supabase sync warning: Row-Level Security (RLS) is blocking inserts on table "bookings".');
      }
      return {
        success: false,
        error: bookingErr.message,
        code: bookingErr.code,
        isRlsBlocked: bookingErr.code === '42501' || bookingErr.message.includes('row-level security'),
      };
    } else {
      syncState.isRlsBlocked = false;
      syncState.lastSyncError = null;
    }

    // Save document metadata if any
    if (booking.documents && booking.documents.length > 0) {
      const docRows = booking.documents.map(d => ({
        id: d.id,
        booking_id: booking.id,
        doc_type: d.docType,
        id_proof_type: d.idProofType,
        storage_path: d.storagePath,
        file_name: d.fileName,
        file_size_bytes: d.fileSizeBytes,
        mime_type: d.mimeType,
        uploaded_at: d.uploadedAt,
      }));

      const { error: docErr } = await supabase
        .from('booking_documents')
        .upsert(docRows, { onConflict: 'id' });

      if (docErr) {
        console.warn('⚠️ Supabase document sync notice:', docErr.message);
      }
    }

    syncState.lastSyncSuccess = new Date().toISOString();
    syncState.lastSyncError = undefined;
    syncState.isRlsBlocked = false;
    syncState.totalBookingsInDb += 1;

    console.log(`✅ Successfully saved booking ${booking.referenceNumber} to Supabase bookings table.`);
    return { success: true };
  } catch (err: any) {
    syncState.lastSyncError = err.message || 'Unknown network error';
    return { success: false, error: err.message };
  }
}

/**
 * Updates status of an existing booking in Supabase
 */
export async function updateBookingStatusInSupabase(
  bookingId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      syncState.lastSyncError = error.message;
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all bookings from Supabase
 */
export async function fetchBookingsFromSupabase(): Promise<{
  success: boolean;
  bookings: Booking[];
  error?: string;
}> {
  if (!supabase) return { success: false, bookings: [], error: 'Supabase not configured' };

  try {
    const { data: bookingRows, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      syncState.lastSyncError = error.message;
      return { success: false, bookings: [], error: error.message };
    }

    syncState.totalBookingsInDb = bookingRows?.length || 0;

    // Fetch documents
    const { data: docRows } = await supabase.from('booking_documents').select('*');
    const docsByBookingId = new Map<string, BookingDocument[]>();
    if (docRows) {
      for (const d of docRows) {
        const list = docsByBookingId.get(d.booking_id) || [];
        list.push({
          id: d.id,
          bookingId: d.booking_id,
          docType: d.doc_type,
          idProofType: d.id_proof_type,
          storagePath: d.storage_path,
          fileName: d.file_name,
          fileSizeBytes: d.file_size_bytes,
          mimeType: d.mime_type,
          uploadedAt: d.uploaded_at,
        });
        docsByBookingId.set(d.booking_id, list);
      }
    }

    const list: Booking[] = (bookingRows || []).map(row =>
      mapRowToBooking(row, docsByBookingId.get(row.id) || [])
    );

    return { success: true, bookings: list };
  } catch (err: any) {
    return { success: false, bookings: [], error: err.message };
  }
}

/**
 * Checks live connection and row counts
 */
export async function refreshSupabaseMetrics(): Promise<SupabaseSyncState> {
  if (!supabase) return syncState;

  try {
    // Count bookings
    const { count: bCount, error: bErr } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    if (!bErr && bCount !== null) {
      syncState.totalBookingsInDb = bCount;
    }

    // Count vehicles
    const { count: vCount, error: vErr } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });
    if (!vErr && vCount !== null) {
      syncState.totalVehiclesInDb = vCount;
    }

    // Count vendors
    const { count: venCount, error: venErr } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });
    if (!venErr && venCount !== null) {
      syncState.totalVendorsInDb = venCount;
    }

    // Count invoices
    try {
      const { count: invCount, error: invErr } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });
      if (!invErr && invCount !== null) {
        syncState.totalInvoicesInDb = invCount;
      }
    } catch {
      // Table might not exist yet before migration
    }

    // Test write permission via dry-run probe
    const { error: probeErr } = await supabase.from('bookings').insert([{}]);
    if (probeErr && (probeErr.code === '42501' || probeErr.message.includes('row-level security'))) {
      syncState.isRlsBlocked = true;
      syncState.lastSyncError = 'Row-Level Security (RLS) policy blocks inserts on bookings table.';
      syncState.lastErrorCode = probeErr.code;
    } else {
      syncState.isRlsBlocked = false;
    }
  } catch (err: any) {
    syncState.lastSyncError = err.message;
  }

  return getSyncState();
}

export async function saveVendorToSupabase(vendor: Vendor): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const vendorRow = {
      id: vendor.id,
      user_id: vendor.userId,
      business_name: vendor.businessName,
      vendor_name: vendor.vendorName,
      phone: vendor.phone,
      whatsapp: vendor.whatsapp,
      email: vendor.email,
      service_location: vendor.serviceLocation,
      status: vendor.status,
      notes: vendor.notes || null,
      rental_calculation_mode: vendor.rentalCalculationMode || '24_hour',
      day_rental_start_time: vendor.dayRentalStartTime || '07:00',
      day_rental_end_time: vendor.dayRentalEndTime || '19:00',
      grace_period_minutes: vendor.gracePeriodMinutes || 0,
      late_return_policy: vendor.lateReturnPolicy || 'extra_hour',
      extra_hour_price: vendor.extraHourPrice || 0,
      custom_late_fee_amount: vendor.customLateFeeAmount || 0,
      overnight_rental_allowed: vendor.overnightRentalAllowed ?? true,
      created_at: vendor.createdAt,
      is_deleted: vendor.isDeleted ?? false,
      deleted_at: vendor.deletedAt || null,
      deleted_by: vendor.deletedBy || null,
    };

    const { error } = await supabase.from('vendors').upsert(vendorRow, { onConflict: 'id' });
    if (error) throw error;

    // Synchronize approval_status in vendor_profiles if user_id or email matches
    try {
      const mappedApprovalStatus = (vendor.status === 'approved' && !vendor.isDeleted) ? 'approved' : 
        (vendor.status === 'suspended') ? 'suspended' : 
        (vendor.status === 'rejected') ? 'rejected' : 
        (vendor.status === 'inactive' || vendor.isDeleted) ? 'suspended' : 'pending';

      if (vendor.userId) {
        await supabase
          .from('vendor_profiles')
          .update({ approval_status: mappedApprovalStatus })
          .eq('user_id', vendor.userId);
      }
      if (vendor.id && vendor.id.startsWith('profile-')) {
        const pId = vendor.id.replace('profile-', '');
        await supabase
          .from('vendor_profiles')
          .update({ approval_status: mappedApprovalStatus })
          .eq('id', pId);
      }
      if (vendor.email) {
        await supabase
          .from('vendor_profiles')
          .update({ approval_status: mappedApprovalStatus })
          .ilike('email', vendor.email);
      }
    } catch {
      // vendor_profiles might not exist yet or user not linked
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Permanently removes all data for a vendor from Supabase tables:
 * - vehicles belonging to this vendor
 * - unlinks or cleans up booking references
 * - vendor invoices
 * - vendor row in public.vendors
 * - vendor profile in public.vendor_profiles
 */
export async function deleteVendorPermanentlyFromSupabase(
  vendorId: string,
  userId?: string,
  email?: string
): Promise<{ success: boolean; deletedVehiclesCount: number; error?: string }> {
  if (!supabase) return { success: true, deletedVehiclesCount: 0 };

  try {
    const vendorIdsToMatch = Array.from(new Set([vendorId, ...(userId ? [userId] : [])]));

    // 1. Unlink vendor_id on bookings so historical booking records are preserved safely
    for (const vid of vendorIdsToMatch) {
      try {
        await supabase.from('bookings').update({ vendor_id: null }).eq('vendor_id', vid);
      } catch (bErr: any) {
        console.warn(`[Supabase] Notice unlinking bookings for vendor ${vid}:`, bErr.message);
      }
    }

    // 2. Delete the vendor from the vendors table. PostgreSQL ON DELETE CASCADE automatically deletes all related vehicles.
    for (const vid of vendorIdsToMatch) {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vid);

      if (error) {
        console.error('Vendor deletion failed:', error);
        throw error;
      }
    }

    if (email) {
      await supabase.from('vendors').delete().ilike('email', email);
    }

    // 3. Delete from public.vendor_profiles table
    try {
      if (vendorId.startsWith('profile-')) {
        const pId = vendorId.replace('profile-', '');
        await supabase.from('vendor_profiles').delete().eq('id', pId);
      }
      if (userId) {
        await supabase.from('vendor_profiles').delete().eq('user_id', userId);
      }
      if (email) {
        await supabase.from('vendor_profiles').delete().ilike('email', email);
      }
    } catch (vpErr: any) {
      console.warn(`[Supabase] Notice deleting row from vendor_profiles:`, vpErr.message);
    }

    return { success: true, deletedVehiclesCount: 0 };
  } catch (err: any) {
    console.error('[Supabase] Error deleting vendor permanently:', err.message);
    return { success: false, deletedVehiclesCount: 0, error: err.message };
  }
}

export async function fetchVendorsFromSupabase(): Promise<{ success: boolean; vendors: Vendor[]; error?: string }> {
  if (!supabase) return { success: false, vendors: [], error: 'Supabase not configured' };

  try {
    const { data: rows, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: true });
    if (error) throw error;

    const list: Vendor[] = (rows || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      vendorName: row.vendor_name,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      serviceLocation: row.service_location,
      status: row.status,
      notes: row.notes || undefined,
      vehicleCount: 0,
      createdAt: row.created_at,
      isDeleted: row.is_deleted,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    }));

    return { success: true, vendors: list };
  } catch (err: any) {
    return { success: false, vendors: [], error: err.message };
  }
}

export async function fetchAllVendorsCombined(): Promise<Vendor[]> {
  const combinedMap = new Map<string, Vendor>();

  // 1. First load from memory/hardcoded fallback
  // Handled in caller

  // 2. Load from Supabase vendors table
  if (supabase) {
    try {
      const { vendors: supaVendors } = await fetchVendorsFromSupabase();
      for (const v of supaVendors) {
        combinedMap.set(v.id, v);
      }
    } catch (e: any) {
      console.warn('[Supabase] Failed to fetch vendors table:', e.message);
    }

    // 3. Also load from Supabase vendor_profiles table (new registrations)
    try {
      const { data: profiles, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(profiles)) {
        for (const p of profiles) {
          const profileId = `profile-${p.id}`;
          const existing = Array.from(combinedMap.values()).find(
            v => (v.userId && v.userId === p.user_id) || (p.email && v.email.toLowerCase() === p.email.toLowerCase())
          );

          if (existing) {
            // Keep status in sync with vendor_profiles, but preserve administrative actions:
            // If the vendor has been suspended, deactivated, removed, or rejected by admin, DO NOT revert to 'approved'
            const adminLockedStatuses = ['suspended', 'inactive', 'rejected'];
            if (!adminLockedStatuses.includes(existing.status) && !existing.isDeleted) {
              if (p.approval_status) {
                existing.status = p.approval_status as any;
              }
            } else if (p.approval_status && adminLockedStatuses.includes(p.approval_status)) {
              // If vendor_profiles itself holds a suspended/rejected status, reflect it
              existing.status = p.approval_status as any;
            }
            existing.userId = p.user_id;
            if (p.full_name) existing.vendorName = p.full_name;
            if (p.business_name) existing.businessName = p.business_name;
          } else {
            // Add as a registered vendor awaiting admin approval
            const newVendorFromProfile: Vendor = {
              id: profileId,
              userId: p.user_id,
              businessName: p.business_name || 'Vendor Partner',
              vendorName: p.full_name || 'Partner',
              phone: p.phone || '',
              whatsapp: p.whatsapp || p.phone || '',
              email: p.email || (p.user_id ? `${p.user_id.slice(0, 8)}@vendor.goamate` : 'unknown@goamate.com'),
              serviceLocation: p.area ? `${p.area}${p.address ? `, ${p.address}` : ''}` : 'Margao, Goa',
              status: (p.approval_status as any) || 'pending',
              vehicleCount: 0,
              createdAt: p.created_at || new Date().toISOString(),
            };
            combinedMap.set(profileId, newVendorFromProfile);
          }
        }
      }
    } catch (profileErr: any) {
      console.warn('[Supabase] Notice querying vendor_profiles:', profileErr.message);
    }
  }

  return Array.from(combinedMap.values());
}

export async function saveVehicleToSupabase(vehicle: Vehicle): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const row = {
      id: vehicle.id,
      vendor_id: vehicle.vendorId,
      name: vehicle.name,
      category: vehicle.category,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      registration_number: vehicle.registrationNumber,
      daily_price: vehicle.dailyPrice,
      security_deposit: vehicle.securityDeposit,
      fuel_type: vehicle.fuelType,
      transmission: vehicle.transmission,
      seats: vehicle.seats,
      engine_capacity_cc: vehicle.engineCapacityCc,
      cover_image: vehicle.coverImage,
      location: vehicle.location,
      pickup_options: vehicle.pickupOptions,
      features: vehicle.features,
      description: vehicle.description,
      fuel_policy: vehicle.fuelPolicy,
      mileage_policy: vehicle.mileagePolicy,
      status: vehicle.status,
      is_active: vehicle.isActive,
      created_at: vehicle.createdAt,
      updated_at: vehicle.updatedAt,
      is_deleted: vehicle.isDeleted ?? false,
      deleted_at: vehicle.deletedAt || null,
      deleted_by: vehicle.deletedBy || null,
    };

    const { error } = await supabase.from('vehicles').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error saving vehicle:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exception saving vehicle:', err.message);
    return { success: false, error: err.message };
  }
}

export async function fetchVehiclesFromSupabase(): Promise<{ success: boolean; vehicles: Vehicle[]; error?: string }> {
  if (!supabase) return { success: false, vehicles: [], error: 'Supabase not configured' };

  try {
    const { data: rows, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const list: Vehicle[] = (rows || []).map((row: any) => ({
      id: row.id,
      vendorId: row.vendor_id,
      vendorBusinessName: '', // Will be matched locally or in join
      name: row.name,
      category: row.category,
      brand: row.brand,
      model: row.model,
      year: row.year,
      registrationNumber: '',
      dailyPrice: row.daily_price,
      securityDeposit: row.security_deposit,
      fuelType: row.fuel_type,
      transmission: row.transmission,
      seats: row.seats || (row.category === 'car' ? 5 : 2),
      description: row.description || '',
      fuelPolicy: row.fuel_policy || 'same_to_same',
      mileagePolicy: row.mileage_policy || 'unlimited',
      coverImage: row.cover_image,
      location: row.location,
      pickupOptions: row.pickup_options,
      features: row.features,
      status: row.status,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      images: [],
    }));

    return { success: true, vehicles: list };
  } catch (err: any) {
    return { success: false, vehicles: [], error: err.message };
  }
}

/**
 * Seeds local fleet and vendors into Supabase if empty
 */
export async function seedSupabaseFleet(vehicles: Vehicle[], vendors: Vendor[]): Promise<{
  success: boolean;
  insertedVehicles: number;
  insertedVendors: number;
  error?: string;
}> {
  if (!supabase) return { success: false, insertedVehicles: 0, insertedVendors: 0, error: 'Not configured' };

  try {
    // Seed vendors first
    const vendorRows = vendors.map(v => ({
      id: v.id,
      user_id: v.userId,
      business_name: v.businessName,
      vendor_name: v.vendorName,
      phone: v.phone,
      whatsapp: v.whatsapp,
      email: v.email,
      service_location: v.serviceLocation,
      status: v.status,
      notes: v.notes || null,
      created_at: v.createdAt,
    }));

    const { error: venErr } = await supabase
      .from('vendors')
      .upsert(vendorRows, { onConflict: 'id' });

    if (venErr) {
      console.warn('⚠️ Supabase vendors seed notice:', venErr.message);
    }

    // Seed vehicles
    const vehicleRows = vehicles.map(v => ({
      id: v.id,
      vendor_id: v.vendorId,
      name: v.name,
      category: v.category,
      brand: v.brand,
      model: v.model,
      year: v.year,
      daily_price: v.dailyPrice,
      security_deposit: v.securityDeposit,
      fuel_type: v.fuelType,
      transmission: v.transmission,
      cover_image: v.coverImage,
      location: v.location,
      pickup_options: v.pickupOptions,
      features: v.features,
      status: v.status,
      is_active: v.isActive,
      created_at: v.createdAt,
      updated_at: v.updatedAt,
    }));

    const { error: vehErr } = await supabase
      .from('vehicles')
      .upsert(vehicleRows, { onConflict: 'id' });

    if (vehErr) {
      console.warn('⚠️ Supabase vehicles seed notice:', vehErr.message);
      return {
        success: false,
        insertedVehicles: 0,
        insertedVendors: vendorRows.length,
        error: vehErr.message,
      };
    }

    await refreshSupabaseMetrics();
    return {
      success: true,
      insertedVehicles: vehicleRows.length,
      insertedVendors: vendorRows.length,
    };
  } catch (err: any) {
    return { success: false, insertedVehicles: 0, insertedVendors: 0, error: err.message };
  }
}

/**
 * Maps an internal Invoice object to public.invoices schema in Supabase
 */
export function mapInvoiceToRow(inv: Invoice) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    booking_id: inv.bookingId,
    booking_reference: inv.bookingReference,
    vendor_id: inv.vendorId,
    customer_id: inv.customerId || null,
    vehicle_id: inv.vehicleId || null,
    invoice_year: inv.invoiceYear,
    invoice_date: inv.invoiceDate,
    subtotal_amount: inv.subtotalAmount,
    discount_amount: inv.discountAmount || 0,
    extra_charges: inv.extraCharges || 0,
    tax_rate_percent: inv.taxRatePercent || 0,
    tax_amount: inv.taxAmount || 0,
    security_deposit: inv.securityDeposit || 0,
    total_amount: inv.totalAmount,
    amount_paid: inv.amountPaid || 0,
    amount_due: inv.amountDue,
    payment_status: inv.paymentStatus,
    payment_method: inv.paymentMethod,
    invoice_status: inv.invoiceStatus,
    items: inv.items || [],
    customer_details: inv.customerDetails || {},
    vehicle_details: inv.vehicleDetails || {},
    rental_details: inv.rentalDetails || {},
    documents: inv.documents || [],
    customer_pdf_path: inv.customerPdfPath || null,
    internal_pdf_path: inv.internalPdfPath || null,
    notes: inv.notes || null,
    issued_at: inv.issuedAt || null,
    created_by: inv.createdBy || null,
    created_at: inv.createdAt,
    updated_at: inv.updatedAt,
  };
}

/**
 * Maps a public.invoices Supabase row to internal Invoice object
 */
export function mapRowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    bookingId: row.booking_id,
    bookingReference: row.booking_reference,
    vendorId: row.vendor_id,
    customerId: row.customer_id || undefined,
    vehicleId: row.vehicle_id || undefined,
    invoiceYear: row.invoice_year,
    invoiceDate: row.invoice_date,
    subtotalAmount: Number(row.subtotal_amount) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    extraCharges: Number(row.extra_charges) || 0,
    taxRatePercent: Number(row.tax_rate_percent) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    securityDeposit: Number(row.security_deposit) || 0,
    totalAmount: Number(row.total_amount) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    amountDue: Number(row.amount_due) || 0,
    paymentStatus: row.payment_status || 'pending',
    paymentMethod: row.payment_method || 'Cash',
    invoiceStatus: row.invoice_status || 'draft',
    items: row.items || [],
    customerDetails: row.customer_details || { name: '', phone: '', email: '' },
    vehicleDetails: row.vehicle_details || { type: '', name: '', brand: '', model: '' },
    rentalDetails: row.rental_details || { pickupLocation: '', dropoffLocation: '', pickupDatetime: '', returnDatetime: '', totalDurationDays: 1, dailyRate: 0 },
    documents: row.documents || [],
    customerPdfPath: row.customer_pdf_path || undefined,
    internalPdfPath: row.internal_pdf_path || undefined,
    notes: row.notes || undefined,
    issuedAt: row.issued_at || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Saves or updates an Invoice in Supabase
 */
export async function saveInvoiceToSupabase(invoice: Invoice): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const row = mapInvoiceToRow(invoice);
    const fallbackRow = {
      ...row,
      booking_id: null,
      vehicle_id: null,
      vendor_id: null,
    };

    let { error } = await supabase.from('invoices').upsert(row, { onConflict: 'id' });

    if (error && (error.code === '23503' || error.message.includes('foreign key constraint'))) {
      console.warn(`[Supabase] Invoice foreign key missing. Retrying with unlinked invoice fallback row...`);
      const retry = await supabase.from('invoices').upsert(fallbackRow, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.warn('⚠️ Supabase saveInvoice error:', error.message);
      return { success: false, error: error.message };
    }
    console.log(`✅ Successfully saved invoice ${invoice.invoiceNumber} to Supabase invoices table.`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Updates an existing invoice in Supabase
 */
export async function updateInvoiceInSupabase(
  invoiceId: string,
  updates: Partial<Invoice>
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.paymentStatus !== undefined) updatePayload.payment_status = updates.paymentStatus;
    if (updates.paymentMethod !== undefined) updatePayload.payment_method = updates.paymentMethod;
    if (updates.invoiceStatus !== undefined) updatePayload.invoice_status = updates.invoiceStatus;
    if (updates.amountPaid !== undefined) updatePayload.amount_paid = updates.amountPaid;
    if (updates.amountDue !== undefined) updatePayload.amount_due = updates.amountDue;
    if (updates.notes !== undefined) updatePayload.notes = updates.notes;
    if (updates.customerPdfPath !== undefined) updatePayload.customer_pdf_path = updates.customerPdfPath;
    if (updates.internalPdfPath !== undefined) updatePayload.internal_pdf_path = updates.internalPdfPath;

    const { error } = await supabase.from('invoices').update(updatePayload).eq('id', invoiceId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all invoices from Supabase
 */
export async function fetchInvoicesFromSupabase(): Promise<{ success: boolean; invoices: Invoice[]; error?: string }> {
  if (!supabase) return { success: false, invoices: [], error: 'Supabase not configured' };

  try {
    const { data: rows, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list: Invoice[] = (rows || []).map(mapRowToInvoice);
    return { success: true, invoices: list };
  } catch (err: any) {
    return { success: false, invoices: [], error: err.message };
  }
}
