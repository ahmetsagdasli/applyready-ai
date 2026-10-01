import { estimateCostUsd } from './pricing.js';

// Hafif, bellek-ici LLM gozlemlenebilirlik katmani.
// Amac: her OpenAI cagrisinin token/maliyet/latency/basari bilgisini
// (a) yapilandirilmis log satiri olarak stdout'a yazmak (log toplayici /
//     Datadog / CloudWatch vb. ile dogrudan uyumlu),
// (b) sureç ici ozet istatistik olarak /api/admin/ai-usage uzerinden
//     sorgulanabilir tutmak.
// Kalici/dagitik depolama (Supabase tablosu, Langfuse vb.) ileride bu
// modulun recordLlmCall fonksiyonuna kolayca eklenebilir; tek entegrasyon
// noktasi burasi.

const MAX_RECENT_CALLS = 200;

const state = {
  recentCalls: [], // son N cagri (ring buffer), admin ekraninda detay icin
  byAgent: new Map(), // agentName -> aggregate
  totals: {
    calls: 0,
    errors: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    latencyMsSum: 0,
  },
};

function getAgentBucket(agentName) {
  const key = agentName || 'unknown';
  if (!state.byAgent.has(key)) {
    state.byAgent.set(key, {
      calls: 0,
      errors: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      latencyMsSum: 0,
    });
  }
  return state.byAgent.get(key);
}

// Bir LLM cagrisini kaydeder. Basarili/basarisiz her durumda cagrilmalidir.
export function recordLlmCall({
  agentName,
  model,
  promptTokens = 0,
  completionTokens = 0,
  latencyMs = 0,
  success,
  errorCode,
  retried = false,
}) {
  const totalTokens = promptTokens + completionTokens;
  const costUsd = estimateCostUsd({ model, promptTokens, completionTokens });

  const entry = {
    ts: new Date().toISOString(),
    agentName: agentName || 'unknown',
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd,
    latencyMs,
    success,
    errorCode: errorCode || null,
    retried,
  };

  // (a) yapilandirilmis log satiri — log toplayicilar icin tek-satir JSON.
  // eslint-disable-next-line no-console
  console.log(`[llm-telemetry] ${JSON.stringify(entry)}`);

  // (b) bellek-ici ozet
  state.recentCalls.push(entry);
  if (state.recentCalls.length > MAX_RECENT_CALLS) state.recentCalls.shift();

  for (const bucket of [state.totals, getAgentBucket(entry.agentName)]) {
    bucket.calls += 1;
    if (!success) bucket.errors += 1;
    bucket.promptTokens += promptTokens;
    bucket.completionTokens += completionTokens;
    bucket.totalTokens += totalTokens;
    bucket.costUsd = Number((bucket.costUsd + costUsd).toFixed(6));
    bucket.latencyMsSum += latencyMs;
  }

  return entry;
}

function withAvgLatency(bucket) {
  return {
    ...bucket,
    avgLatencyMs: bucket.calls ? Math.round(bucket.latencyMsSum / bucket.calls) : 0,
  };
}

// Admin/ops ekrani icin ozet: toplam + ajan bazli kirilim + son cagrilar.
export function getUsageSummary() {
  const byAgent = {};
  for (const [agentName, bucket] of state.byAgent.entries()) {
    byAgent[agentName] = withAvgLatency(bucket);
  }
  return {
    totals: withAvgLatency(state.totals),
    byAgent,
    recentCalls: [...state.recentCalls].reverse(),
  };
}
