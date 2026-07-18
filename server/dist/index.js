var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_dotenv = __toESM(require("dotenv"));
var import_express18 = __toESM(require("express"));
var import_http = require("http");
var import_socket = require("socket.io");
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_compression = __toESM(require("compression"));
var import_morgan = __toESM(require("morgan"));
var import_express_rate_limit = require("express-rate-limit");
var import_path4 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));

// src/db/mongoose.ts
var import_mongoose = __toESM(require("mongoose"));

// src/utils/logger.ts
var import_winston = __toESM(require("winston"));
var logger = import_winston.default.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: import_winston.default.format.combine(
    import_winston.default.format.timestamp(),
    import_winston.default.format.errors({ stack: true }),
    import_winston.default.format.json()
  ),
  transports: [
    new import_winston.default.transports.Console({
      format: import_winston.default.format.combine(
        import_winston.default.format.colorize(),
        import_winston.default.format.simple()
      )
    }),
    new import_winston.default.transports.File({ filename: "logs/error.log", level: "error" }),
    new import_winston.default.transports.File({ filename: "logs/combined.log" })
  ]
});

// src/db/mongoose.ts
function buildSafeUri(raw) {
  try {
    if (raw.includes(",")) {
      const match = raw.match(/mongodb:\/\/([^:]+):/);
      const user = match ? match[1].substring(0, 3) + "***" : "unknown";
      logger.info(`MongoDB URI detected (multi-host Atlas) \u2014 user: ${user}`);
    } else {
      const url = new URL(raw);
      const maskedUser = url.username ? url.username.substring(0, 3) + "***" : "unknown";
      logger.info(`MongoDB URI parsed \u2014 host: ${url.hostname}, user: ${maskedUser}, db: ${url.pathname}`);
    }
  } catch {
  }
  return raw;
}
var connectDB = async () => {
  const raw = process.env.MONGODB_URI;
  if (!raw) {
    logger.error("MONGODB_URI is not set. Add it in Render \u2192 Environment Variables.");
    return;
  }
  const uri = buildSafeUri(raw);
  const connect = async () => {
    try {
      await import_mongoose.default.connect(uri, {
        serverSelectionTimeoutMS: 3e4,
        socketTimeoutMS: 6e4,
        connectTimeoutMS: 3e4,
        maxPoolSize: 10,
        retryWrites: true
      });
      logger.info(`MongoDB connected successfully \u2014 host: ${import_mongoose.default.connection.host}`);
    } catch (err) {
      const msg = String(err).substring(0, 300);
      logger.error(`MongoDB connection failed: ${msg}`);
      if (msg.includes("bad auth") || msg.includes("Authentication failed")) {
        logger.error("AUTH FAILURE \u2014 Check: 1) Atlas password is correct, 2) Username matches Atlas Database User, 3) Network Access allows 0.0.0.0/0");
      }
      if (msg.includes("ENOTFOUND") || msg.includes("querySrv")) {
        logger.error("DNS FAILURE \u2014 Check MONGODB_URI cluster hostname is correct");
      }
      if (msg.includes("timed out") || msg.includes("ETIMEDOUT")) {
        logger.error("NETWORK TIMEOUT \u2014 In MongoDB Atlas: Network Access \u2192 Add 0.0.0.0/0");
      }
      logger.info("Retrying MongoDB connection in 5 seconds...");
      setTimeout(connect, 5e3);
    }
  };
  await connect();
};
import_mongoose.default.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
import_mongoose.default.connection.on("error", (err) => logger.error(`MongoDB error: ${String(err).substring(0, 200)}`));

// src/middleware/errorHandler.ts
var errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    statusCode
  });
  res.status(statusCode).json({
    error: message,
    ...process.env.NODE_ENV === "development" && { stack: err.stack }
  });
};

// src/middleware/notFound.ts
var notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

// src/services/aiService.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var GEMINI_MODEL = "gemini-2.5-flash";
var GEMINI_REST_BASE = "https://generativelanguage.googleapis.com/v1beta";
var _cachedAuth = null;
var detectAuth = () => {
  if (_cachedAuth) return _cachedAuth;
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (key && key !== "your_gemini_api_key" && key !== "PASTE_YOUR_KEY_HERE" && key !== "") {
    if (key.startsWith("AIza")) {
      _cachedAuth = { mode: "api_key", apiKey: key };
      logger.info("Gemini: using API key authentication (AIzaSy format)");
      return _cachedAuth;
    }
    if (key.startsWith("AQ.") || key.startsWith("ya29.")) {
      _cachedAuth = { mode: "bearer_token", bearerToken: key };
      logger.info("Gemini: using OAuth2 bearer token authentication");
      return _cachedAuth;
    }
    _cachedAuth = { mode: "api_key", apiKey: key };
    logger.warn(`Gemini: unrecognised key format, trying as API key`);
    return _cachedAuth;
  }
  const b64 = (process.env.GEMINI_CREDENTIALS_B64 || "").trim();
  if (b64) {
    try {
      const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      if (json.type === "service_account") {
        const tmpPath = import_path.default.resolve(process.cwd(), ".gemini-credentials-tmp.json");
        import_fs.default.writeFileSync(tmpPath, Buffer.from(b64, "base64").toString("utf8"));
        logger.info(`Gemini: using service account from GEMINI_CREDENTIALS_B64 \u2014 ${json.client_email}`);
        _cachedAuth = { mode: "service_account", credPath: tmpPath };
        return _cachedAuth;
      }
    } catch {
      logger.warn("Gemini: GEMINI_CREDENTIALS_B64 is invalid JSON, ignoring");
    }
  }
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    import_path.default.resolve(process.cwd(), "gemini-credentials.json"),
    import_path.default.resolve(process.cwd(), "service-account.json")
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (import_fs.default.existsSync(candidate)) {
      try {
        const json = JSON.parse(import_fs.default.readFileSync(candidate, "utf8"));
        if (json.type === "service_account") {
          logger.info(`Gemini: using service account \u2014 ${json.client_email}`);
          _cachedAuth = { mode: "service_account", credPath: candidate };
          return _cachedAuth;
        }
      } catch {
      }
    }
  }
  logger.warn("Gemini: no credentials found \u2014 running in mock mode");
  logger.warn("  Set GEMINI_API_KEY in .env, or place gemini-credentials.json in server/");
  _cachedAuth = { mode: "none" };
  return _cachedAuth;
};
var getAIStatus = () => {
  const auth = detectAuth();
  if (auth.mode === "api_key") return `${GEMINI_MODEL} (api-key)`;
  if (auth.mode === "bearer_token") return `${GEMINI_MODEL} (bearer-token)`;
  if (auth.mode === "service_account") return `${GEMINI_MODEL} (service-account)`;
  return "mock-mode";
};
var _tokenCache = null;
var getServiceAccountToken = async (credPath) => {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 6e4) {
    return _tokenCache.token;
  }
  const creds = JSON.parse(import_fs.default.readFileSync(credPath, "utf8"));
  const now = Math.floor(Date.now() / 1e3);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/generative-language",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  })).toString("base64url");
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(creds.private_key.replace(/\\n/g, "\n"), "base64url");
  const jwt4 = `${header}.${payload}.${signature}`;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt4}`
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  const data = await resp.json();
  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1e3
  };
  return _tokenCache.token;
};
var callGeminiREST = async (request) => {
  const auth = detectAuth();
  let url;
  let authHeader;
  if (auth.mode === "api_key") {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent?key=${auth.apiKey}`;
    authHeader = "";
  } else if (auth.mode === "bearer_token") {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent`;
    authHeader = `Bearer ${auth.bearerToken}`;
  } else if (auth.mode === "service_account" && auth.credPath) {
    const token = await getServiceAccountToken(auth.credPath);
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent`;
    authHeader = `Bearer ${token}`;
  } else {
    throw new Error("No auth configured");
  }
  const headers = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request)
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${errText.substring(0, 300)}`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
};
var callGeminiStream = async (contents, onChunk) => {
  const auth = detectAuth();
  if (auth.mode === "none") {
    onChunk("AI is running in mock mode. Please configure GEMINI_API_KEY in server/.env to enable full AI responses.");
    return;
  }
  let url;
  const headers = { "Content-Type": "application/json" };
  if (auth.mode === "api_key") {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?key=${auth.apiKey}&alt=sse`;
  } else if (auth.mode === "bearer_token") {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
    headers["Authorization"] = `Bearer ${auth.bearerToken}`;
  } else if (auth.mode === "service_account" && auth.credPath) {
    const token = await getServiceAccountToken(auth.credPath);
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    throw new Error("No auth configured");
  }
  const body3 = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
      topP: 0.9
    }
  };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body3)
  });
  if (!resp.ok || !resp.body) {
    const errText = await resp.text();
    throw new Error(`Gemini stream ${resp.status}: ${errText.substring(0, 300)}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) onChunk(chunk);
      } catch {
      }
    }
  }
};
var callLLM = async (prompt) => {
  const auth = detectAuth();
  if (auth.mode === "none") return getMockResponse(prompt);
  try {
    const text = await callGeminiREST({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, topP: 0.95 }
    });
    if (!text) throw new Error("Empty response from Gemini");
    return text;
  } catch (err) {
    const msg = String(err).toLowerCase();
    if (msg.includes("429") || msg.includes("quota")) {
      logger.warn("Gemini rate-limited \u2014 using mock response");
    } else if (msg.includes("401") || msg.includes("403") || msg.includes("permission") || msg.includes("invalid")) {
      logger.error(`Gemini auth failed (${auth.mode}) \u2014 key may be expired or invalid`);
      _cachedAuth = null;
      _tokenCache = null;
    } else {
      logger.error("Gemini call failed", { err: String(err).substring(0, 200) });
    }
    return getMockResponse(prompt);
  }
};
var chatWithHistory = async (systemContext, history, newMessage) => {
  const auth = detectAuth();
  if (auth.mode === "none") {
    return `**JusticeAI is running without an AI key configured.**

To enable full AI responses, please set a valid **GEMINI_API_KEY** (starts with \`AIzaSy\`) in the Render environment variables.

You can get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

In the meantime, here is a general answer based on built-in knowledge:

${getMockResponse(newMessage)}`;
  }
  try {
    const contents = [];
    if (history.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: `${systemContext}

---

User: ${newMessage}` }]
      });
    } else {
      const [first, ...rest] = history;
      contents.push({
        role: "user",
        parts: [{ text: `${systemContext}

---

User: ${first.content}` }]
      });
      rest.forEach((msg) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      });
      contents.push({ role: "user", parts: [{ text: newMessage }] });
    }
    const text = await callGeminiREST({
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
        topP: 0.9
      }
    });
    return text || "I was unable to generate a response. Please try again.";
  } catch (err) {
    logger.error("Gemini chat failed", { err: String(err).substring(0, 200) });
    return getMockResponse(newMessage);
  }
};
var extractJSON = (text, isArray = false) => {
  try {
    const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(stripped);
    } catch {
    }
    const pattern = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const match = stripped.match(pattern);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
};
var analyzeDocument = async (text, _type) => {
  const prompt = `You are a senior criminal investigator and legal analyst.
Analyze the following FIR/complaint document and extract structured information.

Document:
"""
${text}
"""

Return ONLY valid JSON \u2014 no markdown, no explanation:
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
  return extractJSON(response) ?? {
    summary: "Unable to analyze document automatically. Please review manually.",
    people: [],
    places: [],
    dates: [],
    timeline: [],
    key_facts: [],
    missing_information: ["Full document analysis was not possible."],
    offense_categories: [],
    confidence: 0
  };
};
var extractEntities = async (text) => {
  const prompt = `Extract all named entities from this legal/investigative text.
Text: """${text}"""
Return ONLY valid JSON:
{"people":[],"places":[],"dates":[],"organizations":[],"phone_numbers":[],"vehicles":[],"weapons":[]}`;
  const response = await callLLM(prompt);
  return extractJSON(response) ?? {
    people: [],
    places: [],
    dates: [],
    organizations: [],
    phone_numbers: [],
    vehicles: [],
    weapons: []
  };
};
var generateChecklist = async (crimeType, description) => {
  const prompt = `You are a senior police investigator. Generate a thorough investigation checklist for a "${crimeType}" case.
${description ? `Case context: ${description}` : ""}
Return ONLY a valid JSON array of 12-15 items:
[{"id":"1","task":"action","priority":"high","category":"Scene Investigation","completed":false}]
Priority must be "high", "medium", or "low" only.`;
  const response = await callLLM(prompt);
  const parsed = extractJSON(response, true);
  if (parsed && Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((item, i) => ({
      id: String(item.id ?? i + 1),
      task: item.task ?? "Task not specified",
      priority: ["high", "medium", "low"].includes(item.priority) ? item.priority : "medium",
      category: item.category ?? "General",
      completed: false
    }));
  }
  return defaultChecklist();
};
var recommendProvisions = async (caseDescription, crimeType, facts) => {
  const prompt = `You are an expert in Indian criminal law. Suggest relevant legal provisions for this case.
Crime Type: ${crimeType || "Not specified"}
Description: ${caseDescription}
Facts: ${facts ? JSON.stringify(facts) : "Not provided"}
Return ONLY a valid JSON array of up to 5 provisions:
[{"section":"302","act_name":"Indian Penal Code","title":"...","plain_language":"...","why_applicable":"...","confidence":0.85,"typical_evidence":["..."]}]
Advisory only \u2014 must be verified by a qualified lawyer.`;
  const response = await callLLM(prompt);
  const parsed = extractJSON(response, true);
  return Array.isArray(parsed) ? parsed : [];
};
var detectMissingEvidence = async (crimeType, caseTitle, existingEvidence) => {
  const prompt = `You are an experienced police investigator reviewing a ${crimeType} case.
Case: "${caseTitle}"
Evidence collected: ${existingEvidence.length > 0 ? existingEvidence.join(", ") : "None yet"}
Identify typically required evidence that may be missing. Return ONLY a valid JSON array of 5-8 items:
[{"item":"name","priority":"high","reason":"why important","collection_method":"how to obtain"}]`;
  const response = await callLLM(prompt);
  const parsed = extractJSON(response, true);
  return Array.isArray(parsed) ? parsed : defaultMissingEvidence();
};
var analyzeRisk = async (caseData, evidenceCount, witnessCount, documentStatuses) => {
  const risks = [];
  if (evidenceCount === 0) risks.push({ category: "Evidence", issue: "No evidence uploaded", severity: "high" });
  if (witnessCount === 0) risks.push({ category: "Witnesses", issue: "No witnesses recorded", severity: "high" });
  if (!caseData.fir_number) risks.push({ category: "Documentation", issue: "FIR number not recorded", severity: "medium" });
  if (!caseData.incident_date) risks.push({ category: "Documentation", issue: "Incident date not recorded", severity: "medium" });
  if (!caseData.incident_location) risks.push({ category: "Documentation", issue: "Incident location not recorded", severity: "low" });
  if (!caseData.assigned_io) risks.push({ category: "Assignment", issue: "No investigating officer assigned", severity: "high" });
  if (caseData.status === "chargesheet_filed" && !documentStatuses.includes("approved"))
    risks.push({ category: "Documentation", issue: "Chargesheet filed but no approved document found", severity: "high" });
  const highCount = risks.filter((r) => r.severity === "high").length;
  const medCount = risks.filter((r) => r.severity === "medium").length;
  return { risks, completeness: Math.max(0, 100 - highCount * 20 - medCount * 10) };
};
var generateDocument = async (documentType, caseContext) => {
  const typeDescriptions = {
    chargesheet: "a formal police chargesheet for court submission. Include: case details, accused info, victim details, witness list, evidence list, legal sections, factual narrative. Mark as DRAFT.",
    summary: "a concise investigation summary covering key findings, persons involved, evidence, and current status.",
    diary: `a case diary entry for ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")} describing today's investigation activities.`,
    evidence_inventory: "a detailed evidence inventory with item numbers, descriptions, types, collection dates, locations, and status.",
    witness_summary: "a structured summary of all witness statements highlighting key observations and discrepancies."
  };
  const description = typeDescriptions[documentType] || "a professional case document";
  const prompt = `You are an expert police documentation officer. Generate ${description}

Case Data:
${JSON.stringify(caseContext, null, 2)}

Format as a formal document with clear section headings and professional legal language.
End with: "\u26A0 DISCLAIMER: This document is AI-generated and must be reviewed and approved by authorized officers before official use."`;
  return callLLM(prompt);
};
var defaultChecklist = () => [
  { id: "1", task: "Register FIR under BNSS Section 173 \u2014 cannot be refused; zero FIR is permissible", priority: "high", category: "Documentation", completed: false },
  { id: "2", task: "Inform SHO, Circle Inspector and DSP immediately. For heinous offences notify SP and District Magistrate", priority: "high", category: "Escalation", completed: false },
  { id: "3", task: "Cordon off and preserve the crime scene; post guard to prevent tampering under BNSS Section 176", priority: "high", category: "Scene Preservation", completed: false },
  { id: "4", task: "Photograph and videograph the crime scene before any evidence is moved or collected", priority: "high", category: "Scene Documentation", completed: false },
  { id: "5", task: "Prepare detailed scene-of-crime panchnama with two independent witnesses as required under BNSS", priority: "high", category: "Scene Documentation", completed: false },
  { id: "6", task: "Collect and seize all physical evidence with proper labelling and seizure memos under BNSS Section 185", priority: "high", category: "Evidence Collection", completed: false },
  { id: "7", task: "Seize CCTV/DVR footage from crime scene and surrounding 500-metre radius immediately before overwrite", priority: "high", category: "Digital Evidence", completed: false },
  { id: "8", task: "Record statements of all witnesses under BNSS Section 180; for sexual offences by woman officer only", priority: "high", category: "Witness Management", completed: false },
  { id: "9", task: "Arrange medical examination of victim under BNSS Section 184; for rape cases mandatory within 24 hours", priority: "high", category: "Medical", completed: false },
  { id: "10", task: "Arrest accused without warrant if cognizable offence under BNSS Section 35; produce before magistrate within 24 hours", priority: "high", category: "Arrest", completed: false },
  { id: "11", task: "Submit seized physical/biological/digital evidence to Forensic Science Laboratory with property seizure form", priority: "medium", category: "Forensics", completed: false },
  { id: "12", task: "Obtain Call Detail Records (CDR) and tower dump from telecom operator via written request or court order", priority: "medium", category: "Digital Evidence", completed: false },
  { id: "13", task: "Conduct Test Identification Parade (TIP) before Magistrate if accused identity is in question", priority: "medium", category: "Identification", completed: false },
  { id: "14", task: "Maintain daily Case Diary (CD) recording all investigation steps as mandated under BNSS Section 193", priority: "medium", category: "Documentation", completed: false },
  { id: "15", task: "File chargesheet within 60 days (for offences punishable up to 7 years) or 90 days (life/death cases) under BNSS Section 193", priority: "medium", category: "Legal Filing", completed: false }
];
var defaultMissingEvidence = () => [
  {
    item: "Post-mortem / Medico-Legal Certificate (MLC)",
    priority: "high",
    reason: "Establishes cause of death, nature of injuries, time of death, and whether death is homicidal, suicidal, or accidental \u2014 legally essential for all violent crime prosecutions",
    collection_method: "Request from Government Hospital Forensic Department or District Medical Officer; obtain certified copy for court"
  },
  {
    item: "CCTV / Surveillance Footage",
    priority: "high",
    reason: "Primary electronic evidence establishing presence of accused at scene, time of offence, direction of movement, and identity; courts give high evidentiary value under BSA 2023 Section 61",
    collection_method: "Immediately seize DVR/NVR from scene, shops, traffic cameras, ATMs within 500m radius with seizure memo; preserve in sealed evidence bag"
  },
  {
    item: "Forensic Science Laboratory (FSL) Report",
    priority: "high",
    reason: "Scientific examination of physical evidence \u2014 blood group, DNA, fingerprints, handwriting, ballistics, chemical analysis \u2014 admissible as expert opinion under BSA 2023 Section 39",
    collection_method: "Submit evidence to State FSL with Form FSL-1 and property seizure form; obtain acknowledgment; follow up for expedited analysis in serious cases"
  },
  {
    item: "Call Detail Records (CDR) and Tower Location Data",
    priority: "medium",
    reason: "Establishes communication between accused and victim/witnesses, location of accused at time of offence via tower data, and conspiracy links; admissible as electronic evidence",
    collection_method: "Send written requisition to Telecom Service Provider (TSP) Nodal Officer with FIR details and time range; for court cases obtain through court order under BNSS Section 94"
  },
  {
    item: "Weapon / Instrument Used in Offence",
    priority: "high",
    reason: "Primary weapon is direct link between accused and crime; must be recovered, seized, and sent for forensic examination for blood, fingerprints, and matching with wounds",
    collection_method: "Recover from crime scene or accused person; prepare detailed seizure panchnama with independent witnesses; send to FSL for forensic examination immediately"
  },
  {
    item: "Site Plan / Scene Sketch Prepared by SI",
    priority: "medium",
    reason: "Drawn-to-scale map of crime scene showing positions of evidence, body, entry/exit points \u2014 required court exhibit to establish spatial context of offence",
    collection_method: "Sub-Inspector to prepare accurate scaled sketch with compass directions, measurements, and key evidence positions marked; attach to case diary"
  }
];
var getMockResponse = (prompt) => {
  const p = prompt.toLowerCase();
  if (p.includes("checklist"))
    return JSON.stringify(defaultChecklist());
  if (p.includes("missing") && p.includes("evidence"))
    return JSON.stringify(defaultMissingEvidence());
  if (p.includes("provision") || p.includes("section")) {
    return JSON.stringify([
      {
        section: "103",
        act_name: "Bharatiya Nyaya Sanhita, 2023",
        title: "Murder",
        plain_language: "Culpable homicide is murder when done with intention of causing death or with knowledge that the act is likely to cause death.",
        why_applicable: "Applicable when death is caused with intention or knowledge \u2014 verify with case facts.",
        confidence: 0.75,
        typical_evidence: ["Post-mortem report", "Eyewitness statements", "Weapon used", "CCTV footage", "Forensic ballistics/serology"]
      },
      {
        section: "303",
        act_name: "Bharatiya Nyaya Sanhita, 2023",
        title: "Theft",
        plain_language: "Dishonestly taking moveable property out of possession of any person without consent.",
        why_applicable: "Applicable when property is taken without consent with dishonest intent.",
        confidence: 0.7,
        typical_evidence: ["Complainant statement", "CCTV footage", "Recovery of stolen property", "Witness statements"]
      }
    ]);
  }
  if (p.includes("chargesheet")) {
    return [
      "DRAFT CHARGESHEET \u2014 FOR REVIEW ONLY",
      `Date: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")}`,
      "",
      "IN THE COURT OF CHIEF JUDICIAL MAGISTRATE",
      "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
      "",
      "SECTION 1: CASE DETAILS",
      "FIR No.: [As registered at Police Station]",
      "Sections Applied: [As determined by Investigating Officer and verified by Prosecutor]",
      "",
      "SECTION 2: FACTS OF THE CASE",
      "[Complete factual narrative as established through investigation \u2014 based on evidence and statements]",
      "",
      "SECTION 3: ACCUSED PERSONS",
      "[Full name, age, address, role of each accused as per investigation \u2014 no presumption of guilt]",
      "",
      "SECTION 4: LIST OF WITNESSES",
      "[All eyewitnesses, expert witnesses, and Investigating Officers with addresses]",
      "",
      "SECTION 5: EVIDENCE COLLECTED",
      "[All physical, digital, and documentary evidence with exhibit numbers and FSL reports]",
      "",
      "SECTION 6: LEGAL SECTIONS APPLIED",
      "[BNS/IT Act/NDPS/POCSO sections \u2014 verified by Public Prosecutor before filing]",
      "",
      "SECTION 7: PRAYER",
      "It is respectfully prayed that the accused be tried for the offences mentioned.",
      "",
      "\u26A0 DISCLAIMER: This is an AI-generated draft. Must be reviewed and approved by the",
      "Investigating Officer and Public Prosecutor. All facts must be verified independently.",
      "Configure GEMINI_API_KEY for AI-generated content specific to your case."
    ].join("\n");
  }
  if (p.includes("summary") || p.includes("diary") || p.includes("inventory")) {
    return [
      "INVESTIGATION DOCUMENT",
      `Date: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")}`,
      "",
      "This document requires GEMINI_API_KEY to generate AI content specific to your case.",
      "Please configure the API key in server/.env to enable full document generation.",
      "",
      "INVESTIGATION STANDARDS (BNSS 2023):",
      "\u2022 All investigation steps must be recorded in Case Diary (BNSS Section 193)",
      "\u2022 Evidence must be collected with proper panchnama and independent witnesses",
      "\u2022 Statements under BNSS Section 180 are not admissible as confessions",
      "\u2022 Accused must be produced before Magistrate within 24 hours of arrest",
      "\u2022 Charge sheet must be filed within 60 days (up to 7 years) or 90 days (life/death)",
      "",
      "\u26A0 This document requires review and approval by authorized officers before official use."
    ].join("\n");
  }
  if (p.includes("risk") || p.includes("completeness"))
    return JSON.stringify({ risks: [], completeness: 80 });
  return [
    "Note: Configure GEMINI_API_KEY in server/.env to enable full AI responses.",
    "",
    "Key Investigation Principles under Indian Law (BNSS 2023):",
    "\u2022 FIR must be registered immediately \u2014 refusal is punishable (BNSS Section 173)",
    "\u2022 Cognizable offences allow arrest without warrant (BNSS Section 35)",
    "\u2022 Arrested person must be produced before Magistrate within 24 hours (Article 22)",
    "\u2022 Statements to police are not confessions \u2014 confessions must be before Magistrate (BSA Section 23)",
    "\u2022 All investigation steps must be recorded in Case Diary",
    "\u2022 Charge sheet filed within 60-90 days based on offence gravity",
    "\u2022 Evidence tampering is a criminal offence under BNS Section 238"
  ].join("\n");
};
var extractTextFromFile = async (base64Data, mimeType) => {
  const auth = detectAuth();
  if (auth.mode === "none") {
    return "[OCR unavailable: configure GEMINI_API_KEY to enable file analysis]";
  }
  let url;
  const headers = { "Content-Type": "application/json" };
  if (auth.mode === "api_key") {
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent?key=${auth.apiKey}`;
  } else if (auth.mode === "service_account" && auth.credPath) {
    const token = await getServiceAccountToken(auth.credPath);
    url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent`;
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    throw new Error("No auth configured");
  }
  const body3 = {
    contents: [{
      role: "user",
      parts: [
        {
          inline_data: { mime_type: mimeType, data: base64Data }
        },
        {
          text: `You are an expert document reader and OCR specialist for Indian law enforcement.
Extract ALL text from this document exactly as it appears.
Preserve formatting, line breaks, dates, names, numbers, and section headings.
If this is a handwritten document, transcribe as accurately as possible.
Output ONLY the extracted text \u2014 no commentary, no summary, no extra explanation.`
        }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
  };
  const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body3) });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini Vision ${resp.status}: ${err.substring(0, 200)}`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
};
var analyzeEvidence = async (evidenceTitle, evidenceType, description, base64Data, mimeType) => {
  const auth = detectAuth();
  if (auth.mode !== "none" && base64Data && mimeType) {
    try {
      let url;
      const headers = { "Content-Type": "application/json" };
      if (auth.mode === "api_key") {
        url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent?key=${auth.apiKey}`;
      } else if (auth.mode === "service_account" && auth.credPath) {
        const token = await getServiceAccountToken(auth.credPath);
        url = `${GEMINI_REST_BASE}/models/${GEMINI_MODEL}:generateContent`;
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        throw new Error("No auth");
      }
      const prompt2 = `You are an expert forensic analyst and criminal investigator.
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
      const body3 = {
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: prompt2 }
          ]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
      };
      const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body3) });
      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const parsed = extractJSON(text);
        if (parsed) return parsed;
      }
    } catch (err) {
      logger.warn("Vision analysis failed, falling back to text", { err: String(err).substring(0, 100) });
    }
  }
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
  return extractJSON(response) ?? {
    summary: "Evidence analysis requires Gemini API key.",
    key_observations: [],
    persons_identified: [],
    dates_mentioned: [],
    locations_mentioned: [],
    inconsistencies: [],
    missing_details: [],
    suggested_next_steps: ["Configure GEMINI_API_KEY for full AI evidence analysis."],
    relevance_score: 0,
    evidence_type_assessment: "Unable to assess without AI."
  };
};
var generateRiskReport = async (caseData, evidenceCount, witnessCount, suspectCount, victimCount, documentStatuses, crimeType, existingEvidence) => {
  const auth = detectAuth();
  const completedSteps = [];
  const pendingSteps = [];
  const risks = [];
  if (evidenceCount > 0) completedSteps.push(`${evidenceCount} evidence items collected`);
  else {
    pendingSteps.push("Collect physical and digital evidence");
    risks.push({ category: "Evidence", issue: "No evidence uploaded to case record", severity: "high" });
  }
  if (witnessCount > 0) completedSteps.push(`${witnessCount} witness statement(s) recorded`);
  else {
    pendingSteps.push("Record witness statements under BNSS Section 180");
    risks.push({ category: "Witnesses", issue: "No witness statements recorded", severity: "high" });
  }
  if (suspectCount > 0) completedSteps.push(`${suspectCount} suspect(s) identified`);
  else {
    pendingSteps.push("Identify and profile suspects");
    risks.push({ category: "Suspects", issue: "No suspects identified", severity: "medium" });
  }
  if (victimCount > 0) completedSteps.push(`${victimCount} victim profile(s) recorded`);
  else risks.push({ category: "Victims", issue: "No victim profiles recorded", severity: "medium" });
  if (!caseData.fir_number) risks.push({ category: "Documentation", issue: "FIR number not recorded", severity: "high" });
  else completedSteps.push("FIR registered");
  if (!caseData.io_name) risks.push({ category: "Assignment", issue: "No investigating officer assigned", severity: "high" });
  if (!caseData.location) risks.push({ category: "Documentation", issue: "Incident location not specified", severity: "low" });
  const approved = documentStatuses.filter((s) => s === "approved").length;
  if (approved > 0) completedSteps.push(`${approved} document(s) approved`);
  const highCount = risks.filter((r) => r.severity === "high").length;
  const medCount = risks.filter((r) => r.severity === "medium").length;
  const score = Math.max(0, 100 - highCount * 20 - medCount * 10);
  let status = "strong";
  if (score < 40) status = "critical";
  else if (score < 60) status = "weak";
  else if (score < 80) status = "adequate";
  let missing = [];
  let recommendations = [];
  let courtReadiness = "Insufficient data for court readiness assessment.";
  if (auth.mode !== "none") {
    try {
      const prompt = `You are a senior criminal investigator reviewing this ${crimeType} case.
