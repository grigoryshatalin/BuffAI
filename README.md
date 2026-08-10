# BuffAI — AI Academic-Advising Service

An AI academic advisor for university students. Students register, record the
courses they've completed and their interests, and chat with an LLM advisor that
reasons over their **official degree requirements** to explain what's done and
what's left. A companion tool scrapes public professor ratings.

The system is a **containerized, four-service microservice deployment** wired
together with Docker Compose.

## Architecture

```
                         ┌───────────────────────────────────────────┐
                         │            Docker Compose network           │
                         │                                             │
   Browser ───HTTP───▶  web (Node/Express)  ──SQL──▶  db (PostgreSQL) │
                         │      │      │                                │
                         │      │      └──token-stream──▶ ollama (LLM)  │
                         │      │                                       │
                         │      └──HTTP──▶ python-api (Flask+Puppeteer) │
                         └───────────────────────────────────────────┘
```

| Service      | Image / stack                     | Role                                                                 |
|--------------|-----------------------------------|----------------------------------------------------------------------|
| `web`        | Node · Express · Handlebars       | ~20-endpoint REST API, session auth, server-rendered UI              |
| `db`         | `postgres:14`                     | Normalized relational schema (courses, prerequisites, degrees, enrollment) |
| `ollama`     | `ollama/ollama`                   | Self-hosted LLM (`gemma:2b`); the web tier proxies token-streamed chat |
| `python-api` | Flask + Puppeteer (headless Chrome) | Web-scraping microservice for Rate My Professors data               |

### Chat streaming
`POST /stream` builds a system prompt from the student's profile, completed
courses, and degree requirements, then proxies a **token-streamed** response
from the internal `ollama` service (`http://ollama:11434/api/chat`) straight
back to the browser over `text/event-stream`.

## Authentication & validation
- **Session-based auth** via `express-session`; passwords hashed with `bcryptjs`.
- **Server-side input validation** (`validator`) on registration/login, plus
  auth guards on protected routes (`/home`, `/advisor`, `/stream`, class/hobby
  mutations) that reject or redirect unauthenticated requests.
- All database access goes through **`pg-promise`** with parameterized queries.

## Data model
Normalized PostgreSQL schema (see `ProjectSourceCode/init_data/`):

- `degrees` / `minors` — degree programs with requirements stored as `JSONB`
- `courses` — the course catalog
- `prerequisites` — prerequisite slots per course (FK → `courses`)
- `students` — accounts (FK → `degrees`, `minors`)
- `student_courses` — enrollment / completed courses (FK → `students`, `courses`)
- `student_hobbies` — interests used to personalize advice

### Versioned schema & seed scripts
The `init_data/` scripts are **version-prefixed** so PostgreSQL's
`docker-entrypoint-initdb.d` applies them in a deterministic order:

| File                                 | Purpose                                  |
|--------------------------------------|------------------------------------------|
| `V1__schema.sql`                     | Tables, keys, and foreign-key constraints |
| `V2__seed_degrees_and_minors.sql`    | Degree/minor programs (JSONB requirements) |
| `V3__seed_courses.sql`               | Course catalog                            |
| `V4__seed_prerequisites.sql`         | Prerequisites (FK → courses, so runs last) |

## API endpoints (selected)
| Method | Path                     | Description                             |
|--------|--------------------------|-----------------------------------------|
| GET    | `/` , `/login`           | Login page                              |
| POST   | `/login` , `/logout`     | Session login / logout                  |
| GET/POST | `/register`            | Create account (validated, bcrypt-hashed) |
| GET    | `/home`                  | Student dashboard (courses by year)     |
| POST   | `/add-class` `/remove-class` | Manage enrollment                   |
| GET    | `/hobbies` · POST `/add-hobby` `/remove-hobby` | Manage interests      |
| GET    | `/advisor`               | AI advisor page                         |
| POST   | `/stream`                | Token-streamed LLM chat (Ollama proxy)  |
| GET/POST | `/rmp`                 | Rate My Professors lookup (→ python-api) |
| GET/POST | `/map`                 | Campus map                              |
| GET    | `/welcome`               | Health check                            |

## Running locally
Requires Docker + Docker Compose.

1. Create `ProjectSourceCode/.env`:
   ```env
   POSTGRES_DB=buffai
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   DB_HOST=db
   DB_PORT=5432
   PORT=3000
   ```
2. Bring the stack up:
   ```bash
   cd ProjectSourceCode
   docker compose up --build
   ```
   On first boot the `ollama` service pulls `gemma:2b` (a few minutes), and
   PostgreSQL runs the `V1…V4` scripts to build and seed the database.
3. Open http://localhost:3000.

## Tests
Mocha + Chai-HTTP integration tests exercise the live API routes (validation and
auth guards) without requiring a running database:

```bash
cd ProjectSourceCode/frontend
npm install
npm test
```
