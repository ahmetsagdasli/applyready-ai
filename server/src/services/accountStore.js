import { getSupabaseAdmin } from '../config/supabase.js';

function dbError(message) {
  const err = new Error(message);
  err.statusCode = 500;
  err.code = 'DB_ERROR';
  return err;
}

// Kullanicinin profil + plan + tum basvuru/kullanim verisini (sadece kendi) doner.
export async function exportAccountData({ userId }) {
  const supabase = getSupabaseAdmin();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (profileError)
    throw dbError(`Profil alinamadi: ${profileError.message}`);

  const { data: userPlan, error: planError } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (planError) throw dbError(`Plan alinamadi: ${planError.message}`);

  const { data: applications, error: appsError } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (appsError)
    throw dbError(`Basvurular alinamadi: ${appsError.message}`);

  const { data: usageLogs, error: usageError } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (usageError)
    throw dbError(`Kullanim kayitlari alinamadi: ${usageError.message}`);

  return {
    profile: profile || null,
    userPlan: userPlan || null,
    applications: applications || [],
    usageLogs: usageLogs || [],
    exportedAt: new Date().toISOString(),
  };
}

// Kullanicinin basvurularini + kullanim kayitlarini siler; profil/plan/auth kalir.
export async function deleteApplicationData({ userId }) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('user_id', userId)
    .select('id');
  if (error) throw dbError(`Basvurular silinemedi: ${error.message}`);

  // Kullanim kayitlari da kisisel veridir; KVKK kapsaminda silinir.
  const { error: usageError } = await supabase
    .from('usage_logs')
    .delete()
    .eq('user_id', userId);
  if (usageError)
    throw dbError(`Kullanim kayitlari silinemedi: ${usageError.message}`);

  return { deletedApplications: data ? data.length : 0 };
}

// Tum uygulama verisi + plan + profil (auth kullanicisi haric) silinir.
export async function deleteAccountData({ userId }) {
  const { deletedApplications } = await deleteApplicationData({ userId });

  const supabase = getSupabaseAdmin();

  const { error: planError } = await supabase
    .from('user_plans')
    .delete()
    .eq('user_id', userId);
  if (planError) throw dbError(`Plan silinemedi: ${planError.message}`);

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (profileError)
    throw dbError(`Profil silinemedi: ${profileError.message}`);

  return { deletedApplications };
}

// Supabase auth kullanicisini admin API ile siler.
export async function deleteAuthUser({ userId }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    const err = new Error(`Auth kullanicisi silinemedi: ${error.message}`);
    err.statusCode = 500;
    err.code = 'AUTH_USER_DELETE_FAILED';
    throw err;
  }
  return { ok: true };
}
