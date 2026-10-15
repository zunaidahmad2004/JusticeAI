/**
 * prestart.mjs — runs before dist/index.js on Render
 * 1. Writes gemini-credentials.json from GEMINI_CREDENTIALS_B64 env var
 * 2. Verifies all frontend assets exist
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════════════
// 1. SETUP GEMINI CREDENTIALS
// ═══════════════════════════════════════════════════════════════════════════
const credPath = path.join(__dirname, 'gemini-credentials.json');
const b64 = (process.env.GEMINI_CREDENTIALS_B64 || '').trim();

if (b64 && b64.length > 100) {
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    JSON.parse(decoded); // validate
    fs.writeFileSync(credPath, decoded, 'utf8');
    console.log('[prestart] ✓ Wrote gemini-credentials.json from GEMINI_CREDENTIALS_B64');
  } catch (e) {
    console.warn('[prestart] GEMINI_CREDENTIALS_B64 invalid:', e.message);
  }
} else if (fs.existsSync(credPath)) {
  console.log('[prestart] ✓ gemini-credentials.json already exists');
} else {
  console.warn('[prestart] ⚠ No Gemini credentials found - AI may not work');
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. VERIFY FRONTEND ASSETS EXIST
// ═══════════════════════════════════════════════════════════════════════════
console.log('[prestart] Verifying frontend assets...');

const clientDist = path.join(__dirname, 'dist/client');
if (!fs.existsSync(clientDist)) {
  console.error('[prestart] ❌ FATAL: dist/client directory not found');
  console.error('[prestart]    Expected:', clientDist);
  console.error('[prestart]    The frontend build did not run or failed.');
  process.exit(1);
}

const indexHtml = path.join(clientDist, 'index.html');
if (!fs.existsSync(indexHtml)) {
  console.error('[prestart] ❌ FATAL: dist/client/index.html not found');
  console.error('[prestart]    The frontend build did not complete.');
  process.exit(1);
}

// Parse HTML and verify all referenced assets exist
const html = fs.readFileSync(indexHtml, 'utf-8');
const assetRegex = /(src|href)="(\/assets\/[^"]+)"/g;
const assets = [];
let match;

while ((match = assetRegex.exec(html)) !== null) {
  assets.push(match[2]);
}

console.log(`[prestart]    Found ${assets.length} asset references in HTML`);

const missingAssets = [];
for (const asset of assets) {
  const assetPath = path.join(clientDist, asset);
  if (!fs.existsSync(assetPath)) {
    missingAssets.push(asset);
  }
}

if (missingAssets.length > 0) {
  console.error('[prestart] ❌ FATAL: Missing assets referenced in HTML:');
  missingAssets.forEach(asset => console.error(`[prestart]    - ${asset}`));
  console.error('[prestart]');
  console.error('[prestart]    These assets are in index.html but missing from dist/client/');
  console.error('[prestart]    Frontend build incomplete or assets not copied correctly.');
  process.exit(1);
}

console.log(`[prestart] ✓ All ${assets.length} HTML-referenced assets verified`);
console.log('[prestart] ✓ Server ready to start');
