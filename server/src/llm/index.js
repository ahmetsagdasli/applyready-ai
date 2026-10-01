import env from '../config/env.js';
import * as openaiProvider from './providers/openai.js';

// LLM saglayici registry. Her saglayici modulu ayni sozlesmeyi uygular:
// generateRaw({ systemPrompt, userPrompt, temperature, agentName }) -> Promise<string>
//
// Yeni bir saglayici eklemek icin (orn. baska bir LLM API'si):
// 1) providers/<isim>.js yazip ayni generateRaw imzasini uygulayin.
// 2) asagidaki PROVIDERS map'ine ekleyin.
// 3) server/.env icinde LLM_PROVIDER=<isim> ayarlayin.
// Agent kodlarinda (baseAgent.js) HICBIR degisiklik gerekmez; hepsi bu
// modulden gelen generateRaw'i cagirir.
const PROVIDERS = {
  openai: openaiProvider,
};

function resolveProvider() {
  const name = env.LLM_PROVIDER;
  const provider = PROVIDERS[name];
  if (!provider) {
    const available = Object.keys(PROVIDERS).join(', ');
    throw new Error(
      `Bilinmeyen LLM_PROVIDER: "${name}". Gecerli degerler: ${available}`
    );
  }
  return provider;
}

export async function generateRaw(args) {
  const provider = resolveProvider();
  return provider.generateRaw(args);
}

// Token-seviyesinde streaming. Secili saglayici bunu uygulamiyorsa acik
// hata firlatir (sessizce non-streaming'e dusmek, caller'in "canli yaziliyor"
// beklentisini sessizce bozar).
export async function generateRawStream(args) {
  const provider = resolveProvider();
  if (!provider.generateRawStream) {
    throw new Error(
      `Secili LLM saglayicisi ("${env.LLM_PROVIDER}") token streaming desteklemiyor.`
    );
  }
  return provider.generateRawStream(args);
}
