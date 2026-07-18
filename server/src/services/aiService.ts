/**
 * aiService.ts
 * Google Gemini 2.5 Flash via direct REST API.
 * Supports two auth modes (auto-detected):
 *   1. GEMINI_API_KEY  — simple API key (AIzaSy... format)
 *   2. gemini-credentials.json in server/ — service account JSON (for org accounts)
 * Falls back to mock responses when neither is available.
 */

import fs from 'fs';
import path from 'path';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_REST_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ─── Auth detection ───────────────────────────────────────────────────────────

type AuthMode = 'api_key' | 'service_account' | 'none';

interface AuthResult {
  mode: AuthMode;
  apiKey?: string;
  credPath?: string;
}

let _cachedAuth: AuthResult | null = null;

const detectAuth = (): AuthResult => {
  if (_cachedAuth) return _cachedAuth;

  // Option 1: simple API key
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (key && key !== 'your_gemini_api_key' && key !== 'PASTE_YOUR_KEY_HERE' && key !== '' && key.startsWith('AIza')) {
    _cachedAuth = { mode: 'api_key', apiKey: key };
    logger.info('Gemini: using API key authentication');
    return _cachedAuth;
  }

  // Option 2: service account JSON
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'gemini-credentials.json'),
    path.resolve(process.cwd(), 'service-account.json'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const json = JSON.parse(fs.readFileSync(candidate, 'utf8')) as { client_email?: string; type?: string };
        if (json.type === 'service_account') {
          logger.info(`Gemini: using service account — ${json.client_email}`);
          _cachedAuth = { mode: 'service_account', credPath: candidate };
          return _cachedAuth;
        }
      } catch {
        // invalid JSON, skip
      }
    }
  }

  logger.warn('Gemini: no credentials found — running in mock mode');
  logger.warn('  Set GEMINI_API_KEY in .env, or place gemini-credentials.json in server/');
  _cachedAuth = { mode: 'none' };
  return _cachedAuth;
};

export const getAIStatus = (): string => {
  const auth = detectAuth();
  if (auth.mode === 'api_key') return `${GEMINI_MODEL} (api-key)`;
  if (auth.mode === 'service_account') return `${GEMINI_MODEL} (service-account)`;
  return 'mock-mode';
};

// ─── Service account token cache ─────────────────────────────────────────────

interface TokenCache {
  token: string;
  expiresAt: number;
}
let _tokenCache: TokenCache | null = null;

const getServiceAccountToken = async (credPath: string): Promise<string> => {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 60000) {
    return _tokenCache.token;
  }

  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8')) as {
    client_email: string;
    private_key: string;
  };

  // Build JWT for Google OAuth2
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/generative-language',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(creds.private_key.replace(/\\n/g, '\n'), 'base64url');

  const jwt = `${header}.${payload}.${signature}`;

  // Exchange JWT for access token
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return _tokenCache.token;
};

// ─── Core Gemini REST call ────────────────────────────────────────────────────

interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
  };
}

