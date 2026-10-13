import request from 'supertest';
import { app } from '../src/app.js';

describe('Belongings & Separation Alerts Validation', () => {
  it('POST /api/v1/belongings should require authorization', async () => {
    const res = await request(app).post('/api/v1/belongings').send({
      name: 'Test Backpack Tag',
      itemType: 'backpack'
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/belongings/alerts/events should require valid alert payload and authorization', async () => {
    const res = await request(app).post('/api/v1/belongings/alerts/events').send({
      alertType: 'separation'
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/location/points should reject requests without consent or authorization', async () => {
    const res = await request(app).post('/api/v1/location/points').send({
      latitude: 11.933,
      longitude: 79.83,
      consentGiven: false
    });
    expect(res.status).toBe(401);
  });
});
