import { extractToken, getUserFromToken } from './auth.js';

// Opsiyonel auth: token varsa dogrula ve req.user ekle; yoksa veya gecersizse
// guest olarak devam et (girissiz demo akisini bozmaz).
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const user = await getUserFromToken(token);
    if (user) req.user = user;
  }
  return next();
}
