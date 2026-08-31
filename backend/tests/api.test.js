require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const Delivery = require('../src/models/Delivery');
const Rider = require('../src/models/Rider');

const TEST_DB_URI = 'mongodb://localhost:27017/reflex_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await mongoose.connection.dropDatabase();
}, 30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await Delivery.deleteMany({});
  await Rider.deleteMany({});
});

// ─── HELPERS ─────────────────────────────────────────────

const validDelivery = {
  customerName: 'Test Customer',
  customerPhone: '+254700000001',
  deliveryAddress: 'Westlands, Nairobi',
  itemDescription: 'Test Package',
};

const validRider = {
  name: 'Test Rider',
  phone: '+254700000010',
  available: true,
};

async function createAssignedDelivery() {
  const delivery = await Delivery.create(validDelivery);
  const rider = await Rider.create(validRider);
  await request(app)
    .patch(`/api/deliveries/${delivery._id}/assign`)
    .send({ riderId: rider._id.toString() });
  return { deliveryId: delivery._id.toString(), riderId: rider._id.toString() };
}

async function createDeliveredDelivery() {
  const delivery = await Delivery.create(validDelivery);
  const rider = await Rider.create(validRider);
  await request(app).patch(`/api/deliveries/${delivery._id}/assign`).send({ riderId: rider._id.toString() });
  await request(app).patch(`/api/deliveries/${delivery._id}/status`).send({ status: 'PICKED_UP' });
  await request(app).patch(`/api/deliveries/${delivery._id}/status`).send({ status: 'DELIVERED' });
  return { deliveryId: delivery._id.toString() };
}

// ═══════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════

