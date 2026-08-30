# Data Integrity Assumptions

Owner: Data

---

This document records the assumptions the current data layer (Mongoose schemas + service layer) relies on, and the gaps that follow from them. It complements [`architecture.md`](./architecture.md) (data model, indexes) and [`decisions.md`](./decisions.md) (state machine, error handling) rather than repeating them — read those first for how the system is supposed to behave; this doc is about where that behavior is not enforced at the data layer and has to be trusted instead.

## 1. Field names are consistent end-to-end

`customerName`, `customerPhone`, `deliveryAddress`, `itemDescription`, `status`, `riderId` on `Delivery`, and `name`, `phone`, `available` on `Rider` are identical across `backend/src/models/Delivery.js` / `Rider.js`, `docs/architecture.md`'s data model section, and every request/response example in `docs/api-contract.md`. There is no field-name drift between the documented contract and the implementation as of this review (2026-08-30).

## 2. `riderId` is a reference, not a guaranteed-valid foreign key

Mongoose casts `riderId` to an `ObjectId` and the schema declares `ref: 'Rider'`, but Mongoose does not enforce that the referenced `Rider` document exists — that check only happens inside `deliveryService.assignRider()`, which looks up the rider and rejects the request if it's missing. Any other write path that sets `riderId` directly (a future admin tool, a script, a bad migration) would not get that check for free. **Assumption:** all writes to `riderId` go through `assignRider()`. If a second write path is added, it must re-run the existence check itself.

## 3. `Rider.available` is a hand-maintained flag, not a computed one

`available` is not derived from querying deliveries — it's a boolean the application flips. `assignRider()` sets it to `false` when a rider is assigned. **Nothing in the codebase currently sets it back to `true`.** There is no "mark delivery complete and free the rider" step, so once a rider is assigned, they stay `available: false` forever, including after their delivery reaches `DELIVERED` — the terminal state. This is distinct from the race-condition weakness already logged in `trade-offs.md` (Weakness 2); that one is about the assign operation not being atomic, this one is about there being no release operation at all.

- **Consequence:** over time, riders accumulate in the `unavailable` state even though they're free to take new work, and `GET /api/riders?available=true` under-reports who's actually available.
- **Where this shows up in the seed data:** `backend/src/scripts/seed.js` deliberately seeds `available: false` for every rider that has an `ASSIGNED`, `PICKED_UP`, or `DELIVERED` delivery attached, specifically so the seeded database reflects a state the real application logic could actually produce, rather than a state that looks nicer but the app could never reach on its own.
- **Fix would require:** either a `DeliveryService.updateStatus()` branch that sets `rider.available = true` when status becomes `DELIVERED`, or (more robust) computing "available" at read time as `available flag === true AND no delivery in {ASSIGNED, PICKED_UP} references this rider`.

## 4. `status` and `riderId` are not cross-validated by the schema

The schema allows any combination of `status` and `riderId` — e.g. nothing at the Mongoose level stops a document with `status: 'REQUESTED'` and a non-null `riderId`, or `status: 'ASSIGNED'` with `riderId: null`. Today those combinations can't happen because the only way to change `status` or `riderId` is through `deliveryService` (`createDelivery` always starts `REQUESTED`/`riderId: null`; `assignRider` sets both together; `updateStatus` only changes `status`). **Assumption:** the service layer is the only write path. A direct `Delivery.updateOne()` or a bulk import could silently create an inconsistent document, and nothing would catch it until a client noticed something odd.

## 5. No uniqueness constraints on contact fields

Neither `customerPhone` nor `Rider.phone` is declared `unique` or indexed for lookups. Duplicate phone numbers across multiple riders or multiple customers are accepted silently. This is fine for the MVP (phone numbers aren't used as identifiers anywhere in the current API — `_id` is), but it means phone number can't be used later as a dedupe or login key without a migration to backfill uniqueness first.

## 6. No history of state transitions

`timestamps: true` gives every `Delivery` a single `createdAt`/`updatedAt`. There is no per-transition log (when it moved to `ASSIGNED`, when to `PICKED_UP`, etc.) — `updatedAt` only reflects the most recent change, and a delivery that went `ASSIGNED → PICKED_UP → DELIVERED` in the same request burst is indistinguishable, from stored data alone, from one that took days between steps. If the dashboard or reporting needs transition timestamps, that needs a new field (e.g. `statusHistory: [{ status, at }]`) — nothing in the current model captures it.

## 7. Referenced riders are never protected from deletion

There is no `DELETE /api/riders/:id` endpoint yet, so this is currently theoretical, but worth recording before one is added: deleting a `Rider` document would leave any `Delivery.riderId` pointing at a document that no longer exists. Mongoose's `ref` does not cascade or restrict deletes. Whoever implements rider deletion should either block it while the rider has a non-terminal delivery assigned, or explicitly decide what a "dangling" `riderId` should mean on read.

## 8. Invalid ObjectId format is now validated upfront

`getDeliveryById`, `assignRider`, and `updateStatus` in `deliveryService.js` call a `validateId()` helper before querying, so a malformed `:id` is rejected with `400 INVALID_ID` immediately rather than falling through to Mongoose and being caught as a `CastError` in `errorHandler.js`. (An earlier pass of this doc described the CastError catch as the only mechanism — that's been superseded; the centralized catch in `errorHandler.js` is still there as a backstop for any path that skips `validateId()`, which is worth keeping given there's no test yet asserting every id-bearing route calls it.)

Relatedly, `NotFoundError` now takes an explicit `code` argument, so "delivery not found" and "rider not found" responses carry `DELIVERY_NOT_FOUND` / `RIDER_NOT_FOUND` as documented in `api-contract.md`, instead of a generic `NOT_FOUND` both of them used to share — that mismatch against the documented contract existed at the time of the original field-name review in this doc and has since been fixed upstream.

## Seed data

`backend/src/scripts/seed.js` (run with `npm run seed` from `backend/`) resets the `riders` and `deliveries` collections and inserts:

- 5 riders — 2 available, 3 unavailable (each unavailable rider has a delivery assigned to them, per the assumption in §3 above).
- 5 deliveries — one in each of `REQUESTED` (×2), `ASSIGNED`, `PICKED_UP`, and `DELIVERED`, so all four states and the `GET /api/deliveries?status=` filter have data to exercise immediately after a fresh seed.

It is destructive (`deleteMany` before inserting) and intended for local/demo databases only — do not point `MONGODB_URI` at a shared or production database before running it.
