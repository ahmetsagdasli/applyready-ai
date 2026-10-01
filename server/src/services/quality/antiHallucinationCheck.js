import { ensureArray, ensureString } from '../../utils/agentValidation.js';
import { embedTexts, cosineSimilarity } from '../../llm/embeddings.js';

// Iki kelime semantik olarak "ayni beceri" sayilsin mi? (orn. "JS" ~
// "JavaScript"). Substring heuristigi bunu kacirir ("javascript" metninde
// "js" ardisik substring olarak gecmez). cosine similarity 1'e yakinsa
// esanlamli/kisaltma kabul edilir.
const SEMANTIC_MATCH_THRESHOLD = 0.82;

// sourceList icinde name'e semantik olarak en yakin elemani bulur ve
// benzerligi esigin ustundeyse true doner. Embedding cagrisi BATCH'tir
// (tum sourceList + name tek API cagrisinda embed edilir).
// Embedding API'si basarisiz olursa (ag/limit) GUVENLI TARAFTA kalinir:
// false doner, yani uyari bastirilmaz — sessiz basarisizlik halusinasyonu
// gizlememeli.
async function existsInSourceSemantic(name, sourceList) {
  if (!name) return true;
  if (existsInSource(name, sourceList)) return true; // hizli heuristik once
  if (!sourceList.length) return false;

  try {
    const vectors = await embedTexts([name, ...sourceList], {
      agentName: 'Anti-Hallucination Check',
    });
    const [nameVec, ...sourceVecs] = vectors;
    const maxSim = Math.max(...sourceVecs.map((v) => cosineSimilarity(nameVec, v)));
    return maxSim >= SEMANTIC_MATCH_THRESHOLD;
  } catch (err) {
    console.warn('[anti-hallucination] embedding kontrolu basarisiz, heuristige geri donuldu', {
      error: err.message,
    });
    return false;
  }
}

function norm(value) {
  return ensureString(value).trim().toLowerCase();
}

// Bir ismin kaynak listede (gevsek eslesme) bulunup bulunmadigini kontrol eder.
function existsInSource(name, sourceList) {
  if (!name) return true; // bos isim uyari uretmesin
  return sourceList.some(
    (src) => src && (src === name || src.includes(name) || name.includes(src))
  );
}

function collectObjectField(arr, key) {
  return ensureArray(arr)
    .map((item) => norm(item?.[key]))
    .filter(Boolean);
}

function collectStrings(arr) {
  return ensureArray(arr).map(norm).filter(Boolean);
}

// Uretilen CV'yi kaynak CV'ye gore denetler. Akisi DURDURMAZ; sadece uyari uretir.
export function checkTailoredCvAgainstSource({ parsedCv, tailoredCv, matchResult }) {
  const warnings = [];

  // Sirketler
  const srcCompanies = collectObjectField(parsedCv?.experience, 'company');
  for (const item of ensureArray(tailoredCv?.experience)) {
    const company = norm(item?.company);
    if (company && !existsInSource(company, srcCompanies)) {
      warnings.push(
        `Uretilen CV'de kaynak CV'de bulunmayan sirket var: "${ensureString(
          item?.company
        ).trim()}"`
      );
    }
  }

  // Okullar
  const srcSchools = collectObjectField(parsedCv?.education, 'school');
  for (const item of ensureArray(tailoredCv?.education)) {
    const school = norm(item?.school);
    if (school && !existsInSource(school, srcSchools)) {
      warnings.push(
        `Uretilen CV'de kaynak CV'de bulunmayan okul var: "${ensureString(
          item?.school
        ).trim()}"`
      );
    }
  }

  // Sertifikalar (string dizisi)
  const srcCerts = collectStrings(parsedCv?.certifications);
  for (const cert of ensureArray(tailoredCv?.certifications)) {
    const c = norm(cert);
    if (c && !existsInSource(c, srcCerts)) {
      warnings.push(
        `Uretilen CV'de kaynak CV'de bulunmayan sertifika var: "${ensureString(
          cert
        ).trim()}"`
      );
    }
  }

  // Eksik beceriler uretilen CV becerilerinde gorunuyor mu?
  const missing = collectStrings(matchResult?.missingKeywords);
  const skills = tailoredCv?.skills || {};
  const tailoredSkills = [
    ...collectStrings(skills.highlighted),
    ...collectStrings(skills.technical),
    ...collectStrings(skills.domain),
  ];
  for (const kw of missing) {
    if (tailoredSkills.some((s) => s === kw || s.includes(kw))) {
      warnings.push(
        `Eksik olmasi gereken beceri uretilen CV becerilerinde gorundu: "${kw}"`
      );
    }
  }

  return { passed: warnings.length === 0, warnings };
}

