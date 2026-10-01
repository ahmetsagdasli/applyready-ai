import { getUsageSummary } from '../services/usageStore.js';

// GET /api/usage/summary  (auth zorunlu)
export async function usageSummary(req, res, next) {
  try {
    const summary = await getUsageSummary({ userId: req.user.id });
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
}
