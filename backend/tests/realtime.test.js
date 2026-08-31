require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const request = require('supertest');
const app = require('../src/app');
const Delivery = require('../src/models/Delivery');
const Rider = require('../src/models/Rider');

let io, clientSocket, httpServer;

const TEST_DB_URI = 'mongodb://localhost:27017/reflex_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await mongoose.connection.dropDatabase();

  httpServer = http.createServer(app);
  io = new Server(httpServer, { cors: { origin: '*' } });
  app.set('io', io);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', resolve);
    });
  });
}, 30000);

afterAll(async () => {
  if (clientSocket) clientSocket.disconnect();
  if (io) io.close();
  if (httpServer) httpServer.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await Delivery.deleteMany({});
  await Rider.deleteMany({});
  clientSocket.removeAllListeners();
});

describe('Socket.IO Events', () => {
  it('should emit delivery:created when a delivery is created', (done) => {
    clientSocket.once('delivery:created', (data) => {
      expect(data).toHaveProperty('delivery');
      expect(data.delivery.status).toBe('REQUESTED');
      expect(data.delivery.customerName).toBe('Socket Test Customer');
      done();
    });

    request(app)
      .post('/api/deliveries')
      .send({
        customerName: 'Socket Test Customer',
        customerPhone: '+254700000099',
        deliveryAddress: 'Test Address',
        itemDescription: 'Test Item',
      })
      .end(() => {});
  }, 10000);

  it('should emit delivery:assigned when a rider is assigned', (done) => {
    clientSocket.once('delivery:assigned', (data) => {
      expect(data).toHaveProperty('delivery');
      expect(data).toHaveProperty('rider');
      expect(data.delivery.status).toBe('ASSIGNED');
      done();
    });

    const createAndAssign = async () => {
      const delivery = await Delivery.create({
        customerName: 'Assign Test',
        customerPhone: '+254700000098',
        deliveryAddress: 'Test Address',
        itemDescription: 'Test Item',
      });
      const rider = await Rider.create({
        name: 'Assign Rider',
        phone: '+254700000097',
        available: true,
      });

      request(app)
        .patch(`/api/deliveries/${delivery._id}/assign`)
        .send({ riderId: rider._id.toString() })
        .end(() => {});
    };
    createAndAssign();
  }, 10000);

  it('should emit delivery:status-updated when status changes to PICKED_UP', (done) => {
    const handler = (data) => {
      if (data.delivery && data.delivery.status === 'PICKED_UP') {
        clientSocket.removeListener('delivery:status-updated', handler);
        expect(data).toHaveProperty('delivery');
        expect(data.delivery.status).toBe('PICKED_UP');
        done();
      }
    };
    clientSocket.on('delivery:status-updated', handler);

    const createAndUpdate = async () => {
      const rider = await Rider.create({
        name: 'Status Rider',
        phone: '+254700000096',
        available: true,
      });
      const delivery = await Delivery.create({
        customerName: 'Status Test',
        customerPhone: '+254700000095',
        deliveryAddress: 'Test Address',
        itemDescription: 'Test Item',
      });

      await request(app)
        .patch(`/api/deliveries/${delivery._id}/assign`)
        .send({ riderId: rider._id.toString() });

      request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .send({ status: 'PICKED_UP' })
        .end(() => {});
    };
    createAndUpdate();
  }, 10000);

  it('should emit delivery:status-updated when status changes to DELIVERED', (done) => {
    const handler = (data) => {
      if (data.delivery && data.delivery.status === 'DELIVERED') {
        clientSocket.removeListener('delivery:status-updated', handler);
        expect(data).toHaveProperty('delivery');
        expect(data.delivery.status).toBe('DELIVERED');
        done();
      }
    };
    clientSocket.on('delivery:status-updated', handler);

    const createAndDeliver = async () => {
      const rider = await Rider.create({
        name: 'Deliver Rider',
        phone: '+254700000094',
        available: true,
      });
      const delivery = await Delivery.create({
        customerName: 'Deliver Test',
        customerPhone: '+254700000093',
        deliveryAddress: 'Test Address',
        itemDescription: 'Test Item',
      });

      await request(app)
        .patch(`/api/deliveries/${delivery._id}/assign`)
        .send({ riderId: rider._id.toString() });

      await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .send({ status: 'PICKED_UP' });

      request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .send({ status: 'DELIVERED' })
        .end(() => {});
    };
    createAndDeliver();
  }, 10000);
});
