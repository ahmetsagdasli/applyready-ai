import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { uploadCvFile } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import {
  analyzeApplication,
  refineApplication,
  listApplicationsHandler,
  getApplicationHandler,
  updateApplicationHandler,
  deleteApplicationHandler,
} from '../controllers/applicationController.js';

const router = Router();

// Misafir AI limiti: analyze basina 6 OpenAI cagrisi yapildigi icin global
// limit (100 istek / 15 dk) burada yetersiz. Girisli kullanicinin plan bazli
// aylik limiti controller'da uygulanir; bu limit yalnizca misafire (req.user
// yok) isler — optionalAuth'tan SONRA baglanmasi bu yuzden sart.
const guestAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean(req.user),
  // Doğrulama hataları (4xx/5xx) kota yakmasın; pahalı olan başarılı AI kosusudur.
  skipFailedRequests: true,
  message: {
    message:
      'Üye olmadan deneme hakkınız şimdilik doldu. Ücretsiz kayıt olarak devam edebilir ya da bir saat sonra tekrar deneyebilirsiniz.',
  },
});

// POST /api/applications/analyze
// optional auth: login varsa sonuc kaydedilir, yoksa sadece doner.
router.post('/analyze', optionalAuth, guestAiLimiter, uploadCvFile, analyzeApplication);

// Deprecated: geriye uyumluluk icin eski rota calismaya devam eder.
router.post('/demo-analyze', optionalAuth, guestAiLimiter, uploadCvFile, analyzeApplication);

// POST /api/applications/refine — Gorev 1: gap cevaplariyla yeniden uretim.
// JSON body (multipart degil); login varsa kayit guncellenir.
router.post('/refine', optionalAuth, guestAiLimiter, refineApplication);

// Auth zorunlu: kullanicinin kayitli basvurulari.
router.get('/', requireAuth, listApplicationsHandler);
router.get('/:id', requireAuth, getApplicationHandler);
router.put('/:id', requireAuth, updateApplicationHandler);
router.delete('/:id', requireAuth, deleteApplicationHandler);

export default router;
