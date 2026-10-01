// Gorev 1 — Gap soru ureticisi (deterministik, LLM cagrisi yok).
// matchResult.missingKeywords + jobAnalysis (required/preferred ayrimi) kullanarak
// kullaniciya sorulacak yapilandirilmis sorulari uretir.

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .trim();
}

// keyword'un ilanda zorunlu mu tercih edilen mi oldugunu belirler.
function classifyWeight(keyword, jobAnalysis) {
  const k = norm(keyword);
  const required = (jobAnalysis?.requiredSkills || []).map(norm);
  const preferred = (jobAnalysis?.preferredSkills || []).map(norm);

  const inList = (list) =>
    list.some((item) => item === k || item.includes(k) || k.includes(item));

  if (inList(required)) return 'required';
  if (inList(preferred)) return 'preferred';
  return 'unknown';
}

function buildQuestionText(keyword, weight, language) {
  const tr = language !== 'en';
  if (tr) {
    const onem =
      weight === 'required'
        ? 'İlan bunu zorunlu nitelik olarak istiyor.'
        : weight === 'preferred'
          ? 'İlan bunu tercih sebebi olarak belirtmiş.'
          : 'İlanda geçen bir konu.';
    return (
      `İlan "${keyword}" istiyor. ${onem} ` +
      `Bu konuyla ilgili gerçek bir deneyimin var mı? Varsa hangi projede/işte ` +
      `ne yaptığını kısaca yaz (bir cümle yeter). Yoksa "Bu deneyim bende yok" işaretle.`
    );
  }
  const importance =
    weight === 'required'
      ? 'The posting lists this as a required qualification.'
      : weight === 'preferred'
        ? 'The posting lists this as a nice-to-have.'
        : 'This appears in the posting.';
  return (
    `The job asks for "${keyword}". ${importance} ` +
    `Do you have real experience with it? If yes, briefly describe where and what ` +
    `you did (one sentence is enough). If not, mark "I don't have this experience".`
  );
}

// missingKeywords'ten gap sorulari uretir.
// Donus: [{ keyword, weight, question, answer: null, hasIt: null }]
export function buildGapQuestions({ matchResult, jobAnalysis, language, max = 12 }) {
  const breakdown = Array.isArray(matchResult?.keywordBreakdown)
    ? matchResult.keywordBreakdown
    : [];

  // keywordBreakdown varsa SADECE doldurulabilir (missing_fillable) eksikleri sor;
  // alakasiz (missing_irrelevant) olanlari sorma. Yoksa missingKeywords'e dus.
  let candidates = [];
  if (breakdown.length > 0) {
    candidates = breakdown
      .filter((b) => b.status === 'missing_fillable')
      .map((b) => ({ keyword: b.keyword, weight: b.weight }));
    // Saglamlik: model hicbir sey "fillable" demediyse ama eksikler varsa,
    // gap wizard'i bos birakmamak icin tum eksik (matched olmayan) keyword'lere dus.
    if (candidates.length === 0) {
      candidates = breakdown
        .filter((b) => b.status !== 'matched')
        .map((b) => ({ keyword: b.keyword, weight: b.weight }));
    }
  }
  if (candidates.length === 0) {
    const missing = Array.isArray(matchResult?.missingKeywords)
      ? matchResult.missingKeywords
      : [];
    candidates = missing.map((kw) => ({
      keyword: kw,
      weight: classifyWeight(kw, jobAnalysis),
    }));
  }

  // Tekillestir (case-insensitive), bos olanlari at.
  const seen = new Set();
  const unique = [];
  for (const c of candidates) {
    const key = norm(c.keyword);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }

  const questions = unique.map(({ keyword, weight }) => ({
    keyword,
    weight,
    question: buildQuestionText(keyword, weight, language),
    answer: null,
    hasIt: null,
  }));

  // Zorunlu olanlar once, sonra tercih edilen, sonra digerleri.
  const order = { required: 0, preferred: 1, unknown: 2 };
  questions.sort((a, b) => order[a.weight] - order[b.weight]);

  return questions.slice(0, max);
}
