import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  analyzeDocument,
  extractEntities,
  generateChecklist,
  recommendProvisions,
  detectMissingEvidence,
  analyzeRisk,
  generateDocument,
  chatWithHistory,
  callGeminiStream,
  extractTextFromFile,
  analyzeEvidence,
  generateRiskReport,
  type ChatMessage,
} from '../services/aiService';
import { logger } from '../utils/logger';
import Case from '../models/Case';
import Evidence from '../models/Evidence';
import CaseDocument from '../models/CaseDocument';
import Witness from '../models/Witness';
import Victim from '../models/Victim';
import Suspect from '../models/Suspect';
import CaseLegalProvision from '../models/CaseLegalProvision';
import LegalProvision from '../models/LegalProvision';
import AIChatSession from '../models/AIChatSession';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/* ─── Multer for FIR file uploads ────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

/* ─── POST /api/ai/analyze-fir ───────────────────────────────────────────── */
router.post('/analyze-fir', async (req: AuthRequest, res: Response): Promise<void> => {
  const { text, case_id } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: 'text is required' }); return; }

  try {
    const analysis = await analyzeDocument(text, 'fir');

    if (case_id) {
      await Case.findByIdAndUpdate(case_id, {
        ai_summary: analysis.summary,
        ai_extracted_facts: analysis as unknown as Record<string, unknown>,
      });
    }

    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed', details: String(err) });
  }
});

/* ─── POST /api/ai/analyze-fir-file — OCR + analyze uploaded document ─────── */
router.post('/analyze-fir-file', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  const file   = req.file;
  const case_id = req.body?.case_id;

  if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  try {
    const base64  = file.buffer.toString('base64');
    const mime    = file.mimetype;

    // Step 1: Extract text via Gemini Vision (OCR)
    const extractedText = await extractTextFromFile(base64, mime);

    if (!extractedText.trim()) {
      res.status(422).json({ error: 'Could not extract text from file. Please ensure the file is readable.' });
      return;
    }

    // Step 2: Analyze the extracted text as FIR
    const analysis = await analyzeDocument(extractedText, 'fir');

    if (case_id) {
      await Case.findByIdAndUpdate(case_id, {
        ai_summary: analysis.summary,
        ai_extracted_facts: analysis as unknown as Record<string, unknown>,
      });
    }

    res.json({ ...analysis, extracted_text: extractedText, file_name: file.originalname });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('FIR file analysis failed', { err: msg.substring(0, 200) });
    res.status(500).json({ error: 'File analysis failed', detail: msg });
  }
});

/* ─── POST /api/ai/extract-entities ─────────────────────────────────────── */
router.post('/extract-entities', async (req: AuthRequest, res: Response): Promise<void> => {
  const { text } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: 'text is required' }); return; }

  try {
    const entities = await extractEntities(text);
    res.json(entities);
  } catch (err) {
    res.status(500).json({ error: 'Entity extraction failed' });
  }
});

/* ─── POST /api/ai/generate-checklist ───────────────────────────────────── */
router.post('/generate-checklist', async (req: AuthRequest, res: Response): Promise<void> => {
  const { crime_type, case_description } = req.body;
  if (!crime_type?.trim()) { res.status(400).json({ error: 'crime_type is required' }); return; }

  try {
    const checklist = await generateChecklist(crime_type, case_description);
    res.json(checklist);
  } catch (err) {
    res.status(500).json({ error: 'Checklist generation failed' });
  }
});

/* ─── POST /api/ai/recommend-provisions ─────────────────────────────────── */
router.post('/recommend-provisions', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_description, crime_type, facts } = req.body;
  if (!case_description?.trim()) { res.status(400).json({ error: 'case_description is required' }); return; }

  try {
    const provisions = await recommendProvisions(case_description, crime_type, facts);
    res.json({
      provisions,
      disclaimer: 'AI recommendations are advisory only and require review by a qualified legal professional.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Provision recommendation failed' });
  }
});

/* ─── POST /api/ai/missing-evidence ─────────────────────────────────────── */
router.post('/missing-evidence', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, crime_type } = req.body;
  if (!case_id) { res.status(400).json({ error: 'case_id is required' }); return; }

  try {
    const [caseDoc, evidenceDocs] = await Promise.all([
      Case.findById(case_id).lean(),
      Evidence.find({ case_id }).select('title').lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    const existingEvidence = evidenceDocs.map((e) => e.title);
    const effectiveCrimeType = crime_type || caseDoc.crime_type || 'criminal';

    const missing = await detectMissingEvidence(effectiveCrimeType, caseDoc.title, existingEvidence);
    res.json({ missing_evidence: missing });
  } catch (err) {
    res.status(500).json({ error: 'Missing evidence analysis failed' });
  }
});

