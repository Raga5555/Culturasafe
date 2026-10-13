# 🏛️ CulturaSafe Backend REST API

A production-ready Node.js, Express, and TypeScript backend service for **CulturaSafe**, the smart tourism, belongings-safety, and GPS exploration platform.

Integrated with **Supabase PostgreSQL** for data persistence and authentication, secured by **Row Level Security (RLS)**, equipped with rate limiting, input validation, offline batch synchronization, and IoT belongings separation tracking.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture & Directory Structure](#-architecture--directory-structure)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Supabase Setup](#-step-by-step-supabase-setup)
- [Installation & Local Run](#-installation--local-run)
- [Environment Variables](#-environment-variables)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Belongings & BLE Safety Design](#-belongings--ble-safety-design)
- [Live Location & Privacy Policy](#-live-location--privacy-policy)
- [Offline Batch Synchronization](#-offline-batch-synchronization)
- [Free-Tier Deployment Guide](#-free-tier-deployment-guide)
- [Automated Testing](#-automated-testing)

---

## 🚀 Features

1. **Supabase Authentication**: User registration, login, logout, token verification via Supabase Auth JWT.
2. **PostgreSQL with RLS**: Strict Row Level Security policies guarantee users can read and modify only their own data.
3. **Tourism & Itineraries**: CRUD endpoints for destinations, personalized travel itineraries, and tourist interests.
4. **Consent-Based Location History**: Secure GPS coordinates ingestion throttled to prevent spam; coordinates never logged without explicit consent.
5. **Belongings & BLE Tracking**: Registered items model with tag metadata, battery levels, separation alerts, and reconnection event logging.
6. **Offline Synchronization**: Batch sync endpoint (`POST /api/v1/sync`) for reconciling offline edits and queued alerts when reconnected.
7. **Security**: Helmet headers, configurable CORS, rate limiting (general & auth-specific), and Zod schema validation.
8. **Interactive OpenAPI / Swagger**: Built-in interactive documentation accessible at `/api/docs`.

---

## 📂 Architecture & Directory Structure

```text
culturasafe-backend/
├── .env.example               # Environment variables template
├── .gitignore
├── database/
│   ├── 001_schema_and_rls.sql # Complete Supabase PostgreSQL schema & RLS policies
│   └── seed.sql               # Optional sample seed script
├── openapi.json               # Full OpenAPI 3.0 specification
├── package.json               # Dependencies and npm scripts
├── tsconfig.json              # TypeScript compiler configuration
├── jest.config.js             # Jest unit and integration test runner config
├── README.md                  # Comprehensive setup and API guide
├── src/
│   ├── app.ts                 # Express application assembly, middleware & routes
│   ├── server.ts              # Entry point and graceful shutdown handlers
│   ├── config/
│   │   ├── env.ts             # Validated environment configuration
│   │   └── supabase.ts        # Supabase client instances (Anon, Admin, Scoped)
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── destinations.controller.ts
│   │   ├── itineraries.controller.ts
│   │   ├── location.controller.ts
│   │   ├── belongings.controller.ts
│   │   └── sync.controller.ts
│   ├── middleware/
│   │   ├── auth.ts            # Bearer JWT validation via Supabase
│   │   ├── errorHandler.ts    # Standard JSON error responses
│   │   ├── rateLimiter.ts     # IP rate limiters
│   │   └── validate.ts        # Zod schema request validators
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── destinations.routes.ts
│   │   ├── itineraries.routes.ts
│   │   ├── location.routes.ts
│   │   ├── belongings.routes.ts
│   │   ├── sync.routes.ts
│   │   └── health.routes.ts
│   └── types/
│       └── index.ts           # TypeScript interfaces & types
└── tests/
    ├── health.test.ts
    ├── auth-validation.test.ts
    └── belongings-alerts.test.ts
```

---

## ⚡ Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm** or **yarn** or **bun**.
- A free **Supabase** account ([https://supabase.com](https://supabase.com)).

---

## 🛠️ Step-by-Step Supabase Setup (Free Tier)

1. **Create a Free Project**:
   - Sign in to [supabase.com](https://supabase.com).
   - Click **New project**, choose your organization, select your cloud region, and assign a database password.

2. **Execute Database Schema & RLS Migrations**:
   - In your Supabase Dashboard, click **SQL Editor** on the left menu.
   - Click **New query**.
   - Copy the entire contents of `database/001_schema_and_rls.sql` from this backend repository.
   - Paste and click **Run**.
   - All 8 tables (`profiles`, `user_preferences`, `saved_destinations`, `itineraries`, `belongings`, `alert_events`, `location_history`, `sync_log`) and their RLS policies will be created immediately.

3. **Retrieve API Credentials**:
   - Go to **Project Settings** → **API**.
   - Copy the **Project URL** (e.g. `https://xxxx.supabase.co`).
   - Copy the **anon / public** key.
   - Copy the **service_role** secret key (for server-side administrative verification).

---

## 💻 Installation & Local Run

1. **Extract and Enter Directory**:
   ```bash
   cd culturasafe-backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Supabase credentials:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Start in Development Mode**:
   ```bash
   npm run dev
   ```
   The server starts at `http://localhost:5000`.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

6. **Interactive Documentation**:
   Open [http://localhost:5000/api/docs](http://localhost:5000/api/docs) in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port on which the HTTP server listens |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `SUPABASE_URL` | **Yes** | - | Project URL from Supabase dashboard |
| `SUPABASE_ANON_KEY` | **Yes** | - | Public anon key for user-scoped auth calls |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | - | Secret service-role key for backend system checks |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of allowed frontend origins |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` (15 min) | Time window for rate limiter |
| `RATE_LIMIT_MAX_REQUESTS` | No | `200` | Maximum requests per IP window |

---

## 📡 API Endpoints Reference

All `/api/v1/*` endpoints except `/auth/register` and `/auth/login` require:
```http
Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>
```

### 1. Health & Documentation
- `GET /api/health` - System health check with database latency.
- `GET /api/docs` - Interactive documentation UI.
- `GET /api/docs/spec` - Raw OpenAPI 3.0 JSON specification.

### 2. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Create account (`email`, `password`, `displayName`).
- `POST /api/v1/auth/login` - Sign in, returns JWT session token.
- `POST /api/v1/auth/logout` - Revoke current session.
- `GET /api/v1/auth/me` - Get profile of authenticated user.

### 3. User & Preferences (`/api/v1/user`)
- `GET /api/v1/user/profile` - Retrieve profile information.
- `PUT /api/v1/user/profile` - Update display name, avatar, emergency contact.
- `GET /api/v1/user/preferences` - Get travel interests (`heritage`, `beaches`, `cafes`, etc.).
- `PUT /api/v1/user/preferences` - Update exploration preferences.

### 4. Saved Destinations (`/api/v1/destinations`)
- `GET /api/v1/destinations/saved` - List all bookmarked attractions for current user.
- `POST /api/v1/destinations/saved` - Add a destination to saved list.
- `DELETE /api/v1/destinations/saved/:destinationId` - Remove destination from saved list.

### 5. Itineraries (`/api/v1/itineraries`)
- `GET /api/v1/itineraries` - Retrieve user's travel plans.
- `GET /api/v1/itineraries/:id` - Retrieve single itinerary details.
- `POST /api/v1/itineraries` - Save a generated or custom itinerary.
- `PUT /api/v1/itineraries/:id` - Update an itinerary.
- `DELETE /api/v1/itineraries/:id` - Delete an itinerary.

### 6. Belongings & BLE Safety (`/api/v1/belongings`)
- `GET /api/v1/belongings` - List registered belongings and paired tag status.
- `POST /api/v1/belongings` - Register a new belonging (name, itemType, tag MAC/UUID).
- `PUT /api/v1/belongings/:id` - Update battery level, alert settings, last seen info.
- `DELETE /api/v1/belongings/:id` - Remove a registered belonging.
- `POST /api/v1/belongings/alerts/events` - Log separation or reconnection alert event.
- `GET /api/v1/belongings/alerts/history` - Retrieve separation alert audit log.

### 7. Location Tracking (`/api/v1/location`)
- `POST /api/v1/location/points` - Ingest GPS point (requires `consentGiven: true`, throttled to 10s).
- `GET /api/v1/location/history` - Retrieve stored location points.
- `DELETE /api/v1/location/history` - Purge all stored location history for user.

### 8. Offline Synchronization (`/api/v1/sync`)
- `POST /api/v1/sync` - Batch reconciliation of locally cached items when network restores.

---

## 🎒 Belongings & BLE Safety Design

**Architecture Boundary**:
- **Hardware Detection**: Physical Bluetooth Low Energy (BLE) scanning and signal loss detection **must be performed directly on the client device** (browser Web Bluetooth API or native mobile app).
- **Backend Role**: Securely store registered belongings metadata, hardware identifiers, user alert preferences, and an immutable log of separation alerts (`alert_events`).
- The backend never fakes real-time BLE connectivity; it receives event reports from the client when signal separation or reconnection occurs.

---

## 📍 Live Location & Privacy Policy

- **No Secret Tracking**: The backend provides no telemetry ingestion without user authentication and explicit opt-in (`consentGiven: true`).
- **Throttling**: The backend enforces a minimum 10-second window between writes to prevent battery drain and database pollution.
- **Immediate Deletion**: A user can permanently purge all stored location coordinates anytime using `DELETE /api/v1/location/history`.

---

## 🌐 Free-Tier Deployment Guide

### Deploying to Render (Free Tier)
1. Fork or push this backend repository to GitHub.
2. Sign in to [render.com](https://render.com) (free tier includes 750 hours/month).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Set:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
   - `ALLOWED_ORIGINS`: `https://your-frontend-domain.com`
7. Click **Deploy Web Service**. Your API will be live at `https://your-app.onrender.com`.

---

## 🧪 Automated Testing

Run the automated test suite with:
```bash
npm test
```
To run tests in watch mode:
```bash
npm run test -- --watch
```

---

## 📄 License

Licensed under the Apache-2.0 License.
