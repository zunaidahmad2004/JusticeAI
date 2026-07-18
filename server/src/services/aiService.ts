/**
 * aiService.ts — JusticeAI Gemini 2.5 Flash integration
 * NO mock mode. NO fallbacks. Real Gemini API only.
 *
 * Auth priority (auto-detected at startup):
 *   1. GEMINI_API_KEY env var  (AIzaSy... format)
 *   2. GEMINI_CREDENTIALS_B64  (base64 service account JSON)
 *   3. gemini-credentials.json on disk
 *
 * If no credentials: throws a clear error — never returns fake data.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface FIRAnalysis {
  summary: string;
  people: string[];
  places: string[];
  dates: string[];
  timeline: Array<{ date: string; event: string }>;
  key_facts: string[];
  missing_information: string[];
  offense_categories: string[];
  confidence: number;
}

export interface EntityExtraction {
  people: string[];
  places: string[];
  dates: string[];
  organizations: string[];
  phone_numbers: string[];
  vehicles: string[];
  weapons: string[];
}

export interface ChecklistItem {
  id: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  completed: boolean;
}

export interface LegalProvisionSuggestion {
  section: string;
  act_name: string;
  title: string;
  plain_language: string;
  why_applicable: string;
  confidence: number;
  typical_evidence: string[];
}

export interface MissingEvidenceItem {
  item: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  collection_method: string;
}

export interface RiskItem {
  category: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvidenceAnalysis {
  summary: string;
  key_observations: string[];
  extracted_text?: string;
  persons_identified: string[];
  dates_mentioned: string[];
  locations_mentioned: string[];
  inconsistencies: string[];
  missing_details: string[];
  suggested_next_steps: string[];
  relevance_score: number;
  evidence_type_assessment: string;
}

export interface InvestigationRiskReport {
  overall_score: number;
  status: 'strong' | 'adequate' | 'weak' | 'critical';
  risks: RiskItem[];
  missing_evidence: MissingEvidenceItem[];
  completed_steps: string[];
  pending_steps: string[];
  recommendations: string[];
  court_readiness: string;
  estimated_completion: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GEMINI_MODEL    = 'gemini-2.5-flash';
const GEMINI_BASE     = 'https://generativelanguage.googleapis.com/v1beta';

// ─── Auth ─────────────────────────────────────────────────────────────────────

type AuthMode = 'api_key' | 'service_account';

interface Auth {
  mode: AuthMode;
  apiKey?: string;
  credPath?: string;
}

let _auth: Auth | null = null;

function resolveAuth(): Auth {
  if (_auth) return _auth;

  // 1. Plain API key (AIzaSy...)
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (key && key.length > 10) {
    _auth = { mode: 'api_key', apiKey: key };
    logger.info(`Gemini: api-key auth (${key.substring(0, 8)}...)`);
    return _auth;
  }

  // 2. Base64 service account from env (set this in Render dashboard)
  const b64 = (process.env.GEMINI_CREDENTIALS_B64 || '').trim();
  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      const parsed  = JSON.parse(decoded) as { type?: string; client_email?: string };
      if (parsed.type === 'service_account') {
        const tmp = path.resolve(process.cwd(), '.gemini-sa.json');
        fs.writeFileSync(tmp, decoded, 'utf8');
        _auth = { mode: 'service_account', credPath: tmp };
        logger.info(`Gemini: service-account from env (${parsed.client_email})`);
        return _auth;
      }
    } catch {
      logger.warn('Gemini: GEMINI_CREDENTIALS_B64 invalid, skipping');
    }
  }

  // 3. Service account JSON file on disk
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'gemini-credentials.json'),
    path.resolve(process.cwd(), 'service-account.json'),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf8')) as { type?: string; client_email?: string };
        if (parsed.type === 'service_account') {
          _auth = { mode: 'service_account', credPath: p };
          logger.info(`Gemini: service-account from file (${parsed.client_email})`);
          return _auth;
        }
      } catch { /* skip */ }
    }
  }

  throw new Error(
    'Gemini credentials not configured. ' +
    'Set GEMINI_API_KEY or GEMINI_CREDENTIALS_B64 environment variable on Render.'
  );
}

