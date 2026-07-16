import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST      = join(__dirname, 'dist');
const INDEX     = join(DIST, 'index.html');
const PORT      = process.env.PORT || 3000;

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.css':   'text/css',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.json':  'application/json',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.map':   'application/json',
  '.webp':  'image/webp',
};

if (!existsSync(INDEX)) {
  console.error('ERROR: dist/index.html not found. Run npm run build first.');
  process.exit(1);
}

console.log(`Serving from: ${DIST}`);
console.log(`index.html exists: ${existsSync(INDEX)}`);

const server = createServer((req, res) => {
  const urlPath = req.url.split('?')[0].split('#')[0];

  // Security: prevent directory traversal
  const filePath = join(DIST, urlPath);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // Serve exact static file if it exists
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext  = extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const isAsset = urlPath.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type':  mime,
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache, no-store',
    });
    res.end(readFileSync(filePath));
    return;
  }

  // SPA fallback — serve index.html for ALL React Router paths
  res.writeHead(200, {
    'Content-Type':  'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(readFileSync(INDEX));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`JusticeAI Frontend running on http://0.0.0.0:${PORT}`);
  console.log('SPA fallback enabled — all routes serve index.html');
});
