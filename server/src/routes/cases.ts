import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Case from '../models/Case';
import Evidence from '../models/Evidence';
import Witness from '../models/Witness';
import Victim from '../models/Victim';
import Suspect from '../models/Suspect';
import CaseLegalProvision from '../models/CaseLegalProvision';
import LegalProvision from '../models/LegalProvision';
import Checklist from '../models/Checklist';
import { geocodeAddress, sleep } from '../services/geocodeService';
import { logger } from '../utils/logger';
import CaseDocument from '../models/CaseDocument';
import TimelineEvent from '../models/TimelineEvent';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/cases/map — MUST be before /:id to avoid route collision
   ═══════════════════════════════════════════════════════════════════════════ */
router.get('/map', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { priority, status, crime_type, fir_number } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {
      latitude:  { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
    };
    if (priority)   filter.priority   = priority;
    if (status)     filter.status     = status;
    if (crime_type) filter.crime_type = { $regex: crime_type, $options: 'i' };
    if (fir_number) filter.fir_number = { $regex: fir_number, $options: 'i' };

    const cases = await Case.find(filter)
      .select('case_number fir_number title crime_type status priority latitude longitude address city state location incident_location io_name incident_date date_of_incident createdAt')
      .populate('assigned_io', 'full_name')
      .lean();

    const markers = cases.map((c) => ({
      id:               String(c._id),
      case_number:      c.case_number,
      fir_number:       c.fir_number  || '',
      title:            c.title,
      crime_type:       c.crime_type  || 'Unknown',
      status:           c.status,
      priority:         c.priority,
      latitude:         c.latitude,
      longitude:        c.longitude,
      address:          c.address || c.location || c.incident_location || '',
      city:             c.city    || '',
      state:            c.state   || '',
      io_name:          c.io_name || (c.assigned_io as any)?.full_name || 'Unassigned',
      date_of_incident: c.incident_date || c.date_of_incident || c.createdAt,
    }));

    const [total, open, highPri, withCoords] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: { $in: ['open', 'under_investigation'] } }),
      Case.countDocuments({ priority: { $in: ['high', 'critical'] } }),
      Case.countDocuments({ latitude: { $exists: true, $ne: null } }),
    ]);

    res.json({
      markers,
      stats: { total, open, high_priority: highPri, with_coordinates: withCoords },
    });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to fetch map data', detail: String(err) });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/cases/geocode-batch — MUST be before /:id
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/geocode-batch', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pending = await Case.find({
      $or: [
        { address:  { $exists: true, $ne: '' } },
        { city:     { $exists: true, $ne: '' } },
        { location: { $exists: true, $ne: '' } },
      ],
      latitude:  { $exists: false },
      longitude: { $exists: false },
    }).select('_id case_number address city state location incident_location').lean();

    if (!pending.length) {
      res.json({ message: 'No cases require geocoding.', geocoded: 0, total_pending: 0 });
      return;
    }

    res.json({ message: `Geocoding ${pending.length} cases in background.`, total_pending: pending.length });

    (async () => {
      let geocoded = 0;
      for (const c of pending) {
        const addr = [c.address, c.city, c.state, c.location, c.incident_location].filter(Boolean).join(', ');
        if (!addr) continue;
        await sleep(1200);
        const result = await geocodeAddress(addr);
        if (result) {
          await Case.findByIdAndUpdate(c._id, { latitude: result.latitude, longitude: result.longitude, geocoded_at: new Date() });
          geocoded++;
          logger.info(`Batch geocoded ${c.case_number}: ${result.latitude}, ${result.longitude}`);
        }
      }
      logger.info(`Batch geocoding complete: ${geocoded}/${pending.length} cases geocoded`);
    })().catch((err) => logger.error('Batch geocoding error', { err: String(err) }));
  } catch (err: unknown) {
    res.status(500).json({ error: 'Batch geocoding failed', detail: String(err) });
  }
});