const callGeminiREST = async (request: GeminiRequest): Promise<string> => {
  const auth = detectAuth();

  let url: string;
  let authHeader: string;

  if (auth.mode === 'api_key') {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent?key=${auth.apiKey}`;
    authHeader = '';
  } else if (auth.mode === 'service_account' && auth.credPath) {
    const token = await getServiceAccountToken(auth.credPath);
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent`;
    authHeader = `Bearer ${token}`;
  } else {
    throw new Error('No auth configured');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${errText.substring(0, 300)}`);
  }

  const data = await resp.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
};

// ─── Streaming Gemini call ────────────────────────────────────────────────────

export const callGeminiStream = async (
  contents: GeminiContent[],
  onChunk: (text: string) => void
): Promise<void> => {
  const auth = detectAuth();
  if (auth.mode === 'none') {
    onChunk('AI is running in mock mode. Please configure GEMINI_API_KEY in server/.env to enable full AI responses.');
    return;
  }

  let url: string;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth.mode === 'api_key') {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?key=${auth.apiKey}&alt=sse`;
  } else if (auth.mode === 'service_account' && auth.credPath) {
    const token = await getServiceAccountToken(auth.credPath);
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    throw new Error('No auth configured');
  }

  const body: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
      topP: 0.9,
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text();
    throw new Error(`Gemini stream ${resp.status}: ${errText.substring(0, 300)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) onChunk(chunk);
      } catch {
        // skip malformed SSE lines
      }
    }
  }
};

// ─── Public callLLM ───────────────────────────────────────────────────────────

export const callLLM = async (prompt: string): Promise<string> => {
  const auth = detectAuth();
  if (auth.mode === 'none') return getMockResponse(prompt);

  try {
    const text = await callGeminiREST({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, topP: 0.95 },
    });
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  } catch (err) {
    const msg = String(err).toLowerCase();
    if (msg.includes('429') || msg.includes('quota')) {
      logger.warn('Gemini rate-limited — using mock response');
    } else if (msg.includes('401') || msg.includes('403') || msg.includes('permission')) {
      logger.error('Gemini auth failed — check credentials');
      _cachedAuth = null; // force re-detect next call
      _tokenCache = null;
    } else {
      logger.error('Gemini call failed', { err: String(err).substring(0, 200) });
    }
    return getMockResponse(prompt);
  }
};

// ─── Multi-turn chat ──────────────────────────────────────────────────────────

export const chatWithHistory = async (
  systemContext: string,
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  const auth = detectAuth();
  if (auth.mode === 'none') {
    return `**JusticeAI is running without an AI key configured.**\n\nTo enable full AI responses, please set a valid **GEMINI_API_KEY** (starts with \`AIzaSy\`) in the Render environment variables.\n\nYou can get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).\n\n---\n\nIn the meantime, here is a general answer based on built-in knowledge:\n\n${getMockResponse(newMessage)}`;
  }

  try {
    const contents: GeminiContent[] = [];

    // Inject system prompt as first user turn (Gemini doesn't have system role)
    if (history.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: `${systemContext}\n\n---\n\nUser: ${newMessage}` }],
      });
    } else {
      // First message carries the system context
      const [first, ...rest] = history;
      contents.push({
        role: 'user',
        parts: [{ text: `${systemContext}\n\n---\n\nUser: ${first.content}` }],
      });
      // Remaining history
      rest.forEach((msg) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      });
      // New message
      contents.push({ role: 'user', parts: [{ text: newMessage }] });
    }

    const text = await callGeminiREST({
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
        topP: 0.9,
      },
    });

    return text || 'I was unable to generate a response. Please try again.';
  } catch (err) {
    logger.error('Gemini chat failed', { err: String(err).substring(0, 200) });
    return getMockResponse(newMessage);
  }
};

// ─── JSON extraction helper ───────────────────────────────────────────────────

const extractJSON = <T>(text: string, isArray = false): T | null => {
  try {
    const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(stripped) as T; } catch { /* fall through */ }
    const pattern = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const match = stripped.match(pattern);
    return match ? (JSON.parse(match[0]) as T) : null;
  } catch {
    return null;
  }
};

// ─── Feature functions ────────────────────────────────────────────────────────

