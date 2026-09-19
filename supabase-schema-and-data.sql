-- ==============================================================================
-- GoaMate Vehicle Rental Platform: Complete Supabase Database Schema & Initial Data
-- Run this in your Supabase Dashboard: SQL Editor -> New query -> Paste & Run
-- ==============================================================================

-- 0. Safe Schema Upgrades (Ensure existing tables have new columns)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendors') THEN
    ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS vehicle_count INT DEFAULT 0;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_profiles') THEN
    ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
    ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
    ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS area TEXT;
    ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- 1. Create Vendor Profiles Table (Supabase Auth user linkage & RLS)
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. Create Vendors Table (Fleet Directory & Partner Operational Records)
CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  business_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT NOT NULL,
  service_location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  notes TEXT,
  vehicle_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  vendor_id TEXT REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'scooter', 'bike', 'car'
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  registration_number TEXT,
  transmission TEXT NOT NULL, -- 'Automatic', 'Manual'
  fuel_type TEXT NOT NULL, -- 'Petrol', 'Diesel', 'Electric'
  seats INT DEFAULT 2,
  engine_capacity_cc INT,
  daily_price NUMERIC(10, 2) NOT NULL,
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  pickup_options JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  fuel_policy TEXT,
  mileage_policy TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vendor_id TEXT REFERENCES public.vendors(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT,
  customer_email TEXT NOT NULL,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  hotel_or_delivery_address TEXT,
  special_requests TEXT,
  days_count NUMERIC(6, 2) NOT NULL DEFAULT 1,
  daily_rate NUMERIC(10, 2) NOT NULL,
  subtotal_amount NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_estimated_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled', 'completed'
  price_snapshot JSONB,
  admin_notes TEXT,
  vendor_notes TEXT,
  direct_link_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Booking Documents Table (KYC / Licences)
CREATE TABLE IF NOT EXISTS public.booking_documents (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- 'driving_licence', 'id_proof'
  id_proof_type TEXT, -- 'aadhaar', 'passport', 'voter_id'
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create Service Areas Table
CREATE TABLE IF NOT EXISTS public.service_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL, -- 'South Goa', 'North Goa'
  is_active BOOLEAN NOT NULL DEFAULT true,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 1
);

-- 6. Create Site Settings Table
DROP TABLE IF EXISTS public.site_settings;
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create Invoices Table (GoaMate Production Billing Engine)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL,
  vendor_id TEXT REFERENCES public.vendors(id) ON DELETE SET NULL,
  customer_id TEXT,
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  invoice_year INT NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subtotal_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  extra_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'partially_paid', 'paid', 'refunded', 'cancelled'
  payment_method TEXT NOT NULL DEFAULT 'Cash',    -- 'Cash', 'UPI', 'Card', 'Bank Transfer', 'Online Payment', 'Other'
  invoice_status TEXT NOT NULL DEFAULT 'draft',   -- 'draft', 'issued', 'paid', 'partially_paid', 'cancelled', 'refunded'
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  vehicle_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  rental_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  customer_pdf_path TEXT,
  internal_pdf_path TEXT,
  notes TEXT,
  issued_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- Indexes for Fast Lookups
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(reference_number);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON public.bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON public.vehicles(is_active);
CREATE INDEX IF NOT EXISTS idx_booking_documents_booking ON public.booking_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON public.invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_approval_status ON public.vendor_profiles(approval_status);

-- ==============================================================================
-- Row-Level Security (RLS) Setup
-- ==============================================================================
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Vendor Profiles Policies (Vendors can only view and update their own profile; insert during signup)
DROP POLICY IF EXISTS "Vendors can view own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can insert own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Service role full access vendor_profiles" ON public.vendor_profiles;

CREATE POLICY "Vendors can view own profile"
  ON public.vendor_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can insert own profile"
  ON public.vendor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update own profile"
  ON public.vendor_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vendors Policies
DROP POLICY IF EXISTS "Allow public vendors select" ON public.vendors;
DROP POLICY IF EXISTS "Allow public vendors insert" ON public.vendors;
DROP POLICY IF EXISTS "Allow public vendors update" ON public.vendors;
CREATE POLICY "Allow public vendors select" ON public.vendors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public vendors insert" ON public.vendors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public vendors update" ON public.vendors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Vehicles Policies
DROP POLICY IF EXISTS "Allow public vehicles select" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public vehicles insert" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public vehicles update" ON public.vehicles;
CREATE POLICY "Allow public vehicles select" ON public.vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public vehicles insert" ON public.vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public vehicles update" ON public.vehicles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Bookings Policies
DROP POLICY IF EXISTS "Allow public bookings select" ON public.bookings;
DROP POLICY IF EXISTS "Allow public bookings insert" ON public.bookings;
DROP POLICY IF EXISTS "Allow public bookings update" ON public.bookings;
CREATE POLICY "Allow public bookings select" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public bookings insert" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public bookings update" ON public.bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Booking Documents Policies
DROP POLICY IF EXISTS "Allow public booking_documents select" ON public.booking_documents;
DROP POLICY IF EXISTS "Allow public booking_documents insert" ON public.booking_documents;
CREATE POLICY "Allow public booking_documents select" ON public.booking_documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public booking_documents insert" ON public.booking_documents FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Service Areas Policies
DROP POLICY IF EXISTS "Allow public service_areas select" ON public.service_areas;
DROP POLICY IF EXISTS "Allow public service_areas all" ON public.service_areas;
CREATE POLICY "Allow public service_areas all" ON public.service_areas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Site Settings Policies
DROP POLICY IF EXISTS "Allow public site_settings all" ON public.site_settings;
CREATE POLICY "Allow public site_settings all" ON public.site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Invoices Policies (Row-Level Security)
DROP POLICY IF EXISTS "Allow public invoices select" ON public.invoices;
DROP POLICY IF EXISTS "Allow public invoices insert" ON public.invoices;
DROP POLICY IF EXISTS "Allow public invoices update" ON public.invoices;
CREATE POLICY "Allow public invoices select" ON public.invoices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public invoices insert" ON public.invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public invoices update" ON public.invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- Storage Buckets Setup (Private & Secure for KYC & Invoices)
-- ==============================================================================
-- 1. Private bucket 'customer-documents' for customer driving licences & ID proofs
-- 2. Private bucket 'invoices' for generated PDF copies
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('customer-documents', 'customer-documents', false),
  ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- INITIAL SEED DATA: Vendors, Goa Fleet, Service Areas & Settings
-- ==============================================================================

-- 1. Vendors Seed Data
INSERT INTO public.vendors (id, user_id, business_name, vendor_name, phone, whatsapp, email, service_location, status, notes, vehicle_count)
VALUES
  (
    'vendor-margao-main',
    'user-vendor-1',
    'GoaMate Margao Fleet',
    'GoaMate Hub Manager',
    '+91 9403784132',
    '+91 9403784132',
    'margao.rentals@goamate.com',
    'Margao, South Goa',
    'approved',
    'Official primary GoaMate operations hub in South Goa',
    6
  ),
  (
    'vendor-margao-secondary',
    'user-vendor-2',
    'GoaMate Central Hub',
    'GoaMate Hub Operations',
    '+91 9403784132',
    '+91 9403784132',
    'goamate.com@gmail.com',
    'Margao, South Goa',
    'approved',
    'GoaMate operations hub',
    6
  )
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  vendor_name = EXCLUDED.vendor_name,
  phone = EXCLUDED.phone,
  whatsapp = EXCLUDED.whatsapp,
  email = EXCLUDED.email,
  service_location = EXCLUDED.service_location;


-- 2. Vehicles Seed Data (Full Goa Fleet Catalog)
INSERT INTO public.vehicles (
  id, vendor_id, name, category, brand, model, year, registration_number,
  transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit,
  location, cover_image, pickup_options, features, description, fuel_policy, mileage_policy, is_active, status
)
VALUES
  (
    'v-activa-6g',
    'vendor-margao-main',
    'Honda Activa 6G',
    'scooter',
    'Honda',
    'Activa 6G H-Smart',
    2024,
    'GA-08-N-4412',
    'Automatic',
    'Petrol',
    2,
    110,
    450.00,
    1000.00,
    'Margao, Goa',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
    '["Free Pickup at Margao Hub", "Madgaon Railway Station (+₹100)", "Colva Delivery (+₹150)"]'::jsonb,
    '["2 ISI Helmets Included", "Tubeless Tyres", "Front Luggage Hook", "Mobile Holder with USB Port", "Underseat Storage"]'::jsonb,
    'The definitive Goa explorer scooter. Smooth, high-fuel-economy 110cc engine with telescopic suspension, tubeless tyres, and electric start. Perfect for cruising South Goa beaches, market errands, and coastal roads.',
    'Level-to-level: Return with same fuel level received.',
    'Unlimited km within Goa state borders.',
    true,
    'approved'
  ),
  (
    'v-vespa-125',
    'vendor-margao-main',
    'Vespa VXL 125',
    'scooter',
    'Vespa',
    'VXL 125 Classic',
    2024,
    'GA-08-Q-7821',
    'Automatic',
    'Petrol',
    2,
    125,
    650.00,
    1500.00,
    'Margao, Goa',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
    '["Free Pickup at Margao Hub", "Madgaon Railway Station (+₹100)", "Benaulim Delivery (+₹200)"]'::jsonb,
    '["Premium Retro Finish", "Front Disc Brake", "2 Helmets Provided", "Underseat USB Charger", "Digital-Analog Cluster"]'::jsonb,
    'Iconic retro Italian styling with punchy 125cc electronic fuel injection. Premium disc brake with CBS for confident stopping along Goa’s scenic coastal highways.',
    'Level-to-level: Return with same fuel level received.',
    'Unlimited km within Goa state borders.',
    true,
    'approved'
  ),
  (
    'v-classic-350',
    'vendor-margao-main',
    'Royal Enfield Classic 350',
    'bike',
    'Royal Enfield',
    'Classic 350 Reborn',
    2023,
    'GA-08-M-1988',
    'Manual',
    'Petrol',
    2,
    349,
    1100.00,
    2500.00,
    'Margao, Goa',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80',
    '["Free Pickup at Margao Hub", "Madgaon Railway Station (+₹150)", "Airport Delivery (+₹600)"]'::jsonb,
    '["Dual-Channel ABS", "Crash Guard Installed", "Pillion Backrest", "Mobile Phone Mount", "2 Full Face ISI Helmets"]'::jsonb,
    'The quintessential touring motorcycle for Goa. Smooth J-series counterbalanced engine, dual-channel ABS, comfortable touring seat, and that signature thump as you ride down South Goa coconut tree avenues.',
    'Level-to-level: Return with same fuel level received.',
    'Unlimited km within Goa state borders.',
    true,
    'approved'
  ),
  (
    'v-himalayan-411',
    'vendor-margao-main',
    'Royal Enfield Himalayan',
    'bike',
    'Royal Enfield',
    'Himalayan Adventure',
    2023,
    'GA-08-P-9022',
    'Manual',
    'Petrol',
    2,
    411,
    1400.00,
    3000.00,
    'Margao, Goa',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
    '["Free Pickup at Margao Hub", "Madgaon Station (+₹150)", "Airport Drop (+₹600)"]'::jsonb,
    '["Switchable ABS", "High Windscreen", "Heavy Duty Luggage Rack", "Sump Guard", "All-Terrain Tyres"]'::jsonb,
    'Rugged dual-sport adventure tourer with long travel suspension, high ground clearance, and switchable ABS. Built to conquer both smooth ghat routes and hidden rocky beach trails.',
    'Level-to-level: Return with same fuel level received.',
    'Unlimited km within Goa state borders.',
    true,
    'approved'
  ),
  (
    'v-swift-dzire',
    'vendor-margao-main',
    'Maruti Suzuki Dzire (Automatic)',
    'car',
    'Maruti Suzuki',
    'Dzire VXi AGS',
    2024,
    'GA-08-T-3120',
    'Automatic',
    'Petrol',
    5,
    1197,
    1800.00,
    3000.00,
    'Margao, Goa',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    '["Free Pickup at Margao Hub", "Madgaon Railway Station (+₹150)", "Dabolim Airport (+₹600)", "Mopa Airport (+₹1400)"]'::jsonb,
    '["Chilled Air Conditioning", "Touchscreen Infotainment", "Bluetooth & USB", "Power Windows", "Reverse Parking Sensors", "378L Boot Space"]'::jsonb,
    'High comfort 5-seater sedan with effortless automatic transmission and excellent fuel efficiency. Equipped with chilled air conditioning, Bluetooth touchscreen, and ample boot space for luggage.',
    'Level-to-level: Return with same fuel level received.',
    'Unlimited km within Goa state borders.',
    true,
    'approved'
  ),
  (
    'v-thar-4x4',
    'vendor-margao-main',
    'Mahindra Thar 4x4 (Hard Top)',
    'car',
    'Mahindra',
    'Thar LX 4WD AT',
    2023,
    'GA-08-Z-6719',
    'Automatic',
    'Diesel',
    4,
    2184,
    3800.00,
    5000.00,
    'Margao, Goa',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
    '["Free Pickup at Margao Hub", "Madgaon Railway Station (+₹200)", "Dabolim Airport (+₹600)", "Mopa Airport (+₹1400)"]'::jsonb,
    '["4x4 All-Wheel Drive", "Automatic Transmission", "Apple CarPlay & Android Auto", "Chilled Climate Control", "Roll Cage & Dual Airbags", "High Ground Clearance"]'::jsonb,
    'The ultimate Goa lifestyle SUV. Powerful 4WD turbo diesel with automatic transmission, commanding road presence, rugged all-terrain capability, and high quality sound system for memorable road trips.',
    'Level-to-level: Return with same fuel level received.',
    'Unlimited km within Goa state borders.',
    true,
    'approved'
  ),
  (
    'v-ertiga-7seater',
    'vendor-margao-main',
    'Maruti Suzuki Ertiga (7 Seater)',
    'car',
    'Maruti Suzuki',
    'Ertiga ZXi Smart Hybrid',
    2024,
    'GA-08-V-8812',
    'Manual',
    'Petrol',
    7,
    1462,
    2600.00,
    4000.00,
    'Margao, Goa',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80',
    '["Free Pickup at Margao Hub", "Madgaon Railway Station (+₹150)", "Airport Delivery (+₹600)"]'::jsonb,
    '["7 Comfortable Adult Seats", "Roof-Mounted Rear AC Vents", "Touchscreen Display", "Smart Hybrid Efficiency", "Foldable Seats for Huge Boot Space"]'::jsonb,
    'Spacious 7-seater MPV ideal for family vacations and groups traveling across Goa. Generous legroom across all three rows with rear AC vents and fold-flat third row for heavy luggage.',
    'Level-to-level: Return with same fuel level received.',
    'Unlimited km within Goa state borders.',
    true,
    'approved'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  daily_price = EXCLUDED.daily_price,
  security_deposit = EXCLUDED.security_deposit,
  location = EXCLUDED.location,
  cover_image = EXCLUDED.cover_image,
  pickup_options = EXCLUDED.pickup_options,
  features = EXCLUDED.features,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  status = EXCLUDED.status;


-- 3. Service Areas Seed Data (Goa Hubs & Airport Delivery Points)
INSERT INTO public.service_areas (id, name, zone, is_active, delivery_charge, sort_order)
VALUES
  ('area-1', 'Margao (City Hub & Office)', 'South Goa', true, 0, 1),
  ('area-2', 'Madgaon Railway Station (MAO)', 'South Goa', true, 150, 2),
  ('area-3', 'Colva Beach & Circle', 'South Goa', true, 200, 3),
  ('area-4', 'Benaulim & Varca', 'South Goa', true, 250, 4),
  ('area-5', 'Dabolim International Airport (GOI)', 'South Goa', true, 600, 5),
  ('area-6', 'Vasco da Gama', 'South Goa', true, 500, 6),
  ('area-7', 'Panaji (City Center)', 'North Goa', true, 700, 7),
  ('area-8', 'Manohar International Airport, Mopa (GOX)', 'North Goa', true, 1400, 8),
  ('area-9', 'Candolim & Calangute Hub', 'North Goa', true, 900, 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  zone = EXCLUDED.zone,
  delivery_charge = EXCLUDED.delivery_charge,
  is_active = EXCLUDED.is_active;


-- 4. Initial Site Settings Seed Data
INSERT INTO public.site_settings (id, settings)
VALUES
  (
    'default',
    '{
      "acceptNewBookings": true,
      "allowVendorRegistration": true,
      "allowVendorVehicleUploads": true,
      "allowVendorDirectLinks": true,
      "showCars": true,
      "showBikes": true,
      "showScooters": true,
      "showWhatsappSupport": true,
      "enableEmailNotifications": false,
      "maintenanceMode": false
    }'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = now();
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS deleted_by TEXT;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS deleted_by TEXT;

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
