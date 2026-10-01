import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { safeGenerateJson } from './baseAgent.js';
import {
  ensureArray,
  ensureString,
  normalizeConfidence,
} from '../utils/agentValidation.js';
import { wrapUntrustedContent, detectPromptInjection } from '../utils/promptSafety.js';
import { jobAnalysisSchema } from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prompt dosyasi modul yuklenirken bir kez okunur.
const systemPrompt = readFileSync(
  join(__dirname, '../prompts/jobAnalyzer.md'),
  'utf-8'
);

const ARRAY_FIELDS = [
  'requiredSkills',
  'preferredSkills',
  'technicalSkills',
  'softSkills',
  'responsibilities',
  'qualifications',
  'atsKeywords',
  'toolsAndTechnologies',
  'languages',
  'educationRequirements',
  'experienceRequirements',
  'redFlagsOrNotes',
];

function normalizeJobAnalysis(job) {
  const out = job && typeof job === 'object' ? job : {};
  for (const field of ARRAY_FIELDS) out[field] = ensureArray(out[field]);
  out.company = ensureString(out.company);
  out.location = ensureString(out.location);
  out.industry = ensureString(out.industry);
  const pt = ensureString(out.positionType).toLowerCase();
  out.positionType = ['technical', 'domain', 'hybrid'].includes(pt) ? pt : 'unknown';
  if (!out._meta || typeof out._meta !== 'object') out._meta = {};
  out._meta.missing_fields = ensureArray(out._meta.missing_fields);
  out._meta.confidence = normalizeConfidence(out._meta.confidence);
  return out;
}

// Is ilani metnini yapilandirilmis jobAnalysis JSON'una donusturur.
export async function analyzeJobTextToJson(jobText, targetPosition) {
  const injectionCheck = detectPromptInjection(jobText);
  if (injectionCheck.suspicious) {
    console.warn('[prompt-safety] Is ilani metninde supheli talimat kalibi tespit edildi', {
      agent: 'Job Analyzer Agent',
      matches: injectionCheck.matches,
    });
  }

  const userPrompt =
    `Kullanicinin hedef pozisyonu: "${targetPosition || ''}".\n` +
    'Asagidaki is ilani metnini analiz et ve istenen JSON semasina gore donustur. ' +
    'Ilanda olmayan hicbir bilgiyi uydurma.\n\n' +
    wrapUntrustedContent('JOB_TEXT', jobText);

  const json = await safeGenerateJson({
    systemPrompt,
    userPrompt,
    schemaName: 'jobAnalysis',
    agentName: 'Job Analyzer Agent',
    responseSchema: jobAnalysisSchema,
  });

  return normalizeJobAnalysis(json);
}
