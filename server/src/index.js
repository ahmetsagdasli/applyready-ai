import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import env from './config/env.js';
import healthRouter from './routes/health.js';
import applicationsRouter from './routes/applications.js';
import exportRouter from './routes/export.js';
import accountRouter from './routes/account.js';
import usageRouter from './routes/usage.js';
import billingRouter from './routes/billing.js';
import stripeWebhookRouter from './routes/stripeWebhook.js';
import adminRouter from './routes/admin.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Guvenlik basliklari
app.use(helmet());

// CORS - sadece frontend origin'e izin ver
app.use(
  cors({
    origin: env.CLIENT_URL,
  })
);

// Stripe webhook: RAW body gerektirir; global express.json'dan ONCE baglanir.
// (Ayrica rate limit'ten de muaf olur.)
app.use('/api/billing/webhook', stripeWebhookRouter);

// JSON body parse
app.use(express.json({ limit: '1mb' }));

// Rate limit (her IP icin 15 dakikada 100 istek)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/export', exportRouter);
app.use('/api/account', accountRouter);
app.use('/api/usage', usageRouter);
app.use('/api/billing', billingRouter);
app.use('/api/admin', adminRouter);

// 404 ve hata yakalayicilar (en sonda)
app.use(notFound);
app.use(errorHandler);

// Vercel, Express uygulamasini default export olarak serverless function'a
// baglar. Yerel gelistirmede ise ayni modulu normal HTTP sunucusu olarak
// dinlemeye devam ederiz.
export default app;

if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`[server] ApplyReady API http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}
