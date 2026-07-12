import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  fetchAndStorePublicCrime,
  getCachedIncidents,
  getLastFetchTime,
} from '../services/publicCrimeService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

/* ── GET /api/public-crime/incidents ─────────────────────────────────────── */
router.get('/incidents', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { crime_type, hours } = req.query as Record<string, string>;

    const incidents = await getCachedIncidents({
      crime_type:   crime_type || 'all',
      since_hours:  hours ? parseInt(hours) : 0,
    });

    const lastFetch = await getLastFetchTime();

    res.json({
      incidents: incidents.map((inc) => ({
        id:           String(inc._id),
        headline:     inc.headline,
        source:       inc.source,
        source_url:   inc.source_url,
        crime_type:   inc.crime_type,
        city:         inc.city,
        state:        inc.state,
        address:      inc.address,
        summary:      inc.summary,
        severity:     inc.severity,
        latitude:     inc.latitude,
        longitude:    inc.longitude,
        published_at: inc.published_at,
      })),
      total:      incidents.length,
      last_fetch: lastFetch,
      source_label: 'Public News-Based Crime Incidents',
    });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to fetch public incidents', detail: String(err) });
  }
});

/* ── POST /api/public-crime/refresh — manual trigger ─────────────────────── */
router.post('/refresh', async (req: AuthRequest, res: Response): Promise<void> => {
  // Return immediately, run in background
  res.json({ message: 'Refresh started in background. Check back in 2-3 minutes.' });

  fetchAndStorePublicCrime().catch((err) =>
    logger.error('Manual public crime refresh failed', { err: String(err) })
  );
});

export default router;
