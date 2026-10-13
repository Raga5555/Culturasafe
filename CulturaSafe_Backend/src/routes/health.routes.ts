import { Router, Request, Response } from 'express';
import { supabasePublic } from '../config/supabase.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    const pingPromise = supabasePublic.from('profiles').select('id').limit(1);
    const timeoutPromise = new Promise<{ error: any }>(resolve =>
      setTimeout(() => resolve({ error: { message: 'timeout' } }), 1000)
    );
    const result = await Promise.race([pingPromise, timeoutPromise]);
    dbLatencyMs = Date.now() - start;
    if ('error' in result && result.error) {
  console.error('Supabase health check failed:', result.error);
  dbStatus = 'degraded';
  }
  
  } catch (e) {
    dbStatus = 'unavailable';
  }

  res.status(200).json({
    status: 'ok',
    service: 'CulturaSafe Backend REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      provider: 'Supabase PostgreSQL',
      status: dbStatus,
      latencyMs: dbLatencyMs
    }
  });
});

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'CulturaSafe Backend API',
    description: 'Smart tourism, belongings safety & BLE tracking backend service',
    docs: '/api/docs',
    health: '/api/health',
    version: '1.0.0'
  });
});
