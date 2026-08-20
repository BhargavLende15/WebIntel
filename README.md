# WebIntel – AI-Powered Digital Readiness Assessment Platform

WebIntel is a production-quality platform that evaluates a website's overall **Digital Readiness** for the modern AI-driven web. Unlike fragmented tools (Lighthouse, PageSpeed, SEO auditors), WebIntel provides a **unified score** combining performance, SEO, accessibility, security, AI search readiness, content quality, and mobile experience — with AI-powered recommendations, business intelligence dashboards, predictive analytics, and continuous monitoring.

> **WebIntel analyzes only. It never modifies your website.**

---

## Architecture

```
┌─────────────┐     REST API      ┌─────────────┐     SQLAlchemy     ┌────────────┐
│   React     │ ◄──────────────► │   FastAPI   │ ◄────────────────► │ PostgreSQL │
│  Frontend   │                   │   Backend   │                    │  Database  │
└─────────────┘                   └──────┬──────┘                    └────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              Lighthouse           Google Gemini         Scikit-learn
              Playwright           (Recommendations)    (Predictions)
              BeautifulSoup          (AI Assistant)
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, React Router, Axios, Recharts |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL |
| AI | Google Gemini API |
| ML | Scikit-learn |
| Analysis | BeautifulSoup, Playwright, Google Lighthouse |
| Deployment | Docker, Docker Compose |

---

## Prerequisites

- **Docker** & **Docker Compose** (recommended)
- **Node.js** 20+ (local frontend development)
- **Python** 3.12+ (local backend development)
- **PostgreSQL** 16+ (if running DB locally without Docker)

---

## Quick Start (Docker)

1. **Clone and configure**

   ```bash
   cd webintel
   cp .env.example .env
   ```

2. **Start all services**

   ```bash
   docker-compose up --build
   ```

3. **Access the application**

   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost:5173 |
   | Backend API | http://localhost:8000 |
   | API Docs (Swagger) | http://localhost:8000/docs |
   | Health Check | http://localhost:8000/health |

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Ensure PostgreSQL is running (or use docker-compose up db)
uvicorn app.main:app --reload --port 8000
```

For Docker or full-stack installs (includes Playwright, Gemini, scikit-learn):

```bash
pip install -r requirements-all.txt
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations (Alembic)

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## API Endpoints

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `GET` | `/health` | Health check | 1 |
| `POST` | `/api/v1/analyze` | Queue website analysis | 2 |
| `GET` | `/api/v1/analysis/{id}` | Get analysis results | 2 |
| `POST` | `/api/v1/score` | Calculate readiness score | 3 |
| `POST` | `/api/v1/recommendations` | AI recommendations | 4 |
| `GET` | `/api/v1/dashboard/{id}` | Dashboard data | 5 |
| `POST` | `/api/v1/chat` | AI assistant chat | 4 |
| `POST` | `/api/v1/predict` | Predictive analytics | 6 |
| `POST` | `/api/v1/monitor` | Setup monitoring | 7 |
| `GET` | `/api/v1/history/{website_id}` | Assessment history | 7 |
| `POST` | `/api/v1/report/pdf` | Generate report | 7 |

---

## Scoring Weights

| Category | Weight |
|----------|--------|
| Performance | 20% |
| SEO | 20% |
| Accessibility | 15% |
| Security | 15% |
| AI Readiness | 15% |
| Content Quality | 10% |
| Mobile Experience | 5% |

**Grades:** Excellent (90–100) · Good (75–89) · Average (60–74) · Poor (40–59) · Critical (0–39)

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://webintel:webintel@localhost:5432/webintel` |
| `SECRET_KEY` | Application secret key | `change-me-in-production` |
| `DEBUG` | Enable debug mode | `false` |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) | `["http://localhost:5173"]` |
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `VITE_API_URL` | Frontend API base URL | `http://localhost:8000/api/v1` |

---

## Project Structure

```
webintel/
├── frontend/          # React + Tailwind UI
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── charts/
│       ├── services/
│       └── hooks/
├── backend/           # FastAPI application
│   └── app/
│       ├── api/       # REST endpoints
│       ├── models/    # SQLAlchemy ORM
│       ├── schemas/   # Pydantic validation
│       ├── analysis/  # Lighthouse, Playwright, BS4
│       ├── ai/        # Gemini integration
│       ├── scoring/   # Readiness algorithm
│       └── reports/   # PDF/HTML generation
├── docker/            # Dockerfiles & nginx
├── docker-compose.yml
└── README.md
```

---

## Development Phases

| Phase | Status | Focus |
|-------|--------|-------|
| **1** | Complete | Project init, backend, frontend, PostgreSQL, Docker |
| **2** | Pending | Website Analyzer (Lighthouse, Playwright, BeautifulSoup) |
| **3** | Pending | Scoring Engine |
| **4** | Pending | Gemini AI (Recommendations + Assistant) |
| **5** | Pending | Business Intelligence Dashboards |
| **6** | Pending | Predictive Analytics (Scikit-learn) |
| **7** | Pending | Monitoring, Reports, History |
| **8** | Pending | Testing, Optimization, Deployment |

---

## Database Schema

- **users** — Authentication (Phase 8)
- **projects** — User project groupings
- **websites** — Tracked website URLs
- **analysis_results** — Raw and categorized metrics (JSONB)
- **scores** — Digital Readiness scores and grades
- **recommendations** — AI-generated optimization suggestions
- **historical_reports** — Assessment snapshots over time
- **predictions** — ML forecast results
- **monitoring_jobs** — Scheduled reassessment jobs
- **chat_sessions** / **chat_messages** — AI assistant conversations

---

## License

This project is developed as a final-year engineering major project. All rights reserved.
