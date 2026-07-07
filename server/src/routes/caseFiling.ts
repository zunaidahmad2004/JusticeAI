/**
 * Case Filing Route
 * POST /api/case-filing/analyze
 * Accepts FIR details → returns matched real legal sections + investigation procedure
 */

import { Router, Response } from 'express';
import LegalProvision from '../models/LegalProvision';
import { callLLM } from '../services/aiService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

interface MatchedSection {
  _id: string;
  act_name: string;
  section: string;
  title: string;
  description: string;
  plain_language: string;
  offense_category: string;
  punishment: string;
  is_bailable: boolean;
  is_cognizable: boolean;
  typical_evidence: string[];
  why_applicable: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ProcedureStep {
  step: number;
  title: string;
  description: string;
  timeline: string;
  legal_reference: string;
}

interface CaseFilingAnalysis {
  matched_sections: MatchedSection[];
  investigation_procedure: ProcedureStep[];
  immediate_actions: string[];
  important_notes: string[];
  court_jurisdiction: string;
  arrest_powers: string;
}

// ─── Helper: keyword-based DB match ──────────────────────────────────────────

const findMatchingProvisions = async (
  crimeType: string,
  description: string,
  incidentDetails: string
): Promise<typeof LegalProvision extends new () => infer T ? T[] : never> => {
  const fullText = `${crimeType} ${description} ${incidentDetails}`.toLowerCase();

  // Build keyword search terms from the text
  const allProvisions = await LegalProvision.find({}).lean();

  // Score each provision by keyword matches
  const scored = allProvisions.map((p) => {
    const keywords = p.keywords || [];
    let score = 0;
    for (const kw of keywords) {
      if (fullText.includes(kw.toLowerCase())) score += 2;
    }
    // Also check offense category
    if (p.offense_category && fullText.includes(p.offense_category.toLowerCase())) score += 1;
    // Check section title
    if (p.title && fullText.includes(p.title.toLowerCase())) score += 1;
    return { provision: p, score };
  });

  // Return top 8 scoring provisions
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((s) => s.provision) as ReturnType<typeof findMatchingProvisions> extends Promise<infer T> ? T : never;
};

// ─── POST /api/case-filing/analyze ───────────────────────────────────────────

router.post('/analyze', async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    crime_type,
    incident_description,
    incident_date,
    incident_location,
    victim_details,
    accused_details,
    additional_facts,
  } = req.body;

  if (!crime_type || !incident_description) {
    res.status(400).json({ error: 'crime_type and incident_description are required' });
    return;
  }

  // Truncate inputs to prevent timeouts from excessively long text
  const MAX_DESC = 1500;
  const MAX_FACTS = 500;
  const truncatedDescription = incident_description.length > MAX_DESC
    ? incident_description.substring(0, MAX_DESC) + '...'
    : incident_description;
  const truncatedFacts = additional_facts && additional_facts.length > MAX_FACTS
    ? additional_facts.substring(0, MAX_FACTS) + '...'
    : additional_facts;

