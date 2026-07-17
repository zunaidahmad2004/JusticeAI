import * as esbuild from 'esbuild';
import { readFileSync, existsSync, cpSync, mkdirSync } from 'fs';
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

console.log('Build complete: dist/index.js');
