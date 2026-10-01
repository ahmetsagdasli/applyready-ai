import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { safeGenerateJson } from './baseAgent.js';
import { ensureArray, ensureString } from '../utils/agentValidation.js';
import { formatVerifiedFactsBlock } from '../services/gap/verifiedFacts.js';
import { linkedinProfileSchema } from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prompt dosyasi modul yuklenirken bir kez okunur.
const systemPrompt = readFileSync(
  join(__dirname, '../prompts/linkedinAgent.md'),
  'utf-8'
);

function normalizeLinkedInProfile(profile) {
  const out = profile && typeof profile === 'object' ? profile : {};
  out.headline = ensureString(out.headline);
  out.about = ensureString(out.about);
  out.featuredSuggestions = ensureArray(out.featuredSuggestions);
  out.skillsToHighlight = ensureArray(out.skillsToHighlight);
  out.profileChecklist = ensureArray(out.profileChecklist);
  out.recommendedLearningAreas = ensureArray(out.recommendedLearningAreas);

  out.experienceRewriteSuggestions = ensureArray(
    out.experienceRewriteSuggestions
  ).map((item) => ({
    company: ensureString(item?.company),
    title: ensureString(item?.title),
    suggestedText: ensureString(item?.suggestedText),
    bulletSuggestions: ensureArray(item?.bulletSuggestions),
  }));

  if (!out._meta || typeof out._meta !== 'object') out._meta = {};
  out._meta.sourceWarnings = ensureArray(out._meta.sourceWarnings);
  out._meta.notIncludedBecauseMissing = ensureArray(
    out._meta.notIncludedBecauseMissing
  );
  return out;
}

// parsedCv + jobAnalysis + matchResult + tailoredCv kullanarak LinkedIn profil
// onerileri uretir.
export async function generateLinkedInProfile({
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
    'Asagidaki verileri kullanarak hedef pozisyona uygun, uydurmasiz LinkedIn ' +
    "profil onerileri uret. Sirket/title sadece parsedCv'den gelir; eksik " +
    'beceriler skillsToHighlight icine kazanilmis gibi yazilamaz. DOGRULANMIS EK ' +
    'BILGILER varsa about/experience onerilerine dogal sekilde yansitabilirsin.\n\n' +
    `--- PARSED_CV (JSON) ---\n${JSON.stringify(parsedCv)}\n` +
    `--- JOB_ANALYSIS (JSON) ---\n${JSON.stringify(jobAnalysis)}\n` +
    `--- MATCH_RESULT (JSON) ---\n${JSON.stringify(matchResult)}\n` +
    `--- TAILORED_CV (JSON) ---\n${JSON.stringify(tailoredCv)}` +
    formatVerifiedFactsBlock(verifiedFacts);

  const json = await safeGenerateJson({
    systemPrompt,
    userPrompt,
    schemaName: 'linkedinProfile',
    agentName: 'LinkedIn Agent',
    responseSchema: linkedinProfileSchema,
  });

  return normalizeLinkedInProfile(json);
}
