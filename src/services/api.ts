import {
  Vehicle,
  Vendor,
  Booking,
  BookingPriceBreakdown,
  SiteSettings,
  ServiceArea,
  AuditLog,
  BookingFormLink,
  GuestBookingSubmission,
  BookingStatus,
  Invoice,
} from '../types';

export const api = {
  // Public
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async getServiceAreas(): Promise<ServiceArea[]> {
    const res = await fetch('/api/service-areas');
    if (!res.ok) throw new Error('Failed to load service areas');
    return res.json();
  },

  async getVehicles(params?: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    transmission?: string;
    fuelType?: string;
    seats?: number;
    pickupDate?: string;
    returnDate?: string;
  }): Promise<Vehicle[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.location && params.location !== 'all') query.set('location', params.location);
    if (params?.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params?.transmission && params.transmission !== 'all') query.set('transmission', params.transmission);
    if (params?.fuelType && params.fuelType !== 'all') query.set('fuelType', params.fuelType);
    if (params?.seats) query.set('seats', params.seats.toString());
    if (params?.pickupDate) query.set('pickupDate', params.pickupDate);
    if (params?.returnDate) query.set('returnDate', params.returnDate);

    const res = await fetch(`/api/vehicles?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  async getVehicle(id: string): Promise<Vehicle> {
    const res = await fetch(`/api/vehicles/${id}`);
    if (!res.ok) throw new Error('Vehicle not found');
    return res.json();
  },

  async calculatePrice(data: {
    vehicleId: string;
    pickupDatetime: string;
    returnDatetime: string;
    pickupLocation: string;
  }): Promise<{ breakdown: BookingPriceBreakdown; vehicleName: string; category: string }> {
    const res = await fetch('/api/bookings/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to calculate pricing');
    return result;
  },

  async submitBooking(data: GuestBookingSubmission): Promise<{
    success: boolean;
    referenceNumber: string;
    booking: Partial<Booking>;
    message: string;
  }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit booking');
    return result;
  },

  async trackBooking(referenceNumber: string, phone?: string): Promise<Partial<Booking>> {
    const q = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    const res = await fetch(`/api/bookings/track/${referenceNumber}${q}`);
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Booking not found');
    return result;
  },

  async resolveDirectLink(token: string): Promise<{
    valid: boolean;
    vehicle: Vehicle;
    presetPickupDatetime?: string;
    presetReturnDatetime?: string;
  }> {
    const res = await fetch(`/api/direct-links/${token}`);
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Invalid direct link');
    return result;
  },

  // Vendor
  async vendorRegister(data: {
    vendorName: string;
    businessName: string;
    phone: string;
    whatsapp: string;
    email: string;
    serviceLocation: string;
    password?: string;
  }): Promise<{ success: boolean; vendor: Vendor; message: string }> {
    const res = await fetch('/api/vendor/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to register');
    return result;
  },

  async vendorLogin(email: string, password?: string): Promise<{ success: boolean; token: string; vendor: Vendor }> {
    const res = await fetch('/api/vendor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    return result;
  },

  async getVendorMe(token: string) {
    const res = await fetch('/api/vendor/me', {
      headers: { Authorization: token },
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Unauthorized');
    return result;
  },


  async updateVendorSettings(token: string, settings: any): Promise<{ success: boolean, vendor: Vendor }> {
    const res = await fetch('/api/vendor/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(settings),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update settings');
    return result;
  },

  async getVendorVehicles(token: string): Promise<Vehicle[]> {
    const res = await fetch('/api/vendor/vehicles', {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error('Failed to load vehicles');
    return res.json();
  },

  async createVendorVehicle(token: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const res = await fetch('/api/vendor/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(vehicle),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create vehicle');
    return result;
  },

  async updateVendorVehicleAvailability(token: string, id: string, isActive: boolean): Promise<{ success: boolean, vehicle: Vehicle }> {
    const res = await fetch(`/api/vendor/vehicles/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ isActive })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update vehicle availability');
    return result;
  },

  async getVendorBookings(token: string): Promise<Booking[]> {
    const res = await fetch('/api/vendor/bookings', {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error('Failed to load bookings');
    return res.json();
  },

  async createVendorDirectLink(token: string, data: { vehicleId: string; presetPickupDatetime?: string; presetReturnDatetime?: string; expiryDays?: number }): Promise<BookingFormLink> {
    const res = await fetch('/api/vendor/direct-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to generate link');
    return result;
  },

  async getVendorDirectLinks(token: string): Promise<BookingFormLink[]> {
    const res = await fetch('/api/vendor/direct-links', {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error('Failed to load links');
    return res.json();
  },

  async revokeVendorDirectLink(token: string, linkId: string): Promise<void> {
    const res = await fetch(`/api/vendor/direct-links/${linkId}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error('Failed to revoke link');
  },

  // Admin
  async adminLogin(secretToken: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretToken }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Admin authorization failed');
    return result;
  },

  async getAdminStats(token: string) {
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async getAdminBookings(token: string): Promise<Booking[]> {
    const res = await fetch('/api/admin/bookings', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('Failed to load bookings');
    return res.json();
  },

  async updateBookingStatus(id: string, status: BookingStatus, reason?: string, token?: string): Promise<Booking> {
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-token': token } : {}),
      },
      body: JSON.stringify({ status, reason }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update booking status');
    return result.booking;
  },

  async getAdminVendors(token: string): Promise<Vendor[]> {
    const res = await fetch('/api/admin/vendors', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('Failed to load vendors');
    return res.json();
  },

  async getAdminVehicles(token: string): Promise<Vehicle[]> {
    const res = await fetch('/api/admin/vehicles', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('Failed to load vehicles');
    return res.json();
  },

  async updateVendorStatus(id: string, data: { status?: Vendor['status']; rejectionReason?: string; isDeleted?: boolean; reason?: string }, token?: string): Promise<Vendor> {
    const res = await fetch(`/api/admin/vendors/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-token': token } : {}),
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update vendor');
    return result.vendor;
  },

  async updateVehicleStatus(id: string, data: { status?: Vehicle['status']; isActive?: boolean; rejectionReason?: string; isDeleted?: boolean; reason?: string }, token?: string): Promise<Vehicle> {
    const res = await fetch(`/api/admin/vehicles/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-token': token } : {}),
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update vehicle');
    return result.vehicle;
  },

  async updateAdminSettings(settings: Partial<SiteSettings>, token: string): Promise<SiteSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify(settings),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update settings');
    return result.settings;
  },

  async getAdminAuditLogs(token: string): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/audit-logs', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  async getSecureDocPreview(id: string): Promise<{ id: string; fileName: string; mimeType: string; previewUrl: string }> {
    const res = await fetch(`/api/documents/${id}/preview`);
    if (!res.ok) throw new Error('Failed to load document preview');
    return res.json();
  },

  async getAdminSupabaseStatus(token: string): Promise<{
    metrics: any;
    localBookingsCount: number;
    localVehiclesCount: number;
    localVendorsCount: number;
    sqlHelper: string;
  }> {
    const res = await fetch('/api/admin/supabase-status', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('Failed to load Supabase database status');
    return res.json();
  },

  async syncAllToSupabase(token: string): Promise<{
    success: boolean;
    syncedBookings: number;
    failedBookings: number;
    fleetSynced: boolean;
    error?: string;
    metrics: any;
  }> {
    const res = await fetch('/api/admin/supabase-sync-all', {
      method: 'POST',
      headers: { 'x-admin-token': token },
    });
    return res.json();
  },

  // Invoices
  async getInvoiceForBooking(bookingId: string): Promise<{ hasInvoice: boolean; invoice?: Invoice }> {
    const res = await fetch(`/api/invoices/booking/${encodeURIComponent(bookingId)}`);
    if (!res.ok) throw new Error('Failed to check invoice for booking');
    return res.json();
  },

  async calculateInvoice(data: {
    bookingId?: string;
    daysCount?: number;
    dailyRate?: number;
    deliveryFee?: number;
    items?: any[];
    discountAmount?: number;
    taxRatePercent?: number;
    securityDeposit?: number;
    amountPaid?: number;
  }): Promise<any> {
    const res = await fetch('/api/invoices/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to calculate invoice amounts');
    return result;
  },

  async createInvoice(
    data: any,
    authOptions: { vendorToken?: string | null; adminToken?: string | null }
  ): Promise<{ success: boolean; invoice: Invoice; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authOptions.adminToken) {
      headers['x-admin-token'] = authOptions.adminToken;
    } else if (authOptions.vendorToken) {
      headers['Authorization'] = `Bearer ${authOptions.vendorToken}`;
      headers['x-vendor-id'] = authOptions.vendorToken;
    }

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to generate invoice');
    return result;
  },

  async getVendorInvoices(token: string): Promise<Invoice[]> {
    const res = await fetch('/api/vendor/invoices', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-vendor-id': token,
      },
    });
    if (!res.ok) throw new Error('Failed to load vendor invoices');
    return res.json();
  },

  async getAdminInvoices(token: string): Promise<Invoice[]> {
    const res = await fetch('/api/admin/invoices', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('Failed to load admin invoices');
    return res.json();
  },

  async getInvoice(id: string, copyType: 'customer' | 'internal' = 'customer'): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${encodeURIComponent(id)}?copy=${copyType}`);
    if (!res.ok) throw new Error('Invoice not found');
    return res.json();
  },

  async updateInvoice(
    id: string,
    updates: any,
    authOptions: { vendorToken?: string | null; adminToken?: string | null }
  ): Promise<{ success: boolean; invoice: Invoice }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authOptions.adminToken) {
      headers['x-admin-token'] = authOptions.adminToken;
    } else if (authOptions.vendorToken) {
      headers['Authorization'] = `Bearer ${authOptions.vendorToken}`;
      headers['x-vendor-id'] = authOptions.vendorToken;
    }

    const res = await fetch(`/api/invoices/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update invoice');
    return result;
  },

  async auditInvoiceDownload(id: string, copyType: 'customer' | 'internal' = 'customer'): Promise<{ success: boolean }> {
    const res = await fetch(`/api/invoices/${encodeURIComponent(id)}/audit-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copyType }),
    });
    return res.json().catch(() => ({ success: true }));
  },
};