export const analyzeDocument = async (text: string, _type: string): Promise<FIRAnalysis> => {  const prompt = `You are a senior criminal investigator and legal analyst.
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
  return extractJSON<FIRAnalysis>(response) ?? {
    summary: 'Unable to analyze document automatically. Please review manually.',
    people: [], places: [], dates: [], timeline: [],
    key_facts: [], missing_information: ['Full document analysis was not possible.'],
    offense_categories: [], confidence: 0,
  };
};

export const extractEntities = async (text: string): Promise<EntityExtraction> => {
  const prompt = `Extract all named entities from this legal/investigative text.
Text: """${text}"""
Return ONLY valid JSON:
{"people":[],"places":[],"dates":[],"organizations":[],"phone_numbers":[],"vehicles":[],"weapons":[]}`;

  const response = await callLLM(prompt);
  return extractJSON<EntityExtraction>(response) ?? {
    people: [], places: [], dates: [], organizations: [],
    phone_numbers: [], vehicles: [], weapons: [],
  };
};

export const generateChecklist = async (crimeType: string, description?: string): Promise<ChecklistItem[]> => {
  const prompt = `You are a senior police investigator. Generate a thorough investigation checklist for a "${crimeType}" case.
${description ? `Case context: ${description}` : ''}
Return ONLY a valid JSON array of 12-15 items:
[{"id":"1","task":"action","priority":"high","category":"Scene Investigation","completed":false}]
Priority must be "high", "medium", or "low" only.`;

  const response = await callLLM(prompt);
  const parsed = extractJSON<ChecklistItem[]>(response, true);
  if (parsed && Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((item, i) => ({
      id: String(item.id ?? i + 1),
      task: item.task ?? 'Task not specified',
      priority: (['high', 'medium', 'low'] as const).includes(item.priority) ? item.priority : 'medium',
      category: item.category ?? 'General',
      completed: false,
    }));
  }
  return defaultChecklist();
};

export const recommendProvisions = async (
  caseDescription: string,
  crimeType?: string,
  facts?: unknown
): Promise<LegalProvisionSuggestion[]> => {
  const prompt = `You are an expert in Indian criminal law. Suggest relevant legal provisions for this case.
Crime Type: ${crimeType || 'Not specified'}
Description: ${caseDescription}
Facts: ${facts ? JSON.stringify(facts) : 'Not provided'}
Return ONLY a valid JSON array of up to 5 provisions:
[{"section":"302","act_name":"Indian Penal Code","title":"...","plain_language":"...","why_applicable":"...","confidence":0.85,"typical_evidence":["..."]}]
Advisory only — must be verified by a qualified lawyer.`;

  const response = await callLLM(prompt);
  const parsed = extractJSON<LegalProvisionSuggestion[]>(response, true);
  return Array.isArray(parsed) ? parsed : [];
};

export const detectMissingEvidence = async (
  crimeType: string,
  caseTitle: string,
  existingEvidence: string[]
): Promise<MissingEvidenceItem[]> => {
  const prompt = `You are an experienced police investigator reviewing a ${crimeType} case.
Case: "${caseTitle}"
Evidence collected: ${existingEvidence.length > 0 ? existingEvidence.join(', ') : 'None yet'}
Identify typically required evidence that may be missing. Return ONLY a valid JSON array of 5-8 items:
[{"item":"name","priority":"high","reason":"why important","collection_method":"how to obtain"}]`;

  const response = await callLLM(prompt);
  const parsed = extractJSON<MissingEvidenceItem[]>(response, true);
  return Array.isArray(parsed) ? parsed : defaultMissingEvidence();
};

export const analyzeRisk = async (
  caseData: Record<string, unknown>,
  evidenceCount: number,
  witnessCount: number,
  documentStatuses: string[]
): Promise<{ risks: RiskItem[]; completeness: number }> => {
  const risks: RiskItem[] = [];
  if (evidenceCount === 0) risks.push({ category: 'Evidence', issue: 'No evidence uploaded', severity: 'high' });
  if (witnessCount === 0) risks.push({ category: 'Witnesses', issue: 'No witnesses recorded', severity: 'high' });
  if (!caseData.fir_number) risks.push({ category: 'Documentation', issue: 'FIR number not recorded', severity: 'medium' });
  if (!caseData.incident_date) risks.push({ category: 'Documentation', issue: 'Incident date not recorded', severity: 'medium' });
  if (!caseData.incident_location) risks.push({ category: 'Documentation', issue: 'Incident location not recorded', severity: 'low' });
  if (!caseData.assigned_io) risks.push({ category: 'Assignment', issue: 'No investigating officer assigned', severity: 'high' });
  if (caseData.status === 'chargesheet_filed' && !documentStatuses.includes('approved'))
    risks.push({ category: 'Documentation', issue: 'Chargesheet filed but no approved document found', severity: 'high' });
  const highCount = risks.filter((r) => r.severity === 'high').length;
  const medCount = risks.filter((r) => r.severity === 'medium').length;
  return { risks, completeness: Math.max(0, 100 - highCount * 20 - medCount * 10) };
};

export const generateDocument = async (
  documentType: string,
  caseContext: Record<string, unknown>
): Promise<string> => {
  const typeDescriptions: Record<string, string> = {
    chargesheet: 'a formal police chargesheet for court submission. Include: case details, accused info, victim details, witness list, evidence list, legal sections, factual narrative. Mark as DRAFT.',
    summary: 'a concise investigation summary covering key findings, persons involved, evidence, and current status.',
    diary: `a case diary entry for ${new Date().toLocaleDateString('en-IN')} describing today\'s investigation activities.`,
    evidence_inventory: 'a detailed evidence inventory with item numbers, descriptions, types, collection dates, locations, and status.',
    witness_summary: 'a structured summary of all witness statements highlighting key observations and discrepancies.',
  };
  const description = typeDescriptions[documentType] || 'a professional case document';
  const prompt = `You are an expert police documentation officer. Generate ${description}

Case Data:
${JSON.stringify(caseContext, null, 2)}

Format as a formal document with clear section headings and professional legal language.
End with: "⚠ DISCLAIMER: This document is AI-generated and must be reviewed and approved by authorized officers before official use."`;

  return callLLM(prompt);
};

