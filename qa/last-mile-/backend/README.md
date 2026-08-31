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

### 5. Test the health endpoint

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
├── src/
│   ├── server.js              # Entry point: HTTP server + Socket.IO
│   ├── app.js                 # Express app, middleware, route mounting
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/                # Mongoose schemas (Delivery, Rider)
│   ├── routes/
│   │   └── health.js          # Health check endpoint
│   ├── services/              # Business logic layer
│   ├── middleware/
│   │   └── errorHandler.js    # Centralized error handling
│   └── utils/
│       └── errors.js          # Custom error classes
└── README.md
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check — returns server status and DB connectivity |
| POST | `/api/deliveries` | Create a new delivery request (status: REQUESTED) |
| GET | `/api/deliveries` | List all deliveries (optional `?status=` filter) |
| GET | `/api/deliveries/:id` | Get a single delivery by ID |
| PATCH | `/api/deliveries/:id/assign` | Assign a rider to a delivery |
| PATCH | `/api/deliveries/:id/status` | Update delivery status (state machine enforced) |
| GET | `/api/riders` | List all riders (optional `?available=` filter) |
