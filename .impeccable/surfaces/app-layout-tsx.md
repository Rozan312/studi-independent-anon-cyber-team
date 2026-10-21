---
version: 1
slug: "app-layout-tsx"
primary_target: "app/layout.tsx"
related_targets: ["components/app-shell.tsx","app/dashboard/page.tsx","app/globals.css"]
---

# Surface brief: Anon Cyber Team app (all signed-in and auth routes)

Scope and mode: the whole web app shell and every route (member, instructor, admin, auth). Mode: Operate; room material inside rooms is Read.
Audience and job: community members learning cybersecurity at their own pace in long evening sessions on laptops and phones; instructors authoring content; admins managing users. Task: find the next step, read, answer, see progress.
Constraints: preserve routes, data flows, server actions, role rules; English UI; the original logo; editor and student material must render identically; instructor-chosen material colours must stay readable on the new light ground.
Chosen direction: Security Paper & Stamps (user-confirmed via structured question; decision page closed unanswered).
Memorable moment: completing a task or room strikes an inked stamp into the member's learning passport.
Unresolved: none.

## Direction contract

THESIS: The platform is an official, security-printed record of each member's learning: calm iris-tinted paper, crisp intaglio ink, and completion arrives as an inked stamp. It refuses the category default of a near-black console with neon accents and glowing cards, and the opposite default of a white SaaS LMS with blue buttons and thumbnail tiles.

OWN-WORLD: Cool security paper ground (#F3F7F8), whiter sheets (#FCFDFD), hairline rules (#CCDCE1); intaglio ink text (#10161F) and slate secondary ink; an iris-printed rail fading pale cyan to pale periwinkle with a dotted perforation edge. Logo cyan (#00C2F5 fill, ink outline, like the logo's faces) is reserved for the member's next step and primary action; text-safe deep cyan (#006C8A) for links. Stamp inks carry state: violet completed, green correct, red retry/closed/error, amber scheduled. Each learning path owns a generated guilloche rosette (deterministic from its slug) that is also its progress ring. Archivo throughout; condensed caps for field labels; tabular figures in fixed cells for every counter; JetBrains Mono only for code.

STORY: A member opens the app and immediately sees their next step in cyan, how far along their path is (the rosette fills), and their latest stamps. They resume, read comfortable material on paper-white, answer a task, and watch a stamp strike. Closed and scheduled rooms never vanish; they wear a stamped state. Instructors and admins work in the same paper-and-ink system with dense ruled tables.

FIRST VIEWPORT: Desktop: 248px iris rail on the left (logo + name, nav, role section, member card with red serial ID, sign out). Main: page title row (no eyebrow), then a two-column grid: left, the Continue sheet with the path rosette-progress (about 200px) beside the next room title, its next task, and the cyan Resume button with ink outline; right, a ruled 2x2 field block (Points, Streak, Rooms stamped, Rank) with tabular figures. Below, full width: the learning passport strip of latest stamps, then paths with their rosette emblems. Phone: rail collapses to a top bar with the logo and a Menu button opening the same rail as a drawer.

FORM: Security printing (passport visa pages, banknote guilloche, rubber-stamp inks), candidate 6 of 7 on the ordered list; seed: seed:3f025d0602db4072. Signature interaction: the stamp strike on completion (scale and ink settle, reduced-motion safe). Raises: reserved next-step cyan (orienteering), nothing disappears (ticket wallet), one geometry for art and progress (zoo map), fixed-cell figures (split-flap), artwork-only colour in catalogs (streaming wall).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