  try {
    // Step 1: Find matching provisions from DB
    const fullText = `${crime_type} ${truncatedDescription} ${truncatedFacts || ''}`;
    const dbMatches = await LegalProvision.find({}).lean();

    const scored = dbMatches.map((p) => {
      const kws = p.keywords || [];
      let score = 0;
      kws.forEach((kw) => { if (fullText.toLowerCase().includes(kw.toLowerCase())) score += 2; });
      if (p.offense_category && fullText.toLowerCase().includes(p.offense_category.toLowerCase())) score += 1;
      return { p, score };
    }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

    const topProvisions = scored.map((s) => s.p);

    // Step 2: Use AI to refine matches and generate procedure
    const provisionsContext = topProvisions.map((p) =>
      `Section ${p.section} ${p.act_name} — ${p.title}: ${p.plain_language}`
    ).join('\n');

    const prompt = `You are a senior Indian police officer and legal expert with 20 years of experience.

A police officer has filed the following FIR/case details:

Crime Type: ${crime_type}
Incident Description: ${truncatedDescription}
Date/Time: ${incident_date || 'Not specified'}
Location: ${incident_location || 'Not specified'}
Victim Details: ${victim_details ? victim_details.substring(0, 300) : 'Not specified'}
Accused Details: ${accused_details ? accused_details.substring(0, 300) : 'Not specified'}
Additional Facts: ${truncatedFacts || 'None'}

Candidate legal provisions from our database:
${provisionsContext}

Instructions:
1. Select which candidate provisions ACTUALLY apply to this case (pick 2-5 most relevant)
2. For each, explain WHY it applies and rate confidence: high/medium/low
3. Generate 6-8 step investigation procedure for this specific case type
4. List 5-6 immediate actions for first 24 hours
5. Note important legal requirements

Return ONLY valid JSON (no markdown):
{
  "applicable_sections": [
    {
      "section": "103",
      "act_name": "Bharatiya Nyaya Sanhita, 2023",
      "why_applicable": "specific reason this section applies to THIS case",
      "confidence": "high"
    }
  ],
  "investigation_procedure": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed description of what to do",
      "timeline": "Within 1 hour",
      "legal_reference": "Section/Rule reference if any"
    }
  ],
  "immediate_actions": ["Action 1", "Action 2"],
  "important_notes": ["Legal note 1", "Note 2"],
  "court_jurisdiction": "Which court will have jurisdiction and why",
  "arrest_powers": "Whether this is cognizable offence — can police arrest without warrant?"
}`;

    const aiResponse = await callLLM(prompt);

    let aiData: {
      applicable_sections: Array<{ section: string; act_name: string; why_applicable: string; confidence: string }>;
      investigation_procedure: ProcedureStep[];
      immediate_actions: string[];
      important_notes: string[];
      court_jurisdiction: string;
      arrest_powers: string;
    };

    try {
      const stripped = aiResponse.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      aiData = {
        applicable_sections: topProvisions.slice(0, 3).map((p) => ({
          section: p.section,
          act_name: p.act_name,
          why_applicable: `This section applies based on the nature of the ${crime_type} offence described.`,
          confidence: 'medium',
        })),
        investigation_procedure: defaultProcedure(crime_type),
        immediate_actions: defaultImmediateActions(),
        important_notes: ['All legal actions must be reviewed by a senior officer.'],
        court_jurisdiction: 'Magistrate Court having territorial jurisdiction over the incident location.',
        arrest_powers: topProvisions.some((p) => p.is_cognizable)
          ? 'This is a COGNIZABLE offence — police CAN arrest without warrant under BNSS Section 35.'
          : 'This is a NON-COGNIZABLE offence — police require a magistrate warrant to arrest.',
      };
    }

    // Step 3: Enrich AI-selected sections with full DB details
    const matchedSections: MatchedSection[] = [];

    if (aiData?.applicable_sections) {
      for (const aiSec of aiData.applicable_sections) {
        const dbProv = dbMatches.find(
          (p) => p.section === aiSec.section && p.act_name === aiSec.act_name
        ) || dbMatches.find((p) => p.section === aiSec.section);

        if (dbProv) {
          matchedSections.push({
            _id: String(dbProv._id),
            act_name: dbProv.act_name,
            section: dbProv.section,
            title: dbProv.title,
            description: dbProv.description || '',
            plain_language: dbProv.plain_language || '',
            offense_category: dbProv.offense_category || '',
            punishment: dbProv.punishment || '',
            is_bailable: dbProv.is_bailable ?? false,
            is_cognizable: dbProv.is_cognizable ?? true,
            typical_evidence: dbProv.typical_evidence || [],
            why_applicable: aiSec.why_applicable,
            confidence: (aiSec.confidence as 'high' | 'medium' | 'low') || 'medium',
          });
        }
      }
    }

    // Fallback: if AI didn't match anything, use top DB matches
    if (matchedSections.length === 0 && topProvisions.length > 0) {
      topProvisions.slice(0, 3).forEach((p) => {
        matchedSections.push({
          _id: String(p._id),
          act_name: p.act_name,
          section: p.section,
          title: p.title,
          description: p.description || '',
          plain_language: p.plain_language || '',
          offense_category: p.offense_category || '',
          punishment: p.punishment || '',
          is_bailable: p.is_bailable ?? false,
          is_cognizable: p.is_cognizable ?? true,
          typical_evidence: p.typical_evidence || [],
          why_applicable: `Applicable based on the ${crime_type} nature of the offence.`,
          confidence: 'medium',
        });
      });
    }

    const result: CaseFilingAnalysis = {
      matched_sections: matchedSections,
      investigation_procedure: aiData?.investigation_procedure || defaultProcedure(crime_type),
      immediate_actions: aiData?.immediate_actions || defaultImmediateActions(),
      important_notes: aiData?.important_notes || [],
      court_jurisdiction: aiData?.court_jurisdiction || 'Magistrate Court having territorial jurisdiction.',
      arrest_powers: aiData?.arrest_powers || (
        matchedSections.some((s) => s.is_cognizable)
          ? 'COGNIZABLE offence — police CAN arrest without warrant (BNSS Section 35).'
          : 'NON-COGNIZABLE offence — requires magistrate warrant for arrest.'
      ),
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Case filing analysis failed', details: String(err) });
  }
});

// ─── GET /api/case-filing/provisions — search real sections ──────────────────

router.get('/provisions', async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, act, category } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { section: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { keywords: { $elemMatch: { $regex: q, $options: 'i' } } },
      { plain_language: { $regex: q, $options: 'i' } },
    ];
  }
  if (act) filter.act_name = { $regex: act, $options: 'i' };
  if (category) filter.offense_category = { $regex: category, $options: 'i' };

  const provisions = await LegalProvision.find(filter).limit(30).lean();
  res.json(provisions.map((p) => ({ ...p, id: p._id })));
});

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultProcedure = (crimeType: string): ProcedureStep[] => [
  { step: 1, title: 'Register FIR', description: `Register the First Information Report under the relevant BNS sections for ${crimeType}. FIR must be registered immediately — cannot be refused.`, timeline: 'Immediately', legal_reference: 'BNSS Section 173' },
  { step: 2, title: 'Inform Superior Officers', description: 'Inform the SHO, Circle Inspector, and DSP about the case. For serious offences, notify SP and Magistrate.', timeline: 'Within 1 hour', legal_reference: 'BNSS Section 174' },
  { step: 3, title: 'Preserve Crime Scene', description: 'Immediately cordon off and preserve the crime scene. Prevent tampering of evidence. Photograph and videograph the scene.', timeline: 'Within 1-2 hours', legal_reference: 'BNSS Section 176' },
  { step: 4, title: 'Collect Evidence', description: 'Collect all physical evidence with proper labelling and seizure memos. Prepare detailed panchnama with independent witnesses.', timeline: 'Within 6 hours', legal_reference: 'BNSS Section 185' },
  { step: 5, title: 'Record Victim/Witness Statements', description: 'Record statements under BNSS Section 180. For sexual offences, statement must be recorded by woman officer.', timeline: 'Within 24 hours', legal_reference: 'BNSS Section 180' },
  { step: 6, title: 'Medical Examination', description: 'Get victim and accused medically examined. For rape/sexual assault cases — within 24 hours is mandatory.', timeline: 'Within 24 hours', legal_reference: 'BNSS Section 184' },
  { step: 7, title: 'Arrest and Produce Before Magistrate', description: 'If cognizable offence, arrest without warrant. Produce arrested person before nearest magistrate within 24 hours of arrest.', timeline: 'Within 24 hours of arrest', legal_reference: 'BNSS Section 35, Article 22 Constitution' },
  { step: 8, title: 'Send Evidence to FSL', description: 'Send collected physical/digital evidence to Forensic Science Laboratory for scientific examination.', timeline: 'Within 3 days', legal_reference: 'BNSS Section 189' },
  { step: 9, title: 'File Charge Sheet', description: 'Complete investigation and file charge sheet (challan) before the competent court within the prescribed time limit.', timeline: 'Within 60-90 days', legal_reference: 'BNSS Section 193' },
];

const defaultImmediateActions = (): string[] => [
  'Register FIR immediately — rejection of FIR is punishable under BNSS',
  'Preserve and secure the crime scene — prevent contamination',
  'Inform senior officers (SHO / Circle Inspector)',
  'Record victim\'s preliminary statement',
  'Arrange medical examination for victim if injured',
  'Issue look-out notice if accused is identified and likely to flee',
  'Collect CCTV footage from surrounding areas before it is overwritten',
  'Document all evidence with photographs before collection',
];

export default router;
