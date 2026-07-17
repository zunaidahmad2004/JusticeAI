import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const DIST  = join(__dirname, 'dist');
const INDEX = join(DIST, 'index.html');
const PORT  = process.env.PORT || 3000;

if (!existsSync(INDEX)) {
  console.error('FATAL: dist/index.html not found.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
  '.map':  'application/json',
};

createServer((req, res) => {
  const url = req.url.split('?')[0].split('#')[0];

  // Security: block traversal
  const filePath = join(DIST, url);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // Serve real static file
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext   = extname(filePath).toLowerCase();
    const mime  = MIME[ext] || 'application/octet-stream';
    const cache = url.startsWith('/assets/') ? 'public,max-age=31536000,immutable' : 'no-cache';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cache });
    res.end(readFileSync(filePath));
    return;
  }

  // SPA fallback — ALL unknown paths get index.html
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(readFileSync(INDEX));

}).listen(PORT, '0.0.0.0', () => {
  console.log(`JusticeAI Frontend on port ${PORT}`);
  console.log(`Serving: ${DIST}`);
  console.log('SPA routing enabled — all paths serve index.html');
});