// "Ogrenmeye istekliyim / eager to learn" gibi istek/niyet ifadeleri. Bunlar
// eksik beceriyi DURUSTCE (sahip olmadan) andigi icin yanlis-pozitif uyari uretmemeli.
const ASPIRATION_MARKERS = [
  // TR
  'ogren', 'öğren', 'hedefliyor', 'edinmeyi', 'edinme', 'kazanmayi', 'kazanma',
  'gelistirmeyi', 'geliştirmeyi', 'gelismeyi', 'gelişmeyi', 'istekli', 'hevesli',
  'aciğim', 'açığım', 'acigim', 'merakli', 'meraklı', 'isterim', 'niyetindeyim',
  // EN
  'learn', 'eager', 'aspire', 'aspiring', 'willing', 'grow', 'gain', 'seeking',
  'looking to', 'keen', 'motivated to', 'develop', 'familiarize', 'improve',
];

function hasAspirationFraming(sentence) {
  const s = norm(sentence);
  return ASPIRATION_MARKERS.some((m) => s.includes(m));
}

// Metni cumlelere bolup ilgili keyword'u iceren cumleleri dondurur.
function sentencesWithKeyword(text, kw) {
  return ensureString(text)
    .split(/(?<=[.!?\n])\s+/)
    .filter((s) => norm(s).includes(kw));
}

// parsedCv.skills hem duz dizi (["React",...]) hem de nesne ({technical,...})
// formatinda gelebilir; ikisini de duz normalize edilmis listeye cevirir.
function collectSourceSkills(skills) {
  if (Array.isArray(skills)) return collectStrings(skills);
  if (skills && typeof skills === 'object') {
    return Object.values(skills).flatMap((v) => collectStrings(v));
  }
  return [];
}

// On yaziyi kaynaklara gore denetler. Akisi DURDURMAZ; sadece uyari uretir.
// NOT: async — gercek halusinasyon supheli durumlarda (bkz. asagisi) semantic
// (embedding) dogrulama katmanina basvurur.
export async function checkCoverLetterAgainstSource({
  parsedCv,
  jobAnalysis,
  matchResult,
  coverLetterResult,
}) {
  const warnings = [];

  const companyInJob = norm(jobAnalysis?.company);
  const companyUsed = norm(coverLetterResult?._meta?.companyUsed);
  if (!companyInJob && companyUsed) {
    warnings.push(
      `Ilanda sirket adi yok ama on yazida sirket adi kullanildi: "${ensureString(
        coverLetterResult?._meta?.companyUsed
      ).trim()}"`
    );
  }

  // Eksik beceriler on yazi metninde geciyor mu? (heuristik uyari)
  // Uc katmanli yanlis-pozitif filtresi:
  //  1) Keyword aslinda adayin GERCEK becerilerinde varsa (substring eslesme)
  //     -> uyari URETME.
  //  2) Keyword yalnizca istek/niyet ("ogrenmeye istekliyim"/"eager to learn")
  //     cumlelerinde geciyorsa -> uyari URETME.
  //  3) Keyword substring olarak eslesmedi ama SEMANTIK olarak adayin bir
  //     becerisiyle esanlamli/kisaltma ise (orn. "JS" ~ "JavaScript")
  //     -> uyari URETME. (Embedding cagrisi SADECE bu noktaya kadar elenmemis
  //     adaylar icin yapilir — gereksiz maliyet/latency onlenir.)
  // Yalnizca sahiplenme imasi olan, gercekten sahip olunmayan keyword'ler kalir.
  const plainText = coverLetterResult?.plainText;
  const sourceSkills = collectSourceSkills(parsedCv?.skills);
  const missing = collectStrings(matchResult?.missingKeywords);
  for (const kw of missing) {
    if (!kw) continue;
    if (existsInSource(kw, sourceSkills)) continue; // aday gercekte sahip (hizli yol)
    const hits = sentencesWithKeyword(plainText, kw);
    if (hits.length === 0) continue;
    if (hits.every(hasAspirationFraming)) continue; // sadece istek/niyet ifadesi
    if (await existsInSourceSemantic(kw, sourceSkills)) continue; // esanlamli/kisaltma
    warnings.push(
      `Eksik beceri on yazida geciyor olabilir, kontrol edin: "${kw}"`
    );
  }

  return { passed: warnings.length === 0, warnings };
}
