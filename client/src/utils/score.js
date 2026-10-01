export const SCORE_THRESHOLDS = {
  strong: 75,
  review: 50,
};

export const SCORE_HEX = {
  success: '#34d399',
  warning: '#fbbf24',
  error: '#fb7185',
  default: '#94a3b8',
};

export function parseScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export function getScoreColor(scoreValue) {
  const score = parseScore(scoreValue);
  if (score === null) return 'default';
  if (score >= SCORE_THRESHOLDS.strong) return 'success';
  if (score >= SCORE_THRESHOLDS.review) return 'warning';
  return 'error';
}

export function getScoreHex(scoreValue) {
  return SCORE_HEX[getScoreColor(scoreValue)];
}

export function getScoreMeta(appOrScore) {
  const rawScore = typeof appOrScore === 'object' && appOrScore !== null ? appOrScore.atsScore : appOrScore;
  const score = parseScore(rawScore);
  return {
    hasScore: score !== null,
    score,
    scoreColor: getScoreColor(score),
  };
}
