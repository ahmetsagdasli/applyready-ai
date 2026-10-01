import { Router } from 'express';
import express from 'express';

import { stripeWebhook } from '../controllers/billingController.js';

const router = Router();

// Stripe imza dogrulamasi RAW body gerektirir; bu yuzden bu route'a ozel
// express.raw kullanilir (global express.json bu route'u parse ETMEMELIDIR).
router.post('/', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
