import apiClient from './client.js';
import { DEFAULT_CV_TEMPLATE } from '../constants/cvTemplates.js';

// Blob'u tarayicida indirmeyi baslatir.
function triggerBrowserDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Content-Disposition basligindan dosya adini cikarir.
function parseFilename(headers, fallback) {
  const cd = headers?.['content-disposition'] || '';
  const match = /filename="?([^"]+)"?/.exec(cd);
  return match ? match[1] : fallback;
}

async function downloadFile(url, payload, fallbackName) {
  try {
    const res = await apiClient.post(url, payload, { responseType: 'blob' });
    const filename = parseFilename(res.headers, fallbackName);
    triggerBrowserDownload(res.data, filename);
  } catch (err) {
    // Hata durumunda body blob olarak gelir; JSON mesajini cikarmaya calis.
    const data = err.response?.data;
    let message = 'Export sirasinda bir hata olustu.';
    if (data instanceof Blob) {
      const text = await data.text();
      try {
        message = JSON.parse(text).message || message;
      } catch {
        /* JSON degilse varsayilan mesaj kalir */
      }
    } else if (err.message) {
      message = err.message;
    }
    throw new Error(message);
  }
}

export function exportCvPdf({
  content,
  language,
  title,
  template = DEFAULT_CV_TEMPLATE,
  profilePhoto,
}) {
  return downloadFile(
    '/export/cv/pdf',
    { content, language, title, documentType: 'cv', template, profilePhoto },
    `applyready-cv-${template}.pdf`
  );
}

export function exportCvDocx({
  content,
  language,
  title,
  template = DEFAULT_CV_TEMPLATE,
  profilePhoto,
}) {
  return downloadFile(
    '/export/cv/docx',
    { content, language, title, documentType: 'cv', template, profilePhoto },
    `applyready-cv-${template}.docx`
  );
}

export function exportCoverPdf({ content, language, title, template = DEFAULT_CV_TEMPLATE }) {
  return downloadFile(
    '/export/cover-letter/pdf',
    { content, language, title, documentType: 'cover_letter', template },
    `applyready-cover-letter-${template}.pdf`
  );
}

export function exportCoverDocx({ content, language, title, template = DEFAULT_CV_TEMPLATE }) {
  return downloadFile(
    '/export/cover-letter/docx',
    { content, language, title, documentType: 'cover_letter', template },
    `applyready-cover-letter-${template}.docx`
  );
}
