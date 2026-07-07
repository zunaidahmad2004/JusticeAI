import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Case    from '../models/Case';
import Evidence from '../models/Evidence';
import Witness  from '../models/Witness';
import Victim   from '../models/Victim';
import Suspect  from '../models/Suspect';
import CaseDocument from '../models/CaseDocument';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateDocument } from '../services/aiService';

const router = Router();
router.use(authenticate);

/* ── GET /api/reports/case/:caseId — full case report ─────────────────────── */
router.get('/case/:caseId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { caseId } = req.params;
    if (!mongoose.isValidObjectId(caseId)) { res.status(400).json({ error: 'Invalid case ID' }); return; }

    const [caseDoc, evidence, witnesses, victims, suspects, documents] = await Promise.all([
      Case.findById(caseId).lean(),
      Evidence.find({ case_id: caseId }).lean(),
      Witness.find({ case_id: caseId }).lean(),
      Victim.find({ case_id: caseId }).lean(),
      Suspect.find({ case_id: caseId }).lean(),
      CaseDocument.find({ case_id: caseId }).lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    res.json({
      case:      caseDoc,
      evidence,
      witnesses,
      victims,
      suspects,
      documents,
      generated_at: new Date().toISOString(),
      generated_by: req.user!.id,
      stats: {
        evidence_count:  evidence.length,
        verified_evidence: evidence.filter((e) => e.is_verified).length,
        witness_count:   witnesses.length,
        victim_count:    victims.length,
        suspect_count:   suspects.length,
        document_count:  documents.length,
        approved_docs:   documents.filter((d) => d.status === 'approved').length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate case report', detail: String(err) });
  }
});

/* ── GET /api/reports/evidence-inventory/:caseId ─────────────────────────── */
router.get('/evidence-inventory/:caseId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { caseId } = req.params;
    if (!mongoose.isValidObjectId(caseId)) { res.status(400).json({ error: 'Invalid case ID' }); return; }

    const [caseDoc, evidence] = await Promise.all([
      Case.findById(caseId).select('case_number title').lean(),
      Evidence.find({ case_id: caseId }).sort({ created_at: 1 }).lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    res.json({
      case_number: (caseDoc as any).case_number,
      case_title:  (caseDoc as any).title,
      items:       evidence,
      total:       evidence.length,
      verified:    evidence.filter((e) => e.is_verified).length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate evidence inventory', detail: String(err) });
  }
});

/* ── GET /api/reports/witness-summary/:caseId ────────────────────────────── */
router.get('/witness-summary/:caseId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { caseId } = req.params;
    if (!mongoose.isValidObjectId(caseId)) { res.status(400).json({ error: 'Invalid case ID' }); return; }

    const [caseDoc, witnesses] = await Promise.all([
      Case.findById(caseId).select('case_number title').lean(),
      Witness.find({ case_id: caseId }).lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    res.json({
      case_number: (caseDoc as any).case_number,
      case_title:  (caseDoc as any).title,
      witnesses,
      total: witnesses.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate witness summary', detail: String(err) });
  }
});

/* ── POST /api/reports/ai-generate — use Gemini to generate document text ─── */
router.post('/ai-generate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { case_id, document_type } = req.body;
    if (!case_id || !document_type) {
      res.status(400).json({ error: 'case_id and document_type are required' }); return;
    }
    if (!mongoose.isValidObjectId(case_id)) { res.status(400).json({ error: 'Invalid case ID' }); return; }

    const [caseDoc, evidence, witnesses, victims, suspects] = await Promise.all([
      Case.findById(case_id).lean(),
      Evidence.find({ case_id }).select('title evidence_type is_verified').lean(),
      Witness.find({ case_id }).select('full_name statement_summary court_appearance_status').lean(),
      Victim.find({ case_id }).select('full_name injury_description').lean(),
      Suspect.find({ case_id }).select('full_name arrest_status').lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    const caseContext = {
      ...(caseDoc as any),
      evidence_items:  evidence,
      witness_list:    witnesses,
      victim_list:     victims,
      suspect_list:    suspects,
    };

    const content = await generateDocument(document_type, caseContext as unknown as Record<string, unknown>);
    res.json({ content, document_type, case_id, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate document', detail: String(err) });
  }
});

export default router;
