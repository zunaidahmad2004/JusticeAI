# JusticeAI – AI-Powered Criminal Investigation Platform

> **Helping Investigators. Supporting Justice.**

An enterprise-grade criminal investigation and legal decision support platform for law enforcement agencies, forensic teams, and legal professionals.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 18 · TypeScript · Tailwind CSS · Vite     |
| Backend     | Node.js · Express.js · TypeScript               |
| Database    | MongoDB (Mongoose)                              |
| AI          | Google Gemini 2.5 Flash / Pro · Gemini Vision   |
| Real-time   | Socket.io                                       |
| Auth        | JWT · Refresh Tokens · RBAC                     |
| Maps        | Leaflet · OpenStreetMap                         |

---

## Features

- AI FIR Analyzer (text + PDF/image OCR via Gemini Vision)
- Smart Case Filing with BNS/BNSS/BSA section matching
- Complete Case Management (Cases, Evidence, Witnesses, Victims, Suspects)
- AI Legal Provision Recommendation
- Investigation Checklist Generator
- Chargesheet Draft Generator (AI)
- Missing Evidence Detector
- AI Risk Analysis & Investigation Scoring
- Criminal Relationship Graph
- Court Calendar
- Reports (Case Report, Evidence Inventory, Witness Summary)
- Real-time Notifications (Socket.io)
- Interactive Crime Map (Leaflet + Geolocation)
- AI Investigation Chat (Streaming, Gemini)
- Analytics Dashboard (Recharts)
- Role-Based Access Control (Officer, Supervisor, Admin)

---

## Setup

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Google Gemini API Key ([Get free key](https://aistudio.google.com/app/apikey))

### 1. Clone
```bash
git clone https://github.com/zunaidahmad2004/JusticeAI.git
cd JusticeAI
```

### 2. Install dependencies
```bash
# Root dependencies
npm install

# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 3. Configure environment
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/justiceai
JWT_SECRET=your-secure-jwt-secret-here
GEMINI_API_KEY=your-gemini-api-key-here
CLIENT_URL=http://localhost:5173
```

### 4. Run
```bash
# From root — starts both frontend and backend
npm run dev

# Or separately:
cd server && npm run dev    # Backend on :5000
cd client && npm run dev    # Frontend on :5173
```

---

## Environment Variables

| Variable         | Description                          | Required |
|-----------------|--------------------------------------|----------|
| `PORT`          | Server port (default: 5000)          | No       |
| `MONGODB_URI`   | MongoDB connection string            | Yes      |
| `JWT_SECRET`    | JWT signing secret (min 32 chars)    | Yes      |
| `GEMINI_API_KEY`| Google Gemini API key                | Yes      |
| `CLIENT_URL`    | Frontend URL for CORS                | No       |

---

## Project Structure

```
justice-ai/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # All page components
│       ├── components/  # Reusable UI components
│       ├── hooks/   # Custom React hooks
│       ├── lib/     # API client
│       └── store/   # Auth state (Zustand)
└── server/          # Express backend
    └── src/
        ├── models/  # Mongoose models
        ├── routes/  # API route handlers
        ├── services/# AI service (Gemini)
        └── middleware/  # Auth, error handling
```

---

## Important Notes

- Never commit `.env` files or API keys to the repository
- All AI features require a valid `GEMINI_API_KEY`
- The application uses MongoDB — ensure a running instance before starting
- All investigation data is for authorized law enforcement personnel only

---

## License

This project is developed for educational and research purposes as part of a Final Year Engineering Project.

---

*JusticeAI Technologies · For authorized law enforcement and legal personnel only.*