/* ─── POST /api/ai/generate-document ────────────────────────────────────── */
router.post('/generate-document', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id, document_type } = req.body;
  if (!case_id || !document_type) {
    res.status(400).json({ error: 'case_id and document_type are required' }); return;
  }

  try {
    const [caseDoc, evidenceDocs, witnessDocs, victimDocs, suspectDocs, provisionDocs] = await Promise.all([
      Case.findById(case_id).lean(),
      Evidence.find({ case_id }).lean(),
      Witness.find({ case_id }).lean(),
      Victim.find({ case_id }).lean(),
      Suspect.find({ case_id }).lean(),
      CaseLegalProvision.find({ case_id }).populate('provision_id').lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    const context = {
      case: caseDoc,
      evidence: evidenceDocs,
      witnesses: witnessDocs,
      victims: victimDocs,
      suspects: suspectDocs,
      provisions: provisionDocs,
    };

    const content = await generateDocument(document_type, context as Record<string, unknown>);

    const docRecord = await CaseDocument.create({
      case_id,
      document_type,
      title: `${document_type.replace(/_/g, ' ').toUpperCase()} — ${caseDoc.case_number}`,
      content,
      generated_by_ai: true,
      status: 'draft',
      created_by: req.user!.id,
    });

    res.json({ ...docRecord.toObject(), id: docRecord._id });
  } catch (err) {
    res.status(500).json({ error: 'Document generation failed', details: String(err) });
  }
});

/* ─── POST /api/ai/risk-analysis ─────────────────────────────────────────── */
router.post('/risk-analysis', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id } = req.body;
  if (!case_id) { res.status(400).json({ error: 'case_id is required' }); return; }

  try {
    const [caseDoc, evidenceCount, witnessCount, docStatuses] = await Promise.all([
      Case.findById(case_id).lean(),
      Evidence.countDocuments({ case_id }),
      Witness.countDocuments({ case_id }),
      CaseDocument.find({ case_id }).select('status').lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    const documentStatuses = docStatuses.map((d) => d.status);
    const { risks, completeness } = await analyzeRisk(
      caseDoc as unknown as Record<string, unknown>,
      evidenceCount,
      witnessCount,
      documentStatuses
    );

    res.json({ risks, completeness, case_id });
  } catch (err) {
    res.status(500).json({ error: 'Risk analysis failed' });
  }
});

