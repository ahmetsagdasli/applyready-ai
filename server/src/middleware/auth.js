import { getSupabaseAdmin } from '../config/supabase.js';
import env from '../config/env.js';

// Authorization header'indan Bearer token'i okur.
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

// Token'i Supabase ile dogrular; gecerliyse { id, email } dondurur, degilse null.
export async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

// Zorunlu auth: token yoksa veya gecersizse 401.
export async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ status: 'error', message: 'Giris yapmaniz gerekiyor.' });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res
      .status(401)
      .json({ status: 'error', message: 'Oturum gecersiz veya suresi dolmus.' });
  }

  req.user = user;
  return next();
}

// requireAuth sonrasi baglanir. ADMIN_EMAILS env'i bos ise (dev ortaminda
// yapilandirilmamissa) herkesi reddeder ve bunu loglar — "unutulmus acik
// endpoint" riskine karsi varsayilan KAPALI davranir.
export function requireAdmin(req, res, next) {
  if (!env.ADMIN_EMAILS.length) {
    console.warn('[auth] ADMIN_EMAILS yapilandirilmamis; admin endpoint erisimi reddedildi.');
    return res.status(403).json({
      status: 'error',
      message: 'Admin erisimi yapilandirilmamis (ADMIN_EMAILS).',
    });
  }
  const email = (req.user?.email || '').toLowerCase();
  if (!email || !env.ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ status: 'error', message: 'Bu kaynaga erisim yetkiniz yok.' });
  }
  return next();
}

export { extractToken };
