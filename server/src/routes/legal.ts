import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import LegalProvision from '../models/LegalProvision';
import CaseLegalProvision from '../models/CaseLegalProvision';
import Checklist from '../models/Checklist';
import Case from '../models/Case';
import Evidence from '../models/Evidence';
import Witness from '../models/Witness';
import { authenticate, AuthRequest } from '../middleware/auth';
import { callLLM } from '../services/aiService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

/* ═══════════════════════════════════════════════════════════════════════════
   LEGAL PROVISIONS DATABASE
   ═══════════════════════════════════════════════════════════════════════════ */

router.get('/provisions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, act, category, page = '1', limit = '30' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { section:     { $regex: search, $options: 'i' } },
        { keywords:    { $elemMatch: { $regex: search, $options: 'i' } } },
        { plain_language: { $regex: search, $options: 'i' } },
      ];
    }
    if (act)      filter.act_name         = { $regex: act, $options: 'i' };
    if (category) filter.offense_category = { $regex: category, $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [docs, total] = await Promise.all([
      LegalProvision.find(filter).skip(skip).limit(parseInt(limit)).lean(),
      LegalProvision.countDocuments(filter),
    ]);

    res.json({
      provisions: docs.map((p) => ({ ...p, id: p._id })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch provisions', detail: String(err) });
  }
});

router.get('/provisions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const p = await LegalProvision.findById(req.params.id).lean();
    if (!p) { res.status(404).json({ error: 'Provision not found' }); return; }
    res.json({ ...p, id: p._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch provision', detail: String(err) });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   AI-POWERED FULL ANALYSIS — Core endpoint
   ═══════════════════════════════════════════════════════════════════════════ */

router.post('/analyze', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, fir_text, additional_context, save_to_case = true } = req.body;

  if (!case_id && !fir_text) {
    res.status(400).json({ error: 'Provide either case_id or fir_text' }); return;
  }
  if (case_id && !mongoose.isValidObjectId(case_id)) {
    res.status(400).json({ error: 'Invalid case_id' }); return;
  }

  try {
    // ── Gather case context from MongoDB ─────────────────────────────────
    let contextParts: string[] = [];
    let caseTitle = '';
    let crimeType = '';

    if (case_id) {
      const [caseDoc, evidence, witnesses] = await Promise.all([
        Case.findById(case_id).lean(),
        Evidence.find({ case_id }).select('title evidence_type description is_verified').limit(10).lean(),
        Witness.find({ case_id }).select('full_name witness_type statement_summary statements').limit(5).lean(),
      ]);

      if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

      caseTitle = (caseDoc as any).title || '';
      crimeType = (caseDoc as any).crime_type || '';

      contextParts.push(`Case Title: ${caseTitle}`);
      contextParts.push(`Crime Type: ${crimeType}`);
      contextParts.push(`Case Status: ${(caseDoc as any).status}`);
      if ((caseDoc as any).description) contextParts.push(`Case Description: ${(caseDoc as any).description}`);
      if ((caseDoc as any).ai_summary) contextParts.push(`AI Summary: ${(caseDoc as any).ai_summary}`);

      if (evidence.length > 0) {
        contextParts.push(`\nEvidence on record (${evidence.length} items):`);
        evidence.forEach((e) => {
          contextParts.push(`  - ${e.title} [${e.evidence_type}] ${e.is_verified ? '(verified)' : '(pending)'}`);
        });
      }

      if (witnesses.length > 0) {
        contextParts.push(`\nWitnesses (${witnesses.length}):`);
        witnesses.forEach((w) => {
          const summary = (w as any).statement_summary || ((w as any).statements?.[0]?.content?.substring(0, 150)) || 'No statement summary';
          contextParts.push(`  - ${w.full_name} [${(w as any).witness_type}]: ${summary}`);
        });
      }
    }

    if (fir_text) contextParts.push(`\nFIR / Complaint Text:\n${fir_text}`);
    if (additional_context) contextParts.push(`\nAdditional Context:\n${additional_context}`);

    const fullContext = contextParts.join('\n');

    // ── Gemini prompt ─────────────────────────────────────────────────────
    const prompt = `You are a senior legal expert and criminal law advisor for Indian law enforcement.

TASK: Analyze the following case/FIR details and recommend applicable legal provisions.

CRITICAL RULES:
1. NEVER declare anyone guilty. Only state provisions that MAY be applicable.
2. All recommendations must explicitly state they require verification by a qualified advocate.
3. Base recommendations ONLY on the facts presented.
4. Cover all relevant Indian acts: BNS 2023, BNSS 2023, BSA 2023, IT Act 2000, POCSO 2012, NDPS 1985, IPC (if pre-2023), Prevention of Corruption Act, PMLA, Domestic Violence Act, SC/ST Act, etc.
5. Rank by confidence (0.0 to 1.0).
6. Include specific section numbers.
7. Explain required evidence for each section.

CASE DETAILS:
${fullContext}

Return ONLY valid JSON with this exact structure:
{
  "crime_category": "string (e.g. Violent Crime, Cyber Crime, Financial Fraud, etc.)",
  "analysis_summary": "2-3 sentence overview of applicable law based on facts",
  "provisions": [
    {
      "section": "103",
      "act_name": "Bharatiya Nyaya Sanhita, 2023",
      "title": "Murder",
      "plain_language": "Simple explanation of what this section covers",
      "why_applicable": "Specific reason this section may apply based on the facts provided",
      "confidence": 0.85,
      "required_evidence": ["Post-mortem report", "Eyewitness statements", "CCTV footage", "Forensic ballistics"],
      "investigation_notes": "Specific investigation steps needed to establish this section",
      "is_cognizable": true,
      "is_bailable": false,
      "punishment": "Death or imprisonment for life"
    }
  ],
  "missing_information": ["List of facts needed to confirm or rule out provisions"],
  "recommended_further_sections": ["Other acts to consider if more information emerges"],
  "disclaimer": "These recommendations are AI-generated for investigative assistance only. All legal decisions must be made by qualified advocates and authorized investigating officers."
}

Provide 3-8 most relevant provisions. Sort by confidence descending.`;

    const aiResponse = await callLLM(prompt);

    // ── Parse response ────────────────────────────────────────────────────
    let parsed: any;
    try {
      const cleaned = aiResponse.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed?.provisions) {
      res.status(500).json({
        error: 'AI response parsing failed. Ensure GEMINI_API_KEY is configured.',
        raw: aiResponse.substring(0, 300),
      });
      return;
    }

    // ── Save to MongoDB if case_id provided ───────────────────────────────
    const analysisRunId = uuidv4();
    const savedProvisions: any[] = [];

    if (case_id && save_to_case) {
      for (const p of parsed.provisions) {
        try {
          // Find matching provision in DB, or create inline record
          let provisionId: string | null = null;

          const dbProvision = await LegalProvision.findOne({
            section:  p.section,
            act_name: { $regex: p.act_name.substring(0, 20), $options: 'i' },
          }).lean();

          if (dbProvision) {
            provisionId = String(dbProvision._id);
          } else {
            // Create it in DB for future reference
            const newProv = await LegalProvision.create({
              section:      p.section,
              act_name:     p.act_name,
              title:        p.title,
              plain_language: p.plain_language,
              offense_category: parsed.crime_category,
              punishment:   p.punishment,
              is_bailable:  p.is_bailable,
              is_cognizable:p.is_cognizable,
              typical_evidence: p.required_evidence || [],
              keywords:     [p.title, p.section, p.act_name],
            });
            provisionId = String(newProv._id);
          }

          // Upsert CaseLegalProvision
          const existing = await CaseLegalProvision.findOne({ case_id, provision_id: provisionId });
          if (!existing) {
            const saved = await CaseLegalProvision.create({
              case_id,
              provision_id:        provisionId,
              confidence_score:    p.confidence || 0.5,
              ai_reasoning:        p.why_applicable,
              why_applicable:      p.why_applicable,
              required_evidence:   p.required_evidence || [],
              investigation_notes: p.investigation_notes,
              status:              'suggested',
              analysis_run_id:     analysisRunId,
            });
            savedProvisions.push(saved);
          }
        } catch (saveErr) {
          logger.warn('Failed to save one provision', { err: String(saveErr) });
        }
      }
    }

    res.json({
      ...parsed,
      analysis_run_id: analysisRunId,
      case_id,
      provisions_saved: savedProvisions.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    logger.error('Legal analysis failed', { err: String(err).substring(0, 200) });
    res.status(500).json({ error: 'Legal analysis failed', detail: String(err) });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   CASE PROVISIONS — CRUD + History
   ═══════════════════════════════════════════════════════════════════════════ */

router.get('/case-provisions/:caseId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, run_id } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { case_id: req.params.caseId };
    if (status)  filter.status          = status;
    if (run_id)  filter.analysis_run_id = run_id;

    const docs = await CaseLegalProvision.find(filter)
      .populate('provision_id')
      .populate('reviewed_by', 'full_name')
      .sort({ confidence_score: -1 })
      .lean();

    res.json(docs.map((d) => {
      const prov = d.provision_id as unknown as Record<string, unknown> | null;
      return {
        ...d,
        id:            d._id,
        section:       prov?.section,
        act_name:      prov?.act_name,
        title:         prov?.title,
        description:   prov?.description,
        plain_language:prov?.plain_language,
        typical_evidence: prov?.typical_evidence,
        punishment:    prov?.punishment,
        is_bailable:   prov?.is_bailable,
        is_cognizable: prov?.is_cognizable,
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch case provisions', detail: String(err) });
  }
});

router.post('/case-provisions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { case_id, provision_id, confidence_score, ai_reasoning, why_applicable,
            required_evidence, investigation_notes, status } = req.body;
    if (!case_id || !provision_id) {
      res.status(400).json({ error: 'case_id and provision_id are required' }); return;
    }
    const existing = await CaseLegalProvision.findOne({ case_id, provision_id });
    if (existing) {
      const populated = await CaseLegalProvision.findById(existing._id).populate('provision_id').lean();
      res.json({ ...(populated || {}), id: existing._id });
      return;
    }
    const doc = await CaseLegalProvision.create({
      case_id, provision_id,
      confidence_score:    confidence_score || 0.5,
      ai_reasoning,
      why_applicable,
      required_evidence:   required_evidence || [],
      investigation_notes,
      status:              status || 'suggested',
    });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add provision', detail: String(err) });
  }
});

router.put('/case-provisions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const { status, review_notes } = req.body;
    const doc = await CaseLegalProvision.findByIdAndUpdate(
      req.params.id,
      { status, review_notes, reviewed_by: req.user!.id, reviewed_at: new Date() },
      { new: true }
    ).populate('provision_id').lean();
    if (!doc) { res.status(404).json({ error: 'Record not found' }); return; }
    res.json({ ...doc, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update', detail: String(err) });
  }
});

router.delete('/case-provisions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    await CaseLegalProvision.findByIdAndDelete(req.params.id);
    res.json({ message: 'Provision removed from case' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete', detail: String(err) });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   CHECKLIST
   ═══════════════════════════════════════════════════════════════════════════ */

router.get('/checklist/:caseId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await Checklist.findOne({ case_id: req.params.caseId }).lean();
    res.json(doc ? { ...doc, id: doc._id } : null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch checklist', detail: String(err) });
  }
});

router.post('/checklist', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { case_id, crime_type, title, items } = req.body;
    const existing = await Checklist.findOne({ case_id });
    if (existing) {
      existing.items = items;
      existing.title = title;
      await existing.save();
      res.json({ ...existing.toObject(), id: existing._id });
      return;
    }
    const doc = await Checklist.create({ case_id, crime_type, title, items: items || [], created_by: req.user!.id });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create checklist', detail: String(err) });
  }
});

router.put('/checklist/:id/item', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const { item_id, completed, notes } = req.body;
    const checklist = await Checklist.findById(req.params.id);
    if (!checklist) { res.status(404).json({ error: 'Checklist not found' }); return; }
    checklist.items = checklist.items.map((item) =>
      item.id === item_id ? { ...item, completed, notes, updated_at: new Date() } : item
    );
    const done = checklist.items.filter((i) => i.completed).length;
    checklist.progress = checklist.items.length > 0 ? Math.round((done / checklist.items.length) * 100) : 0;
    await checklist.save();
    res.json({ ...checklist.toObject(), id: checklist._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item', detail: String(err) });
  }
});

export default router;