export function getAIStatus(): string {
  try {
    const auth = resolveAuth();
    return auth.mode === 'api_key'
      ? `${GEMINI_MODEL} (api-key)`
      : `${GEMINI_MODEL} (service-account)`;
  } catch {
    return 'not-configured';
  }
}

// ─── Service account OAuth2 token ────────────────────────────────────────────

interface TokenCache { token: string; expiresAt: number; }
let _tokenCache: TokenCache | null = null;

async function getServiceAccountToken(credPath: string): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 60_000) {
    return _tokenCache.token;
  }

  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8')) as {
    client_email: string;
    private_key: string;
  };

  const now     = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss:   creds.client_email,
    scope: 'https://www.googleapis.com/auth/generative-language',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(creds.private_key.replace(/\\n/g, '\n'), 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OAuth2 token exchange failed (${resp.status}): ${err.substring(0, 200)}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  _tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return _tokenCache.token;
}

// ─── Build request headers ────────────────────────────────────────────────────

interface ReqMeta { url: string; headers: Record<string, string>; }

async function buildRequest(endpoint: string, stream = false): Promise<ReqMeta> {
  const auth    = resolveAuth();
  const suffix  = stream ? ':streamGenerateContent?alt=sse' : ':generateContent';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth.mode === 'api_key') {
    const sep = stream ? '&' : '?';
    const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}${suffix}${stream ? '' : '?key=' + auth.apiKey}`;
    return {
      url: stream
        ? `${GEMINI_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?key=${auth.apiKey}&alt=sse`
        : `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${auth.apiKey}`,
      headers,
    };
  }

  // service_account
  const token = await getServiceAccountToken(auth.credPath!);
  headers['Authorization'] = `Bearer ${token}`;
  return {
    url: stream
      ? `${GEMINI_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`
      : `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent`,
    headers,
  };
}

// ─── Core REST call ───────────────────────────────────────────────────────────

interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>;
}

interface GenConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
}

async function callGemini(contents: GeminiContent[], config?: GenConfig): Promise<string> {
  const { url, headers } = await buildRequest('', false);

  const body = {
    contents,
    generationConfig: {
      temperature:      config?.temperature      ?? 0.4,
      maxOutputTokens:  config?.maxOutputTokens  ?? 8192,
      topP:             config?.topP             ?? 0.9,
    },
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

  if (!resp.ok) {
    const errText = await resp.text();
    // Reset auth cache on auth errors so next call re-detects
    if (resp.status === 401 || resp.status === 403) {
      _auth = null;
      _tokenCache = null;
    }
    throw new Error(`Gemini API error ${resp.status}: ${errText.substring(0, 300)}`);
  }

  const data = await resp.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// ─── Streaming call ───────────────────────────────────────────────────────────

export async function callGeminiStream(
  contents: GeminiContent[],
  onChunk: (text: string) => void
): Promise<void> {
  const { url, headers } = await buildRequest('', true);

  const body = {
    contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 8192, topP: 0.9 },
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

  if (!resp.ok || !resp.body) {
    const err = await resp.text();
    throw new Error(`Gemini stream error ${resp.status}: ${err.substring(0, 300)}`);
  }

  const reader  = resp.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;
      try {
        const parsed = JSON.parse(raw) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) onChunk(chunk);
      } catch { /* skip malformed SSE */ }
    }
  }
}

// ─── callLLM — single prompt ──────────────────────────────────────────────────

export async function callLLM(prompt: string, config?: GenConfig): Promise<string> {
  return callGemini(
    [{ role: 'user', parts: [{ text: prompt }] }],
    { temperature: 0.3, maxOutputTokens: 4096, topP: 0.95, ...config }
  );
}

// ─── Multi-turn chat with system context ──────────────────────────────────────

export async function chatWithHistory(
  systemContext: string,
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  const contents: GeminiContent[] = [];

  // Gemini has no system role — embed system context in first user turn
  if (history.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: `${systemContext}\n\n---\n\nUser: ${newMessage}` }],
    });
  } else {
    const [first, ...rest] = history;
    contents.push({
      role: 'user',
      parts: [{ text: `${systemContext}\n\n---\n\nUser: ${first.content}` }],
    });
    for (const msg of rest) {
      contents.push({
        role:  msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: newMessage }] });
  }

  return callGemini(contents, { temperature: 0.4, maxOutputTokens: 8192, topP: 0.9 });
}

// ─── JSON helper ──────────────────────────────────────────────────────────────

function extractJSON<T>(text: string, isArray = false): T | null {
  try {
    const s = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(s) as T; } catch { /* fall through */ }
    const m = s.match(isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) as T : null;
  } catch { return null; }
}

// ─── Feature functions — all real Gemini, no fallbacks ───────────────────────

export async function analyzeDocument(text: string, _type: string): Promise<FIRAnalysis> {
  const prompt = `You are a senior criminal investigator and legal analyst.
Analyze the following FIR/complaint document and extract structured information.

Document:
"""
${text}
"""

Return ONLY valid JSON — no markdown, no explanation:
{
  "summary": "2-3 sentence summary",
  "people": ["person names mentioned"],
  "places": ["locations mentioned"],
  "dates": ["dates and times mentioned"],
  "timeline": [{"date": "date/time", "event": "what happened"}],
  "key_facts": ["important facts"],
  "missing_information": ["unclear or absent legally important info"],
  "offense_categories": ["potential criminal offenses"],
  "confidence": 0.85
}`;

  const response = await callLLM(prompt);
  const parsed   = extractJSON<FIRAnalysis>(response);
  if (!parsed) throw new Error('Failed to parse FIR analysis from Gemini response');
  return parsed;
}

export async function extractEntities(text: string): Promise<EntityExtraction> {
  const prompt = `Extract all named entities from this legal/investigative text.
Text: """${text}"""
Return ONLY valid JSON:
{"people":[],"places":[],"dates":[],"organizations":[],"phone_numbers":[],"vehicles":[],"weapons":[]}`;

  const response = await callLLM(prompt);
  const parsed   = extractJSON<EntityExtraction>(response);
  if (!parsed) throw new Error('Failed to parse entity extraction');
  return parsed;
}

export async function generateChecklist(crimeType: string, description?: string): Promise<ChecklistItem[]> {
  const prompt = `You are a senior police investigator. Generate a thorough investigation checklist for a "${crimeType}" case.
${description ? `Case context: ${description}` : ''}
Return ONLY a valid JSON array of 12-15 items:
[{"id":"1","task":"action","priority":"high","category":"Scene Investigation","completed":false}]
Priority must be "high", "medium", or "low" only.`;

  const response = await callLLM(prompt);
  const parsed   = extractJSON<ChecklistItem[]>(response, true);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Failed to generate investigation checklist');
  }
  return parsed.map((item, i) => ({
    id:        String(item.id ?? i + 1),
    task:      item.task ?? 'Task not specified',
    priority:  (['high', 'medium', 'low'] as const).includes(item.priority) ? item.priority : 'medium',
    category:  item.category ?? 'General',
    completed: false,
  }));
}

export async function recommendProvisions(
  caseDescription: string,
  crimeType?: string,
  facts?: unknown
): Promise<LegalProvisionSuggestion[]> {
  const prompt = `You are an expert in Indian criminal law (BNS 2023, BNSS 2023, BSA 2023, IT Act, POCSO).
Suggest relevant legal provisions for this case.
Crime Type: ${crimeType || 'Not specified'}
Description: ${caseDescription}
Facts: ${facts ? JSON.stringify(facts) : 'Not provided'}
Return ONLY a valid JSON array of up to 6 provisions:
[{"section":"103","act_name":"Bharatiya Nyaya Sanhita 2023","title":"...","plain_language":"...","why_applicable":"...","confidence":0.85,"typical_evidence":["..."]}]`;

  const response = await callLLM(prompt);
  const parsed   = extractJSON<LegalProvisionSuggestion[]>(response, true);
  if (!parsed || !Array.isArray(parsed)) throw new Error('Failed to generate legal provisions');
  return parsed;
}

export async function detectMissingEvidence(
  crimeType: string,
  caseTitle: string,
  existingEvidence: string[]
): Promise<MissingEvidenceItem[]> {
  const prompt = `You are an experienced police investigator reviewing a ${crimeType} case titled "${caseTitle}".
Evidence already collected: ${existingEvidence.length > 0 ? existingEvidence.join(', ') : 'None yet'}
Identify typically required evidence that is likely missing.
Return ONLY a valid JSON array of 5-8 items:
[{"item":"name","priority":"high","reason":"why critical for prosecution","collection_method":"how to obtain"}]`;

  const response = await callLLM(prompt);
  const parsed   = extractJSON<MissingEvidenceItem[]>(response, true);
  if (!parsed || !Array.isArray(parsed)) throw new Error('Failed to detect missing evidence');
  return parsed;
}

export async function analyzeRisk(
  caseData: Record<string, unknown>,
  evidenceCount: number,
  witnessCount: number,
  documentStatuses: string[]
): Promise<{ risks: RiskItem[]; completeness: number }> {
  const risks: RiskItem[] = [];
  if (evidenceCount === 0) risks.push({ category: 'Evidence',       issue: 'No evidence uploaded',               severity: 'high'   });
  if (witnessCount === 0)  risks.push({ category: 'Witnesses',      issue: 'No witnesses recorded',              severity: 'high'   });
  if (!caseData.fir_number)    risks.push({ category: 'Documentation', issue: 'FIR number not recorded',         severity: 'medium' });
  if (!caseData.incident_date) risks.push({ category: 'Documentation', issue: 'Incident date not recorded',      severity: 'medium' });
  if (!caseData.assigned_io)   risks.push({ category: 'Assignment',    issue: 'No investigating officer assigned',severity: 'high'   });
  if (caseData.status === 'chargesheet_filed' && !documentStatuses.includes('approved'))
    risks.push({ category: 'Documentation', issue: 'Chargesheet filed but no approved document', severity: 'high' });

  const highCount = risks.filter(r => r.severity === 'high').length;
  const medCount  = risks.filter(r => r.severity === 'medium').length;
  return { risks, completeness: Math.max(0, 100 - highCount * 20 - medCount * 10) };
}

export async function generateDocument(
  documentType: string,
  caseContext: Record<string, unknown>
): Promise<string> {
  const descriptions: Record<string, string> = {
    chargesheet:        'a formal police chargesheet for court submission under BNSS 2023. Include case details, accused, victims, witnesses, evidence, applicable BNS sections, factual narrative. Mark as DRAFT.',
    summary:            'a concise investigation summary covering key findings, persons involved, evidence collected, and current status.',
    diary:              `a case diary entry for ${new Date().toLocaleDateString('en-IN')} describing today's investigation activities.`,
    evidence_inventory: 'a detailed evidence inventory with item numbers, descriptions, types, collection dates, locations, and status.',
    witness_summary:    'a structured summary of all witness statements highlighting key observations and discrepancies.',
  };

  const prompt = `You are an expert Indian police documentation officer.
Generate ${descriptions[documentType] || 'a professional case document'} for the following case.

Case Data:
${JSON.stringify(caseContext, null, 2)}

Use formal legal language with clear section headings.
End with: "⚠ DISCLAIMER: AI-generated draft — must be reviewed and approved by authorized officers before official use."`;

  return callLLM(prompt, { temperature: 0.3, maxOutputTokens: 6000 });
}

