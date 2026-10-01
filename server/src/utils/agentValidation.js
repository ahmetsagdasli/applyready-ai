// Hafif normalizasyon yardimcilari. Buyuk zod semasi degil; sadece koruma.

export function ensureNumberRange(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function ensureString(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

// confidence hem nesne ({overall, ...}) hem tek sayi olabilir; ikisini de 0-1'e ceker.
export function normalizeConfidence(confidence) {
  if (
    confidence &&
    typeof confidence === 'object' &&
    !Array.isArray(confidence)
  ) {
    const out = {};
    for (const [key, val] of Object.entries(confidence)) {
      out[key] = ensureNumberRange(val, 0, 1, 0);
    }
    return out;
  }
  return ensureNumberRange(confidence, 0, 1, 0);
}

// scoreBreakdown icindeki tum degerleri 0-100'e ceker.
export function normalizeScoreBreakdown(scoreBreakdown) {
  const sb =
    scoreBreakdown && typeof scoreBreakdown === 'object' && !Array.isArray(scoreBreakdown)
      ? scoreBreakdown
      : {};
  const out = {};
  for (const [key, val] of Object.entries(sb)) {
    out[key] = ensureNumberRange(val, 0, 100, 0);
  }
  return out;
}
