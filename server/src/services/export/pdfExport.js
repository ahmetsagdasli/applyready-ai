import { createRequire } from 'module';

import {
  isBullet,
  parseCvContent,
  SIDEBAR_SECTION_TYPES,
  splitInlineItems,
  stripBullet,
} from './cvContentParser.js';

// pdfmake CommonJS/UMD bir build. Server-side icin gomulu Roboto fontunu (vfs)
// kullaniyoruz; Roboto Turkce karakterleri destekler.
const require = createRequire(import.meta.url);
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');

pdfMake.vfs =
  pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || pdfFonts?.default?.pdfMake?.vfs;

const NAVY = '#1f3a5f';
const BLUE = '#3f6d96';
const DARK = '#334155';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#d8dee8';
const PAPER = '#f8fafc';
const WHITE = '#ffffff';

const TEMPLATES = {
  oxford: {
    layout: 'single',
    pageAccentBar: { color: NAVY, width: 10 },
    margins: [56, 42, 48, 42],
    accent: NAVY,
    title: { fontSize: 22, color: INK, align: 'left', upper: false },
    heading: { fontSize: 11, color: INK, upper: true, spacing: 0.6 },
    body: { fontSize: 10.4, lineHeight: 1.28, gap: 2 },
    chip: { fill: '#edf2f7', color: INK },
    summaryFill: '#f8fafc',
  },
  cambridge: {
    layout: 'sidebar',
    margins: [34, 36, 34, 38],
    accent: BLUE,
    title: { fontSize: 22, color: BLUE, align: 'left', upper: false },
    heading: { fontSize: 11, color: BLUE, upper: true, spacing: 0.5 },
    body: { fontSize: 10.2, lineHeight: 1.28, gap: 2 },
    chip: { fill: '#e8f0f8', color: '#17324d' },
    summaryFill: '#f8fbff',
    sidebar: {
      width: 148,
      fill: '#eef4fa',
      text: INK,
      muted: '#4b6176',
      heading: BLUE,
      chipFill: '#dbeafe',
      chipText: '#17324d',
      photoSize: 82,
    },
  },
  harvard: {
    layout: 'sidebar',
    margins: [32, 36, 34, 38],
    accent: NAVY,
    title: { fontSize: 22, color: INK, align: 'left', upper: true, spacing: 0.2 },
    heading: { fontSize: 11, color: NAVY, upper: true, spacing: 0.5 },
    body: { fontSize: 10.2, lineHeight: 1.28, gap: 2 },
    chip: { fill: '#edf2f7', color: INK },
    summaryFill: '#f8fafc',
    sidebar: {
      width: 136,
      fill: NAVY,
      text: WHITE,
      muted: '#dbeafe',
      heading: WHITE,
      chipFill: '#3b5b82',
      chipText: WHITE,
      photoSize: 90,
    },
  },
  edinburgh: {
    layout: 'sidebar',
    margins: [32, 38, 38, 38],
    accent: '#0f172a',
    title: { fontSize: 21, color: INK, align: 'left', upper: true },
    heading: { fontSize: 11.2, color: INK, upper: false, spacing: 0 },
    body: { fontSize: 10.3, lineHeight: 1.3, gap: 2.2 },
    chip: { fill: '#f1f5f9', color: INK },
    summaryFill: '#f8fafc',
    sidebar: {
      width: 138,
      fill: '#f1f5f9',
      text: INK,
      muted: MUTED,
      heading: INK,
      chipFill: WHITE,
      chipText: INK,
      photoSize: 88,
    },
  },
  princeton: {
    layout: 'single',
    margins: [52, 44, 52, 44],
    accent: '#111827',
    title: { fontSize: 23, color: INK, align: 'left', upper: false },
    heading: { fontSize: 11, color: INK, upper: true, spacing: 0.2 },
    body: { fontSize: 10.3, lineHeight: 1.28, gap: 2 },
    chip: { fill: '#f3f4f6', color: INK },
    summaryFill: '#fbfbfc',
  },
  stanford: {
    layout: 'sidebar',
    margins: [32, 38, 38, 38],
    accent: DARK,
    title: { fontSize: 22, color: INK, align: 'left', upper: false },
    heading: { fontSize: 11.2, color: DARK, upper: false, spacing: 0 },
    body: { fontSize: 10.2, lineHeight: 1.3, gap: 2 },
    chip: { fill: '#edf2f7', color: INK },
    summaryFill: '#f8fafc',
    sidebar: {
      width: 142,
      fill: DARK,
      text: WHITE,
      muted: '#e2e8f0',
      heading: WHITE,
      chipFill: '#475569',
      chipText: WHITE,
      photoSize: 92,
    },
  },
};

