import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Witness from '../models/Witness';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id } = req.query as Record<string, string>;
  const filter = case_id ? { case_id } : {};
  const docs = await Witness.find(filter).sort({ createdAt: -1 }).lean();
  res.json(docs.map((d) => ({ ...d, id: d._id })));
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const doc = await Witness.findById(req.params.id).lean();
  if (!doc) { res.status(404).json({ error: 'Witness not found' }); return; }
  res.json({ ...doc, id: doc._id });
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, full_name, alias, age, gender, address, phone, email,
    occupation, relationship_to_case, notes, protection_required } = req.body;
  if (!case_id || !full_name) { res.status(400).json({ error: 'case_id and full_name are required' }); return; }

  const doc = await Witness.create({
    case_id, full_name, alias, age, gender, address, phone, email,
    occupation, relationship_to_case, notes,
    protection_required: protection_required || false,
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const fields = ['full_name', 'alias', 'age', 'gender', 'address', 'phone', 'email',
    'occupation', 'relationship_to_case', 'court_appearance_status', 'notes', 'protection_required'];
  const update: Record<string, unknown> = {};
  fields.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

  const doc = await Witness.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!doc) { res.status(404).json({ error: 'Witness not found' }); return; }
  res.json({ ...doc, id: doc._id });
});

router.post('/:id/statements', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const { content, statement_date, recorded_by, location } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: 'Statement content is required' }); return; }

  const doc = await Witness.findById(req.params.id);
  if (!doc) { res.status(404).json({ error: 'Witness not found' }); return; }

  const newStatement = {
    id: uuidv4(),
    content,
    statement_date: statement_date ? new Date(statement_date) : new Date(),
    recorded_by: recorded_by || req.user!.full_name || 'Officer',
    location: location || '',
    createdAt: new Date(),
  };

  doc.statements.push(newStatement);

  // Activity log entry
  doc.activity_log.push({
    id: uuidv4(),
    type: 'statement_added',
    description: `Statement recorded${location ? ` at ${location}` : ''}`,
    performed_by: req.user!.full_name || 'Officer',
    createdAt: new Date(),
  });

  await doc.save();
  res.json({ message: 'Statement added', statements: doc.statements });
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await Witness.findByIdAndDelete(req.params.id);
  res.json({ message: 'Witness record deleted' });
});

export default router;