/* ─── POST /api/ai/chat ──────────────────────────────────────────────────── */
router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  const { message, session_id, case_id, stream } = req.body;
  if (!message?.trim()) { res.status(400).json({ error: 'message is required' }); return; }

  try {
    // ── Build rich case context ──────────────────────────────────────────
    let caseContext = '';
    if (case_id) {
      const [caseDoc, evidenceList, witnessList, suspectList] = await Promise.all([
        Case.findById(case_id).select('title description crime_type ai_summary status priority location io_name').lean(),
        Evidence.find({ case_id }).select('title evidence_type is_verified').limit(10).lean(),
        Witness.find({ case_id }).select('full_name statement_summary').limit(5).lean(),
        Suspect.find({ case_id }).select('full_name status').limit(5).lean(),
      ]);
      if (caseDoc) {
        caseContext = [
          `\n\n## Active Case Context`,
          `Case Title: ${caseDoc.title}`,
          `Crime Type: ${caseDoc.crime_type || 'Unknown'}`,
          `Status: ${caseDoc.status} | Priority: ${caseDoc.priority}`,
          `Location: ${(caseDoc as any).location || 'Not specified'}`,
          `IO: ${(caseDoc as any).io_name || 'Not assigned'}`,
          caseDoc.ai_summary ? `AI Summary: ${caseDoc.ai_summary}` : '',
          evidenceList.length ? `Evidence on record (${evidenceList.length}): ${evidenceList.map((e) => e.title).join(', ')}` : '',
          witnessList.length ? `Witnesses (${witnessList.length}): ${witnessList.map((w) => w.full_name).join(', ')}` : '',
          suspectList.length ? `Suspects (${suspectList.length}): ${suspectList.map((s) => s.full_name).join(', ')}` : '',
        ].filter(Boolean).join('\n');
      }
    }

    // ── Master system prompt ─────────────────────────────────────────────
    const systemPrompt = `You are JusticeAI — an elite AI assistant for criminal investigators, forensic experts, public prosecutors, and legal professionals in India.

## Your Identity
You think and reason like a combination of:
- A 20-year experienced IPS officer who has handled homicide, cyber crime, financial fraud, narcotics, and terrorism cases
- A senior criminal lawyer who knows IPC/BNS, CrPC/BNSS, Indian Evidence Act/BSA, IT Act, POCSO, and NDPS Act deeply
- A forensic science expert with experience in digital forensics, DNA analysis, ballistics, and document examination

## Core Principles
1. **Think before answering.** Internally analyze the question from every angle before writing your response.
2. **Complete answers only.** Never stop mid-thought. Cover the topic fully. If the answer is long, continue until done.
3. **Context-aware.** You remember everything said in this conversation. Use prior context naturally.
4. **Accurate over fast.** Prefer factual accuracy. If uncertain, say so clearly instead of guessing.
5. **No hallucination.** If you do not know something, say: "I don't have enough information to conclude this with certainty."
6. **Structured responses.** Use Markdown: headings, bullet lists, numbered steps, bold for key terms, tables where useful.

## Response Style
- Natural, intelligent, and professional — like a trusted senior colleague explaining something clearly
- Not robotic. Not template-based. Each answer is crafted for the specific question asked.
- Analytical: explain the *why* behind every recommendation
- For complex questions: cover multiple angles, scenarios, risks, and next steps

## Investigation Analysis Framework
When analyzing any investigative scenario, consider:
- **Evidence**: physical, digital, forensic, documentary
- **Timeline**: reconstruct sequence of events
- **Motive**: who benefits, who had reason
- **Opportunity**: who had access, when and where
- **Suspects**: profile, alibi, prior history
- **Witnesses**: reliability, corroboration
- **Digital trail**: CDR, CCTV, metadata, social media, IP logs
- **Legal gaps**: what is missing that would weaken prosecution
- **Risks**: what could go wrong in investigation or court
- **Next steps**: practical, prioritized action items

## For Complex Investigation Questions, Structure as:
### Summary
### Detailed Analysis  
### Possible Scenarios
### Required Evidence
### Applicable Legal Provisions (BNS/BNSS/BSA/IT Act/POCSO/NDPS)
### Recommended Next Steps
### Important Precautions
### Conclusion

## Indian Law Expertise
You are deeply familiar with:
- **BNS 2023** (Bharatiya Nyaya Sanhita) — replaced IPC
- **BNSS 2023** (Bharatiya Nagarik Suraksha Sanhita) — replaced CrPC
- **BSA 2023** (Bharatiya Sakshya Adhiniyam) — replaced Indian Evidence Act
- **IT Act 2000** and amendments
- **POCSO Act 2012**
- **NDPS Act 1985**
- **Prevention of Corruption Act 1988**
- **Prevention of Money Laundering Act 2002**
- Supreme Court and High Court landmark judgments
- NCRB investigation standards and procedures

## Important Disclaimers
- Legal recommendations are advisory only — must be verified by a qualified advocate
- Investigation suggestions require review by the supervising officer
- You do NOT determine guilt or innocence — that is the court's role
${caseContext}`;

    // ── Load conversation history ────────────────────────────────────────
    let history: ChatMessage[] = [];
    if (session_id) {
      const session = await AIChatSession.findOne({ _id: session_id, user_id: req.user!.id });
      if (session) {
        // Keep last 20 messages for context window management
        history = session.messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      }
    }

    const userMsg = { role: 'user' as const, content: message, timestamp: new Date() };

    // ── STREAMING mode ──────────────────────────────────────────────────
    if (stream === true) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      let fullResponse = '';

      try {
        // Build Gemini contents
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

        if (history.length === 0) {
          contents.push({ role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n\nUser: ${message}` }] });
        } else {
          const [first, ...rest] = history;
          contents.push({ role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n\nUser: ${first.content}` }] });
          rest.forEach((m) => {
            contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] });
          });
          contents.push({ role: 'user', parts: [{ text: message }] });
        }

        await callGeminiStream(contents, (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });
      } catch (streamErr) {
        logger.error('Streaming error', { err: String(streamErr) });
        fullResponse = 'I encountered an error generating the response. Please try again.';
        res.write(`data: ${JSON.stringify({ chunk: fullResponse })}\n\n`);
      }

      // Save to session
      const assistantMsg = { role: 'assistant' as const, content: fullResponse, timestamp: new Date() };
      let currentSessionId = session_id;

      if (session_id) {
        await AIChatSession.findByIdAndUpdate(session_id, {
          $push: { messages: { $each: [userMsg, assistantMsg] } },
          updatedAt: new Date(),
        });
      } else {
        const newSession = await AIChatSession.create({
          case_id: case_id || undefined,
          user_id: req.user!.id,
          title: message.substring(0, 80),
          messages: [userMsg, assistantMsg],
        });
        currentSessionId = String(newSession._id);
      }

      res.write(`data: ${JSON.stringify({ done: true, session_id: currentSessionId })}\n\n`);
      res.end();
      return;
    }

    // ── NON-STREAMING mode ──────────────────────────────────────────────
    const response = await chatWithHistory(systemPrompt, history, message);
    const assistantMsg = { role: 'assistant' as const, content: response, timestamp: new Date() };
    let currentSessionId = session_id;

    if (session_id) {
      await AIChatSession.findByIdAndUpdate(session_id, {
        $push: { messages: { $each: [userMsg, assistantMsg] } },
        updatedAt: new Date(),
      });
    } else {
      const newSession = await AIChatSession.create({
        case_id: case_id || undefined,
        user_id: req.user!.id,
        title: message.substring(0, 80),
        messages: [userMsg, assistantMsg],
      });
      currentSessionId = String(newSession._id);
    }

    res.json({ response, session_id: currentSessionId });
  } catch (err) {
    res.status(500).json({ error: 'AI chat failed', details: String(err) });
  }
});