// GET /api/cases
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, search, page = '1', limit = '20', assignedTo } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };
  if (assignedTo) filter.assigned_io = assignedTo;

  // Non-admins only see their cases
  if (!['admin', 'super_admin'].includes(req.user!.role)) {
    filter.$or = [
      { assigned_io: req.user!.id },
      { assigned_sho: req.user!.id },
      { prosecutor_id: req.user!.id },
      { created_by: req.user!.id },
    ];
  }

  const [cases, total] = await Promise.all([
    Case.find(filter)
      .populate('assigned_io', 'full_name email')
      .populate('assigned_sho', 'full_name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Case.countDocuments(filter),
  ]);

  // Attach evidence/witness counts
  const caseIds = cases.map((c) => c._id);
  const [evidenceCounts, witnessCounts] = await Promise.all([
    Evidence.aggregate([{ $match: { case_id: { $in: caseIds } } }, { $group: { _id: '$case_id', count: { $sum: 1 } } }]),
    Witness.aggregate([{ $match: { case_id: { $in: caseIds } } }, { $group: { _id: '$case_id', count: { $sum: 1 } } }]),
  ]);

  const evMap: Record<string, number> = {};
  const wiMap: Record<string, number> = {};
  evidenceCounts.forEach((e) => { evMap[String(e._id)] = e.count; });
  witnessCounts.forEach((w) => { wiMap[String(w._id)] = w.count; });

  const enriched = cases.map((c) => ({
    ...c,
    id: c._id,
    io_name: (c.assigned_io as { full_name?: string } | null)?.full_name,
    sho_name: (c.assigned_sho as { full_name?: string } | null)?.full_name,
    evidence_count: evMap[String(c._id)] || 0,
    witness_count: wiMap[String(c._id)] || 0,
  }));

  res.json({ cases: enriched, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
});

// GET /api/cases/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }

  const caseDoc = await Case.findById(req.params.id)
    .populate('assigned_io', 'full_name email')
    .populate('assigned_sho', 'full_name')
    .populate('prosecutor_id', 'full_name')
    .lean();

  if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

  const caseId = caseDoc._id;
  const [evidence, witnesses, victims, suspects, provisions, checklist, documents] = await Promise.all([
    Evidence.find({ case_id: caseId }).lean(),
    Witness.find({ case_id: caseId }).lean(),
    Victim.find({ case_id: caseId }).lean(),
    Suspect.find({ case_id: caseId }).lean(),
    CaseLegalProvision.find({ case_id: caseId }).populate('provision_id').lean(),
    Checklist.findOne({ case_id: caseId }).lean(),
    CaseDocument.find({ case_id: caseId }).sort({ createdAt: -1 }).lean(),
  ]);

  const io = caseDoc.assigned_io as { full_name?: string; email?: string } | null;
  const sho = caseDoc.assigned_sho as { full_name?: string } | null;
  const prosecutor = caseDoc.prosecutor_id as { full_name?: string } | null;

  res.json({
    ...caseDoc,
    id: caseDoc._id,
    io_name: io?.full_name,
    io_email: io?.email,
    sho_name: sho?.full_name,
    prosecutor_name: prosecutor?.full_name,
    evidence,
    witnesses,
    victims,
    suspects,
    legal_provisions: provisions,
    checklist,
    documents,
  });
});

// POST /api/cases
router.post(
  '/',
  [body('title').trim().notEmpty()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const {
      title, description, crime_type, incident_date, incident_location,
      fir_number, fir_date, police_station, assigned_io, assigned_sho,
      prosecutor_id, priority, tags,
    } = req.body;

    const year = new Date().getFullYear();
    const count = await Case.countDocuments({ createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } });
    const case_number = `JAI-${year}-${String(count + 1).padStart(5, '0')}`;

    const newCase = await Case.create({
      case_number, title, description, crime_type,
      incident_date: incident_date || undefined,
      incident_location, fir_number,
      fir_date: fir_date || undefined,
      police_station,
      assigned_io: assigned_io || req.user!.id,
      assigned_sho: assigned_sho || undefined,
      prosecutor_id: prosecutor_id || undefined,
      priority: priority || 'medium',
      tags: tags || [],
      created_by: req.user!.id,
    });

    await TimelineEvent.create({
      case_id: newCase._id,
      event_type: 'case_created',
      title: 'Case Registered',
      event_date: new Date(),
      performed_by: req.user!.id,
      is_milestone: true,
    });

    res.status(201).json({ ...newCase.toObject(), id: newCase._id });
  }
);

// PUT /api/cases/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }

  const allowed = ['title', 'description', 'status', 'crime_type', 'incident_date',
    'incident_location', 'fir_number', 'police_station', 'assigned_io',
    'assigned_sho', 'prosecutor_id', 'priority', 'tags', 'ai_summary', 'ai_extracted_facts'];

  const update: Record<string, unknown> = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

  const updated = await Case.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: 'Case not found' }); return; }
  res.json({ ...updated, id: updated._id });
});

// DELETE /api/cases/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!['admin', 'super_admin'].includes(req.user!.role)) {
    res.status(403).json({ error: 'Only admins can delete cases' }); return;
  }
  await Case.findByIdAndDelete(req.params.id);
  res.json({ message: 'Case deleted' });
});

// GET /api/cases/:id/timeline
router.get('/:id/timeline', async (req: AuthRequest, res: Response): Promise<void> => {
  const events = await TimelineEvent.find({ case_id: req.params.id })
    .populate('performed_by', 'full_name')
    .sort({ event_date: 1 })
    .lean();

  res.json(events.map((e) => ({
    ...e,
    id: e._id,
    performed_by_name: (e.performed_by as { full_name?: string } | null)?.full_name,
  })));
});

// POST /api/cases/:id/timeline
router.post('/:id/timeline', async (req: AuthRequest, res: Response): Promise<void> => {
  const { event_type, title, description, event_date, is_milestone } = req.body;
  const event = await TimelineEvent.create({
    case_id: req.params.id,
    event_type, title, description,
    event_date: event_date || new Date(),
    performed_by: req.user!.id,
    is_milestone: is_milestone || false,
  });
  res.status(201).json({ ...event.toObject(), id: event._id });
});

export default router;
