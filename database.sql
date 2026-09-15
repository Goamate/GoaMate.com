-- GoaMate Database Dump
-- Generated on 2026-09-14T16:41:01.126Z


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
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO site_settings (
  accept_new_bookings, allow_vendor_registration, allow_vendor_vehicle_uploads, allow_vendor_direct_links,
  show_cars, show_bikes, show_scooters, show_whatsapp_support, enable_email_notifications, maintenance_mode
) VALUES (
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE
);

CREATE TABLE IF NOT EXISTS service_areas (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-1', 'Margao (City Hub & Office)', 'South Goa', TRUE, 0, 1);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-2', 'Madgaon Railway Station (MAO)', 'South Goa', TRUE, 150, 2);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-3', 'Colva Beach & Circle', 'South Goa', TRUE, 200, 3);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-4', 'Benaulim & Varca', 'South Goa', TRUE, 250, 4);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-5', 'Dabolim International Airport (GOI)', 'South Goa', TRUE, 600, 5);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-6', 'Vasco da Gama', 'South Goa', TRUE, 500, 6);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-7', 'Panaji (City Center)', 'North Goa', TRUE, 700, 7);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-8', 'Manohar International Airport, Mopa (GOX)', 'North Goa', TRUE, 1400, 8);
INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES ('area-9', 'Candolim & Calangute Hub', 'North Goa', TRUE, 900, 9);

CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  service_location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO vendors (id, user_id, business_name, owner_name, phone, whatsapp, email, service_location, status, created_at) VALUES ('vendor-margao-main', 'user-vendor-1', 'GoaMate Margao Fleet', 'GoaMate Hub Manager', '+91 9403784132', '+91 9403784132', 'goamate.com@gmail.com', 'Margao, Goa', 'approved', '2026-08-15T16:41:01.126Z');

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(255) PRIMARY KEY,
  vendor_id VARCHAR(255) REFERENCES vendors(id),
  vendor_business_name VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  registration_number VARCHAR(50) NOT NULL,
  transmission VARCHAR(50) NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  seats INTEGER NOT NULL,
  engine_capacity_cc INTEGER,
  daily_price DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  pickup_options JSONB,
  description TEXT,
  features JSONB,
  fuel_policy TEXT,
  mileage_policy TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(50) NOT NULL,
  rejection_reason TEXT,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_images (
  id VARCHAR(255) PRIMARY KEY,
  vehicle_id VARCHAR(255) REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES ('v-activa-6g', 'vendor-margao-main', 'GoaMate Margao Fleet', 'Honda Activa 6G', 'scooter', 'Honda', 'Activa 6G H-Smart', 2024, 'GA-08-N-4412', 'Automatic', 'Petrol', 2, 110, 450, 1000, 'Margao, Goa', '["Free Pickup at Margao Hub","Madgaon Railway Station (+₹100)","Colva Delivery (+₹150)"]', 'The definitive Goa explorer scooter. Smooth, high-fuel-economy 110cc engine with telescopic suspension, tubeless tyres, and electric start. Perfect for cruising South Goa beaches, market errands, and coastal roads.', '["2 ISI Helmets Included","Tubeless Tyres","Front Luggage Hook","Mobile Holder with USB Port","Underseat Storage"]', 'Level-to-level: Return with same fuel level received.', 'Unlimited km within Goa state borders.', TRUE, 'approved', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80', '2026-09-14T16:41:01.126Z');
INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES ('img-activa-1', 'v-activa-6g', '/vehicles/activa-6g.jpg', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80', TRUE, 1);
INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES ('v-vespa-125', 'vendor-margao-main', 'GoaMate Margao Fleet', 'Vespa VXL 125', 'scooter', 'Vespa', 'VXL 125 Classic', 2024, 'GA-08-Q-7821', 'Automatic', 'Petrol', 2, 125, 650, 1500, 'Margao, Goa', '["Free Pickup at Margao Hub","Madgaon Railway Station (+₹100)","Benaulim Delivery (+₹200)"]', 'Iconic retro Italian styling with punchy 125cc electronic fuel injection. Premium disc brake with CBS for confident stopping along Goa’s scenic coastal highways.', '["Premium Retro Finish","Front Disc Brake","2 Helmets Provided","Underseat USB Charger","Digital-Analog Cluster"]', 'Level-to-level: Return with same fuel level received.', 'Unlimited km within Goa state borders.', TRUE, 'approved', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80', '2026-09-14T16:41:01.126Z');
INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES ('img-vespa-1', 'v-vespa-125', '/vehicles/vespa.jpg', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80', TRUE, 1);
INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES ('v-classic-350', 'vendor-margao-main', 'GoaMate Margao Fleet', 'Royal Enfield Classic 350', 'bike', 'Royal Enfield', 'Classic 350 Reborn', 2023, 'GA-08-M-1988', 'Manual', 'Petrol', 2, 349, 1100, 2500, 'Margao, Goa', '["Free Pickup at Margao Hub","Madgaon Railway Station (+₹150)","Airport Delivery (+₹600)"]', 'The quintessential touring motorcycle for Goa. Smooth J-series counterbalanced engine, dual-channel ABS, comfortable touring seat, and that signature thump as you ride down South Goa coconut tree avenues.', '["Dual-Channel ABS","Crash Guard Installed","Pillion Backrest","Mobile Phone Mount","2 Full Face ISI Helmets"]', 'Level-to-level: Return with same fuel level received.', 'Unlimited km within Goa state borders.', TRUE, 'approved', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80', '2026-09-14T16:41:01.126Z');
INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES ('img-re-1', 'v-classic-350', '/vehicles/classic-350.jpg', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80', TRUE, 1);
INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES ('v-himalayan-411', 'vendor-margao-main', 'GoaMate Margao Fleet', 'Royal Enfield Himalayan', 'bike', 'Royal Enfield', 'Himalayan Adventure', 2023, 'GA-08-P-9022', 'Manual', 'Petrol', 2, 411, 1400, 3000, 'Margao, Goa', '["Free Pickup at Margao Hub","Madgaon Station (+₹150)","Airport Drop (+₹600)"]', 'Rugged dual-sport adventure tourer with long travel suspension, high ground clearance, and switchable ABS. Built to conquer both smooth ghat routes and hidden rocky beach trails.', '["Switchable ABS","High Windscreen","Heavy Duty Luggage Rack","Sump Guard","All-Terrain Tyres"]', 'Level-to-level: Return with same fuel level received.', 'Unlimited km within Goa state borders.', TRUE, 'approved', 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80', '2026-09-14T16:41:01.126Z');
INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES ('img-him-1', 'v-himalayan-411', '/vehicles/himalayan.jpg', 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80', TRUE, 1);
INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES ('v-swift-dzire', 'vendor-margao-main', 'GoaMate Margao Fleet', 'Maruti Suzuki Dzire (Automatic)', 'car', 'Maruti Suzuki', 'Dzire VXi AGS', 2024, 'GA-08-T-3120', 'Automatic', 'Petrol', 5, NULL, 1800, 3000, 'Margao, Goa', '["Free Pickup at Margao Hub","Madgaon Railway Station (+₹150)","Dabolim Airport (+₹600)","Mopa Airport (+₹1400)"]', 'High comfort 5-seater sedan with effortless automatic transmission and excellent fuel efficiency. Equipped with chilled air conditioning, Bluetooth touchscreen, and ample boot space for luggage.', '["Chilled Air Conditioning","Touchscreen Infotainment","Bluetooth & USB","Power Windows","Reverse Parking Sensors","378L Boot Space"]', 'Level-to-level: Return with same fuel level received.', 'Unlimited km within Goa state borders.', TRUE, 'approved', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80', '2026-09-14T16:41:01.126Z');
INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES ('img-dzire-1', 'v-swift-dzire', '/vehicles/dzire.jpg', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80', TRUE, 1);
INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES ('v-thar-4x4', 'vendor-margao-main', 'GoaMate Margao Fleet', 'Mahindra Thar 4x4 (Hard Top)', 'car', 'Mahindra', 'Thar LX 4WD AT', 2023, 'GA-08-Z-6719', 'Automatic', 'Diesel', 4, NULL, 3800, 5000, 'Margao, Goa', '["Free Pickup at Margao Hub","Madgaon Railway Station (+₹200)","Dabolim Airport (+₹600)","Mopa Airport (+₹1400)"]', 'The ultimate Goa lifestyle SUV. Powerful 4WD turbo diesel with automatic transmission, commanding road presence, rugged all-terrain capability, and high quality sound system for memorable road trips.', '["4x4 All-Wheel Drive","Automatic Transmission","Apple CarPlay & Android Auto","Chilled Climate Control","Roll Cage & Dual Airbags","High Ground Clearance"]', 'Level-to-level: Return with same fuel level received.', 'Unlimited km within Goa state borders.', TRUE, 'approved', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80', '2026-09-14T16:41:01.126Z');
INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES ('img-thar-1', 'v-thar-4x4', '/vehicles/thar.jpg', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80', TRUE, 1);
INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES ('v-ertiga-7seater', 'vendor-margao-main', 'GoaMate Margao Fleet', 'Maruti Suzuki Ertiga (7 Seater)', 'car', 'Maruti Suzuki', 'Ertiga ZXi Smart Hybrid', 2024, 'GA-08-V-8812', 'Manual', 'Petrol', 7, NULL, 2600, 4000, 'Margao, Goa', '["Free Pickup at Margao Hub","Madgaon Railway Station (+₹150)","Airport Delivery (+₹600)"]', 'Spacious 7-seater MPV ideal for family vacations and groups traveling across Goa. Generous legroom across all three rows with rear AC vents and fold-flat third row for heavy luggage.', '["7 Comfortable Adult Seats","Roof-Mounted Rear AC Vents","Touchscreen Display","Smart Hybrid Efficiency","Foldable Seats for Huge Boot Space"]', 'Level-to-level: Return with same fuel level received.', 'Unlimited km within Goa state borders.', TRUE, 'approved', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80', '2026-09-14T16:41:01.126Z');
INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES ('img-ertiga-1', 'v-ertiga-7seater', '/vehicles/ertiga.jpg', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80', TRUE, 1);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(255) PRIMARY KEY,
  reference_number VARCHAR(100) UNIQUE NOT NULL,
  vehicle_id VARCHAR(255) REFERENCES vehicles(id),
  vendor_id VARCHAR(255) REFERENCES vendors(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_whatsapp VARCHAR(50),
  customer_email VARCHAR(255),
  hotel_or_delivery_address TEXT,
  special_requests TEXT,
  pickup_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  return_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  dropoff_location VARCHAR(255) NOT NULL,
  days_count INTEGER NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  subtotal_amount DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2) NOT NULL,
  total_estimated_amount DECIMAL(10, 2) NOT NULL,
  price_snapshot JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  admin_notes TEXT,
  vendor_notes TEXT,
  direct_link_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_documents (
  id VARCHAR(255) PRIMARY KEY,
  booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE CASCADE,
  doc_type VARCHAR(100) NOT NULL,
  id_proof_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_form_links (
  id VARCHAR(255) PRIMARY KEY,
  vendor_id VARCHAR(255) REFERENCES vendors(id),
  vehicle_id VARCHAR(255) REFERENCES vehicles(id),
  vehicle_name VARCHAR(255),
  token_hash TEXT NOT NULL,
  preset_pickup_datetime TIMESTAMP WITH TIME ZONE,
  preset_return_datetime TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  booking_id VARCHAR(255) REFERENCES bookings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  actor_user_id VARCHAR(255),
  actor_name VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
