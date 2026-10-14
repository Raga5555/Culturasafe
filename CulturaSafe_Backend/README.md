# 🏛️ CulturaSafe Python Backend (FastAPI)

A high-performance Python FastAPI backend service for **CulturaSafe**, featuring smart tourism, belongings safety, and GPS exploration.

Integrated with **Supabase PostgreSQL** for data persistence and authentication, secured by **Row Level Security (RLS)**, equipped with rate limiting, input validation, offline batch synchronization, and IoT belongings separation tracking.

---

## 📋 Features

1. **Supabase Authentication**: User registration, login, logout, token verification via Supabase Auth JWT.
2. **PostgreSQL with RLS**: Strict Row Level Security policies guarantee users can read and modify only their own data.
3. **Tourism & Itineraries**: CRUD endpoints for destinations, personalized travel itineraries, and tourist interests.
4. **Consent-Based Location History**: Secure GPS coordinates ingestion throttled to prevent spam; coordinates never logged without explicit consent.
5. **Belongings & BLE Tracking**: Registered items model with tag metadata, battery levels, separation alerts, and reconnection event logging.
6. **Offline Synchronization**: Batch sync endpoint (`POST /api/v1/sync`) for reconciling offline edits and queued alerts when reconnected.
7. **Security**: CORS, rate limiting (general & auth-specific), and Pydantic schema validation.
8. **Interactive OpenAPI / Swagger**: Built-in interactive Rapidoc documentation accessible at `/api/docs` and OpenAPI spec at `/api/docs/spec`.

---

## 📂 Architecture & Directory Structure

```text
backend-python/
├── .env.example               # Environment variables template
├── .gitignore
├── pyproject.toml             # Python project definition & pytest configuration
├── requirements.txt           # Python dependencies
├── README.md                  # Comprehensive setup and API guide
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI application assembly, middleware & routes
│   ├── api/                   # Route handlers
│   │   ├── __init__.py
│   │   ├── health.py          # Health check & root discovery
│   │   ├── auth.py            # Registration, login, logout, caller profile
│   │   ├── user.py            # Profiles & user preferences
│   │   ├── destinations.py    # Saved destination bookmarks
│   │   ├── itineraries.py     # Travel itineraries CRUD
│   │   ├── location.py        # Consent-based GPS point logging & history
│   │   ├── belongings.py      # BLE tags & separation alert events
│   │   └── sync.py            # Offline batch reconciliation
│   ├── core/                  # Core configurations, logging, security
│   │   ├── config.py          # Pydantic Settings
│   │   ├── logging.py         # Formatted logger
│   │   └── security.py        # AuthenticatedUser and AppException
│   ├── dependencies/          # Fastapi dependency injections
│   │   └── auth.py            # Bearer JWT validation via Supabase
│   ├── schemas/               # Pydantic request and response schemas
│   │   ├── auth.py
│   │   ├── belongings.py
│   │   ├── common.py
│   │   ├── destinations.py
│   │   ├── itineraries.py
│   │   ├── location.py
│   │   ├── sync.py
│   │   └── user.py
│   ├── services/
│   │   └── supabase_client.py # Client instances (Anon, Admin, Scoped)
│   └── utils/
│       └── rate_limiter.py    # In-memory sliding-window rate limiters
└── tests/
    ├── test_health.py         # Health and root discovery tests
    ├── test_auth_validation.py# Auth and route protection tests
    └── test_belongings_alerts.py # Belongings & GPS validation tests
```

---

## ⚡ Prerequisites

- **Python**: v3.11 or higher (Python 3.12+ recommended).
- A free **Supabase** account.

---

## 🛠️ Installation & Local Run

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` in the root or `backend-python/` directory:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=5001
   ```

3. **Start the development server:**
   ```bash
   uvicorn app.main:app --reload --port 5001
   ```

4. **Access the API:**
   - Base API: `http://localhost:5001/api`
   - Health check: `http://localhost:5001/api/health`
   - Interactive docs: `http://localhost:5001/api/docs`
   - OpenAPI spec: `http://localhost:5001/api/docs/spec`

---

## 🧪 Automated Testing

Run the automated test suite using pytest:
```bash
python -m pytest
```