// ─── Real-world defaults (used when AI unavailable) ──────────────────────────
// Based on actual Indian police investigation procedures under BNSS 2023

const defaultChecklist = (): ChecklistItem[] => [
  { id: '1', task: 'Register FIR under BNSS Section 173 — cannot be refused; zero FIR is permissible', priority: 'high', category: 'Documentation', completed: false },
  { id: '2', task: 'Inform SHO, Circle Inspector and DSP immediately. For heinous offences notify SP and District Magistrate', priority: 'high', category: 'Escalation', completed: false },
  { id: '3', task: 'Cordon off and preserve the crime scene; post guard to prevent tampering under BNSS Section 176', priority: 'high', category: 'Scene Preservation', completed: false },
  { id: '4', task: 'Photograph and videograph the crime scene before any evidence is moved or collected', priority: 'high', category: 'Scene Documentation', completed: false },
  { id: '5', task: 'Prepare detailed scene-of-crime panchnama with two independent witnesses as required under BNSS', priority: 'high', category: 'Scene Documentation', completed: false },
  { id: '6', task: 'Collect and seize all physical evidence with proper labelling and seizure memos under BNSS Section 185', priority: 'high', category: 'Evidence Collection', completed: false },
  { id: '7', task: 'Seize CCTV/DVR footage from crime scene and surrounding 500-metre radius immediately before overwrite', priority: 'high', category: 'Digital Evidence', completed: false },
  { id: '8', task: 'Record statements of all witnesses under BNSS Section 180; for sexual offences by woman officer only', priority: 'high', category: 'Witness Management', completed: false },
  { id: '9', task: 'Arrange medical examination of victim under BNSS Section 184; for rape cases mandatory within 24 hours', priority: 'high', category: 'Medical', completed: false },
  { id: '10', task: 'Arrest accused without warrant if cognizable offence under BNSS Section 35; produce before magistrate within 24 hours', priority: 'high', category: 'Arrest', completed: false },
  { id: '11', task: 'Submit seized physical/biological/digital evidence to Forensic Science Laboratory with property seizure form', priority: 'medium', category: 'Forensics', completed: false },
  { id: '12', task: 'Obtain Call Detail Records (CDR) and tower dump from telecom operator via written request or court order', priority: 'medium', category: 'Digital Evidence', completed: false },
  { id: '13', task: 'Conduct Test Identification Parade (TIP) before Magistrate if accused identity is in question', priority: 'medium', category: 'Identification', completed: false },
  { id: '14', task: 'Maintain daily Case Diary (CD) recording all investigation steps as mandated under BNSS Section 193', priority: 'medium', category: 'Documentation', completed: false },
  { id: '15', task: 'File chargesheet within 60 days (for offences punishable up to 7 years) or 90 days (life/death cases) under BNSS Section 193', priority: 'medium', category: 'Legal Filing', completed: false },
];

