// Gorev 3 — Kurasyon: yapilandirilmis tailoredCv'den, kullanicinin per-item
// goster/gizle/kisalt secimlerine ve GPA tercihine gore duz metin CV uretir.
// Bu metin export'un kaynagi olan editableCv'ye yazilir.

import { splitSkillGroupsAndLanguages } from './humanLanguages.js';

const L = {
  tr: {
    contact: 'İletişim',
    skills: 'Beceriler',
    experience: 'Deneyim',
    projects: 'Projeler',
    education: 'Eğitim',
    certifications: 'Sertifikalar',
    languages: 'Diller',
    gpa: 'Not Ort.',
  },
  en: {
    contact: 'Contact',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    certifications: 'Certifications',
    languages: 'Languages',
    gpa: 'GPA',
  },
};

function joinSkills(skills) {
  if (!skills || typeof skills !== 'object') return [];
  const all = [
    ...(skills.highlighted || []),
    ...(skills.technical || []),
    ...(skills.domain || []),
    ...(skills.soft || []),
  ];
  return [...new Set(all.filter(Boolean))];
}

const DEFAULT_ORDER = [
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'languages',
];

// modes: { experience: {idx: 'full'|'condensed'|'hidden'}, projects: {...}, education: {...} }
export function composeCvText(tailoredCv, { modes = {}, showGpa = false, language = 'tr' } = {}) {
  if (!tailoredCv) return '';
  const t = L[language] || L.tr;
  const expModes = modes.experience || {};
  const projModes = modes.projects || {};
  const eduModes = modes.education || {};

  // Her bolumu ayri blok olarak hazirla; sirayi sectionOrder belirler (Gorev 4).
  const blocks = {};

  blocks.summary = tailoredCv.professionalSummary
    ? [tailoredCv.professionalSummary]
    : [];

  const cleaned = splitSkillGroupsAndLanguages(tailoredCv.skills, tailoredCv.languages);
  const skills = joinSkills(cleaned.skills);
  blocks.skills = skills.length
    ? [`${t.skills}:`, ...skills.map((s) => `- ${s}`)]
    : [];

  const exp = Array.isArray(tailoredCv.experience) ? tailoredCv.experience : [];
  const expVisible = exp
    .map((e, i) => ({ e, mode: expModes[i] || e.recommendedDisplay || 'full' }))
    .filter((x) => x.mode !== 'hidden');
  blocks.experience = [];
  if (expVisible.length) {
    blocks.experience.push(`${t.experience}:`);
    expVisible.forEach(({ e, mode }) => {
      const head = `${e.title || ''}${e.company ? ` — ${e.company}` : ''}${e.period ? ` (${e.period})` : ''}`.trim();
      blocks.experience.push(head);
      if (mode === 'full') (e.bullets || []).forEach((b) => blocks.experience.push(`  - ${b}`));
    });
  }

  const proj = Array.isArray(tailoredCv.projects) ? tailoredCv.projects : [];
  const projVisible = proj
    .map((p, i) => ({ p, mode: projModes[i] || p.recommendedDisplay || 'full' }))
    .filter((x) => x.mode !== 'hidden');
  blocks.projects = [];
  if (projVisible.length) {
    blocks.projects.push(`${t.projects}:`);
    projVisible.forEach(({ p, mode }) => {
      const tech = (p.technologies || []).length ? ` [${p.technologies.join(', ')}]` : '';
      blocks.projects.push(`${p.name || ''}${tech}`.trim());
      if (mode === 'full') {
        if (p.description) blocks.projects.push(`  ${p.description}`);
        (p.bullets || []).forEach((b) => blocks.projects.push(`  - ${b}`));
      }
    });
  }

  const edu = Array.isArray(tailoredCv.education) ? tailoredCv.education : [];
  const eduVisible = edu
    .map((ed, i) => ({ ed, mode: eduModes[i] || ed.recommendedDisplay || 'full' }))
    .filter((x) => x.mode !== 'hidden');
  blocks.education = [];
  if (eduVisible.length) {
    blocks.education.push(`${t.education}:`);
    eduVisible.forEach(({ ed }) => {
      const bits = [ed.degree, ed.field].filter(Boolean).join(' - ');
      let line = `${bits}${ed.school ? ` / ${ed.school}` : ''}${ed.period ? ` (${ed.period})` : ''}`.trim();
      if (showGpa && ed.gpa) line += ` — ${t.gpa}: ${ed.gpa}`;
      blocks.education.push(line);
    });
  }

  const certs = Array.isArray(tailoredCv.certifications) ? tailoredCv.certifications.filter(Boolean) : [];
  blocks.certifications = certs.length
    ? [`${t.certifications}:`, ...certs.map((s) => `- ${s}`)]
    : [];

  const langs = cleaned.languages;
  blocks.languages = langs.length
    ? [`${t.languages}:`, ...langs.map((s) => `- ${s}`)]
    : [];

  // Bas kisim: title + contact (her zaman en ustte).
  const lines = [];
  if (tailoredCv.title) lines.push(tailoredCv.title, '');
  const c = tailoredCv.contact || {};
  const contactBits = [c.name, c.email, c.phone, c.location, ...(c.links || [])].filter(Boolean);
  if (contactBits.length) lines.push(`${t.contact}:`, contactBits.join(' | '), '');

  // sectionOrder varsa onu kullan; eksik kalan bolumleri default sirayla ekle.
  const requested = Array.isArray(tailoredCv.sectionOrder) ? tailoredCv.sectionOrder : [];
  const order = [...requested, ...DEFAULT_ORDER.filter((s) => !requested.includes(s))];

  order.forEach((key) => {
    const block = blocks[key];
    if (block && block.length) lines.push(...block, '');
  });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