/* ─── GET /api/ai/chat/sessions ─────────────────────────────────────────── */
router.get('/chat/sessions', async (req: AuthRequest, res: Response): Promise<void> => {
  const sessions = await AIChatSession.find({ user_id: req.user!.id })
    .select('title case_id createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  res.json(sessions.map((s) => ({ ...s, id: s._id })));
});

/* ─── GET /api/ai/chat/sessions/:id ─────────────────────────────────────── */
router.get('/chat/sessions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await AIChatSession.findOne({
    _id: req.params.id,
    user_id: req.user!.id,
  }).lean();

  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  res.json({ ...session, id: session._id });
});

/* ─── POST /api/ai/analyze-evidence ─────────────────────────────────────── */
router.post('/analyze-evidence', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { evidence_id, title, evidence_type, description } = req.body;

  if (!title || !evidence_type) {
    res.status(400).json({ error: 'title and evidence_type are required' }); return;
  }

  try {
    let base64: string | undefined;
    let mime:   string | undefined;

    if (req.file) {
      base64 = req.file.buffer.toString('base64');
      mime   = req.file.mimetype;
    } else if (evidence_id) {
      // Try to load the existing evidence file from disk
      const ev = await Evidence.findById(evidence_id).lean();
      if (ev?.file_url) {
        const filePath = path.resolve(process.cwd(), ev.file_url.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          base64 = fs.readFileSync(filePath).toString('base64');
          mime   = ev.mime_type || 'image/jpeg';
        }
      }
    }

    const analysis = await analyzeEvidence(
      title, evidence_type, description || '', base64, mime
    );

    // Persist AI summary back to evidence record
    if (evidence_id) {
      await Evidence.findByIdAndUpdate(evidence_id, { ai_summary: analysis.summary });
    }

    res.json(analysis);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Evidence analysis failed', { err: msg.substring(0, 200) });
    res.status(500).json({ error: 'Evidence analysis failed', detail: msg });
  }
});

/* ─── POST /api/ai/risk-report ───────────────────────────────────────────── */
router.post('/risk-report', async (req: AuthRequest, res: Response): Promise<void> => {
  const { case_id } = req.body;
  if (!case_id) { res.status(400).json({ error: 'case_id is required' }); return; }

  try {
    const [caseDoc, evidenceDocs, witnessCount, suspectCount, victimCount, docStatuses] = await Promise.all([
      Case.findById(case_id).lean(),
      Evidence.find({ case_id }).select('title').lean(),
      Witness.countDocuments({ case_id }),
      Suspect.countDocuments({ case_id }),
      Victim.countDocuments({ case_id }),
      CaseDocument.find({ case_id }).select('status').lean(),
    ]);

    if (!caseDoc) { res.status(404).json({ error: 'Case not found' }); return; }

    const report = await generateRiskReport(
      caseDoc as unknown as Record<string, unknown>,
      evidenceDocs.length,
      witnessCount,
      suspectCount,
      victimCount,
      docStatuses.map((d) => d.status),
      (caseDoc as any).crime_type || 'criminal',
      evidenceDocs.map((e) => e.title)
    );

    res.json({ ...report, case_id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Risk report generation failed', detail: msg });
  }
});

export default router;
