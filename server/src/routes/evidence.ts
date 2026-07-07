import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Evidence from '../models/Evidence';
import TimelineEvent from '../models/TimelineEvent';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, process.env.UPLOAD_DIR || './uploads'),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/evidence
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, evidence_type, search } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};

  // Only apply case_id filter when it's a valid non-empty value
  if (case_id && mongoose.isValidObjectId(case_id)) filter.case_id = case_id;

  if (evidence_type) filter.evidence_type = evidence_type;
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
  ];

  const evidence = await Evidence.find(filter)
    .populate('collected_by', 'full_name')
    .sort({ createdAt: -1 })
    .lean();

  res.json(evidence.map((e) => ({
    ...e,
    id: e._id,
    collected_by_name: (e.collected_by as { full_name?: string } | null)?.full_name,
  })));
});

// GET /api/evidence/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const e = await Evidence.findById(req.params.id).populate('collected_by', 'full_name').lean();
  if (!e) { res.status(404).json({ error: 'Evidence not found' }); return; }
  res.json({ ...e, id: e._id, collected_by_name: (e.collected_by as { full_name?: string } | null)?.full_name });
});

// POST /api/evidence  (multipart)
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, title, description, evidence_type, collected_at, location_found, tags, evidence_number } = req.body;
  if (!case_id || !title || !evidence_type) {
    res.status(400).json({ error: 'case_id, title, and evidence_type are required' }); return;
  }

  const file = req.file;
  const evidenceNum = evidence_number || `EVI-${uuidv4().substring(0, 8).toUpperCase()}`;

  const e = await Evidence.create({
    case_id,
    evidence_number: evidenceNum,
    title, description, evidence_type,
    file_url: file ? `/uploads/${file.filename}` : undefined,
    file_name: file?.originalname,
    file_size: file?.size,
    mime_type: file?.mimetype,
    collected_by: req.user!.id,
    collected_at: collected_at || new Date(),
    location_found,
    tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
    chain_of_custody: [{
      timestamp: new Date(),
      action: 'Evidence collected and uploaded',
      officer: req.user!.full_name,
      officer_id: req.user!.id,
    }],
  });

  await TimelineEvent.create({
    case_id,
    event_type: 'evidence_uploaded',
    title: `Evidence uploaded: ${title}`,
    description,
    event_date: new Date(),
    performed_by: req.user!.id,
    related_entity_type: 'evidence',
    related_entity_id: e._id,
  });

  res.status(201).json({ ...e.toObject(), id: e._id });
});

// PUT /api/evidence/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const { title, description, tags, is_verified, ai_summary } = req.body;
  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (tags !== undefined) update.tags = tags;
  if (is_verified !== undefined) update.is_verified = is_verified;
  if (ai_summary !== undefined) update.ai_summary = ai_summary;

  const updated = await Evidence.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: 'Evidence not found' }); return; }
  res.json({ ...updated, id: updated._id });
});

// POST /api/evidence/:id/custody
router.post('/:id/custody', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const { action, notes } = req.body;

  const e = await Evidence.findById(req.params.id);
  if (!e) { res.status(404).json({ error: 'Evidence not found' }); return; }

  e.chain_of_custody.push({
    timestamp: new Date(),
    action,
    notes,
    officer: req.user!.full_name,
    officer_id: new mongoose.Types.ObjectId(req.user!.id),
  });
  await e.save();
  res.json({ message: 'Custody entry added', chain_of_custody: e.chain_of_custody });
});

// DELETE /api/evidence/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await Evidence.findByIdAndDelete(req.params.id);
  res.json({ message: 'Evidence deleted' });
});

export default router;
