import { vendors, vehicles, bookings, bookingDocuments, bookingFormLinks, auditLogs, serviceAreas } from './server/store.js';
import fs from 'fs';

let sql = `-- GoaMate Database Dump\n`;
sql += `-- Generated on ${new Date().toISOString()}\n\n`;

sql += `
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
`;

const escapeSql = (str) => {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
  if (typeof str === 'number') return str;
  return "'" + String(str).replace(/'/g, "''") + "'";
};

for (const area of serviceAreas) {
  sql += `INSERT INTO service_areas (id, name, zone, is_active, delivery_charge, sort_order) VALUES (${escapeSql(area.id)}, ${escapeSql(area.name)}, ${escapeSql(area.zone)}, ${escapeSql(area.isActive)}, ${escapeSql(area.deliveryCharge)}, ${escapeSql(area.sortOrder)});\n`;
}

sql += `
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  service_location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

for (const v of vendors) {
  sql += `INSERT INTO vendors (id, user_id, business_name, vendor_name, phone, whatsapp, email, service_location, status, created_at) VALUES (${escapeSql(v.id)}, ${escapeSql(v.userId)}, ${escapeSql(v.businessName)}, ${escapeSql(v.vendorName)}, ${escapeSql(v.phone)}, ${escapeSql(v.whatsapp)}, ${escapeSql(v.email)}, ${escapeSql(v.serviceLocation)}, ${escapeSql(v.status)}, ${escapeSql(v.createdAt)});\n`;
}

sql += `
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
`;

for (const v of vehicles) {
  sql += `INSERT INTO vehicles (id, vendor_id, vendor_business_name, name, category, brand, model, year, registration_number, transmission, fuel_type, seats, engine_capacity_cc, daily_price, security_deposit, location, pickup_options, description, features, fuel_policy, mileage_policy, is_active, status, cover_image, created_at) VALUES (${escapeSql(v.id)}, ${escapeSql(v.vendorId)}, ${escapeSql(v.vendorBusinessName)}, ${escapeSql(v.name)}, ${escapeSql(v.category)}, ${escapeSql(v.brand)}, ${escapeSql(v.model)}, ${escapeSql(v.year)}, ${escapeSql(v.registrationNumber)}, ${escapeSql(v.transmission)}, ${escapeSql(v.fuelType)}, ${escapeSql(v.seats)}, ${escapeSql(v.engineCapacityCc)}, ${escapeSql(v.dailyPrice)}, ${escapeSql(v.securityDeposit)}, ${escapeSql(v.location)}, '${JSON.stringify(v.pickupOptions).replace(/'/g, "''")}', ${escapeSql(v.description)}, '${JSON.stringify(v.features).replace(/'/g, "''")}', ${escapeSql(v.fuelPolicy)}, ${escapeSql(v.mileagePolicy)}, ${escapeSql(v.isActive)}, ${escapeSql(v.status)}, ${escapeSql(v.coverImage)}, ${escapeSql(v.createdAt)});\n`;

  if (v.images) {
    for (const img of v.images) {
      sql += `INSERT INTO vehicle_images (id, vehicle_id, storage_path, public_url, is_cover, sort_order) VALUES (${escapeSql(img.id)}, ${escapeSql(img.vehicleId)}, ${escapeSql(img.storagePath)}, ${escapeSql(img.publicUrl)}, ${escapeSql(img.isCover)}, ${escapeSql(img.sortOrder)});\n`;
    }
  }
}

sql += `
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
`;

for (const b of bookings) {
    sql += `INSERT INTO bookings (id, reference_number, vehicle_id, vendor_id, customer_name, customer_phone, customer_whatsapp, customer_email, hotel_or_delivery_address, special_requests, pickup_datetime, return_datetime, pickup_location, dropoff_location, days_count, daily_rate, subtotal_amount, delivery_fee, security_deposit, total_estimated_amount, price_snapshot, status, admin_notes, vendor_notes, direct_link_id, created_at, updated_at) VALUES (${escapeSql(b.id)}, ${escapeSql(b.referenceNumber)}, ${escapeSql(b.vehicleId)}, ${escapeSql(b.vendorId)}, ${escapeSql(b.customerName)}, ${escapeSql(b.customerPhone)}, ${escapeSql(b.customerWhatsapp)}, ${escapeSql(b.customerEmail)}, ${escapeSql(b.hotelOrDeliveryAddress)}, ${escapeSql(b.specialRequests)}, ${escapeSql(b.pickupDatetime)}, ${escapeSql(b.returnDatetime)}, ${escapeSql(b.pickupLocation)}, ${escapeSql(b.dropoffLocation)}, ${escapeSql(b.daysCount)}, ${escapeSql(b.dailyRate)}, ${escapeSql(b.subtotalAmount)}, ${escapeSql(b.deliveryFee)}, ${escapeSql(b.securityDeposit)}, ${escapeSql(b.totalEstimatedAmount)}, '${JSON.stringify(b.priceSnapshot).replace(/'/g, "''")}', ${escapeSql(b.status)}, ${escapeSql(b.adminNotes)}, ${escapeSql(b.vendorNotes)}, ${escapeSql(b.directLinkId)}, ${escapeSql(b.createdAt)}, ${escapeSql(b.updatedAt)});\n`;
}

for (const doc of bookingDocuments) {
    sql += `INSERT INTO booking_documents (id, booking_id, doc_type, id_proof_type, storage_path, file_name, file_size_bytes, mime_type, uploaded_at) VALUES (${escapeSql(doc.id)}, ${escapeSql(doc.bookingId)}, ${escapeSql(doc.docType)}, ${escapeSql(doc.idProofType)}, ${escapeSql(doc.storagePath)}, ${escapeSql(doc.fileName)}, ${escapeSql(doc.fileSizeBytes)}, ${escapeSql(doc.mimeType)}, ${escapeSql(doc.uploadedAt)});\n`;
}

for (const bfl of bookingFormLinks) {
    sql += `INSERT INTO booking_form_links (id, vendor_id, vehicle_id, vehicle_name, token_hash, preset_pickup_datetime, preset_return_datetime, expires_at, is_revoked, is_used, used_at, booking_id, created_at) VALUES (${escapeSql(bfl.id)}, ${escapeSql(bfl.vendorId)}, ${escapeSql(bfl.vehicleId)}, ${escapeSql(bfl.vehicleName)}, ${escapeSql(bfl.tokenHash)}, ${escapeSql(bfl.presetPickupDatetime)}, ${escapeSql(bfl.presetReturnDatetime)}, ${escapeSql(bfl.expiresAt)}, ${escapeSql(bfl.isRevoked)}, ${escapeSql(bfl.isUsed)}, ${escapeSql(bfl.usedAt)}, ${escapeSql(bfl.bookingId)}, ${escapeSql(bfl.createdAt)});\n`;
}

for (const al of auditLogs) {
    sql += `INSERT INTO audit_logs (id, actor_user_id, actor_name, action, entity_type, entity_id, details, ip_address, created_at) VALUES (${escapeSql(al.id)}, ${escapeSql(al.actorUserId)}, ${escapeSql(al.actorName)}, ${escapeSql(al.action)}, ${escapeSql(al.entityType)}, ${escapeSql(al.entityId)}, '${JSON.stringify(al.details || {}).replace(/'/g, "''")}', ${escapeSql(al.ipAddress)}, ${escapeSql(al.createdAt)});\n`;
}

fs.writeFileSync('database.sql', sql);
console.log('Successfully generated database.sql');
