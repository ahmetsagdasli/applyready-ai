import env from '../config/env.js';
import { getStripeClient } from '../config/stripe.js';
import {
  getOrCreateStripeCustomer,
  getBillingProfile,
  updateUserPlanByUserId,
  updateUserPlanBySubscriptionId,
} from '../services/billingStore.js';
import { getUserPlan } from '../services/usageStore.js';

const PRO_LIMIT = 100;
const FREE_LIMIT = 3;

function limitForPlan(plan) {
  return plan === 'pro' ? PRO_LIMIT : FREE_LIMIT;
}

// active/trialing -> pro, digerleri -> free (basit MVP kurali).
function planForStatus(status) {
  return status === 'active' || status === 'trialing' ? 'pro' : 'free';
}

// Subscription nesnesinden donem sonunu guvenli sekilde cikarir.
function periodEndIso(subscription) {
  const ts =
    subscription?.current_period_end ??
    subscription?.items?.data?.[0]?.current_period_end ??
    null;
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null;
}

// POST /api/billing/create-checkout-session  (auth zorunlu)
export async function createCheckoutSession(req, res, next) {
  try {
    const { plan } = req.body || {};
    if (plan !== 'pro') {
      return res
        .status(400)
        .json({ status: 'error', message: 'Yalnizca pro plan desteklenir.' });
    }
    if (!env.STRIPE_PRO_PRICE_ID) {
      return res.status(500).json({
        status: 'error',
        message: 'Stripe pro price id yapilandirilmamis.',
        code: 'STRIPE_PRICE_MISSING',
      });
    }

    const stripe = getStripeClient();
    const customerId = await getOrCreateStripeCustomer({
      userId: req.user.id,
      email: req.user.email,
    });

    // NOT: payment_method_types GONDERILMEZ; Stripe dinamik olarak belirler.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${env.CLIENT_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_APP_URL}/billing/cancel`,
      metadata: { userId: req.user.id, plan: 'pro' },
      // Subscription nesnesine de metadata yaz; webhook'ta kullaniciyi bulmak icin.
      subscription_data: { metadata: { userId: req.user.id, plan: 'pro' } },
    });

    return res.json({ checkoutUrl: session.url });
  } catch (err) {
    return next(err);
  }
}

// POST /api/billing/create-portal-session  (auth zorunlu)
export async function createPortalSession(req, res, next) {
  try {
    const profile = await getBillingProfile({ userId: req.user.id });
    if (!profile?.stripe_customer_id) {
      return res.status(400).json({
        status: 'error',
        code: 'NO_STRIPE_CUSTOMER',
        message:
          'Stripe musteri kaydi bulunamadi. Once Pro plana gecmeniz gerekir.',
      });
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${env.CLIENT_APP_URL}/dashboard`,
    });

    return res.json({ portalUrl: session.url });
  } catch (err) {
    return next(err);
  }
}

// GET /api/billing/me  (auth zorunlu)
export async function billingMe(req, res, next) {
  try {
    const { plan, monthlyLimit } = await getUserPlan({ userId: req.user.id });
    const profile = await getBillingProfile({ userId: req.user.id });
    return res.json({
      plan,
      monthlyLimit,
      subscriptionStatus: profile?.subscription_status ?? null,
      currentPeriodEnd: profile?.current_period_end ?? null,
    });
  } catch (err) {
    return next(err);
  }
}

// Webhook event'lerini isleyen yardimcilar.
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  if (!userId || session.metadata?.plan !== 'pro') return;
  await updateUserPlanByUserId({
    userId,
    updates: {
      plan: 'pro',
      monthly_limit: PRO_LIMIT,
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: session.subscription || null,
      subscription_status: 'active',
    },
  });
}

async function handleSubscriptionChange(subscription) {
  const status = subscription.status;
  const plan = planForStatus(status);
  const updates = {
    plan,
    monthly_limit: limitForPlan(plan),
    subscription_status: status,
    current_period_end: periodEndIso(subscription),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer || null,
  };

  // Once subscription id ile bul; bulunamazsa metadata.userId'ye gore yaz.
  const affected = await updateUserPlanBySubscriptionId({
    subscriptionId: subscription.id,
    updates,
  });
  if (affected.length === 0 && subscription.metadata?.userId) {
    await updateUserPlanByUserId({
      userId: subscription.metadata.userId,
      updates,
    });
  }
}

async function handleSubscriptionDeleted(subscription) {
  const updates = {
    plan: 'free',
    monthly_limit: FREE_LIMIT,
    subscription_status: 'canceled',
    current_period_end: periodEndIso(subscription),
  };
  const affected = await updateUserPlanBySubscriptionId({
    subscriptionId: subscription.id,
    updates,
  });
  if (affected.length === 0 && subscription.metadata?.userId) {
    await updateUserPlanByUserId({
      userId: subscription.metadata.userId,
      updates,
    });
  }
}

// POST /api/billing/webhook  (auth YOK; Stripe imzasi ile dogrulanir)
// req.body raw Buffer olmali (express.raw ile baglanir).
export async function stripeWebhook(req, res) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'Stripe webhook secret yapilandirilmamis.',
      code: 'STRIPE_WEBHOOK_SECRET_MISSING',
    });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        // Diger eventler MVP'de yok sayilir.
        break;
    }
  } catch (err) {
    // Isleme hatasi: 500 dondur ki Stripe tekrar denesin.
    console.error('[billing] webhook isleme hatasi:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }

  return res.json({ received: true });
}
