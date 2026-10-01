import dotenv from 'dotenv';

dotenv.config();

const env = {
  PORT: Number(process.env.PORT) || 5001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  // Hangi LLM saglayicisinin kullanilacagi (bkz. llm/index.js registry).
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID || '',
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
