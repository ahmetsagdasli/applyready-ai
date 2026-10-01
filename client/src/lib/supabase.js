import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Env tanimli degilse supabase null kalir; uygulama girissiz demo modunda calisir.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const supabaseEnabled = Boolean(supabase);
