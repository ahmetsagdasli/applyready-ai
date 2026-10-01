import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableBorders,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import {
  isBullet,
  parseCvContent,
  SIDEBAR_SECTION_TYPES,
  splitInlineItems,
  stripBullet,
} from './cvContentParser.js';

const NAVY = '1F3A5F';
const BLUE = '3F6D96';
const DARK = '334155';
const INK = '0F172A';
const WHITE = 'FFFFFF';
const LINE = 'D8DEE8';
const PALE = 'F8FAFC';
const LIGHT_GREY = 'E5E7EB';

const TEMPLATES = {
  oxford: {
    layout: 'single',
    margins: [1120, 840, 960, 840],
    accent: NAVY,
    title: { size: 44, color: INK, alignment: AlignmentType.LEFT },
    heading: { size: 23, color: INK, upper: true },
    body: { size: 21, line: 307, after: 45 },
    chipFill: 'EDF2F7',
  },
  cambridge: {
    layout: 'sidebar',
    margins: [720, 720, 720, 760],
    accent: BLUE,
    title: { size: 42, color: BLUE, alignment: AlignmentType.LEFT },
    heading: { size: 23, color: BLUE, upper: true },
    body: { size: 20, line: 307, after: 45 },
    chipFill: 'E8F0F8',
    sidebar: { fill: 'EEF4FA', text: INK, heading: BLUE, chipFill: 'DBEAFE' },
  },
  harvard: {
    layout: 'sidebar',
    margins: [680, 720, 720, 760],
    accent: NAVY,
    title: { size: 42, color: INK, alignment: AlignmentType.LEFT },
    heading: { size: 23, color: NAVY, upper: true },
    body: { size: 20, line: 307, after: 45 },
    chipFill: 'EDF2F7',
    sidebar: { fill: NAVY, text: WHITE, heading: WHITE, chipFill: '3B5B82' },
  },
  edinburgh: {
    layout: 'sidebar',
    margins: [680, 760, 760, 760],
    accent: INK,
    title: { size: 40, color: INK, alignment: AlignmentType.LEFT },
    heading: { size: 23, color: INK, upper: false },
    body: { size: 20, line: 312, after: 45 },
    chipFill: 'F1F5F9',
    sidebar: { fill: 'F1F5F9', text: INK, heading: INK, chipFill: WHITE },
  },
  princeton: {
    layout: 'single',
    margins: [1040, 880, 1040, 880],
    accent: INK,
    title: { size: 44, color: INK, alignment: AlignmentType.LEFT },
    heading: { size: 23, color: INK, upper: true },
    body: { size: 20, line: 307, after: 45 },
    chipFill: 'F3F4F6',
  },
  stanford: {
    layout: 'sidebar',
    margins: [680, 760, 760, 760],
    accent: DARK,
    title: { size: 42, color: INK, alignment: AlignmentType.LEFT },
    heading: { size: 23, color: DARK, upper: false },
    body: { size: 20, line: 312, after: 45 },
    chipFill: 'EDF2F7',
    sidebar: { fill: DARK, text: WHITE, heading: WHITE, chipFill: '475569' },
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

function getPhotoMedia(profilePhoto) {
  if (typeof profilePhoto !== 'string') return null;
  const match = /^data:image\/(jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/i.exec(profilePhoto);
  if (!match) return null;
  return {
    type: match[1].toLowerCase() === 'png' ? 'png' : 'jpg',
    data: Buffer.from(match[2], 'base64'),
  };
}

function photoRun(profilePhoto, size = 88) {
  const media = getPhotoMedia(profilePhoto);
  if (!media) return null;

  return new ImageRun({
    type: media.type,
    data: media.data,
    transformation: { width: size, height: size },
  });
}

function bottomBorder(color, size = 5) {
  return {
    bottom: {
      style: BorderStyle.SINGLE,
      size,
      color,
      space: 3,
    },
  };
}

function titleParagraph(title, cfg, profilePhoto) {
  const photo = photoRun(profilePhoto, 90);
  const titleLength = String(title || '').replace(/\s+/g, ' ').length;
  const fittedSize =
    titleLength > 90
      ? Math.min(cfg.title.size, 34)
      : titleLength > 68
        ? Math.min(cfg.title.size, 37)
        : titleLength > 50
          ? Math.min(cfg.title.size, 40)
          : cfg.title.size;
  return new Paragraph({
    children: [
      ...(photo ? [photo, new TextRun({ text: '    ', size: fittedSize })] : []),
      new TextRun({
        text: title,
        bold: true,
        size: fittedSize,
        color: cfg.title.color,
      }),
    ],
    alignment: cfg.title.alignment,
    border: bottomBorder(cfg.accent, 8),
    spacing: { after: 180 },
  });
}

function sectionTitle(label, cfg, sidebar = false) {
  const headingCfg = sidebar ? cfg.sidebar : cfg.heading;
  const text = cfg.heading.upper ? label.toLocaleUpperCase('tr-TR') : label;
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: sidebar ? 18 : cfg.heading.size,
        color: sidebar ? headingCfg.heading : headingCfg.color,
      }),
    ],
    border: sidebar ? undefined : bottomBorder(cfg.accent, 4),
    spacing: { before: sidebar ? 190 : 220, after: sidebar ? 80 : 100 },
  });
}

