import { getSupabaseAdmin } from '../config/supabase.js';
import { getStripeClient } from '../config/stripe.js';

function dbError(message) {
  const err = new Error(message);
  err.statusCode = 500;
  err.code = 'DB_ERROR';
  return err;
}

// Kullanicinin user_plans (billing) kaydini doner.
export async function getBillingProfile({ userId }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw dbError(`Billing profili alinamadi: ${error.message}`);
  return data || null;
}

// Mevcut Stripe customer id varsa doner; yoksa olusturup user_plans'a yazar.
export async function getOrCreateStripeCustomer({ userId, email }) {
  const profile = await getBillingProfile({ userId });
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  const supabase = getSupabaseAdmin();
  // upsert: mevcut satirda sadece stripe_customer_id'yi gunceller, plan'a dokunmaz.
  const { error } = await supabase
    .from('user_plans')
    .upsert(
      { user_id: userId, stripe_customer_id: customer.id },
      { onConflict: 'user_id' }
    );
  if (error)
    throw dbError(`Stripe customer kaydedilemedi: ${error.message}`);

  return customer.id;
}

// user_id ile user_plans gunceller.
export async function updateUserPlanByUserId({ userId, updates }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_plans')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('user_id');
  if (error) throw dbError(`Plan guncellenemedi: ${error.message}`);
  return data || [];
}

// stripe_subscription_id ile user_plans gunceller (webhook icin).
export async function updateUserPlanBySubscriptionId({ subscriptionId, updates }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscriptionId)
    .select('user_id');
  if (error) throw dbError(`Plan guncellenemedi: ${error.message}`);
  return data || [];
}

// Hesap silmeden once aktif aboneligi (varsa) iptal etmeye calisir.
// Stripe yapilandirilmamissa veya hata olursa cagiran taraf yutar (non-fatal).
export async function cancelSubscriptionIfAny({ userId }) {
  const profile = await getBillingProfile({ userId });
  if (!profile?.stripe_subscription_id) return { canceled: false };
  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(profile.stripe_subscription_id);
  return { canceled: true };
}
