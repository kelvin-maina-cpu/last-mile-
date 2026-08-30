const request = require('supertest');
const app = require('../src/app');
const testDb = require('./testDb');

beforeAll(async () => {
  await testDb.connect();
});

afterAll(async () => {
  await testDb.close();
});

describe('GET /api/health', () => {
  it('reports healthy when the database is connected', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });
});
