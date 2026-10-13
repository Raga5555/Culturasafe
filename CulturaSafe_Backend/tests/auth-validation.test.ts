import request from 'supertest';
import { app } from '../src/app.js';

describe('Auth Validation and Protection Middleware', () => {
  it('POST /api/v1/auth/register should fail validation when email is missing or invalid', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: '123'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('Protected route GET /api/v1/destinations/saved should return 401 without Bearer token', async () => {
    const res = await request(app).get('/api/v1/destinations/saved');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Protected route GET /api/v1/itineraries should reject malformed Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/itineraries')
      .set('Authorization', 'Bearer invalid-dummy-token-12345');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });
});
