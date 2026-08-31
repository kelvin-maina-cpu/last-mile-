# Backend

Owner: Kelvin

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Copy `.env` and adjust if needed:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/reflex
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running locally on port 27017.

### 4. Start the server

```bash
npm start
```

Or with auto-restart during development:

```bash
npm run dev
```

### 5. Seed test data (optional)

```bash
npm run seed
```

### 6. Run tests

```bash
npm test
```

Expected result:
```
PASS tests/api.test.js
PASS tests/realtime.test.js

Test Suites: 2 passed, 2 total
Tests:       53 passed, 53 total
```

### 7. Test the health endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-08-30T10:00:00.000Z",
  "database": "connected"
}
```

## Project Structure

```
backend/
├── package.json
├── .env
├── .env.example
├── .gitignore
├── seed.js
├── src/
│   ├── server.js              # Entry point: HTTP server + Socket.IO
│   ├── app.js                 # Express app, middleware, route mounting
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── Delivery.js        # Delivery Mongoose schema
│   │   └── Rider.js           # Rider Mongoose schema
│   ├── routes/
│   │   ├── health.js          # Health check endpoint
│   │   ├── deliveries.js      # Delivery API routes
│   │   └── riders.js          # Rider API routes
│   ├── services/
│   │   ├── deliveryService.js # Delivery business logic
│   │   └── riderService.js    # Rider business logic
│   ├── middleware/
│   │   ├── validate.js        # Request validation
│   │   └── errorHandler.js    # Centralized error handling
│   └── utils/
│       └── errors.js          # Custom error classes
├── tests/
│   ├── api.test.js            # API endpoint + state machine tests
│   └── realtime.test.js       # Socket.IO event tests
└── README.md
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check — server status and DB connectivity |
| POST | `/api/deliveries` | Create a new delivery request (status: REQUESTED) |
| GET | `/api/deliveries` | List all deliveries (optional `?status=` filter) |
| GET | `/api/deliveries/:id` | Get a single delivery by ID |
| PATCH | `/api/deliveries/:id/assign` | Assign a rider to a delivery |
| PATCH | `/api/deliveries/:id/status` | Update delivery status (state machine enforced) |
| GET | `/api/riders` | List all riders (optional `?available=` filter) |

## State Machine

```
REQUESTED → ASSIGNED → PICKED_UP → DELIVERED
```

- **REQUESTED → ASSIGNED**: Only through `PATCH /api/deliveries/:id/assign`
- **ASSIGNED → PICKED_UP**: Through `PATCH /api/deliveries/:id/status`
- **PICKED_UP → DELIVERED**: Through `PATCH /api/deliveries/:id/status`
- **DELIVERED**: Terminal state — no transitions out

The status endpoint only accepts `PICKED_UP` and `DELIVERED` as new values. `ASSIGNED` cannot be submitted through the status endpoint.

## Real-Time Events (Socket.IO)

| Event | When | Payload |
|-------|------|---------|
| `delivery:created` | New delivery created | `{ delivery }` |
| `delivery:assigned` | Rider assigned to delivery | `{ delivery, rider }` |
| `delivery:status-updated` | Delivery status changes | `{ delivery }` |

## Error Format

All errors follow:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": ["Optional additional info"]
}
```

## Implementation Status

**All 7 endpoints are implemented and tested.**

- Health check: ✅
- Delivery CRUD: ✅
- Rider assignment: ✅
- State machine enforcement: ✅
- Socket.IO events: ✅
- Input validation: ✅
- Error handling: ✅
- Automated tests: ✅ (53 tests)

## Known MVP Trade-offs

- No authentication (any client can call any endpoint)
- No concurrency protection on rider assignment
- No pagination on list endpoints
- Permissive CORS (`origin: '*'`)
- Socket.IO broadcasts to all clients (no room scoping)