describe('GET /api/health', () => {
  it('should return 200 with healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });
});

// ═══════════════════════════════════════════════════════════
// DELIVERY CREATION
// ═══════════════════════════════════════════════════════════

describe('POST /api/deliveries', () => {
  it('should create a delivery with 201', async () => {
    const res = await request(app).post('/api/deliveries').send(validDelivery);
    expect(res.status).toBe(201);
    expect(res.body.delivery._id).toBeDefined();
    expect(res.body.delivery.status).toBe('REQUESTED');
    expect(res.body.delivery.riderId).toBeNull();
    expect(res.body.delivery.customerName).toBe(validDelivery.customerName);
  });

  it('should reject empty body', async () => {
    const res = await request(app).post('/api/deliveries').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing customerName', async () => {
    const res = await request(app).post('/api/deliveries').send({
      customerPhone: '+254700000001', deliveryAddress: 'X', itemDescription: 'Y',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing customerPhone', async () => {
    const res = await request(app).post('/api/deliveries').send({
      customerName: 'X', deliveryAddress: 'X', itemDescription: 'Y',
    });
    expect(res.status).toBe(400);
  });

  it('should reject missing deliveryAddress', async () => {
    const res = await request(app).post('/api/deliveries').send({
      customerName: 'X', customerPhone: '+254700000001', itemDescription: 'Y',
    });
    expect(res.status).toBe(400);
  });

  it('should reject missing itemDescription', async () => {
    const res = await request(app).post('/api/deliveries').send({
      customerName: 'X', customerPhone: '+254700000001', deliveryAddress: 'Y',
    });
    expect(res.status).toBe(400);
  });

  it('should force status to REQUESTED even if client sends DELIVERED', async () => {
    const res = await request(app).post('/api/deliveries').send({
      ...validDelivery, status: 'DELIVERED',
    });
    expect(res.status).toBe(201);
    expect(res.body.delivery.status).toBe('REQUESTED');
  });
});

// ═══════════════════════════════════════════════════════════
// DELIVERY RETRIEVAL
// ═══════════════════════════════════════════════════════════

describe('GET /api/deliveries', () => {
  beforeEach(async () => {
    await Delivery.create([
      { ...validDelivery, status: 'REQUESTED' },
      { customerName: 'B', customerPhone: '2', deliveryAddress: 'C', itemDescription: 'D', status: 'ASSIGNED' },
    ]);
  });

  it('should return all deliveries', async () => {
    const res = await request(app).get('/api/deliveries');
    expect(res.status).toBe(200);
    expect(res.body.deliveries.length).toBe(2);
  });

  it('should filter by status', async () => {
    const res = await request(app).get('/api/deliveries?status=REQUESTED');
    expect(res.status).toBe(200);
    expect(res.body.deliveries.length).toBe(1);
    expect(res.body.deliveries[0].status).toBe('REQUESTED');
  });
});

describe('GET /api/deliveries/:id', () => {
  it('should return a delivery by valid ID', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app).get(`/api/deliveries/${d._id}`);
    expect(res.status).toBe(200);
    expect(res.body.delivery._id).toBe(d._id.toString());
  });

  it('should return 404 for nonexistent delivery', async () => {
    const res = await request(app).get(`/api/deliveries/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('DELIVERY_NOT_FOUND');
  });

  it('should return 400 for malformed ID', async () => {
    const res = await request(app).get('/api/deliveries/not-valid');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_ID');
  });
});

// ═══════════════════════════════════════════════════════════
// RIDERS
// ═══════════════════════════════════════════════════════════

describe('GET /api/riders', () => {
  beforeEach(async () => {
    await Rider.create([
      { name: 'Available Rider', phone: '+254700000011', available: true },
      { name: 'Busy Rider', phone: '+254700000012', available: false },
    ]);
  });

  it('should return all riders', async () => {
    const res = await request(app).get('/api/riders');
    expect(res.status).toBe(200);
    expect(res.body.riders.length).toBe(2);
  });

  it('should filter available riders', async () => {
    const res = await request(app).get('/api/riders?available=true');
    expect(res.status).toBe(200);
    expect(res.body.riders.length).toBe(1);
    expect(res.body.riders[0].available).toBe(true);
  });

  it('should filter unavailable riders', async () => {
    const res = await request(app).get('/api/riders?available=false');
    expect(res.status).toBe(200);
    expect(res.body.riders.length).toBe(1);
    expect(res.body.riders[0].available).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// RIDER ASSIGNMENT
// ═══════════════════════════════════════════════════════════

describe('PATCH /api/deliveries/:id/assign', () => {
  it('should assign rider to delivery', async () => {
    const d = await Delivery.create(validDelivery);
    const r = await Rider.create(validRider);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: r._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.delivery.status).toBe('ASSIGNED');
    expect(res.body.delivery.riderId).toBe(r._id.toString());
    const updatedRider = await Rider.findById(r._id);
    expect(updatedRider.available).toBe(false);
  });

  it('should return 404 for nonexistent rider', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RIDER_NOT_FOUND');
  });

  it('should return 400 for malformed rider ID', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: 'not-valid' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_ID');
  });

  it('should return 400 for malformed delivery ID', async () => {
    const r = await Rider.create(validRider);
    const res = await request(app)
      .patch('/api/deliveries/not-valid/assign')
      .send({ riderId: r._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_ID');
  });

  it('should return 409 for unavailable rider', async () => {
    const d = await Delivery.create(validDelivery);
    const r = await Rider.create({ ...validRider, available: false });
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: r._id.toString() });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('RIDER_UNAVAILABLE');
  });

  it('should reject assignment to ASSIGNED delivery', async () => {
    const d = await Delivery.create(validDelivery);
    const r = await Rider.create(validRider);
    // Set directly via Mongoose to bypass service layer
    d.status = 'ASSIGNED';
    d.riderId = r._id;
    await d.save();
    const r2 = await Rider.create({ name: 'R2', phone: '+254700000099', available: true });
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: r2._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('should reject assignment to PICKED_UP delivery', async () => {
    const d = await Delivery.create(validDelivery);
    const r = await Rider.create(validRider);
    d.status = 'PICKED_UP';
    d.riderId = r._id;
    await d.save();
    const r2 = await Rider.create({ name: 'R2', phone: '+254700000098', available: true });
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: r2._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('should reject assignment to DELIVERED delivery', async () => {
    const d = await Delivery.create(validDelivery);
    const r = await Rider.create(validRider);
    d.status = 'DELIVERED';
    d.riderId = r._id;
    await d.save();
    const r2 = await Rider.create({ name: 'R2', phone: '+254700000097', available: true });
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: r2._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('should return 400 when riderId is missing', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ═══════════════════════════════════════════════════════════
// STATUS TRANSITIONS — Happy Path
// ═══════════════════════════════════════════════════════════

describe('PATCH /api/deliveries/:id/status — Happy Path', () => {
  it('should transition ASSIGNED → PICKED_UP', async () => {
    const { deliveryId } = await createAssignedDelivery();
    const res = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .send({ status: 'PICKED_UP' });
    expect(res.status).toBe(200);
    expect(res.body.delivery.status).toBe('PICKED_UP');
  });

  it('should transition PICKED_UP → DELIVERED', async () => {
    const { deliveryId } = await createAssignedDelivery();
    await request(app).patch(`/api/deliveries/${deliveryId}/status`).send({ status: 'PICKED_UP' });
    const res = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(200);
    expect(res.body.delivery.status).toBe('DELIVERED');
  });

  it('should complete full lifecycle', async () => {
    const { deliveryId } = await createAssignedDelivery();
    let res = await request(app).patch(`/api/deliveries/${deliveryId}/status`).send({ status: 'PICKED_UP' });
    expect(res.body.delivery.status).toBe('PICKED_UP');
    res = await request(app).patch(`/api/deliveries/${deliveryId}/status`).send({ status: 'DELIVERED' });
    expect(res.body.delivery.status).toBe('DELIVERED');
    const d = await Delivery.findById(deliveryId);
    expect(d.status).toBe('DELIVERED');
  });
});

// ═══════════════════════════════════════════════════════════
// STATUS TRANSITIONS — CRITICAL: ASSIGNED rejection
// ═══════════════════════════════════════════════════════════

describe('STATUS — CRITICAL: ASSIGNED rejection via status endpoint', () => {
  it('must reject status=ASSIGNED through the status endpoint', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/status`)
      .send({ status: 'ASSIGNED' });
    expect(res.status).toBe(400);
    const delivery = await Delivery.findById(d._id);
    expect(delivery.status).toBe('REQUESTED');
  });

  it('must create ASSIGNED only through the assign endpoint', async () => {
    const d = await Delivery.create(validDelivery);
    const r = await Rider.create(validRider);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/assign`)
      .send({ riderId: r._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.delivery.status).toBe('ASSIGNED');
  });
});

// ═══════════════════════════════════════════════════════════
// STATUS TRANSITIONS — Invalid
// ═══════════════════════════════════════════════════════════

describe('STATUS — Invalid Transitions', () => {
  it('should reject REQUESTED → PICKED_UP', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/status`)
      .send({ status: 'PICKED_UP' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('should reject REQUESTED → DELIVERED', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});

// ═══════════════════════════════════════════════════════════
// STATUS TRANSITIONS — DELIVERED terminal
// ═══════════════════════════════════════════════════════════

describe('STATUS — DELIVERED terminal state', () => {
  it('should reject DELIVERED → PICKED_UP', async () => {
    const { deliveryId } = await createDeliveredDelivery();
    const res = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .send({ status: 'PICKED_UP' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('should reject DELIVERED → ASSIGNED', async () => {
    const { deliveryId } = await createDeliveredDelivery();
    const res = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .send({ status: 'ASSIGNED' });
    expect(res.status).toBe(400);
  });

  it('should reject DELIVERED → REQUESTED', async () => {
    const { deliveryId } = await createDeliveredDelivery();
    const res = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .send({ status: 'REQUESTED' });
    expect(res.status).toBe(400);
  });

  it('should return special message for already delivered', async () => {
    const { deliveryId } = await createDeliveredDelivery();
    const res = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .send({ status: 'PICKED_UP' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already delivered');
  });
});

// ═══════════════════════════════════════════════════════════
// STATUS — Invalid values
// ═══════════════════════════════════════════════════════════

describe('STATUS — Invalid status values', () => {
  it('should reject invalid status value', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/status`)
      .send({ status: 'INVALID' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing status', async () => {
    const d = await Delivery.create(validDelivery);
    const res = await request(app)
      .patch(`/api/deliveries/${d._id}/status`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject nonexistent delivery', async () => {
    const res = await request(app)
      .patch(`/api/deliveries/${new mongoose.Types.ObjectId()}/status`)
      .send({ status: 'PICKED_UP' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('DELIVERY_NOT_FOUND');
  });

  it('should reject malformed delivery ID', async () => {
    const res = await request(app)
      .patch('/api/deliveries/not-valid/status')
      .send({ status: 'PICKED_UP' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_ID');
  });
});

// ═══════════════════════════════════════════════════════════
// STATE MACHINE (unit)
// ═══════════════════════════════════════════════════════════

describe('State Machine — canTransition', () => {
  const { canTransition, VALID_TRANSITIONS } = require('../src/services/deliveryService');

  it('should allow REQUESTED → ASSIGNED', () => {
    expect(canTransition('REQUESTED', 'ASSIGNED')).toBe(true);
  });

  it('should allow ASSIGNED → PICKED_UP', () => {
    expect(canTransition('ASSIGNED', 'PICKED_UP')).toBe(true);
  });

  it('should allow PICKED_UP → DELIVERED', () => {
    expect(canTransition('PICKED_UP', 'DELIVERED')).toBe(true);
  });

  it('should reject REQUESTED → PICKED_UP', () => {
    expect(canTransition('REQUESTED', 'PICKED_UP')).toBe(false);
  });

  it('should reject REQUESTED → DELIVERED', () => {
    expect(canTransition('REQUESTED', 'DELIVERED')).toBe(false);
  });

  it('should reject ASSIGNED → DELIVERED', () => {
    expect(canTransition('ASSIGNED', 'DELIVERED')).toBe(false);
  });

  it('should reject DELIVERED → anything', () => {
    expect(canTransition('DELIVERED', 'REQUESTED')).toBe(false);
    expect(canTransition('DELIVERED', 'ASSIGNED')).toBe(false);
    expect(canTransition('DELIVERED', 'PICKED_UP')).toBe(false);
    expect(canTransition('DELIVERED', 'DELIVERED')).toBe(false);
  });

  it('VALID_TRANSITIONS should have 4 states', () => {
    expect(Object.keys(VALID_TRANSITIONS)).toHaveLength(4);
  });

  it('DELIVERED should be terminal', () => {
    expect(VALID_TRANSITIONS.DELIVERED).toEqual([]);
  });
});
