import { Router } from 'express';

import {
  exportCvPdf,
  exportCvDocx,
  exportCoverPdf,
  exportCoverDocx,
} from '../controllers/exportController.js';

const router = Router();

// Export endpointleri AI cagirmaz; sadece gelen content'ten dosya uretir.
router.post('/cv/pdf', exportCvPdf);
router.post('/cv/docx', exportCvDocx);
router.post('/cover-letter/pdf', exportCoverPdf);
router.post('/cover-letter/docx', exportCoverDocx);

export default router;
