-- ==============================================================================
-- GoaMate – Car & Bike Rental Service in Goa
-- Production Supabase PostgreSQL Schema & Security Policies
-- Migration: 20250914000000_goamate_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('super_admin', 'vendor', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_status_type AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_category_type AS ENUM ('car', 'bike', 'scooter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status_type AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_type AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE id_proof_type AS ENUM ('aadhaar', 'passport', 'voter_id', 'driving_licence', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PROFILES & USER ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'vendor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. VENDORS TABLE
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  service_location TEXT NOT NULL DEFAULT 'Margao, Goa',
  status vendor_status_type NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category vehicle_category_type NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2030),
  registration_number TEXT NOT NULL, -- Protected: visible only to authorized vendor and super admin
  transmission TEXT NOT NULL DEFAULT 'Manual', -- Manual / Automatic
  fuel_type TEXT NOT NULL DEFAULT 'Petrol', -- Petrol / Diesel / EV
  seats INTEGER NOT NULL DEFAULT 5, -- or engine cc for bikes
  engine_capacity_cc INTEGER,
  daily_price NUMERIC(10, 2) NOT NULL CHECK (daily_price > 0),
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  location TEXT NOT NULL DEFAULT 'Margao, Goa',
  pickup_options TEXT[] DEFAULT ARRAY['Free Pickup at Margao Hub', 'Madgaon Railway Station (+₹150)', 'Airport Delivery (+₹600)'],
  description TEXT,
  features TEXT[] DEFAULT ARRAY['Air Conditioning', 'Bluetooth Audio', 'Fast Charger', 'Helmets Provided (for 2-wheelers)'],
  fuel_policy TEXT NOT NULL DEFAULT 'Level-to-level: Return with same fuel level received.',
  mileage_policy TEXT NOT NULL DEFAULT 'Unlimited km within Goa state borders.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  status vehicle_status_type NOT NULL DEFAULT 'pending_approval',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VEHICLE IMAGES
CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VEHICLE AVAILABILITY BLOCKS (Maintenance, vendor block, etc.)
CREATE TABLE IF NOT EXISTS public.vehicle_availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Scheduled Maintenance',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date > start_date)
);

-- 8. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT NOT NULL UNIQUE, -- e.g. GM-2026-XXXX
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  hotel_or_delivery_address TEXT,
  special_requests TEXT,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  days_count INTEGER NOT NULL CHECK (days_count > 0),
  daily_rate NUMERIC(10, 2) NOT NULL,
  subtotal_amount NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_estimated_amount NUMERIC(10, 2) NOT NULL,
  price_snapshot JSONB NOT NULL,
  status booking_status_type NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  vendor_notes TEXT,
  direct_link_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (return_datetime > pickup_datetime)
);

-- 9. BOOKING DOCUMENTS (Private customer files)
CREATE TABLE IF NOT EXISTS public.booking_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- 'driving_licence_front', 'driving_licence_back', 'id_proof_front', 'id_proof_back'
  id_proof_type id_proof_type NOT NULL DEFAULT 'aadhaar',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BOOKING STATUS HISTORY (Audited timeline)
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  previous_status booking_status_type,
  new_status booking_status_type NOT NULL,
  changed_by_user_id UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DIRECT CUSTOMER FORM LINKS (Vendor generated short tokens)
CREATE TABLE IF NOT EXISTS public.booking_form_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of random token
  preset_pickup_datetime TIMESTAMPTZ,
  preset_return_datetime TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  booking_id UUID REFERENCES public.bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SITE SETTINGS (Super admin on/off operational controls)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  accept_new_bookings BOOLEAN NOT NULL DEFAULT true,
  allow_vendor_registration BOOLEAN NOT NULL DEFAULT true,
  allow_vendor_vehicle_uploads BOOLEAN NOT NULL DEFAULT true,
  allow_vendor_direct_links BOOLEAN NOT NULL DEFAULT true,
  show_cars BOOLEAN NOT NULL DEFAULT true,
  show_bikes BOOLEAN NOT NULL DEFAULT true,
  show_scooters BOOLEAN NOT NULL DEFAULT true,
  show_whatsapp_support BOOLEAN NOT NULL DEFAULT true,
  enable_email_notifications BOOLEAN NOT NULL DEFAULT false,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- 13. CONTENT PAGES & SERVICE AREAS (Editable by admin)
