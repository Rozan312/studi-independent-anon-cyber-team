# Handover

## Project

Name: Studi Independent Anon Cyber Team

Goal: backend-first foundation for a safe TryHackMe-style cybersecurity learning platform. UI polish is intentionally minimal because Google Stitch already has a CyberGuard Academy UI design that can be integrated later.

## Current Scope Implemented

- Next.js App Router project structure
- TypeScript config
- Tailwind minimal styling
- Supabase Auth setup helpers
- Local auth mode for development without Supabase
- Prisma PostgreSQL schema
- Server-only Prisma client
- Zod validation
- Server-side auth helpers and RBAC
- Middleware route protection
- API route handlers for auth, profiles, learning paths, rooms, tasks, quizzes, leaderboard, lab sessions, instructor workflows, and admin workflows
- Basic public/student/instructor/admin route skeletons
- Seed script with safe educational content
- Docker Compose optional local PostgreSQL
- Documentation files
- **UI Integration Pass**: Google Stitch "CyberGuard Academy" dark theme is integrated across the main route shell and core student/admin/instructor pages.
  - Done: Global styles, App Shell, Login/Register, Forgot/Reset Password, Dashboard, Learning Paths, Rooms, Room Details, Lab Workspace, Quiz, Progress, Leaderboard, Admin Overview, Instructor Overview.
  - Done: Room task answer submission is wired through a server action with UI feedback.
  - Done: Quiz submission is interactive with inline validation, loading, API error, pass/fail, retake, and back-to-room states.
  - Done: Core student pages no longer depend on Material Symbols or Google Fonts, reducing white/unstyled UI risk in local mode.
  - Done: Admin user role updates are wired from `/admin/users` through admin-only server actions.
  - Done: Admin announcement create/edit/publish/unpublish is wired from `/admin/announcements` through admin-only server actions.
  - Done: Instructor room builder creates rooms with safe text tasks and can publish immediately from `/instructor/rooms/new`.
  - Done: Instructor room list can publish draft rooms from `/instructor/rooms`.
  - Done: Dashboard and Rooms image cards now use `next/image` with `lh3.googleusercontent.com` configured in `next.config.mjs`.
  - Done: Service smoke test added for RBAC, task submission, quiz scoring, progress update, and leaderboard points.
  - Done: Sidebar can collapse/expand smoothly and persists preference in `localStorage`.
  - Done: Sidebar "Workspace status" panel was removed because it felt gimmicky.
  - Done: Sidebar nav markers were changed from text abbreviations (`DB`, `LP`, etc.) to local inline SVG mini icons.
  - Done: Auth/sidebar brand mark uses a local inline SVG component instead of text initials.

## Key Files

- `prisma/schema.prisma`: complete database model
- `prisma/seed.ts`: safe seed data
- `middleware.ts`: route protection
- `lib/auth/guards.ts`: `requireAuth`, `requireRole`, current user/profile helpers
- `lib/auth/rbac.ts`: role hierarchy and route role rules
- `lib/auth/local-session*.ts`: dev-only local auth session support
- `lib/services/*`: backend service layer
- `lib/validation/*`: Zod schemas
- `app/api/*`: route handlers
- `components/ui/action-message.tsx`: reusable inline success/error UI message
- `components/rooms/task-submit-form.tsx`: interactive task answer form
- `components/admin/user-role-form.tsx`: admin role update UI
- `components/admin/announcement-forms.tsx`: admin announcement create/edit/publish UI
- `components/instructor/room-builder-form.tsx`: instructor room creation UI
- `components/instructor/publish-room-form.tsx`: instructor draft publish UI
- `components/brand-mark.tsx`: local inline SVG brand mark used by sidebar/login/register
- `lib/actions/learning-actions.ts`: task answer server action
- `lib/actions/admin-actions.ts`: admin-only user and announcement actions
- `lib/actions/instructor-actions.ts`: instructor-only room create/publish actions
- `tests/service-smoke.test.ts`: integration smoke test against local database
- `app/*`: route skeletons plus integrated CyberGuard-themed core UI

## Local Access Accounts

Local mode is active via `.env` (`AUTH_MODE=local`).

Admin account:
- username: `admin_local`
- email (internal): `admin_local@local.dev`
- role: `ADMIN`

Instructor account:
- username: `instruktur_local`
- email (internal): `instruktur_local@local.dev`
- role: `INSTRUCTOR`

