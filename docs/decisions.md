# Decisions

Owner: Kelvin

---

## Deliverable 2 — Delivery State Machine

### Allowed States

```
REQUESTED
ASSIGNED
PICKED_UP
DELIVERED
```

### Valid Transitions

```
REQUESTED  →  ASSIGNED     (dispatcher assigns a rider)
ASSIGNED   →  PICKED_UP    (rider confirms pickup)
PICKED_UP  →  DELIVERED    (rider confirms delivery)
```

### State Diagram

```
                    ┌────────────┐
                    │  REQUESTED │  ← Initial state on creation
                    └─────┬──────┘
                          │
               dispatcher assigns rider
                          │
                          ▼
                    ┌────────────┐
                    │  ASSIGNED  │
                    └─────┬──────┘
                          │
               rider confirms pickup
                          │
                          ▼
                    ┌────────────┐
                    │  PICKED_UP │
                    └─────┬──────┘
                          │
               rider confirms delivery
                          │
                          ▼
                    ┌────────────┐
                    │  DELIVERED │  ← Terminal state
                    └────────────┘
```

### Invalid Transitions (Blocked by Backend)

| Attempted Transition | Why Blocked |
|---|---|
| `REQUESTED → PICKED_UP` | Rider cannot pick up a delivery that hasn't been assigned to them. |
| `REQUESTED → DELIVERED` | Cannot skip assignment and pickup steps. |
| `ASSIGNED → DELIVERED` | Must confirm pickup before delivery. |
| `ASSIGNED → REQUESTED` | No backward transitions allowed. Once assigned, cannot un-assign. |
| `PICKED_UP → ASSIGNED` | No backward transitions. Once picked up, cannot revert. |
| `PICKED_UP → REQUESTED` | No backward transitions. |
| `DELIVERED → *` | DELIVERED is a terminal state. No transitions out. |

### Transition Enforcement (Backend Logic)

```javascript
const VALID_TRANSITIONS = {
  REQUESTED: ["ASSIGNED"],
  ASSIGNED:  ["PICKED_UP"],
  PICKED_UP: ["DELIVERED"],
  DELIVERED: []
};

function canTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed && allowed.includes(newStatus);
}
```

This function is called in the service layer before any database write. If the transition is invalid, the request is rejected with a `400 Bad Request` and a descriptive error message.

### Why the Backend Must Enforce Transitions (Not the Frontend)

1. **The frontend can be bypassed.** Anyone with an HTTP client (curl, Postman, scripts) can hit the API directly. If only the frontend enforces rules, a direct API call can create invalid states.

2. **Multiple clients exist.** The retailer, dispatcher, and rider all have separate frontend interfaces. Enforcing rules in each frontend means duplicating logic and risking inconsistency if one frontend has a bug.

3. **The backend is the single source of truth.** Business rules belong in the one place that all clients go through. If a new client is added (e.g., a mobile app), it automatically inherits the same rules.

4. **Socket.IO events must be consistent.** If the backend accepted invalid transitions, it would emit events describing impossible states, confusing all connected clients.

5. **Data integrity.** Once a delivery is `DELIVERED`, no client should be able to revert it to `REQUESTED`. Backend enforcement guarantees this regardless of client behavior.

---

## Deliverable 8 — Implementation Plan

### Ordered Steps

| # | Step | Description | Files Created/Modified |
|---|---|---|---|
| 1 | Initialize backend | `npm init`, install dependencies (express, mongoose, socket.io, cors, dotenv) | `package.json`, `.env` |
| 2 | Configure Express | Create Express app, configure middleware (JSON parsing, CORS) | `src/app.js`, `src/server.js` |
| 3 | Configure MongoDB | Connect to MongoDB using Mongoose with connection string from env | `src/config/db.js` |
| 4 | Create Delivery model | Define Mongoose schema and model for deliveries | `src/models/Delivery.js` |
| 5 | Create Rider model | Define Mongoose schema and model for riders | `src/models/Rider.js` |
| 6 | Implement delivery creation | `POST /api/deliveries` — validate fields, save to DB | `src/routes/deliveries.js`, `src/services/deliveryService.js` |
| 7 | Implement delivery retrieval | `GET /api/deliveries` (list), `GET /api/deliveries/:id` (single) | `src/routes/deliveries.js`, `src/services/deliveryService.js` |
| 8 | Implement rider retrieval | `GET /api/riders` — list all riders with availability | `src/routes/riders.js`, `src/services/riderService.js` |
| 9 | Implement rider assignment | `PATCH /api/deliveries/:id/assign` — validate rider availability, update delivery | `src/routes/deliveries.js`, `src/services/deliveryService.js` |
| 10 | Implement status transitions | `PATCH /api/deliveries/:id/status` — enforce state machine, update delivery | `src/routes/deliveries.js`, `src/services/deliveryService.js` |
| 11 | Add Socket.IO | Attach Socket.IO to server, emit events on create/assign/status-update | `src/server.js`, `src/services/deliveryService.js` |
| 12 | Add validation | Request body validation for all endpoints (required fields, types, lengths) | `src/middleware/validate.js` |
| 13 | Add error handling | Centralized error handler, consistent error responses, error classes | `src/middleware/errorHandler.js`, `src/utils/errors.js` |
| 14 | Add health check | `GET /api/health` — returns server status and DB connectivity | `src/routes/health.js` |
| 15 | Add tests | Unit tests for state machine, service layer, and API endpoints | `tests/` directory |
| 16 | Update documentation | Fill in all doc files (architecture, API contract, trade-offs, testing) | `docs/` |

