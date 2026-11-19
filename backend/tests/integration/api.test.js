import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js'; 

describe('MealMate API Integration Tests', () => {
  let userToken = '';
  let adminToken = '';
  let createdEventId = null;

  beforeAll(async () => {

    const adminRes = await request(app).post('/api/auth/login').send({
      email: process.env.ADMIN_EMAIL || 'admin@mealmate.com',
      password: process.env.ADMIN_PASSWORD || 'SecurePassword123',
    });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {

    if (createdEventId && adminToken) {
      await request(app)
        .delete(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  it('rejects unauthenticated requests to /api/events with 401', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(401);
  });

  it('rejects invalid login credentials with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@mealmate.com',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
  });

  it('creates, fetches, updates, and deletes an event (full CRUD)', async () => {
    // 1. Create
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Vitest Integration Party',
        eventDate: '2026-12-20',
        guestCount: 120,
        eventType: 'Party',
        bufferPercent: 10,
      });

    expect([200, 201]).toContain(createRes.status);
    createdEventId = createRes.body.event?.id || createRes.body.id;
    expect(createdEventId).toBeTruthy();

    // 2. Read
    const getRes = await request(app)
      .get(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.event?.name || getRes.body.name).toBe('Vitest Integration Party');

    // 3. Update
    const updateRes = await request(app)
      .put(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Integration Party',
        eventDate: '2026-12-21',
        guestCount: 150,
        eventType: 'Corporate',
        bufferPercent: 15,
      });
    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(deleteRes.status);
    createdEventId = null;
  });

  it('returns 400 when POST /api/quotations receives a non-numeric eventId', async () => {
    const res = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventId: 'not-a-number' });

    expect(res.status).toBe(400);
  });
});