const LANGUAGE_DEFINITIONS = [
  { canonical: 'Türkçe', aliases: ['turkce', 'turkish', 'turk dili'] },
  { canonical: 'Kürtçe', aliases: ['kurtce', 'kurdish', 'kurdi', 'kurmanci', 'kurmanji', 'sorani'] },
  { canonical: 'Zazaca', aliases: ['zazaca', 'zazaki'] },
  { canonical: 'İngilizce', aliases: ['ingilizce', 'english'] },
  { canonical: 'Almanca', aliases: ['almanca', 'german', 'deutsch'] },
  { canonical: 'Fransızca', aliases: ['fransizca', 'french', 'francais'] },
  { canonical: 'Arapça', aliases: ['arapca', 'arabic'] },
  { canonical: 'İspanyolca', aliases: ['ispanyolca', 'spanish', 'espanol'] },
  { canonical: 'İtalyanca', aliases: ['italyanca', 'italian'] },
  { canonical: 'Rusça', aliases: ['rusca', 'russian'] },
  { canonical: 'Çince', aliases: ['cince', 'chinese', 'mandarin'] },
  { canonical: 'Japonca', aliases: ['japonca', 'japanese'] },
  { canonical: 'Korece', aliases: ['korece', 'korean'] },
  { canonical: 'Farsça', aliases: ['farsca', 'persian', 'farsi'] },
  { canonical: 'Azerice', aliases: ['azerice', 'azerbaycanca', 'azerbaijani', 'azerbaycan turkcesi'] },
  { canonical: 'Portekizce', aliases: ['portekizce', 'portuguese'] },
  { canonical: 'Felemenkçe', aliases: ['felemenkce', 'dutch'] },
  { canonical: 'Yunanca', aliases: ['yunanca', 'greek'] },
  { canonical: 'Bulgarca', aliases: ['bulgarca', 'bulgarian'] },
  { canonical: 'Romence', aliases: ['romence', 'romanian'] },
  { canonical: 'Lehçe', aliases: ['lehce', 'polish'] },
  { canonical: 'Ukraynaca', aliases: ['ukraynaca', 'ukrainian'] },
];

const PROFICIENCY_WORDS = [
  'ana',
  'anadil',
  'dil',
  'native',
  'fluent',
  'akici',
  'ileri',
  'orta',
  'temel',
  'baslangic',
  'baslangicseviyesi',
  'profesyonel',
  'seviye',
  'seviyesi',
  'duzey',
  'duzeyi',
  'level',
  'proficiency',
  'advanced',
  'intermediate',
  'beginner',
  'elementary',
  'upper',
  'lower',
  'limited',
  'professional',
  'working',
  'full',
  'bilingual',
  'konusma',
  'yazma',
  'okuma',
  'iyi',
  'cok',
  'az',
];

const PROFICIENCY_PATTERN = new RegExp(
  `\\b(${PROFICIENCY_WORDS.join('|')}|a1|a2|b1|b2|c1|c2)\\b`,
  'g'
);

function fold(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[()]/g, ' ')
    .replace(/[|,;/+&]/g, ' ')
    .replace(/[-–—:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDisplay(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const LANGUAGE_ALIASES = LANGUAGE_DEFINITIONS.flatMap(({ canonical, aliases }) =>
  aliases.map((alias) => ({
    canonical,
    foldedAlias: fold(alias),
  }))
).sort((a, b) => b.foldedAlias.length - a.foldedAlias.length);

function removeAlias(working, foldedAlias) {
  const pattern = foldedAlias.split(/\s+/).map(escapeRegex).join('\\s+');
  return working.replace(new RegExp(`(^|\\s)${pattern}(?=\\s|$)`, 'g'), ' ');
}

export function extractHumanLanguages(value) {
  let working = fold(value);
  if (!working) return [];

  const found = [];
  for (const { canonical, foldedAlias } of LANGUAGE_ALIASES) {
    const next = removeAlias(working, foldedAlias);
    if (next !== working) {
      if (!found.includes(canonical)) found.push(canonical);
      working = next;
    }
  }

  if (!found.length) return [];

  const leftover = working
    .replace(PROFICIENCY_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return leftover ? [] : found;
}

function splitSkillValue(value) {
  const display = cleanDisplay(value);
  if (!display) return { skills: [], languages: [] };

  const directLanguages = extractHumanLanguages(display);
  if (directLanguages.length) return { skills: [], languages: directLanguages };

  const parts = display.split(/\s*[,;|/]\s*/).map(cleanDisplay).filter(Boolean);
  if (parts.length < 2) return { skills: [display], languages: [] };

  const skills = [];
  const languages = [];
  for (const part of parts) {
    const partLanguages = extractHumanLanguages(part);
    if (partLanguages.length) {
      languages.push(...partLanguages);
    } else {
      skills.push(part);
    }
  }

  if (!languages.length) return { skills: [display], languages: [] };
  return { skills, languages };
}

export function normalizeLanguageList(languages = []) {
  const result = [];
  const seen = new Set();

  for (const value of Array.isArray(languages) ? languages : []) {
    const display = cleanDisplay(value);
    if (!display) continue;
    const normalizedEntries = extractHumanLanguages(display);
    const entries = normalizedEntries.length ? normalizedEntries : [display];

    for (const entry of entries) {
      const key = fold(entry);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(entry);
    }
  }

  return result;
}

export function splitLanguagesFromSkills(skills = [], existingLanguages = []) {
  const cleanSkills = [];
  const seenSkills = new Set();
  const languageCandidates = [...normalizeLanguageList(existingLanguages)];

  for (const value of Array.isArray(skills) ? skills : []) {
    const { skills: skillEntries, languages } = splitSkillValue(value);
    languageCandidates.push(...languages);

    for (const skill of skillEntries) {
      const key = fold(skill);
      if (!key || seenSkills.has(key)) continue;
      seenSkills.add(key);
      cleanSkills.push(skill);
    }
  }

  return {
    skills: cleanSkills,
    languages: normalizeLanguageList(languageCandidates),
  };
}
