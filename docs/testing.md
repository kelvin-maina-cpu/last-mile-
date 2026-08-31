# Testing

Owner: Kelvin (Backend)

---

## Testing Strategy

The backend uses **Jest** as the test runner and **Supertest** for HTTP endpoint testing. Socket.IO client tests use the **socket.io-client** package.

All tests run against a local MongoDB instance (`mongodb://localhost:27017/reflex_test`) to verify real behavior. No mocking of the database layer.

---

## Test Command

```bash
cd backend
npm test
```

This runs:

```bash
jest --runInBand --forceExit
```

- `--runInBand`: runs test files sequentially (required for shared MongoDB connection)
- `--forceExit`: exits after tests complete even if handles remain open

---

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `tests/api.test.js` | 49 | Health, CRUD, validation, assignment, state machine, error handling |
| `tests/realtime.test.js` | 4 | Socket.IO event emission (created, assigned, status-updated) |

**Total: 53 tests**

---

## Test Categories

### 1. Health Endpoint (1 test)
- `GET /api/health` returns 200 with healthy status

### 2. Delivery Creation (7 tests)
- Successful creation (201)
- Rejection of empty body (400)
- Rejection of each missing required field (400 × 4)
- Status forced to REQUESTED even if client sends DELIVERED

### 3. Delivery Retrieval (5 tests)
- List all deliveries (200)
- Filter by status (200)
- Get single delivery by ID (200)
- Nonexistent delivery → 404
- Malformed ID → 400

### 4. Rider Retrieval (3 tests)
- List all riders (200)
- Filter available riders (200)
- Filter unavailable riders (200)

### 5. Rider Assignment (8 tests)
- Successful assignment (200)
- Nonexistent rider → 404 (RIDER_NOT_FOUND)
- Malformed rider ID → 400 (INVALID_ID)
- Malformed delivery ID → 400 (INVALID_ID)
- Unavailable rider → 409 (RIDER_UNAVAILABLE)
- Assign to ASSIGNED delivery → 400 (INVALID_TRANSITION)
- Assign to PICKED_UP delivery → 400 (INVALID_TRANSITION)
- Assign to DELIVERED delivery → 400 (INVALID_TRANSITION)
- Missing riderId → 400 (VALIDATION_ERROR)

### 6. Status Transitions — Happy Path (3 tests)
- ASSIGNED → PICKED_UP (200)
- PICKED_UP → DELIVERED (200)
- Full lifecycle: ASSIGNED → PICKED_UP → DELIVERED

### 7. Status Transitions — CRITICAL: ASSIGNED Rejection (2 tests)
- `PATCH /api/deliveries/:id/status` with `{"status": "ASSIGNED"}` → **400**
- Delivery must remain REQUESTED
- ASSIGNED created only through `PATCH /api/deliveries/:id/assign`

### 8. Status Transitions — Invalid (2 tests)
- REQUESTED → PICKED_UP → 400 (INVALID_TRANSITION)
- REQUESTED → DELIVERED → 400 (INVALID_TRANSITION)

### 9. Status Transitions — DELIVERED Terminal (4 tests)
- DELIVERED → PICKED_UP → 400
- DELIVERED → ASSIGNED → 400
- DELIVERED → REQUESTED → 400
- Special "already delivered" message

### 10. Invalid Status Values (4 tests)
- Invalid status string → 400 (VALIDATION_ERROR)
- Missing status → 400 (VALIDATION_ERROR)
- Nonexistent delivery → 404 (DELIVERY_NOT_FOUND)
- Malformed delivery ID → 400 (INVALID_ID)

### 11. State Machine Unit Tests (8 tests)
- canTransition valid transitions (3)
- canTransition invalid transitions (4)
- VALID_TRANSITIONS map structure (1)

### 12. Socket.IO Events (4 tests)
- `delivery:created` emitted on POST
- `delivery:assigned` emitted on assign
- `delivery:status-updated` emitted on PICKED_UP
- `delivery:status-updated` emitted on DELIVERED

---

## Required Local Services

- **MongoDB** running locally on port 27017
- The tests use a separate `reflex_test` database (not `reflex`)
- The test database is cleaned before and after each test run

---

## Expected Test Result

```
PASS tests/api.test.js
PASS tests/realtime.test.js

Test Suites: 2 passed, 2 total
Tests:       53 passed, 53 total
```

---

## Negative Test Summary

All 16 required negative test scenarios are covered:

| # | Scenario | Expected | Test |
|---|----------|----------|------|
| 1 | Missing customerName | 400 VALIDATION_ERROR | ✅ |
| 2 | Missing customerPhone | 400 VALIDATION_ERROR | ✅ |
| 3 | Missing deliveryAddress | 400 VALIDATION_ERROR | ✅ |
| 4 | Missing itemDescription | 400 VALIDATION_ERROR | ✅ |
| 5 | Invalid delivery ID | 400 INVALID_ID | ✅ |
| 6 | Nonexistent delivery | 404 DELIVERY_NOT_FOUND | ✅ |
| 7 | Invalid rider ID | 400 INVALID_ID | ✅ |
| 8 | Nonexistent rider | 404 RIDER_NOT_FOUND | ✅ |
| 9 | Assign unavailable rider | 409 RIDER_UNAVAILABLE | ✅ |
| 10 | Assign to ASSIGNED delivery | 400 INVALID_TRANSITION | ✅ |
| 11 | REQUESTED → PICKED_UP | 400 INVALID_TRANSITION | ✅ |
| 12 | REQUESTED → DELIVERED | 400 INVALID_TRANSITION | ✅ |
| 13 | ASSIGNED → DELIVERED | 400 INVALID_TRANSITION | ✅ |
| 14 | DELIVERED → PICKED_UP | 400 INVALID_TRANSITION | ✅ |
| 15 | Invalid status value | 400 VALIDATION_ERROR | ✅ |
| 16 | ASSIGNED via status endpoint | 400 (CRITICAL) | ✅ |
