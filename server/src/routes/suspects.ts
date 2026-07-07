import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Suspect from '../models/Suspect';
import { authenticate, AuthRequest } from '../middleware/auth';
import { callLLM } from '../services/aiService';

const router = Router();
router.use(authenticate);

/* ── GET /api/suspects — list with search ─────────────────────────────────── */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { case_id, q, arrest_status, risk_level } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (case_id && mongoose.isValidObjectId(case_id)) filter.case_id = case_id;
    if (arrest_status) filter.arrest_status = arrest_status;
    if (risk_level)    filter.risk_level    = risk_level;

    if (q) {
      filter.$or = [
        { full_name:      { $regex: q, $options: 'i' } },
        { aliases:        { $elemMatch: { $regex: q, $options: 'i' } } },
        { phone:          { $regex: q, $options: 'i' } },
        { national_id:    { $regex: q, $options: 'i' } },
        { vehicle_numbers:{ $elemMatch: { $regex: q, $options: 'i' } } },
        { pan_number:     { $regex: q, $options: 'i' } },
        { voter_id:       { $regex: q, $options: 'i' } },
        { driving_license:{ $regex: q, $options: 'i' } },
      ];
    }

    const docs = await Suspect.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to fetch suspects', detail: String(err) });
  }
});

/* ── GET /api/suspects/:id ────────────────────────────────────────────────── */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const doc = await Suspect.findById(req.params.id)
      .populate('linked_evidence', 'title evidence_type is_verified')
      .populate('linked_cases', 'case_number title status')
      .lean();
    if (!doc) { res.status(404).json({ error: 'Suspect not found' }); return; }
    res.json({ ...doc, id: doc._id });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to fetch suspect', detail: String(err) });
  }
});

/* ── POST /api/suspects — create ─────────────────────────────────────────── */
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { case_id, full_name } = req.body;
    if (!case_id || !full_name?.trim()) {
      res.status(400).json({ error: 'case_id and full_name are required' }); return;
    }
    if (!mongoose.isValidObjectId(case_id)) {
      res.status(400).json({ error: 'Invalid case_id' }); return;
    }

    const doc = await Suspect.create({
      ...req.body,
      aliases:          req.body.aliases          || [],
      vehicle_numbers:  req.body.vehicle_numbers  || [],
      known_associates: req.body.known_associates || [],
      criminal_history: req.body.criminal_history || [],
      linked_evidence:  [],
      linked_cases:     Array.isArray(req.body.linked_cases) ? req.body.linked_cases : [],
      activity_log: [{
        id: uuidv4(), type: 'created',
        description: `Record created for ${full_name}`,
        performed_by: req.user!.full_name || 'Officer',
        createdAt: new Date(),
      }],
    });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to create suspect record', detail: String(err) });
  }
});

/* ── PUT /api/suspects/:id — update ──────────────────────────────────────── */
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }

    const allowed = [
      'full_name','aliases','age','gender','nationality','religion','occupation',
      'address','phone','email','vehicle_numbers',
      'national_id','pan_number','passport_number','voter_id','driving_license',
      'description','photo_url',
      'arrest_status','arrest_date','arresting_officer','bail_status','bail_date',
      'remand_end_date','court_next_date',
      'criminal_history','has_prior_record',
      'risk_level','risk_summary','risk_indicators','flight_risk',
      'notes','known_associates',
    ];
    const update: Record<string, unknown> = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    // Log status change
    const existing = await Suspect.findById(req.params.id).select('arrest_status').lean();
    const logEntry = existing && req.body.arrest_status && req.body.arrest_status !== existing.arrest_status
      ? [{
          id: uuidv4(), type: 'status_changed',
          description: `Arrest status changed to: ${req.body.arrest_status}`,
          performed_by: req.user!.full_name || 'Officer',
          createdAt: new Date(),
        }]
      : [];

    const doc = await Suspect.findByIdAndUpdate(
      req.params.id,
      {
        ...update,
        ...(logEntry.length ? { $push: { activity_log: { $each: logEntry } } } : {}),
      },
      { new: true }
    ).lean();

    if (!doc) { res.status(404).json({ error: 'Suspect not found' }); return; }
    res.json({ ...doc, id: doc._id });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to update suspect', detail: String(err) });
  }
});

/* ── DELETE /api/suspects/:id ────────────────────────────────────────────── */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    await Suspect.findByIdAndDelete(req.params.id);
    res.json({ message: 'Suspect record deleted' });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to delete', detail: String(err) });
  }
});

