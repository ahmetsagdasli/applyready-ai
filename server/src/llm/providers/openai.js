import OpenAI from 'openai';

import { llmConfig, assertLlmConfigured } from '../../config/llm.js';
import { recordLlmCall } from '../telemetry.js';

// OpenAI cagrisi icin ust zaman siniri.
const REQUEST_TIMEOUT_MS = 60000;

// Gecici (transient) hatalarda retry sayisi ve backoff tabani.
// 429 (rate limit) ve 5xx sunucu hatalari transient kabul edilir; 4xx (400,
// 401, 403, 404...) kalici hatadir, retry edilmez.
const MAX_TRANSIENT_RETRIES = 2;
const BACKOFF_BASE_MS = 500;

let client = null;

function getClient() {
  assertLlmConfigured();
  if (!client) {
    // maxRetries: 0 -> retry kontrolu bizde (asagidaki backoff dongusu) kalsin.
    client = new OpenAI({ apiKey: llmConfig.apiKey, maxRetries: 0 });
  }
  return client;
}

function isTransientError(err) {
  const status = err?.status ?? err?.response?.status;
  return status === 429 || (status >= 500 && status <= 599);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ham (parse edilmemis) model ciktisini dondurur. JSON parse sorumlulugu
// baseAgent'a aittir. Timeout 504, diger API hatalari 502 olarak isaretlenir.
// agentName: telemetry/log icin ajan adi (zorunlu degil, ama onerilir).
//
// Bu fonksiyon llm/index.js'teki provider registry sozlesmesini (contract)
// uygular: generateRaw({ systemPrompt, userPrompt, temperature, agentName })
// -> Promise<string>. Yeni bir saglayici (orn. Anthropic) eklemek icin ayni
// imzaya sahip bir modul yazip registry'e eklemek yeterlidir.
export async function generateRaw({
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  agentName,
}) {
  const openai = getClient();
  const startedAt = Date.now();
  let attempt = 0;
  let lastErr;

  while (attempt <= MAX_TRANSIENT_RETRIES) {
    try {
      const completion = await openai.chat.completions.create(
        {
          model: llmConfig.model,
          temperature,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        { timeout: REQUEST_TIMEOUT_MS }
      );

      recordLlmCall({
        agentName,
        model: llmConfig.model,
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        latencyMs: Date.now() - startedAt,
        success: true,
        retried: attempt > 0,
      });

      return completion.choices?.[0]?.message?.content || '';
    } catch (err) {
      lastErr = err;
      const transient = isTransientError(err);
      if (transient && attempt < MAX_TRANSIENT_RETRIES) {
        // Us katlamali bekleme + jitter: 500ms, 1000ms, ...
        const backoff = BACKOFF_BASE_MS * 2 ** attempt + Math.random() * 200;
        await sleep(backoff);
        attempt += 1;
        continue;
      }
      break;
    }
  }

  const err = lastErr;
  const latencyMs = Date.now() - startedAt;

  if (err?.name === 'APIConnectionTimeoutError' || err?.code === 'ETIMEDOUT') {
    recordLlmCall({
      agentName,
      model: llmConfig.model,
      latencyMs,
      success: false,
      errorCode: 'LLM_TIMEOUT',
    });
    const e = new Error('AI cagrisi zaman asimina ugradi. Lutfen tekrar deneyin.');
    e.statusCode = 504;
    e.code = 'LLM_TIMEOUT';
    throw e;
  }

  recordLlmCall({
    agentName,
    model: llmConfig.model,
    latencyMs,
    success: false,
    errorCode: 'LLM_API_ERROR',
  });
  const e = new Error(`OpenAI cagrisi basarisiz oldu: ${err.message}`);
  e.statusCode = 502;
  e.code = 'LLM_API_ERROR';
  throw e;
}

// Gercek token-seviyesinde streaming. onToken(deltaText) her parca geldiginde
// cagirilir (orn. SSE ile UI'a "canli yaziliyor" efekti vermek icin). Donen
// deger, parcalarin birlestirilmis TAM metnidir (generateRaw ile ayni
// sozlesme: ham JSON string, parse sorumlulugu caller'a aittir).
//
// NOT: Streaming baslayip ilk token UI'a gittikten SONRA hata olursa retry
// YAPILMAZ (kullaniciya kismi/duplicate metin gostermemek icin) — hata
// oldugu gibi yukari firlatilir. Hic token gelmeden (baglanti kurulamadan)
// hata olursa generateRaw'daki gibi transient-retry uygulanir.
export async function generateRawStream({
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  agentName,
  onToken,
}) {
  const openai = getClient();
  const startedAt = Date.now();
  let attempt = 0;

  while (true) {
    let receivedAnyToken = false;
    let fullText = '';
    let usage = null;

    try {
      const stream = await openai.chat.completions.create(
        {
          model: llmConfig.model,
          temperature,
          response_format: { type: 'json_object' },
          stream: true,
          stream_options: { include_usage: true },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        { timeout: REQUEST_TIMEOUT_MS }
      );

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          receivedAnyToken = true;
          fullText += delta;
          onToken?.(delta);
        }
        if (chunk.usage) usage = chunk.usage;
      }

      recordLlmCall({
        agentName,
        model: llmConfig.model,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        latencyMs: Date.now() - startedAt,
        success: true,
        retried: attempt > 0,
      });

      return fullText;
    } catch (err) {
      if (receivedAnyToken) {
        recordLlmCall({
          agentName,
          model: llmConfig.model,
          latencyMs: Date.now() - startedAt,
          success: false,
          errorCode: 'LLM_STREAM_INTERRUPTED',
        });
        const e = new Error(`AI streaming kesildi: ${err.message}`);
        e.statusCode = 502;
        e.code = 'LLM_STREAM_INTERRUPTED';
        throw e;
      }

      const transient = isTransientError(err);
      if (transient && attempt < MAX_TRANSIENT_RETRIES) {
        const backoff = BACKOFF_BASE_MS * 2 ** attempt + Math.random() * 200;
        await sleep(backoff);
        attempt += 1;
        continue;
      }

      recordLlmCall({
        agentName,
        model: llmConfig.model,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorCode: 'LLM_API_ERROR',
      });
      const e = new Error(`OpenAI streaming cagrisi basarisiz oldu: ${err.message}`);
      e.statusCode = 502;
      e.code = 'LLM_API_ERROR';
      throw e;
    }
  }
}
