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

let mockDeliveries = [
  {
    id: 'DEL-2001',
    riderId: RIDER_ID,
    customerName: 'Otieno Kamau',
    customerPhone: '0723 987 654',
    address: "Ruring'u, Nyeri",
    itemDescription: 'HDMI cable, 20W adapter',
    status: 'ASSIGNED',
  },
  {
    id: 'DEL-2002',
    riderId: RIDER_ID,
    customerName: 'Achieng Lwanga',
    customerPhone: '0701 222 333',
    address: 'Kamakwa, Nyeri',
    itemDescription: 'Paracetamol, cough syrup',
    status: 'PICKED_UP',
  },
  {
    id: 'DEL-2003',
    riderId: RIDER_ID,
    customerName: 'Kimani Thuo',
    customerPhone: '0745 111 222',
    address: 'Kiganjo, Nyeri',
    itemDescription: 'Phone screen protector',
    status: 'DELIVERED',
  },
  {
    id: 'DEL-2004',
    riderId: RIDER_ID,
    customerName: 'Wanjiru Njoroge',
    customerPhone: '0733 444 555',
    address: 'Kamwe, Nyeri',
    itemDescription: '2kg rice, cooking oil',
    status: 'ASSIGNED',
  },
]

// Simulated network latency so loading states remain visible/testable
// in mock mode too (dashboard spinner, detail spinner).
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getMockDeliveries(riderId) {
  await wait(400)
  // Demo dataset only knows about one rider; return an empty list for
  // any other id rather than leaking data across "riders" in the demo.
  return mockDeliveries.filter((d) => d.riderId === riderId)
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
