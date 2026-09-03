# 🚀 Reflex Deployment Guide

> Frontend on **Vercel** | Backend on **Render** | Database on **MongoDB Atlas**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                              │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
     ┌─────▼──────┐        ┌─────▼──────────┐
     │   Vercel   │        │     Render     │
     │  Frontend  │        │    Backend     │
     │ (React SPA)│        │ (Express API)  │
     │  :443      │        │  :3000         │
     └────────────┘        └───────┬────────┘
                                   │
                            ┌──────▼────────┐
                            │  MongoDB Atlas │
                            │   (Database)   │
                            │  :27017        │
                            └───────────────┘
```

---

## Prerequisites

- [GitHub account](https://github.com)
- [Vercel account](https://vercel.com) (free tier works)
- [Render account](https://render.com) (free tier works)
- [MongoDB Atlas account](https://www.mongodb.com/atlas) (free tier: 512MB)
- [Google Cloud Console](https://console.cloud.google.com) (for OAuth, optional)

---

## Step 1: MongoDB Atlas (Database)

### 1.1 Create Cluster

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click **"Build a Database"** → choose **FREE** (M0 Sandbox)
3. Select a region close to your Render service (e.g., AWS us-east-1)
4. Click **"Create Cluster"**

### 1.2 Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `reflex_user`
5. Password: click **"Autogenerate Secure Password"** → copy and save it
6. Under **"Database User Privileges"**, select **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Allow Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **Database** (left sidebar) → click **"Connect"** on your cluster
2. Choose **"Drivers"**
3. Select **Node.js** and version **5.0 or later**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://reflex_user:<password>@cluster0.xxxxx.mongodb.net/reflex?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you saved in step 1.2
6. Change the database name from `test` to `reflex`

**Save this string — you'll need it for Render.**

---

## Step 2: Render (Backend)

### 2.1 Create Backend Service

1. Go to [render.com](https://render.com) → Dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `kelvin-maina-cpu/last-mile-`
4. Configure:
   - **Name:** `reflex-backend`
   - **Region:** US East (Virginia) — or closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Plan:** Free

### 2.2 Set Environment Variables

Click **"Environment"** tab → **"Add Environment Group"** or add individually:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | *(paste your MongoDB Atlas connection string from Step 1.4)* |
| `CORS_ORIGINS` | *(leave blank for now — update after Vercel deploy)* |
| `LOG_LEVEL` | `info` |

### 2.3 Deploy

Click **"Create Web Service"** → Render will start building.

Wait for the deploy to finish, then note your service URL:
```
https://reflex-backend.onrender.com
```

### 2.4 Verify

Open in browser:
```
https://reflex-backend.onrender.com/api/health
```

You should see:
```json
{"status":"healthy","timestamp":"...","database":"connected"}
```

---

## Step 3: Create Fallback Server (Render)

### 3.1 Create Second Service

1. Render Dashboard → **"New +"** → **"Web Service"**
2. Same repository: `kelvin-maina-cpu/last-mile-`
3. Configure:
   - **Name:** `reflex-fallback`
   - **Region:** Same as backend (US East)
   - **Branch:** `main`
   - **Root Directory:** `frontend/server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Plan:** Free

### 3.2 Set Environment Variables

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `JWT_SECRET` | *(generate — see below)* |
| `FRONTEND_URL` | *(update after Vercel deploy — see Step 4.3)* |
| `VERCEL_URL` | *(update after Vercel deploy — see Step 4.3)* |
| `CORS_ORIGINS` | *(leave blank for now)* |
| `GOOGLE_CLIENT_ID` | *(from Google Cloud Console, or leave placeholder)* |
| `GOOGLE_CLIENT_SECRET` | *(from Google Cloud Console, or leave placeholder)* |
| `GOOGLE_CALLBACK_URL` | `https://reflex-fallback.onrender.com/api/auth/google/callback` |
| `LOG_LEVEL` | `info` |

### 3.3 Generate JWT_SECRET

Run locally and paste the output into Render:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.4 Deploy & Verify

After deploy finishes:
```
https://reflex-fallback.onrender.com/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

---

## Step 4: Vercel (Frontend)

### 4.1 Create Project

1. Go to [vercel.com](https://vercel.com) → Dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `kelvin-maina-cpu/last-mile-`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`

### 4.2 Set Environment Variables

