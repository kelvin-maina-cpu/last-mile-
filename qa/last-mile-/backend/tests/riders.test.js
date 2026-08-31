const request = require('supertest');
const app = require('../src/app');
const Rider = require('../src/models/Rider');
const testDb = require('./testDb');

beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clear();
});

afterAll(async () => {
  await testDb.close();
});

describe('GET /api/riders', () => {
  it('lists all riders when no filter is given', async () => {
    await Rider.create([
      { name: 'Peter Otieno', phone: '+254723456789', available: false },
      { name: 'Grace Wanjiku', phone: '+254734567890', available: true },
    ]);

    const res = await request(app).get('/api/riders');

    expect(res.status).toBe(200);
    expect(res.body.riders).toHaveLength(2);
  });

  it('filters by available=true', async () => {
    await Rider.create([
      { name: 'Peter Otieno', phone: '+254723456789', available: false },
      { name: 'Grace Wanjiku', phone: '+254734567890', available: true },
    ]);

    const res = await request(app).get('/api/riders?available=true');

    expect(res.status).toBe(200);
    expect(res.body.riders).toHaveLength(1);
    expect(res.body.riders[0].name).toBe('Grace Wanjiku');
  });
});
