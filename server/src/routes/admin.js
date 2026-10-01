import { Router } from 'express';

import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getUsageSummary } from '../llm/telemetry.js';

const router = Router();

// GET /api/admin/ai-usage — LLM cagri telemetry ozeti (token/maliyet/latency).
// Sadece ADMIN_EMAILS listesindeki kullanicilar erisebilir.
router.get('/ai-usage', requireAuth, requireAdmin, (req, res) => {
  res.json({ status: 'ok', data: getUsageSummary() });
});

export default router;
