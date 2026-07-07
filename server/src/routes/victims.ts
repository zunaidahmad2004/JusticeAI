import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Victim from '../models/Victim';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id } = req.query as Record<string, string>;
  const docs = await Victim.find(case_id ? { case_id } : {}).sort({ createdAt: -1 }).lean();
  res.json(docs.map((d) => ({ ...d, id: d._id })));
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const doc = await Victim.findById(req.params.id).lean();
  if (!doc) { res.status(404).json({ error: 'Victim not found' }); return; }
  res.json({ ...doc, id: doc._id });
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, full_name, age, gender, address, phone, email,
    injury_description, compensation_status, notes } = req.body;
  if (!case_id || !full_name) { res.status(400).json({ error: 'case_id and full_name are required' }); return; }

  const doc = await Victim.create({
    case_id, full_name, age, gender, address, phone, email,
    injury_description, compensation_status, notes,
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const fields = ['full_name', 'age', 'gender', 'address', 'phone', 'email',
    'injury_description', 'compensation_status', 'notes'];
  const update: Record<string, unknown> = {};
  fields.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

  const doc = await Victim.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!doc) { res.status(404).json({ error: 'Victim not found' }); return; }
  res.json({ ...doc, id: doc._id });
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await Victim.findByIdAndDelete(req.params.id);
  res.json({ message: 'Victim record deleted' });
});

export default router;
