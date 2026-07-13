// Simple static server with SPA fallback for Render deployment
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json',
};

const server = createServer((req, res) => {
  // Security: remove query strings and fragments
  const url = req.url.split('?')[0].split('#')[0];

  // CORS headers for health check
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Try exact file first
  let filePath = join(DIST, url);

  if (existsSync(filePath) && !filePath.endsWith('/')) {
    const ext = extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public,max-age=31536000' });
    res.end(readFileSync(filePath));
    return;
  }

  // SPA fallback — serve index.html for all other routes
  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
    res.end(readFileSync(indexPath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`JusticeAI Frontend running on port ${PORT}`);
});
