import { saveVendorToSupabase } from './server/supabase';
import dotenv from 'dotenv';
dotenv.config();

const vendor = {
  id: 'vendor-1',
  userId: 'user-123',
  businessName: 'Test Vendor',
  ownerName: 'Test Owner',
  phone: '9999999999',
  whatsapp: '9999999999',
  email: 'test@example.com',
  serviceLocation: 'Margao',
  status: 'approved',
  vehicleCount: 0,
  createdAt: new Date().toISOString()
};

saveVendorToSupabase(vendor as any).then(res => {
  console.log("RESULT:", res);
  process.exit(0);
});
