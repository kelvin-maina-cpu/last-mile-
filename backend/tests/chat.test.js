const request = require('supertest');
const app = require('../src/app');

describe('POST /api/chat', () => {
  it('answers a recognized question about tracking', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'How do I track my delivery?' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/REQUESTED/);
  });

  it('answers a recognized question about proof of delivery', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is proof of delivery?' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/photo/i);
  });

  it('answers a recognized question about rider ratings without inventing a submission flow', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'How do rider ratings work?' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('falls back to a helpful message for an unrecognized question', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is the meaning of life?' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/not sure about that one/);
  });

  it('rejects an empty message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing message field', async () => {
    const res = await request(app).post('/api/chat').send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
