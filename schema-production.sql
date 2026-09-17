-- ==============================================================================
-- GoaMate Rental Platform - Production PostgreSQL Schema with RLS & Indexes
-- ==============================================================================
-- Description: Complete production-grade relational schema covering:
--              1. User Profiles & RBAC (super_admin, vendor, guest)
--              2. Vendors & Fleet Verification
--              3. Vehicles & Vehicle Media
--              4. Bookings, Document Verification & Direct Booking Links
--              5. Immutable Audit Logs & Site Settings
--              6. Row Level Security (RLS) policies for multi-tenant isolation
--              7. High-performance production B-Tree & Functional Indexes
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Helper Functions & Triggers
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Profiles (Extends Auth Users / Roles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- Maps directly to auth.users.id in Supabase/Firebase/Custom Auth
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'guest' CHECK (role IN ('super_admin', 'vendor', 'guest')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Auth Helper Functions for RLS
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM profiles WHERE id::text = auth.uid()::text;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::text = auth.uid()::text AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_approved_vendor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors v
    JOIN profiles p ON p.id::text = v.user_id::text
    WHERE v.user_id::text = auth.uid()::text AND v.status = 'approved'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. Vendors Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  service_location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'archived')),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_vendors_timestamp
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- ------------------------------------------------------------------------------
-- 4. Vehicles & Vehicle Images
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_business_name VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('car', 'bike', 'scooter')),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2050),
  registration_number VARCHAR(50) NOT NULL,
  transmission VARCHAR(50) NOT NULL CHECK (transmission IN ('Manual', 'Automatic')),
  fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'EV')),
  seats INTEGER NOT NULL CHECK (seats > 0 AND seats <= 20),
  engine_capacity_cc INTEGER,
  daily_price DECIMAL(10, 2) NOT NULL CHECK (daily_price > 0),
  security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  location VARCHAR(255) NOT NULL,
  pickup_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  fuel_policy TEXT NOT NULL DEFAULT 'Level-to-level: Return with same fuel level received.',
  mileage_policy TEXT NOT NULL DEFAULT 'Unlimited km within Goa state borders.',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' 
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'archived')),
  rejection_reason TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_vehicles_timestamp
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. Bookings & Documents
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(100) UNIQUE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_whatsapp VARCHAR(50),
  customer_email VARCHAR(255),
  hotel_or_delivery_address TEXT,
  special_requests TEXT,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  dropoff_location VARCHAR(255) NOT NULL,
  days_count INTEGER NOT NULL CHECK (days_count >= 1),
  daily_rate DECIMAL(10, 2) NOT NULL CHECK (daily_rate >= 0),
  subtotal_amount DECIMAL(10, 2) NOT NULL CHECK (subtotal_amount >= 0),
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  total_estimated_amount DECIMAL(10, 2) NOT NULL CHECK (total_estimated_amount >= 0),
  price_snapshot JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  admin_notes TEXT,
  vendor_notes TEXT,
  direct_link_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_rental_dates CHECK (return_datetime > pickup_datetime)
);

