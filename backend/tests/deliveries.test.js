const request = require('supertest');
const app = require('../src/app');
const Delivery = require('../src/models/Delivery');
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

const validDeliveryPayload = {
  customerName: 'John Kamau',
  customerPhone: '+254712345678',
  deliveryAddress: '123 Nairobi St, Westlands',
  itemDescription: 'Samsung Galaxy S23',
};

describe('POST /api/deliveries', () => {
  it('creates a delivery with status REQUESTED', async () => {
    const res = await request(app).post('/api/deliveries').send(validDeliveryPayload);

    expect(res.status).toBe(201);
    expect(res.body.delivery.status).toBe('REQUESTED');
    expect(res.body.delivery.riderId).toBeNull();
  });

  it('rejects a request missing required fields', async () => {
    const res = await request(app)
      .post('/api/deliveries')
      .send({ customerName: 'John Kamau' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('ignores a client-supplied status and forces REQUESTED', async () => {
    const res = await request(app)
      .post('/api/deliveries')
      .send({ ...validDeliveryPayload, status: 'DELIVERED' });

    expect(res.status).toBe(201);
    expect(res.body.delivery.status).toBe('REQUESTED');
  });
});

describe('GET /api/deliveries', () => {
  it('filters by status', async () => {
    await Delivery.create({ ...validDeliveryPayload, status: 'REQUESTED' });
    await Delivery.create({ ...validDeliveryPayload, status: 'DELIVERED' });

    const res = await request(app).get('/api/deliveries?status=DELIVERED');

    expect(res.status).toBe(200);
    expect(res.body.deliveries).toHaveLength(1);
    expect(res.body.deliveries[0].status).toBe('DELIVERED');
  });
});

describe('GET /api/deliveries/:id', () => {
  it('returns 404 for a well-formed id that does not exist', async () => {
    const missingId = new (require('mongoose').Types.ObjectId)();
    const res = await request(app).get(`/api/deliveries/${missingId}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('DELIVERY_NOT_FOUND');
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/deliveries/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_ID');
  });
});

describe('PATCH /api/deliveries/:id/assign', () => {
  it('assigns an available rider and flips the rider to unavailable', async () => {
    const delivery = await Delivery.create(validDeliveryPayload);
    const rider = await Rider.create({
      name: 'Grace Wanjiku',
      phone: '+254734567890',
      available: true,
    });

    const res = await request(app)
      .patch(`/api/deliveries/${delivery._id}/assign`)
      .send({ riderId: rider._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.delivery.status).toBe('ASSIGNED');
    expect(res.body.delivery.riderId).toBe(rider._id.toString());

    const updatedRider = await Rider.findById(rider._id);
    expect(updatedRider.available).toBe(false);
  });

  it('rejects assignment when the rider is unavailable', async () => {
    const delivery = await Delivery.create(validDeliveryPayload);
    const rider = await Rider.create({
      name: 'Peter Otieno',
      phone: '+254723456789',
      available: false,
    });

    const res = await request(app)
      .patch(`/api/deliveries/${delivery._id}/assign`)
      .send({ riderId: rider._id.toString() });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('RIDER_UNAVAILABLE');
  });

  it('rejects assignment when the delivery is not REQUESTED', async () => {
    const delivery = await Delivery.create({ ...validDeliveryPayload, status: 'ASSIGNED' });
    const rider = await Rider.create({
      name: 'Grace Wanjiku',
      phone: '+254734567890',
      available: true,
    });

    const res = await request(app)
      .patch(`/api/deliveries/${delivery._id}/assign`)
      .send({ riderId: rider._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});

describe('PATCH /api/deliveries/:id/status', () => {
  it.each([
    ['ASSIGNED', 'PICKED_UP'],
    ['PICKED_UP', 'DELIVERED'],
  ])('allows %s -> %s', async (from, to) => {
    const delivery = await Delivery.create({ ...validDeliveryPayload, status: from });

    const res = await request(app)
      .patch(`/api/deliveries/${delivery._id}/status`)
      .send({ status: to });

    expect(res.status).toBe(200);
    expect(res.body.delivery.status).toBe(to);
  });

  it('rejects skipping a state (REQUESTED -> PICKED_UP)', async () => {
    const delivery = await Delivery.create({ ...validDeliveryPayload, status: 'REQUESTED' });

    const res = await request(app)
      .patch(`/api/deliveries/${delivery._id}/status`)
      .send({ status: 'PICKED_UP' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('rejects any transition once DELIVERED', async () => {
    const delivery = await Delivery.create({ ...validDeliveryPayload, status: 'DELIVERED' });

    const res = await request(app)
      .patch(`/api/deliveries/${delivery._id}/status`)
      .send({ status: 'ASSIGNED' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});
