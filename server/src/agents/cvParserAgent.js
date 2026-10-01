import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { safeGenerateJson } from './baseAgent.js';
import {
  ensureArray,
  normalizeConfidence,
} from '../utils/agentValidation.js';
import {
  normalizeLanguageList,
  splitLanguagesFromSkills,
} from '../utils/humanLanguages.js';
import { wrapUntrustedContent, detectPromptInjection } from '../utils/promptSafety.js';
import { parsedCvSchema } from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prompt dosyasi modul yuklenirken bir kez okunur.
const systemPrompt = readFileSync(
  join(__dirname, '../prompts/cvParser.md'),
  'utf-8'
);

function normalizeParsedCv(cv) {
  const out = cv && typeof cv === 'object' ? cv : {};
  const separated = splitLanguagesFromSkills(
    ensureArray(out.skills),
    ensureArray(out.languages)
  );
  out.skills = separated.skills;
  out.experience = ensureArray(out.experience);
  out.education = ensureArray(out.education);
  out.projects = ensureArray(out.projects);
  out.certifications = ensureArray(out.certifications);
  out.languages = normalizeLanguageList(separated.languages);
  if (!out._meta || typeof out._meta !== 'object') out._meta = {};
  out._meta.missing_fields = ensureArray(out._meta.missing_fields);
  out._meta.confidence = normalizeConfidence(out._meta.confidence);
  return out;
}

// Duz CV metnini yapilandirilmis parsed CV JSON'una donusturur.
export async function parseCvTextToJson(cvText) {
  const injectionCheck = detectPromptInjection(cvText);
  if (injectionCheck.suspicious) {
    console.warn('[prompt-safety] CV metninde supheli talimat kalibi tespit edildi', {
      agent: 'CV Parser Agent',
      matches: injectionCheck.matches,
    });
  }

  const userPrompt =
    'Asagidaki CV metnini ayristir ve istenen JSON semasina gore donustur. ' +
    'Metinde olmayan hicbir bilgiyi uydurma.\n\n' +
    wrapUntrustedContent('CV_TEXT', cvText);

  const json = await safeGenerateJson({
    systemPrompt,
    userPrompt,
    schemaName: 'parsedCv',
    agentName: 'CV Parser Agent',
    responseSchema: parsedCvSchema,
  });

  return normalizeParsedCv(json);
}