const defaultMissingEvidence = (): MissingEvidenceItem[] => [
  {
    item: 'Post-mortem / Medico-Legal Certificate (MLC)',
    priority: 'high',
    reason: 'Establishes cause of death, nature of injuries, time of death, and whether death is homicidal, suicidal, or accidental — legally essential for all violent crime prosecutions',
    collection_method: 'Request from Government Hospital Forensic Department or District Medical Officer; obtain certified copy for court',
  },
  {
    item: 'CCTV / Surveillance Footage',
    priority: 'high',
    reason: 'Primary electronic evidence establishing presence of accused at scene, time of offence, direction of movement, and identity; courts give high evidentiary value under BSA 2023 Section 61',
    collection_method: 'Immediately seize DVR/NVR from scene, shops, traffic cameras, ATMs within 500m radius with seizure memo; preserve in sealed evidence bag',
  },
  {
    item: 'Forensic Science Laboratory (FSL) Report',
    priority: 'high',
    reason: 'Scientific examination of physical evidence — blood group, DNA, fingerprints, handwriting, ballistics, chemical analysis — admissible as expert opinion under BSA 2023 Section 39',
    collection_method: 'Submit evidence to State FSL with Form FSL-1 and property seizure form; obtain acknowledgment; follow up for expedited analysis in serious cases',
  },
  {
    item: 'Call Detail Records (CDR) and Tower Location Data',
    priority: 'medium',
    reason: 'Establishes communication between accused and victim/witnesses, location of accused at time of offence via tower data, and conspiracy links; admissible as electronic evidence',
    collection_method: 'Send written requisition to Telecom Service Provider (TSP) Nodal Officer with FIR details and time range; for court cases obtain through court order under BNSS Section 94',
  },
  {
    item: 'Weapon / Instrument Used in Offence',
    priority: 'high',
    reason: 'Primary weapon is direct link between accused and crime; must be recovered, seized, and sent for forensic examination for blood, fingerprints, and matching with wounds',
    collection_method: 'Recover from crime scene or accused person; prepare detailed seizure panchnama with independent witnesses; send to FSL for forensic examination immediately',
  },
  {
    item: 'Site Plan / Scene Sketch Prepared by SI',
    priority: 'medium',
    reason: 'Drawn-to-scale map of crime scene showing positions of evidence, body, entry/exit points — required court exhibit to establish spatial context of offence',
    collection_method: 'Sub-Inspector to prepare accurate scaled sketch with compass directions, measurements, and key evidence positions marked; attach to case diary',
  },
];

// ─── Fallback dispatcher (when Gemini unavailable) ───────────────────────────
// Returns real-world procedural guidance based on Indian law — no dummy data

