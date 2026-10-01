import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import {
  exportAccount,
  deleteAppData,
  deleteAccount,
} from '../controllers/accountController.js';

const router = Router();

// Tum account endpointleri auth zorunlu.
router.get('/export', requireAuth, exportAccount);
router.delete('/app-data', requireAuth, deleteAppData);
router.delete('/', requireAuth, deleteAccount);

export default router;
