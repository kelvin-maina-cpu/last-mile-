# API Contract

Owner: Kelvin

Base URL: `http://localhost:3000`

All responses are JSON (`Content-Type: application/json`).

---

## POST /api/deliveries

**Purpose:** Create a new delivery request.

**Request Body:**
```json
{
  "customerName": "string (required)",
  "customerPhone": "string (required)",
  "deliveryAddress": "string (required)",
  "itemDescription": "string (required)"
}
```

**Required Fields:** `customerName`, `customerPhone`, `deliveryAddress`, `itemDescription`

**Success Response:**
- Status: `201 Created`
```json
{
  "delivery": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "customerName": "John Kamau",
    "customerPhone": "+254712345678",
    "deliveryAddress": "123 Nairobi St, Westlands",
    "itemDescription": "Samsung Galaxy S23",
    "status": "REQUESTED",
    "riderId": null,
    "createdAt": "2026-08-30T10:00:00.000Z",
    "updatedAt": "2026-08-30T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Missing required fields
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": ["Customer name is required", "Customer phone is required"]
}
```

**Side Effects:** Emits `delivery:created` event via Socket.IO to all connected clients.

---

## GET /api/deliveries

**Purpose:** List all deliveries, optionally filtered by status.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by status: `REQUESTED`, `ASSIGNED`, `PICKED_UP`, `DELIVERED` |

**Success Response:**
- Status: `200 OK`
```json
{
  "deliveries": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "customerName": "John Kamau",
      "customerPhone": "+254712345678",
      "deliveryAddress": "123 Nairobi St, Westlands",
      "itemDescription": "Samsung Galaxy S23",
      "status": "REQUESTED",
      "riderId": null,
      "createdAt": "2026-08-30T10:00:00.000Z",
      "updatedAt": "2026-08-30T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error` — Database failure

---

## GET /api/deliveries/:id

**Purpose:** Get a single delivery by ID.

**URL Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `id` | string | MongoDB ObjectId of the delivery |

**Success Response:**
- Status: `200 OK`
```json
{
  "delivery": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "customerName": "John Kamau",
    "customerPhone": "+254712345678",
    "deliveryAddress": "123 Nairobi St, Westlands",
    "itemDescription": "Samsung Galaxy S23",
    "status": "ASSIGNED",
    "riderId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "createdAt": "2026-08-30T10:00:00.000Z",
    "updatedAt": "2026-08-30T10:05:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Invalid ID format
```json
{
  "error": "Invalid delivery ID format",
  "code": "INVALID_ID"
}
```
- `404 Not Found` — Delivery does not exist
```json
{
  "error": "Delivery not found",
  "code": "DELIVERY_NOT_FOUND"
}
```

---

## PATCH /api/deliveries/:id/assign

**Purpose:** Assign a rider to a delivery. Only allowed when delivery status is `REQUESTED`.

**URL Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `id` | string | MongoDB ObjectId of the delivery |

**Request Body:**
```json
{
  "riderId": "string (required)"
}
```

**Required Fields:** `riderId`

**Success Response:**
- Status: `200 OK`
```json
{
  "delivery": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "customerName": "John Kamau",
    "customerPhone": "+254712345678",
    "deliveryAddress": "123 Nairobi St, Westlands",
    "itemDescription": "Samsung Galaxy S23",
    "status": "ASSIGNED",
    "riderId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "createdAt": "2026-08-30T10:00:00.000Z",
    "updatedAt": "2026-08-30T10:05:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Invalid delivery ID or rider ID format
```json
{
  "error": "Invalid delivery ID format",
  "code": "INVALID_ID"
}
```
- `400 Bad Request` — Invalid status transition (delivery not in REQUESTED state)
```json
{
  "error": "Cannot assign rider: delivery status is ASSIGNED, must be REQUESTED",
  "code": "INVALID_TRANSITION"
}
```
- `404 Not Found` — Delivery or rider not found
```json
{
  "error": "Delivery not found",
  "code": "DELIVERY_NOT_FOUND"
}
```
- `404 Not Found`
```json
{
  "error": "Rider not found",
  "code": "RIDER_NOT_FOUND"
}
```
- `409 Conflict` — Rider is not available
```json
{
  "error": "Rider is not available",
  "code": "RIDER_UNAVAILABLE"
}
```

**Side Effects:**
- Sets delivery `status` to `ASSIGNED` and `riderId` to the provided rider.
- Sets rider `available` to `false`.
- Emits `delivery:assigned` event via Socket.IO to all connected clients.

---

## PATCH /api/deliveries/:id/status

**Purpose:** Update delivery status. Must follow valid state transitions.

**URL Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `id` | string | MongoDB ObjectId of the delivery |

**Request Body:**
```json
{
  "status": "string (required) — one of: PICKED_UP, DELIVERED"
}
```

**Required Fields:** `status`

**Valid Transitions:**
| Current Status | Allowed New Status |
|---|---|
| ASSIGNED | PICKED_UP |
| PICKED_UP | DELIVERED |

**Success Response:**
- Status: `200 OK`
```json
{
  "delivery": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "customerName": "John Kamau",
    "customerPhone": "+254712345678",
    "deliveryAddress": "123 Nairobi St, Westlands",
    "itemDescription": "Samsung Galaxy S23",
    "status": "PICKED_UP",
    "riderId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "createdAt": "2026-08-30T10:00:00.000Z",
    "updatedAt": "2026-08-30T10:10:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Invalid delivery ID format
```json
{
  "error": "Invalid delivery ID format",
  "code": "INVALID_ID"
}
```
- `400 Bad Request` — Invalid status value
```json
{
  "error": "Invalid status value. Must be one of: PICKED_UP, DELIVERED",
  "code": "VALIDATION_ERROR"
}
```
- `400 Bad Request` — Invalid transition
```json
{
  "error": "Cannot transition from REQUESTED to PICKED_UP",
  "code": "INVALID_TRANSITION"
}
```
- `404 Not Found` — Delivery does not exist
```json
{
  "error": "Delivery not found",
  "code": "DELIVERY_NOT_FOUND"
}
```

**Side Effects:** Emits `delivery:status-updated` event via Socket.IO to all connected clients.

---

## GET /api/riders

**Purpose:** List all riders.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `available` | boolean | No | Filter by availability (`true` or `false`) |

**Success Response:**
- Status: `200 OK`
```json
{
  "riders": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Peter Otieno",
      "phone": "+254723456789",
      "available": true,
      "createdAt": "2026-08-30T09:00:00.000Z",
      "updatedAt": "2026-08-30T09:00:00.000Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Grace Wanjiku",
      "phone": "+254734567890",
      "available": false,
      "createdAt": "2026-08-30T09:00:00.000Z",
      "updatedAt": "2026-08-30T10:05:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error` — Database failure

---

## GET /api/health

**Purpose:** Health check endpoint. Returns server status and database connectivity.

**Success Response:**
- Status: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-08-30T10:00:00.000Z",
  "database": "connected"
}
```

**Error Response (DB down):**
- Status: `503 Service Unavailable`
```json
{
  "status": "unhealthy",
  "timestamp": "2026-08-30T10:00:00.000Z",
  "database": "disconnected"
}
```

---

## Response Format Summary

All successful responses:
```json
{
  "<resource>": { ... }       // single object
  "<resource>s": [ ... ]      // array (plural key)
}
```

All error responses:
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": ["Optional array of additional details"]
}
```
