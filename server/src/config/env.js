import dotenv from 'dotenv';

dotenv.config();

const env = {
  PORT: Number(process.env.PORT) || 5001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  OPENAI_API_KEY: (process.env.OPENAI_API_KEY || '').trim(),
  OPENAI_MODEL: (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim(),
  // Hangi LLM saglayicisinin kullanilacagi (bkz. llm/index.js registry).
  LLM_PROVIDER: (process.env.LLM_PROVIDER || 'openai').trim().toLowerCase(),
  SUPABASE_URL: (process.env.SUPABASE_URL || '').trim(),
  SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  SUPABASE_JWT_SECRET: (process.env.SUPABASE_JWT_SECRET || '').trim(),
  STRIPE_SECRET_KEY: (process.env.STRIPE_SECRET_KEY || '').trim(),
  STRIPE_WEBHOOK_SECRET: (process.env.STRIPE_WEBHOOK_SECRET || '').trim(),
  STRIPE_PRO_PRICE_ID: (process.env.STRIPE_PRO_PRICE_ID || '').trim(),
  CLIENT_APP_URL: process.env.CLIENT_APP_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  // Virgulle ayrilmis admin e-posta listesi (ornegin AI usage dashboard erisimi icin).
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

export default env;