Case completion score: ${score}%
Evidence collected: ${existingEvidence.join(", ") || "None"}
Witnesses recorded: ${witnessCount}
Suspects identified: ${suspectCount}

Risks identified: ${risks.map((r) => r.issue).join(", ") || "None"}

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
      const parsed = extractJSON(response);
      if (parsed) {
        missing = parsed.missing_evidence || defaultMissingEvidence().slice(0, 5);
        recommendations = parsed.recommendations || [];
        courtReadiness = parsed.court_readiness || courtReadiness;
      }
    } catch {
    }
  }
  if (!missing.length) missing = defaultMissingEvidence().slice(0, 5);
  if (!recommendations.length) recommendations = [
    "Ensure all evidence is properly documented with seizure memos.",
    "Record statements from all available witnesses before memory fades.",
    "Submit biological evidence to FSL within 48 hours.",
    "Maintain daily case diary entries as mandated under BNSS Section 193.",
    "Consult prosecutor before filing chargesheet to strengthen legal provisions."
  ];
  return {
    overall_score: score,
    status,
    risks,
    missing_evidence: missing,
    completed_steps: completedSteps,
    pending_steps: pendingSteps,
    recommendations,
    court_readiness: courtReadiness,
    estimated_completion: score >= 80 ? "Ready for chargesheet review" : score >= 60 ? "Needs 1-2 weeks of investigation" : "Significant investigation work remaining"
  };
};

