// ============================================================
// TEMPORARY DEMO/MOCK DATA — Rider frontend (Mary)
// ============================================================
// This file exists ONLY so the Rider UI can be exercised before
// Kelvin's backend is reachable. It is not part of the real API
// contract and should be deleted once the backend is live.
//
// Shape matches exactly what deliveryService.js expects from the
// real API (see docs/api-contract.md + DeliveryCard.jsx /
// DeliveryDetail.jsx): { id, customerName, address, itemDescription,
// status }. `customerPhone` and `riderId` are included as harmless
// extra fields for realism — the current UI components don't render
// them, so their presence changes nothing about existing behavior.
//
// Status values are restricted to the agreed MVP lifecycle values
// used by the Rider frontend: ASSIGNED, PICKED_UP, DELIVERED.
// (REQUESTED is dispatcher-only and never reaches this screen.)

const RIDER_ID = 'rider-001'
let nextId = 2005

let mockDeliveries = [
  {
    id: 'DEL-2001',
    riderId: RIDER_ID,
    customerName: 'Otieno Kamau',
    customerPhone: '0723 987 654',
    customerId: 'CUST-0723',
    address: "Ruring'u, Nyeri",
    itemDescription: 'HDMI cable, 20W adapter',
    status: 'ASSIGNED',
    proofOfDelivery: null,
  },
  {
    id: 'DEL-2002',
    riderId: RIDER_ID,
    customerName: 'Achieng Lwanga',
    customerPhone: '0701 222 333',
    customerId: 'CUST-0701',
    address: 'Kamakwa, Nyeri',
    itemDescription: 'Paracetamol, cough syrup',
    status: 'PICKED_UP',
    proofOfDelivery: null,
  },
  {
    id: 'DEL-2003',
    riderId: RIDER_ID,
    customerName: 'Kimani Thuo',
    customerPhone: '0745 111 222',
    customerId: 'CUST-0745',
    address: 'Kiganjo, Nyeri',
    itemDescription: 'Phone screen protector',
    status: 'DELIVERED',
    proofOfDelivery: {
      customerIdVerified: true,
      customerId: 'CUST-0745',
      photo: null,
      deliveredBy: 'James Mwangi',
      timestamp: '2026-08-30T14:30:00.000Z',
    },
  },
  {
    id: 'DEL-2004',
    riderId: RIDER_ID,
    customerName: 'Wanjiru Njoroge',
    customerPhone: '0733 444 555',
    customerId: 'CUST-0733',
    address: 'Kamwe, Nyeri',
    itemDescription: '2kg rice, cooking oil',
    status: 'ASSIGNED',
    proofOfDelivery: null,
  },
]

const mockRiders = [
  { id: 'rider-001', name: 'James Mwangi', phone: '0712 345 678', available: true },
  { id: 'rider-002', name: 'Faith Wanjiku', phone: '0723 456 789', available: true },
  { id: 'rider-003', name: 'Peter Ochieng', phone: '0734 567 890', available: true },
]

// Simulated network latency so loading states remain visible/testable
// in mock mode too (dashboard spinner, detail spinner).
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getMockDeliveries(riderId) {
  await wait(400)
  if (riderId) {
    // Rider view: return only deliveries assigned to this rider
    return mockDeliveries.filter((d) => d.riderId === riderId)
  }
  // Dispatcher view: return all deliveries
  return [...mockDeliveries]
}

export async function findMockDelivery(deliveryId) {
  await wait(300)
  return mockDeliveries.find((d) => d.id === deliveryId) || null
}

export async function updateMockDeliveryStatus(deliveryId, status) {
  await wait(350)
  const index = mockDeliveries.findIndex((d) => d.id === deliveryId)
  if (index === -1) return null

  mockDeliveries[index] = { ...mockDeliveries[index], status }
  return mockDeliveries[index]
}

export async function completeMockDeliveryWithPOD(deliveryId, podData) {
  await wait(500)
  const index = mockDeliveries.findIndex((d) => d.id === deliveryId)
  if (index === -1) return null

  mockDeliveries[index] = {
    ...mockDeliveries[index],
    status: 'DELIVERED',
    proofOfDelivery: {
      customerIdVerified: true,
      customerId: podData.customerId,
      photo: podData.photo,
      deliveredBy: podData.deliveredBy,
      timestamp: podData.timestamp,
    },
  }
  return mockDeliveries[index]
}

// ============================================================
// MOCK HELPERS — Retailer / Dispatcher
// ============================================================

export async function createMockDelivery(deliveryData) {
  await wait(400)
  const newDelivery = {
    id: `DEL-${nextId++}`,
    ...deliveryData,
    customerId: deliveryData.customerId || `CUST-${(deliveryData.customerPhone || '0000').replace(/\D/g, '').slice(-4)}`,
    status: 'OPEN',
    riderId: null,
    proofOfDelivery: null,
    createdAt: new Date().toISOString(),
  }
  mockDeliveries.push(newDelivery)
  return newDelivery
}

export async function getMockRiders() {
  await wait(300)
  return [...mockRiders]
}

export async function assignMockRider(deliveryId, riderId) {
  await wait(350)
  const index = mockDeliveries.findIndex((d) => d.id === deliveryId)
  if (index === -1) return null

  mockDeliveries[index] = {
    ...mockDeliveries[index],
    riderId,
    status: 'ASSIGNED',
  }
  return mockDeliveries[index]
}
