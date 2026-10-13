import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV, validateEnv } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { destinationsRouter } from './routes/destinations.routes.js';
import { itinerariesRouter } from './routes/itineraries.routes.js';
import { locationRouter } from './routes/location.routes.js';
import { belongingsRouter } from './routes/belongings.routes.js';
import { syncRouter } from './routes/sync.routes.js';

validateEnv();

export const app: Express = express();

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (ENV.ALLOWED_ORIGINS.includes('*') || ENV.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting for API routes
app.use('/api', apiRateLimiter);

// OpenAPI Specification Endpoint
app.get('/api/docs/spec', (_req: Request, res: Response) => {
  try {
    const specPath = path.resolve(process.cwd(), 'openapi.json');
    if (fs.existsSync(specPath)) {
      const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
      res.json(spec);
    } else {
      res.status(404).json({ message: 'OpenAPI specification file not found.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to load API specification.' });
  }
});

// Interactive HTML Documentation Viewer
app.get('/api/docs', (_req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>CulturaSafe Backend API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/rapidoc/dist/rapidoc.min.css"/>
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
</head>
<body style="margin:0;font-family:sans-serif;">
  <rapi-doc
    spec-url="/api/docs/spec"
    theme="light"
    primary-color="#1F4D3A"
    render-style="view"
    show-header="true"
    allow-authentication="true"
    allow-server-selection="true"
  >
    <div slot="header" style="display:flex;align-items:center;gap:12px;padding:8px 16px;">
      <h2 style="margin:0;color:#1F4D3A;">🏛️ CulturaSafe REST API</h2>
    </div>
  </rapi-doc>
</body>
</html>
  `);
});

// Mount Routes
app.use('/api', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/destinations', destinationsRouter);
app.use('/api/v1/itineraries', itinerariesRouter);
app.use('/api/v1/location', locationRouter);
app.use('/api/v1/belongings', belongingsRouter);
app.use('/api/v1/sync', syncRouter);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);