export async function analyzeEvidence(
  evidenceTitle: string,
  evidenceType: string,
  description: string,
  base64Data?: string,
  mimeType?: string
): Promise<EvidenceAnalysis> {
  const { url, headers } = await buildRequest('', false);

  const textPrompt = `You are an expert forensic analyst.
Analyze this evidence for a criminal investigation.
Title: "${evidenceTitle}" | Type: ${evidenceType}
Description: ${description}
Return ONLY valid JSON:
{
  "summary": "2-3 sentence forensic summary",
  "key_observations": [],
  "extracted_text": null,
  "persons_identified": [],
  "dates_mentioned": [],
  "locations_mentioned": [],
  "inconsistencies": [],
  "missing_details": [],
  "suggested_next_steps": [],
  "relevance_score": 0.8,
  "evidence_type_assessment": "assessment and court admissibility"
}`;

  let contents: GeminiContent[];
  if (base64Data && mimeType) {
    contents = [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Data } } as { inline_data: { mime_type: string; data: string } },
        { text: textPrompt },
      ],
    }];
  } else {
    contents = [{ role: 'user', parts: [{ text: textPrompt }] }];
  }

  const body = { contents, generationConfig: { temperature: 0.3, maxOutputTokens: 4096 } };
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Evidence analysis failed ${resp.status}: ${err.substring(0, 200)}`);
  }
  const data    = await resp.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text    = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed  = extractJSON<EvidenceAnalysis>(text);
  if (!parsed) throw new Error('Failed to parse evidence analysis');
  return parsed;
}

export async function extractTextFromFile(base64Data: string, mimeType: string): Promise<string> {
  const { url, headers } = await buildRequest('', false);
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Data } },
        { text: 'Extract ALL text from this document exactly as it appears. Output ONLY the extracted text — no commentary.' },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OCR failed ${resp.status}: ${err.substring(0, 200)}`);
  }
  const data = await resp.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function generateRiskReport(
  caseData: Record<string, unknown>,
  evidenceCount: number,
  witnessCount: number,
  suspectCount: number,
  victimCount: number,
  documentStatuses: string[],
  crimeType: string,
  existingEvidence: string[]
): Promise<InvestigationRiskReport> {
  const { risks, completeness: score } = await analyzeRisk(caseData, evidenceCount, witnessCount, documentStatuses);

  const completedSteps: string[] = [];
  const pendingSteps:   string[] = [];
  if (evidenceCount > 0) completedSteps.push(`${evidenceCount} evidence items collected`);
  else pendingSteps.push('Collect physical and digital evidence');
  if (witnessCount > 0) completedSteps.push(`${witnessCount} witness statement(s) recorded`);
  else pendingSteps.push('Record witness statements');
  if (suspectCount > 0) completedSteps.push(`${suspectCount} suspect(s) identified`);
  else pendingSteps.push('Identify and profile suspects');
  if (victimCount > 0) completedSteps.push(`${victimCount} victim profile(s) recorded`);
  if (caseData.fir_number) completedSteps.push('FIR registered');

  let status: InvestigationRiskReport['status'] = 'strong';
  if (score < 40) status = 'critical';
  else if (score < 60) status = 'weak';
  else if (score < 80) status = 'adequate';

  const prompt = `You are a senior criminal investigator reviewing this ${crimeType} case.
Score: ${score}% | Evidence: ${existingEvidence.join(', ') || 'None'} | Witnesses: ${witnessCount} | Suspects: ${suspectCount}
Risks: ${risks.map(r => r.issue).join(', ') || 'None'}

Return ONLY valid JSON:
{
  "missing_evidence": [{"item":"","priority":"high","reason":"","collection_method":""}],
  "recommendations": ["recommendation 1"],
  "court_readiness": "paragraph on court readiness"
}
Limit to 5 missing evidence items and 5 recommendations.`;

  const response = await callLLM(prompt);
  const ai = extractJSON<{ missing_evidence: MissingEvidenceItem[]; recommendations: string[]; court_readiness: string }>(response);

  return {
    overall_score:        score,
    status,
    risks,
    missing_evidence:     ai?.missing_evidence    || [],
    completed_steps:      completedSteps,
    pending_steps:        pendingSteps,
    recommendations:      ai?.recommendations     || [],
    court_readiness:      ai?.court_readiness     || 'Unable to assess court readiness.',
    estimated_completion: score >= 80 ? 'Ready for chargesheet review' :
                          score >= 60 ? 'Needs 1-2 weeks of investigation' :
                          'Significant investigation work remaining',
  };
}
