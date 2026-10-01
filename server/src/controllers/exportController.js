import { z } from 'zod';

import { buildPdfBuffer } from '../services/export/pdfExport.js';
import { buildDocxBuffer } from '../services/export/docxExport.js';

const profilePhotoSchema = z
  .object({
    dataUrl: z
      .string()
      .trim()
      .max(750000, 'Profil fotografi cok buyuk.')
      .regex(
        /^data:image\/(jpeg|jpg|png);base64,[A-Za-z0-9+/=]+$/,
        'Profil fotografi JPG veya PNG formatinda olmali.'
      ),
    name: z.string().max(255).optional(),
  })
  .nullable()
  .optional();

const exportSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Export icin icerik bos olamaz.')
    .max(30000, 'Icerik 30000 karakter sinirini asiyor.'),
  language: z
    .enum(['tr', 'en'], {
      errorMap: () => ({ message: 'Dil sadece tr veya en olabilir.' }),
    })
    .optional()
    .default('tr'),
  title: z.string().optional(),
  documentType: z.enum(['cv', 'cover_letter']).optional(),
  profilePhoto: profilePhotoSchema,
  // Export sablonu. Eski 'variant' alani geriye uyumluluk icin kabul edilir.
  template: z
    .enum([
      'oxford',
      'cambridge',
      'harvard',
      'edinburgh',
      'princeton',
      'stanford',
      'ats',
      'modern',
      'classic',
      'minimal',
      'lacivert',
    ])
    .optional(),
  variant: z.enum(['ats', 'designed']).optional(),
});

const LEGACY_TEMPLATE_MAP = {
  ats: 'oxford',
  modern: 'stanford',
  classic: 'princeton',
  minimal: 'edinburgh',
  lacivert: 'cambridge',
};

// Eski 'variant' -> yeni 'template' eslesmesi.
function resolveTemplate({ template, variant }) {
  if (template) return LEGACY_TEMPLATE_MAP[template] || template;
  if (variant === 'designed') return 'stanford';
  return 'oxford';
}

// documentType + language'e gore varsayilan baslik.
function defaultTitle(documentType, language) {
  if (documentType === 'cover_letter') {
    return language === 'en' ? 'Cover Letter' : 'On Yazi';
  }
  return language === 'en' ? 'Resume' : 'CV';
}

// Dosya adi: route'tan gelen documentType, format ve sablona gore.
function fileName(documentType, format, template) {
  const base =
    documentType === 'cover_letter' ? 'applyready-cover-letter' : 'applyready-cv';
  return `${base}-${template}.${format}`;
}

const CONTENT_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Tum export endpointleri icin ortak isleyici.
// documentType ve format route tarafindan belirlenir (body'ye guvenmez).
async function handleExport(req, res, next, { documentType, format }) {
  try {
    const parsed = exportSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Gecersiz istek.';
      return res.status(400).json({ status: 'error', message });
    }

    const { content, language, title } = parsed.data;
    const finalTitle =
      title && title.trim() ? title.trim() : defaultTitle(documentType, language);
    const template = resolveTemplate(parsed.data);
    const profilePhoto =
      documentType === 'cv' ? parsed.data.profilePhoto?.dataUrl : undefined;

    let buffer;
    if (format === 'pdf') {
      buffer = await buildPdfBuffer({
        title: finalTitle,
        content,
        documentType,
        language,
        template,
        profilePhoto,
      });
    } else {
      buffer = await buildDocxBuffer({
        title: finalTitle,
        content,
        documentType,
        language,
        template,
        profilePhoto,
      });
    }

    res.setHeader('Content-Type', CONTENT_TYPES[format]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName(documentType, format, template)}"`
    );
    return res.send(buffer);
  } catch (err) {
    // Export uretilemezse 500.
    if (!err.statusCode) err.statusCode = 500;
    if (err.statusCode === 500) {
      err.message = 'Dosya olusturulamadi. Lutfen tekrar deneyin.';
    }
    return next(err);
  }
}

export const exportCvPdf = (req, res, next) =>
  handleExport(req, res, next, { documentType: 'cv', format: 'pdf' });

export const exportCvDocx = (req, res, next) =>
  handleExport(req, res, next, { documentType: 'cv', format: 'docx' });

export const exportCoverPdf = (req, res, next) =>
  handleExport(req, res, next, { documentType: 'cover_letter', format: 'pdf' });

export const exportCoverDocx = (req, res, next) =>
  handleExport(req, res, next, { documentType: 'cover_letter', format: 'docx' });
