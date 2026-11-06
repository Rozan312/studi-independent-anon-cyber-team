---
version: 1
slug: "app-layout-tsx"
primary_target: "app/layout.tsx"
related_targets: ["components/app-shell.tsx","app/dashboard/page.tsx","app/globals.css"]
---

# Surface brief: Anon Cyber Team app (all signed-in and auth routes)

Scope and mode: the whole web app shell and every route (member, instructor, admin, auth, public home). Mode: Operate; room material inside rooms is Read.
Audience and job: community members learning cybersecurity at their own pace in long evening sessions on laptops and phones; instructors authoring content; admins managing users. Task: find the next step, read, answer, see progress.
Constraints: preserve routes, data flows, server actions, role rules; English UI; the original logo; editor and student material must render identically; instructor-chosen material colours stay readable in both themes; antislop rules already passed (44px touch, contrast, landmarks, states) must keep passing.
Chosen direction (6 Nov 2026, owner): the category standard, executed impeccably. The owner rejected the Security Paper world as too AI (iris gradient, dot grid, circuit motifs, rounded floating cards, dashboard template, pastel palette and safe fonts), rejected the hacker cliché, took the canon card, named Hack The Box as the model for its seamless feel ("not green, not a copy of HTB"), asked for ACT logo colours used on type and borders rather than big fills, allowed one soft gradient but no clashing gradients, and chose dark by default with a light option. Kept: optional theme switch, completion marks (check, score, retry), activity heatmap and path progress.
Memorable moment: the next room is always one cyan action away.
Unresolved: none.

## Direction contract

THESIS: A seamless, dark learning console in the Anon Cyber Team logo's colours: panels sit flush on one near-black ground with hairline seams, and logo cyan marks only what moves the member forward. It refuses the near-black hacker costume (neon, glow, terminal, matrix green) and the floating rounded-card SaaS dashboard.

OWN-WORLD: Ground #0A1118, panel #0F1922, raised #14212C, seams #1E2C38 / #2A3B49; ink #E7EEF2, #A3B3BE, #8597A3. Logo cyan #00C2F5 for the primary action, the active nav item (text, wash, hairline), links, focus, progress and the current item's border; violet completed, green correct and scores, red retry/error, amber scheduled. One soft gradient only, on the rail and auth panel (cyan-tinted navy to periwinkle-tinted navy). Red Hat Display for headings, labels and figures, Red Hat Text for reading, Red Hat Mono for code and serials. 6 to 10px radii, no shadows. Light theme mirrors it on #F4F7F9 / #FFFFFF with #006C8A text-cyan.

STORY: A member opens the app, sees the next room and its next task in one Continue panel with a cyan Resume, the path's rooms as a short stop list with minutes, their numbers, and what they completed. They read material on a calm panel, answer, and see a violet check land.

FIRST VIEWPORT: Desktop: 256px gradient rail (logo, nav with cyan active item, role groups, theme switch, member card with cyan mono serial); a 56px top bar with breadcrumb and a points/rank pill; title row "Good evening, Nadia" with the path line; a split Continue panel (left: next room title, meta, next task, 33% progress, cyan Resume and outlined View path; right: path stops with done/next marks and minutes) bordered in cyan; a ruled three-figure strip (Streak, Rooms completed, Quizzes passed); Recent activity rows. Right column: Top members, Announcement. Phone: top bar with logo, theme icon and Menu; the rail slides in as a drawer.

FORM: Category standard (canon), raised to the owner's Hack The Box reference in ACT colours; ordered list position: standing exit; seed: seed:995e0caa3ad62cc6.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
