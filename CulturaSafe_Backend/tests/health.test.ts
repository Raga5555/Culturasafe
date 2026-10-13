import request from 'supertest';
import { app } from '../src/app.js';

describe('Health and Root API Endpoints', () => {
  it('GET /api/health should return 200 with service information and database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('CulturaSafe');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.provider).toBe('Supabase PostgreSQL');
  });

  it('GET /api should return 200 with service description', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('CulturaSafe Backend API');
  });

  it('GET /api/nonexistent should return 404 with standard error structure', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
