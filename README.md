# Studi Independent Anon Cyber Team

> Dokumen serah terima terbaru (setup, akun lokal, ringkasan fitur): [handover.md](handover.md) dan [docs/ARCHITECTURE-HANDOVER.md](docs/ARCHITECTURE-HANDOVER.md). README ini berisi catatan awal proyek.

Backend-first foundation for an interactive cybersecurity learning platform. The UI can later be replaced with the Google Stitch "CyberGuard Academy UI" output; this repository focuses on authentication, authorization, database modeling, API structure, route protection, local development, and deployment readiness.

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase Auth for email/password authentication
- Supabase PostgreSQL
- Prisma ORM
- Zod validation
- Tailwind CSS for minimal layout compatibility
- Docker Compose optional local PostgreSQL
- Vercel-ready project structure

## Architecture Overview

The app uses Supabase Auth for identity and stores application data in PostgreSQL through Prisma. Supabase owns `auth.users`; the application owns a `Profile` table with the same UUID as the Supabase user. Server components, route handlers, and server actions call server-only service modules. Role checks happen server-side through `requireAuth()`, `requireRole()`, `getCurrentUser()`, and `getCurrentProfile()`.

Roles:

- `STUDENT`
- `INSTRUCTOR`
- `ADMIN`

New public registrations always create a `STUDENT` profile. Users cannot choose their role during registration.

## Local Setup

```bash
cd /Users/macbook/studi-independent-anon-cyber-team
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The default development URL is `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

Client-side code may only use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The service role key is only for server-only code and must never be imported into client components.

Use `AUTH_MODE=local` for MacBook/local development without Supabase Auth. In local mode, login/register use username/password and a dev-only cookie session backed by local PostgreSQL profiles. New local accounts default to `STUDENT`; instructor/admin roles should be assigned through the database or admin API. Use `AUTH_MODE=supabase` for production-like behavior.

## Local Auth Mode Without Supabase

Start a local PostgreSQL database:

```bash
docker compose up -d
```

Create `.env`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_MODE=local
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/si_act
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/si_act
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder
SUPABASE_SERVICE_ROLE_KEY=local-placeholder
```

Then run:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

In local auth mode, use `/login` with a username and a password of at least 8 characters. Email is not required in local mode. This is strictly for development. Do not deploy with `AUTH_MODE=local`.

To promote a local user after login/register:

```bash
npm run prisma:studio
```

Open `Profile`, find the synthesized email (`username@local.dev`), and set `role` to `INSTRUCTOR` or `ADMIN`. Then logout and login again so the local session cookie receives the updated role.

## Supabase Setup

1. Set `AUTH_MODE=supabase`.
2. Create a Supabase project.
3. Enable email/password authentication.
4. Copy the project URL and anon key into `.env`.
5. Copy the database connection strings into `DATABASE_URL` and `DIRECT_URL`.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
7. Run Prisma migration and seed commands.

Supabase Auth creates users in `auth.users`. Registration creates a matching `Profile` row with the same UUID and `STUDENT` role.

## Prisma

Schema file:

```bash
prisma/schema.prisma
```

Common commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

The schema includes profiles, learning paths, rooms, room tasks, quizzes, quiz questions/options, user progress, task submissions, quiz attempts, classes, class members, announcements, leaderboard points, and lab sessions.

## API Structure

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Core:

- `GET/PATCH /api/profile`
- `GET /api/learning-paths`
- `GET/PATCH /api/rooms`
- `GET/POST /api/tasks/submit`
- `GET/POST /api/quizzes/submit`
- `GET /api/leaderboard`
- `GET/POST/PATCH/DELETE /api/lab-sessions`

Instructor:

- `GET /api/instructor/classes`
- `GET /api/instructor/students`
- `POST/PATCH/PUT /api/instructor/rooms`

Admin:

- `GET/PATCH /api/admin/users`
- `GET /api/admin/platform`
- `GET/POST/PATCH/PUT /api/admin/announcements`

## Route Protection

Middleware protects authenticated route prefixes and redirects unauthenticated users to `/login`. Server components and route handlers also call `requireRole()` so authorization is not only middleware-based.

Student routes:

- `/dashboard`
- `/learning-paths`
- `/learning-paths/[slug]`
- `/rooms`
- `/rooms/[slug]` (material, one chapter per page with `?chapter=N`; each chapter's tasks sit under it)
- `/rooms/[slug]/tasks` (redirects to the chapter with the first open task)
- `/rooms/[slug]/lab`
- `/rooms/[slug]/quiz`
- `/progress`
- `/leaderboard`

Instructor routes include all student routes plus `/instructor/*`.

Admin routes include all routes plus `/admin/*`.

## Safe Content Policy

Seed data uses safe placeholder cybersecurity education only. It avoids real exploit commands, malware content, phishing instructions, credential theft flows, EDR bypass content, stealth persistence content, and harmful payloads.

Not implemented by design:

- Badge system
- Certificate system
- Download certificate feature
- Share certificate feature

## Deployment Notes

For Vercel:

1. Add all environment variables in Vercel project settings.
2. Ensure Supabase connection strings are available to Prisma.
3. Run migrations from a controlled environment before production deploys.
4. Use `npm run build`.
5. Keep service role key unavailable to client-side bundles.

## Future Lab Orchestration Plan

`LabSession` is intentionally a placeholder model. It tracks status, VPN state, machine state, target metadata, and timestamps, but does not start real VMs or containers. Future orchestration should be added behind a server-only provider interface with strict authorization, quotas, audit logs, and safe training images only.

See:

- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/SECURITY.md`
- `docs/HANDOVER.md`
