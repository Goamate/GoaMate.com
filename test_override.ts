import dotenv from 'dotenv';
dotenv.config({ override: true });
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);
