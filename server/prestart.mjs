/**
 * prestart.mjs — runs before dist/index.js on Render
 * Writes gemini-credentials.json from GEMINI_CREDENTIALS_B64 env var
 * OR uses embedded fallback credentials if env var not set
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const credPath = path.join(__dirname, 'gemini-credentials.json');

// Try env var first
const b64 = (process.env.GEMINI_CREDENTIALS_B64 || '').trim();
if (b64 && b64.length > 100) {
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    JSON.parse(decoded); // validate
    fs.writeFileSync(credPath, decoded, 'utf8');
    console.log('[prestart] Wrote gemini-credentials.json from GEMINI_CREDENTIALS_B64');
    process.exit(0);
  } catch (e) {
    console.warn('[prestart] GEMINI_CREDENTIALS_B64 invalid:', e.message);
  }
}

// If already exists on disk, use it
if (fs.existsSync(credPath)) {
  console.log('[prestart] gemini-credentials.json already exists on disk');
  process.exit(0);
}

console.warn('[prestart] No Gemini credentials found - AI will not work');
process.exit(0);
