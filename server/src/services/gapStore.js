import { getSupabaseAdmin } from '../config/supabase.js';

// Gorev 1 — gap_responses kayitlari.
// Backend service role ile yazar (RLS bypass); her zaman user_id ile birlikte.

// rows: [{ keyword, user_answer, generated_bullet, accepted }]
export async function saveGapResponses({ userId, applicationId, rows }) {
  if (!userId || !Array.isArray(rows) || rows.length === 0) return;
  const supabase = getSupabaseAdmin();
  const payload = rows.map((r) => ({
    user_id: userId,
    application_id: applicationId || null,
    keyword: String(r.keyword || ''),
    user_answer: r.user_answer ? String(r.user_answer) : null,
    generated_bullet: r.generated_bullet ? String(r.generated_bullet) : null,
    accepted: Boolean(r.accepted),
  }));

  const { error } = await supabase.from('gap_responses').insert(payload);
  // Kayit hatasi pahali AI sonucunu kaybettirmesin; sadece logla.
  if (error) console.error('[gap] kayit hatasi:', error.message);
}
