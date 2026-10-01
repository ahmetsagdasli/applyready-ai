import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { safeGenerateJson, safeGenerateJsonStream } from './baseAgent.js';
import { ensureArray, ensureString } from '../utils/agentValidation.js';
import {
  normalizeLanguageList,
  splitLanguagesFromSkills,
} from '../utils/humanLanguages.js';
import { formatVerifiedFactsBlock } from '../services/gap/verifiedFacts.js';
import { tailoredCvSchema } from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prompt dosyasi modul yuklenirken bir kez okunur.
const systemPrompt = readFileSync(
  join(__dirname, '../prompts/cvWriter.md'),
  'utf-8'
);

// 0-1 araliginda relevance; gecersizse 0.5 (notr).
function clampRelevance(v) {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.max(0, Math.min(1, n));
  return 0.5;
}

function normalizeDisplay(v) {
  return ensureString(v).toLowerCase() === 'condensed' ? 'condensed' : 'full';
}

function normalizeExperienceItem(item) {
  const it = item && typeof item === 'object' ? item : {};
  return {
    company: ensureString(it.company),
    title: ensureString(it.title),
    period: ensureString(it.period),
    bullets: ensureArray(it.bullets),
    relevance: clampRelevance(it.relevance),
    recommendedDisplay: normalizeDisplay(it.recommendedDisplay),
  };
}

function normalizeProjectItem(item) {
  const it = item && typeof item === 'object' ? item : {};
  return {
    name: ensureString(it.name),
    description: ensureString(it.description),
    technologies: ensureArray(it.technologies),
    bullets: ensureArray(it.bullets),
    relevance: clampRelevance(it.relevance),
    recommendedDisplay: normalizeDisplay(it.recommendedDisplay),
  };
}

function normalizeEducationItem(item) {
  const it = item && typeof item === 'object' ? item : {};
  return {
    school: ensureString(it.school),
    degree: ensureString(it.degree),
    field: ensureString(it.field),
    period: ensureString(it.period),
    gpa: ensureString(it.gpa),
    relevance: clampRelevance(it.relevance),
    recommendedDisplay: normalizeDisplay(it.recommendedDisplay),
  };
}

function normalizeTailoredCv(cv) {
  const out = cv && typeof cv === 'object' ? cv : {};
  out.title = ensureString(out.title);
  out.professionalSummary = ensureString(out.professionalSummary);
  out.plainText = ensureString(out.plainText);

  const skills = out.skills && typeof out.skills === 'object' ? out.skills : {};
  const languageCandidates = ensureArray(out.languages);
  const highlighted = splitLanguagesFromSkills(
    ensureArray(skills.highlighted),
    languageCandidates
  );
  const technical = splitLanguagesFromSkills(
    ensureArray(skills.technical),
    highlighted.languages
  );
  const domain = splitLanguagesFromSkills(
    ensureArray(skills.domain),
    technical.languages
  );
  const soft = splitLanguagesFromSkills(
    ensureArray(skills.soft),
    domain.languages
  );
  out.skills = {
    highlighted: highlighted.skills,
    technical: technical.skills,
    domain: domain.skills,
    soft: soft.skills,
  };

  out.experience = ensureArray(out.experience).map(normalizeExperienceItem);
  out.projects = ensureArray(out.projects).map(normalizeProjectItem);
  out.education = ensureArray(out.education).map(normalizeEducationItem);
  out.certifications = ensureArray(out.certifications);
  out.languages = normalizeLanguageList(soft.languages);
  out.additionalSections = ensureArray(out.additionalSections);

  // Gorev 4 — bolum sirasi (gecerli anahtarlar; gecersizleri ele).
  const VALID_SECTIONS = [
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
    'languages',
  ];
  out.sectionOrder = ensureArray(out.sectionOrder)
    .map((s) => ensureString(s).toLowerCase())
    .filter((s) => VALID_SECTIONS.includes(s));

  if (!out._meta || typeof out._meta !== 'object') out._meta = {};
  out._meta.sourceWarnings = ensureArray(out._meta.sourceWarnings);
  out._meta.notIncludedBecauseMissing = ensureArray(
    out._meta.notIncludedBecauseMissing
  );
  return out;
}

// Gorev 4 — positionType'a gore deterministik bolum sirasi (spec garantisi).
function orderForPositionType(positionType) {
  const tail = ['certifications', 'languages'];
  switch (positionType) {
    case 'technical':
      return ['summary', 'skills', 'projects', 'experience', 'education', ...tail];
    case 'domain':
      return ['summary', 'experience', 'skills', 'education', 'projects', ...tail];
    default: // hybrid / unknown
      return ['summary', 'skills', 'experience', 'projects', 'education', ...tail];
  }
}

// parsedCv + jobAnalysis + matchResult kullanarak ilana ozel CV uretir.
// onToken (opsiyonel): verilirse model ciktisi token-seviyesinde akar (orn.
// SSE ile UI'a "canli yaziliyor" efekti). Verilmezse davranis oncekiyle
// birebir aynidir (non-streaming).
export async function writeTailoredCv({
  parsedCv,
  jobAnalysis,
  matchResult,
  targetPosition,
  language,
  style,
  verifiedFacts = [],
  includeGpa = false,
  onToken,
}) {
  const userPrompt =
    `Hedef pozisyon: "${targetPosition || ''}".\n` +
    `Dil (language): "${language}". Tarz (style): "${style}". ` +
    `includeGpa: ${includeGpa ? 'true' : 'false'}.\n` +
    'Asagidaki verileri kullanarak ilana ozel, uydurmasiz bir CV uret. ' +
    "Sirket/okul/sertifika/proje/iletisim bilgileri SADECE parsedCv'den gelir; " +
    'eksik beceriler kazanilmis gibi yazilamaz. DOGRULANMIS EK BILGILER varsa ' +
    'bunlari ilgili bolume (experience/projects/skills) dogal sekilde entegre et.\n\n' +
    `--- PARSED_CV (JSON) ---\n${JSON.stringify(parsedCv)}\n` +
    `--- JOB_ANALYSIS (JSON) ---\n${JSON.stringify(jobAnalysis)}\n` +
    `--- MATCH_RESULT (JSON) ---\n${JSON.stringify(matchResult)}` +
    formatVerifiedFactsBlock(verifiedFacts);

  const generate = onToken ? safeGenerateJsonStream : safeGenerateJson;
  const json = await generate({
    systemPrompt,
    userPrompt,
    schemaName: 'tailoredCv',
    agentName: 'CV Writer Agent',
    responseSchema: tailoredCvSchema,
    onToken,
  });

  const cv = normalizeTailoredCv(json);
  // Bolum sirasini ilan tipine gore deterministik olarak garanti et.
  cv.sectionOrder = orderForPositionType(jobAnalysis?.positionType);
  return cv;
}