// src/services/socketService.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var _io = null;
function initSocketService(io2) {
  _io = io2;
  io2.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) {
        next(new Error("No token"));
        return;
      }
      const payload = import_jsonwebtoken.default.verify(
        token,
        process.env.JWT_SECRET || "dev-secret"
      );
      socket.userId = payload.id;
      socket.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });
  io2.on("connection", (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: ${userId}`);
    socket.join(`user:${userId}`);
    const role = socket.role;
    if (role) socket.join(`role:${role}`);
    socket.on("join_case", (caseId) => {
      socket.join(`case:${caseId}`);
    });
    socket.on("leave_case", (caseId) => {
      socket.leave(`case:${caseId}`);
    });
    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });
  logger.info("Socket.io service initialized");
}
function sendRealtimeNotification(notif) {
  if (!_io) return;
  const payload = {
    ...notif,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (notif.user_id) {
    _io.to(`user:${notif.user_id}`).emit("notification", payload);
  } else {
    _io.emit("notification", payload);
  }
  if (notif.case_id) {
    _io.to(`case:${notif.case_id}`).emit("case_update", payload);
  }
}

// src/routes/auth.ts
var import_express = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_crypto = __toESM(require("crypto"));
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"));
var import_express_validator = require("express-validator");

// src/models/User.ts
var import_mongoose2 = __toESM(require("mongoose"));
var UserSchema = new import_mongoose2.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    badge_number: String,
    role: {
      type: String,
      enum: [
        "admin",
        "super_admin",
        "police_officer",
        "investigating_officer",
        "sho",
        "crime_branch",
        "prosecutor",
        "legal_advisor",
        "law_student",
        "judicial_researcher",
        "trainer"
      ],
      default: "police_officer"
    },
    department: String,
    station: String,
    phone: String,
    avatar_url: String,
    is_active: { type: Boolean, default: true },
    two_factor_enabled: { type: Boolean, default: false },
    two_factor_secret: String,
    last_login: Date
  },
  { timestamps: true }
);
var User_default = import_mongoose2.default.model("User", UserSchema);

// src/models/RefreshToken.ts
var import_mongoose3 = __toESM(require("mongoose"));
var RefreshTokenSchema = new import_mongoose3.Schema(
  {
    user_id: { type: import_mongoose3.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true }
  },
  { timestamps: true }
);
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
var RefreshToken_default = import_mongoose3.default.model("RefreshToken", RefreshTokenSchema);

// src/models/AuditLog.ts
var import_mongoose4 = __toESM(require("mongoose"));
var AuditLogSchema = new import_mongoose4.Schema(
  {
    user_id: { type: import_mongoose4.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    resource_type: String,
    resource_id: { type: import_mongoose4.Schema.Types.ObjectId },
    old_values: { type: import_mongoose4.Schema.Types.Mixed },
    new_values: { type: import_mongoose4.Schema.Types.Mixed },
    ip_address: String,
    user_agent: String
  },
  { timestamps: true }
);
AuditLogSchema.index({ user_id: 1, createdAt: -1 });
var AuditLog_default = import_mongoose4.default.model("AuditLog", AuditLogSchema);

// src/models/OTPCode.ts
var import_mongoose5 = __toESM(require("mongoose"));
var OTPCodeSchema = new import_mongoose5.Schema({
  user_id: { type: import_mongoose5.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  email: { type: String, required: true },
  code: { type: String, required: true },
  // bcrypt hash of 6-digit code
  purpose: { type: String, enum: ["login_2fa", "email_verify", "password_reset"], required: true },
  expires_at: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  used: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  ip_address: String
}, { timestamps: true });
OTPCodeSchema.index({ user_id: 1, purpose: 1 });
var OTPCode_default = import_mongoose5.default.model("OTPCode", OTPCodeSchema);

// src/models/TrustedDevice.ts
var import_mongoose6 = __toESM(require("mongoose"));
var TrustedDeviceSchema = new import_mongoose6.Schema({
  user_id: { type: import_mongoose6.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  device_token: { type: String, required: true, unique: true, index: true },
  device_name: { type: String, required: true },
  ip_address: String,
  user_agent: String,
  last_used: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  is_revoked: { type: Boolean, default: false }
}, { timestamps: true });
var TrustedDevice_default = import_mongoose6.default.model("TrustedDevice", TrustedDeviceSchema);

// src/middleware/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const decoded = import_jsonwebtoken2.default.verify(token, process.env.JWT_SECRET || "fallback_secret");
    const user = await User_default.findOne({ _id: decoded.id, is_active: true }).select("id email role full_name is_active");
    if (!user) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }
    req.user = { id: String(user._id), email: user.email, role: user.role, full_name: user.full_name };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
var authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!roles.includes(req.user.role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
};

// src/services/emailService.ts
var transporter = null;
async function getTransporter() {
  if (transporter) return transporter;
  try {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || ""
      },
      tls: { rejectUnauthorized: false }
    });
    return transporter;
  } catch {
    return null;
  }
}
var FROM = process.env.SMTP_FROM || "JusticeAI <noreply@justiceai.gov.in>";
async function sendOTPEmail(params) {
  const subjectMap = {
    login_2fa: "JusticeAI \u2014 Your Login Verification Code",
    email_verify: "JusticeAI \u2014 Verify Your Email Address",
    password_reset: "JusticeAI \u2014 Password Reset Code"
  };
  const purposeText = {
    login_2fa: "sign in to your account",
    email_verify: "verify your email address",
    password_reset: "reset your password"
  };
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0B1220; color: #E2E8F0; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; padding: 0 20px; }
    .card { background: #131820; border: 1px solid #1E2533; border-radius: 20px; padding: 40px; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg,#4338CA,#6366F1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 18px; font-weight: 700; color: #fff; }
    .logo-sub { font-size: 11px; color: #64748B; }
    h1 { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 8px; }
    p { font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: #0F172A; border: 2px solid #6366F1; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #6366F1; font-family: 'Courier New', monospace; }
    .otp-label { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; }
    .expiry { background: #1A2332; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #F59E0B; margin: 16px 0; }
    .meta { font-size: 12px; color: #475569; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1E2533; }
    .warning { background: #2D1B1B; border: 1px solid #7F1D1D; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #FCA5A5; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">\u{1F6E1}\uFE0F</div>
        <div>
          <div class="logo-text">JusticeAI</div>
          <div class="logo-sub">Investigation Platform</div>
        </div>
      </div>

      <h1>Verification Code</h1>
      <p>Hello <strong style="color:#fff">${params.name}</strong>,</p>
      <p>Your one-time verification code to <strong style="color:#fff">${purposeText[params.purpose]}</strong> is:</p>

      <div class="otp-box">
        <div class="otp-code">${params.otp}</div>
        <div class="otp-label">One-Time Password</div>
      </div>

      <div class="expiry">\u23F1 This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>

      ${params.ip ? `<p style="font-size:12px;color:#64748B;">Request from IP: ${params.ip}</p>` : ""}

      <div class="warning">
        \u26A0 If you did not request this code, your account may be at risk. 
        Contact your system administrator immediately and do not share this code.
      </div>

      <div class="meta">
        This is an automated message from JusticeAI Investigation Platform.<br>
        For authorized law enforcement and legal personnel only.<br>
        All access is logged and monitored.
      </div>
    </div>
  </div>
</body>
</html>`;
  const text = `JusticeAI \u2014 Verification Code

Hello ${params.name},

Your verification code is: ${params.otp}

This code expires in 10 minutes. Do not share it with anyone.

If you did not request this, contact your system administrator immediately.`;
  const mailer = await getTransporter();
  if (mailer && process.env.SMTP_USER) {
    try {
      await mailer.sendMail({
        from: FROM,
        to: params.to,
        subject: subjectMap[params.purpose],
        html,
        text
      });
      logger.info(`OTP email sent to ${params.to} [${params.purpose}]`);
      return true;
    } catch (err) {
      logger.warn(`Email send failed: ${String(err).substring(0, 150)}`);
    }
  }
  logger.info(`[DEV MODE] OTP for ${params.to}: ${params.otp} [${params.purpose}]`);
  logger.info("Configure SMTP_USER + SMTP_PASS in server/.env to send real emails.");
  return false;
}
async function sendTrustedDeviceEmail(params) {
  const mailer = await getTransporter();
  if (!mailer || !process.env.SMTP_USER) {
    logger.info(`[DEV MODE] New trusted device for ${params.to}: ${params.device}`);
    return;
  }
  try {
    await mailer.sendMail({
      from: FROM,
      to: params.to,
      subject: "JusticeAI \u2014 New Trusted Device Added",
      text: `Hello ${params.name},

A new device has been trusted for your JusticeAI account:

Device: ${params.device}
IP: ${params.ip || "Unknown"}
Time: ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN")}

If this was not you, revoke this device immediately in your account settings.`
    });
  } catch (err) {
    logger.warn(`Trusted device email failed: ${String(err).substring(0, 100)}`);
  }
}

// src/routes/auth.ts
var router = (0, import_express.Router)();
var JWT_SECRET = () => process.env.JWT_SECRET || "fallback_secret_change_in_production";
var JWT_REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET || "fallback_refresh_change_in_production";
var JWT_EXPIRES = () => process.env.JWT_EXPIRES_IN || "15m";
var JWT_REFRESH_EXPIRES = () => process.env.JWT_REFRESH_EXPIRES_IN || "30d";
function generateTokens(userId, email, role) {
  const accessToken = import_jsonwebtoken3.default.sign({ id: userId, email, role }, JWT_SECRET(), { expiresIn: JWT_EXPIRES() });
  const refreshToken = import_jsonwebtoken3.default.sign({ id: userId }, JWT_REFRESH_SECRET(), { expiresIn: JWT_REFRESH_EXPIRES() });
  return { accessToken, refreshToken };
}
function generateOTP() {
  return String(import_crypto.default.randomInt(1e5, 999999));
}
function parseUserAgent(ua = "") {
  const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : ua.includes("Edge") ? "Edge" : "Browser";
  const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : ua.includes("Android") ? "Android" : ua.includes("iPhone") ? "iPhone" : "Unknown OS";
  return `${browser} on ${os}`;
}
async function saveRefreshToken(userId, token) {
  await RefreshToken_default.create({
    user_id: userId,
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
  });
}
function stripSensitive(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password_hash;
  delete obj.two_factor_secret;
  return obj;
}
router.post(
  "/register",
  [
    (0, import_express_validator.body)("email").isEmail().normalizeEmail(),
    (0, import_express_validator.body)("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    (0, import_express_validator.body)("full_name").trim().notEmpty().withMessage("Full name is required")
  ],
  async (req, res) => {
    const errors = (0, import_express_validator.validationResult)(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password, full_name, role, badge_number, department, station, phone } = req.body;
    try {
      const existing = await User_default.findOne({ email });
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      const password_hash = await import_bcryptjs.default.hash(password, 12);
      const user = await User_default.create({
        email,
        password_hash,
        full_name,
        role: role || "police_officer",
        badge_number,
        department,
        station,
        phone
      });
      const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
      await saveRefreshToken(String(user._id), refreshToken);
      res.status(201).json({ user: stripSensitive(user), accessToken, refreshToken, requiresTwoFactor: false });
    } catch (err) {
      logger.error("Registration failed", { err: String(err).substring(0, 200) });
      res.status(500).json({ error: "Registration failed" });
    }
  }
);
router.post(
  "/login",
  [(0, import_express_validator.body)("email").isEmail().normalizeEmail(), (0, import_express_validator.body)("password").notEmpty()],
  async (req, res) => {
    const errors = (0, import_express_validator.validationResult)(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password, device_token } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const ua = req.get("user-agent") || "";
    try {
      const user = await User_default.findOne({ email, is_active: true });
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const valid = await import_bcryptjs.default.compare(password, user.password_hash);
      if (!valid) {
        await AuditLog_default.create({ user_id: user._id, action: "LOGIN_FAILED", ip_address: ip, user_agent: ua });
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      if (user.two_factor_enabled) {
        if (device_token) {
          const trusted = await TrustedDevice_default.findOne({
            user_id: user._id,
            device_token,
            is_revoked: false,
            expires_at: { $gt: /* @__PURE__ */ new Date() }
          });
          if (trusted) {
            trusted.last_used = /* @__PURE__ */ new Date();
            await trusted.save();
            user.last_login = /* @__PURE__ */ new Date();
            await user.save();
            const { accessToken: accessToken2, refreshToken: refreshToken2 } = generateTokens(String(user._id), user.email, user.role);
            await saveRefreshToken(String(user._id), refreshToken2);
            await AuditLog_default.create({ user_id: user._id, action: "LOGIN", ip_address: ip, user_agent: ua });
            res.json({ user: stripSensitive(user), accessToken: accessToken2, refreshToken: refreshToken2, requiresTwoFactor: false, trusted_device: true });
            return;
          }
        }
        const rawOTP = generateOTP();
        const otpHash = await import_bcryptjs.default.hash(rawOTP, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
        await OTPCode_default.updateMany(
          { user_id: user._id, purpose: "login_2fa", used: false },
          { used: true }
        );
        await OTPCode_default.create({
          user_id: user._id,
          email: user.email,
          code: otpHash,
          purpose: "login_2fa",
          expires_at: expiresAt,
          ip_address: ip
        });
        sendOTPEmail({ to: user.email, name: user.full_name, otp: rawOTP, purpose: "login_2fa", ip }).catch(() => {
        });
        res.json({
          requiresTwoFactor: true,
          user_id: String(user._id),
          email_hint: user.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
          message: "Verification code sent to your registered email address."
        });
        return;
      }
      user.last_login = /* @__PURE__ */ new Date();
      await user.save();
      const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
      await saveRefreshToken(String(user._id), refreshToken);
      await AuditLog_default.create({ user_id: user._id, action: "LOGIN", ip_address: ip, user_agent: ua });
      res.json({ user: stripSensitive(user), accessToken, refreshToken, requiresTwoFactor: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[LOGIN ERROR]", { msg });
      res.status(500).json({ error: "Login failed", detail: msg });
    }
  }
);
router.post("/verify-otp", async (req, res) => {
  const { user_id, otp, remember_device } = req.body;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const ua = req.get("user-agent") || "";
  if (!user_id || !otp) {
    res.status(400).json({ error: "user_id and otp are required" });
    return;
  }
  try {
    const user = await User_default.findOne({ _id: user_id, is_active: true });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const otpRecord = await OTPCode_default.findOne({
      user_id,
      purpose: "login_2fa",
      used: false,
      expires_at: { $gt: /* @__PURE__ */ new Date() }
    }).sort({ createdAt: -1 });
    if (!otpRecord) {
      res.status(401).json({ error: "Verification code not found or expired. Please request a new code." });
      return;
    }
    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
      await otpRecord.save();
      res.status(429).json({ error: "Too many failed attempts. Please sign in again to receive a new code." });
      return;
    }
    const isValid = await import_bcryptjs.default.compare(String(otp).trim(), otpRecord.code);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      res.status(401).json({ error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` });
      return;
    }
    otpRecord.used = true;
    await otpRecord.save();
    user.last_login = /* @__PURE__ */ new Date();
    await user.save();
    const { accessToken, refreshToken } = generateTokens(String(user._id), user.email, user.role);
    await saveRefreshToken(String(user._id), refreshToken);
    await AuditLog_default.create({ user_id: user._id, action: "LOGIN_2FA_SUCCESS", ip_address: ip, user_agent: ua });
    let newDeviceToken = null;
    if (remember_device) {
      newDeviceToken = import_crypto.default.randomBytes(48).toString("hex");
      const deviceName = parseUserAgent(ua);
      await TrustedDevice_default.create({
        user_id: user._id,
        device_token: newDeviceToken,
        device_name: deviceName,
        ip_address: ip,
        user_agent: ua,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
        // 30 days
      });
      sendTrustedDeviceEmail({ to: user.email, name: user.full_name, device: deviceName, ip }).catch(() => {
      });
    }
    res.json({
      user: stripSensitive(user),
      accessToken,
      refreshToken,
      requiresTwoFactor: false,
      ...newDeviceToken ? { device_token: newDeviceToken } : {}
    });
  } catch (err) {
    logger.error("OTP verification failed", { err: String(err).substring(0, 200) });
    res.status(500).json({ error: "Verification failed" });
  }
});
router.post("/resend-otp", async (req, res) => {
  const { user_id } = req.body;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }
  try {
    const user = await User_default.findOne({ _id: user_id, is_active: true });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const recent = await OTPCode_default.findOne({
      user_id,
      purpose: "login_2fa",
      used: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1e3) }
    });
    if (recent) {
      res.status(429).json({ error: "Please wait 60 seconds before requesting a new code." });
      return;
    }
    await OTPCode_default.updateMany({ user_id, purpose: "login_2fa", used: false }, { used: true });
    const rawOTP = generateOTP();
    const otpHash = await import_bcryptjs.default.hash(rawOTP, 10);
    await OTPCode_default.create({
      user_id: user._id,
      email: user.email,
      code: otpHash,
      purpose: "login_2fa",
      expires_at: new Date(Date.now() + 10 * 60 * 1e3),
      ip_address: ip
    });
    sendOTPEmail({ to: user.email, name: user.full_name, otp: rawOTP, purpose: "login_2fa", ip }).catch(() => {
    });
    res.json({ message: "New verification code sent.", email_hint: user.email.replace(/(.{2}).*(@.*)/, "$1***$2") });
  } catch (err) {
    res.status(500).json({ error: "Failed to resend code" });
  }
});
router.get("/me", authenticate, async (req, res) => {
  const user = await User_default.findById(req.user.id).select("-password_hash -two_factor_secret");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token required" });
    return;
  }
  try {
    const decoded = import_jsonwebtoken3.default.verify(refreshToken, JWT_REFRESH_SECRET());
    const stored = await RefreshToken_default.findOne({ token: refreshToken, expires_at: { $gt: /* @__PURE__ */ new Date() } });
    if (!stored) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }
    const user = await User_default.findOne({ _id: decoded.id, is_active: true });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const tokens = generateTokens(String(user._id), user.email, user.role);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});
router.post("/logout", authenticate, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await RefreshToken_default.deleteOne({ token: refreshToken });
  res.json({ message: "Logged out successfully" });
});
router.put(
  "/change-password",
  authenticate,
  [(0, import_express_validator.body)("currentPassword").notEmpty(), (0, import_express_validator.body)("newPassword").isLength({ min: 8 })],
  async (req, res) => {
    const errors = (0, import_express_validator.validationResult)(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const user = await User_default.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const valid = await import_bcryptjs.default.compare(req.body.currentPassword, user.password_hash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    user.password_hash = await import_bcryptjs.default.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ message: "Password updated successfully" });
  }
);
router.get("/2fa/status", authenticate, async (req, res) => {
  const user = await User_default.findById(req.user.id).select("two_factor_enabled email");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const deviceCount = await TrustedDevice_default.countDocuments({ user_id: user._id, is_revoked: false, expires_at: { $gt: /* @__PURE__ */ new Date() } });
  res.json({ two_factor_enabled: user.two_factor_enabled, trusted_devices: deviceCount });
});
router.post("/2fa/enable", authenticate, async (req, res) => {
  const ip = req.ip || "unknown";
  try {
    const user = await User_default.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.two_factor_enabled) {
      res.status(400).json({ error: "2FA is already enabled" });
      return;
    }
    const rawOTP = generateOTP();
    const otpHash = await import_bcryptjs.default.hash(rawOTP, 10);
    await OTPCode_default.updateMany({ user_id: user._id, purpose: "email_verify", used: false }, { used: true });
    await OTPCode_default.create({
      user_id: user._id,
      email: user.email,
      code: otpHash,
      purpose: "email_verify",
      expires_at: new Date(Date.now() + 10 * 60 * 1e3),
      ip_address: ip
    });
    sendOTPEmail({ to: user.email, name: user.full_name, otp: rawOTP, purpose: "email_verify", ip }).catch(() => {
    });
    res.json({ message: "Verification code sent to your email. Enter it to activate 2FA.", email_hint: user.email.replace(/(.{2}).*(@.*)/, "$1***$2") });
  } catch (err) {
    res.status(500).json({ error: "Failed to initiate 2FA setup" });
  }
});
router.post("/2fa/confirm", authenticate, async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    res.status(400).json({ error: "OTP is required" });
    return;
  }
  try {
    const user = await User_default.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const otpRecord = await OTPCode_default.findOne({
      user_id: user._id,
      purpose: "email_verify",
      used: false,
      expires_at: { $gt: /* @__PURE__ */ new Date() }
    }).sort({ createdAt: -1 });
    if (!otpRecord) {
      res.status(401).json({ error: "Code expired or not found. Please request a new code." });
      return;
    }
    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
      await otpRecord.save();
      res.status(429).json({ error: "Too many failed attempts. Please start over." });
      return;
    }
    const isValid = await import_bcryptjs.default.compare(String(otp).trim(), otpRecord.code);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      res.status(401).json({ error: `Invalid code. ${5 - otpRecord.attempts} attempts remaining.` });
      return;
    }
    otpRecord.used = true;
    await otpRecord.save();
    user.two_factor_enabled = true;
    await user.save();
    res.json({ message: "Two-factor authentication has been enabled successfully.", two_factor_enabled: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to confirm 2FA" });
  }
});
router.post(
  "/2fa/disable",
  authenticate,
  [(0, import_express_validator.body)("password").notEmpty()],
  async (req, res) => {
    const errors = (0, import_express_validator.validationResult)(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const user = await User_default.findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const valid = await import_bcryptjs.default.compare(req.body.password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: "Incorrect password" });
        return;
      }
      user.two_factor_enabled = false;
      user.two_factor_secret = void 0;
      await user.save();
      await TrustedDevice_default.updateMany({ user_id: user._id }, { is_revoked: true });
      res.json({ message: "Two-factor authentication has been disabled. All trusted devices revoked.", two_factor_enabled: false });
    } catch (err) {
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  }
);
router.get("/trusted-devices", authenticate, async (req, res) => {
  const devices = await TrustedDevice_default.find({
    user_id: req.user.id,
    is_revoked: false,
    expires_at: { $gt: /* @__PURE__ */ new Date() }
  }).sort({ last_used: -1 }).lean();
  res.json(devices.map((d) => ({ ...d, id: d._id })));
});
router.delete("/trusted-devices/:id", authenticate, async (req, res) => {
  await TrustedDevice_default.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { is_revoked: true }
  );
  res.json({ message: "Device revoked successfully" });
});
router.delete("/trusted-devices", authenticate, async (req, res) => {
  await TrustedDevice_default.updateMany({ user_id: req.user.id }, { is_revoked: true });
  res.json({ message: "All trusted devices revoked" });
});
var auth_default = router;

// src/routes/cases.ts
var import_express2 = require("express");
var import_express_validator2 = require("express-validator");
var import_mongoose16 = __toESM(require("mongoose"));

// src/models/Case.ts
var import_mongoose7 = __toESM(require("mongoose"));
var CaseSchema = new import_mongoose7.Schema(
  {
    case_number: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ["open", "under_investigation", "chargesheet_filed", "closed", "archived"],
      default: "open"
    },
    crime_type: String,
    // Dates
    incident_date: Date,
    date_of_incident: Date,
    // Location
    incident_location: String,
    location: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    // Coordinates
    latitude: { type: Number, index: true },
    longitude: { type: Number, index: true },
    geocoded_at: Date,
    // FIR
    fir_number: String,
    fir_date: Date,
    // Personnel
    police_station: String,
    station: String,
    io_name: String,
    assigned_io: { type: import_mongoose7.Schema.Types.ObjectId, ref: "User" },
    assigned_sho: { type: import_mongoose7.Schema.Types.ObjectId, ref: "User" },
    prosecutor_id: { type: import_mongoose7.Schema.Types.ObjectId, ref: "User" },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    tags: [String],
    ai_summary: String,
    ai_extracted_facts: { type: import_mongoose7.Schema.Types.Mixed },
    created_by: { type: import_mongoose7.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
CaseSchema.index({ title: "text", description: "text", case_number: "text", fir_number: "text" });
CaseSchema.index({ status: 1 });
CaseSchema.index({ priority: 1 });
CaseSchema.index({ assigned_io: 1 });
CaseSchema.index({ latitude: 1, longitude: 1 });
var Case_default = import_mongoose7.default.model("Case", CaseSchema);

// src/models/Evidence.ts
var import_mongoose8 = __toESM(require("mongoose"));
var EvidenceSchema = new import_mongoose8.Schema(
  {
    case_id: { type: import_mongoose8.Schema.Types.ObjectId, ref: "Case", required: true },
    evidence_number: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    evidence_type: {
      type: String,
      enum: ["image", "video", "audio", "document", "physical", "digital", "forensic"],
      required: true
    },
    file_url: String,
    file_name: String,
    file_size: Number,
    mime_type: String,
    ocr_text: String,
    ai_summary: String,
    metadata: { type: import_mongoose8.Schema.Types.Mixed },
    tags: [String],
    chain_of_custody: [
      {
        timestamp: { type: Date, default: Date.now },
        action: String,
        notes: String,
        officer: String,
        officer_id: { type: import_mongoose8.Schema.Types.ObjectId, ref: "User" }
      }
    ],
    collected_by: { type: import_mongoose8.Schema.Types.ObjectId, ref: "User" },
    collected_at: Date,
    location_found: String,
    is_verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);
EvidenceSchema.index({ case_id: 1 });
var Evidence_default = import_mongoose8.default.model("Evidence", EvidenceSchema);

// src/models/Witness.ts
var import_mongoose9 = __toESM(require("mongoose"));
var StatementSchema = new import_mongoose9.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  statement_date: { type: Date, default: Date.now },
  recorded_by: String,
  location: String,
  ai_summary: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });
var InterviewSchema = new import_mongoose9.Schema({
  id: { type: String, required: true },
  date: { type: Date, required: true },
  officer_name: String,
  location: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });
var ActivitySchema = new import_mongoose9.Schema({
  id: { type: String, required: true },
  type: String,
  description: String,
  performed_by: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });
var WitnessSchema = new import_mongoose9.Schema(
  {
    case_id: { type: import_mongoose9.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    full_name: { type: String, required: true, index: true },
    alias: String,
    age: Number,
    gender: String,
    address: String,
    phone: String,
    email: String,
    occupation: String,
    witness_type: { type: String, enum: ["eyewitness", "expert", "informant", "character", "hostile", "other"], default: "eyewitness" },
    relationship_to_case: String,
    statements: [StatementSchema],
    interview_history: [InterviewSchema],
    court_appearance_status: { type: String, enum: ["pending", "appeared", "not_appeared", "exempted", "yet_to_be_summoned"], default: "pending" },
    protection_required: { type: Boolean, default: false },
    protection_status: { type: String, enum: ["requested", "granted", "denied", "not_required"] },
    documents: [{
      id: String,
      file_name: String,
      file_url: String,
      uploaded_at: Date,
      uploaded_by: String
    }],
    statement_summary: String,
    activity_log: [ActivitySchema],
    notes: String,
    is_hostile: { type: Boolean, default: false }
  },
  { timestamps: true }
);
WitnessSchema.index({ case_id: 1, createdAt: -1 });
var Witness_default = import_mongoose9.default.model("Witness", WitnessSchema);

// src/models/Victim.ts
var import_mongoose10 = __toESM(require("mongoose"));
var VictimSchema = new import_mongoose10.Schema(
  {
    case_id: { type: import_mongoose10.Schema.Types.ObjectId, ref: "Case", required: true },
    full_name: { type: String, required: true },
    age: Number,
    gender: String,
    address: String,
    phone: String,
    email: String,
    injury_description: String,
    medical_records: [{ type: import_mongoose10.Schema.Types.Mixed }],
    statements: [{ type: import_mongoose10.Schema.Types.Mixed }],
    compensation_status: String,
    protection_requests: [{ type: import_mongoose10.Schema.Types.Mixed }],
    notes: String
  },
  { timestamps: true }
);
VictimSchema.index({ case_id: 1 });
var Victim_default = import_mongoose10.default.model("Victim", VictimSchema);

// src/models/Suspect.ts
var import_mongoose11 = __toESM(require("mongoose"));
var CriminalRecordSchema = new import_mongoose11.Schema({
  id: String,
  case_number: String,
  offence: String,
  court: String,
  year: String,
  outcome: String,
  sentence: String,
  notes: String
}, { _id: false });
var ActivitySchema2 = new import_mongoose11.Schema({
  id: String,
  type: String,
  description: String,
  performed_by: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });
var DocumentSchema = new import_mongoose11.Schema({
  id: String,
  file_name: String,
  file_url: String,
  doc_type: String,
  uploaded_by: String,
  uploaded_at: { type: Date, default: Date.now }
}, { _id: false });
var SuspectSchema = new import_mongoose11.Schema(
  {
    case_id: { type: import_mongoose11.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    full_name: { type: String, required: true, index: true },
    aliases: [String],
    age: Number,
    gender: String,
    nationality: { type: String, default: "Indian" },
    religion: String,
    occupation: String,
    address: String,
    phone: String,
    email: String,
    vehicle_numbers: [String],
    national_id: { type: String, index: true, sparse: true },
    pan_number: String,
    passport_number: String,
    voter_id: String,
    driving_license: String,
    description: String,
    photo_url: String,
    arrest_status: {
      type: String,
      enum: ["not_arrested", "arrested", "released_on_bail", "absconding", "chargesheeted", "acquitted"],
      default: "not_arrested",
      index: true
    },
    arrest_date: Date,
    arresting_officer: String,
    bail_status: String,
    bail_date: Date,
    remand_end_date: Date,
    court_next_date: Date,
    criminal_history: [CriminalRecordSchema],
    has_prior_record: { type: Boolean, default: false },
    linked_evidence: [{ type: import_mongoose11.Schema.Types.ObjectId, ref: "Evidence" }],
    linked_cases: [{ type: import_mongoose11.Schema.Types.ObjectId, ref: "Case" }],
    risk_level: { type: String, enum: ["low", "medium", "high", "critical"] },
    risk_summary: String,
    risk_indicators: [String],
    flight_risk: Boolean,
    documents: [DocumentSchema],
    notes: String,
    known_associates: [String],
    activity_log: [ActivitySchema2]
  },
  { timestamps: true }
);
SuspectSchema.index({ full_name: "text" });
SuspectSchema.index({ case_id: 1, createdAt: -1 });
SuspectSchema.index({ phone: 1 });
var Suspect_default = import_mongoose11.default.model("Suspect", SuspectSchema);

// src/models/CaseLegalProvision.ts
var import_mongoose12 = __toESM(require("mongoose"));
var CaseLegalProvisionSchema = new import_mongoose12.Schema(
  {
    case_id: { type: import_mongoose12.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    provision_id: { type: import_mongoose12.Schema.Types.ObjectId, ref: "LegalProvision", required: true },
    confidence_score: { type: Number, default: 0.5, min: 0, max: 1 },
    ai_reasoning: String,
    why_applicable: String,
    required_evidence: [String],
    investigation_notes: String,
    status: { type: String, enum: ["suggested", "accepted", "rejected"], default: "suggested" },
    reviewed_by: { type: import_mongoose12.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: Date,
    review_notes: String,
    analysis_run_id: String
  },
  { timestamps: true }
);
CaseLegalProvisionSchema.index({ case_id: 1, status: 1 });
CaseLegalProvisionSchema.index({ case_id: 1, analysis_run_id: 1 });
var CaseLegalProvision_default = import_mongoose12.default.model("CaseLegalProvision", CaseLegalProvisionSchema);

// src/models/Checklist.ts
var import_mongoose13 = __toESM(require("mongoose"));
var ChecklistSchema = new import_mongoose13.Schema(
  {
    case_id: { type: import_mongoose13.Schema.Types.ObjectId, ref: "Case", required: true },
    crime_type: String,
    title: { type: String, required: true },
    items: [
      {
        id: String,
        task: String,
        priority: String,
        category: String,
        completed: { type: Boolean, default: false },
        notes: String,
        updated_at: Date
      }
    ],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    created_by: { type: import_mongoose13.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
ChecklistSchema.index({ case_id: 1 });
var Checklist_default = import_mongoose13.default.model("Checklist", ChecklistSchema);

// src/services/geocodeService.ts
async function geocodeAddress(address) {
  if (!address?.trim()) return null;
  const query = address.includes("India") ? address : `${address.trim()}, India`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "JusticeAI-Investigation-Platform/1.0 (contact: admin@justiceai.gov.in)",
        "Accept-Language": "en"
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) {
      logger.warn(`Nominatim error: ${res.status} for "${address}"`);
      return null;
    }
    const data = await res.json();
    if (!data.length) {
      logger.debug(`Nominatim: no results for "${address}"`);
      return null;
    }
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      display_name: data[0].display_name
    };
  } catch (err) {
    logger.warn(`Geocoding failed for "${address}": ${String(err).substring(0, 100)}`);
    return null;
  }
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// src/models/CaseDocument.ts
var import_mongoose14 = __toESM(require("mongoose"));
var CaseDocumentSchema = new import_mongoose14.Schema(
  {
    case_id: { type: import_mongoose14.Schema.Types.ObjectId, ref: "Case", required: true },
    document_type: { type: String, required: true },
    title: { type: String, required: true },
    content: String,
    file_url: String,
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["draft", "under_review", "approved", "rejected"], default: "draft" },
    generated_by_ai: { type: Boolean, default: false },
    reviewed_by: { type: import_mongoose14.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: Date,
    created_by: { type: import_mongoose14.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
CaseDocumentSchema.index({ case_id: 1 });
var CaseDocument_default = import_mongoose14.default.model("CaseDocument", CaseDocumentSchema);

// src/models/TimelineEvent.ts
var import_mongoose15 = __toESM(require("mongoose"));
var TimelineEventSchema = new import_mongoose15.Schema(
  {
    case_id: { type: import_mongoose15.Schema.Types.ObjectId, ref: "Case", required: true },
    event_type: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    event_date: { type: Date, required: true, default: Date.now },
    performed_by: { type: import_mongoose15.Schema.Types.ObjectId, ref: "User" },
    related_entity_type: String,
    related_entity_id: { type: import_mongoose15.Schema.Types.ObjectId },
    attachments: [{ type: import_mongoose15.Schema.Types.Mixed }],
    is_milestone: { type: Boolean, default: false }
  },
  { timestamps: true }
);
TimelineEventSchema.index({ case_id: 1, event_date: 1 });
var TimelineEvent_default = import_mongoose15.default.model("TimelineEvent", TimelineEventSchema);

// src/routes/cases.ts
var router2 = (0, import_express2.Router)();
router2.use(authenticate);
router2.get("/map", async (req, res) => {
  try {
    const { priority, status, crime_type, fir_number } = req.query;
    const filter = {
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    };
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (crime_type) filter.crime_type = { $regex: crime_type, $options: "i" };
    if (fir_number) filter.fir_number = { $regex: fir_number, $options: "i" };
    const cases = await Case_default.find(filter).select("case_number fir_number title crime_type status priority latitude longitude address city state location incident_location io_name incident_date date_of_incident createdAt").populate("assigned_io", "full_name").lean();
    const markers = cases.map((c) => ({
      id: String(c._id),
      case_number: c.case_number,
      fir_number: c.fir_number || "",
      title: c.title,
      crime_type: c.crime_type || "Unknown",
      status: c.status,
      priority: c.priority,
      latitude: c.latitude,
      longitude: c.longitude,
      address: c.address || c.location || c.incident_location || "",
      city: c.city || "",
      state: c.state || "",
      io_name: c.io_name || c.assigned_io?.full_name || "Unassigned",
      date_of_incident: c.incident_date || c.date_of_incident || c.createdAt
    }));
    const [total, open, highPri, withCoords] = await Promise.all([
      Case_default.countDocuments(),
      Case_default.countDocuments({ status: { $in: ["open", "under_investigation"] } }),
      Case_default.countDocuments({ priority: { $in: ["high", "critical"] } }),
      Case_default.countDocuments({ latitude: { $exists: true, $ne: null } })
    ]);
    res.json({
      markers,
      stats: { total, open, high_priority: highPri, with_coordinates: withCoords }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch map data", detail: String(err) });
  }
});
router2.post("/geocode-batch", async (req, res) => {
  try {
    const pending = await Case_default.find({
      $or: [
        { address: { $exists: true, $ne: "" } },
        { city: { $exists: true, $ne: "" } },
        { location: { $exists: true, $ne: "" } }
      ],
      latitude: { $exists: false },
      longitude: { $exists: false }
    }).select("_id case_number address city state location incident_location").lean();
    if (!pending.length) {
      res.json({ message: "No cases require geocoding.", geocoded: 0, total_pending: 0 });
      return;
    }
    res.json({ message: `Geocoding ${pending.length} cases in background.`, total_pending: pending.length });
    (async () => {
      let geocoded = 0;
      for (const c of pending) {
        const addr = [c.address, c.city, c.state, c.location, c.incident_location].filter(Boolean).join(", ");
        if (!addr) continue;
        await sleep(1200);
        const result = await geocodeAddress(addr);
        if (result) {
          await Case_default.findByIdAndUpdate(c._id, { latitude: result.latitude, longitude: result.longitude, geocoded_at: /* @__PURE__ */ new Date() });
          geocoded++;
          logger.info(`Batch geocoded ${c.case_number}: ${result.latitude}, ${result.longitude}`);
        }
      }
      logger.info(`Batch geocoding complete: ${geocoded}/${pending.length} cases geocoded`);
    })().catch((err) => logger.error("Batch geocoding error", { err: String(err) }));
  } catch (err) {
    res.status(500).json({ error: "Batch geocoding failed", detail: String(err) });
  }
});
router2.get("/", async (req, res) => {
  const { status, search, page = "1", limit = "20", assignedTo } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };
  if (assignedTo) filter.assigned_io = assignedTo;
  if (!["admin", "super_admin"].includes(req.user.role)) {
    filter.$or = [
      { assigned_io: req.user.id },
      { assigned_sho: req.user.id },
      { prosecutor_id: req.user.id },
      { created_by: req.user.id }
    ];
  }
  const [cases, total] = await Promise.all([
    Case_default.find(filter).populate("assigned_io", "full_name email").populate("assigned_sho", "full_name").sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Case_default.countDocuments(filter)
  ]);
  const caseIds = cases.map((c) => c._id);
  const [evidenceCounts, witnessCounts] = await Promise.all([
    Evidence_default.aggregate([{ $match: { case_id: { $in: caseIds } } }, { $group: { _id: "$case_id", count: { $sum: 1 } } }]),
    Witness_default.aggregate([{ $match: { case_id: { $in: caseIds } } }, { $group: { _id: "$case_id", count: { $sum: 1 } } }])
  ]);
  const evMap = {};
  const wiMap = {};
  evidenceCounts.forEach((e) => {
    evMap[String(e._id)] = e.count;
  });
  witnessCounts.forEach((w) => {
    wiMap[String(w._id)] = w.count;
  });
  const enriched = cases.map((c) => ({
    ...c,
    id: c._id,
    io_name: c.assigned_io?.full_name,
    sho_name: c.assigned_sho?.full_name,
    evidence_count: evMap[String(c._id)] || 0,
    witness_count: wiMap[String(c._id)] || 0
  }));
  res.json({ cases: enriched, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
});
router2.get("/:id", async (req, res) => {
  if (!import_mongoose16.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const caseDoc = await Case_default.findById(req.params.id).populate("assigned_io", "full_name email").populate("assigned_sho", "full_name").populate("prosecutor_id", "full_name").lean();
  if (!caseDoc) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const caseId = caseDoc._id;
  const [evidence, witnesses, victims, suspects, provisions, checklist, documents] = await Promise.all([
    Evidence_default.find({ case_id: caseId }).lean(),
    Witness_default.find({ case_id: caseId }).lean(),
    Victim_default.find({ case_id: caseId }).lean(),
    Suspect_default.find({ case_id: caseId }).lean(),
    CaseLegalProvision_default.find({ case_id: caseId }).populate("provision_id").lean(),
    Checklist_default.findOne({ case_id: caseId }).lean(),
    CaseDocument_default.find({ case_id: caseId }).sort({ createdAt: -1 }).lean()
  ]);
  const io2 = caseDoc.assigned_io;
  const sho = caseDoc.assigned_sho;
  const prosecutor = caseDoc.prosecutor_id;
  res.json({
    ...caseDoc,
    id: caseDoc._id,
    io_name: io2?.full_name,
    io_email: io2?.email,
    sho_name: sho?.full_name,
    prosecutor_name: prosecutor?.full_name,
    evidence,
    witnesses,
    victims,
    suspects,
    legal_provisions: provisions,
    checklist,
    documents
  });
});
router2.post(
  "/",
  [(0, import_express_validator2.body)("title").trim().notEmpty()],
  async (req, res) => {
    const errors = (0, import_express_validator2.validationResult)(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const {
      title,
      description,
      crime_type,
      incident_date,
      incident_location,
      fir_number,
      fir_date,
      police_station,
      assigned_io,
      assigned_sho,
      prosecutor_id,
      priority,
      tags
    } = req.body;
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const count = await Case_default.countDocuments({ createdAt: { $gte: /* @__PURE__ */ new Date(`${year}-01-01`), $lt: /* @__PURE__ */ new Date(`${year + 1}-01-01`) } });
    const case_number = `JAI-${year}-${String(count + 1).padStart(5, "0")}`;
    const newCase = await Case_default.create({
      case_number,
      title,
      description,
      crime_type,
      incident_date: incident_date || void 0,
      incident_location,
      fir_number,
      fir_date: fir_date || void 0,
      police_station,
      assigned_io: assigned_io || req.user.id,
      assigned_sho: assigned_sho || void 0,
      prosecutor_id: prosecutor_id || void 0,
      priority: priority || "medium",
      tags: tags || [],
      created_by: req.user.id
    });
    await TimelineEvent_default.create({
      case_id: newCase._id,
      event_type: "case_created",
      title: "Case Registered",
      event_date: /* @__PURE__ */ new Date(),
      performed_by: req.user.id,
      is_milestone: true
    });
    res.status(201).json({ ...newCase.toObject(), id: newCase._id });
  }
);
router2.put("/:id", async (req, res) => {
  if (!import_mongoose16.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const allowed = [
    "title",
    "description",
    "status",
    "crime_type",
    "incident_date",
    "incident_location",
    "fir_number",
    "police_station",
    "assigned_io",
    "assigned_sho",
    "prosecutor_id",
    "priority",
    "tags",
    "ai_summary",
    "ai_extracted_facts"
  ];
  const update = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) update[k] = req.body[k];
  });
  const updated = await Case_default.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!updated) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json({ ...updated, id: updated._id });
});
router2.delete("/:id", async (req, res) => {
  if (!["admin", "super_admin"].includes(req.user.role)) {
    res.status(403).json({ error: "Only admins can delete cases" });
    return;
  }
  await Case_default.findByIdAndDelete(req.params.id);
  res.json({ message: "Case deleted" });
});
router2.get("/:id/timeline", async (req, res) => {
  const events = await TimelineEvent_default.find({ case_id: req.params.id }).populate("performed_by", "full_name").sort({ event_date: 1 }).lean();
  res.json(events.map((e) => ({
    ...e,
    id: e._id,
    performed_by_name: e.performed_by?.full_name
  })));
});
router2.post("/:id/timeline", async (req, res) => {
  const { event_type, title, description, event_date, is_milestone } = req.body;
  const event = await TimelineEvent_default.create({
    case_id: req.params.id,
    event_type,
    title,
    description,
    event_date: event_date || /* @__PURE__ */ new Date(),
    performed_by: req.user.id,
    is_milestone: is_milestone || false
  });
  res.status(201).json({ ...event.toObject(), id: event._id });
});
var cases_default = router2;

// src/routes/evidence.ts
var import_express3 = require("express");
var import_multer = __toESM(require("multer"));
var import_path2 = __toESM(require("path"));
var import_uuid = require("uuid");
var import_mongoose17 = __toESM(require("mongoose"));
var router3 = (0, import_express3.Router)();
router3.use(authenticate);
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => cb(null, process.env.UPLOAD_DIR || "./uploads"),
  filename: (_req, file, cb) => cb(null, `${(0, import_uuid.v4)()}${import_path2.default.extname(file.originalname)}`)
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "52428800") },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/avi",
      "video/mov",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});
router3.get("/", async (req, res) => {
  const { case_id, evidence_type, search } = req.query;
  const filter = {};
  if (case_id && import_mongoose17.default.isValidObjectId(case_id)) filter.case_id = case_id;
  if (evidence_type) filter.evidence_type = evidence_type;
  if (search) filter.$or = [
    { title: { $regex: search, $options: "i" } },
    { description: { $regex: search, $options: "i" } }
  ];
  const evidence = await Evidence_default.find(filter).populate("collected_by", "full_name").sort({ createdAt: -1 }).lean();
  res.json(evidence.map((e) => ({
    ...e,
    id: e._id,
    collected_by_name: e.collected_by?.full_name
  })));
});
router3.get("/:id", async (req, res) => {
  if (!import_mongoose17.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const e = await Evidence_default.findById(req.params.id).populate("collected_by", "full_name").lean();
  if (!e) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }
  res.json({ ...e, id: e._id, collected_by_name: e.collected_by?.full_name });
});
router3.post("/", upload.single("file"), async (req, res) => {
  const { case_id, title, description, evidence_type, collected_at, location_found, tags, evidence_number } = req.body;
  if (!case_id || !title || !evidence_type) {
    res.status(400).json({ error: "case_id, title, and evidence_type are required" });
    return;
  }
  const file = req.file;
  const evidenceNum = evidence_number || `EVI-${(0, import_uuid.v4)().substring(0, 8).toUpperCase()}`;
  const e = await Evidence_default.create({
    case_id,
    evidence_number: evidenceNum,
    title,
    description,
    evidence_type,
    file_url: file ? `/uploads/${file.filename}` : void 0,
    file_name: file?.originalname,
    file_size: file?.size,
    mime_type: file?.mimetype,
    collected_by: req.user.id,
    collected_at: collected_at || /* @__PURE__ */ new Date(),
    location_found,
    tags: tags ? Array.isArray(tags) ? tags : JSON.parse(tags) : [],
    chain_of_custody: [{
      timestamp: /* @__PURE__ */ new Date(),
      action: "Evidence collected and uploaded",
      officer: req.user.full_name,
      officer_id: req.user.id
    }]
  });
  await TimelineEvent_default.create({
    case_id,
    event_type: "evidence_uploaded",
    title: `Evidence uploaded: ${title}`,
    description,
    event_date: /* @__PURE__ */ new Date(),
    performed_by: req.user.id,
    related_entity_type: "evidence",
    related_entity_id: e._id
  });
  res.status(201).json({ ...e.toObject(), id: e._id });
});
router3.put("/:id", async (req, res) => {
  if (!import_mongoose17.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { title, description, tags, is_verified, ai_summary } = req.body;
  const update = {};
  if (title !== void 0) update.title = title;
  if (description !== void 0) update.description = description;
  if (tags !== void 0) update.tags = tags;
  if (is_verified !== void 0) update.is_verified = is_verified;
  if (ai_summary !== void 0) update.ai_summary = ai_summary;
  const updated = await Evidence_default.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!updated) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }
  res.json({ ...updated, id: updated._id });
});
router3.post("/:id/custody", async (req, res) => {
  if (!import_mongoose17.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { action, notes } = req.body;
  const e = await Evidence_default.findById(req.params.id);
  if (!e) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }
  e.chain_of_custody.push({
    timestamp: /* @__PURE__ */ new Date(),
    action,
    notes,
    officer: req.user.full_name,
    officer_id: new import_mongoose17.default.Types.ObjectId(req.user.id)
  });
  await e.save();
  res.json({ message: "Custody entry added", chain_of_custody: e.chain_of_custody });
});
router3.delete("/:id", async (req, res) => {
  await Evidence_default.findByIdAndDelete(req.params.id);
  res.json({ message: "Evidence deleted" });
});
var evidence_default = router3;

// src/routes/witnesses.ts
var import_express4 = require("express");
var import_uuid2 = require("uuid");
var import_mongoose18 = __toESM(require("mongoose"));
var router4 = (0, import_express4.Router)();
router4.use(authenticate);
router4.get("/", async (req, res) => {
  const { case_id } = req.query;
  const filter = case_id ? { case_id } : {};
  const docs = await Witness_default.find(filter).sort({ createdAt: -1 }).lean();
  res.json(docs.map((d) => ({ ...d, id: d._id })));
});
router4.get("/:id", async (req, res) => {
  if (!import_mongoose18.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const doc = await Witness_default.findById(req.params.id).lean();
  if (!doc) {
    res.status(404).json({ error: "Witness not found" });
    return;
  }
  res.json({ ...doc, id: doc._id });
});
router4.post("/", async (req, res) => {
  const {
    case_id,
    full_name,
    alias,
    age,
    gender,
    address,
    phone,
    email,
    occupation,
    relationship_to_case,
    notes,
    protection_required
  } = req.body;
  if (!case_id || !full_name) {
    res.status(400).json({ error: "case_id and full_name are required" });
    return;
  }
  const doc = await Witness_default.create({
    case_id,
    full_name,
    alias,
    age,
    gender,
    address,
    phone,
    email,
    occupation,
    relationship_to_case,
    notes,
    protection_required: protection_required || false
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});
router4.put("/:id", async (req, res) => {
  if (!import_mongoose18.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const fields = [
    "full_name",
    "alias",
    "age",
    "gender",
    "address",
    "phone",
    "email",
    "occupation",
    "relationship_to_case",
    "court_appearance_status",
    "notes",
    "protection_required"
  ];
  const update = {};
  fields.forEach((f) => {
    if (req.body[f] !== void 0) update[f] = req.body[f];
  });
  const doc = await Witness_default.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!doc) {
    res.status(404).json({ error: "Witness not found" });
    return;
  }
  res.json({ ...doc, id: doc._id });
});
router4.post("/:id/statements", async (req, res) => {
  if (!import_mongoose18.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { content, statement_date, recorded_by, location } = req.body;
  if (!content?.trim()) {
    res.status(400).json({ error: "Statement content is required" });
    return;
  }
  const doc = await Witness_default.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Witness not found" });
    return;
  }
  const newStatement = {
    id: (0, import_uuid2.v4)(),
    content,
    statement_date: statement_date ? new Date(statement_date) : /* @__PURE__ */ new Date(),
    recorded_by: recorded_by || req.user.full_name || "Officer",
    location: location || "",
    createdAt: /* @__PURE__ */ new Date()
  };
  doc.statements.push(newStatement);
  doc.activity_log.push({
    id: (0, import_uuid2.v4)(),
    type: "statement_added",
    description: `Statement recorded${location ? ` at ${location}` : ""}`,
    performed_by: req.user.full_name || "Officer",
    createdAt: /* @__PURE__ */ new Date()
  });
  await doc.save();
  res.json({ message: "Statement added", statements: doc.statements });
});
router4.delete("/:id", async (req, res) => {
  await Witness_default.findByIdAndDelete(req.params.id);
  res.json({ message: "Witness record deleted" });
});
var witnesses_default = router4;

// src/routes/victims.ts
var import_express5 = require("express");
var import_mongoose19 = __toESM(require("mongoose"));
var router5 = (0, import_express5.Router)();
router5.use(authenticate);
router5.get("/", async (req, res) => {
  const { case_id } = req.query;
  const docs = await Victim_default.find(case_id ? { case_id } : {}).sort({ createdAt: -1 }).lean();
  res.json(docs.map((d) => ({ ...d, id: d._id })));
});
router5.get("/:id", async (req, res) => {
  if (!import_mongoose19.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const doc = await Victim_default.findById(req.params.id).lean();
  if (!doc) {
    res.status(404).json({ error: "Victim not found" });
    return;
  }
  res.json({ ...doc, id: doc._id });
});
router5.post("/", async (req, res) => {
  const {
    case_id,
    full_name,
    age,
    gender,
    address,
    phone,
    email,
    injury_description,
    compensation_status,
    notes
  } = req.body;
  if (!case_id || !full_name) {
    res.status(400).json({ error: "case_id and full_name are required" });
    return;
  }
  const doc = await Victim_default.create({
    case_id,
    full_name,
    age,
    gender,
    address,
    phone,
    email,
    injury_description,
    compensation_status,
    notes
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});
router5.put("/:id", async (req, res) => {
  if (!import_mongoose19.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const fields = [
    "full_name",
    "age",
    "gender",
    "address",
    "phone",
    "email",
    "injury_description",
    "compensation_status",
    "notes"
  ];
  const update = {};
  fields.forEach((f) => {
    if (req.body[f] !== void 0) update[f] = req.body[f];
  });
  const doc = await Victim_default.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!doc) {
    res.status(404).json({ error: "Victim not found" });
    return;
  }
  res.json({ ...doc, id: doc._id });
});
router5.delete("/:id", async (req, res) => {
  await Victim_default.findByIdAndDelete(req.params.id);
  res.json({ message: "Victim record deleted" });
});
var victims_default = router5;

// src/routes/suspects.ts
var import_express6 = require("express");
var import_uuid3 = require("uuid");
var import_mongoose20 = __toESM(require("mongoose"));
var router6 = (0, import_express6.Router)();
router6.use(authenticate);
router6.get("/", async (req, res) => {
  try {
    const { case_id, q, arrest_status, risk_level } = req.query;
    const filter = {};
    if (case_id && import_mongoose20.default.isValidObjectId(case_id)) filter.case_id = case_id;
    if (arrest_status) filter.arrest_status = arrest_status;
    if (risk_level) filter.risk_level = risk_level;
    if (q) {
      filter.$or = [
        { full_name: { $regex: q, $options: "i" } },
        { aliases: { $elemMatch: { $regex: q, $options: "i" } } },
        { phone: { $regex: q, $options: "i" } },
        { national_id: { $regex: q, $options: "i" } },
        { vehicle_numbers: { $elemMatch: { $regex: q, $options: "i" } } },
        { pan_number: { $regex: q, $options: "i" } },
        { voter_id: { $regex: q, $options: "i" } },
        { driving_license: { $regex: q, $options: "i" } }
      ];
    }
    const docs = await Suspect_default.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suspects", detail: String(err) });
  }
});
router6.get("/:id", async (req, res) => {
  try {
    if (!import_mongoose20.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const doc = await Suspect_default.findById(req.params.id).populate("linked_evidence", "title evidence_type is_verified").populate("linked_cases", "case_number title status").lean();
    if (!doc) {
      res.status(404).json({ error: "Suspect not found" });
      return;
    }
    res.json({ ...doc, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suspect", detail: String(err) });
  }
});
router6.post("/", async (req, res) => {
  try {
    const { case_id, full_name } = req.body;
    if (!case_id || !full_name?.trim()) {
      res.status(400).json({ error: "case_id and full_name are required" });
      return;
    }
    if (!import_mongoose20.default.isValidObjectId(case_id)) {
      res.status(400).json({ error: "Invalid case_id" });
      return;
    }
    const doc = await Suspect_default.create({
      ...req.body,
      aliases: req.body.aliases || [],
      vehicle_numbers: req.body.vehicle_numbers || [],
      known_associates: req.body.known_associates || [],
      criminal_history: req.body.criminal_history || [],
      linked_evidence: [],
      linked_cases: Array.isArray(req.body.linked_cases) ? req.body.linked_cases : [],
      activity_log: [{
        id: (0, import_uuid3.v4)(),
        type: "created",
        description: `Record created for ${full_name}`,
        performed_by: req.user.full_name || "Officer",
        createdAt: /* @__PURE__ */ new Date()
      }]
    });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create suspect record", detail: String(err) });
  }
});
router6.put("/:id", async (req, res) => {
  try {
    if (!import_mongoose20.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const allowed = [
      "full_name",
      "aliases",
      "age",
      "gender",
      "nationality",
      "religion",
      "occupation",
      "address",
      "phone",
      "email",
      "vehicle_numbers",
      "national_id",
      "pan_number",
      "passport_number",
      "voter_id",
      "driving_license",
      "description",
      "photo_url",
      "arrest_status",
      "arrest_date",
      "arresting_officer",
      "bail_status",
      "bail_date",
      "remand_end_date",
      "court_next_date",
      "criminal_history",
      "has_prior_record",
      "risk_level",
      "risk_summary",
      "risk_indicators",
      "flight_risk",
      "notes",
      "known_associates"
    ];
    const update = {};
    allowed.forEach((k) => {
      if (req.body[k] !== void 0) update[k] = req.body[k];
    });
    const existing = await Suspect_default.findById(req.params.id).select("arrest_status").lean();
    const logEntry = existing && req.body.arrest_status && req.body.arrest_status !== existing.arrest_status ? [{
      id: (0, import_uuid3.v4)(),
      type: "status_changed",
      description: `Arrest status changed to: ${req.body.arrest_status}`,
      performed_by: req.user.full_name || "Officer",
      createdAt: /* @__PURE__ */ new Date()
    }] : [];
    const doc = await Suspect_default.findByIdAndUpdate(
      req.params.id,
      {
        ...update,
        ...logEntry.length ? { $push: { activity_log: { $each: logEntry } } } : {}
      },
      { new: true }
    ).lean();
    if (!doc) {
      res.status(404).json({ error: "Suspect not found" });
      return;
    }
    res.json({ ...doc, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to update suspect", detail: String(err) });
  }
});
router6.delete("/:id", async (req, res) => {
  try {
    if (!import_mongoose20.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await Suspect_default.findByIdAndDelete(req.params.id);
    res.json({ message: "Suspect record deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete", detail: String(err) });
  }
});
router6.post("/:id/note", async (req, res) => {
  try {
    if (!import_mongoose20.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const { note } = req.body;
    if (!note?.trim()) {
      res.status(400).json({ error: "Note content is required" });
      return;
    }
    const doc = await Suspect_default.findByIdAndUpdate(
      req.params.id,
      {
        notes: note,
        $push: {
          activity_log: {
            id: (0, import_uuid3.v4)(),
            type: "note_added",
            description: "Investigation note updated",
            performed_by: req.user.full_name || "Officer",
            createdAt: /* @__PURE__ */ new Date()
          }
        }
      },
      { new: true }
    ).lean();
    if (!doc) {
      res.status(404).json({ error: "Suspect not found" });
      return;
    }
    res.json({ ...doc, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to save note", detail: String(err) });
  }
});
router6.post("/:id/criminal-history", async (req, res) => {
  try {
    if (!import_mongoose20.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const { case_number, offence, court, year, outcome, sentence, notes } = req.body;
    if (!offence || !court || !year) {
      res.status(400).json({ error: "offence, court, and year are required" });
      return;
    }
    const record = { id: (0, import_uuid3.v4)(), case_number: case_number || "", offence, court, year, outcome: outcome || "pending", sentence, notes };
    const logEntry = { id: (0, import_uuid3.v4)(), type: "case_linked", description: `Prior record added: ${offence} (${year})`, performed_by: req.user.full_name || "Officer", createdAt: /* @__PURE__ */ new Date() };
    const doc = await Suspect_default.findByIdAndUpdate(
      req.params.id,
      {
        has_prior_record: true,
        $push: { criminal_history: record, activity_log: logEntry }
      },
      { new: true }
    ).lean();
    if (!doc) {
      res.status(404).json({ error: "Suspect not found" });
      return;
    }
    res.json({ ...doc, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to add criminal history", detail: String(err) });
  }
});
router6.post("/:id/ai-risk", async (req, res) => {
  try {
    if (!import_mongoose20.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const suspect = await Suspect_default.findById(req.params.id).populate("linked_evidence", "title evidence_type").lean();
    if (!suspect) {
      res.status(404).json({ error: "Suspect not found" });
      return;
    }
    const prompt = `You are a senior criminal investigator. Analyze this suspect profile and produce an investigation risk assessment.

IMPORTANT: This is an investigative assessment tool ONLY.
- Do NOT label this person as guilty.
- Do NOT conclude they committed any crime.
- Only assess investigation risk factors and next steps.

Suspect Profile:
Name: ${suspect.full_name}
Aliases: ${(suspect.aliases || []).join(", ") || "None"}
Age: ${suspect.age || "Unknown"}
Occupation: ${suspect.occupation || "Unknown"}
Arrest Status: ${suspect.arrest_status}
Has Prior Record: ${suspect.has_prior_record ? "Yes" : "No"}
Prior Records: ${(suspect.criminal_history || []).length > 0 ? suspect.criminal_history.map((r) => `${r.offence} (${r.year}) \u2014 ${r.outcome}`).join("; ") : "None on file"}
Linked Evidence Count: ${(suspect.linked_evidence || []).length}
Notes: ${suspect.notes || "None"}

Respond ONLY with valid JSON:
{
  "risk_level": "low" | "medium" | "high" | "critical",
  "flight_risk": true | false,
  "risk_summary": "2-3 sentence professional investigative risk summary (no guilt implied)",
  "risk_indicators": ["indicator 1", "indicator 2", "indicator 3"],
  "recommended_actions": ["action 1", "action 2", "action 3"]
}`;
    const response = await callLLM(prompt);
    let parsed;
    try {
      const m = response.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      const j = m.match(/\{[\s\S]*\}/);
      parsed = j ? JSON.parse(j[0]) : null;
    } catch {
      parsed = null;
    }
    if (!parsed) {
      res.status(500).json({ error: "AI response parsing failed. Configure GEMINI_API_KEY for full analysis." });
      return;
    }
    const logEntry = {
      id: (0, import_uuid3.v4)(),
      type: "ai_analysis",
      description: `AI risk assessment completed \u2014 Level: ${parsed.risk_level}`,
      performed_by: req.user.full_name || "Officer",
      createdAt: /* @__PURE__ */ new Date()
    };
    await Suspect_default.findByIdAndUpdate(req.params.id, {
      risk_level: parsed.risk_level,
      risk_summary: parsed.risk_summary,
      risk_indicators: parsed.risk_indicators || [],
      flight_risk: parsed.flight_risk,
      $push: { activity_log: logEntry }
    });
    res.json({ ...parsed, disclaimer: "AI risk indicators are for investigative purposes only. This assessment does not imply guilt or conclude any criminal act." });
  } catch (err) {
    res.status(500).json({ error: "AI risk analysis failed", detail: String(err) });
  }
});
var suspects_default = router6;

// src/routes/documents.ts
var import_express7 = require("express");
var import_mongoose21 = __toESM(require("mongoose"));
var router7 = (0, import_express7.Router)();
router7.use(authenticate);
router7.get("/", async (req, res) => {
  const { case_id, document_type } = req.query;
  const filter = {};
  if (case_id) filter.case_id = case_id;
  if (document_type) filter.document_type = document_type;
  const docs = await CaseDocument_default.find(filter).populate("created_by", "full_name").sort({ createdAt: -1 }).lean();
  res.json(docs.map((d) => ({
    ...d,
    id: d._id,
    created_by_name: d.created_by?.full_name
  })));
});
router7.get("/:id", async (req, res) => {
  if (!import_mongoose21.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const doc = await CaseDocument_default.findById(req.params.id).lean();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json({ ...doc, id: doc._id });
});
router7.post("/", async (req, res) => {
  const { case_id, document_type, title, content, generated_by_ai } = req.body;
  if (!case_id || !document_type || !title) {
    res.status(400).json({ error: "case_id, document_type, and title are required" });
    return;
  }
  const doc = await CaseDocument_default.create({
    case_id,
    document_type,
    title,
    content,
    generated_by_ai: generated_by_ai || false,
    created_by: req.user.id
  });
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});
router7.put("/:id", async (req, res) => {
  if (!import_mongoose21.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { title, content, status } = req.body;
  const update = {};
  if (title !== void 0) update.title = title;
  if (content !== void 0) update.content = content;
  if (status !== void 0) update.status = status;
  const doc = await CaseDocument_default.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json({ ...doc, id: doc._id });
});
router7.delete("/:id", async (req, res) => {
  await CaseDocument_default.findByIdAndDelete(req.params.id);
  res.json({ message: "Document deleted" });
});
var documents_default = router7;

// src/routes/legal.ts
var import_express8 = require("express");
var import_mongoose23 = __toESM(require("mongoose"));
var import_uuid4 = require("uuid");

// src/models/LegalProvision.ts
var import_mongoose22 = __toESM(require("mongoose"));
var LegalProvisionSchema = new import_mongoose22.Schema(
  {
    act_name: { type: String, required: true },
    section: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    plain_language: String,
    typical_evidence: [String],
    related_sections: [String],
    offense_category: String,
    punishment: String,
    is_bailable: Boolean,
    is_cognizable: Boolean,
    keywords: [String]
  },
  { timestamps: true }
);
LegalProvisionSchema.index({ act_name: "text", title: "text", description: "text", keywords: "text" });
LegalProvisionSchema.index({ section: 1, act_name: 1 });
var LegalProvision_default = import_mongoose22.default.model("LegalProvision", LegalProvisionSchema);

// src/routes/legal.ts
var router8 = (0, import_express8.Router)();
router8.use(authenticate);
router8.get("/provisions", async (req, res) => {
  try {
    const { search, act, category, page = "1", limit = "30" } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { section: { $regex: search, $options: "i" } },
        { keywords: { $elemMatch: { $regex: search, $options: "i" } } },
        { plain_language: { $regex: search, $options: "i" } }
      ];
    }
    if (act) filter.act_name = { $regex: act, $options: "i" };
    if (category) filter.offense_category = { $regex: category, $options: "i" };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [docs, total] = await Promise.all([
      LegalProvision_default.find(filter).skip(skip).limit(parseInt(limit)).lean(),
      LegalProvision_default.countDocuments(filter)
    ]);
    res.json({
      provisions: docs.map((p) => ({ ...p, id: p._id })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch provisions", detail: String(err) });
  }
});
router8.get("/provisions/:id", async (req, res) => {
  try {
    if (!import_mongoose23.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const p = await LegalProvision_default.findById(req.params.id).lean();
    if (!p) {
      res.status(404).json({ error: "Provision not found" });
      return;
    }
    res.json({ ...p, id: p._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch provision", detail: String(err) });
  }
});
router8.post("/analyze", async (req, res) => {
  const { case_id, fir_text, additional_context, save_to_case = true } = req.body;
  if (!case_id && !fir_text) {
    res.status(400).json({ error: "Provide either case_id or fir_text" });
    return;
  }
  if (case_id && !import_mongoose23.default.isValidObjectId(case_id)) {
    res.status(400).json({ error: "Invalid case_id" });
    return;
  }
  try {
    let contextParts = [];
    let caseTitle = "";
    let crimeType = "";
    if (case_id) {
      const [caseDoc, evidence, witnesses] = await Promise.all([
        Case_default.findById(case_id).lean(),
        Evidence_default.find({ case_id }).select("title evidence_type description is_verified").limit(10).lean(),
        Witness_default.find({ case_id }).select("full_name witness_type statement_summary statements").limit(5).lean()
      ]);
      if (!caseDoc) {
        res.status(404).json({ error: "Case not found" });
        return;
      }
      caseTitle = caseDoc.title || "";
      crimeType = caseDoc.crime_type || "";
      contextParts.push(`Case Title: ${caseTitle}`);
      contextParts.push(`Crime Type: ${crimeType}`);
      contextParts.push(`Case Status: ${caseDoc.status}`);
      if (caseDoc.description) contextParts.push(`Case Description: ${caseDoc.description}`);
      if (caseDoc.ai_summary) contextParts.push(`AI Summary: ${caseDoc.ai_summary}`);
      if (evidence.length > 0) {
        contextParts.push(`
Evidence on record (${evidence.length} items):`);
        evidence.forEach((e) => {
          contextParts.push(`  - ${e.title} [${e.evidence_type}] ${e.is_verified ? "(verified)" : "(pending)"}`);
        });
      }
      if (witnesses.length > 0) {
        contextParts.push(`
Witnesses (${witnesses.length}):`);
        witnesses.forEach((w) => {
          const summary = w.statement_summary || w.statements?.[0]?.content?.substring(0, 150) || "No statement summary";
          contextParts.push(`  - ${w.full_name} [${w.witness_type}]: ${summary}`);
        });
      }
    }
    if (fir_text) contextParts.push(`
FIR / Complaint Text:
${fir_text}`);
    if (additional_context) contextParts.push(`
Additional Context:
${additional_context}`);
    const fullContext = contextParts.join("\n");
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
    let parsed;
    try {
      const cleaned = aiResponse.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }
    if (!parsed?.provisions) {
      res.status(500).json({
        error: "AI response parsing failed. Ensure GEMINI_API_KEY is configured.",
        raw: aiResponse.substring(0, 300)
      });
      return;
    }
    const analysisRunId = (0, import_uuid4.v4)();
    const savedProvisions = [];
    if (case_id && save_to_case) {
      for (const p of parsed.provisions) {
        try {
          let provisionId = null;
          const dbProvision = await LegalProvision_default.findOne({
            section: p.section,
            act_name: { $regex: p.act_name.substring(0, 20), $options: "i" }
          }).lean();
          if (dbProvision) {
            provisionId = String(dbProvision._id);
          } else {
            const newProv = await LegalProvision_default.create({
              section: p.section,
              act_name: p.act_name,
              title: p.title,
              plain_language: p.plain_language,
              offense_category: parsed.crime_category,
              punishment: p.punishment,
              is_bailable: p.is_bailable,
              is_cognizable: p.is_cognizable,
              typical_evidence: p.required_evidence || [],
              keywords: [p.title, p.section, p.act_name]
            });
            provisionId = String(newProv._id);
          }
          const existing = await CaseLegalProvision_default.findOne({ case_id, provision_id: provisionId });
          if (!existing) {
            const saved = await CaseLegalProvision_default.create({
              case_id,
              provision_id: provisionId,
              confidence_score: p.confidence || 0.5,
              ai_reasoning: p.why_applicable,
              why_applicable: p.why_applicable,
              required_evidence: p.required_evidence || [],
              investigation_notes: p.investigation_notes,
              status: "suggested",
              analysis_run_id: analysisRunId
            });
            savedProvisions.push(saved);
          }
        } catch (saveErr) {
          logger.warn("Failed to save one provision", { err: String(saveErr) });
        }
      }
    }
    res.json({
      ...parsed,
      analysis_run_id: analysisRunId,
      case_id,
      provisions_saved: savedProvisions.length,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    logger.error("Legal analysis failed", { err: String(err).substring(0, 200) });
    res.status(500).json({ error: "Legal analysis failed", detail: String(err) });
  }
});
router8.get("/case-provisions/:caseId", async (req, res) => {
  try {
    const { status, run_id } = req.query;
    const filter = { case_id: req.params.caseId };
    if (status) filter.status = status;
    if (run_id) filter.analysis_run_id = run_id;
    const docs = await CaseLegalProvision_default.find(filter).populate("provision_id").populate("reviewed_by", "full_name").sort({ confidence_score: -1 }).lean();
    res.json(docs.map((d) => {
      const prov = d.provision_id;
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
        is_cognizable: prov?.is_cognizable
      };
    }));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch case provisions", detail: String(err) });
  }
});
router8.post("/case-provisions", async (req, res) => {
  try {
    const {
      case_id,
      provision_id,
      confidence_score,
      ai_reasoning,
      why_applicable,
      required_evidence,
      investigation_notes,
      status
    } = req.body;
    if (!case_id || !provision_id) {
      res.status(400).json({ error: "case_id and provision_id are required" });
      return;
    }
    const existing = await CaseLegalProvision_default.findOne({ case_id, provision_id });
    if (existing) {
      const populated = await CaseLegalProvision_default.findById(existing._id).populate("provision_id").lean();
      res.json({ ...populated || {}, id: existing._id });
      return;
    }
    const doc = await CaseLegalProvision_default.create({
      case_id,
      provision_id,
      confidence_score: confidence_score || 0.5,
      ai_reasoning,
      why_applicable,
      required_evidence: required_evidence || [],
      investigation_notes,
      status: status || "suggested"
    });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to add provision", detail: String(err) });
  }
});
router8.put("/case-provisions/:id", async (req, res) => {
  try {
    if (!import_mongoose23.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const { status, review_notes } = req.body;
    const doc = await CaseLegalProvision_default.findByIdAndUpdate(
      req.params.id,
      { status, review_notes, reviewed_by: req.user.id, reviewed_at: /* @__PURE__ */ new Date() },
      { new: true }
    ).populate("provision_id").lean();
    if (!doc) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    res.json({ ...doc, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to update", detail: String(err) });
  }
});
router8.delete("/case-provisions/:id", async (req, res) => {
  try {
    if (!import_mongoose23.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await CaseLegalProvision_default.findByIdAndDelete(req.params.id);
    res.json({ message: "Provision removed from case" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete", detail: String(err) });
  }
});
router8.get("/checklist/:caseId", async (req, res) => {
  try {
    const doc = await Checklist_default.findOne({ case_id: req.params.caseId }).lean();
    res.json(doc ? { ...doc, id: doc._id } : null);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch checklist", detail: String(err) });
  }
});
router8.post("/checklist", async (req, res) => {
  try {
    const { case_id, crime_type, title, items } = req.body;
    const existing = await Checklist_default.findOne({ case_id });
    if (existing) {
      existing.items = items;
      existing.title = title;
      await existing.save();
      res.json({ ...existing.toObject(), id: existing._id });
      return;
    }
    const doc = await Checklist_default.create({ case_id, crime_type, title, items: items || [], created_by: req.user.id });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create checklist", detail: String(err) });
  }
});
router8.put("/checklist/:id/item", async (req, res) => {
  try {
    if (!import_mongoose23.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const { item_id, completed, notes } = req.body;
    const checklist = await Checklist_default.findById(req.params.id);
    if (!checklist) {
      res.status(404).json({ error: "Checklist not found" });
      return;
    }
    checklist.items = checklist.items.map(
      (item) => item.id === item_id ? { ...item, completed, notes, updated_at: /* @__PURE__ */ new Date() } : item
    );
    const done = checklist.items.filter((i) => i.completed).length;
    checklist.progress = checklist.items.length > 0 ? Math.round(done / checklist.items.length * 100) : 0;
    await checklist.save();
    res.json({ ...checklist.toObject(), id: checklist._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to update item", detail: String(err) });
  }
});
var legal_default = router8;

// src/routes/ai.ts
var import_express9 = require("express");
var import_multer2 = __toESM(require("multer"));
var import_path3 = __toESM(require("path"));
var import_fs2 = __toESM(require("fs"));

// src/models/AIChatSession.ts
var import_mongoose24 = __toESM(require("mongoose"));
var AIChatSessionSchema = new import_mongoose24.Schema(
  {
    case_id: { type: import_mongoose24.Schema.Types.ObjectId, ref: "Case" },
    user_id: { type: import_mongoose24.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);
AIChatSessionSchema.index({ user_id: 1, updatedAt: -1 });
var AIChatSession_default = import_mongoose24.default.model("AIChatSession", AIChatSessionSchema);

// src/routes/ai.ts
var router9 = (0, import_express9.Router)();
router9.use(authenticate);
var upload2 = (0, import_multer2.default)({
  storage: import_multer2.default.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/tiff",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});
router9.post("/analyze-fir", async (req, res) => {
  const { text, case_id } = req.body;
  if (!text?.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    const analysis = await analyzeDocument(text, "fir");
    if (case_id) {
      await Case_default.findByIdAndUpdate(case_id, {
        ai_summary: analysis.summary,
        ai_extracted_facts: analysis
      });
    }
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: "AI analysis failed", details: String(err) });
  }
});
router9.post("/analyze-fir-file", upload2.single("file"), async (req, res) => {
  const file = req.file;
  const case_id = req.body?.case_id;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  try {
    const base64 = file.buffer.toString("base64");
    const mime = file.mimetype;
    const extractedText = await extractTextFromFile(base64, mime);
    if (!extractedText.trim()) {
      res.status(422).json({ error: "Could not extract text from file. Please ensure the file is readable." });
      return;
    }
    const analysis = await analyzeDocument(extractedText, "fir");
    if (case_id) {
      await Case_default.findByIdAndUpdate(case_id, {
        ai_summary: analysis.summary,
        ai_extracted_facts: analysis
      });
    }
    res.json({ ...analysis, extracted_text: extractedText, file_name: file.originalname });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("FIR file analysis failed", { err: msg.substring(0, 200) });
    res.status(500).json({ error: "File analysis failed", detail: msg });
  }
});
router9.post("/extract-entities", async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    const entities = await extractEntities(text);
    res.json(entities);
  } catch (err) {
    res.status(500).json({ error: "Entity extraction failed" });
  }
});
router9.post("/generate-checklist", async (req, res) => {
  const { crime_type, case_description } = req.body;
  if (!crime_type?.trim()) {
    res.status(400).json({ error: "crime_type is required" });
    return;
  }
  try {
    const checklist = await generateChecklist(crime_type, case_description);
    res.json(checklist);
  } catch (err) {
    res.status(500).json({ error: "Checklist generation failed" });
  }
});
router9.post("/recommend-provisions", async (req, res) => {
  const { case_description, crime_type, facts } = req.body;
  if (!case_description?.trim()) {
    res.status(400).json({ error: "case_description is required" });
    return;
  }
  try {
    const provisions = await recommendProvisions(case_description, crime_type, facts);
    res.json({
      provisions,
      disclaimer: "AI recommendations are advisory only and require review by a qualified legal professional."
    });
  } catch (err) {
    res.status(500).json({ error: "Provision recommendation failed" });
  }
});
router9.post("/missing-evidence", async (req, res) => {
  const { case_id, crime_type } = req.body;
  if (!case_id) {
    res.status(400).json({ error: "case_id is required" });
    return;
  }
  try {
    const [caseDoc, evidenceDocs] = await Promise.all([
      Case_default.findById(case_id).lean(),
      Evidence_default.find({ case_id }).select("title").lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const existingEvidence = evidenceDocs.map((e) => e.title);
    const effectiveCrimeType = crime_type || caseDoc.crime_type || "criminal";
    const missing = await detectMissingEvidence(effectiveCrimeType, caseDoc.title, existingEvidence);
    res.json({ missing_evidence: missing });
  } catch (err) {
    res.status(500).json({ error: "Missing evidence analysis failed" });
  }
});
router9.post("/generate-document", async (req, res) => {
  const { case_id, document_type } = req.body;
  if (!case_id || !document_type) {
    res.status(400).json({ error: "case_id and document_type are required" });
    return;
  }
  try {
    const [caseDoc, evidenceDocs, witnessDocs, victimDocs, suspectDocs, provisionDocs] = await Promise.all([
      Case_default.findById(case_id).lean(),
      Evidence_default.find({ case_id }).lean(),
      Witness_default.find({ case_id }).lean(),
      Victim_default.find({ case_id }).lean(),
      Suspect_default.find({ case_id }).lean(),
      CaseLegalProvision_default.find({ case_id }).populate("provision_id").lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const context = {
      case: caseDoc,
      evidence: evidenceDocs,
      witnesses: witnessDocs,
      victims: victimDocs,
      suspects: suspectDocs,
      provisions: provisionDocs
    };
    const content = await generateDocument(document_type, context);
    const docRecord = await CaseDocument_default.create({
      case_id,
      document_type,
      title: `${document_type.replace(/_/g, " ").toUpperCase()} \u2014 ${caseDoc.case_number}`,
      content,
      generated_by_ai: true,
      status: "draft",
      created_by: req.user.id
    });
    res.json({ ...docRecord.toObject(), id: docRecord._id });
  } catch (err) {
    res.status(500).json({ error: "Document generation failed", details: String(err) });
  }
});
router9.post("/risk-analysis", async (req, res) => {
  const { case_id } = req.body;
  if (!case_id) {
    res.status(400).json({ error: "case_id is required" });
    return;
  }
  try {
    const [caseDoc, evidenceCount, witnessCount, docStatuses] = await Promise.all([
      Case_default.findById(case_id).lean(),
      Evidence_default.countDocuments({ case_id }),
      Witness_default.countDocuments({ case_id }),
      CaseDocument_default.find({ case_id }).select("status").lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const documentStatuses = docStatuses.map((d) => d.status);
    const { risks, completeness } = await analyzeRisk(
      caseDoc,
      evidenceCount,
      witnessCount,
      documentStatuses
    );
    res.json({ risks, completeness, case_id });
  } catch (err) {
    res.status(500).json({ error: "Risk analysis failed" });
  }
});
router9.post("/chat", async (req, res) => {
  const { message, session_id, case_id, stream } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  try {
    let caseContext = "";
    if (case_id) {
      const [caseDoc, evidenceList, witnessList, suspectList] = await Promise.all([
        Case_default.findById(case_id).select("title description crime_type ai_summary status priority location io_name").lean(),
        Evidence_default.find({ case_id }).select("title evidence_type is_verified").limit(10).lean(),
        Witness_default.find({ case_id }).select("full_name statement_summary").limit(5).lean(),
        Suspect_default.find({ case_id }).select("full_name status").limit(5).lean()
      ]);
      if (caseDoc) {
        caseContext = [
          `

## Active Case Context`,
          `Case Title: ${caseDoc.title}`,
          `Crime Type: ${caseDoc.crime_type || "Unknown"}`,
          `Status: ${caseDoc.status} | Priority: ${caseDoc.priority}`,
          `Location: ${caseDoc.location || "Not specified"}`,
          `IO: ${caseDoc.io_name || "Not assigned"}`,
          caseDoc.ai_summary ? `AI Summary: ${caseDoc.ai_summary}` : "",
          evidenceList.length ? `Evidence on record (${evidenceList.length}): ${evidenceList.map((e) => e.title).join(", ")}` : "",
          witnessList.length ? `Witnesses (${witnessList.length}): ${witnessList.map((w) => w.full_name).join(", ")}` : "",
          suspectList.length ? `Suspects (${suspectList.length}): ${suspectList.map((s) => s.full_name).join(", ")}` : ""
        ].filter(Boolean).join("\n");
      }
    }
    const systemPrompt = `You are JusticeAI \u2014 an elite AI assistant for criminal investigators, forensic experts, public prosecutors, and legal professionals in India.

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
- Natural, intelligent, and professional \u2014 like a trusted senior colleague explaining something clearly
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
- **BNS 2023** (Bharatiya Nyaya Sanhita) \u2014 replaced IPC
- **BNSS 2023** (Bharatiya Nagarik Suraksha Sanhita) \u2014 replaced CrPC
- **BSA 2023** (Bharatiya Sakshya Adhiniyam) \u2014 replaced Indian Evidence Act
- **IT Act 2000** and amendments
- **POCSO Act 2012**
- **NDPS Act 1985**
- **Prevention of Corruption Act 1988**
- **Prevention of Money Laundering Act 2002**
- Supreme Court and High Court landmark judgments
- NCRB investigation standards and procedures

## Important Disclaimers
- Legal recommendations are advisory only \u2014 must be verified by a qualified advocate
- Investigation suggestions require review by the supervising officer
- You do NOT determine guilt or innocence \u2014 that is the court's role
${caseContext}`;
    let history = [];
    if (session_id) {
      const session = await AIChatSession_default.findOne({ _id: session_id, user_id: req.user.id });
      if (session) {
        history = session.messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      }
    }
    const userMsg = { role: "user", content: message, timestamp: /* @__PURE__ */ new Date() };
    if (stream === true) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      let fullResponse = "";
      try {
        const contents = [];
        if (history.length === 0) {
          contents.push({ role: "user", parts: [{ text: `${systemPrompt}

---

User: ${message}` }] });
        } else {
          const [first, ...rest] = history;
          contents.push({ role: "user", parts: [{ text: `${systemPrompt}

---

User: ${first.content}` }] });
          rest.forEach((m) => {
            contents.push({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] });
          });
          contents.push({ role: "user", parts: [{ text: message }] });
        }
        await callGeminiStream(contents, (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}

`);
        });
      } catch (streamErr) {
        logger.error("Streaming error", { err: String(streamErr) });
        fullResponse = "I encountered an error generating the response. Please try again.";
        res.write(`data: ${JSON.stringify({ chunk: fullResponse })}

`);
      }
      const assistantMsg2 = { role: "assistant", content: fullResponse, timestamp: /* @__PURE__ */ new Date() };
      let currentSessionId2 = session_id;
      if (session_id) {
        await AIChatSession_default.findByIdAndUpdate(session_id, {
          $push: { messages: { $each: [userMsg, assistantMsg2] } },
          updatedAt: /* @__PURE__ */ new Date()
        });
      } else {
        const newSession = await AIChatSession_default.create({
          case_id: case_id || void 0,
          user_id: req.user.id,
          title: message.substring(0, 80),
          messages: [userMsg, assistantMsg2]
        });
        currentSessionId2 = String(newSession._id);
      }
      res.write(`data: ${JSON.stringify({ done: true, session_id: currentSessionId2 })}

`);
      res.end();
      return;
    }
    const response = await chatWithHistory(systemPrompt, history, message);
    const assistantMsg = { role: "assistant", content: response, timestamp: /* @__PURE__ */ new Date() };
    let currentSessionId = session_id;
    if (session_id) {
      await AIChatSession_default.findByIdAndUpdate(session_id, {
        $push: { messages: { $each: [userMsg, assistantMsg] } },
        updatedAt: /* @__PURE__ */ new Date()
      });
    } else {
      const newSession = await AIChatSession_default.create({
        case_id: case_id || void 0,
        user_id: req.user.id,
        title: message.substring(0, 80),
        messages: [userMsg, assistantMsg]
      });
      currentSessionId = String(newSession._id);
    }
    res.json({ response, session_id: currentSessionId });
  } catch (err) {
    res.status(500).json({ error: "AI chat failed", details: String(err) });
  }
});
router9.get("/chat/sessions", async (req, res) => {
  const sessions = await AIChatSession_default.find({ user_id: req.user.id }).select("title case_id createdAt updatedAt").sort({ updatedAt: -1 }).limit(20).lean();
  res.json(sessions.map((s) => ({ ...s, id: s._id })));
});
router9.get("/chat/sessions/:id", async (req, res) => {
  const session = await AIChatSession_default.findOne({
    _id: req.params.id,
    user_id: req.user.id
  }).lean();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ ...session, id: session._id });
});
router9.post("/analyze-evidence", upload2.single("file"), async (req, res) => {
  const { evidence_id, title, evidence_type, description } = req.body;
  if (!title || !evidence_type) {
    res.status(400).json({ error: "title and evidence_type are required" });
    return;
  }
  try {
    let base64;
    let mime;
    if (req.file) {
      base64 = req.file.buffer.toString("base64");
      mime = req.file.mimetype;
    } else if (evidence_id) {
      const ev = await Evidence_default.findById(evidence_id).lean();
      if (ev?.file_url) {
        const filePath = import_path3.default.resolve(process.cwd(), ev.file_url.replace(/^\//, ""));
        if (import_fs2.default.existsSync(filePath)) {
          base64 = import_fs2.default.readFileSync(filePath).toString("base64");
          mime = ev.mime_type || "image/jpeg";
        }
      }
    }
    const analysis = await analyzeEvidence(
      title,
      evidence_type,
      description || "",
      base64,
      mime
    );
    if (evidence_id) {
      await Evidence_default.findByIdAndUpdate(evidence_id, { ai_summary: analysis.summary });
    }
    res.json(analysis);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Evidence analysis failed", { err: msg.substring(0, 200) });
    res.status(500).json({ error: "Evidence analysis failed", detail: msg });
  }
});
router9.post("/risk-report", async (req, res) => {
  const { case_id } = req.body;
  if (!case_id) {
    res.status(400).json({ error: "case_id is required" });
    return;
  }
  try {
    const [caseDoc, evidenceDocs, witnessCount, suspectCount, victimCount, docStatuses] = await Promise.all([
      Case_default.findById(case_id).lean(),
      Evidence_default.find({ case_id }).select("title").lean(),
      Witness_default.countDocuments({ case_id }),
      Suspect_default.countDocuments({ case_id }),
      Victim_default.countDocuments({ case_id }),
      CaseDocument_default.find({ case_id }).select("status").lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const report = await generateRiskReport(
      caseDoc,
      evidenceDocs.length,
      witnessCount,
      suspectCount,
      victimCount,
      docStatuses.map((d) => d.status),
      caseDoc.crime_type || "criminal",
      evidenceDocs.map((e) => e.title)
    );
    res.json({ ...report, case_id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Risk report generation failed", detail: msg });
  }
});
var ai_default = router9;

// src/routes/dashboard.ts
var import_express10 = require("express");

// src/models/Notification.ts
var import_mongoose25 = __toESM(require("mongoose"));
var NotificationSchema = new import_mongoose25.Schema(
  {
    user_id: { type: import_mongoose25.Schema.Types.ObjectId, ref: "User", required: true },
    case_id: { type: import_mongoose25.Schema.Types.ObjectId, ref: "Case" },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: String,
    is_read: { type: Boolean, default: false },
    action_url: String
  },
  { timestamps: true }
);
NotificationSchema.index({ user_id: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1 });
var Notification_default = import_mongoose25.default.model("Notification", NotificationSchema);

// src/routes/dashboard.ts
var router10 = (0, import_express10.Router)();
router10.use(authenticate);
router10.get("/", async (req, res) => {
  const userId = req.user.id;
  const isAdmin = ["admin", "super_admin"].includes(req.user.role);
  const caseFilter = {};
  if (!isAdmin) {
    caseFilter.$or = [
      { assigned_io: userId },
      { assigned_sho: userId },
      { prosecutor_id: userId },
      { created_by: userId }
    ];
  }
  const [
    totalCases,
    openCases,
    casesByStatus,
    recentCases,
    totalWitnesses,
    totalSuspects,
    unverifiedEvidence,
    recentNotifications
  ] = await Promise.all([
    Case_default.countDocuments(caseFilter),
    Case_default.countDocuments({ ...caseFilter, status: "open" }),
    Case_default.aggregate([
      { $match: caseFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Case_default.find(caseFilter).populate("assigned_io", "full_name").sort({ updatedAt: -1 }).limit(5).lean(),
    Witness_default.countDocuments(isAdmin ? {} : { case_id: { $in: await Case_default.distinct("_id", caseFilter) } }),
    Suspect_default.countDocuments(isAdmin ? {} : { case_id: { $in: await Case_default.distinct("_id", caseFilter) } }),
    Evidence_default.countDocuments({ is_verified: false }),
    Notification_default.find({ user_id: userId }).sort({ createdAt: -1 }).limit(5).lean()
  ]);
  const statusMap = {};
  casesByStatus.forEach((s) => {
    statusMap[s._id] = s.count;
  });
  res.json({
    stats: {
      total_cases: totalCases,
      open_cases: openCases,
      total_witnesses: totalWitnesses,
      total_suspects: totalSuspects,
      unverified_evidence: unverifiedEvidence
    },
    cases_by_status: statusMap,
    recent_cases: recentCases.map((c) => ({
      ...c,
      id: c._id,
      io_name: c.assigned_io?.full_name
    })),
    recent_notifications: recentNotifications.map((n) => ({ ...n, id: n._id }))
  });
});
var dashboard_default = router10;

// src/routes/notifications.ts
var import_express11 = require("express");
var router11 = (0, import_express11.Router)();
router11.use(authenticate);
router11.get("/", async (req, res) => {
  const { unread } = req.query;
  const filter = { user_id: req.user.id };
  if (unread === "true") filter.is_read = false;
  const docs = await Notification_default.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  res.json(docs.map((d) => ({ ...d, id: d._id })));
});
router11.put("/:id/read", async (req, res) => {
  await Notification_default.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { is_read: true }
  );
  res.json({ message: "Marked as read" });
});
router11.put("/read-all", async (req, res) => {
  await Notification_default.updateMany({ user_id: req.user.id }, { is_read: true });
  res.json({ message: "All notifications marked as read" });
});
router11.delete("/:id", async (req, res) => {
  await Notification_default.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
  res.json({ message: "Notification deleted" });
});
var notifications_default = router11;

// src/routes/admin.ts
var import_express12 = require("express");
var import_mongoose26 = __toESM(require("mongoose"));
var router12 = (0, import_express12.Router)();
router12.use(authenticate);
router12.use(authorize("admin", "super_admin"));
router12.get("/users", async (_req, res) => {
  const users = await User_default.find().select("-password_hash -two_factor_secret").sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => ({ ...u, id: u._id })));
});
router12.put("/users/:id", async (req, res) => {
  if (!import_mongoose26.default.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { role, is_active, department, station } = req.body;
  const update = {};
  if (role !== void 0) update.role = role;
  if (is_active !== void 0) update.is_active = is_active;
  if (department !== void 0) update.department = department;
  if (station !== void 0) update.station = station;
  const user = await User_default.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password_hash -two_factor_secret").lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ ...user, id: user._id });
});
router12.delete("/users/:id", async (_req, res) => {
  await User_default.findByIdAndUpdate(_req.params.id, { is_active: false });
  res.json({ message: "User deactivated" });
});
router12.get("/audit-logs", async (req, res) => {
  const { user_id, resource_type, page = "1", limit = "50" } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (user_id) filter.user_id = user_id;
  if (resource_type) filter.resource_type = resource_type;
  const logs = await AuditLog_default.find(filter).populate("user_id", "full_name email").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();
  res.json(logs.map((l) => {
    const u = l.user_id;
    return { ...l, id: l._id, full_name: u?.full_name, email: u?.email };
  }));
});
router12.get("/stats", async (_req, res) => {
  const [users, cases, evidence, witnesses, suspects] = await Promise.all([
    User_default.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $project: { role: "$_id", count: 1, _id: 0 } }]),
    Case_default.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { status: "$_id", count: 1, _id: 0 } }]),
    Evidence_default.aggregate([{ $group: { _id: "$evidence_type", count: { $sum: 1 } } }, { $project: { evidence_type: "$_id", count: 1, _id: 0 } }]),
    Witness_default.countDocuments(),
    Suspect_default.countDocuments()
  ]);
  res.json({ users, cases, evidence, total_witnesses: witnesses, total_suspects: suspects });
});
router12.post("/legal-provisions", async (req, res) => {
  const doc = await LegalProvision_default.create(req.body);
  res.status(201).json({ ...doc.toObject(), id: doc._id });
});
var admin_default = router12;

// src/routes/analytics.ts
var import_express13 = require("express");
var router13 = (0, import_express13.Router)();
router13.use(authenticate);
router13.get("/", async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
  const toDate = to ? new Date(to) : /* @__PURE__ */ new Date();
  const dateFilter = { $gte: fromDate, $lte: toDate };
  const [casesByMonth, casesByType, evidenceByType, casesByStatus, topOfficers] = await Promise.all([
    // Cases grouped by year-month
    Case_default.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { month: "$_id", count: 1, _id: 0 } }
    ]),
    // Cases by crime type
    Case_default.aggregate([
      { $match: { createdAt: dateFilter, crime_type: { $ne: null } } },
      { $group: { _id: "$crime_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { crime_type: "$_id", count: 1, _id: 0 } }
    ]),
    // Evidence by type
    Evidence_default.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: "$evidence_type", count: { $sum: 1 } } },
      { $project: { evidence_type: "$_id", count: 1, _id: 0 } }
    ]),
    // All cases by status (not date-filtered)
    Case_default.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } }
    ]),
    // Top officers by case count
    Case_default.aggregate([
      { $match: { createdAt: dateFilter, assigned_io: { $ne: null } } },
      { $group: { _id: "$assigned_io", case_count: { $sum: 1 } } },
      { $sort: { case_count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "officer"
        }
      },
      { $unwind: "$officer" },
      { $project: { full_name: "$officer.full_name", case_count: 1, _id: 0 } }
    ])
  ]);
  res.json({
    cases_by_month: casesByMonth,
    cases_by_type: casesByType,
    evidence_by_type: evidenceByType,
    cases_by_status: casesByStatus,
    top_officers: topOfficers
  });
});
var analytics_default = router13;

// src/routes/caseFiling.ts
var import_express14 = require("express");
var router14 = (0, import_express14.Router)();
router14.use(authenticate);
router14.post("/analyze", async (req, res) => {
  const {
    crime_type,
    incident_description,
    incident_date,
    incident_location,
    victim_details,
    accused_details,
    additional_facts
  } = req.body;
  if (!crime_type || !incident_description) {
    res.status(400).json({ error: "crime_type and incident_description are required" });
    return;
  }
  const MAX_DESC = 1500;
  const MAX_FACTS = 500;
  const truncatedDescription = incident_description.length > MAX_DESC ? incident_description.substring(0, MAX_DESC) + "..." : incident_description;
  const truncatedFacts = additional_facts && additional_facts.length > MAX_FACTS ? additional_facts.substring(0, MAX_FACTS) + "..." : additional_facts;
  try {
    const fullText = `${crime_type} ${truncatedDescription} ${truncatedFacts || ""}`;
    const dbMatches = await LegalProvision_default.find({}).lean();
    const scored = dbMatches.map((p) => {
      const kws = p.keywords || [];
      let score = 0;
      kws.forEach((kw) => {
        if (fullText.toLowerCase().includes(kw.toLowerCase())) score += 2;
      });
      if (p.offense_category && fullText.toLowerCase().includes(p.offense_category.toLowerCase())) score += 1;
      return { p, score };
    }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
    const topProvisions = scored.map((s) => s.p);
    const provisionsContext = topProvisions.map(
      (p) => `Section ${p.section} ${p.act_name} \u2014 ${p.title}: ${p.plain_language}`
    ).join("\n");
    const prompt = `You are a senior Indian police officer and legal expert with 20 years of experience.

A police officer has filed the following FIR/case details:

Crime Type: ${crime_type}
Incident Description: ${truncatedDescription}
Date/Time: ${incident_date || "Not specified"}
Location: ${incident_location || "Not specified"}
Victim Details: ${victim_details ? victim_details.substring(0, 300) : "Not specified"}
Accused Details: ${accused_details ? accused_details.substring(0, 300) : "Not specified"}
Additional Facts: ${truncatedFacts || "None"}

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
  "arrest_powers": "Whether this is cognizable offence \u2014 can police arrest without warrant?"
}`;
    const aiResponse = await callLLM(prompt);
    let aiData;
    try {
      const stripped = aiResponse.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      aiData = {
        applicable_sections: topProvisions.slice(0, 3).map((p) => ({
          section: p.section,
          act_name: p.act_name,
          why_applicable: `This section applies based on the nature of the ${crime_type} offence described.`,
          confidence: "medium"
        })),
        investigation_procedure: defaultProcedure(crime_type),
        immediate_actions: defaultImmediateActions(),
        important_notes: ["All legal actions must be reviewed by a senior officer."],
        court_jurisdiction: "Magistrate Court having territorial jurisdiction over the incident location.",
        arrest_powers: topProvisions.some((p) => p.is_cognizable) ? "This is a COGNIZABLE offence \u2014 police CAN arrest without warrant under BNSS Section 35." : "This is a NON-COGNIZABLE offence \u2014 police require a magistrate warrant to arrest."
      };
    }
    const matchedSections = [];
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
            description: dbProv.description || "",
            plain_language: dbProv.plain_language || "",
            offense_category: dbProv.offense_category || "",
            punishment: dbProv.punishment || "",
            is_bailable: dbProv.is_bailable ?? false,
            is_cognizable: dbProv.is_cognizable ?? true,
            typical_evidence: dbProv.typical_evidence || [],
            why_applicable: aiSec.why_applicable,
            confidence: aiSec.confidence || "medium"
          });
        }
      }
    }
    if (matchedSections.length === 0 && topProvisions.length > 0) {
      topProvisions.slice(0, 3).forEach((p) => {
        matchedSections.push({
          _id: String(p._id),
          act_name: p.act_name,
          section: p.section,
          title: p.title,
          description: p.description || "",
          plain_language: p.plain_language || "",
          offense_category: p.offense_category || "",
          punishment: p.punishment || "",
          is_bailable: p.is_bailable ?? false,
          is_cognizable: p.is_cognizable ?? true,
          typical_evidence: p.typical_evidence || [],
          why_applicable: `Applicable based on the ${crime_type} nature of the offence.`,
          confidence: "medium"
        });
      });
    }
    const result = {
      matched_sections: matchedSections,
      investigation_procedure: aiData?.investigation_procedure || defaultProcedure(crime_type),
      immediate_actions: aiData?.immediate_actions || defaultImmediateActions(),
      important_notes: aiData?.important_notes || [],
      court_jurisdiction: aiData?.court_jurisdiction || "Magistrate Court having territorial jurisdiction.",
      arrest_powers: aiData?.arrest_powers || (matchedSections.some((s) => s.is_cognizable) ? "COGNIZABLE offence \u2014 police CAN arrest without warrant (BNSS Section 35)." : "NON-COGNIZABLE offence \u2014 requires magistrate warrant for arrest.")
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Case filing analysis failed", details: String(err) });
  }
});
router14.get("/provisions", async (req, res) => {
  const { q, act, category } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { section: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { keywords: { $elemMatch: { $regex: q, $options: "i" } } },
      { plain_language: { $regex: q, $options: "i" } }
    ];
  }
  if (act) filter.act_name = { $regex: act, $options: "i" };
  if (category) filter.offense_category = { $regex: category, $options: "i" };
  const provisions = await LegalProvision_default.find(filter).limit(30).lean();
  res.json(provisions.map((p) => ({ ...p, id: p._id })));
});
var defaultProcedure = (crimeType) => [
  { step: 1, title: "Register FIR", description: `Register the First Information Report under the relevant BNS sections for ${crimeType}. FIR must be registered immediately \u2014 cannot be refused.`, timeline: "Immediately", legal_reference: "BNSS Section 173" },
  { step: 2, title: "Inform Superior Officers", description: "Inform the SHO, Circle Inspector, and DSP about the case. For serious offences, notify SP and Magistrate.", timeline: "Within 1 hour", legal_reference: "BNSS Section 174" },
  { step: 3, title: "Preserve Crime Scene", description: "Immediately cordon off and preserve the crime scene. Prevent tampering of evidence. Photograph and videograph the scene.", timeline: "Within 1-2 hours", legal_reference: "BNSS Section 176" },
  { step: 4, title: "Collect Evidence", description: "Collect all physical evidence with proper labelling and seizure memos. Prepare detailed panchnama with independent witnesses.", timeline: "Within 6 hours", legal_reference: "BNSS Section 185" },
  { step: 5, title: "Record Victim/Witness Statements", description: "Record statements under BNSS Section 180. For sexual offences, statement must be recorded by woman officer.", timeline: "Within 24 hours", legal_reference: "BNSS Section 180" },
  { step: 6, title: "Medical Examination", description: "Get victim and accused medically examined. For rape/sexual assault cases \u2014 within 24 hours is mandatory.", timeline: "Within 24 hours", legal_reference: "BNSS Section 184" },
  { step: 7, title: "Arrest and Produce Before Magistrate", description: "If cognizable offence, arrest without warrant. Produce arrested person before nearest magistrate within 24 hours of arrest.", timeline: "Within 24 hours of arrest", legal_reference: "BNSS Section 35, Article 22 Constitution" },
  { step: 8, title: "Send Evidence to FSL", description: "Send collected physical/digital evidence to Forensic Science Laboratory for scientific examination.", timeline: "Within 3 days", legal_reference: "BNSS Section 189" },
  { step: 9, title: "File Charge Sheet", description: "Complete investigation and file charge sheet (challan) before the competent court within the prescribed time limit.", timeline: "Within 60-90 days", legal_reference: "BNSS Section 193" }
];
var defaultImmediateActions = () => [
  "Register FIR immediately \u2014 rejection of FIR is punishable under BNSS",
  "Preserve and secure the crime scene \u2014 prevent contamination",
  "Inform senior officers (SHO / Circle Inspector)",
  "Record victim's preliminary statement",
  "Arrange medical examination for victim if injured",
  "Issue look-out notice if accused is identified and likely to flee",
  "Collect CCTV footage from surrounding areas before it is overwritten",
  "Document all evidence with photographs before collection"
];
var caseFiling_default = router14;

// src/routes/courtHearings.ts
var import_express15 = require("express");
var import_mongoose28 = __toESM(require("mongoose"));

// src/models/CourtHearing.ts
var import_mongoose27 = __toESM(require("mongoose"));
var CourtHearingSchema = new import_mongoose27.Schema(
  {
    case_id: { type: import_mongoose27.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    title: { type: String, required: true },
    court_name: { type: String, required: true },
    court_number: String,
    judge_name: String,
    hearing_date: { type: Date, required: true, index: true },
    hearing_time: String,
    hearing_type: { type: String, enum: ["bail", "framing_of_charges", "evidence", "argument", "judgment", "other"], default: "other" },
    status: { type: String, enum: ["scheduled", "completed", "adjourned", "cancelled"], default: "scheduled" },
    result: String,
    next_date: Date,
    notes: String,
    reminder_sent: { type: Boolean, default: false },
    created_by: { type: import_mongoose27.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);
CourtHearingSchema.index({ case_id: 1, hearing_date: 1 });
var CourtHearing_default = import_mongoose27.default.model("CourtHearing", CourtHearingSchema);

// src/routes/courtHearings.ts
var router15 = (0, import_express15.Router)();
router15.use(authenticate);
router15.get("/", async (req, res) => {
  try {
    const { case_id, status, from, to } = req.query;
    const filter = {};
    if (case_id && import_mongoose28.default.isValidObjectId(case_id)) filter.case_id = case_id;
    if (status) filter.status = status;
    if (from || to) {
      filter.hearing_date = {};
      if (from) filter.hearing_date.$gte = new Date(from);
      if (to) filter.hearing_date.$lte = new Date(to);
    }
    const hearings = await CourtHearing_default.find(filter).populate("case_id", "case_number title").sort({ hearing_date: 1 }).lean();
    res.json(hearings.map((h) => ({ ...h, id: h._id })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hearings", detail: String(err) });
  }
});
router15.get("/upcoming", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const end = /* @__PURE__ */ new Date();
    end.setDate(end.getDate() + 30);
    const hearings = await CourtHearing_default.find({
      hearing_date: { $gte: now, $lte: end },
      status: "scheduled"
    }).populate("case_id", "case_number title crime_type").sort({ hearing_date: 1 }).limit(20).lean();
    res.json(hearings.map((h) => ({ ...h, id: h._id })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming hearings", detail: String(err) });
  }
});
router15.get("/:id", async (req, res) => {
  try {
    if (!import_mongoose28.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const h = await CourtHearing_default.findById(req.params.id).populate("case_id", "case_number title").lean();
    if (!h) {
      res.status(404).json({ error: "Hearing not found" });
      return;
    }
    res.json({ ...h, id: h._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hearing", detail: String(err) });
  }
});
router15.post("/", async (req, res) => {
  try {
    const { case_id, title, court_name, hearing_date } = req.body;
    if (!case_id || !title || !court_name || !hearing_date) {
      res.status(400).json({ error: "case_id, title, court_name, hearing_date are required" });
      return;
    }
    const hearing = await CourtHearing_default.create({ ...req.body, created_by: req.user.id });
    sendRealtimeNotification({
      type: "court_hearing",
      title: "Court Hearing Scheduled",
      message: `${title} on ${new Date(hearing_date).toLocaleDateString("en-IN")}`,
      case_id: String(case_id)
    });
    res.status(201).json({ ...hearing.toObject(), id: hearing._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create hearing", detail: String(err) });
  }
});
router15.put("/:id", async (req, res) => {
  try {
    if (!import_mongoose28.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const hearing = await CourtHearing_default.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!hearing) {
      res.status(404).json({ error: "Hearing not found" });
      return;
    }
    res.json({ ...hearing, id: hearing._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to update hearing", detail: String(err) });
  }
});
router15.delete("/:id", async (req, res) => {
  try {
    if (!import_mongoose28.default.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await CourtHearing_default.findByIdAndDelete(req.params.id);
    res.json({ message: "Hearing deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete hearing", detail: String(err) });
  }
});
var courtHearings_default = router15;

// src/routes/reports.ts
var import_express16 = require("express");
var import_mongoose29 = __toESM(require("mongoose"));
var router16 = (0, import_express16.Router)();
router16.use(authenticate);
router16.get("/case/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!import_mongoose29.default.isValidObjectId(caseId)) {
      res.status(400).json({ error: "Invalid case ID" });
      return;
    }
    const [caseDoc, evidence, witnesses, victims, suspects, documents] = await Promise.all([
      Case_default.findById(caseId).lean(),
      Evidence_default.find({ case_id: caseId }).lean(),
      Witness_default.find({ case_id: caseId }).lean(),
      Victim_default.find({ case_id: caseId }).lean(),
      Suspect_default.find({ case_id: caseId }).lean(),
      CaseDocument_default.find({ case_id: caseId }).lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json({
      case: caseDoc,
      evidence,
      witnesses,
      victims,
      suspects,
      documents,
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      generated_by: req.user.id,
      stats: {
        evidence_count: evidence.length,
        verified_evidence: evidence.filter((e) => e.is_verified).length,
        witness_count: witnesses.length,
        victim_count: victims.length,
        suspect_count: suspects.length,
        document_count: documents.length,
        approved_docs: documents.filter((d) => d.status === "approved").length
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate case report", detail: String(err) });
  }
});
router16.get("/evidence-inventory/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!import_mongoose29.default.isValidObjectId(caseId)) {
      res.status(400).json({ error: "Invalid case ID" });
      return;
    }
    const [caseDoc, evidence] = await Promise.all([
      Case_default.findById(caseId).select("case_number title").lean(),
      Evidence_default.find({ case_id: caseId }).sort({ created_at: 1 }).lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json({
      case_number: caseDoc.case_number,
      case_title: caseDoc.title,
      items: evidence,
      total: evidence.length,
      verified: evidence.filter((e) => e.is_verified).length,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate evidence inventory", detail: String(err) });
  }
});
router16.get("/witness-summary/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!import_mongoose29.default.isValidObjectId(caseId)) {
      res.status(400).json({ error: "Invalid case ID" });
      return;
    }
    const [caseDoc, witnesses] = await Promise.all([
      Case_default.findById(caseId).select("case_number title").lean(),
      Witness_default.find({ case_id: caseId }).lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json({
      case_number: caseDoc.case_number,
      case_title: caseDoc.title,
      witnesses,
      total: witnesses.length,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate witness summary", detail: String(err) });
  }
});
router16.post("/ai-generate", async (req, res) => {
  try {
    const { case_id, document_type } = req.body;
    if (!case_id || !document_type) {
      res.status(400).json({ error: "case_id and document_type are required" });
      return;
    }
    if (!import_mongoose29.default.isValidObjectId(case_id)) {
      res.status(400).json({ error: "Invalid case ID" });
      return;
    }
    const [caseDoc, evidence, witnesses, victims, suspects] = await Promise.all([
      Case_default.findById(case_id).lean(),
      Evidence_default.find({ case_id }).select("title evidence_type is_verified").lean(),
      Witness_default.find({ case_id }).select("full_name statement_summary court_appearance_status").lean(),
      Victim_default.find({ case_id }).select("full_name injury_description").lean(),
      Suspect_default.find({ case_id }).select("full_name arrest_status").lean()
    ]);
    if (!caseDoc) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const caseContext = {
      ...caseDoc,
      evidence_items: evidence,
      witness_list: witnesses,
      victim_list: victims,
      suspect_list: suspects
    };
    const content = await generateDocument(document_type, caseContext);
    res.json({ content, document_type, case_id, generated_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate document", detail: String(err) });
  }
});
var reports_default = router16;

// src/routes/publicCrime.ts
var import_express17 = require("express");

// src/services/publicCrimeService.ts
var import_crypto2 = __toESM(require("crypto"));

// src/models/PublicCrimeIncident.ts
var import_mongoose30 = __toESM(require("mongoose"));
var PublicCrimeIncidentSchema = new import_mongoose30.Schema({
  source: { type: String, enum: ["gdelt", "gnews", "newsapi", "rss"], required: true },
  source_url: { type: String, required: true },
  headline: { type: String, required: true },
  published_at: { type: Date, required: true, index: true },
  fetched_at: { type: Date, default: Date.now },
  crime_type: { type: String, default: "Other", index: true },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  address: { type: String, default: "" },
  summary: { type: String, default: "" },
  severity: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  latitude: { type: Number },
  longitude: { type: Number },
  geocoded: { type: Boolean, default: false },
  url_hash: { type: String, required: true, unique: true, index: true }
}, { timestamps: true });
PublicCrimeIncidentSchema.index({ published_at: -1 });
PublicCrimeIncidentSchema.index({ latitude: 1, longitude: 1 });
PublicCrimeIncidentSchema.index({ crime_type: 1, published_at: -1 });
var PublicCrimeIncident_default = import_mongoose30.default.model("PublicCrimeIncident", PublicCrimeIncidentSchema);

// src/services/publicCrimeService.ts
function hashUrl(url) {
  return import_crypto2.default.createHash("sha256").update(url).digest("hex").slice(0, 32);
}
async function fetchGDELT() {
  try {
    const query = encodeURIComponent("crime murder theft assault fraud kidnapping India");
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=50&timespan=1440&sort=DateDesc&format=json&sourcecountry=IN`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15e3) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a) => ({
      title: a.title || "",
      url: a.url || "",
      publishedAt: a.seendate || (/* @__PURE__ */ new Date()).toISOString(),
      source: "gdelt",
      description: a.title
    })).filter((a) => a.url && a.title);
  } catch (err) {
    logger.warn(`GDELT fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}
async function fetchGNews() {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://gnews.io/api/v4/search?q=crime+India&lang=en&country=in&max=20&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(1e4) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a) => ({
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      source: "gnews",
      description: a.description
    }));
  } catch (err) {
    logger.warn(`GNews fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}
async function fetchNewsAPI() {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://newsapi.org/v2/everything?q=crime+India&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(1e4) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a) => ({
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      source: "newsapi",
      description: a.description
    }));
  } catch (err) {
    logger.warn(`NewsAPI fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}
async function fetchGDELTGeo() {
  try {
    const query = encodeURIComponent("crime India");
    const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${query}&mode=PointData&maxrecords=50&timespan=1440&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15e3) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f) => ({
      title: f.properties.name || "",
      url: f.properties.url || "",
      publishedAt: f.properties.seendate || (/* @__PURE__ */ new Date()).toISOString(),
      source: "gdelt",
      lat: f.geometry?.coordinates?.[1],
      lng: f.geometry?.coordinates?.[0]
    })).filter((a) => a.url && a.title && a.lat && a.lng);
  } catch (err) {
    logger.warn(`GDELT GEO fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}
async function extractWithGemini(articles) {
  if (!articles.length) return [];
  const BATCH = 10;
  const results = [];
  for (let i = 0; i < articles.length; i += BATCH) {
    const batch = articles.slice(i, i + BATCH);
    const prompt = `You are a crime news analyst. Analyze these Indian news headlines and extract structured crime data.

For EACH article, determine:
1. Is it an actual crime incident? (is_crime: true/false)
2. Crime type (one of: Murder, Theft, Assault, Cyber Crime, Fraud, Kidnapping, Drugs, Women Safety, Other)
3. City where crime occurred
4. State (Indian state name)
5. Street/area address if mentioned
6. Brief factual summary (1-2 sentences, no speculation)
7. Severity: high (murder/rape/kidnapping), medium (assault/robbery/fraud), low (theft/minor)

Articles:
${batch.map((a, idx) => `${idx + 1}. "${a.title}"${a.description ? ` \u2014 ${a.description?.substring(0, 150)}` : ""}`).join("\n")}

Return ONLY valid JSON array. One object per article in order:
[
  {
    "is_crime": true,
    "crime_type": "Murder",
    "city": "Mumbai",
    "state": "Maharashtra",
    "address": "Andheri West",
    "summary": "One sentence factual summary.",
    "severity": "high"
  }
]

Rules:
- If headline is not about a crime incident, set is_crime: false
- Never invent locations not mentioned in the headline
- Only extract what is explicitly stated
- City and state MUST be in India`;
    try {
      const response = await callLLM(prompt);
      const cleaned = response.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) continue;
      const parsed = JSON.parse(match[0]);
      parsed.forEach((ext, idx) => {
        if (ext.is_crime && batch[idx]) {
          results.push({ ...batch[idx], ...ext });
        }
      });
    } catch (err) {
      logger.warn(`Gemini extraction failed for batch: ${String(err).substring(0, 100)}`);
    }
    await sleep(500);
  }
  return results;
}
async function fetchAndStorePublicCrime() {
  logger.info("Starting public crime news fetch...");
  const [gdelt, gnews, newsapi, gdeltGeo] = await Promise.all([
    fetchGDELT(),
    fetchGNews(),
    fetchNewsAPI(),
    fetchGDELTGeo()
  ]);
  const allArticles = [...gdelt, ...gnews, ...newsapi];
  logger.info(`Fetched: GDELT=${gdelt.length}, GNews=${gnews.length}, NewsAPI=${newsapi.length}, GDELTGeo=${gdeltGeo.length}`);
  const hashes = allArticles.map((a) => hashUrl(a.url));
  const existing = await PublicCrimeIncident_default.find({ url_hash: { $in: hashes } }).select("url_hash").lean();
  const existSet = new Set(existing.map((e) => e.url_hash));
  const newArticles = allArticles.filter((a) => !existSet.has(hashUrl(a.url)));
  logger.info(`${newArticles.length} new articles to process (${allArticles.length - newArticles.length} already stored)`);
  let saved = 0;
  for (const article of gdeltGeo) {
    const hash = hashUrl(article.url);
    if (existSet.has(hash)) continue;
    if (!article.lat || !article.lng) continue;
    try {
      await PublicCrimeIncident_default.create({
        source: "gdelt",
        source_url: article.url,
        headline: article.title,
        published_at: new Date(article.publishedAt),
        crime_type: "Other",
        city: "",
        state: "",
        address: "",
        summary: article.title,
        severity: "medium",
        latitude: article.lat,
        longitude: article.lng,
        geocoded: true,
        url_hash: hash
      });
      saved++;
    } catch {
    }
  }
  if (newArticles.length > 0) {
    const extracted = await extractWithGemini(newArticles);
    logger.info(`Gemini extracted ${extracted.length} crime incidents from ${newArticles.length} articles`);
    for (const inc of extracted) {
      const hash = hashUrl(inc.url);
      const locationQuery = [inc.address, inc.city, inc.state].filter(Boolean).join(", ");
      let lat;
      let lng;
      let geocoded = false;
      if (locationQuery) {
        await sleep(1200);
        const geo = await geocodeAddress(locationQuery);
        if (geo) {
          lat = geo.latitude;
          lng = geo.longitude;
          geocoded = true;
        }
      }
      if (!geocoded || !lat || !lng) {
        logger.debug(`Skipped (no coordinates): ${inc.title.substring(0, 60)}`);
        continue;
      }
      try {
        await PublicCrimeIncident_default.create({
          source: inc.source,
          source_url: inc.url,
          headline: inc.title,
          published_at: new Date(inc.publishedAt),
          crime_type: inc.crime_type || "Other",
          city: inc.city || "",
          state: inc.state || "",
          address: inc.address || "",
          summary: inc.summary || inc.title,
          severity: inc.severity || "medium",
          latitude: lat,
          longitude: lng,
          geocoded: true,
          url_hash: hash
        });
        saved++;
      } catch {
      }
    }
  }
  logger.info(`Public crime fetch complete: ${saved} new incidents saved`);
  return saved;
}
async function getCachedIncidents(filters) {
  const query = {
    geocoded: true,
    latitude: { $exists: true, $ne: null },
    longitude: { $exists: true, $ne: null }
  };
  if (filters.crime_type && filters.crime_type !== "all") {
    query.crime_type = filters.crime_type;
  }
  if (filters.since_hours && filters.since_hours > 0) {
    query.published_at = { $gte: new Date(Date.now() - filters.since_hours * 3600 * 1e3) };
  }
  return PublicCrimeIncident_default.find(query).sort({ published_at: -1 }).limit(300).lean();
}
async function getLastFetchTime() {
  const latest = await PublicCrimeIncident_default.findOne().sort({ fetched_at: -1 }).select("fetched_at").lean();
  return latest ? latest.fetched_at : null;
}

// src/routes/publicCrime.ts
var router17 = (0, import_express17.Router)();
router17.use(authenticate);
router17.get("/incidents", async (req, res) => {
  try {
    const { crime_type, hours } = req.query;
    const incidents = await getCachedIncidents({
      crime_type: crime_type || "all",
      since_hours: hours ? parseInt(hours) : 0
    });
    const lastFetch = await getLastFetchTime();
    res.json({
      incidents: incidents.map((inc) => ({
        id: String(inc._id),
        headline: inc.headline,
        source: inc.source,
        source_url: inc.source_url,
        crime_type: inc.crime_type,
        city: inc.city,
        state: inc.state,
        address: inc.address,
        summary: inc.summary,
        severity: inc.severity,
        latitude: inc.latitude,
        longitude: inc.longitude,
        published_at: inc.published_at
      })),
      total: incidents.length,
      last_fetch: lastFetch,
      source_label: "Public News-Based Crime Incidents"
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public incidents", detail: String(err) });
  }
});
router17.post("/refresh", async (req, res) => {
  res.json({ message: "Refresh started in background. Check back in 2-3 minutes." });
  fetchAndStorePublicCrime().catch(
    (err) => logger.error("Manual public crime refresh failed", { err: String(err) })
  );
});
var publicCrime_default = router17;

// src/services/cronService.ts
var REFRESH_INTERVAL_MS = 45 * 60 * 1e3;
var cronHandle = null;
async function runFetch() {
  try {
    logger.info("[Cron] Running public crime news refresh...");
    const count = await fetchAndStorePublicCrime();
    logger.info(`[Cron] Refresh complete \u2014 ${count} new incidents stored`);
  } catch (err) {
    logger.error("[Cron] Public crime refresh failed", { err: String(err).substring(0, 200) });
  }
}
async function startCronService() {
  const lastFetch = await getLastFetchTime();
  const stale = !lastFetch || Date.now() - lastFetch.getTime() > REFRESH_INTERVAL_MS;
  if (stale) {
    setTimeout(() => {
      runFetch();
    }, 1e4);
  } else {
    const nextIn = REFRESH_INTERVAL_MS - (Date.now() - lastFetch.getTime());
    logger.info(`[Cron] Last fetch was recent. Next refresh in ${Math.round(nextIn / 6e4)} min`);
  }
  cronHandle = setInterval(runFetch, REFRESH_INTERVAL_MS);
  logger.info(`[Cron] Public crime news scheduler started (every ${REFRESH_INTERVAL_MS / 6e4} min)`);
}

// src/index.ts
import_dotenv.default.config();
var app = (0, import_express18.default)();
var httpServer = (0, import_http.createServer)(app);
var io = new import_socket.Server(httpServer, {
  cors: {
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((u) => u.trim()),
    methods: ["GET", "POST"],
    credentials: true
  }
});
initSocketService(io);
var PORT = process.env.PORT || 5e3;
app.use((0, import_helmet.default)({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((u) => u.trim()).filter(Boolean);
    if (!origin) return callback(null, true);
    if (allowed.includes(origin) || allowed.includes("*")) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
var limiter = (0, import_express_rate_limit.rateLimit)({
  windowMs: 15 * 60 * 1e3,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use("/api/", limiter);
var aiLimiter = (0, import_express_rate_limit.rateLimit)({
  windowMs: 60 * 1e3,
  max: 20,
  message: { error: "AI request limit reached. Please wait a moment before trying again." }
});
app.use("/api/ai/", aiLimiter);
app.use("/api/case-filing/", aiLimiter);
app.use("/api/ai/", (req, res, next) => {
  res.setTimeout(18e4);
  next();
});
app.use("/api/case-filing/", (req, res, next) => {
  res.setTimeout(18e4);
  next();
});
app.use(import_express18.default.json({ limit: "10mb" }));
app.use(import_express18.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, import_compression.default)());
if (process.env.NODE_ENV !== "test") {
  app.use((0, import_morgan.default)("combined", {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}
var uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", import_express18.default.static(import_path4.default.resolve(uploadDir)));
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    database: "mongodb",
    ai: getAIStatus()
  });
});
app.use("/api/auth", auth_default);
app.use("/api/cases", cases_default);
app.use("/api/evidence", evidence_default);
app.use("/api/witnesses", witnesses_default);
app.use("/api/victims", victims_default);
app.use("/api/suspects", suspects_default);
app.use("/api/documents", documents_default);
app.use("/api/legal", legal_default);
app.use("/api/ai", ai_default);
app.use("/api/dashboard", dashboard_default);
app.use("/api/notifications", notifications_default);
app.use("/api/admin", admin_default);
app.use("/api/analytics", analytics_default);
app.use("/api/case-filing", caseFiling_default);
app.use("/api/court-hearings", courtHearings_default);
app.use("/api/reports", reports_default);
app.use("/api/public-crime", publicCrime_default);
var frontendDist = import_path4.default.resolve(__dirname, "./client");
if (import_fs3.default.existsSync(frontendDist)) {
  logger.info(`Serving frontend from: ${frontendDist}`);
  app.use(import_express18.default.static(frontendDist, {
    maxAge: "1y",
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      return next();
    }
    const indexFile = import_path4.default.join(frontendDist, "index.html");
    if (import_fs3.default.existsSync(indexFile)) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.sendFile(indexFile);
    }
    next();
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "JusticeAI Backend",
      version: "1.0.0",
      health: "/api/health"
    });
  });
}
app.use(notFound);
app.use(errorHandler);
var start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    logger.info(`JusticeAI server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    logger.info(`AI backend: ${getAIStatus()}`);
  });
  startCronService().catch((err) => logger.warn("Cron start failed", { err: String(err) }));
};
start().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { message: err.message });
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: String(reason) });
});
var src_default = app;
