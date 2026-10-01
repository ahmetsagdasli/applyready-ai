import { getSupabaseAdmin } from '../config/supabase.js';

// Liste/ozet icin cekilecek kolonlar (match_result'tan atsScore turetilir).
const SUMMARY_COLUMNS =
  'id, target_position, language, style, created_at, updated_at, match_result';

const FULL_COLUMNS = '*';

function dbError(message) {
  const err = new Error(message);
  err.statusCode = 500;
  err.code = 'DB_ERROR';
  return err;
}

function notFound() {
  const err = new Error('Basvuru bulunamadi.');
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  return err;
}

// Yeni basvuru olusturur. payload kolon adlariyla (snake_case) gelir.
export async function createApplication({ userId, payload }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('applications')
    .insert({ ...payload, user_id: userId })
    .select('id')
    .single();

  if (error) throw dbError(`Basvuru kaydedilemedi: ${error.message}`);
  return data;
}

// Kullanicinin basvurularini ozet olarak listeler.
export async function listApplications({ userId }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('applications')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw dbError(`Basvurular listelenemedi: ${error.message}`);
  return data || [];
}

// Tek basvuruyu (kullaniciya ait) doner; yoksa 404.
export async function getApplicationById({ userId, applicationId }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('applications')
    .select(FULL_COLUMNS)
    .eq('user_id', userId)
    .eq('id', applicationId)
    .maybeSingle();

  if (error) throw dbError(`Basvuru alinamadi: ${error.message}`);
  if (!data) throw notFound();
  return data;
}

// editable alanlari gunceller; sadece kullaniciya ait kayitta calisir.
export async function updateApplication({ userId, applicationId, updates }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', applicationId)
    .select(FULL_COLUMNS)
    .maybeSingle();

  if (error) throw dbError(`Basvuru guncellenemedi: ${error.message}`);
  if (!data) throw notFound();
  return data;
}

// Basvuruyu siler; sadece kullaniciya ait kayitta calisir.
export async function deleteApplication({ userId, applicationId }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('user_id', userId)
    .eq('id', applicationId)
    .select('id');

  if (error) throw dbError(`Basvuru silinemedi: ${error.message}`);
  if (!data || data.length === 0) throw notFound();
  return { id: applicationId };
}
