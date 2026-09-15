import { fetchVehiclesFromSupabase } from './server/supabase';
async function run() {
  const res = await fetchVehiclesFromSupabase();
  if (res.success) {
    const seen = new Set();
    let dups = 0;
    for (const v of res.vehicles) {
      const key = `${v.vendorId}-${v.name}-${v.registrationNumber}`;
      if (seen.has(key)) {
        console.log(`Duplicate found: ${v.name}`);
        dups++;
      } else {
        seen.add(key);
      }
    }
    console.log(`Total duplicates: ${dups}`);
  }
}
run();
