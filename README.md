# You² — Autonomous Digital Twin Agent 🧠

> *Stop guessing. Know You².*

An AI-powered digital twin that learns your behavior, predicts your decisions, and guides you in real-time — built for the Bot-to-Agent Hackathon.

---

## 🎯 What is You²?

You² creates a personalized AI clone of you. It learns your habits, goals, and behavioral patterns, then acts as an autonomous agent that:

- **Reflects** on your psychology and patterns
- **Simulates** future outcomes before you make decisions
- **Plans** personalized action schedules
- **Tracks** your browser activity in real-time via a Chrome extension
- **Nudges** you back to focus when you drift

---

## 🏗️ Architecture

```
twinagent/
├── client/          # Next.js 16 + TypeScript + Tailwind CSS v4
├── server/          # Node.js + Express + TypeScript
└── extension/       # Chrome Extension (Manifest V3)
```

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Node.js, Express 5, TypeScript, MongoDB + Mongoose |
| AI | Google Gemini 2.5 Flash (with key rotation + fallback) |
| Extension | Chrome MV3, Web Speech API |
| Auth | localStorage-based user ID (demo-ready) |

---

## ✨ Features

### Core
- 🧬 **5-step Twin Creation** — deep onboarding capturing goals, habits, work style, personality
- 💬 **3-Mode AI Chat** — Reflection, Simulation, Action modes with rich markdown responses
- 🔮 **Simulation Engine** — predicts best/likely/worst case outcomes for any scenario
- ⚡ **Action Engine** — generates personalized task plans with priorities and time estimates
- 📊 **Insights Dashboard** — behavior patterns, productivity score, interaction history

### New (Hackathon Upgrades)
- 🎙️ **Voice Twin** — talk to your twin using Web Speech API, get spoken responses
- 🌅 **Daily Forecast Card** — AI-generated morning briefing with energy level, focus windows, risk alerts
- 🧬 **Twin Evolution Score** — tracks accuracy %, habits learned, prediction confidence over time
- 🌐 **Smart Activity Graph** — per-site time breakdown with bar charts and horizontal progress bars

### Chrome Extension
- 🔍 **Universal Smart Detection** — classifies ANY website as productive/neutral/distracting/sensitive using keyword scoring across domain, title, meta, and body text — no hardcoded lists
- 🔒 **Sensitive Mode** — banking, payment, health pages are never tracked or injected
- ⏱️ **Active-Tab Timer** — pauses when tab is hidden or minimized
- 💬 **Glassmorphism Nudge Popup** — appears after 2 min on distracting sites with action buttons
- 📡 **Batch Activity Sync** — queues visits and flushes to server every 15s, persisted across service worker restarts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API Key

### 1. Backend
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGODB_URI and GEMINI_API_KEY
npm run dev
# Runs on http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. Chrome Extension
1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Open the extension popup
5. Copy your User ID from the dashboard header and paste it in the popup

---

## 🔑 Environment Variables

**`server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=your_key_here
# Optional: multiple keys for rotation
GEMINI_API_KEYS=key1,key2,key3
NODE_ENV=development
# Optional: DEMO_MODE=true for offline demo
```

**`client/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🎬 Demo Flow

1. Visit `/` → landing page
2. Click **Initialize Twin** → 5-step onboarding form
3. Dashboard loads with Daily Forecast, Evolution Score, Voice Twin
4. Connect Chrome Extension using your User ID
5. Browse any website — activity appears in dashboard graphs
6. Chat with your twin in Reflection / Simulation / Action mode
7. Generate tasks, run simulations, check Insights

---

## 📁 Key Files

```
client/app/
  create-twin/page.tsx   # 5-step onboarding
  dashboard/page.tsx     # Main dashboard with all widgets
  chat/page.tsx          # AI chat interface
  simulate/page.tsx      # Simulation engine
  tasks/page.tsx         # Action plan generator
  insights/page.tsx      # Activity analytics

client/components/
  VoiceTwin.tsx          # Web Speech API voice interface
  DailyForecastCard.tsx  # AI morning briefing card
  TwinEvolutionCard.tsx  # Twin accuracy/growth tracker
  ActivityGraph.tsx      # Site activity bar chart

server/src/
  controllers/           # Express route handlers
  models/                # Mongoose schemas
  config/promptBuilder.ts # All Gemini prompt templates
  config/gemini.ts       # Key rotation + fallback logic

extension/
  content.js             # Smart universal site classifier
  background.js          # Tab tracking + activity batching
  popup.html/js          # Extension UI with live classification
```

---

## 🏆 Built For

**Bot-to-Agent Hackathon** — MLH / 2026

---

## 📄 License

MIT
