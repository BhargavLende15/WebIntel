# WebIntel Architecture

## System Overview

WebIntel follows a clean three-tier architecture:

1. **Presentation Layer** — React SPA with Tailwind CSS
2. **Application Layer** — FastAPI REST API with service modules
3. **Data Layer** — PostgreSQL with SQLAlchemy ORM

## Backend Modules

| Module | Path | Purpose |
|--------|------|---------|
| API | `app/api/v1/` | REST endpoint handlers |
| Models | `app/models/` | SQLAlchemy ORM entities |
| Schemas | `app/schemas/` | Pydantic request/response validation |
| Analysis | `app/analysis/` | Lighthouse, Playwright, BeautifulSoup |
| Scoring | `app/scoring/` | Weighted Digital Readiness algorithm |
| AI | `app/ai/` | Google Gemini integration |
| Reports | `app/reports/` | PDF/HTML report generation |
| Monitoring | `app/monitoring/` | Scheduled reassessment jobs |

## Data Flow

1. User submits URL via frontend
2. Backend creates `Website` and `AnalysisResult` records
3. Analysis engine collects metrics (Phase 2)
4. Scoring engine computes weighted score (Phase 3)
5. Gemini generates recommendations (Phase 4)
6. Dashboard visualizes results (Phase 5)
7. ML models predict future scores (Phase 6)
8. Monitoring schedules reassessments (Phase 7)
