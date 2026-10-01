import { z } from 'zod';

import { safeGenerateJson } from '../src/agents/baseAgent.js';
import { wrapUntrustedContent } from '../src/utils/promptSafety.js';

// LLM-as-judge: uretilen CV + on yazi metninin kaynak CV'de GECMEYEN hicbir
// bilgi icermedigini degerlendirir. Deterministik substring/semantic
// kontrollerin (antiHallucinationCheck) YAKALAYAMAYACAGI daha "anlamsal"
// uydurmalari (orn. "5 yillik deneyim" iken "7 yil" yazilmasi, olmayan bir
// basari metriginin eklenmesi) tespit etmek icin ikinci bir savunma hatti.
//
// Bu production agent'i DEGIL — sadece eval harness icin kullanilan bir
// degerlendirme aracidir (bu yuzden server/evals/ altinda, src/agents/
// disinda tutuluyor).

export const judgeResultSchema = z.object({
  faithfulnessScore: z.number().min(0).max(1),
  violations: z.array(z.string()).optional(),
  reasoning: z.string().optional(),
});

const JUDGE_SYSTEM_PROMPT = `Sen kati bir QA degerlendiricisin. Gorevin, bir AI
tarafindan uretilen CV ve on yazi metninin, KAYNAK CV'de GECMEYEN hicbir
iddia (sirket, teknoloji, metrik, sure, basari, unvan) icermedigini kontrol
etmektir. Kaynak CV'de ACIKCA olmayan veya kaynakla CELISEN her iddia bir
"violation"dir. Yorum yapma, sadece SADECE asagidaki JSON semasini dondur:

{
  "faithfulnessScore": 0.0-1.0 (1.0 = hic uydurma yok, 0.0 = agir uydurma),
  "violations": ["kisa aciklama", ...],
  "reasoning": "kisa gerekce (1-2 cumle)"
}`;

export async function judgeFaithfulness({ sourceCvText, tailoredCv, coverLetter }) {
  const userPrompt =
    'Asagida KAYNAK CV METNI ve AI tarafindan uretilen CV/on yazi JSON\'u var. ' +
    "Uretilen metinde kaynakta olmayan hicbir sey var mi degerlendir.\n\n" +
    wrapUntrustedContent('SOURCE_CV_TEXT', sourceCvText) +
    `\n\n--- URETILEN_TAILORED_CV (JSON) ---\n${JSON.stringify(tailoredCv)}` +
    `\n\n--- URETILEN_COVER_LETTER (JSON) ---\n${JSON.stringify(coverLetter)}`;

  return safeGenerateJson({
    systemPrompt: JUDGE_SYSTEM_PROMPT,
    userPrompt,
    schemaName: 'judgeResult',
    agentName: 'Eval Judge',
    responseSchema: judgeResultSchema,
    temperature: 0,
  });
}
