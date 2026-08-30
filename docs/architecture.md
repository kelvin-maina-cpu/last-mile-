# Architecture

Owner: Kelvin

---

## Deliverable 1 — System Architecture

### 1. Major Components

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Retailer   │    │  Dispatcher  │    │    Rider     │
│   (Browser)  │    │   (Browser)  │    │   (Browser)  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────┬───────┴───────────┬───────┘
                   │   HTTP (REST)     │
                   ▼                   ▼
          ┌─────────────────────────────────────┐
          │          Express.js Server           │
          │  ┌─────────────┐  ┌──────────────┐  │
          │  │  REST API   │  │  Socket.IO   │  │
          │  │  (Routes)   │  │  (Events)    │  │
          │  └──────┬──────┘  └──────┬───────┘  │
          │         │                │           │
          │  ┌──────▼──────────────▼────────┐   │
          │  │      Service Layer            │   │
          │  │  (DeliveryService,            │   │
          │  │   RiderService)               │   │
          │  └──────────────┬───────────────┘   │
          │                 │                   │
          │  ┌──────────────▼───────────────┐   │
          │  │      Mongoose ODM            │   │
          │  └──────────────┬───────────────┘   │
          └─────────────────┼───────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │     MongoDB      │
                  │   (Database)     │
                  └──────────────────┘
```

### 2. Responsibilities of Each Component

**Retailer / Dispatcher / Rider (Browser Clients)**
- Each is a separate frontend page (or single-page app) that communicates with the backend.
- Retailer: Creates delivery requests.
- Dispatcher: Views open deliveries, assigns riders.
- Rider: Views assigned deliveries, updates status.
- All three connect to the same REST API and subscribe to Socket.IO events for real-time updates.

**Express.js Server (HTTP Layer)**
- Routes incoming HTTP requests to the correct controller/handler.
- Parses and validates request bodies.
- Returns consistent JSON responses with appropriate status codes.
- Serves as the single entry point for all client communication.

**REST API (Routes)**
- Defines the URL structure and HTTP methods for each operation.
- Maps endpoints to handler functions in the service layer.
- Handles request/response formatting.

**Socket.IO (Real-Time Events)**
- Manages persistent WebSocket connections from connected clients.
- Emits events when deliveries are created, assigned, or status-updated.
- Allows clients to receive live updates without polling.
- Rooms/broadcasts events only to relevant clients.

**Service Layer (Business Logic)**
- Contains all business rules: state machine transitions, rider assignment validation, field validation.
- Orchestrates database operations through Mongoose.
- Emits Socket.IO events after successful database mutations.
- The only layer that decides what is valid and what is not.

**Mongoose ODM (Data Access)**
- Defines schemas and models for Delivery and Rider.
- Provides methods to create, query, update, and validate documents.
- Handles connection management to MongoDB.
- Enforces schema-level constraints (required fields, enums, types).

**MongoDB (Database)**
- Stores all delivery and rider documents.
- Provides persistence across server restarts.
- Source of truth for all system state.

### 3. Data Flow

**Creating a delivery (Retailer):**
```
Retailer Browser
  → POST /api/deliveries (HTTP request with JSON body)
    → Express Route Handler
      → DeliveryService.createDelivery()
        → Validate required fields
        → Mongoose Delivery.create()
          → MongoDB writes document
        ← Returns saved document
      → Socket.IO emits "delivery:created" to all connected dispatchers
    ← HTTP 201 with delivery JSON
```

**Assigning a rider (Dispatcher):**
```
Dispatcher Browser
  → PATCH /api/deliveries/:id/assign (HTTP request with riderId)
    → Express Route Handler
      → DeliveryService.assignRider()
        → Validate delivery exists and status is REQUESTED
        → Validate rider exists and is available
        → Mongoose Delivery.findByIdAndUpdate()
          → MongoDB updates document
        → Mongoose Rider.findByIdAndUpdate()
          → MongoDB updates rider availability
      → Socket.IO emits "delivery:assigned" to all clients
    ← HTTP 200 with updated delivery JSON
