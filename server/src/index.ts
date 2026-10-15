import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { connectDB } from './db/mongoose';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { getAIStatus } from './services/aiService';
import { initSocketService } from './services/socketService';

// Routes
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import evidenceRoutes from './routes/evidence';
import witnessRoutes from './routes/witnesses';
import victimRoutes from './routes/victims';
import suspectRoutes from './routes/suspects';
import documentRoutes from './routes/documents';
import legalRoutes from './routes/legal';
import aiRoutes from './routes/ai';
import dashboardRoutes from './routes/dashboard';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analytics';
import caseFilingRoutes    from './routes/caseFiling';
import courtHearingRoutes  from './routes/courtHearings';
import reportsRoutes       from './routes/reports';
import publicCrimeRoutes   from './routes/publicCrime';
import { startCronService } from './services/cronService';

const app  = express();
const httpServer = createServer(app);
const io   = new SocketServer(httpServer, {
  cors: {
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(u => u.trim()),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocketService(io);
const PORT = process.env.PORT || 5000;

// ─── Security middleware ──────────────────────────────────────────────────────
// Custom CSP that allows Vite's type="module" scripts, Google Fonts, and inline styles
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr:  ["'none'"],
      styleSrc:       ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc:        ["'self'", 'https:', 'data:'],
      imgSrc:         ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc:     ["'self'", 'https:', 'wss:'],
      frameSrc:       ["'self'"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_URL || 'http://localhost:5173')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);
    // Allow requests with no origin (curl, Postman, mobile apps, same-origin)
    if (!origin) return callback(null, true);
    if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
    // In production unified deployment, same-origin requests come without CORS headers
    // so we allow all origins to avoid blocking legitimate browser requests
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limit for AI routes (Gemini quota protection)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'AI request limit reached. Please wait a moment before trying again.' },
});
app.use('/api/ai/', aiLimiter);
app.use('/api/case-filing/', aiLimiter);

// Increase timeout for AI routes to 3 minutes
app.use('/api/ai/',          (req, res, next) => { res.setTimeout(180000); next(); });
app.use('/api/case-filing/', (req, res, next) => { res.setTimeout(180000); next(); });

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// ─── Uploads static ───────────────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// ─── Health check (before SPA fallback) ──────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    database:  'mongodb',
    ai:        getAIStatus(),
  });
});

// ─── Diagnostic endpoint for deployment verification ─────────────────────────
app.get('/api/diagnostic', (_req, res) => {
  const frontendPath = path.resolve(__dirname, './client');
  const assetsPath = path.join(frontendPath, 'assets');
  
  res.json({
    commit: 'bdd4015+diagnostic',
    nodeVersion: process.version,
    cwd: process.cwd(),
    __dirname,
    paths: { frontend: frontendPath, assets: assetsPath },
    exists: {
      frontend: fs.existsSync(frontendPath),
      assets: fs.existsSync(assetsPath),
      index: fs.existsSync(path.join(frontendPath, 'index.html')),
    },
    sampleAssets: fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath).filter(f => f.startsWith('index-')).slice(0, 5) : [],
    env: { NODE_ENV: process.env.NODE_ENV, RENDER: process.env.RENDER }
  });
});

// ─── Diagnostic endpoint for environment debugging ───────────────────────────
app.get('/api/debug/env', (_req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const googleKey = process.env.GOOGLE_API_KEY || '';
  
  const getKeyType = (key: string) => {
    if (!key) return 'NOT_SET';
    if (key.startsWith('AIza')) return 'STANDARD_AIza';
    if (key.startsWith('AQ.')) return 'AUTHORIZATION_AQ';
    return `UNKNOWN_${key.substring(0,4)}`;
  };
  
  res.json({
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'NOT_SET',
    GEMINI_API_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
    GEMINI_API_KEY_TYPE: getKeyType(geminiKey),
    GOOGLE_API_KEY_EXISTS: !!process.env.GOOGLE_API_KEY,
    GOOGLE_API_KEY_TYPE: getKeyType(googleKey),
    GEMINI_CREDENTIALS_B64_EXISTS: !!process.env.GEMINI_CREDENTIALS_B64,
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    ai_status: getAIStatus(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/cases',         caseRoutes);
app.use('/api/evidence',      evidenceRoutes);
app.use('/api/witnesses',     witnessRoutes);
app.use('/api/victims',       victimRoutes);
app.use('/api/suspects',      suspectRoutes);
app.use('/api/documents',     documentRoutes);
app.use('/api/legal',         legalRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/case-filing',   caseFilingRoutes);
app.use('/api/court-hearings',courtHearingRoutes);
app.use('/api/reports',       reportsRoutes);
app.use('/api/public-crime',  publicCrimeRoutes);

// ─── Serve frontend static files in production ───────────────────────────────
const frontendDist = path.resolve(__dirname, './client');

if (fs.existsSync(frontendDist)) {
  logger.info(`Serving frontend from: ${frontendDist}`);
  
  // Log a few asset files to verify directory structure
  const assetsDir = path.join(frontendDist, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    const cssFiles = assetFiles.filter(f => f.endsWith('.css'));
    logger.info(`Assets: ${jsFiles.length} JS, ${cssFiles.length} CSS - samples: ${assetFiles.slice(0, 3).join(', ')}`);
    
    // CRITICAL: Verify the exact asset referenced in index.html
    const criticalAsset = 'index-BZXnqAXL.js';
    if (fs.existsSync(path.join(assetsDir, criticalAsset))) {
      logger.info(`✓ ${criticalAsset} EXISTS at startup`);
    } else {
      logger.error(`✗ ${criticalAsset} MISSING - available index files: ${jsFiles.filter(f => f.startsWith('index-')).join(', ')}`);
    }
  } else {
    logger.error(`Assets directory not found: ${assetsDir}`);
  }

  // Explicitly serve assets directory with long-lived cache
  const assetsPath = path.join(frontendDist, 'assets');
  logger.info(`Assets path: ${assetsPath}`);
  
  app.use('/assets', express.static(assetsPath, {
    maxAge: '1y',
  }));

  // Serve other static files (index.html, favicon, etc.) with no cache for HTML
  app.use(express.static(frontendDist, {
    maxAge: '1y',
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // SPA fallback — serve index.html for every non-API, non-upload, non-asset route
  app.get('*', (req, res, next) => {
    // Skip API, uploads, and static assets (CSS, JS, images, fonts)
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/uploads/') ||
        req.path.startsWith('/assets/') ||
        /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|xml)$/i.test(req.path)) {
      return next();
    }
    const indexFile = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Content-Type',  'text/html; charset=utf-8');
      return res.sendFile(indexFile);
    }
    next();
  });
} else {
  // No frontend dist found — return JSON at root for API-only mode
  app.get('/', (_req, res) => {
    res.json({
      status:  'ok',
      service: 'JusticeAI Backend',
      version: '1.0.0',
      health:  '/api/health',
    });
  });
}

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    logger.info(`JusticeAI server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`AI backend: ${getAIStatus()}`);
  });
  startCronService().catch((err) => logger.warn('Cron start failed', { err: String(err) }));
};

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});

/* ─── Global crash prevention ─────────────────────────────────────────────── */
process.on('uncaughtException',  (err)    => { logger.error('Uncaught Exception',  { message: err.message }); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled Rejection', { reason: String(reason) }); });

export default app;
