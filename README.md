<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1e3a5f,100:6366f1&height=200&section=header&text=JusticeAI&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=AI-Powered%20Criminal%20Investigation%20%26%20Legal%20Decision%20Support&descAlignY=60&descSize=18" width="100%"/>

<br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-justiceai--rgpg.onrender.com-6366f1?style=for-the-badge&logoColor=white)](https://justiceai-rgpg.onrender.com)
[![Health Check](https://img.shields.io/badge/❤️%20Health-API%20Live-22c55e?style=for-the-badge)](https://justiceai-rgpg.onrender.com/api/health)

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com/)

<br/>

[![GitHub stars](https://img.shields.io/github/stars/zunaidahmad2004/JusticeAI?style=social)](https://github.com/zunaidahmad2004/JusticeAI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/zunaidahmad2004/JusticeAI?style=social)](https://github.com/zunaidahmad2004/JusticeAI/network/members)
[![GitHub issues](https://img.shields.io/github/issues/zunaidahmad2004/JusticeAI?style=social)](https://github.com/zunaidahmad2004/JusticeAI/issues)
[![MIT License](https://img.shields.io/github/license/zunaidahmad2004/JusticeAI?style=social)](./LICENSE)

<br/>

> **Helping Investigators. Supporting Justice.**
>
> An enterprise-grade AI platform for law enforcement agencies, forensic investigators, and legal professionals — powered by Google Gemini 2.5 Flash.

</div>

---

## 🌐 Live Demo

<div align="center">

| Resource | URL |
|---|---|
| 🌐 **Live Application** | [justiceai-rgpg.onrender.com](https://justiceai-rgpg.onrender.com) |
| ⚙️ **Backend API** | [justiceai-rgpg.onrender.com/api](https://justiceai-rgpg.onrender.com/api) |
| ❤️ **Health Check** | [justiceai-rgpg.onrender.com/api/health](https://justiceai-rgpg.onrender.com/api/health) |

**Demo Credentials:**
```
Email:    admin@justiceai.com
Password: Admin@2024
```

> ⚠️ For authorized law enforcement and legal personnel only. All access is logged and monitored.

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 AI-Powered
- **FIR Analyzer** — Text + PDF/image OCR via Gemini Vision
- **Legal Provision Recommender** — BNS/BNSS/BSA matching
- **Chargesheet Draft Generator** — AI-generated legal documents
- **Investigation Checklist** — Crime-specific task generation
- **Missing Evidence Detector** — AI gap analysis
- **Risk Analysis & Scoring** — Investigation completeness
- **AI Chat Assistant** — ChatGPT-like investigative support

</td>
<td width="50%">

### 📁 Case Management
- **Complete Case Lifecycle** — FIR to chargesheet
- **Evidence Management** — Upload, analyze, track
- **Witness Profiles** — Statement recording
- **Victim Management** — Profile and case linking
- **Suspect Tracking** — Relationship mapping
- **Document Generation** — Auto reports
- **Criminal Relationship Graph** — Visual network

</td>
</tr>
<tr>
<td width="50%">

### 📊 Analytics & Intelligence
- **Interactive Dashboard** — Real-time statistics
- **Crime Heatmap** — Leaflet + OpenStreetMap
- **Analytics Charts** — Recharts visualization
- **Court Calendar** — Hearing management
- **Reports** — Case, evidence, witness summaries

</td>
<td width="50%">

### 🔐 Security & Access
- **JWT Authentication** — Access + refresh tokens
- **Role-Based Access Control** — Officer, Supervisor, Admin
- **Two-Factor Authentication** — TOTP support
- **Rate Limiting** — API protection
- **Real-time Notifications** — Socket.io
- **Secure File Uploads** — Type validation

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · TypeScript · Tailwind CSS · Vite 6 · Framer Motion |
| **Backend** | Node.js 20 · Express.js · TypeScript · Socket.io |
| **Database** | MongoDB Atlas · Mongoose ODM |
| **AI** | Google Gemini 2.5 Flash · Gemini Vision API |
| **Auth** | JWT · Refresh Tokens · RBAC · 2FA (TOTP) |
| **Maps** | Leaflet · React-Leaflet · OpenStreetMap |
| **Charts** | Recharts |
| **Deployment** | Render (unified full-stack service) |
| **State** | Zustand |
| **Forms** | React Hook Form |

</div>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React + Vite)                │
│  Pages → Components → Stores (Zustand) → API Client     │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS / WebSocket
┌─────────────────────▼───────────────────────────────────┐
│              Express.js Backend (Node.js)                │
│  Routes → Middleware → Controllers → Services            │
│  JWT Auth · Rate Limiting · Helmet · CORS               │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐  ┌───────────▼──────────────────┐
│   MongoDB Atlas     │  │   Google Gemini 2.5 Flash     │
│   (Mongoose ODM)    │  │   AI Analysis & Chat          │
└─────────────────────┘  └──────────────────────────────┘
```

---

## 📁 Project Structure

```
justice-ai/
├── client/                    # React + Vite Frontend
│   ├── public/
│   │   └── _redirects         # SPA routing
│   └── src/
│       ├── components/
│       │   ├── dashboard/     # Dashboard widgets
│       │   ├── layout/        # AppLayout, Sidebar, AuthLayout
│       │   ├── profile/       # 2FA settings
│       │   └── ui/            # Reusable UI components
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # API client (axios)
│       ├── pages/
│       │   ├── auth/          # Login, Register, 2FA
│       │   ├── cases/         # Case management pages
│       │   └── *.tsx          # Feature pages
│       └── store/             # Zustand state management
│
├── server/                    # Node.js + Express Backend
│   └── src/
│       ├── db/                # MongoDB connection
│       ├── middleware/        # Auth, error handling
│       ├── models/            # Mongoose schemas
│       ├── routes/            # API route handlers
│       ├── services/          # AI service (Gemini)
│       └── utils/             # Logger, helpers
│
├── .github/
│   ├── ISSUE_TEMPLATE/        # Bug report, feature request
│   └── PULL_REQUEST_TEMPLATE.md
│
├── render.yaml                # Render deployment config
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Google Gemini API Key ([Get free key](https://aistudio.google.com/app/apikey))

### 1. Clone

```bash
git clone https://github.com/zunaidahmad2004/JusticeAI.git
cd JusticeAI
```

### 2. Install Dependencies

```bash
# Install all dependencies (root + server + client)
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/justiceai
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
GEMINI_API_KEY=your-gemini-api-key-here
CLIENT_URL=http://localhost:5173
```

### 4. Run Development Servers

```bash
# Backend (port 5000)
cd server && npm run dev

# Frontend (port 5173) — in a new terminal
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (`development`/`production`) | No |
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | ✅ Yes |
| `JWT_EXPIRES_IN` | JWT expiry (default: `7d`) | No |
| `JWT_REFRESH_SECRET` | Refresh token secret | ✅ Yes |
| `JWT_REFRESH_EXPIRES_IN` | Refresh expiry (default: `30d`) | No |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes |
| `CLIENT_URL` | Frontend URL for CORS | No |
| `UPLOAD_DIR` | File upload directory | No |

---

## 📡 API Reference

Base URL: `https://justiceai-rgpg.onrender.com/api`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Health check | No |
| `POST` | `/auth/register` | Register user | No |
| `POST` | `/auth/login` | Login | No |
| `POST` | `/auth/refresh` | Refresh token | No |
| `GET` | `/cases` | List cases | ✅ |
| `POST` | `/cases` | Create case | ✅ |
| `GET` | `/cases/:id` | Get case | ✅ |
| `POST` | `/evidence` | Upload evidence | ✅ |
| `POST` | `/ai/chat` | AI chat | ✅ |
| `POST` | `/ai/analyze-fir` | Analyze FIR | ✅ |
| `POST` | `/ai/legal-provisions` | Get legal provisions | ✅ |
| `GET` | `/analytics` | Analytics data | ✅ |
| `GET` | `/dashboard` | Dashboard stats | ✅ |

---

## ☁️ Deployment

### Deploy on Render (Recommended)

This project uses a unified deployment — Express serves both the API and React frontend.

1. Fork this repository
2. Connect to [Render](https://render.com)
3. Create a new **Web Service** from your fork
4. Set environment variables (see table above)
5. Render auto-deploys on every push to `main`

The `render.yaml` in this repo contains the full deployment configuration.

### Build for Production

```bash
# Build frontend
cd client && npm run build

# Build server (bundles TypeScript + copies client dist)
cd server && node build.mjs

# Start production server
node dist/index.js
```

---

## 🔒 Security

- All API routes are protected with JWT authentication
- Rate limiting: 300 req/15min (general), 20 req/min (AI routes)
- Helmet.js for secure HTTP headers
- Content Security Policy configured
- CORS restricted to configured origins
- Input sanitization on all endpoints
- Passwords hashed with bcrypt
- Refresh token rotation

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] PDF report export
- [ ] Multi-language support (Hindi, regional)
- [ ] Biometric authentication
- [ ] Offline mode (PWA)
- [ ] Advanced forensics AI (image enhancement)
- [ ] Court integration API
- [ ] Bulk case import

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m "feat: add amazing feature"

# 4. Push and open a Pull Request
git push origin feature/amazing-feature
```

---

## 📜 License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.

---

## 👤 Author

<div align="center">

**Zunaid Ahmad**

[![GitHub](https://img.shields.io/badge/GitHub-zunaidahmad2004-181717?style=flat-square&logo=github)](https://github.com/zunaidahmad2004)

*Final Year Engineering Project — AI-powered Criminal Investigation Platform*

</div>

---

## 🙏 Acknowledgements

- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI intelligence
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Database hosting
- [Render](https://render.com) — Deployment platform
- [Lucide React](https://lucide.dev/) — Icons
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Leaflet](https://leafletjs.com/) — Interactive maps

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:1e3a5f&height=100&section=footer" width="100%"/>

**⭐ Star this repo if you find it useful!**

Made with ❤️ for Justice

</div>
