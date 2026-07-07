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
  });
});

export default router;
