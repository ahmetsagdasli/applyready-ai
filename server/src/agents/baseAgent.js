import { generateRaw, generateRawStream } from '../llm/index.js';

// Zod semasina karsi dogrular; UYUMSUZLUK AKISI DURDURMAZ, sadece loglar.
// Neden "validate-and-block" degil: mevcut normalize*() fonksiyonlari zaten
// esnek/hosgorulu coercion yapiyor (ensureArray/ensureString/vb.) ve
// kullanicilar icin canli akisi kirmak, semayi %100 tam yazmamis olmanin
// bedelini kullaniciya odetmek anlamina gelir. Ama uyumsuzluk yine de
// -model guvenilirligini olcmek icin- loglanir; /api/admin/ai-usage ile
// birlikte "modelin JSON semasina ne siklikla sadik kaldigi" izlenebilir.
function validateAgentSchema(json, schema, agentName) {
  if (!schema) return;
  const result = schema.safeParse(json);
  if (!result.success) {
    console.warn(`[schema-validation] ${agentName} beklenen semaya uymadi`, {
      agent: agentName,
      issues: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }
}

// statusCode ve code tasiyan standart ajan hatasi uretir.
export function createAgentError(message, statusCode = 502, code = 'AGENT_ERROR') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

// Ham model ciktisini temizleyip JSON.parse eder.
// - code fence (```json ... ```) temizler
// - ilk '{' ile son '}' arasini ayiklar (bas/son aciklama metnine karsi)
// - parse edilemezse hata firlatir.
export function normalizeJsonResponse(rawContent) {
  let text = String(rawContent || '').trim();

  if (text.startsWith('```')) {
    text = text
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
  }

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }

  return JSON.parse(text);
}

// OpenAI'dan JSON ister; bozuk gelirse 1 kez retry eder.
// Ikinci denemede de bozuksa ajana ozel 502 firlatir.
// generateRaw kaynakli hatalar (timeout 504, API 502) oldugu gibi yukari gider.
export async function safeGenerateJson({
  systemPrompt,
  userPrompt,
  schemaName,
  agentName,
  temperature = 0.2,
  responseSchema,
}) {
  // 1. deneme
  const raw1 = await generateRaw({ systemPrompt, userPrompt, temperature, agentName });
  try {
    const json1 = normalizeJsonResponse(raw1);
    validateAgentSchema(json1, responseSchema, agentName);
    return json1;
  } catch (e) {
    if (e?.name !== 'SyntaxError') throw e;
    // JSON.parse hatasi -> retry
  }

  // 2. deneme (daha kati JSON talimatiyla)
  const retryUserPrompt =
    `${userPrompt}\n\n` +
    'ONEMLI: Onceki yanit gecerli JSON degildi. SADECE gecerli JSON dondur. ' +
    'Markdown, aciklama veya code fence kullanma.';

  const raw2 = await generateRaw({
    systemPrompt,
    userPrompt: retryUserPrompt,
    temperature,
    agentName,
  });
  try {
    const json2 = normalizeJsonResponse(raw2);
    validateAgentSchema(json2, responseSchema, agentName);
    return json2;
  } catch (e) {
    if (e?.name !== 'SyntaxError') throw e;
    throw createAgentError(
      `${agentName} gecerli JSON donduremedi.`,
      502,
      'LLM_JSON_PARSE'
    );
  }
}

// schemaName su an log/okunabilirlik icin kullanilir (telemetry log etiketi).
// Yapisal dogrulama artik responseSchema (Zod) ile yapilir — bkz. agents/schemas.js.

// safeGenerateJson'un token-streaming versiyonu. onToken(deltaText) her
// parca geldiginde cagirilir (orn. SSE ile UI'a canli yazim efekti vermek
// icin). Streaming sirasinda JSON bozuk gelirse (nadir ama mumkun) kullaniciya
// kismi metin GOSTERILMIS olur; bu durumda retry YAPMIYORUZ (duplicate/kafa
// karistirici UI onlemek icin) — bunun yerine sessizce normal (non-streaming,
// kendi JSON-retry'ina sahip) safeGenerateJson'a tek seferlik fallback
// yapiyoruz. Yani kullanici en kotu durumda "typing efekti kesilir, sonuc
// yine de dogru JSON olarak gelir" deneyimi yasar; hic JSON almaz durumuna
// dusmez.
export async function safeGenerateJsonStream({
  systemPrompt,
  userPrompt,
  schemaName,
  agentName,
  temperature = 0.2,
  responseSchema,
  onToken,
}) {
  const raw = await generateRawStream({
    systemPrompt,
    userPrompt,
    temperature,
    agentName,
    onToken,
  });

  try {
    const json = normalizeJsonResponse(raw);
    validateAgentSchema(json, responseSchema, agentName);
    return json;
  } catch (e) {
    if (e?.name !== 'SyntaxError') throw e;
    console.warn(
      `[llm-stream] ${agentName} streaming ciktisi gecersiz JSON; non-streaming fallback'e geciliyor.`
    );
    return safeGenerateJson({
      systemPrompt,
      userPrompt,
      schemaName,
      agentName,
      temperature,
      responseSchema,
    });
  }
}
