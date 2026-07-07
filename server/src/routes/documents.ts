import { Router, Response } from 'express';
import mongoose from 'mongoose';
import CaseDocument from '../models/CaseDocument';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, document_type } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (case_id) filter.case_id = case_id;
  if (document_type) filter.document_type = document_type;

  const docs = await CaseDocument.find(filter)
    .populate('created_by', 'full_name')
    .sort({ createdAt: -1 })
    .lean();

  res.json(docs.map((d) => ({
    ...d,
    id: d._id,
    created_by_name: (d.created_by as { full_name?: string } | null)?.full_name,
  })));
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const doc = await CaseDocument.findById(req.params.id).lean();
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  res.json({ ...doc, id: doc._id });
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, document_type, title, content, generated_by_ai } = req.body;
  if (!case_id || !document_type || !title) {
    res.status(400).json({ error: 'case_id, document_type, and title are required' }); return;
  }

  const doc = await CaseDocument.create({
    case_id, document_type, title, content,
    generated_by_ai: generated_by_ai || false,
    created_by: req.user!.id,
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const { title, content, status } = req.body;
  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = title;
  if (content !== undefined) update.content = content;
  if (status !== undefined) update.status = status;

  const doc = await CaseDocument.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  res.json({ ...doc, id: doc._id });
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await CaseDocument.findByIdAndDelete(req.params.id);
  res.json({ message: 'Document deleted' });
});

export default router;
