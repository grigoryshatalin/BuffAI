# BuffAI

An AI academic advisor. Students sign up, log the courses they've taken and a
few interests, then chat with a local LLM that reads their degree requirements
and tells them what's done and what's left. There's also a small tool for
looking up a professor's rating.

It runs as four containers under Docker Compose.

## Stack

- `web`: the Node/Express app (Handlebars views). Serves the UI and API, handles
  login, and talks to the other services.
- `db`: PostgreSQL 14. Schema and seed data are in `ProjectSourceCode/init_data`.
- `ollama`: a self-hosted Ollama instance running `gemma:2b`. The web tier
  streams chat responses from it.
- `python-api`: a Flask service that scrapes Rate My Professors using Puppeteer
  (headless Chrome).

Passwords are hashed with bcrypt, sessions run through express-session, and all
database access goes through pg-promise with parameterized queries.

## Running it

You need Docker and Docker Compose.

1. Create `ProjectSourceCode/.env`:

   ```
   POSTGRES_DB=buffai
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   DB_HOST=db
   DB_PORT=5432
   PORT=3000
   ```

2. Start everything:

   ```
   cd ProjectSourceCode
   docker compose up --build
   ```

   The first run pulls the Ollama model and seeds the database, so give it a few
   minutes. After that the app is at http://localhost:3000.

## Database

The schema covers courses, prerequisites, degrees and minors, students, and
enrollment (`student_courses`). The SQL files in `init_data` are numbered so
Postgres applies them in order:

- `V1__schema.sql` — tables and foreign keys
- `V2__seed_degrees_and_minors.sql` — degree programs (requirements stored as JSONB)
- `V3__seed_courses.sql` — course catalog
- `V4__seed_prerequisites.sql` — prerequisites, which reference courses so this runs last

## Chat

`POST /stream` reads the student's profile, completed courses, and degree
requirements from Postgres, builds a system prompt, and streams the model's
reply back token by token from the internal ollama service.

## Tests

There are Mocha/Chai-HTTP tests over the API covering input validation and the
auth guards. They don't need a running database.

```
cd ProjectSourceCode/frontend
npm install
npm test
```
