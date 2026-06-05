# Security

## Secret Handling

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components. Client code may only use:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only code imports privileged Supabase clients from `lib/supabase/admin.ts`.

`AUTH_MODE=local` is a development-only bypass for Supabase Auth. It uses an HTTP-only cookie and local PostgreSQL profile rows. Do not deploy with local auth enabled.

## Role-Based Access Control

Middleware protects route prefixes, but it is not the only authorization boundary. Server components and route handlers also call:

- `requireAuth()`
- `requireRole()`
- `getCurrentUser()`
- `getCurrentProfile()`

Role values are read from the `Profile` table server-side. Public users cannot choose roles during registration.

In `AUTH_MODE=local`, login/register still default new users to `STUDENT`. Instructor/admin roles should be assigned through direct database edits or admin-only APIs, then the user should login again to refresh the local session cookie.

## Safe Content Policy

The platform is for structured education and defensive learning. Content must not include:

- Real exploit commands
- Malware content
- Phishing instructions
- Credential theft flows
- EDR bypass content
- Stealth persistence content
- Harmful payloads

Seed content uses safe placeholders and defensive concepts only.

## Responsible Lab Usage

Lab sessions are placeholders. They do not start real machines. All future labs must be scoped to authorized training environments and should include responsible-use notices, audit logs, quotas, and termination controls.

## Supabase RLS Recommendation

Prisma connects through PostgreSQL directly, so application services must enforce authorization. If exposing Supabase client-side table access later, add Row Level Security policies before any client queries are introduced.

Recommended policies:

- Profiles can read/update their own non-role profile fields.
- Students can read published learning content.
- Students can read/write only their own progress and submissions.
- Instructors can read members of their own classes.
- Admins can manage profiles, announcements, and platform metadata.

## Future Hardening Checklist

- Add audit logging for admin role changes and publication workflows.
- Add rate limits for auth endpoints and answer submission.
- Add unique point constraints if duplicate prevention needs database enforcement.
- Add RLS policies before any direct client-side Supabase table queries.
- Add CSRF review for any non-server-action mutation forms.
- Add structured logging and security event alerts.
- Add lab quota enforcement and per-session expiry workers.
- Add migration pipeline and database backup validation.
