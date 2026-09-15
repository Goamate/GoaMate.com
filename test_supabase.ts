import { saveVehicleToSupabase } from './server/supabase';
import dotenv from 'dotenv';
dotenv.config();

const v = {
  id: 'test-veh-123',
  vendorId: 'vendor-1',
  vendorBusinessName: 'Test Vendor',
  name: 'Test Vehicle',
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

saveVehicleToSupabase(v as any).then(res => {
  console.log("RESULT:", res);
  process.exit(0);
});
