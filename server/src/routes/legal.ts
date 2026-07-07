import { Router, Response } from 'express';
import mongoose from 'mongoose';
import LegalProvision from '../models/LegalProvision';
import CaseLegalProvision from '../models/CaseLegalProvision';
import Checklist from '../models/Checklist';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/legal/provisions
router.get('/provisions', async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, act, category } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { section: { $regex: search, $options: 'i' } },
      { keywords: { $elemMatch: { $regex: search, $options: 'i' } } },
    ];
  }
  if (act) filter.act_name = { $regex: act, $options: 'i' };
  if (category) filter.offense_category = category;

  const provisions = await LegalProvision.find(filter).limit(50).lean();
  res.json(provisions.map((p) => ({ ...p, id: p._id })));
});

// GET /api/legal/provisions/:id
router.get('/provisions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const p = await LegalProvision.findById(req.params.id).lean();
  if (!p) { res.status(404).json({ error: 'Provision not found' }); return; }
  res.json({ ...p, id: p._id });
});

// GET /api/legal/case-provisions/:caseId
router.get('/case-provisions/:caseId', async (req: AuthRequest, res: Response): Promise<void> => {
  const docs = await CaseLegalProvision.find({ case_id: req.params.caseId })
    .populate('provision_id')
    .sort({ confidence_score: -1 })
    .lean();

  res.json(docs.map((d) => {
    const prov = d.provision_id as unknown as Record<string, unknown> | null;
    return {
      ...d,
      id: d._id,
      section: prov?.section,
      act_name: prov?.act_name,
      title: prov?.title,
      description: prov?.description,
      plain_language: prov?.plain_language,
      typical_evidence: prov?.typical_evidence,
      punishment: prov?.punishment,
      is_bailable: prov?.is_bailable,
      is_cognizable: prov?.is_cognizable,
    };
  }));
});

// POST /api/legal/case-provisions
router.post('/case-provisions', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, provision_id, confidence_score, ai_reasoning, status } = req.body;
  if (!case_id || !provision_id) {
    res.status(400).json({ error: 'case_id and provision_id are required' }); return;
  }

  // Upsert — avoid duplicates
  const existing = await CaseLegalProvision.findOne({ case_id, provision_id });
  if (existing) { res.json({ ...existing.toObject(), id: existing._id }); return; }

  const doc = await CaseLegalProvision.create({
    case_id, provision_id,
    confidence_score: confidence_score || 0.5,
    ai_reasoning,
    status: status || 'suggested',
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});

// PUT /api/legal/case-provisions/:id
router.put('/case-provisions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const { status } = req.body;
  const doc = await CaseLegalProvision.findByIdAndUpdate(
    req.params.id,
    { status, reviewed_by: req.user!.id, reviewed_at: new Date() },
    { new: true }
  ).lean();
  if (!doc) { res.status(404).json({ error: 'Record not found' }); return; }
  res.json({ ...doc, id: doc._id });
});

// GET /api/legal/checklist/:caseId
router.get('/checklist/:caseId', async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await Checklist.findOne({ case_id: req.params.caseId }).lean();
  res.json(doc ? { ...doc, id: doc._id } : null);
});

// POST /api/legal/checklist
router.post('/checklist', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, crime_type, title, items } = req.body;

  const existing = await Checklist.findOne({ case_id });
  if (existing) {
    existing.items = items;
    existing.title = title;
    await existing.save();
    res.json({ ...existing.toObject(), id: existing._id });
    return;
  }

  const doc = await Checklist.create({
    case_id, crime_type, title, items: items || [],
    created_by: req.user!.id,
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});

// PUT /api/legal/checklist/:id/item
router.put('/checklist/:id/item', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const { item_id, completed, notes } = req.body;

  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) { res.status(404).json({ error: 'Checklist not found' }); return; }

  checklist.items = checklist.items.map((item) =>
    item.id === item_id
      ? { ...item, completed, notes, updated_at: new Date() }
      : item
  );

  const completedCount = checklist.items.filter((i) => i.completed).length;
  checklist.progress = checklist.items.length > 0
    ? Math.round((completedCount / checklist.items.length) * 100)
    : 0;

  await checklist.save();
  res.json({ ...checklist.toObject(), id: checklist._id });
});

export default router;