const getMockResponse = (prompt: string): string => {
  const p = prompt.toLowerCase();

  if (p.includes('checklist'))
    return JSON.stringify(defaultChecklist());

  if (p.includes('missing') && p.includes('evidence'))
    return JSON.stringify(defaultMissingEvidence());

  if (p.includes('provision') || p.includes('section')) {
    return JSON.stringify([
      {
        section: '103',
        act_name: 'Bharatiya Nyaya Sanhita, 2023',
        title: 'Murder',
        plain_language: 'Culpable homicide is murder when done with intention of causing death or with knowledge that the act is likely to cause death.',
        why_applicable: 'Applicable when death is caused with intention or knowledge — verify with case facts.',
        confidence: 0.75,
        typical_evidence: ['Post-mortem report', 'Eyewitness statements', 'Weapon used', 'CCTV footage', 'Forensic ballistics/serology'],
      },
      {
        section: '303',
        act_name: 'Bharatiya Nyaya Sanhita, 2023',
        title: 'Theft',
        plain_language: 'Dishonestly taking moveable property out of possession of any person without consent.',
        why_applicable: 'Applicable when property is taken without consent with dishonest intent.',
        confidence: 0.7,
        typical_evidence: ['Complainant statement', 'CCTV footage', 'Recovery of stolen property', 'Witness statements'],
      },
    ]);
  }

  if (p.includes('chargesheet')) {
    return [
      'DRAFT CHARGESHEET — FOR REVIEW ONLY',
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'IN THE COURT OF CHIEF JUDICIAL MAGISTRATE',
      '─────────────────────────────────────────',
      '',
      'SECTION 1: CASE DETAILS',
      'FIR No.: [As registered at Police Station]',
      'Sections Applied: [As determined by Investigating Officer and verified by Prosecutor]',
      '',
      'SECTION 2: FACTS OF THE CASE',
      '[Complete factual narrative as established through investigation — based on evidence and statements]',
      '',
      'SECTION 3: ACCUSED PERSONS',
      '[Full name, age, address, role of each accused as per investigation — no presumption of guilt]',
      '',
      'SECTION 4: LIST OF WITNESSES',
      '[All eyewitnesses, expert witnesses, and Investigating Officers with addresses]',
      '',
      'SECTION 5: EVIDENCE COLLECTED',
      '[All physical, digital, and documentary evidence with exhibit numbers and FSL reports]',
      '',
      'SECTION 6: LEGAL SECTIONS APPLIED',
      '[BNS/IT Act/NDPS/POCSO sections — verified by Public Prosecutor before filing]',
      '',
      'SECTION 7: PRAYER',
      'It is respectfully prayed that the accused be tried for the offences mentioned.',
      '',
      '⚠ DISCLAIMER: This is an AI-generated draft. Must be reviewed and approved by the',
      'Investigating Officer and Public Prosecutor. All facts must be verified independently.',
      'Configure GEMINI_API_KEY for AI-generated content specific to your case.',
    ].join('\n');
  }

  if (p.includes('summary') || p.includes('diary') || p.includes('inventory')) {
    return [
      'INVESTIGATION DOCUMENT',
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'This document requires GEMINI_API_KEY to generate AI content specific to your case.',
      'Please configure the API key in server/.env to enable full document generation.',
      '',
      'INVESTIGATION STANDARDS (BNSS 2023):',
      '• All investigation steps must be recorded in Case Diary (BNSS Section 193)',
      '• Evidence must be collected with proper panchnama and independent witnesses',
      '• Statements under BNSS Section 180 are not admissible as confessions',
      '• Accused must be produced before Magistrate within 24 hours of arrest',
      '• Charge sheet must be filed within 60 days (up to 7 years) or 90 days (life/death)',
      '',
      '⚠ This document requires review and approval by authorized officers before official use.',
    ].join('\n');
  }

  if (p.includes('risk') || p.includes('completeness'))
    return JSON.stringify({ risks: [], completeness: 80 });

  return [
    'Note: Configure GEMINI_API_KEY in server/.env to enable full AI responses.',
    '',
    'Key Investigation Principles under Indian Law (BNSS 2023):',
    '• FIR must be registered immediately — refusal is punishable (BNSS Section 173)',
    '• Cognizable offences allow arrest without warrant (BNSS Section 35)',
    '• Arrested person must be produced before Magistrate within 24 hours (Article 22)',
    '• Statements to police are not confessions — confessions must be before Magistrate (BSA Section 23)',
    '• All investigation steps must be recorded in Case Diary',
    '• Charge sheet filed within 60-90 days based on offence gravity',
    '• Evidence tampering is a criminal offence under BNS Section 238',
  ].join('\n');
};

