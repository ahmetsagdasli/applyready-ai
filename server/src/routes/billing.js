import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import {
  createCheckoutSession,
  createPortalSession,
  billingMe,
} from '../controllers/billingController.js';

const router = Router();

router.post('/create-checkout-session', requireAuth, createCheckoutSession);
router.post('/create-portal-session', requireAuth, createPortalSession);
router.get('/me', requireAuth, billingMe);

export default router;