Login notes:
- Use `/login` and input `username` + any password with at least 8 characters.
- In local auth mode, password is validated for length in UI but not persisted as real auth credentials.
- If role is changed directly in DB/API, logout and login again to refresh role in session cookie.

## Local Start / Stop

Current shutdown status as of the latest handover update:
- Frontend Next.js dev server was stopped.
- Local Docker Compose PostgreSQL backend was stopped.
- `http://localhost:3000/login` no longer responds until the frontend is started again.

Start local backend database:

```bash
docker compose up -d
```

Start frontend:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

If this is a fresh machine or database volume, run setup before `npm run dev`:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Stop frontend:

```bash
pkill -f "next dev"
```

Stop local backend database:

```bash
docker compose stop
```

Full clean restart after a build/cache issue:

```bash
pkill -f "next dev"
rm -rf .next
docker compose up -d
npm run dev
```

## Important Architecture Decisions

Supabase Auth owns identity. The app stores profile and role data in `Profile`, keyed by Supabase auth UUID.

`AUTH_MODE=local` can be used before Supabase is configured. It uses username/password forms, creates/updates `Profile` records in local PostgreSQL, and stores a dev-only session cookie. Email is synthesized internally as `username@local.dev` because the `Profile.email` column remains required. This is not production auth.

Public registration always creates `STUDENT` in Supabase mode and local mode. No login/register form exposes role selection. For local instructor/admin testing, edit `Profile.role` directly in the database or use admin-only APIs, then logout and login again.

Server-side authorization is required. Do not trust role values from the client.

Prisma is the main data access layer. Do not query application tables from client components unless Supabase RLS is added first.

Lab sessions are placeholders only. Do not add real VM/container orchestration until there is a separate server-only provider with quotas, expiry, audit logs, and strict authorization.

For icon/logo UI, the current implementation uses local inline SVG components as temporary placeholders. If official Stitch-exported assets become available, swap the placeholders to those assets.

## Safe Content Boundary

Do not add:

- Badge or certificate features
- Real exploit commands
- Malware content
- Phishing instructions
- Credential theft flows
- EDR bypass content
- Stealth persistence content
- Harmful payloads

Use defensive, conceptual, and toy-placeholder cybersecurity learning content only.

## Next Best Tasks

1. For local-only development, set `AUTH_MODE=local`, start `docker compose up -d`, then run migrations and seed.
2. For Supabase development, set `AUTH_MODE=supabase` and add real Supabase env values.
3. Run `npm run prisma:generate`.
4. Run `npm run prisma:migrate`.
5. Run `npm run prisma:seed`.
6. Run `npm run typecheck`.
7. Add Playwright smoke tests for login, register, room task submission, quiz submission, and role guard redirects.
8. Add edit/update support for existing instructor room drafts, not only create/publish.
9. Add richer dynamic task editing in room builder, including per-task answer type selection.
10. Add admin delete/archive flows if product requirements need them.
11. Run `npm audit` triage and decide whether to upgrade vulnerable packages now or during dependency maintenance.

## Known Dev Environment Bugs

- **Next.js Dev Server Cache Bug**: Running `npm run build` while `npm run dev` is active will corrupt the `.next` cache, resulting in a white screen where CSS/JS assets fail to load (404 errors). 
  - **Fix**: Stop the dev server (`lsof -ti:3000 | xargs kill -9`), delete the cache folder (`rm -rf .next`), and restart the dev server (`npm run dev`).

## Known Constraints

The repository now has a usable CyberGuard-style UI foundation, but it is still an integration baseline rather than final product design. Instructor/admin mutation screens are intentionally scaffolded and need real form actions before production use.

Current build status after UI pass:
- `npm run typecheck`: passes
- `npm run build`: passes
- `npm run test`: passes
- Build warnings: none from app lint. Prisma still warns that `package.json#prisma` config is deprecated for Prisma 7; migrate later to `prisma.config.ts`.
- `npm install server-only` was added so CLI service tests can resolve `server-only` imports. The test file patches that import at runtime because Next normally aliases it internally.

The seed script creates sample `Profile` rows with fixed UUIDs for local data, but these are not Supabase Auth users. With `AUTH_MODE=local`, they can still be used as normal app profiles. With Supabase mode, create users through Supabase Auth or registration flow, then assign roles from admin tooling or SQL.

The middleware reads the `Profile` table through Supabase. If RLS is enabled for that table, add a policy that allows the authenticated user to read their own role or move role checks entirely into server-rendered guards.
