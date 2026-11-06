# Architecture

> Updated code-based architecture handover: [Architecture Handover for Developers and AI](ARCHITECTURE-HANDOVER.md). The overview below is historical; use the handover for current UI, authentication, progress, and service behavior.

## High-Level Architecture

Studi Independent Anon Cyber Team is a Next.js App Router application backed by Supabase Auth and Supabase PostgreSQL. Prisma is the database access layer. The codebase is structured so UI replacement from Google Stitch can happen later without rewriting authentication, authorization, or data services.

## Frontend Layer

The current UI is intentionally minimal. Routes exist for public, student, instructor, and admin pages. Protected pages are server components that call server-side guards before reading data.

Primary folders:

- `app/*` for routes and route handlers
- `components/*` for minimal reusable shell components
- `app/globals.css` and Tailwind for basic layout compatibility

## Backend Layer

Backend behavior lives in server-only service modules:

- `lib/services/auth-service.ts`
- `lib/services/profile-service.ts`
- `lib/services/learning-path-service.ts`
- `lib/services/room-service.ts`
- `lib/services/task-service.ts`
- `lib/services/quiz-service.ts`
- `lib/services/leaderboard-service.ts`
- `lib/services/instructor-service.ts`
- `lib/services/admin-service.ts`
- `lib/services/lab-session-service.ts`

Route handlers in `app/api/*` call these services and validate inputs with Zod schemas from `lib/validation/*`.

## Auth Layer

Supabase Auth handles email/password identity. The app maps each Supabase user to a `Profile` row using the same UUID.

For local development, `AUTH_MODE=local` replaces Supabase Auth with username/password forms, a dev-only HTTP-only cookie session, and local PostgreSQL-backed profiles. Email is not required in local mode. This mode exists to unblock UI/backend work before Supabase credentials are available. It must not be deployed.

Helpers:

- `getCurrentUser()`
- `getCurrentProfile()`
- `requireAuth()`
- `requireRole()`

Middleware handles broad route protection. Server components and API handlers enforce role checks again server-side.

## Database Layer

Prisma owns the application schema. Supabase owns `auth.users`. The app links to Supabase users through `Profile.id`, which stores the Supabase auth user UUID.

The database supports:

- Learning paths and rooms
- Room tasks
- Quizzes and answers
- Progress tracking
- Leaderboard point events
- Instructor classes
- Announcements
- Lab session placeholders

## Future Lab Orchestration Layer

The current lab layer is data-only. Real machine orchestration should be added later as a server-only adapter, for example:

- `lib/labs/providers/local-docker-provider.ts`
- `lib/labs/providers/cloud-provider.ts`
- `lib/labs/lab-orchestrator.ts`

The orchestrator should update `LabSession` rows and emit audit logs. It must not expose provider credentials or internal network details to clients.

## Deployment Architecture

Recommended production setup:

- Vercel for Next.js
- Supabase Auth
- Supabase PostgreSQL
- Prisma migrations run from CI or a controlled admin workstation
- Vercel environment variables for app URL, Supabase URL, anon key, service role key, and database URLs

Service role keys must remain server-only. Client components must use only the public Supabase URL and anon key.