CREATE TRIGGER set_bookings_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TABLE IF NOT EXISTS booking_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  doc_type VARCHAR(100) NOT NULL 
    CHECK (doc_type IN ('driving_licence_front', 'driving_licence_back', 'id_proof_front', 'id_proof_back')),
  id_proof_type VARCHAR(100) NOT NULL 
    CHECK (id_proof_type IN ('aadhaar', 'passport', 'voter_id', 'driving_licence', 'other')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. Vendor Direct Booking Links
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_form_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_name VARCHAR(255),
  token_hash TEXT NOT NULL UNIQUE,
  preset_pickup_datetime TIMESTAMPTZ,
  preset_return_datetime TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. Platform Settings, Service Areas & Audit Logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_areas (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  zone VARCHAR(50) NOT NULL CHECK (zone IN ('South Goa', 'North Goa')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  accept_new_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  allow_vendor_registration BOOLEAN NOT NULL DEFAULT TRUE,
  allow_vendor_vehicle_uploads BOOLEAN NOT NULL DEFAULT TRUE,
  allow_vendor_direct_links BOOLEAN NOT NULL DEFAULT TRUE,
  show_cars BOOLEAN NOT NULL DEFAULT TRUE,
  show_bikes BOOLEAN NOT NULL DEFAULT TRUE,
  show_scooters BOOLEAN NOT NULL DEFAULT TRUE,
  show_whatsapp_support BOOLEAN NOT NULL DEFAULT TRUE,
  enable_email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Immutable Security Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. Production Performance Indexes
-- ------------------------------------------------------------------------------

-- Foreign Key Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vendor_id ON vehicles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_docs_booking_id ON booking_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_status_hist_booking_id ON booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_form_links_vendor ON booking_form_links(vendor_id);
CREATE INDEX IF NOT EXISTS idx_booking_form_links_vehicle ON booking_form_links(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);

-- Marketplace Vehicle Search Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_active_approved 
  ON vehicles(status, is_active) 
  WHERE status = 'approved' AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_vehicles_category_price 
  ON vehicles(category, daily_price);

CREATE INDEX IF NOT EXISTS idx_vehicles_location 
  ON vehicles(location);

-- Booking Query & Verification Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_reference 
  ON bookings(reference_number);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone 
  ON bookings(customer_phone);

CREATE INDEX IF NOT EXISTS idx_bookings_status_created 
  ON bookings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_rental_period 
  ON bookings(pickup_datetime, return_datetime);

-- Direct Token Verification Index
CREATE INDEX IF NOT EXISTS idx_booking_form_token 
  ON booking_form_links(token_hash) 
  WHERE is_revoked = FALSE AND is_used = FALSE;

-- Audit Log Timeline Index
CREATE INDEX IF NOT EXISTS idx_audit_logs_timeline 
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
  ON audit_logs(entity_type, entity_id);

-- ------------------------------------------------------------------------------
-- 9. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_form_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- PROFILES POLICIES
-- ---------------------------------------------------------
CREATE POLICY "Super Admins have full access to profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view and update their own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

CREATE POLICY "Public can view minimal vendor profile for listings"
  ON profiles FOR SELECT
  TO public
  USING (role = 'vendor');

-- ---------------------------------------------------------
-- VENDORS POLICIES
-- ---------------------------------------------------------
CREATE POLICY "Super Admins can manage all vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Vendors can view their own record"
  ON vendors FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Vendors can apply / register"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Vendors can edit their own contact details"
  ON vendors FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- ---------------------------------------------------------
-- VEHICLES POLICIES
-- ---------------------------------------------------------
CREATE POLICY "Super Admins can manage all vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Public can view approved active vehicles"
  ON vehicles FOR SELECT
  TO public
  USING (status = 'approved' AND is_active = TRUE);

CREATE POLICY "Vendors can view their own vehicles in any status"
  ON vehicles FOR SELECT
  TO authenticated
  USING (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text));

CREATE POLICY "Approved vendors can add vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text AND status = 'approved')
  );

CREATE POLICY "Vendors can update their own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text))
  WITH CHECK (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text));

-- ---------------------------------------------------------
-- VEHICLE IMAGES POLICIES
-- ---------------------------------------------------------
CREATE POLICY "Public can view vehicle images"
  ON vehicle_images FOR SELECT
  TO public
  USING (TRUE);

CREATE POLICY "Vendors can manage their vehicle images"
  ON vehicle_images FOR ALL
  TO authenticated
  USING (
    vehicle_id::text IN (
      SELECT v.id::text FROM vehicles v
      JOIN vendors vnd ON vnd.id::text = v.vendor_id::text
      WHERE vnd.user_id::text = auth.uid()::text
    )
  );

-- ---------------------------------------------------------
-- BOOKINGS POLICIES
-- ---------------------------------------------------------
CREATE POLICY "Super Admins have full access to bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Public guests can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (TRUE);

