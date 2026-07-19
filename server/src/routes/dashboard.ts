import { Router, Response } from 'express';
import { Router, Response } from 'express';
import Case from '../models/Case';
import Evidence from '../models/Evidence';
import Witness from '../models/Witness';
import Suspect from '../models/Suspect';
import Notification from '../models/Notification';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);

  const caseFilter: Record<string, unknown> = {};
  if (!isAdmin) {
    caseFilter.$or = [
      { assigned_io: userId },
      { assigned_sho: userId },
      { prosecutor_id: userId },
      { created_by: userId },
    ];
  }

  const [
    totalCases,
    openCases,
    casesByStatus,
    recentCases,
    totalWitnesses,
    totalSuspects,
    unverifiedEvidence,
    recentNotifications,
  ] = await Promise.all([
    Case.countDocuments(caseFilter),
    Case.countDocuments({ ...caseFilter, status: 'open' }),
    Case.aggregate([
      { $match: caseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Case.find(caseFilter)
      .populate('assigned_io', 'full_name')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    Witness.countDocuments(isAdmin ? {} : { case_id: { $in: await Case.distinct('_id', caseFilter) } }),
    Suspect.countDocuments(isAdmin ? {} : { case_id: { $in: await Case.distinct('_id', caseFilter) } }),
    Evidence.countDocuments({ is_verified: false }),
    Notification.find({ user_id: userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const statusMap: Record<string, number> = {};
  casesByStatus.forEach((s: { _id: string; count: number }) => { statusMap[s._id] = s.count; });

  res.json({
    stats: {
      total_cases: totalCases,
      open_cases: openCases,
      total_witnesses: totalWitnesses,
      total_suspects: totalSuspects,
      unverified_evidence: unverifiedEvidence,
    },
    cases_by_status: statusMap,
    recent_cases: recentCases.map((c) => ({
      ...c,
      id: c._id,
      io_name: (c.assigned_io as { full_name?: string } | null)?.full_name,
    })),
    recent_notifications: recentNotifications.map((n) => ({ ...n, id: n._id })),
    weekly_chart: await getWeeklyChart(caseFilter),
  });
});

/* Weekly filing vs closure chart data (last 7 days) */
async function getWeeklyChart(caseFilter: Record<string, unknown>) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: Array<{ name: string; filings: number; resolved: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const [filings, resolved] = await Promise.all([
      Case.countDocuments({ ...caseFilter, createdAt: { $gte: start, $lte: end } }),
      Case.countDocuments({ ...caseFilter, status: { $in: ['closed', 'chargesheet_filed'] }, updatedAt: { $gte: start, $lte: end } }),
    ]);

    result.push({ name: days[start.getDay()], filings, resolved });
  }
  return result;
}

export default router;