```

**Updating status (Rider):**
```
Rider Browser
  → PATCH /api/deliveries/:id/status (HTTP request with status)
    → Express Route Handler
      → DeliveryService.updateStatus()
        → Validate delivery exists
        → Validate transition is valid per state machine
        → Mongoose Delivery.findByIdAndUpdate()
          → MongoDB updates document
      → Socket.IO emits "delivery:status-updated" to all clients
    ← HTTP 200 with updated delivery JSON
```

### 4. Technology Selections

| Technology | Why Selected |
|---|---|
| **Node.js** | JavaScript runtime that the team already uses. Non-blocking I/O is well-suited for handling concurrent client connections. Simple deployment story. |
| **Express.js** | Minimal, well-documented Node.js web framework. Large ecosystem. No opinions forced — we stay in control. Industry standard for Node.js REST APIs. |
| **MongoDB** | Document database that stores JSON natively — maps directly to our JavaScript objects. Schema flexibility fits an MVP where we may adjust fields. Mongoose provides structure on top. |
| **Mongoose** | ODM that gives us schema validation, type casting, and query building on top of MongoDB. Adds guardrails without a full ORM complexity. |
| **Socket.IO** | Built-in support for rooms, reconnection, and fallback to long-polling if WebSockets fail. Well-suited for the real-time event pattern we need. |

### 5. Alternatives Considered

| Technology | Why Not Chosen |
|---|---|
| **PostgreSQL + Prisma** | Stronger relational guarantees, but adds SQL complexity. MongoDB's document model is simpler for this MVP's data shapes (single delivery document, no complex joins). |
| **Express alternatives (Fastify, Koa)** | Faster raw throughput, but Express has the largest ecosystem and team familiarity. Not worth switching for an MVP. |
| **Socket alternatives (native WebSocket, Pusher)** | Native WebSocket requires manual room management and reconnection handling. Pusher is third-party hosted — adds cost and vendor dependency. Socket.IO handles our needs in-house. |
| **Redis adapter for Socket.IO** | Would enable multi-process scaling, but we are running a single server process for MVP. Adds operational complexity we don't need yet. |

### 6. Architectural Trade-Offs (Design-Level)

**Trade-off 1: Single process server**
- We run Express + Socket.IO in one Node.js process.
- *Why accepted:* For MVP, one process is sufficient. We don't need horizontal scaling yet.
- *Consequence:* If the process crashes, all Socket.IO connections drop. There is no automatic failover.
- *Improvement with more time:* Add a process manager (PM2) and a Redis adapter for Socket.IO to support multiple instances.

**Trade-off 2: Socket.IO broadcasts to all connected clients**
- All delivery events are broadcast to every connected client, not scoped to specific rooms.
- *Why accepted:* For MVP with a small number of concurrent users, broadcasting is simple and correct — every client needs to see delivery updates.
- *Consequence:* If the system scales to hundreds of concurrent users, clients will receive events they don't care about.
- *Improvement with more time:* Use Socket.IO rooms (e.g., per-dispatcher, per-rider) to scope broadcasts.

---

## Deliverable 3 — Data Model

### Delivery Model

```javascript
const deliverySchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
    maxlength: 200
  },
  customerPhone: {
    type: String,
    required: [true, "Customer phone is required"],
    trim: true,
    maxlength: 20
  },
  deliveryAddress: {
    type: String,
    required: [true, "Delivery address is required"],
    trim: true,
    maxlength: 500
  },
  itemDescription: {
    type: String,
    required: [true, "Item description is required"],
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ["REQUESTED", "ASSIGNED", "PICKED_UP", "DELIVERED"],
    default: "REQUESTED",
    required: true
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rider",
    default: null
  }
}, {
  timestamps: true  // auto-manages createdAt and updatedAt
});
```

**Generated fields (by Mongoose):**
- `_id` — serves as `deliveryId`
- `createdAt` — auto-set on creation
- `updatedAt` — auto-set on every update

### Rider Model

```javascript
const riderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Rider name is required"],
    trim: true,
    maxlength: 200
  },
  phone: {
    type: String,
    required: [true, "Rider phone is required"],
    trim: true,
    maxlength: 20
  },
  available: {
    type: Boolean,
    default: true,
    required: true
  }
}, {
  timestamps: true
});
```

**Generated fields (by Mongoose):**
- `_id` — serves as `riderId`
- `createdAt` / `updatedAt`

### Relationships

- **Delivery → Rider:** A Delivery has an optional `riderId` (ObjectId reference to Rider). When a delivery is assigned, `riderId` is set to the rider's `_id`. A rider can have multiple deliveries over time, but for MVP we track only the current assignment.
- **Rider → Delivery:** The relationship is unidirectional (Delivery references Rider). We do not maintain a `deliveries[]` array on Rider — this keeps the model simple and avoids array-size limits. To find all deliveries for a rider, we query `Delivery.find({ riderId })`.

**Why no embedded rider in delivery?**
Storing a reference (`riderId`) instead of embedding rider data avoids data duplication and stale rider information. If a rider's phone number changes, it changes in one place.

### Indexes

| Collection | Index | Purpose |
|---|---|---|
| `deliveries` | `{ status: 1 }` | Dispatcher frequently queries "show me all REQUESTED deliveries". An index on status makes this query fast. |
| `deliveries` | `{ riderId: 1 }` | Rider queries "show me my assigned deliveries". Index on riderId speeds this up. |
| `deliveries` | `{ createdAt: -1 }` | Sorting deliveries by newest first (default list view). |
| `riders` | `{ available: 1 }` | Dispatcher queries "show me available riders" when assigning. |

These indexes matter because the three most frequent queries are: list open deliveries, list my deliveries, and list available riders. Without indexes, these are full collection scans.

---

## Deliverable 5 — Real-Time Synchronization

### Socket.IO Setup

Socket.IO is attached to the same HTTP server as Express:

```javascript
const server = http.createServer(app);
const io = new Server(server);
```

All connected clients (retailer, dispatcher, rider browsers) establish a Socket.IO connection when they load their page.

### Events

#### `delivery:created`

- **When emitted:** After a new delivery is successfully created via `POST /api/deliveries`.
- **Payload:**
  ```json
  {
    "delivery": {
      "_id": "...",
      "customerName": "...",
      "customerPhone": "...",
      "deliveryAddress": "...",
      "itemDescription": "...",
      "status": "REQUESTED",
      "riderId": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Who receives it:** All connected clients (dispatchers see new deliveries appear, riders may see it too).
- **Implementation:** `io.emit("delivery:created", { delivery })` — broadcasts to all.

#### `delivery:assigned`

- **When emitted:** After a dispatcher successfully assigns a rider via `PATCH /api/deliveries/:id/assign`.
- **Payload:**
  ```json
  {
    "delivery": { "...full delivery object..." },
    "rider": { "...rider object..." }
  }
  ```
- **Who receives it:** All connected clients. Dispatchers see the delivery move from open to assigned. The assigned rider sees a new delivery appear in their list.
- **Implementation:** `io.emit("delivery:assigned", { delivery, rider })` — broadcasts to all.

#### `delivery:status-updated`

- **When emitted:** After a rider successfully updates delivery status via `PATCH /api/deliveries/:id/status`.
- **Payload:**
  ```json
  {
    "delivery": { "...full delivery object with new status..." }
  }
  ```
- **Who receives it:** All connected clients. Dispatchers see progress updates. The retailer sees the delivery move toward completion.
- **Implementation:** `io.emit("delivery:status-updated", { delivery })` — broadcasts to all.

### Reconnection Behavior

Socket.IO has built-in reconnection. If a client temporarily disconnects:

1. Socket.IO automatically attempts to reconnect with exponential backoff.
2. On reconnection, the client should re-fetch current state from the REST API (`GET /api/deliveries` or `GET /api/deliveries/:id`).
3. **We do not guarantee durable delivery of Socket.IO events.** Events emitted while a client is disconnected are lost.

**MongoDB / REST API is the source of truth.** Socket.IO events are a convenience for real-time UI updates. Clients must not treat missed events as missing data — they can always fetch the authoritative state from the API.

### Why Broadcast to All (Not Rooms)?

For MVP, all three personas need to see delivery state changes. Dispatchers need to see everything. Riders need to see their assignments. Retailers need to see their delivery progress. With a small user count, broadcasting is simpler than room management and ensures no client misses a relevant update.

We explicitly document this as a scalability trade-off (see Trade-offs section).