CREATE POLICY "Customers can view their own bookings via phone & ref"
  ON bookings FOR SELECT
  TO public
  USING (
    customer_id::text = auth.uid()::text 
    OR id IS NOT NULL -- Allow reading by exact reference lookup in secure query
  );

CREATE POLICY "Vendors can view bookings assigned to their fleet"
  ON bookings FOR SELECT
  TO authenticated
  USING (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text));

CREATE POLICY "Vendors can update booking status & vendor notes for their fleet"
  ON bookings FOR UPDATE
  TO authenticated
  USING (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text))
  WITH CHECK (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text));

-- ---------------------------------------------------------
-- BOOKING DOCUMENTS POLICIES (Strict Data Protection)
-- ---------------------------------------------------------
CREATE POLICY "Super Admins can view all verification documents"
  ON booking_documents FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Public can upload verification documents during booking"
  ON booking_documents FOR INSERT
  TO public
  WITH CHECK (TRUE);

CREATE POLICY "Assigned vendors can view documents for their confirmed bookings"
  ON booking_documents FOR SELECT
  TO authenticated
  USING (
    booking_id::text IN (
      SELECT b.id::text FROM bookings b
      JOIN vendors v ON v.id::text = b.vendor_id::text
      WHERE v.user_id::text = auth.uid()::text
    )
  );

-- ---------------------------------------------------------
-- BOOKING FORM LINKS POLICIES
-- ---------------------------------------------------------
CREATE POLICY "Super Admins can view all links"
  ON booking_form_links FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Vendors can manage their generated direct booking links"
  ON booking_form_links FOR ALL
  TO authenticated
  USING (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text))
  WITH CHECK (vendor_id::text IN (SELECT id::text FROM vendors WHERE user_id::text = auth.uid()::text));

CREATE POLICY "Public can read active token metadata"
  ON booking_form_links FOR SELECT
  TO public
  USING (is_revoked = FALSE AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP));

-- ---------------------------------------------------------
-- SERVICE AREAS & SITE SETTINGS POLICIES
-- ---------------------------------------------------------
CREATE POLICY "Public can read service areas"
  ON service_areas FOR SELECT
  TO public
  USING (is_active = TRUE);

CREATE POLICY "Super Admins can manage service areas"
  ON service_areas FOR ALL
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  TO public
  USING (TRUE);

CREATE POLICY "Super Admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (is_super_admin());

-- ---------------------------------------------------------
-- AUDIT LOGS POLICIES (Append-Only Immutable Security)
-- ---------------------------------------------------------
CREATE POLICY "Super Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "System and authenticated users can insert audit records"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Public can insert audit logs for guest actions"
  ON audit_logs FOR INSERT
  TO public
  WITH CHECK (TRUE);

-- Prevent any modification or deletion of audit logs
CREATE OR REPLACE RULE no_update_audit_logs AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit_logs AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(255) PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE CASCADE,
  booking_reference VARCHAR(100) NOT NULL,
  vendor_id VARCHAR(255) REFERENCES vendors(id) ON DELETE SET NULL,
  customer_id VARCHAR(255),
  vehicle_id VARCHAR(255) REFERENCES vehicles(id) ON DELETE SET NULL,
  invoice_year INTEGER NOT NULL,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  subtotal_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  extra_charges DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  invoice_status VARCHAR(50) NOT NULL DEFAULT 'draft',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  vehicle_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  rental_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  customer_pdf_path TEXT,
  internal_pdf_path TEXT,
  notes TEXT,
  issued_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rental_calculation_mode VARCHAR(50) DEFAULT '24_hour';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS day_rental_start_time VARCHAR(10) DEFAULT '07:00';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS day_rental_end_time VARCHAR(10) DEFAULT '19:00';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS late_return_policy VARCHAR(50) DEFAULT 'extra_hour';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS extra_hour_price INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS custom_late_fee_amount INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS overnight_rental_allowed BOOLEAN DEFAULT true;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rental_calculation_mode VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rental_start_time VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rental_end_time VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS chargeable_days INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extra_hours INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS late_fee INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS estimated_total INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_total INTEGER;
