import { saveVendorToSupabase, saveVehicleToSupabase } from './server/supabase';
import dotenv from 'dotenv';
dotenv.config();

const vendor = {
  id: 'vendor-flow-1',
  userId: 'user-flow',
  businessName: 'Flow Vendor',
  ownerName: 'Flow Owner',
  phone: '999',
  email: 'flow@example.com',
  serviceLocation: 'Goa',
  status: 'approved',
  createdAt: new Date().toISOString()
};

const v = {
  id: 'test-veh-flow-1',
  vendorId: 'vendor-flow-1',
  name: 'Test Flow Vehicle',
  category: 'car',
  brand: 'Toyota',
  model: 'Innova',
  year: 2023,
  registrationNumber: 'GA-01-AB-1234',
  transmission: 'Automatic',
  fuelType: 'Diesel',
  seats: 7,
  engineCapacityCc: 2400,
  dailyPrice: 2000,
  securityDeposit: 5000,
  location: 'Margao',
  pickupOptions: ['Free Pickup at Hub'],
  description: 'A great car.',
  features: ['AC', 'Music System'],
  fuelPolicy: 'Level-to-level',
  mileagePolicy: 'Unlimited',
  isActive: true,
  status: 'pending_approval',
  images: [],
  coverImage: 'https://example.com/image.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function test() {
  let r = await saveVendorToSupabase(vendor as any);
  console.log("VENDOR:", r);
  let r2 = await saveVehicleToSupabase(v as any);
  console.log("VEHICLE:", r2);
}

test().then(() => process.exit(0));
