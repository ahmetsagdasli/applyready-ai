// OpenAI model fiyatlandirmasi (USD / 1M token). Kaynak: openai.com/api/pricing
// Bilinmeyen model icin fallback olarak gpt-4o-mini fiyati kullanilir.
// NOT: Fiyatlar zamanla degisebilir; periyodik olarak guncellenmeli.
const PRICING_PER_MILLION_TOKENS = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4.1': { input: 2, output: 8 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
  'text-embedding-3-large': { input: 0.13, output: 0 },
};

const DEFAULT_PRICING = PRICING_PER_MILLION_TOKENS['gpt-4o-mini'];

function resolvePricing(model) {
  if (PRICING_PER_MILLION_TOKENS[model]) return PRICING_PER_MILLION_TOKENS[model];
  // "gpt-4o-mini-2024-07-18" gibi tarihli varyantlar icin on-ek eslestirmesi.
  const prefixMatch = Object.keys(PRICING_PER_MILLION_TOKENS).find((key) =>
    model?.startsWith(key)
  );
  return prefixMatch ? PRICING_PER_MILLION_TOKENS[prefixMatch] : DEFAULT_PRICING;
}

// Prompt/completion token sayisindan tahmini maliyet (USD) hesaplar.
export function estimateCostUsd({ model, promptTokens, completionTokens }) {
  const pricing = resolvePricing(model);
  const inputCost = ((promptTokens || 0) / 1_000_000) * pricing.input;
  const outputCost = ((completionTokens || 0) / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}
