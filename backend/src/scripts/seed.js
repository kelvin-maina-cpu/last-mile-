/**
 * Database seed script.
 *
 * Populates the `riders` and `deliveries` collections with sample data for
 * local development and demos. Safe to re-run: it wipes both collections
 * before inserting, so the database always ends up in the same known state.
 *
 * Usage:
 *   npm run seed
 *
 * Requires MONGODB_URI to point at a dev/demo database — never run this
 * against a production database, since it deletes existing data first.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Rider = require('../models/Rider');
const Delivery = require('../models/Delivery');

// `available` is set here to match the invariant the app itself maintains:
// assignRider() flips a rider to unavailable and nothing currently flips it
// back (see docs/data-integrity.md, "Rider availability is never restored
// automatically"). So any rider given an ASSIGNED/PICKED_UP/DELIVERED
// delivery below is seeded as unavailable, and only riders with no
// delivery, or whose only history is one we don't create here, are seeded
// as available.
const riders = [
  { name: 'Peter Otieno', phone: '+254723456789', available: false }, // has a PICKED_UP delivery
  { name: 'Grace Wanjiku', phone: '+254734567890', available: true },
  { name: 'Samuel Kiptoo', phone: '+254745678901', available: false }, // has a DELIVERED delivery
  { name: 'Amina Hassan', phone: '+254756789012', available: true },
  { name: 'Brian Mutua', phone: '+254767890123', available: false }, // has an ASSIGNED delivery
];

// Deliveries are built after riders are inserted so we can reference real
// rider _ids for the ASSIGNED / PICKED_UP / DELIVERED examples below.
function buildDeliveries(riderDocs) {
  const [otieno, , kiptoo, , mutua] = riderDocs;

  return [
    // REQUESTED — no rider assigned yet (the default path for a brand-new
    // delivery request from a retailer).
    {
      customerName: 'John Kamau',
      customerPhone: '+254712345678',
      deliveryAddress: '123 Nairobi St, Westlands',
      itemDescription: 'Samsung Galaxy S23',
      status: 'REQUESTED',
      riderId: null,
    },
    {
      customerName: 'Faith Njeri',
      customerPhone: '+254701122334',
      deliveryAddress: '45 Ngong Road, Kilimani',
      itemDescription: 'HP Laptop Charger',
      status: 'REQUESTED',
      riderId: null,
    },
    // ASSIGNED — rider assigned, matches the rider whose `available` flag
    // was flipped to false above (mutua).
    {
      customerName: 'David Mwangi',
      customerPhone: '+254722334455',
      deliveryAddress: '78 Moi Avenue, CBD',
      itemDescription: 'Office Chair',
      status: 'ASSIGNED',
      riderId: mutua._id,
    },
    // PICKED_UP — mid-flight delivery.
    {
      customerName: 'Mercy Achieng',
      customerPhone: '+254733445566',
      deliveryAddress: '12 Kimathi Street, CBD',
      itemDescription: 'Printer Cartridges (3x)',
      status: 'PICKED_UP',
      riderId: otieno._id,
    },
    // DELIVERED — terminal state, for exercising list/filter views.
    {
      customerName: 'Kevin Omondi',
      customerPhone: '+254744556677',
      deliveryAddress: '9 Riverside Drive',
      itemDescription: 'Groceries (2 bags)',
      status: 'DELIVERED',
      riderId: kiptoo._id,
    },
  ];
}

async function seed() {
  await connectDB();

  console.log('Clearing existing riders and deliveries...');
  await Promise.all([Rider.deleteMany({}), Delivery.deleteMany({})]);

  console.log(`Inserting ${riders.length} riders...`);
  const riderDocs = await Rider.insertMany(riders);
  riderDocs.forEach((r) => console.log(`  - ${r.name} (${r._id}) available=${r.available}`));

  const deliveries = buildDeliveries(riderDocs);
  console.log(`Inserting ${deliveries.length} deliveries...`);
  const deliveryDocs = await Delivery.insertMany(deliveries);
  deliveryDocs.forEach((d) =>
    console.log(`  - ${d.itemDescription} -> ${d.status} (${d._id})`)
  );

  console.log('Seed complete.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