const TEMPLATE_ALIASES = {
  ats: 'oxford',
  modern: 'stanford',
  lacivert: 'cambridge',
  classic: 'princeton',
  minimal: 'edinburgh',
};

function resolveTemplateConfig(template) {
  const key = TEMPLATE_ALIASES[template] || template;
  return TEMPLATES[key] || TEMPLATES.oxford;
}

function getPhotoData(profilePhoto) {
  if (typeof profilePhoto !== 'string') return null;
  return /^data:image\/(jpeg|jpg|png);base64,/i.test(profilePhoto) ? profilePhoto : null;
}

function headingText(label, cfg) {
  return cfg.heading.upper ? label.toLocaleUpperCase('tr-TR') : label;
}

function rule(color, width = 0.7) {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: '', margin: [0, 0, 0, 0] }]],
    },
    layout: {
      hLineWidth: (i) => (i === 1 ? width : 0),
      vLineWidth: () => 0,
      hLineColor: () => color,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

function textLine(line, cfg, sectionType, index) {
  const bullet = isBullet(line);
  const text = bullet ? stripBullet(line) : String(line || '').trim();
  const strong =
    !bullet &&
    index > 0 &&
    ['experience', 'projects', 'education'].includes(sectionType);

  return {
    text: bullet ? `• ${text}` : text,
    bold: strong,
    color: strong ? INK : undefined,
    margin: [bullet ? 10 : 0, strong ? 4 : 0, 0, cfg.body.gap],
  };
}

function itemList(section) {
  const items = [];
  for (const line of section.lines) {
    const clean = stripBullet(line);
    if (section.type === 'contact') items.push(...splitInlineItems(clean));
    else items.push(clean);
  }
  return items.filter(Boolean);
}

function keywordList(items, cfg, sidebar = false) {
  const clean = items.filter(Boolean);
  if (!clean.length) return [];

  if (sidebar) {
    return clean.map((item) => ({
      text: item,
      fontSize: 8.9,
      lineHeight: 1.2,
      color: cfg.sidebar.text,
      margin: [0, 0, 0, 3.2],
    }));
  }

  return [
    {
      text: clean.join('  •  '),
      fontSize: cfg.body.fontSize,
      lineHeight: cfg.body.lineHeight,
      color: INK,
      margin: [0, 0, 0, 8],
    },
  ];
}

function sectionHeading(section, cfg, sidebar = false) {
  if (sidebar) {
    return {
      text: headingText(section.label, cfg),
      bold: true,
      fontSize: 8.8,
      color: cfg.sidebar.heading,
      characterSpacing: 0.8,
      margin: [0, 12, 0, 5],
    };
  }

  return [
    {
      text: headingText(section.label, cfg),
      bold: true,
      fontSize: cfg.heading.fontSize,
      color: cfg.heading.color,
      characterSpacing: cfg.heading.spacing || 0,
      margin: [0, 12, 0, 3],
    },
    { ...rule(cfg.accent), margin: [0, 0, 0, 6] },
  ];
}

function sidebarSection(section, cfg) {
  const stack = [sectionHeading(section, cfg, true)];
  const items = itemList(section);

  if (section.type === 'skills' || section.type === 'languages') {
    stack.push(...keywordList(items, cfg, true));
    return stack;
  }

  for (const item of items) {
    stack.push({
      text: item,
      fontSize: 8.8,
      lineHeight: 1.18,
      color: cfg.sidebar.text,
      margin: [0, 0, 0, 4],
    });
  }

  return stack;
}

function mainSection(section, cfg) {
  const stack = [...sectionHeading(section, cfg, false)];

  if (section.type === 'skills' || section.type === 'languages') {
    stack.push(...keywordList(itemList(section), cfg, false));
    return stack;
  }

  section.lines.forEach((line, index) => {
    stack.push(textLine(line, cfg, section.type, index));
  });

  return stack;
}

function summaryBlock(intro, cfg) {
  if (!intro.length) return null;
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: intro.join('\n'),
            color: INK,
            fillColor: cfg.summaryFill,
            margin: [11, 9, 11, 9],
          },
        ],
      ],
    },
    layout: 'noBorders',
    margin: [0, 4, 0, 8],
  };
}

