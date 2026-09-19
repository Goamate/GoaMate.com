import { supabase, isSupabaseConfigured } from './supabase';
import { VendorProfile, VendorApprovalStatus } from '../types';

export interface VendorAuthSession {
  user: any | null;
  profile: VendorProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Helper to get the current window origin dynamically for development redirects.
 * Does not hardcode a future production domain so it works seamlessly in AI Studio dev,
 * staging, and later when deployed to a custom domain.
 */
export function getAuthRedirectUrl(path: string = '/vendor/login'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

/**
 * Fetch vendor profile for an authenticated Supabase user
 */
export async function getVendorProfile(userId: string): Promise<VendorProfile | null> {
  if (!supabase) return null;

  try {
    // 1. Try querying vendor_profiles by user_id
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        full_name: data.full_name || '',
        business_name: data.business_name || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        address: data.address || '',
        area: data.area || data.location || '',
        approval_status: (data.approval_status || data.status || 'pending') as VendorApprovalStatus,
        created_at: data.created_at || new Date().toISOString(),
      };
    }

    // 2. Fallback: try querying vendors table by user_id or id
    const { data: vData } = await supabase
      .from('vendors')
      .select('*')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    if (vData) {
      return {
        id: vData.id,
        user_id: vData.user_id || userId,
        full_name: vData.vendor_name || '',
        business_name: vData.business_name || '',
        phone: vData.phone || '',
        whatsapp: vData.whatsapp || vData.phone || '',
        address: vData.service_location || '',
        area: vData.service_location || '',
        approval_status: (vData.status || 'pending') as VendorApprovalStatus,
        created_at: vData.created_at || new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.warn('[vendorAuth] Error fetching vendor profile:', err);
    return null;
  }
}

/**
 * Register a new vendor with Supabase Auth email/password signup
 * and create the initial vendor_profiles entry with approval_status = "pending".
 */
export async function registerVendorWithSupabase(data: {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  area: string;
  password: string;
}): Promise<{
  success: boolean;
  user: any;
  needsEmailVerification: boolean;
  message: string;
}> {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please check your environment variables.');
  }

  // Dynamic development redirect for email confirmation
  const emailRedirectTo = getAuthRedirectUrl('/vendor/login');

  // 1. Supabase Auth signup
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: data.fullName.trim(),
        business_name: data.businessName.trim(),
        phone: data.phone.trim(),
        whatsapp: data.whatsapp.trim(),
        address: data.address.trim(),
        area: data.area.trim(),
        role: 'vendor',
      },
    },
  });

  if (signUpError) {
    throw new Error(signUpError.message);
  }

  const authUser = authData.user;
  if (!authUser) {
    throw new Error('Could not create vendor account. Please try again.');
  }

  // 2. Insert into vendor_profiles (and sync to backend vendors table)
  // New vendor accounts must have approval_status = "pending"
  const profilePayload = {
    user_id: authUser.id,
    full_name: data.fullName.trim(),
    business_name: data.businessName.trim(),
    phone: data.phone.trim(),
    whatsapp: data.whatsapp.trim(),
    address: data.address.trim(),
    area: data.area.trim(),
    approval_status: 'pending' as const,
  };

  // Attempt insert directly into vendor_profiles
  const { error: profileError } = await supabase
    .from('vendor_profiles')
    .insert([profilePayload]);

  if (profileError) {
    console.warn('[vendorAuth] Direct vendor_profiles insert notice:', profileError.message);
    // If column names differ in database cache, try fallback with status/location
    try {
      await supabase.from('vendor_profiles').insert([{
        user_id: authUser.id,
        full_name: data.fullName.trim(),
        business_name: data.businessName.trim(),
        phone: data.phone.trim(),
        whatsapp: data.whatsapp.trim(),
        location: `${data.area}, ${data.address}`,
        status: 'pending',
      }]);
    } catch {
      // ignore fallback error
    }
  }

  // Also notify server backend to sync into GoaMate in-memory/vendors collection
  try {
    await fetch('/api/vendor/register-supabase-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authUser.id,
        fullName: data.fullName.trim(),
        businessName: data.businessName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        whatsapp: data.whatsapp.trim(),
        address: data.address.trim(),
        area: data.area.trim(),
      }),
    }).catch(() => {});
  } catch {
    // Ignore server sync failure, auth was successful
  }

  // Check if session exists immediately or email confirmation is required
  const hasSession = Boolean(authData.session);
  const needsEmailVerification = !hasSession || !authUser.email_confirmed_at;

  return {
    success: true,
    user: authUser,
    needsEmailVerification,
    message: 'Registration successful. Please check your email and verify your email address.',
  };
}

/**
 * Sign in a vendor using Supabase email/password
 */
export async function loginVendorWithSupabase(
  email: string,
  password: string
): Promise<{
  user: any;
  session: any;
  profile: VendorProfile | null;
}> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Authentication succeeded but no user data returned.');
  }

  // Check vendor_profiles record
  let profile = await getVendorProfile(data.user.id);

  // If profile does not exist yet (e.g., if profile creation was deferred), try to create pending profile from user_metadata
  if (!profile) {
    const meta = data.user.user_metadata || {};
    try {
      const fallbackProfile = {
        user_id: data.user.id,
        full_name: meta.full_name || 'Vendor Partner',
        business_name: meta.business_name || 'Fleet Partner',
        phone: meta.phone || '',
        whatsapp: meta.whatsapp || meta.phone || '',
        address: meta.address || '',
        area: meta.area || 'Goa',
        approval_status: 'pending' as const,
      };
      try {
        await supabase.from('vendor_profiles').insert([fallbackProfile]);
      } catch {
        // ignore
      }
      profile = await getVendorProfile(data.user.id);
    } catch {
      // Continue with null profile check
    }
  }

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

/**
 * Send password reset email via Supabase
 */
export async function sendVendorPasswordReset(email: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const redirectTo = getAuthRedirectUrl('/vendor/reset-password');

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Update password after user arrives from reset-password link
 */
export async function updateVendorPassword(newPassword: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Sign out vendor from Supabase
 */
export async function logoutVendor(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[vendorAuth] Sign out error:', err);
  }
}
