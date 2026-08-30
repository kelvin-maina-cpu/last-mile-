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

## API Endpoints (Implemented)

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/health` | ✅ Implemented |

## API Endpoints (Planned)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/deliveries` | Create a delivery request |
| GET | `/api/deliveries` | List deliveries |
| GET | `/api/deliveries/:id` | Get a single delivery |
| PATCH | `/api/deliveries/:id/assign` | Assign a rider |
| PATCH | `/api/deliveries/:id/status` | Update delivery status |
| GET | `/api/riders` | List riders |
