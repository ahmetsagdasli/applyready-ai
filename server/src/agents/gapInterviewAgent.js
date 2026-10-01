import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { safeGenerateJson } from './baseAgent.js';
import { ensureArray, ensureString } from '../utils/agentValidation.js';
import { wrapUntrustedContent, detectPromptInjection } from '../utils/promptSafety.js';
import { gapBulletsSchema } from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prompt dosyasi modul yuklenirken bir kez okunur.
const systemPrompt = readFileSync(
  join(__dirname, '../prompts/gapInterview.md'),
  'utf-8'
);

const VALID_SECTIONS = ['experience', 'projects', 'skills'];

function normalizeItems(json) {
  const items = ensureArray(json?.items).map((item) => {
    const section = ensureString(item?.section).toLowerCase();
    return {
      keyword: ensureString(item?.keyword),
      bullet: ensureString(item?.bullet),
      section: VALID_SECTIONS.includes(section) ? section : 'skills',
    };
  });
  // Bos bullet uretilmis olanlari at (uydurma onleme).
  return items.filter((it) => it.bullet.trim().length > 0);
}

// Kullanicinin gap cevaplarini ATS uyumlu, uydurmasiz bullet'lara cevirir.
// answers: [{ keyword, answer }] (sadece kullanicinin "var" dedigi, dolu cevaplar)
export async function generateGapBullets({ answers, parsedCv, language, style }) {
  const cleaned = (answers || [])
    .filter((a) => a && a.answer && String(a.answer).trim().length > 0)
    .map((a) => ({ keyword: String(a.keyword || ''), answer: String(a.answer) }));

  if (cleaned.length === 0) return [];

  const injectionCheck = detectPromptInjection(
    cleaned.map((a) => a.answer).join('\n')
  );
  if (injectionCheck.suspicious) {
    console.warn('[prompt-safety] Gap cevabinda supheli talimat kalibi tespit edildi', {
      agent: 'Gap Interview Agent',
      matches: injectionCheck.matches,
    });
  }

  const userPrompt =
    `Dil (language): "${language}". Tarz (style): "${style}".\n` +
    'Asagida kullanicinin gap sorularina verdigi GERCEK cevaplar var. Her cevabi ' +
    'tek bir ATS uyumlu bullet\'a cevir. SADECE cevaptaki bilgiyi kullan, uydurma.\n\n' +
    wrapUntrustedContent('GAP_ANSWERS_JSON', JSON.stringify(cleaned)) +
    `\n\n--- BAGLAM ICIN PARSED_CV (JSON, sadece referans) ---\n${JSON.stringify(parsedCv || {})}`;

  const json = await safeGenerateJson({
    systemPrompt,
    userPrompt,
    schemaName: 'gapBullets',
    agentName: 'Gap Interview Agent',
    responseSchema: gapBulletsSchema,
  });

  return normalizeItems(json);
}
