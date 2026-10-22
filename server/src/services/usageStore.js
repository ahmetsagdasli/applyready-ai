import { getSupabaseAdmin } from '../config/supabase.js';

// AI analizini sayan aksiyon adi.
export const AI_ANALYSIS_ACTION = 'ai_application_analysis';

// Plan bazli aylik limitler. unlimited = sinirsiz (null).
const PLAN_LIMITS = {
  free: 10,
  pro: 100,
  unlimited: null,
};

function dbError(message) {
  const err = new Error(message);
  err.statusCode = 500;
  err.code = 'DB_ERROR';
  return err;
}

// Plan satirindan etkin aylik limiti cozer.
function resolveLimit(plan, storedLimit) {
  if (Object.prototype.hasOwnProperty.call(PLAN_LIMITS, plan)) {
    return PLAN_LIMITS[plan];
  }
  // Bilinmeyen plan: DB'deki monthly_limit, yoksa free varsayilani.
  return storedLimit ?? PLAN_LIMITS.free;
}

// Mevcut ayin (UTC) baslangici - ISO string.
function startOfMonthIso() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}

// Kullanicinin plan kaydini doner; yoksa free varsayilani.
export async function getUserPlan({ userId }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_plans')
    .select('plan, monthly_limit, subscription_status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw dbError(`Plan alinamadi: ${error.message}`);

  if (!data) {
    return {
      plan: 'free',
      monthlyLimit: PLAN_LIMITS.free,
      subscriptionStatus: null,
      currentPeriodEnd: null,
    };
  }
  return {
    plan: data.plan,
    monthlyLimit: resolveLimit(data.plan, data.monthly_limit),
    subscriptionStatus: data.subscription_status ?? null,
    currentPeriodEnd: data.current_period_end ?? null,
  };
}

// Bu ay verilen aksiyon icin kullanim sayisi.
export async function getMonthlyUsage({ userId, action = AI_ANALYSIS_ACTION }) {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('usage_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', startOfMonthIso());

  if (error) throw dbError(`Kullanim sayilamadi: ${error.message}`);
  return count || 0;
}

// Ortak ozet hesaplayici.
async function buildSummary({ userId }) {
  const { plan, monthlyLimit, subscriptionStatus, currentPeriodEnd } =
    await getUserPlan({ userId });
  const usedThisMonth = await getMonthlyUsage({
    userId,
    action: AI_ANALYSIS_ACTION,
  });

  const unlimited = monthlyLimit === null;
  const remaining = unlimited
    ? null
    : Math.max(0, monthlyLimit - usedThisMonth);

  return {
    plan,
    monthlyLimit,
    usedThisMonth,
    remaining,
    unlimited,
    subscriptionStatus,
    currentPeriodEnd,
  };
}

// AI analizi calistirma izni var mi?
export async function canRunAiAnalysis({ userId }) {
  const summary = await buildSummary({ userId });
  const { plan, monthlyLimit, usedThisMonth, remaining, unlimited } = summary;

  if (unlimited || usedThisMonth < monthlyLimit) {
    return { allowed: true, plan, monthlyLimit, usedThisMonth, remaining };
  }

  return {
    allowed: false,
    plan,
    monthlyLimit,
    usedThisMonth,
    remaining: 0,
    message: 'Aylik ucretsiz analiz hakkiniz doldu.',
  };
}

// Kullanim kaydi ekler.
export async function recordUsage({
  userId,
  action = AI_ANALYSIS_ACTION,
  applicationId = null,
  tokensUsed = null,
  costEstimate = null,
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('usage_logs').insert({
    user_id: userId,
    action,
    application_id: applicationId,
    tokens_used: tokensUsed,
    cost_estimate: costEstimate,
  });

  if (error) throw dbError(`Kullanim kaydedilemedi: ${error.message}`);
  return { ok: true };
}

// Plan + kullanim ozeti (frontend icin).
export async function getUsageSummary({ userId }) {
  const {
    plan,
    monthlyLimit,
    usedThisMonth,
    remaining,
    subscriptionStatus,
    currentPeriodEnd,
  } = await buildSummary({ userId });
  return {
    plan,
    monthlyLimit,
    usedThisMonth,
    remaining,
    subscriptionStatus,
    currentPeriodEnd,
  };
}
