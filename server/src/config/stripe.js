import Stripe from 'stripe';

import env from './env.js';

let client = null;

// Lazy Stripe client. Test mode zorunlu degil ama live key dev'de engellenir.
// apiVersion pinlenmez; SDK kendi varsayilanini kullanir (surum uyumsuzlugu olmaz).
export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    const err = new Error(
      'Stripe yapilandirilmamis. server/.env icinde STRIPE_SECRET_KEY gerekli.'
    );
    err.statusCode = 500;
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }

  // Guvenlik: development ortaminda canli (live) key kullanimini engelle.
  if (
    env.NODE_ENV !== 'production' &&
    env.STRIPE_SECRET_KEY.startsWith('sk_live_')
  ) {
    const err = new Error(
      'Development ortaminda live Stripe key kullanilamaz.'
    );
    err.statusCode = 500;
    err.code = 'STRIPE_LIVE_KEY_BLOCKED';
    throw err;
  }

  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}