### Dependencies Installed

```
express       — HTTP server and routing
mongoose      — MongoDB ODM
socket.io     — Real-time WebSocket communication
cors          — Cross-origin resource sharing (frontend on different port)
dotenv        — Environment variable management
```

### Dev Dependencies

```
jest          — Test runner
supertest     — HTTP endpoint testing
nodemon       — Auto-restart on file changes (dev only)
```

### Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/reflex
NODE_ENV=development
```

### File Structure (Final)

```
backend/
├── package.json
├── .env
├── src/
│   ├── server.js              # Entry point: creates HTTP server, attaches Socket.IO
│   ├── app.js                 # Express app configuration and middleware
│   ├── config/
│   │   └── db.js              # MongoDB connection logic
│   ├── models/
│   │   ├── Delivery.js        # Delivery Mongoose schema/model
│   │   └── Rider.js           # Rider Mongoose schema/model
│   ├── routes/
│   │   ├── deliveries.js      # Delivery API routes
│   │   ├── riders.js          # Rider API routes
│   │   └── health.js          # Health check route
│   ├── services/
│   │   ├── deliveryService.js # Delivery business logic
│   │   └── riderService.js    # Rider business logic
│   ├── middleware/
│   │   ├── validate.js        # Request validation middleware
│   │   └── errorHandler.js    # Centralized error handling
│   └── utils/
│       └── errors.js          # Custom error classes
├── tests/
│   ├── delivery.test.js       # Delivery endpoint tests
│   ├── rider.test.js          # Rider endpoint tests
│   └── stateMachine.test.js   # State transition unit tests
└── README.md
```

---

## Deliverable 6 — Error Handling

### Error Categories and Responses

| Error Scenario | HTTP Status | Error Code | Response Body |
|---|---|---|---|
| Missing required field(s) | `400 Bad Request` | `VALIDATION_ERROR` | `{ "error": "Validation failed", "details": ["Customer name is required"] }` |
| Invalid delivery ID (bad ObjectId format) | `400 Bad Request` | `INVALID_ID` | `{ "error": "Invalid delivery ID format" }` |
| Delivery not found | `404 Not Found` | `DELIVERY_NOT_FOUND` | `{ "error": "Delivery not found" }` |
| Invalid rider ID (bad ObjectId format) | `400 Bad Request` | `INVALID_ID` | `{ "error": "Invalid rider ID format" }` |
| Rider not found | `404 Not Found` | `RIDER_NOT_FOUND` | `{ "error": "Rider not found" }` |
| Rider not available | `409 Conflict` | `RIDER_UNAVAILABLE` | `{ "error": "Rider is not available" }` |
| Invalid status transition | `400 Bad Request` | `INVALID_TRANSITION` | `{ "error": "Cannot transition from ASSIGNED to REQUESTED" }` |
| Delivery already delivered | `400 Bad Request` | `INVALID_TRANSITION` | `{ "error": "Delivery is already delivered" }` |
| Database connection failure | `503 Service Unavailable` | `DATABASE_ERROR` | `{ "error": "Database connection failed" }` |
| Database query failure | `500 Internal Server Error` | `DATABASE_ERROR` | `{ "error": "Database operation failed" }` |
| Unexpected server error | `500 Internal Server Error` | `INTERNAL_ERROR` | `{ "error": "Internal server error" }` |

### Error Response Format

All error responses follow a consistent shape:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": ["Optional additional info"]
}
```

### Implementation Approach

1. **Custom error classes** (`AppError`, `ValidationError`, `NotFoundError`, etc.) in `src/utils/errors.js`.
2. **Async wrapper** — a utility that wraps route handlers to catch thrown errors and pass them to the error handler.
3. **Centralized error handler middleware** — catches all errors thrown from routes/services and formats the consistent JSON response.
4. **Mongoose validation errors** — caught and transformed into our standard `VALIDATION_ERROR` format.
5. **CastError (invalid ObjectId)** — caught from Mongoose and transformed into `INVALID_ID`.
