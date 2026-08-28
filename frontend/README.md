# Frontend

Owners: Mercyline (retailer + dispatcher), Mary (rider)

Retailer delivery form, dispatcher delivery list and assignment UI, and rider dashboard (assigned deliveries, status updates) — all talking to the API in [`../docs/api-contract.md`](../docs/api-contract.md). Split into subfolders as the two surfaces take shape.

Stack and setup instructions land here once the team locks them in (see `../docs/decisions.md`).

## Scope (from the board)

Dispatcher/retailer (Mercyline):
- Retailer delivery form
- Dispatcher delivery list
- Dispatcher assignment UI
- API integration

Rider (Mary):
- Rider dashboard
- Assigned delivery view
- Status update interface
- Real-time client synchronization
