import { Router, Response } from 'express';
import mongoose from 'mongoose';
import CourtHearing from '../models/CourtHearing';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendRealtimeNotification } from '../services/socketService';

const router = Router();
router.use(authenticate);

/* GET /api/court-hearings?case_id=&status=&from=&to= */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { case_id, status, from, to } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (case_id && mongoose.isValidObjectId(case_id)) filter.case_id = case_id;
    if (status) filter.status = status;
    if (from || to) {
      filter.hearing_date = {};
      if (from) (filter.hearing_date as any).$gte = new Date(from);
      if (to)   (filter.hearing_date as any).$lte = new Date(to);
    }
    const hearings = await CourtHearing.find(filter)
      .populate('case_id', 'case_number title')
      .sort({ hearing_date: 1 })
      .lean();
    res.json(hearings.map((h) => ({ ...h, id: h._id })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hearings', detail: String(err) });
  }
});

/* GET /api/court-hearings/upcoming — next 30 days */
router.get('/upcoming', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now  = new Date();
    const end  = new Date(); end.setDate(end.getDate() + 30);
    const hearings = await CourtHearing.find({
      hearing_date: { $gte: now, $lte: end },
      status: 'scheduled',
    })
      .populate('case_id', 'case_number title crime_type')
      .sort({ hearing_date: 1 })
      .limit(20)
      .lean();
    res.json(hearings.map((h) => ({ ...h, id: h._id })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming hearings', detail: String(err) });
  }
});

/* GET /api/court-hearings/:id */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const h = await CourtHearing.findById(req.params.id).populate('case_id', 'case_number title').lean();
    if (!h) { res.status(404).json({ error: 'Hearing not found' }); return; }
    res.json({ ...h, id: h._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hearing', detail: String(err) });
  }
});

/* POST /api/court-hearings */
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { case_id, title, court_name, hearing_date } = req.body;
    if (!case_id || !title || !court_name || !hearing_date) {
      res.status(400).json({ error: 'case_id, title, court_name, hearing_date are required' }); return;
    }
    const hearing = await CourtHearing.create({ ...req.body, created_by: req.user!.id });

    sendRealtimeNotification({
      type: 'court_hearing',
      title: 'Court Hearing Scheduled',
      message: `${title} on ${new Date(hearing_date).toLocaleDateString('en-IN')}`,
      case_id: String(case_id),
    });

    res.status(201).json({ ...hearing.toObject(), id: hearing._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create hearing', detail: String(err) });
  }
});

/* PUT /api/court-hearings/:id */
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const hearing = await CourtHearing.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!hearing) { res.status(404).json({ error: 'Hearing not found' }); return; }
    res.json({ ...hearing, id: hearing._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hearing', detail: String(err) });
  }
});

/* DELETE /api/court-hearings/:id */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    await CourtHearing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hearing deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hearing', detail: String(err) });
  }
});

export default router;
