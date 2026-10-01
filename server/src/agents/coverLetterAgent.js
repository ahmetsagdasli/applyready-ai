import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { safeGenerateJson } from './baseAgent.js';
import { ensureArray, ensureString } from '../utils/agentValidation.js';
import { formatVerifiedFactsBlock } from '../services/gap/verifiedFacts.js';
import { coverLetterSchema } from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prompt dosyasi modul yuklenirken bir kez okunur.
const systemPrompt = readFileSync(
  join(__dirname, '../prompts/coverLetter.md'),
  'utf-8'
);

function normalizeCoverLetter(cl) {
  const out = cl && typeof cl === 'object' ? cl : {};
  out.subject = ensureString(out.subject);
  out.greeting = ensureString(out.greeting);
  out.body = ensureString(out.body);
  out.closing = ensureString(out.closing);
  out.plainText = ensureString(out.plainText);

  if (!out._meta || typeof out._meta !== 'object') out._meta = {};
  out._meta.companyUsed = ensureString(out._meta.companyUsed);
  out._meta.sourceWarnings = ensureArray(out._meta.sourceWarnings);
  out._meta.notIncludedBecauseMissing = ensureArray(
    out._meta.notIncludedBecauseMissing
  );
  return out;
}

// tailoredCv + parsedCv + jobAnalysis + matchResult kullanarak ilana ozel on yazi uretir.
export async function writeCoverLetter({
  parsedCv,
  jobAnalysis,
  matchResult,
  tailoredCv,
  targetPosition,
  language,
  style,
  verifiedFacts = [],
}) {
  const userPrompt =
    `Hedef pozisyon: "${targetPosition || ''}".\n` +
    `Dil (language): "${language}". Tarz (style): "${style}".\n` +
    'Asagidaki verileri kullanarak ilana ozel, uydurmasiz bir on yazi uret. ' +
    "Sirket adi yalnizca jobAnalysis.company'den gelir; eksik beceriler " +
    'kazanilmis gibi yazilamaz. DOGRULANMIS EK BILGILER varsa dogal sekilde kullanabilirsin.\n\n' +
    `--- PARSED_CV (JSON) ---\n${JSON.stringify(parsedCv)}\n` +
    `--- JOB_ANALYSIS (JSON) ---\n${JSON.stringify(jobAnalysis)}\n` +
    `--- MATCH_RESULT (JSON) ---\n${JSON.stringify(matchResult)}\n` +
    `--- TAILORED_CV (JSON) ---\n${JSON.stringify(tailoredCv)}` +
    formatVerifiedFactsBlock(verifiedFacts);

  const json = await safeGenerateJson({
    systemPrompt,
    userPrompt,
    schemaName: 'coverLetter',
    agentName: 'Cover Letter Agent',
    responseSchema: coverLetterSchema,
  });

  return normalizeCoverLetter(json);
}
