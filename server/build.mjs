import * as esbuild from 'esbuild';
import { readFileSync, existsSync, cpSync, mkdirSync, readdirSync } from 'fs';
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

if (existsSync(clientDist)) {
  mkdirSync(serverClientDist, { recursive: true });
  cpSync(clientDist, serverClientDist, { recursive: true });
  console.log('Frontend dist copied to server/dist/client');
} else {
  console.warn('WARNING: client/dist not found. Run npm run build in client/ first.');
}

// ── Verify critical assets exist ─────────────────────────────────────────────
const indexHtml = join(__dirname, 'dist/client/index.html');
if (!existsSync(indexHtml)) {
  console.error('ERROR: dist/client/index.html not found after build!');
  console.error('Frontend build did not complete successfully.');
  process.exit(1);
}

const assetsDir = join(__dirname, 'dist/client/assets');
if (!existsSync(assetsDir)) {
  console.error('ERROR: dist/client/assets directory not found!');
  console.error('Frontend assets were not copied correctly.');
  process.exit(1);
}

const assetFiles = readdirSync(assetsDir);
const jsAssets = assetFiles.filter(f => f.endsWith('.js'));
const cssAssets = assetFiles.filter(f => f.endsWith('.css'));

if (jsAssets.length === 0 || cssAssets.length === 0) {
  console.error('ERROR: No JS or CSS assets found in dist/client/assets!');
  console.error(`Found ${jsAssets.length} JS files and ${cssAssets.length} CSS files.`);
  process.exit(1);
}

console.log(`✓ Verified: ${jsAssets.length} JS files, ${cssAssets.length} CSS files`);
console.log('Build complete: dist/index.js');
