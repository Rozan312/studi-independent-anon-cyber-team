# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Members and prospective members of the Anon Cyber Team community who learn cybersecurity at their own pace, any time, on laptops and phones. Instructors from the community's core team author learning paths, rooms, tasks, and quizzes, and follow member progress. Platform admins manage users, roles, and announcements.

Learning sessions are often long (reading walkthroughs, answering tasks, retrying quizzes), so the interface is read and used for extended periods.

## Product Purpose

A self-paced cybersecurity learning platform for the Anon Cyber Team community. Members follow learning paths made of rooms; each room combines a written walkthrough, practice tasks with hints, and a quiz. Progress, points, streaks, and a leaderboard keep learning visible and motivating. Success means members keep coming back, finish rooms, and understand the material, rather than skimming.

## Positioning

A community-run learning space: material is written and maintained by the Anon Cyber Team's own instructors, scheduled and published by them, and tracked per member. It is defensive and educational in scope (safe placeholder labs, no real targets).

## Operating Context

- Members: browse learning paths, open rooms, read material, submit task answers (hints unlock after two wrong attempts), take quizzes with per-question review, see progress, profile, and leaderboard.
- Instructors: Learning Path Manager, room editor with a Word-like visual material editor (fonts, colors, tables, images), tasks with hints and accepted answers, quiz builder, room scheduling (open/close dates), publishing.
- Admins: users and roles, platform statistics, announcements.
- Lab pages are placeholders; no real VMs or VPN are connected.

## Capabilities and Constraints

- Stack: Next.js 14 App Router, React 18, Tailwind CSS 3, Prisma/PostgreSQL. Existing routes, data flows, server actions, and role rules must be preserved.
- Interface language: English throughout. Technical security terms stay in their standard form.
- Room material is instructor-authored HTML rendered with the shared `.prose-cyber` styles; the editor and the student view must keep looking the same.
- Instructor-chosen text and highlight colors in material must stay readable on whatever background the material sits on.
- Local development uses a development-only auth mode.

## Brand Commitments

- Name: "Anon Cyber Team".
- Official logo: https://anoncyberteam.or.id/images/act.png, an isometric hexagonal cube with cyan faces, black outline and A-C-T letterforms, and a white border. Use the original logo in the app (sidebar, login, favicon).
- Older internal names such as "CyberGuard Academy" or "Controlled Intelligence" are not brand commitments.

## Evidence on Hand

- Logo file (to be stored under `public/`).
- Seed content: 10 learning paths and 10 rooms with English task/quiz content and Indonesian walkthrough material, plus demo accounts for local development.
- No testimonials, member counts, partner logos, or statistics exist; none may be fabricated.

## Product Principles

1. Learning comfort first: long reading and practice sessions must not tire the eyes.
2. Progress is always visible: members should always know where they are and what comes next.
3. Community ownership: instructors control content, schedule, and presentation; the platform presents it faithfully.
4. Safe and defensive by default: the product teaches security without encouraging harmful use.

## Accessibility & Inclusion

Readable contrast for long sessions on both laptop and phone; keyboard-usable forms and editor; screen-reader labels for interactive controls and task checkboxes.
