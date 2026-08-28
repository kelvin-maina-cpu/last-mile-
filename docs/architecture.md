# Architecture

## Overview

Last Mile coordinates three actors around a single source of truth for delivery state:

- Retailer — creates a delivery request (pickup details, drop-off address, items/notes).
- Dispatcher — sees incoming deliveries, assigns a rider, monitors progress.
- Rider — sees assigned deliveries, updates status as each step completes.

All three views read from the same backend and receive updates as delivery state changes, so no one is stuck refreshing to find out what happened.

## Components

- Backend API — owns delivery, rider, and status-transition logic; the single source of truth for delivery state. Exposes REST endpoints (see `api-contract.md`) and a real-time channel for state changes.
- Database — persists deliveries, riders, and their relationships (schema owned by the Data track — see `decisions.md` once finalized).
- Frontend (retailer + dispatcher) — web app for creating deliveries and assigning/monitoring them.
- Rider client — dashboard for viewing assigned deliveries and updating status.
- Real-time layer — pushes status changes to connected clients (mechanism TBD — see the "Decide real-time synchronization" card on the board and the corresponding entry in `decisions.md`).

## Delivery state machine

Deliveries move through a small set of states. Proposed baseline — confirm or adjust in `decisions.md` once the team locks it in:

    CREATED -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> DELIVERED
                                             `-> FAILED

- CREATED — retailer submitted the delivery; no rider yet.
- ASSIGNED — dispatcher assigned a rider.
- PICKED_UP — rider confirmed pickup from the retailer.
- IN_TRANSIT — rider is en route to drop-off.
- DELIVERED — rider confirmed drop-off. Terminal.
- FAILED — delivery could not be completed (rider-reported). Terminal.

Only forward transitions are valid, except where explicitly allowed (e.g. reassigning a rider before pickup). The backend is the sole authority on valid transitions — clients don't infer state, they display what the API returns.

## Data flow (happy path)

1. Retailer submits a delivery -> CREATED.
2. Dispatcher assigns a rider -> ASSIGNED. Rider is notified.
3. Rider marks pickup -> PICKED_UP, then IN_TRANSIT.
4. Rider marks delivery complete -> DELIVERED.
5. Retailer and dispatcher views update in real time at each step.

## Open questions

Tracked in `decisions.md` — most pressing are the real-time sync mechanism (WebSockets vs. Server-Sent Events vs. polling) and the database choice, both still open per the board.