Click **"Environment Variables"** and add:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_URL` | `https://reflex-backend.onrender.com/api` | Production |
| `VITE_WS_URL` | `wss://reflex-backend.onrender.com` | Production |
| `VITE_USE_MOCK_AUTH` | `false` | Production |
| `VITE_USE_MOCK_DATA` | `false` | Production |

### 4.3 Deploy

Click **"Deploy"** → Vercel will build and deploy.

After deploy finishes, note your frontend URL:
```
https://last-mile-xxxxx.vercel.app
```

### 4.4 Update Backend CORS

Go back to **Render** → `reflex-fallback` service → **Environment** → update:

| Key | New Value |
|-----|-----------|
| `FRONTEND_URL` | `https://last-mile-xxxxx.vercel.app` |
| `VERCEL_URL` | `https://last-mile-xxxxx.vercel.app` |

Then trigger a redeploy (Render auto-redeploys on env var change).

---

## Step 5: Final Verification

### 5.1 Test the Full Flow

1. Open `https://last-mile-xxxxx.vercel.app`
2. You should see the landing page
3. Click **"Login"**
4. Use demo credentials:
   - **Dispatcher:** `admin@reflex.co.ke` / `password123`
   - **Rider:** `james@reflex.co.ke` / `password123`
   - **Retailer:** `shop@retailer.co.ke` / `password123`
5. Create a delivery → Assign a rider → Update status

### 5.2 Check API Health

```
https://reflex-backend.onrender.com/api/health
https://reflex-fallback.onrender.com/api/health
```

Both should return `"status":"healthy"` or `"status":"ok"`.

### 5.3 Check Logs

- **Render:** Go to your service → **"Logs"** tab
- **Vercel:** Go to your project → **"Deployments"** → click latest → **"Function Logs"**

---

## Troubleshooting

### Build fails on Vercel

**Error:** `sh: line: 1: vite: command not found`

**Fix:** Make sure `vite` is in `dependencies` (not `devDependencies`) in `frontend/package.json`. This guide already includes this fix.

---

### CORS errors in browser

**Error:** `Access to fetch blocked by CORS policy`

**Fix:** Make sure `CORS_ORIGINS` or `FRONTEND_URL` on Render matches your exact Vercel URL (including `https://`).

---

### 500 errors on API calls

**Error:** `POST /api/deliveries 500 Internal Server Error`

**Fix:**
1. Check Render logs for the actual error
2. Verify `MONGODB_URI` is correct
3. Make sure MongoDB Atlas network access allows `0.0.0.0/0`

---

### WebSocket connection fails

**Error:** `WebSocket connection to 'wss://...' failed`

**Fix:**
1. Verify `VITE_WS_URL` is set correctly in Vercel
2. Check that the backend service is running (not sleeping on free tier)
3. Render free tier services sleep after 15 min of inactivity — first request takes ~30s to wake up

---

### Render service sleeps (free tier)

Render free tier spins down after 15 minutes of inactivity. The first request after sleep takes 30-60 seconds.

**Options:**
1. Upgrade to Render paid plan ($7/month) for always-on
2. Use a cron ping service (e.g., [UptimeRobot](https://uptimerobot.com)) to hit `/api/health` every 10 minutes

---

## Environment Variables Summary

### Render: `reflex-backend`

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://reflex_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/reflex?retryWrites=true&w=majority
CORS_ORIGINS=https://last-mile-xxxxx.vercel.app
LOG_LEVEL=info
```

### Render: `reflex-fallback`

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
FRONTEND_URL=https://last-mile-xxxxx.vercel.app
VERCEL_URL=https://last-mile-xxxxx.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://reflex-fallback.onrender.com/api/auth/google/callback
LOG_LEVEL=info
```

### Vercel: `last-mile-frontend`

```env
VITE_API_URL=https://reflex-backend.onrender.com/api
VITE_WS_URL=wss://reflex-backend.onrender.com
VITE_USE_MOCK_AUTH=false
VITE_USE_MOCK_DATA=false
```

---

## Cost Estimate

| Service | Plan | Cost |
|---------|------|------|
| Vercel (Frontend) | Hobby | **Free** |
| Render (Backend) | Free | **$0** (with sleep) |
| Render (Fallback) | Free | **$0** (with sleep) |
| MongoDB Atlas | M0 Sandbox | **Free** (512MB) |
| **Total** | | **$0/month** |

> To eliminate cold starts, upgrade Render to **Starter** ($7/month per service).