function titleBlock(title, cfg, profilePhoto) {
  const photo = getPhotoData(profilePhoto);
  const titleText = cfg.title.upper ? title.toLocaleUpperCase('tr-TR') : title;
  const titleLength = titleText.replace(/\s+/g, ' ').length;
  const fittedFontSize =
    cfg.layout === 'sidebar' && titleLength > 90
      ? Math.min(cfg.title.fontSize, 17)
      : cfg.layout === 'sidebar' && titleLength > 68
        ? Math.min(cfg.title.fontSize, 18.5)
        : cfg.layout === 'sidebar' && titleLength > 50
          ? Math.min(cfg.title.fontSize, 20)
          : cfg.title.fontSize;
  const titleNode = {
    text: titleText,
    bold: true,
    fontSize: fittedFontSize,
    lineHeight: 1.16,
    color: cfg.title.color,
    alignment: cfg.title.align,
    characterSpacing: titleLength > 50 ? 0 : cfg.title.spacing || 0,
    margin: photo ? [0, 24, 0, 0] : [0, 0, 0, 0],
  };

  if (!photo) {
    return [
      { ...titleNode, margin: [0, 0, 0, 6] },
      { ...rule(cfg.accent, 1.1), margin: [0, 0, 0, 10] },
    ];
  }

  return [
    {
      table: {
        widths: [100, '*'],
        body: [
          [
            { image: photo, width: 82, height: 82, margin: [0, 0, 18, 0] },
            titleNode,
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 8],
    },
    { ...rule(cfg.accent, 1.1), margin: [0, 0, 0, 10] },
  ];
}

function buildSidebarStack(title, sidebarSections, cfg, profilePhoto) {
  const photo = getPhotoData(profilePhoto);
  const stack = [];

  if (photo) {
    stack.push({
      image: photo,
      width: cfg.sidebar.photoSize,
      height: cfg.sidebar.photoSize,
      alignment: 'center',
      margin: [0, 0, 0, 12],
    });
  }

  for (const section of sidebarSections) stack.push(...sidebarSection(section, cfg));
  return stack;
}

function buildMainStack(title, intro, mainSections, cfg, includeTitle = true) {
  const stack = [];
  if (includeTitle) stack.push(...titleBlock(title, cfg, null));
  const summary = summaryBlock(intro, cfg);
  if (summary) stack.push(summary);
  for (const section of mainSections) stack.push(...mainSection(section, cfg));
  return stack;
}

function buildSingleLayout(title, parsed, cfg, profilePhoto) {
  return [
    ...titleBlock(title, cfg, profilePhoto),
    ...(summaryBlock(parsed.intro, cfg) ? [summaryBlock(parsed.intro, cfg)] : []),
    ...parsed.sections.flatMap((section) => mainSection(section, cfg)),
  ];
}

function buildSidebarLayout(title, parsed, cfg, profilePhoto) {
  const sidebarSections = parsed.sections.filter((section) =>
    SIDEBAR_SECTION_TYPES.has(section.type)
  );
  const mainSections = parsed.sections.filter(
    (section) => !SIDEBAR_SECTION_TYPES.has(section.type)
  );

  return [
    {
      table: {
        widths: [cfg.sidebar.width, '*'],
        body: [
          [
            {
              stack: buildSidebarStack(title, sidebarSections, cfg, profilePhoto),
              fillColor: cfg.sidebar.fill,
              margin: [16, 18, 16, 18],
            },
            {
              stack: buildMainStack(title, parsed.intro, mainSections, cfg, true),
              margin: [22, 0, 0, 0],
            },
          ],
        ],
      },
      layout: 'noBorders',
    },
  ];
}

function buildDocDefinition(cfg, title, content, profilePhoto) {
  const parsed = parseCvContent({ title, content });
  const docContent =
    cfg.layout === 'sidebar'
      ? buildSidebarLayout(title, parsed, cfg, profilePhoto)
      : buildSingleLayout(title, parsed, cfg, profilePhoto);

  return {
    pageMargins: cfg.margins,
    background: cfg.pageAccentBar
      ? (_currentPage, pageSize) => ({
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: cfg.pageAccentBar.width,
              h: pageSize.height,
              color: cfg.pageAccentBar.color,
            },
          ],
        })
      : undefined,
    content: docContent,
    defaultStyle: {
      font: 'Roboto',
      fontSize: cfg.body.fontSize,
      lineHeight: cfg.body.lineHeight,
      color: INK,
    },
  };
}

// Gecerli sablon adlari (frontend secimine karsilik gelir).
export const PDF_TEMPLATES = Object.keys(TEMPLATES);

export function buildPdfBuffer({ title, content, template = 'oxford', profilePhoto }) {
  const cfg = resolveTemplateConfig(template);
  const docDefinition = buildDocDefinition(cfg, title, content, profilePhoto);

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer) => resolve(Buffer.from(buffer)));
    } catch (err) {
      reject(err);
    }
  });
}