/* ── POST /api/suspects/:id/note — add investigation note ────────────────── */
router.post('/:id/note', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const { note } = req.body;
    if (!note?.trim()) { res.status(400).json({ error: 'Note content is required' }); return; }

    const doc = await Suspect.findByIdAndUpdate(
      req.params.id,
      {
        notes: note,
        $push: {
          activity_log: {
            id: uuidv4(), type: 'note_added',
            description: 'Investigation note updated',
            performed_by: req.user!.full_name || 'Officer',
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).lean();

    if (!doc) { res.status(404).json({ error: 'Suspect not found' }); return; }
    res.json({ ...doc, id: doc._id });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to save note', detail: String(err) });
  }
});

/* ── POST /api/suspects/:id/criminal-history — add prior record ──────────── */
router.post('/:id/criminal-history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const { case_number, offence, court, year, outcome, sentence, notes } = req.body;
    if (!offence || !court || !year) {
      res.status(400).json({ error: 'offence, court, and year are required' }); return;
    }

    const record = { id: uuidv4(), case_number: case_number || '', offence, court, year, outcome: outcome || 'pending', sentence, notes };
    const logEntry = { id: uuidv4(), type: 'case_linked', description: `Prior record added: ${offence} (${year})`, performed_by: req.user!.full_name || 'Officer', createdAt: new Date() };

    const doc = await Suspect.findByIdAndUpdate(
      req.params.id,
      {
        has_prior_record: true,
        $push: { criminal_history: record, activity_log: logEntry },
      },
      { new: true }
    ).lean();

    if (!doc) { res.status(404).json({ error: 'Suspect not found' }); return; }
    res.json({ ...doc, id: doc._id });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to add criminal history', detail: String(err) });
  }
});

/* ── POST /api/suspects/:id/ai-risk — Gemini risk assessment ─────────────── */
router.post('/:id/ai-risk', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }

    const suspect = await Suspect.findById(req.params.id)
      .populate('linked_evidence', 'title evidence_type')
      .lean();
    if (!suspect) { res.status(404).json({ error: 'Suspect not found' }); return; }

    const prompt = `You are a senior criminal investigator. Analyze this suspect profile and produce an investigation risk assessment.

IMPORTANT: This is an investigative assessment tool ONLY.
- Do NOT label this person as guilty.
- Do NOT conclude they committed any crime.
- Only assess investigation risk factors and next steps.

Suspect Profile:
Name: ${suspect.full_name}
Aliases: ${(suspect.aliases || []).join(', ') || 'None'}
Age: ${suspect.age || 'Unknown'}
Occupation: ${suspect.occupation || 'Unknown'}
Arrest Status: ${suspect.arrest_status}
Has Prior Record: ${suspect.has_prior_record ? 'Yes' : 'No'}
Prior Records: ${(suspect.criminal_history || []).length > 0 ? (suspect.criminal_history as any[]).map((r: any) => `${r.offence} (${r.year}) — ${r.outcome}`).join('; ') : 'None on file'}
Linked Evidence Count: ${(suspect.linked_evidence || []).length}
Notes: ${suspect.notes || 'None'}

Respond ONLY with valid JSON:
{
  "risk_level": "low" | "medium" | "high" | "critical",
  "flight_risk": true | false,
  "risk_summary": "2-3 sentence professional investigative risk summary (no guilt implied)",
  "risk_indicators": ["indicator 1", "indicator 2", "indicator 3"],
  "recommended_actions": ["action 1", "action 2", "action 3"]
}`;

    const response = await callLLM(prompt);
    let parsed: any;
    try {
      const m = response.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const j = m.match(/\{[\s\S]*\}/);
      parsed = j ? JSON.parse(j[0]) : null;
    } catch { parsed = null; }

    if (!parsed) {
      res.status(500).json({ error: 'AI response parsing failed. Configure GEMINI_API_KEY for full analysis.' }); return;
    }

    const logEntry = {
      id: uuidv4(), type: 'ai_analysis',
      description: `AI risk assessment completed — Level: ${parsed.risk_level}`,
      performed_by: req.user!.full_name || 'Officer',
      createdAt: new Date(),
    };

    await Suspect.findByIdAndUpdate(req.params.id, {
      risk_level:      parsed.risk_level,
      risk_summary:    parsed.risk_summary,
      risk_indicators: parsed.risk_indicators || [],
      flight_risk:     parsed.flight_risk,
      $push: { activity_log: logEntry },
    });

    res.json({ ...parsed, disclaimer: 'AI risk indicators are for investigative purposes only. This assessment does not imply guilt or conclude any criminal act.' });
  } catch (err: unknown) {
    res.status(500).json({ error: 'AI risk analysis failed', detail: String(err) });
  }
});

export default router;
