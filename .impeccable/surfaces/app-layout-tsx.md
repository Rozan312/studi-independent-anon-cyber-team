---
version: 1
slug: "app-layout-tsx"
primary_target: "app/layout.tsx"
related_targets: ["components/app-shell.tsx","app/dashboard/page.tsx","app/globals.css"]
---

# Surface brief: Anon Cyber Team app (all signed-in and auth routes)

Scope and mode: the whole web app shell and every route (member, instructor, admin, auth, public home). Mode: Operate; room material inside rooms is Read.
Audience and job: community members learning cybersecurity at their own pace in long evening sessions on laptops and phones; instructors authoring content; admins managing users. Task: find the next step, read, answer, see progress.
Constraints: preserve routes, data flows, server actions, role rules; English UI; the original logo; editor and student material must render identically; instructor-chosen material colours must stay readable on the light ground.
Chosen direction: Security Paper (user-confirmed via structured question). Owner changes on 21 Oct 2026: rubber stamps were rejected ("looks like postage stamps"), cyber badge shapes and cube badges were rejected too; completion is now shown with direct marks (check, score number, retry icon). Rooms and paths show an uploaded logo, or by default the initials of their name. Second round the same day: postage-stamp-like print ornament (guilloche rosettes, wavy bands, perforated rail) was rejected and replaced with IT/digital motifs (circuit traces, dot grid, segmented progress ring); the primary button lost its black outline; the app got an opt-in night mode (toggle in the left menu, mobile drawer, mobile top bar, and lab; room material follows it, with instructor colours re-inked); the left menu and page changes animate smoothly.
Memorable moment: a passed room's check mark draws itself in once.
Unresolved: none.

## Direction contract

THESIS: The platform reads like calm security paper with crisp intaglio ink, and progress is stated plainly: a check for a passed room, the score for a quiz, a retry icon when it needs another go. It refuses the category default of a near-black console with neon accents and glowing cards, the opposite default of a white SaaS LMS with blue buttons and thumbnail tiles, and decorative badges, stamps, or postage-stamp ornament (guilloche, perforation).

OWN-WORLD: Cool security paper ground (#F3F7F8), whiter sheets (#FCFDFD), hairline rules (#CCDCE1); intaglio ink text (#10161F) and slate secondary ink; a rail in a pale cyan-to-periwinkle gradient under a fine digital dot grid. Logo cyan (#00C2F5 fill with a thin cyan border and deep blue-ink text, no black outline) is reserved for the member's next step and primary action; text-safe deep cyan (#006C8A) for links. Status colours: violet completed (the check), green correct and quiz scores, red retry/closed/error, amber scheduled. Rooms and paths are identified by their uploaded logo or a tinted initials tile from their name. Digital motifs replace the earlier print ornament (owner request): a segmented progress ring (one segment per room: violet done, cyan next, grey to do) on the dashboard and path page, deterministic circuit-trace fields on the home hero and auth panel, and a circuit "data bus" strip edging the hero and the Continue sheet. Archivo throughout; condensed caps for field labels; tabular figures in fixed cells; JetBrains Mono only for code.

STORY: A member opens the app and immediately sees their next step in cyan, how far along their path is (the segmented ring fills, room by room), and a plain list of what they completed. They resume, read comfortable material on paper-white, answer a task, and see a check appear. Closed and scheduled rooms never vanish; they carry a flat state tag. Instructors upload a room or path logo in its configuration; until then the initials stand in.

FIRST VIEWPORT: Desktop: 256px iris rail on the left (logo + name, nav, role section, member card with red serial ID, sign out). Main: page title row (no eyebrow), then a two-column grid: left, the Continue sheet under a circuit strip with the segmented progress ring (about 200px) beside the next room title, its next task, and the cyan Resume button (no outline), plus a numbered itinerary of the path's rooms; right, a ruled 2x2 field block (Points, Streak, Rooms completed, Rank) with tabular figures and the top members. Below, full width: the Completed list (check, score, or retry icon per row), then paths with their logos. Phone: rail collapses to a top bar with the logo and a Menu button opening the same rail as a drawer.

FORM: Light digital/IT surface (circuit traces, dot-grid surface, segmented gauge ring), reworked by the owner from the rolled security-printing direction (candidate 6 of 7 on the ordered list); seed: seed:3f025d0602db4072. Signature interaction: the check mark drawing in on a fresh completion; motion grammar: content fades up on every page view and the mobile menu slides in (all reduced-motion safe). An opt-in night mode is available everywhere. Raises kept: reserved next-step cyan (orienteering), nothing disappears (ticket wallet), one geometry for art and progress on the segmented path ring (zoo map), fixed-cell figures (split-flap), artwork-only colour in catalogs via logos (streaming wall).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
