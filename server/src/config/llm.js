import env from './env.js';

// LLM yapilandirmasi. Model env'den okunur (varsayilan gpt-4o-mini).
export const llmConfig = {
  apiKey: env.OPENAI_API_KEY,
  model: env.OPENAI_MODEL,
};

// API key yoksa anlamli ve guvenli hata firlatir (key icerigi loglanmaz).
export function assertLlmConfigured() {
  if (!llmConfig.apiKey) {
    const err = new Error(
      'OpenAI API key yapilandirilmamis. Lutfen server/.env dosyasini kontrol edin.'
    );
    err.statusCode = 500;
    throw err;
  }
}
