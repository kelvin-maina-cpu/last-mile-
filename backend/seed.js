require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const Delivery = require('./src/models/Delivery');
const Rider = require('./src/models/Rider');

const riders = [
  { name: 'Peter Otieno', phone: '+254723456789', available: true },
  { name: 'Grace Wanjiku', phone: '+254734567890', available: true },
  { name: 'James Mwangi', phone: '+254745678901', available: true },
  { name: 'Sarah Njeri', phone: '+254756789012', available: true },
  { name: 'David Ochieng', phone: '+254767890123', available: true },
];

const deliveries = [
  {
    customerName: 'John Kamau',
    customerPhone: '+254712345678',
    deliveryAddress: '123 Nairobi St, Westlands',
    itemDescription: 'Samsung Galaxy S23',
    status: 'REQUESTED',
  },
  {
    customerName: 'Alice Wambui',
    customerPhone: '+254721345678',
    deliveryAddress: '456 Mombasa Rd, Industrial Area',
    itemDescription: 'Laptop charger and mouse',
    status: 'REQUESTED',
  },
  {
    customerName: 'Robert Kipchoge',
    customerPhone: '+254731345678',
    deliveryAddress: '789 Kenyatta Ave, CBD',
    itemDescription: 'Courier documents',
    status: 'REQUESTED',
  },
  {
    customerName: 'Fatima Hassan',
    customerPhone: '+254741345678',
    deliveryAddress: '321 Langata Rd, Karen',
    itemDescription: 'Pharmacy medication',
    status: 'REQUESTED',
  },
  {
    customerName: 'Brian Odhiambo',
    customerPhone: '+254751345678',
    deliveryAddress: '654 Thika Rd, Kahawa',
    itemDescription: 'Groceries order',
    status: 'REQUESTED',
  },
];

async function seed() {
  try {
    await connectDB();

    // Clear existing data
    await Rider.deleteMany({});
    await Delivery.deleteMany({});
    console.log('Cleared existing data.');

    // Insert riders
    const createdRiders = await Rider.insertMany(riders);
    console.log(`Inserted ${createdRiders.length} riders:`);
    createdRiders.forEach((r) => {
      console.log(`  - ${r.name} (${r.phone}) [available: ${r.available}]`);
    });

    // Insert deliveries
    const createdDeliveries = await Delivery.insertMany(deliveries);
    console.log(`\nInserted ${createdDeliveries.length} deliveries:`);
    createdDeliveries.forEach((d) => {
      console.log(`  - ${d.customerName}: ${d.itemDescription} [status: ${d.status}]`);
    });

    console.log('\nSeed complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
