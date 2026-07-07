import { Router, Response } from 'express';
import Case from '../models/Case';
import Evidence from '../models/Evidence';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { from, to } = req.query as Record<string, string>;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();
  const dateFilter = { $gte: fromDate, $lte: toDate };

  const [casesByMonth, casesByType, evidenceByType, casesByStatus, topOfficers] = await Promise.all([
    // Cases grouped by year-month
    Case.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } },
    ]),

    // Cases by crime type
    Case.aggregate([
      { $match: { createdAt: dateFilter, crime_type: { $ne: null } } },
      { $group: { _id: '$crime_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { crime_type: '$_id', count: 1, _id: 0 } },
    ]),

    // Evidence by type
    Evidence.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$evidence_type', count: { $sum: 1 } } },
      { $project: { evidence_type: '$_id', count: 1, _id: 0 } },
    ]),

    // All cases by status (not date-filtered)
    Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),

    // Top officers by case count
    Case.aggregate([
      { $match: { createdAt: dateFilter, assigned_io: { $ne: null } } },
      { $group: { _id: '$assigned_io', case_count: { $sum: 1 } } },
      { $sort: { case_count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'officer',
        },
      },
      { $unwind: '$officer' },
      { $project: { full_name: '$officer.full_name', case_count: 1, _id: 0 } },
    ]),
  ]);

  res.json({
    cases_by_month: casesByMonth,
    cases_by_type: casesByType,
    evidence_by_type: evidenceByType,
    cases_by_status: casesByStatus,
    top_officers: topOfficers,
  });
});

export default router;
