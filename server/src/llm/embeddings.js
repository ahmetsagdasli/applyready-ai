import OpenAI from 'openai';

import { llmConfig, assertLlmConfigured } from '../config/llm.js';
import { recordLlmCall } from './telemetry.js';

// Semantic eslesme (orn. "JS" ~ "JavaScript", "makine ogrenmesi" ~ "machine
// learning") icin ucuz bir embedding modeli. Halusinasyon kontrolu disinda
// baska bir semantic arama ihtiyaci dogarsa da buradan genisletilebilir.
const EMBEDDING_MODEL = 'text-embedding-3-small';

let client = null;

function getClient() {
  assertLlmConfigured();
  if (!client) {
    client = new OpenAI({ apiKey: llmConfig.apiKey, maxRetries: 0 });
  }
  return client;
}

// Birden fazla metni TEK API cagrisinda embed eder (batch) — maliyet/latency
// icin cagiri sayisini minimumda tutmak onemli.
export async function embedTexts(texts, { agentName = 'Embeddings' } = {}) {
  const clean = (texts || []).map((t) => String(t || '').slice(0, 2000));
  if (clean.length === 0) return [];

  const openai = getClient();
  const startedAt = Date.now();
  try {
    const res = await openai.embeddings.create(
      { model: EMBEDDING_MODEL, input: clean },
      { timeout: 20000 }
    );
    recordLlmCall({
      agentName,
      model: EMBEDDING_MODEL,
      promptTokens: res.usage?.prompt_tokens || 0,
      completionTokens: 0,
      latencyMs: Date.now() - startedAt,
      success: true,
    });
    return res.data.map((d) => d.embedding);
  } catch (err) {
    recordLlmCall({
      agentName,
      model: EMBEDDING_MODEL,
      latencyMs: Date.now() - startedAt,
      success: false,
      errorCode: 'EMBEDDING_API_ERROR',
    });
    throw err;
  }
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
