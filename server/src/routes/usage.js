import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { usageSummary } from '../controllers/usageController.js';

const router = Router();

// GET /api/usage/summary - auth zorunlu
router.get('/summary', requireAuth, usageSummary);

export default router;
