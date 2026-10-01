import { createClient } from '@supabase/supabase-js';

import env from './env.js';

let client = null;

// Server-side Supabase client (service role). RLS'i bypass eder; bu yuzden
// sorgu katmaninda (applicationStore) her zaman user_id filtresi uygulariz.
// Service role key ASLA frontend'e gonderilmez.
export function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    const err = new Error(
      'Supabase yapilandirilmamis. server/.env icinde SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.'
    );
    err.statusCode = 500;
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }

  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}
