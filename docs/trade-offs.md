# Trade-off Log

Owner: Presentation track

---

## Deliverable 7 — Architectural Weaknesses

### Weakness 1: No Authentication or Authorization

**Weakness:** Any client with network access can call any API endpoint. There is no concept of user identity — we cannot distinguish a retailer from a rider from a random HTTP client.

**Why accepted for MVP:** Authentication adds significant complexity: login flows, token management, role-based access control, password hashing, session storage. For an MVP demo, we need to show the delivery lifecycle works correctly. The three personas are simulated by using separate browser windows.

**Consequence:** In a real deployment, a malicious user could assign riders they shouldn't assign, view deliveries they shouldn't see, or update statuses they shouldn't update. There is no audit trail of who performed which action.

**What we would improve with more time:** Add JWT-based authentication with role-based access control (RBAC). Each persona gets a role (RETAILER, DISPATCHER, RIDER), and middleware enforces which endpoints each role can access.

---

### Weakness 2: No Concurrency Protection on Assignments

**Weakness:** Two dispatchers can simultaneously assign the same rider to two different deliveries. The rider ends up assigned to both, but their `available` flag is set to `false` after the first assignment — the second assignment doesn't check availability atomically.

**Why accepted for MVP:** With a small team and low concurrency, this race condition is unlikely in practice. Adding atomic operations (MongoDB transactions, distributed locks) introduces complexity that distracts from the core delivery lifecycle demonstration.

**Consequence:** In a real scenario, a rider could be assigned to two concurrent deliveries, making it physically impossible to complete both on time. The system would show an incorrect state.

**What we would improve with more time:** Use MongoDB transactions (requires replica set) or an atomic find-and-modify operation with a condition check: `{ available: true }` as part of the rider update query. If the update affects 0 documents, we know the rider was taken between the check and the write.

---

### Weakness 3: No Pagination or Limits on List Endpoints

**Weakness:** `GET /api/deliveries` returns all deliveries in the database. As the system accumulates data, response sizes grow without bound. There is no limit, offset, or cursor-based pagination.

**Why accepted for MVP:** In the early days, there will be dozens of deliveries, not thousands. A single response with all deliveries is simpler for the frontend to consume and simpler to implement. Pagination adds query complexity, cursor management, and frontend state management for infinite scroll or page numbers.

**Consequence:** After months of operation, the list endpoint will become slow as it loads thousands of documents. The frontend will render slowly. Memory usage on both server and client increases.

**What we would improve with more time:** Add limit/offset query parameters and default to 50 deliveries per page. Add cursor-based pagination for efficient large-dataset traversal. Add a count endpoint or include total count in responses.

---

## Design-Level Trade-offs (from Architecture)

### Trade-off 4: Broadcast Events to All Clients (No Room Scoping)

**Weakness:** Socket.IO events (`delivery:created`, `delivery:assigned`, `delivery:status-updated`) are broadcast to every connected client. A rider receives events about deliveries they are not assigned to. A retailer receives events about other retailers' deliveries.

**Why accepted for MVP:** The number of concurrent users is small. Every client has some interest in delivery state changes. Room management adds complexity (joining/leaving rooms, tracking which room each client belongs to).

**Consequence:** Wasted bandwidth and client-side processing as the system scales. Clients must filter events they receive. In a high-traffic scenario, this becomes a performance bottleneck.

**What we would improve with more time:** Use Socket.IO rooms scoped by persona (dispatcher room, rider room per riderId). Emit targeted events only to relevant rooms.

---

### Trade-off 5: Single MongoDB Instance (No Replication)

**Weakness:** MongoDB runs as a single instance. If it crashes, the entire backend becomes non-functional. There is no automatic failover.

**Why accepted for MVP:** A replica set requires at least three MongoDB instances, which adds infrastructure cost and operational complexity. For a demo/MVP, a single instance is sufficient.

**Consequence:** Any MongoDB failure is a complete outage. Data could be lost if the disk fails before a backup.

**What we would improve with more time:** Deploy a MongoDB replica set (3 members minimum) for automatic failover and data redundancy. Use MongoDB Atlas for managed replication and backups.
