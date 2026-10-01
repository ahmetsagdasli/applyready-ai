import {
  normalizeLanguageList,
  splitLanguagesFromSkills,
} from '../../utils/humanLanguages.js';

const SECTION_ALIASES = {
  contact: ['iletisim', 'iletişim', 'contact', 'personal details', 'kisisel bilgiler', 'kişisel bilgiler'],
  skills: ['beceriler', 'skills', 'technical skills', 'teknik beceriler'],
  experience: ['deneyim', 'is deneyimi', 'iş deneyimi', 'work experience', 'experience'],
  projects: ['projeler', 'projects'],
  education: ['egitim', 'eğitim', 'education', 'education and qualifications'],
  certifications: ['sertifikalar', 'certifications', 'courses', 'kurslar'],
  languages: ['diller', 'languages'],
  references: ['referanslar', 'references'],
};

export const SIDEBAR_SECTION_TYPES = new Set([
  'contact',
  'skills',
  'languages',
  'certifications',
  'references',
]);

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isHeading(line) {
  const l = String(line || '').trim();
  if (!l || l.startsWith('-') || line.startsWith(' ')) return false;
  return l.endsWith(':') && l.length <= 48;
}

export function stripBullet(line) {
  return String(line || '').replace(/^\s*-\s+/, '').trim();
}

export function isBullet(line) {
  return /^\s*-\s+/.test(String(line || ''));
}

export function sectionType(label) {
  const normalized = normalizeText(label).replace(/:$/, '');
  for (const [type, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some((alias) => normalizeText(alias) === normalized)) return type;
  }
  return 'other';
}

export function splitInlineItems(line) {
  return String(line || '')
    .split(/\s+\|\s+|;\s+|,\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sameTitle(line, title) {
  return normalizeText(line) === normalizeText(title);
}

function isEnglishSectionLabel(label) {
  return [
    'contact',
    'personal details',
    'skills',
    'technical skills',
    'work experience',
    'experience',
    'projects',
    'education',
    'education and qualifications',
    'certifications',
    'courses',
    'languages',
    'references',
  ].includes(normalizeText(label).replace(/:$/, ''));
}

function cleanSkillSections(sections) {
  const languageCandidates = [];

  for (const section of sections) {
    if (section.type !== 'skills') continue;

    const cleanedLines = [];
    for (const line of section.lines) {
      const value = stripBullet(line);
      const separated = splitLanguagesFromSkills([value]);
      languageCandidates.push(...separated.languages);

      if (!separated.languages.length) {
        cleanedLines.push(line);
        continue;
      }

      const prefix = isBullet(line) ? '- ' : '';
      cleanedLines.push(...separated.skills.map((skill) => `${prefix}${skill}`));
    }
    section.lines = cleanedLines;
  }

  const newLanguages = normalizeLanguageList(languageCandidates);
  if (!newLanguages.length) return;

  const languageSections = sections.filter((section) => section.type === 'languages');
  const existingLanguages = normalizeLanguageList(
    languageSections.flatMap((section) =>
      section.lines.flatMap((line) => splitInlineItems(stripBullet(line)))
    )
  );
  const languages = normalizeLanguageList([...existingLanguages, ...newLanguages]);
  if (!languages.length) return;

  if (languageSections.length) {
    languageSections[0].lines = languages.map((language) => `- ${language}`);
    for (const section of languageSections.slice(1)) section.lines = [];
    return;
  }

  const label = sections.some((section) => isEnglishSectionLabel(section.label))
    ? 'Languages'
    : 'Diller';
  sections.push({
    label,
    type: 'languages',
    lines: languages.map((language) => `- ${language}`),
  });
}

export function parseCvContent({ title, content }) {
  const rawLines = String(content || '').split('\n');
  const lines = [];
  let skippedTitle = false;

  for (const rawLine of rawLines) {
    const line = rawLine.trimEnd();
    if (!skippedTitle && sameTitle(line, title)) {
      skippedTitle = true;
      continue;
    }
    lines.push(line);
  }

  const intro = [];
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    if (isHeading(line)) {
      const label = line.trim().replace(/:$/, '');
      current = {
        label,
        type: sectionType(label),
        lines: [],
      };
      sections.push(current);
      continue;
    }

    if (current) current.lines.push(line);
    else intro.push(line);
  }

  cleanSkillSections(sections);

  return {
    intro,
    sections: sections.filter((section) => section.lines.length > 0),
  };
}
