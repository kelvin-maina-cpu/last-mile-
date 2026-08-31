# Demo Script

Owner: Kelvin (Backend)

---

## Prerequisites

1. MongoDB running locally on port 27017
2. Backend running: `cd backend && npm start`
3. Frontend available (or use API clients like curl/Postman)

---

## Demo Flow

### Step 1 — Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2026-08-30T10:00:00.000Z",
  "database": "connected"
}
```

---

### Step 2 — Create Delivery (Retailer)

```bash
curl -X POST http://localhost:3000/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Kamau",
    "customerPhone": "+254712345678",
    "deliveryAddress": "Westlands, Nairobi",
    "itemDescription": "Samsung Galaxy S23"
  }'
```

**Expected:** 201 Created with status: REQUESTED

---

### Step 3 — Show REQUESTED

```bash
curl http://localhost:3000/api/deliveries?status=REQUESTED
```

**Expected:** Delivery appears in REQUESTED state

---

### Step 4 — List Available Riders (Dispatcher)

```bash
curl http://localhost:3000/api/riders?available=true
```

**Expected:** List of available riders

---

### Step 5 — Assign Rider (Dispatcher)

```bash
curl -X PATCH http://localhost:3000/api/deliveries/<DELIVERY_ID>/assign \
  -H "Content-Type: application/json" \
  -d '{"riderId": "<RIDER_ID>"}'
```

**Expected:** 200 OK with status: ASSIGNED, rider.available becomes false

---

### Step 6 — Show ASSIGNED

```bash
curl http://localhost:3000/api/deliveries/<DELIVERY_ID>
```

**Expected:** Delivery status is ASSIGNED, riderId is set

---

### Step 7 — Mark PICKED_UP (Rider)

```bash
curl -X PATCH http://localhost:3000/api/deliveries/<DELIVERY_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PICKED_UP"}'
```

**Expected:** 200 OK with status: PICKED_UP

---

### Step 8 — Mark DELIVERED (Rider)

```bash
curl -X PATCH http://localhost:3000/api/deliveries/<DELIVERY_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "DELIVERED"}'
```

**Expected:** 200 OK with status: DELIVERED

---

### Step 9 — Demonstrate Invalid Transition

```bash
curl -X PATCH http://localhost:3000/api/deliveries/<DELIVERY_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PICKED_UP"}'
```

**Expected:** 400 INVALID_TRANSITION — "Delivery is already delivered"

---

### Step 10 — Demonstrate Unavailable Rider Rejection

```bash
curl -X PATCH http://localhost:3000/api/deliveries/<NEW_DELIVERY_ID>/assign \
  -H "Content-Type: application/json" \
  -d '{"riderId": "<UNAVAILABLE_RIDER_ID>"}'
```

**Expected:** 409 RIDER_UNAVAILABLE

---

### Step 11 — Demonstrate ASSIGNED Rejection via Status Endpoint

```bash
curl -X PATCH http://localhost:3000/api/deliveries/<REQUESTED_DELIVERY_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "ASSIGNED"}'
```

**Expected:** 400 VALIDATION_ERROR — ASSIGNED cannot be set through the status endpoint

---

### Step 12 — Demonstrate Real-Time Socket.IO

Open a Socket.IO client (browser console or test client):

```javascript
const socket = io('http://localhost:3000');
socket.on('delivery:created', (data) => console.log('Created:', data));
socket.on('delivery:assigned', (data) => console.log('Assigned:', data));
socket.on('delivery:status-updated', (data) => console.log('Status:', data));
```

Then create, assign, and update a delivery via API. All three events should appear in the console.

---

## Key Points to Highlight

1. **State machine enforcement**: Backend rejects invalid transitions
2. **ASSIGNED cannot be faked**: Must go through the assign endpoint
3. **Rider availability**: Once assigned, rider becomes unavailable
4. **Real-time updates**: Socket.IO broadcasts to all connected clients
5. **Error consistency**: All errors follow `{ error, code, details }` format
6. **MongoDB is source of truth**: Socket.IO is best-effort sync
