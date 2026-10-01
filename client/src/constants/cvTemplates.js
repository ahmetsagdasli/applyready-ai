export const DEFAULT_CV_TEMPLATE = 'oxford';
export const CV_TEMPLATE_STORAGE_KEY = 'applyready.cvTemplate';

export const CV_TEMPLATES = [
  {
    value: 'oxford',
    label: 'Oxford',
    description: 'Tek kolon, ATS dostu ve çok sade.',
    hint: 'Başvuru sistemleri için en güvenli tek kolon düzen.',
    image: '/cv-templates/oxford.jpg',
  },
  {
    value: 'cambridge',
    label: 'Cambridge',
    description: 'Sol bilgi alanı olan kurumsal düzen.',
    hint: 'Kişisel bilgi ve becerileri yan alanda toparlayan kurumsal görünüm.',
    image: '/cv-templates/cambridge.jpg',
  },
  {
    value: 'harvard',
    label: 'Harvard',
    description: 'Profil görseli ve güçlü bölüm ayrımı.',
    hint: 'Vurgulu sol alan ve belirgin bölüm ayrımları.',
    image: '/cv-templates/harvard.jpg',
  },
  {
    value: 'edinburgh',
    label: 'Edinburgh',
    description: 'Temiz başlıklar ve dengeli boşluk.',
    hint: 'Sakin, dengeli ve okunaklı başlık yapısı.',
    image: '/cv-templates/edinburgh.jpg',
  },
  {
    value: 'princeton',
    label: 'Princeton',
    description: 'Klasik ve düzenli profesyonel görünüm.',
    hint: 'Klasik çizgiler ve sade profesyonel düzen.',
    image: '/cv-templates/princeton.jpg',
  },
  {
    value: 'stanford',
    label: 'Stanford',
    description: 'Modern ama abartısız CV yapısı.',
    hint: 'Modern yan alan ve net bölüm ayrımı.',
    image: '/cv-templates/stanford.jpg',
  },
];

const LEGACY_TEMPLATE_MAP = {
  ats: 'oxford',
  modern: 'stanford',
  lacivert: 'cambridge',
  classic: 'princeton',
  minimal: 'edinburgh',
};

export function normalizeCvTemplate(value) {
  const normalized = LEGACY_TEMPLATE_MAP[value] || value;
  return CV_TEMPLATES.some((template) => template.value === normalized)
    ? normalized
    : DEFAULT_CV_TEMPLATE;
}

export function templateLabel(value) {
  const normalized = normalizeCvTemplate(value);
  return CV_TEMPLATES.find((template) => template.value === normalized)?.label || normalized;
}

export function getStoredCvTemplate() {
  if (typeof window === 'undefined') return DEFAULT_CV_TEMPLATE;

  try {
    return normalizeCvTemplate(window.localStorage.getItem(CV_TEMPLATE_STORAGE_KEY));
  } catch {
    return DEFAULT_CV_TEMPLATE;
  }
}

export function storeCvTemplate(value) {
  const normalized = normalizeCvTemplate(value);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CV_TEMPLATE_STORAGE_KEY, normalized);
    } catch {
      /* localStorage kullanilamazsa secim sadece mevcut ekranda kalir. */
    }
  }

  return normalized;
}
