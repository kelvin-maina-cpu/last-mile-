# API Contract

Draft v0 — owned by Backend (Kelvin). Update as endpoints firm up; every breaking change gets a line in `decisions.md`.

Base path: `/api/v1`

## Authentication

TBD — placeholder until the team decides (see `decisions.md`). Assume a bearer token on every request below until specified otherwise.

## Deliveries

### Create a delivery
`POST /deliveries`

Request:

    {
      "retailer_id": "string",
      "pickup_address": "string",
      "dropoff_address": "string",
      "items": "string",
      "notes": "string (optional)"
    }

Response `201`:

    {
      "id": "string",
      "status": "CREATED",
      "created_at": "ISO 8601 timestamp"
    }

### List / retrieve deliveries
`GET /deliveries` — list, filterable by `status`, `rider_id`, `retailer_id`.

`GET /deliveries/{id}` — single delivery, including current status and assignment.

### Assign a rider
`POST /deliveries/{id}/assign`

Request:

    { "rider_id": "string" }

Response `200`: updated delivery, `status: "ASSIGNED"`.

Errors: `409` if delivery is not in `CREATED`; `404` if rider or delivery not found.

### Update delivery status
`POST /deliveries/{id}/status`

Request:

    { "status": "PICKED_UP | IN_TRANSIT | DELIVERED | FAILED", "note": "string (optional, required for FAILED)" }

Response `200`: updated delivery.

Errors: `409` on an invalid transition (see the state machine in `architecture.md`); `422` if `FAILED` is submitted without a note.

## Riders

`GET /riders` — list riders, filterable by availability.

`GET /riders/{id}` — rider detail, including current assignment if any.

(Rider creation/schema owned by the Data track — see the board.)

## Real-time events

Mechanism TBD (see `decisions.md`). Whatever is chosen, it emits at minimum: `delivery.assigned`, `delivery.status_changed`, each carrying the updated delivery object.

## Error format

All errors return:

    {
      "error": "string (machine-readable code)",
      "message": "string (human-readable)"
    }

Standard codes: `400` malformed request, `401` unauthenticated, `404` not found, `409` invalid state transition, `422` validation failure.
