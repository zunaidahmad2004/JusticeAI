# JusticeAI — Setup Guide

**MERN Stack**: MongoDB · Express · React · Node.js  
**AI**: Google Gemini 2.5 Flash via `@google/genai`

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later |
| MongoDB | Local 7+ **or** MongoDB Atlas (free tier works) |
| Google Gemini API key | Free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |

> The app runs in **mock mode** without a Gemini key — all AI endpoints return demo data so you can explore the UI before configuring the key.

---

## Quick Start

### 1. MongoDB

**Option A — Local**
```bash
# Install MongoDB Community then start it
mongod --dbpath /data/db
```
No schema setup needed — Mongoose creates all collections automatically on first run.

**Option B — MongoDB Atlas (recommended for production)**
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist your IP
4. Copy the connection string into `MONGODB_URI`

---

### 2. Server

```bash
cd justice-ai/server
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux

# Edit .env — at minimum set MONGODB_URI and GEMINI_API_KEY
npm install
npm run dev
```

Server starts on **http://localhost:5000**

---

### 3. Client

```bash
cd justice-ai/client
npm install
npm run dev
```

Frontend starts on **http://localhost:5173**

---

## Environment Variables

Edit `server/.env`:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | Long random string for JWT signing |
| `JWT_REFRESH_SECRET` | ✅ Yes | Long random string for refresh tokens |
| `GEMINI_API_KEY` | ⭐ Recommended | Google Gemini API key for AI features |
| `PORT` | No | Server port (default: 5000) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:5173) |
| `UPLOAD_DIR` | No | Evidence file upload path (default: ./uploads) |

> **Old variables removed**: `DATABASE_URL`, `REDIS_URL`, `LLM_API_KEY` are no longer used.

---

## Google Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key into `server/.env`:
   ```
   GEMINI_API_KEY=AIza...your_key_here
   ```
5. Restart the server

**Without the key**: the app runs fully but AI features return mock/demo responses. The health endpoint at `GET /api/health` shows whether Gemini is active.

---

## First Login

1. Open [http://localhost:5173](http://localhost:5173)
2. Click **Register** to create your account
3. To promote yourself to admin, connect to MongoDB and run:
   ```js
   // mongosh
   use justice_ai
   db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
   ```

---

## Creating Uploads Directory

```bash
mkdir justice-ai/server/uploads
```

---

## Production Build

```bash
# Build client
cd justice-ai/client
npm run build        # output in client/dist/

# Build server
cd justice-ai/server
npm run build        # output in server/dist/
npm start
```

Serve `client/dist/` via nginx or any static host. Point `/api/*` requests to the Node.js server.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Zustand, Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT (access + refresh tokens) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| File Upload | Multer |
| Security | Helmet, CORS, bcrypt, rate limiting, audit logs |

---

## API Health Check

```
GET http://localhost:5000/api/health
```

Response shows database status and whether Gemini is active:
```json
{
  "status": "ok",
  "database": "mongodb",
  "ai": "gemini-2.5-flash"
}
```