function bodyParagraph(line, cfg, type, index, sidebar = false) {
  const bullet = isBullet(line);
  const clean = bullet ? stripBullet(line) : String(line || '').trim();
  const strong =
    !sidebar && !bullet && index > 0 && ['experience', 'projects', 'education'].includes(type);

  return new Paragraph({
    children: [
      new TextRun({
        text: bullet ? `• ${clean}` : clean,
        bold: strong,
        size: sidebar ? 18 : cfg.body.size,
        color: sidebar ? cfg.sidebar.text : INK,
      }),
    ],
    indent: bullet && !sidebar ? { left: 280 } : undefined,
    spacing: {
      after: sidebar ? 70 : cfg.body.after,
      line: cfg.body.line,
      lineRule: LineRuleType.AUTO,
    },
  });
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

function chipParagraph(text, cfg, sidebar = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: sidebar ? 17 : 18,
        color: sidebar ? cfg.sidebar.text : INK,
      }),
    ],
    spacing: { after: sidebar ? 70 : 80 },
  });
}

function summaryParagraph(intro, cfg) {
  if (!intro.length) return [];
  return [
    new Paragraph({
      children: [new TextRun({ text: intro.join('\n'), size: cfg.body.size, color: INK })],
      shading: { type: ShadingType.CLEAR, fill: PALE, color: 'auto' },
      spacing: { after: 150, line: cfg.body.line, lineRule: LineRuleType.AUTO },
    }),
  ];
}

function renderSection(section, cfg, sidebar = false) {
  const children = [sectionTitle(section.label, cfg, sidebar)];

  if (section.type === 'skills' || section.type === 'languages') {
    itemList(section).forEach((item) => children.push(chipParagraph(item, cfg, sidebar)));
    return children;
  }

  section.lines.forEach((line, index) => {
    children.push(bodyParagraph(line, cfg, section.type, index, sidebar));
  });

  return children;
}

function renderMain(title, parsed, sections, cfg, profilePhoto, includePhoto) {
  return [
    titleParagraph(title, cfg, includePhoto ? profilePhoto : undefined),
    ...summaryParagraph(parsed.intro, cfg),
    ...sections.flatMap((section) => renderSection(section, cfg, false)),
  ];
}

function renderSidebar(sections, cfg, profilePhoto) {
  const photo = photoRun(profilePhoto, 94);
  return [
    ...(photo
      ? [
          new Paragraph({
            children: [photo],
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
          }),
        ]
      : []),
    ...sections.flatMap((section) => renderSection(section, cfg, true)),
  ];
}

function sideTable(title, parsed, cfg, profilePhoto) {
  const sidebarSections = parsed.sections.filter((section) =>
    SIDEBAR_SECTION_TYPES.has(section.type)
  );
  const mainSections = parsed.sections.filter(
    (section) => !SIDEBAR_SECTION_TYPES.has(section.type)
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 31, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: cfg.sidebar.fill, color: 'auto' },
            margins: { top: 260, bottom: 260, left: 220, right: 220 },
            children: renderSidebar(sidebarSections, cfg, profilePhoto),
          }),
          new TableCell({
            width: { size: 69, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 360, right: 0 },
            children: renderMain(title, parsed, mainSections, cfg, undefined, false),
          }),
        ],
      }),
    ],
  });
}

export async function buildDocxBuffer({ title, content, template = 'oxford', profilePhoto }) {
  const cfg = resolveTemplateConfig(template);
  const parsed = parseCvContent({ title, content });
  const children =
    cfg.layout === 'sidebar'
      ? [sideTable(title, parsed, cfg, profilePhoto)]
      : renderMain(title, parsed, parsed.sections, cfg, profilePhoto, true);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              left: cfg.margins[0],
              top: cfg.margins[1],
              right: cfg.margins[2],
              bottom: cfg.margins[3],
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
