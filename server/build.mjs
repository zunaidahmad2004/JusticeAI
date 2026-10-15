import * as esbuild from 'esbuild';
import { readFileSync, existsSync, cpSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  'node:*',
];

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle:      true,
  platform:    'node',
  target:      'node20',
  format:      'cjs',
  outfile:     'dist/index.js',
  external,
  sourcemap:   false,
  minify:      false,
  logLevel:    'info',
  tsconfig:    './tsconfig.json',
});

// Copy frontend dist into server dist for unified deployment
const clientDist = join(__dirname, '../client/dist');
const serverClientDist = join(__dirname, 'dist/client');

console.log('[build] Checking frontend build...');
console.log(`[build]   Source: ${clientDist}`);
console.log(`[build]   Target: ${serverClientDist}`);

if (existsSync(clientDist)) {
  // Remove old frontend to ensure clean copy and avoid stale files
  if (existsSync(serverClientDist)) {
    console.log('[build] Removing old frontend to ensure clean copy...');
    try {
      rmSync(serverClientDist, { recursive: true, force: true });
    } catch (e) {
      console.warn('[build] Could not remove old frontend:', e.message);
    }
  }
  
  mkdirSync(serverClientDist, { recursive: true });
  cpSync(clientDist, serverClientDist, { recursive: true });
  console.log('[build] ✓ Frontend copied to server/dist/client');
} else {
  console.error('[build] ❌ FATAL: client/dist not found!');
  console.error('[build]    The frontend must be built before the backend.');
  console.error('[build]    Render build command should include:');
  console.error('[build]      npm --prefix ../client install && npm --prefix ../client run build');
  process.exit(1);
}

// ── Verify critical assets exist ─────────────────────────────────────────────
const indexHtml = join(__dirname, 'dist/client/index.html');
if (!existsSync(indexHtml)) {
  console.error('[build] ❌ FATAL: dist/client/index.html not found after copy!');
  console.error('[build]    Frontend build did not complete successfully.');
  process.exit(1);
}

const assetsDir = join(__dirname, 'dist/client/assets');
if (!existsSync(assetsDir)) {
  console.error('[build] ❌ FATAL: dist/client/assets directory not found!');
  console.error('[build]    Frontend assets were not copied correctly.');
  process.exit(1);
}

const assetFiles = readdirSync(assetsDir);
const jsAssets = assetFiles.filter(f => f.endsWith('.js'));
const cssAssets = assetFiles.filter(f => f.endsWith('.css'));

if (jsAssets.length === 0 || cssAssets.length === 0) {
  console.error('[build] ❌ FATAL: No JS or CSS assets found in dist/client/assets!');
  console.error(`[build]    Found ${jsAssets.length} JS files and ${cssAssets.length} CSS files.`);
  process.exit(1);
}

console.log(`[build] ✓ Verified: ${jsAssets.length} JS files, ${cssAssets.length} CSS files`);

// Verify HTML-referenced assets exist
const htmlContent = readFileSync(indexHtml, 'utf-8');
const assetMatches = htmlContent.matchAll(/(src|href)="(\/assets\/[^"]+)"/g);
const referencedAssets = Array.from(assetMatches, m => m[2]);

console.log(`[build] ✓ HTML references ${referencedAssets.length} assets`);

const missingAssets = referencedAssets.filter(assetUrl => {
  const assetPath = join(__dirname, 'dist/client', assetUrl);
  return !existsSync(assetPath);
});

if (missingAssets.length > 0) {
  console.error('[build] ❌ FATAL: HTML references assets that don\'t exist:');
  missingAssets.forEach(asset => console.error(`[build]    ${asset}`));
  console.error('[build]    This means the HTML and assets are from different builds!');
  process.exit(1);
}

console.log('[build] ✓ All HTML-referenced assets verified');
console.log('[build] Build complete: dist/index.js');
