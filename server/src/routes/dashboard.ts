import { Router, Response } from 'express';
import Case       from '../models/Case';
import Evidence   from '../models/Evidence';
import Witness    from '../models/Witness';
import Suspect    from '../models/Suspect';
import Notification from '../models/Notification';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId  = req.user!.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);

    const caseFilter: Record<string, unknown> = {};
    if (!isAdmin) {
      caseFilter.$or = [
        { assigned_io:   userId },
        { assigned_sho:  userId },
        { prosecutor_id: userId },
        { created_by:    userId },
      ];
    }

    /* For non-admin queries that need a list of accessible case IDs,
       fetch once and reuse rather than calling Case.distinct() twice */
    let accessibleCaseIds: unknown[] | null = null;
    const getCaseIds = async () => {
      if (isAdmin) return null;
      if (accessibleCaseIds === null) {
        accessibleCaseIds = await Case.distinct('_id', caseFilter);
      }
      return accessibleCaseIds;
    };

    // ── Run all queries in parallel ─────────────────────────────────────────
    const [
      totalCases,
      openCases,
      casesByStatus,
      recentCases,
      unverifiedEvidence,
      recentNotifications,
      weeklyChart,
    ] = await Promise.all([
      Case.countDocuments(caseFilter),
      Case.countDocuments({ ...caseFilter, status: 'open' }),
      Case.aggregate([
        { $match: caseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Case.find(caseFilter)
        .select('case_number title status priority crime_type updatedAt assigned_io')
        .populate('assigned_io', 'full_name')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      // Uses the {is_verified:1} index we add in the model
      Evidence.countDocuments({ is_verified: false }),
      Notification
        .find({ user_id: userId })
        .select('title message type is_read createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Single aggregation replaces 14 countDocuments calls
      getWeeklyChartAgg(caseFilter),
    ]);

    /* Witnesses and suspects — only fetched when needed for non-admin.
       Use the already-resolved caseIds to avoid a second distinct() call. */
    const caseIds = await getCaseIds();
    const subFilter = isAdmin ? {} : { case_id: { $in: caseIds } };

    const [totalWitnesses, totalSuspects] = await Promise.all([
      Witness.countDocuments(subFilter),
      Suspect.countDocuments(subFilter),
    ]);

    const statusMap: Record<string, number> = {};
    (casesByStatus as Array<{ _id: string; count: number }>)
      .forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      stats: {
        total_cases:         totalCases,
        open_cases:          openCases,
        total_witnesses:     totalWitnesses,
        total_suspects:      totalSuspects,
        unverified_evidence: unverifiedEvidence,
      },
      cases_by_status:      statusMap,
      recent_cases:         recentCases.map(c => ({
        ...c,
        id:      c._id,
        io_name: (c.assigned_io as { full_name?: string } | null)?.full_name,
      })),
      recent_notifications: recentNotifications.map(n => ({ ...n, id: n._id })),
      weekly_chart:         weeklyChart,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

/* ── Weekly chart: 1 aggregation instead of 14 countDocuments calls ─────────
 *
 * Before: 7 iterations × 2 countDocuments = 14 round-trips to MongoDB
 * After:  2 aggregation pipelines (filings + closures) = 2 round-trips
 * Saving: ~12 DB round-trips per dashboard load
 * ─────────────────────────────────────────────────────────────────────────── */
async function getWeeklyChartAgg(
  caseFilter: Record<string, unknown>
): Promise<Array<{ name: string; filings: number; resolved: number }>> {
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  type DayBucket = { _id: number; count: number };

  const [filingsRaw, resolvedRaw] = await Promise.all([
    // New cases per day-of-week in the last 7 days
    Case.aggregate([
      { $match: { ...caseFilter, createdAt: { $gte: since } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
    ]) as Promise<DayBucket[]>,

    // Closed/filed cases per day-of-week in the last 7 days
    Case.aggregate([
      { $match: { ...caseFilter, status: { $in: ['closed', 'chargesheet_filed'] }, updatedAt: { $gte: since } } },
      { $group: { _id: { $dayOfWeek: '$updatedAt' }, count: { $sum: 1 } } },
    ]) as Promise<DayBucket[]>,
  ]);

  // $dayOfWeek returns 1 (Sun) – 7 (Sat); days[] uses 0-indexed JS convention
  const filingsMap:  Record<number, number> = {};
  const resolvedMap: Record<number, number> = {};
  filingsRaw .forEach(b => { filingsMap [b._id] = b.count; });
  resolvedRaw.forEach(b => { resolvedMap[b._id] = b.count; });

  // Build last-7-days array starting from `since`
  return Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(since);
    d.setDate(d.getDate() + i);
    const dow  = d.getDay() + 1;   // JS 0-6 → MongoDB $dayOfWeek 1-7
    return {
      name:     days[d.getDay()],
      filings:  filingsMap [dow] ?? 0,
      resolved: resolvedMap[dow] ?? 0,
    };
  });
}

export default router;
