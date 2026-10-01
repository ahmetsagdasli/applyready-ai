import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { safeGenerateJson } from './baseAgent.js';
import {
  ensureArray,
  ensureString,
  ensureNumberRange,
  normalizeConfidence,
  normalizeScoreBreakdown,
} from '../utils/agentValidation.js';
import { matchResultSchema } from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prompt dosyasi modul yuklenirken bir kez okunur.
const systemPrompt = readFileSync(
  join(__dirname, '../prompts/matchScorer.md'),
  'utf-8'
);

const ARRAY_FIELDS = [
  'missingKeywords',
  'matchedKeywords',
  'strongMatches',
  'weakMatches',
  'gaps',
  'extraStrengths',
  'recommendations',
  'rewriteFocus',
];

const VALID_STATUS = ['matched', 'missing_fillable', 'missing_irrelevant'];

function normalizeKeywordBreakdown(list) {
  return ensureArray(list)
    .map((item) => {
      const status = ensureString(item?.status).toLowerCase();
      const weight = ensureString(item?.weight).toLowerCase();
      return {
        keyword: ensureString(item?.keyword),
        weight: weight === 'required' ? 'required' : 'preferred',
        status: VALID_STATUS.includes(status) ? status : 'missing_fillable',
        foundIn: ensureString(item?.foundIn),
        suggestedSource: ensureString(item?.suggestedSource),
      };
    })
    .filter((it) => it.keyword.trim().length > 0);
}

function normalizeMatchResult(match) {
  const out = match && typeof match === 'object' ? match : {};
  out.atsScore = ensureNumberRange(out.atsScore, 0, 100, 0);
  out.scoreBreakdown = normalizeScoreBreakdown(out.scoreBreakdown);
  for (const field of ARRAY_FIELDS) out[field] = ensureArray(out[field]);
  out.keywordBreakdown = normalizeKeywordBreakdown(out.keywordBreakdown);
  if (!out._meta || typeof out._meta !== 'object') out._meta = {};
  out._meta.confidence = normalizeConfidence(out._meta.confidence);
  out._meta.notes = ensureArray(out._meta.notes);
  return out;
}

// parsedCv ile jobAnalysis'i karsilastirip uyum skoru/analizi JSON'u uretir.
export async function scoreCvAgainstJob(parsedCv, jobAnalysis, targetPosition) {
  const userPrompt =
    `Kullanicinin hedef pozisyonu: "${targetPosition || ''}".\n` +
    'Asagidaki parsedCv ve jobAnalysis verilerini karsilastir ve istenen JSON ' +
    "semasina gore uyum analizi uret. CV'de olmayan hicbir seyi varmis gibi gosterme.\n\n" +
    `--- PARSED_CV (JSON) ---\n${JSON.stringify(parsedCv)}\n` +
    `--- JOB_ANALYSIS (JSON) ---\n${JSON.stringify(jobAnalysis)}`;

  const json = await safeGenerateJson({
    systemPrompt,
    userPrompt,
    schemaName: 'matchResult',
    agentName: 'Match Scorer Agent',
    responseSchema: matchResultSchema,
  });

  return normalizeMatchResult(json);
}
