# Enterprise AI Dispatch Platform

A full-stack **order dispatch management system** for service enterprises: customers place orders, and an **LLM dispatch engine** automatically routes each order to the optimal station and worker — balancing distance, service rating, and skill match. Built as a complete order lifecycle: **create → dispatch → complete**.

> An end-to-end enterprise workflow system demonstrating LLM integration, geolocation services, REST API design, and multi-role operations.

---

## ✨ Features

- **LLM-powered dispatch decision**: DeepSeek (`deepseek-chat`, low temperature for stable output) picks the best station & worker from order info + candidate stations (distance, ETA, rating, skill, completed orders) and returns a dispatch rationale
- **Multi-role workflow** (planned): user (place orders) → station (fulfill orders) → enterprise (dispatch center, operations dashboard, analytics)
- **Geolocation**: AMap integration for locating customers and finding the nearest station
- **Complete order lifecycle**: create → dispatch → complete
- **Secure by design**: all API keys injected via environment variables, `.env` git-ignored

---

## 🏗 Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js · Express (port 3000) |
| Frontend | Static HTML + JavaScript (fetch → REST API) |
| AI Engine | DeepSeek API (`deepseek-chat`) |
| Geolocation | AMap (AutoNavi) |

## 🧱 Architecture

```
Vue/Static Frontend (future: Vue3)
        │  REST API
        ▼
Express Backend ──┬── routes/orders.js     (order CRUD + dispatch)
                  ├── routes/stations.js   (stations + nearest lookup)
                  ├── routes/config.js     (pricing, service types)
                  └── services/deepseek.js (LLM dispatch engine, reads key from env)
        │
        ▼
Data: in-memory seed (data/seed.js) → planned: MySQL / MongoDB persistence
```

## 📁 Project Structure

```
enterprise-dispatch-platform/
├── backend/                  ← Node.js + Express backend
│   ├── server.js             ← main entry, port 3000
│   ├── package.json
│   ├── data/seed.js          ← initial data (stations, orders, pricing)
│   ├── routes/
│   │   ├── orders.js         ← order CRUD + dispatch
│   │   ├── stations.js       ← station queries + nearest station
│   │   └── config.js         ← pricing, service types
│   └── services/deepseek.js  ← AI dispatch engine (API key from env)
├── frontend/                 ← static frontend
│   ├── index.html            ← UI structure + CSS
│   └── app.js                ← interaction logic (fetch → API)
└── signature/                ← bonus: handwritten-signature animation demos
```

---

## 🚀 Quick Start

### 1. Configure environment variables

```bash
cd backend
copy ..\.env.example .env   # Windows
# cp ../.env.example .env   # Linux / macOS
```

Edit `.env` with your DeepSeek API Key; replace the AMap key in `frontend/app.js` with your own.

### 2. Install & start the backend

```bash
cd backend
npm install
npm start
# development mode (auto-restart):
npm run dev
```

Backend prints: `✅ 家政速派后端已启动：http://localhost:3000`

### 3. Open the frontend

Open `frontend/index.html` in a browser, or visit the backend-served page at `http://localhost:3000`

---

## 📡 API Overview

| Method | Path | Description |
| --- | --- | --- |
| GET | /api/orders | List all orders |
| POST | /api/orders | Create a new order |
| PUT | /api/orders/:id/dispatch | Dispatch order to a worker |
| PUT | /api/orders/:id/complete | Complete an order |
| GET | /api/stations | List all stations |
| GET | /api/stations/nearest?lat=&lng= | Find nearest station |
| GET | /api/config | Get pricing / service types |

---

## 🗺 Roadmap

- [ ] **Multi-role system**: user / station / enterprise role-based access
- [ ] **Persistence**: replace in-memory seed with MySQL / MongoDB
- [ ] **Docker**: `docker-compose.yml` for one-command deployment
- [ ] **Frontend upgrade**: migrate to Vue3
- [ ] **CI/CD**: GitHub Actions build & test pipeline
- [ ] **Unit tests**: controller + service tests

---

## 🔒 Security Notes

- All API keys are injected via environment variables; `.env` is git-ignored — never commit real keys
- Data is currently stored in memory (`data/seed.js`); swap in a database for production use

## 📄 License

[MIT](LICENSE)