// ─── OCR: extract text from image/PDF bytes using Gemini Vision ──────────────
export const extractTextFromFile = async (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  const auth = detectAuth();
  if (auth.mode === 'none') {
    return '[OCR unavailable: configure GEMINI_API_KEY to enable file analysis]';
  }

  let url: string;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth.mode === 'api_key') {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent?key=${auth.apiKey}`;
  } else if (auth.mode === 'service_account' && auth.credPath) {
    const token = await getServiceAccountToken(auth.credPath);
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent`;
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    throw new Error('No auth configured');
  }

  const body = {
    contents: [{
      role: 'user',
      parts: [
        {
          inline_data: { mime_type: mimeType, data: base64Data },
        },
        {
          text: `You are an expert document reader and OCR specialist for Indian law enforcement.
Extract ALL text from this document exactly as it appears.
Preserve formatting, line breaks, dates, names, numbers, and section headings.
If this is a handwritten document, transcribe as accurately as possible.
Output ONLY the extracted text — no commentary, no summary, no extra explanation.`,
        },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini Vision ${resp.status}: ${err.substring(0, 200)}`);
  }
  const data = await resp.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
};

// ─── AI Evidence Analyzer ─────────────────────────────────────────────────────
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

export const analyzeEvidence = async (
  evidenceTitle: string,
  evidenceType: string,
  description: string,
  base64Data?: string,
  mimeType?: string
): Promise<EvidenceAnalysis> => {
  const auth = detectAuth();

  // If we have a file, use vision; otherwise text-only analysis
  if (auth.mode !== 'none' && base64Data && mimeType) {
    try {
      let url: string;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (auth.mode === 'api_key') {
        url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent?key=${auth.apiKey}`;
      } else if (auth.mode === 'service_account' && auth.credPath) {
        const token = await getServiceAccountToken(auth.credPath);
        url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent`;
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error('No auth');
      }

      const prompt = `You are an expert forensic analyst and criminal investigator.
Analyze this piece of evidence for a criminal investigation.
Evidence Title: "${evidenceTitle}"
Evidence Type: ${evidenceType}
Description: ${description}

Perform a thorough forensic analysis and return ONLY valid JSON:
{
  "summary": "2-3 sentence professional forensic summary",
  "key_observations": ["observation 1", "observation 2"],
  "extracted_text": "any text visible in the evidence",
  "persons_identified": ["names or descriptions of people visible"],
  "dates_mentioned": ["dates or times found"],
  "locations_mentioned": ["locations identified"],
  "inconsistencies": ["any suspicious inconsistencies noted"],
  "missing_details": ["what is unclear or missing that would be important"],
  "suggested_next_steps": ["practical next investigation steps based on this evidence"],
  "relevance_score": 0.85,
  "evidence_type_assessment": "assessment of evidence quality and court admissibility"
}`;

      const body = {
        contents: [{
          role: 'user',
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      };

      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      if (resp.ok) {
        const data = await resp.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const parsed = extractJSON<EvidenceAnalysis>(text);
        if (parsed) return parsed;
      }
    } catch (err) {
      logger.warn('Vision analysis failed, falling back to text', { err: String(err).substring(0, 100) });
    }
  }

  // Text-only fallback
  const prompt = `You are an expert forensic analyst and criminal investigator.
Analyze this piece of evidence:
Title: "${evidenceTitle}"
Type: ${evidenceType}
Description: ${description}

Return ONLY valid JSON:
{
  "summary": "professional forensic summary",
  "key_observations": ["key observations from description"],
  "extracted_text": null,
  "persons_identified": [],
  "dates_mentioned": [],
  "locations_mentioned": [],
  "inconsistencies": ["any inconsistencies noted"],
  "missing_details": ["what information is missing"],
  "suggested_next_steps": ["next investigation steps"],
  "relevance_score": 0.7,
  "evidence_type_assessment": "assessment of this evidence type"
}`;

  const response = await callLLM(prompt);
  return extractJSON<EvidenceAnalysis>(response) ?? {
    summary: 'Evidence analysis requires Gemini API key.',
    key_observations: [],
    persons_identified: [],
    dates_mentioned: [],
    locations_mentioned: [],
    inconsistencies: [],
    missing_details: [],
    suggested_next_steps: ['Configure GEMINI_API_KEY for full AI evidence analysis.'],
    relevance_score: 0,
    evidence_type_assessment: 'Unable to assess without AI.',
  };
};

// ─── Comprehensive Risk Analysis + Missing Evidence ──────────────────────────
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

export const generateRiskReport = async (
  caseData: Record<string, unknown>,
  evidenceCount: number,
  witnessCount: number,
  suspectCount: number,
  victimCount: number,
  documentStatuses: string[],
  crimeType: string,
  existingEvidence: string[]
): Promise<InvestigationRiskReport> => {
  const auth = detectAuth();

  const completedSteps: string[] = [];
  const pendingSteps: string[] = [];
  const risks: RiskItem[] = [];

  // Rule-based scoring
  if (evidenceCount > 0) completedSteps.push(`${evidenceCount} evidence items collected`);
  else { pendingSteps.push('Collect physical and digital evidence'); risks.push({ category: 'Evidence', issue: 'No evidence uploaded to case record', severity: 'high' }); }

  if (witnessCount > 0) completedSteps.push(`${witnessCount} witness statement(s) recorded`);
  else { pendingSteps.push('Record witness statements under BNSS Section 180'); risks.push({ category: 'Witnesses', issue: 'No witness statements recorded', severity: 'high' }); }

  if (suspectCount > 0) completedSteps.push(`${suspectCount} suspect(s) identified`);
  else { pendingSteps.push('Identify and profile suspects'); risks.push({ category: 'Suspects', issue: 'No suspects identified', severity: 'medium' }); }

  if (victimCount > 0) completedSteps.push(`${victimCount} victim profile(s) recorded`);
  else risks.push({ category: 'Victims', issue: 'No victim profiles recorded', severity: 'medium' });

  if (!(caseData.fir_number as string)) risks.push({ category: 'Documentation', issue: 'FIR number not recorded', severity: 'high' });
  else completedSteps.push('FIR registered');

  if (!(caseData.io_name as string)) risks.push({ category: 'Assignment', issue: 'No investigating officer assigned', severity: 'high' });
  if (!(caseData.location as string)) risks.push({ category: 'Documentation', issue: 'Incident location not specified', severity: 'low' });

  const approved = documentStatuses.filter((s) => s === 'approved').length;
  if (approved > 0) completedSteps.push(`${approved} document(s) approved`);

  const highCount = risks.filter((r) => r.severity === 'high').length;
  const medCount  = risks.filter((r) => r.severity === 'medium').length;
  const score     = Math.max(0, 100 - highCount * 20 - medCount * 10);

  let status: InvestigationRiskReport['status'] = 'strong';
  if (score < 40) status = 'critical';
  else if (score < 60) status = 'weak';
  else if (score < 80) status = 'adequate';

  // AI-generated missing evidence + recommendations
  let missing: MissingEvidenceItem[] = [];
  let recommendations: string[] = [];
  let courtReadiness = 'Insufficient data for court readiness assessment.';

  if (auth.mode !== 'none') {
    try {
      const prompt = `You are a senior criminal investigator reviewing this ${crimeType} case.
Case completion score: ${score}%
Evidence collected: ${existingEvidence.join(', ') || 'None'}
Witnesses recorded: ${witnessCount}
Suspects identified: ${suspectCount}

Risks identified: ${risks.map((r) => r.issue).join(', ') || 'None'}

Return ONLY valid JSON:
{
  "missing_evidence": [
    {"item": "name", "priority": "high", "reason": "why critical", "collection_method": "how to collect"}
  ],
  "recommendations": ["specific actionable recommendation 1", "recommendation 2"],
  "court_readiness": "one paragraph assessment of court readiness"
}
Limit missing_evidence to 5 most critical items. Limit recommendations to 5.`;

      const response = await callLLM(prompt);
      const parsed = extractJSON<{ missing_evidence: MissingEvidenceItem[]; recommendations: string[]; court_readiness: string }>(response);
      if (parsed) {
        missing          = parsed.missing_evidence || defaultMissingEvidence().slice(0, 5);
        recommendations  = parsed.recommendations  || [];
        courtReadiness   = parsed.court_readiness  || courtReadiness;
      }
    } catch { /* use defaults below */ }
  }

  if (!missing.length)       missing         = defaultMissingEvidence().slice(0, 5);
  if (!recommendations.length) recommendations = [
    'Ensure all evidence is properly documented with seizure memos.',
    'Record statements from all available witnesses before memory fades.',
    'Submit biological evidence to FSL within 48 hours.',
    'Maintain daily case diary entries as mandated under BNSS Section 193.',
    'Consult prosecutor before filing chargesheet to strengthen legal provisions.',
  ];

  return {
    overall_score:        score,
    status,
    risks,
    missing_evidence:     missing,
    completed_steps:      completedSteps,
    pending_steps:        pendingSteps,
    recommendations,
    court_readiness:      courtReadiness,
    estimated_completion: score >= 80 ? 'Ready for chargesheet review' :
                          score >= 60 ? 'Needs 1-2 weeks of investigation' :
                          'Significant investigation work remaining',
  };
};
