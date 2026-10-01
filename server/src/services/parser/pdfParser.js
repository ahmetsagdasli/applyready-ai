import { createRequire } from 'module';

// pdf-parse CommonJS bir paket ve index.js debug modunda otomatik test
// dosyasi okumaya calisiyor. Bunu onlemek icin alt modulu dogrudan import ediyoruz.
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

// Cok kisa metin = muhtemelen okunamayan / taranmis (resim tabanli) PDF.
const MIN_TEXT_LENGTH = 20;

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ') // fazla bosluk/tab tek bosluk
    .replace(/\n{3,}/g, '\n\n') // 3+ satir bosluk -> 2
    .replace(/[ \t]+\n/g, '\n') // satir sonu bosluklari
    .trim();
}

// PDF buffer'dan duz metin cikarir ve normalize eder.
export async function extractTextFromPdf(buffer) {
  if (!buffer || buffer.length === 0) {
    const err = new Error('PDF dosyasi bos veya gecersiz.');
    err.statusCode = 400;
    throw err;
  }

  let raw;
  try {
    const data = await pdfParse(buffer);
    raw = data?.text || '';
  } catch {
    const err = new Error('PDF dosyasi okunamadi. Dosya bozuk olabilir.');
    err.statusCode = 400;
    throw err;
  }

  const text = normalizeText(raw);

  if (text.length < MIN_TEXT_LENGTH) {
    const err = new Error(
      "PDF'ten okunabilir metin cikarilamadi. Taranmis (resim tabanli) bir PDF olabilir; lutfen CV metnini manuel girin."
    );
    err.statusCode = 400;
    throw err;
  }

  return text;
}