CREATE TABLE IF NOT EXISTS public.content_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL DEFAULT 'South Goa', -- South Goa / North Goa
  is_active BOOLEAN NOT NULL DEFAULT true,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. INDEXES FOR PERFORMANCE AND AVAILABILITY
CREATE INDEX IF NOT EXISTS idx_vehicles_vendor ON public.vehicles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_category_status ON public.vehicles(category, status, is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON public.bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(pickup_datetime, return_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_links_token_hash ON public.booking_form_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_documents_booking ON public.booking_documents(booking_id);

-- 16. PREVENT OVERLAPPING CONFIRMED BOOKINGS TRANSACTIONALLY
CREATE OR REPLACE FUNCTION check_confirmed_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE vehicle_id = NEW.vehicle_id
        AND id <> NEW.id
        AND status = 'confirmed'
        AND NOT (return_datetime <= NEW.pickup_datetime OR pickup_datetime >= NEW.return_datetime)
    ) THEN
      RAISE EXCEPTION 'This vehicle already has a confirmed booking for the overlapping dates.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_confirmed_booking_overlap ON public.bookings;
CREATE TRIGGER trg_check_confirmed_booking_overlap
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION check_confirmed_booking_overlap();

-- 17. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_form_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Public read policies:
CREATE POLICY "Public can view active site settings"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Public can view active service areas"
  ON public.service_areas FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view content pages"
  ON public.content_pages FOR SELECT USING (true);

CREATE POLICY "Public can view approved active vehicles"
  ON public.vehicles FOR SELECT
  USING (status = 'approved' AND is_active = true);

CREATE POLICY "Public can view vehicle images for approved vehicles"
  ON public.vehicle_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = vehicle_images.vehicle_id AND v.status = 'approved' AND v.is_active = true
  ));

-- Vendor policies:
CREATE POLICY "Vendors can view their own vendor record"
  ON public.vendors FOR SELECT
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Vendors can view and edit their own vehicles"
  ON public.vehicles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = vehicles.vendor_id AND vendors.user_id = auth.uid() AND vendors.status = 'approved')
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Vendors can view bookings assigned to their vehicles"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = bookings.vendor_id AND vendors.user_id = auth.uid() AND vendors.status = 'approved')
    OR public.is_super_admin(auth.uid())
  );

-- Super admin policies: Full access
CREATE POLICY "Super admin has full access to vendors"
  ON public.vendors FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin has full access to vehicles"
  ON public.vehicles FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin has full access to bookings"
  ON public.bookings FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin has full access to documents"
  ON public.booking_documents FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin has full access to audit logs"
  ON public.audit_logs FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can update site settings"
  ON public.site_settings FOR ALL USING (public.is_super_admin(auth.uid()));

-- 18. INITIAL SEED DATA
INSERT INTO public.site_settings (id, accept_new_bookings, allow_vendor_registration, allow_vendor_vehicle_uploads, allow_vendor_direct_links, show_cars, show_bikes, show_scooters, show_whatsapp_support, enable_email_notifications, maintenance_mode)
VALUES ('global', true, true, true, true, true, true, true, true, false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_areas (name, zone, is_active, delivery_charge, sort_order) VALUES
('Margao (City Hub & Office)', 'South Goa', true, 0, 1),
('Madgaon Railway Station (MAO)', 'South Goa', true, 150, 2),
('Colva Beach & Circle', 'South Goa', true, 200, 3),
('Benaulim & Varca', 'South Goa', true, 250, 4),
('Dabolim International Airport (GOI)', 'South Goa', true, 600, 5),
('Vasco da Gama', 'South Goa', true, 500, 6),
('Panaji (City Center)', 'North Goa', true, 700, 7),
('Manohar International Airport, Mopa (GOX)', 'North Goa', true, 1400, 8),
('Candolim & Calangute Hub', 'North Goa', true, 900, 9)
ON CONFLICT (name) DO NOTHING;
