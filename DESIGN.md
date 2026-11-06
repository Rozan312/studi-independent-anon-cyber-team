---
name: Anon Cyber Team
description: A seamless dark learning console in the ACT logo's colours, where logo cyan marks only what moves a member forward.
colors:
  ground: "#0A1118"
  panel: "#0F1922"
  raised: "#14212C"
  seam: "#1E2C38"
  seam-soft: "#18242F"
  seam-strong: "#2A3B49"
  control-edge: "#5C7485"
  ink: "#E7EEF2"
  ink-2: "#A3B3BE"
  ink-3: "#8597A3"
  logo-cyan: "#00C2F5"
  logo-cyan-hover: "#33D1F8"
  cyan-wash: "#0D2D3B"
  cyan-ink: "#00C2F5"
  on-cyan: "#04202B"
  completed-violet: "#A897F5"
  completed-violet-wash: "#252142"
  correct-green: "#5FCB8E"
  correct-green-wash: "#133024"
  retry-red: "#F2807A"
  retry-red-wash: "#3C1B1B"
  scheduled-amber: "#E9B65F"
  scheduled-amber-wash: "#392B13"
  tile-indigo: "#1E2646"
  tile-indigo-ink: "#B0BCF4"
  tile-teal: "#103032"
  tile-teal-ink: "#7CD8CA"
  prose-ink: "#D6E0E6"
  code-ink: "#E4EDF1"
  code-block: "#060B10"
  scrim: "#000000"
typography:
  display:
    fontFamily: "Red Hat Display, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.028em"
  headline:
    fontFamily: "Red Hat Display, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Red Hat Display, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Red Hat Display, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\", \"lnum\""
  body:
    fontFamily: "Red Hat Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  reading:
    fontFamily: "Red Hat Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Red Hat Display, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1rem
    letterSpacing: "0.08em"
  button:
    fontFamily: "Red Hat Display, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25rem
  mono:
    fontFamily: "Red Hat Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
  serial:
    fontFamily: "Red Hat Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.06em"
rounded:
  md: "6px"
  lg: "8px"
  sheet: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  panel: "20px"
  panel-lg: "24px"
  section: "28px"
  gutter-desktop: "40px"
components:
  button-primary:
    backgroundColor: "{colors.logo-cyan}"
    textColor: "{colors.on-cyan}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.logo-cyan-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    textColor: "{colors.cyan-ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.retry-red}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-danger-hover:
    backgroundColor: "{colors.retry-red-wash}"
  button-sm:
    padding: "0 12px"
    height: "32px"
  button-lg:
    padding: "0 20px"
    height: "44px"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.sheet}"
    padding: "20px"
  nav-item-active:
    backgroundColor: "{colors.cyan-wash}"
    textColor: "{colors.cyan-ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  status-pill-done:
    backgroundColor: "{colors.completed-violet-wash}"
    textColor: "{colors.completed-violet}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  status-pill-primary:
    backgroundColor: "{colors.cyan-wash}"
    textColor: "{colors.cyan-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  identity-tile:
    backgroundColor: "{colors.tile-indigo}"
    textColor: "{colors.tile-indigo-ink}"
    rounded: "{rounded.lg}"
    size: "44px"
  serial:
    textColor: "{colors.cyan-ink}"
    typography: "{typography.serial}"
---

# Design System: Anon Cyber Team

## Overview

**Creative North Star: "The Seamless Console"**

A dark learning console in the Anon Cyber Team logo's colours. Every panel sits flush on one blue-black ground and is separated from its neighbours by a hairline seam, not by a shadow or a gap of empty floating cards. The logo's cyan is a signal rather than a fill: it marks the primary action, the current or next item, links, progress, and focus, so the next room is always one cyan action away. Four status colours each carry one meaning (violet completed, green correct and scores, red retry/error/destructive, amber scheduled), and everything else is calm neutral ink.

The world is the category standard for cybersecurity learning platforms, executed at Hack The Box's level of craft (its seamless flush panels) without copying it and without its green. It is built for long evening reading and answering sessions on laptops and phones: density is moderate, contrast is comfortable, and motion only explains a change of state. Dark is the default; a light theme mirrors the same tokens on a cool white ground. One soft gradient exists, and it lives only on the navigation rail, the mobile drawer, and the auth brand column.

It refuses the hacker costume (neon, glow, terminal green, matrix rain) and the floating rounded-card SaaS dashboard. The previous "Security Paper" world (iris gradient, dot grid, circuit traces, segmented progress ring, rounded floating cards, Archivo) is retired; nothing from it may return.

**Key Characteristics:**
- One blue-black ground, flush panels, 1px hairline seams, no panel shadows.
- Logo cyan reserved for forward motion: primary action, current/next/active item, links, progress, focus.
- Four single-meaning status colours; a separate identity palette for room/path initials.
- One Red Hat family in three cuts: Display for headings, labels, figures and buttons; Text for reading; Mono for machine strings.
- Tight corners (6 to 10px); circles only for marks, stop markers, progress tracks, radios, the heatmap's empty-day dot, the lab's empty-target icon ring, the theme switch and scrollbar thumbs.
- Dark by default, light by choice, both from the same tokens.

### Antislop Record (Design Read, dials, written reasons)

**Design Read.** Reading this as: a self-paced cybersecurity learning app (mostly Operate surfaces, with room material as Read) for community members studying in long sessions on laptops and phones, in a seamless dark console language in the ACT logo colours. Dial: ENERGY 1 / RHYTHM 2 / MOTION 2.

- **ENERGY 1 (calm):** long reading and answering sessions need a quiet page; energy comes from the one cyan next step and the member's own progress, not from decoration.
- **RHYTHM 2 (consistent with a few breaks):** working pages share one panel grammar (title row, flush panels, hairline-ruled rows); the breaks are the dashboard's split Continue panel with its cyan seam, the figure strips, and the signed-out home hero.
- **MOTION 2 (state transitions only, no scroll reveal):** the drawer slides, the rail collapses when its edge toggle is pressed (never on a page change), a page settles in on arrival, a fresh check draws once, the loading line runs while the next page renders, the theme cross-fades. Under reduced motion all of it stops, the theme colour cross-fade included; only the 150ms colour transitions on controls, links and fields, the 1px button press, and two 150ms editor details (the image resize handles' fade-in and the colour swatches' ring change) remain.
- **Focal point:** one per screen. The Continue panel on the dashboard, the path's stop list on a path page, the material on a room page, the current question on a quiz.

**Written reasons for purpose-gated techniques:**
- **The one gradient:** a cyan-tinted navy to periwinkle-tinted navy wash from the logo's cube faces; it separates navigation from content on the rail, mobile drawer and auth brand column, and appears nowhere else (the heatmap's empty-day dot is drawn with a pseudo-element precisely to avoid a second gradient).
- **Red Hat (Display / Text / Mono):** one superfamily gives headings and figures a confident geometric voice, reading text a calm humanist body tuned for long material, and machine strings an unambiguous mono, without mixing unrelated faces.
- **Uppercase data labels:** small tracked Display caps name data fields, table columns, figure cells and rail group headings; never placed above a heading as an eyebrow or kicker.
- **Stroked inline SVG icons:** drawn for this app at one stroke weight (about 1.8) to sit with the hairline seams; every icon sits beside a text label or carries an accessible name.
- **Arrows:** directional only. A forward arrow marks the action that advances the member (Resume room, Start next room, Next chapter, Go to open tasks, Go to the quiz, Take the quiz, Next question). A back arrow returns to the parent (Back to room, Back to learning path, All chapters in the editor) or steps back one chapter or question (Previous). No other control carries one.
- **No shadows:** depth comes from tone (ground, panel, raised) and seams; only true floating layers (the mobile drawer, editor popovers and the collapsed rail's name tooltips) lift.
- **Figure strips vs. inline rows:** a ruled strip of identical figure cells appears where comparable numbers are the point (the dashboard's Streak / Rooms completed / Quizzes passed, and the quiz result); everywhere else facts are inline label/value rows or definition lists.
- **Activity heatmap:** answers "how regular is my study?"; active days rise through four steps of logo cyan because it measures effort, not a state, and days with no activity are a small control-edge dot so "none" and "some" differ by shape, not only by tint. Today carries a cyan-ink ring.
- **Palette size:** neutrals, one accent (logo cyan), four single-meaning status colours, and a two-tint identity palette that never carries meaning.

**Touch rules.** On coarse pointers every button, field and select is at least 44px tall, small and icon buttons at least 44px wide, and text links and compact targets get an invisible 44px hit area without changing their look. Field text is 16px on coarse pointers so iOS never zooms. Desktop with a mouse keeps its tighter 32/40px controls; the large entry-screen buttons are 44px everywhere.

**Accessibility guarantees.** Text meets WCAG AA in both themes; text-field edges (control edge) reach at least 3:1 against ground, panel and raised surfaces (non-text contrast). Every page has landmarks (banner, navigation with a unique label, main, contentinfo) and a unique document title ("Page · Anon Cyber Team"). Focus is a 2px cyan-ink outline offset 2px on every interactive element. It is drawn inward inside the editor and on full-width row links in clipped panels, so scroll containers and panel edges do not cut it off. Text fields instead turn their border cyan ink with a 2px cyan ring at 30%, and quiz answer options outline the whole row. Status never relies on colour alone: marks differ by shape (check, score figure, retry arrow, dashed "next" ring).

**Named exceptions.**
- **Instructor material colours in the dark theme:** colours chosen by instructors for a light page are re-inked with `invert(1) hue-rotate(180deg)` so the hue survives and contrast holds on dark panels (nested coloured elements are not inverted twice; highlighted text uses theme ink). The editor's colour swatches get the same treatment so the preview matches.
- **Code blocks darker than panels:** code in room material sits on its own near-black block (and a dark slate block in the light theme) so payloads read as a distinct machine surface in both themes.

**Owner decisions (6 Nov 2026).**
- Canon chosen: the category standard for cybersecurity learning, with Hack The Box as the craft reference (seamless flush panels), not green and not a copy.
- ACT logo colours are applied to type and borders and the primary action, not to large fills.
- At most one soft gradient, on the rail, mobile drawer and auth brand column only.
- Dark is the default theme; light is an option remembered per device and applied before first paint.
- The previous "Security Paper" world (iris gradient, dot grid, circuit traces, segmented progress ring, rounded floating cards, Archivo) is retired.

**Owner decisions (6 Nov 2026, chapter tasks revision).**
- Tasks sit under their chapter on the material page (optional per chapter; tasks without a chapter show under the last one). The Tasks tab is gone; the room tabs are Material / Quiz. Tasks unlock in order inside a chapter only.
- The room quiz is optional and can be removed; members keep their attempt history and points.
- The answer field shows a clue of the expected answer's shape: letters and digits become `*`, spaces and punctuation stay.
- The desktop rail keeps its collapsed state across pages without animating, is toggled by an edge button beside the logo, and names its icons in tooltips while collapsed. Colours follow the ACT tokens; the mobile drawer is unchanged.

## Colors

A blue-black, low-chroma console palette with one reserved logo cyan, four single-meaning status colours, and a small identity palette. Tokens live as `R G B` triplets on `:root` (dark, default) and `:root[data-theme="light"]` in `app/globals.css` and are exposed to Tailwind with alpha support; the frontmatter carries the dark values. The names in this document are descriptive; the CSS variables and Tailwind keys keep the older names: ground = `--paper` (`bg-paper`), panel = `--sheet`, raised = `--well`, seam / seam-soft / seam-strong = `--line` / `--line-soft` / `--line-strong`, control-edge = `--line-input`, logo-cyan / logo-cyan-hover = `--cyan` / `--cyan-hover`, cyan-wash = `--cyan-soft`, completed-violet / correct-green / retry-red / scheduled-amber = `--violet` / `--green` / `--red` / `--amber`, and each -wash is the matching `-soft`; ink, ink-2, ink-3, cyan-ink, on-cyan, prose-ink, code-ink, scrim and tile-* use the same names in code. Code block is not a token: it is hard-coded in `.prose-cyber pre` (`#060b10`; light `#17222b`).

### Primary
- **Logo Cyan** (logo-cyan): the cube-face cyan of the ACT logo. Fills the primary button, the progress bar, the route loading line, the four heatmap steps (25 / 45 / 70 / 100%), text selection tint and selected editor cells. On hover it becomes **Bright Cyan** (logo-cyan-hover): lighter (`#33D1F8`) in dark, deeper (`#00AEDE`) in light.
- **Cyan Ink** (cyan-ink): the text-safe form of the accent. In dark it equals logo cyan; in light it deepens to a teal-blue for contrast. Links, the active nav item's text and icon, focus outlines, the caret, focused field borders, the current/next item's border (Continue panel at 35%, dashed "next" ring), the member serial, the points figure in the top-bar pill, the member's first name in the dashboard greeting, and the "you" row on the leaderboard.
- **Cyan Wash** (cyan-wash): the active nav item, the member's own row on the leaderboard, the selected quiz option and the on-screen question chip, active editor toolbar buttons, the image drop zone while dragging, and the pressed light-mode icon button (the rail switch fills its track with cyan ink instead). The `primary` StatusPill tone and the `cyan` StateTag tone also use it, though no page renders them at present.
- **On Cyan** (on-cyan): the deep blue-ink text on a cyan fill, so the primary button reads as one cyan object rather than black on cyan.

### Secondary (status colours)
- **Completed Violet** (completed-violet / -wash): completed. The circled check of a passed room, "done" pills, task-list checkboxes in material.
- **Correct Green** (correct-green / -wash): correct and scores. A passed quiz's score figure, "Solved" tags, success pills; in staff views, live/published.
- **Retry Red** (retry-red / -wash): retry, closed, error, destructive. The circled retry arrow, "Closed" tags, danger buttons, error messages.
- **Scheduled Amber** (scheduled-amber / -wash): scheduled or time-bound ("Opens 24 Oct", "Closes ..."); in staff views, needs attention.

### Tertiary (identity tiles)
- **Tile Indigo** (tile-indigo with tile-indigo-ink) and **Tile Teal** (tile-teal with tile-teal-ink), plus the raised neutral: backgrounds of the initials tiles for rooms and paths without an uploaded logo and for the member avatar on Profile, chosen deterministically from the name. They never carry state.

### Neutral
- **Ground** (ground): the page behind everything, and the inside of text fields.
- **Panel** (panel): every content panel.
- **Raised** (raised): table headers, blockquotes, inline code, hover fills, neutral tags, disabled fields.
- **Seam** (seam), **Soft Seam** (seam-soft), **Strong Seam** (seam-strong): panel borders and row dividers; inline-code borders; secondary-button borders, dashed empty states, neutral tag edges, scrollbar thumbs.
- **Control Edge** (control-edge): text-field borders and the empty-day heatmap dot, at least 3:1 against every surface.
- **Ink / Ink 2 / Ink 3** (ink, ink-2, ink-3): headings and body; secondary text and descriptions; labels, placeholders, dates and inactive icons.
- **Prose Ink / Code Ink** (prose-ink, code-ink): room material text and inline code.
- **Code Block** (code-block): the near-black surface under fenced code in material (light theme: `#17222B`).
- **Scrim** (`--scrim`): the backdrop behind the mobile drawer, used at 35% opacity (dark `#000000`, light `#080C10`).
- **Rail Gradient** (`--rail`): dark `linear-gradient(180deg, #0d1e29 0%, #0b141c 55%, #11132a 100%)`; light `linear-gradient(180deg, #e3f3f9 0%, #f1f5f8 55%, #ecebf8 100%)`.

### Light Theme (optional, app-wide)
`:root[data-theme="light"]` re-values the same tokens: ground `#F4F7F9`, panel `#FFFFFF`, raised `#EDF2F5`, seams `#DCE4EA` / `#E8EEF2` / `#BECBD4`, control edge `#768C95`; ink `#0E1720` / `#3A4750` / `#5C6A72`; logo cyan and on-cyan unchanged, hover `#00AEDE`, wash `#E0F5FC`, cyan ink `#006C8A`; violet `#5A3DB0` on `#EDE9F9`, green `#267345` on `#E4F2E9`, red `#C43028` on `#FBE9E7`, amber `#8F5708` on `#FBF1DC`; tiles `#E7EAF8`/`#3B4B8A` and `#E1F1EF`/`#0F6A63`; prose `#1D2933`, code `#24313B`, scrim `#080C10`. It is set by the rail switch (desktop rail and mobile drawer), the icon button in the mobile app top bar, the icon button in the public top bar (home, 404, error), and on auth pages the top-bar icon on small screens or the switch row at the foot of the brand column on desktop. The toggle writes `localStorage` `act-theme` as `"light"` or `"dark"` and never removes the key; an inline script applies the light theme before first paint only when the stored value is `"light"`, so a missing key or any other value means dark.

### Named Rules
**The Forward Cyan Rule.** Logo cyan marks only what moves the member forward or where they are: the primary action, the current/next/active item, links, progress, and focus. One identity accent joins them by owner direction (logo colour on type): the member's first name in the dashboard greeting. It is a signal on type, borders and small fills, never a large decorative fill, never a glow.

**The One Meaning Rule.** Violet means completed, green means correct or a score, red means retry/error/destructive, amber means scheduled. No colour signals anything else, and no two colours share a meaning. Hints are not a state, so hint boxes stay neutral.

**The Identity Tile Rule.** Room, path and member-avatar initials tiles use only the identity palette (indigo, teal, raised neutral), so a tile can never be read as a state; state rides on a mark, tag or pill beside the name.

**The One Token, Two Themes Rule.** Light and dark come from re-valuing tokens on `:root`, never from hard-coded colours or per-component dark variants (the code block and instructor re-inking are the named exceptions).

## Typography

**Display Font:** Red Hat Display (with ui-sans-serif, system-ui)
**Body Font:** Red Hat Text (with ui-sans-serif, system-ui)
**Mono Font:** Red Hat Mono (with ui-monospace, SFMono-Regular, Menlo); data labels are set in Red Hat Display (see Label below).

**Character:** One superfamily in three cuts. Display is geometric and assured for everything that labels, counts or acts; Text is open and calm for long reading; Mono is reserved for strings a machine would print.

### Hierarchy
- **Display** (700, 2.375rem, 3rem from sm, 3.25rem from lg; line-height 1.05 below sm and 1 from sm, where `sm:text-5xl` brings Tailwind's line-height 1; -0.028em): the signed-out home hero only. The 404 and error pages use a smaller step of the same cut (700, 2.25rem, 2.75rem from sm, line-height 1.08, -0.024em).
- **Headline** (700, 1.75rem / 2rem from lg, leading-tight, -0.02em, balanced): the page title row in the shell and the auth title. The dashboard's Continue room title is 1.375rem.
- **Title** (700, 1.125rem, line-height 1.375, -0.01em): section headings (SectionHeader, standalone form panels, and the path page's Rooms in this path header). The two signed-out home panels use the same size and line-height without the tracking. Other headings in a ruled panel header row (title above a seam, e.g. Rankings, Tasks, Recent activity, Top members) are 1rem/700 with no tracking, whatever the column width.
- **Figure** (700, 1.75rem, line-height 1, -0.01em, tabular lining numerals): figure cells and fixed numbers; small figures (dates, minutes, ranks) use the same numeral settings at text size.
- **Body** (400, 0.9375rem, 1.55): interface text, descriptions, rows.
- **Reading** (400, 1.0625rem, 1.75): room material (`.prose-cyber`), identical in the editor and the student view; material headings 1.3 / 1.15 / 1.0625 / 1rem at 700 (h4 in ink 2), all below the 1.5rem chapter title so an instructor's Heading 1 never outranks it.
- **Label** (600, 0.6875rem, 0.08em tracking, uppercase, ink 3): data field names, table columns, figure-cell labels, rail group names. Status pills use the same cut at 0.06em.
- **Form label** (600, 0.875rem, sentence case, ink, Display): the label above every field, 6px above it. The uppercase Label cut is for data names only.
- **Button** (600, 0.875rem; small 0.8125rem; large usually 0.9375rem): every button, in Display.
- **Mono** (no added tracking, at the row's size and weight, usually 400 at 0.75 to 0.875rem): slugs, IPs, submitted answers and error references. The one tracked use is the answer clue under a task's answer field (0.9375rem, 0.22em tracking, ink 2, punctuation semibold ink) so its stars can be counted. Member serials use the serial cut (500, 0.75rem, 0.06em, uppercase, cyan ink). Code is 0.86em inline and 0.84rem in blocks.

### Named Rules
**The Three Cuts Rule.** Display labels, counts and acts (headings, labels, figures, buttons, titles in rows); Text reads; Mono is only for machine strings and code, never for headings or decoration.

**The No Eyebrow Rule.** Uppercase labels name data. They never sit above a heading as a kicker.

## Layout

The signed-in shell is a fixed left rail (256px, collapsible to 76px on desktop, with the one gradient) and a content column. A sticky 56px desktop top bar carries the breadcrumb (ink 3, current page in ink, slash separators in strong seam) and, on the right, a points/rank pill whose figure is cyan ink. The content column is capped at 1240px with 16 / 24 / 40px side padding (mobile / sm / lg) and 24px (32px lg) top padding; each page opens with a title row (headline plus an optional one-line ink-2 description, actions right-aligned) and a 28px gap to the first panel.

Below 1024px the rail becomes a drawer: a sticky mobile top bar (logo, name, theme icon, Menu) opens a gradient drawer at `min(18rem, 86vw)` over a scrim. The dashboard, the instructor and admin overviews, admin announcements, the path manager, the New room builder and the profile use a two-column grid at xl (fluid main plus a 340px side column; on the dashboard it holds Top members and Announcements) with 20px gaps; the path editor uses a 26rem side column at xl. The lab page opens the same 340px side column at lg, and the quiz uses a 300px side column at lg. The member room page is one column: a compact status strip under the title row, the section tabs (only when the room has a quiz), then the tab's content at full content width (the material's running text keeps the reading measure, see Room Material). From xl the room editor sets its section nav in a 12rem side column (24px gap) beside the section page; below xl the nav is a wrapping tab row above it, so at laptop widths with the rail open the chapter editor keeps close to the member's reading width. Inside the path page's overview panel, a 17rem facts column splits off from md. Panels pad 20px on phones and 24px from sm (form panels and room material from md); the default Card and narrow side-column panels stay at 20px. The auth layout puts a 288px (320px xl) gradient brand column beside a 27rem form column; the public shell is a simple 1152px header and footer frame.

Rows inside panels are ruled with seam dividers (10 to 12px vertical padding for compact rows, including the dashboard's stop list and its announcement rows; 14 to 16px for catalog rows, the path page's stop list, task rows and the announcements manager's rows; 20px for the open task under its chapter and quiz review items); lists of rooms, completions, members and announcements all use that same ruled-row grammar.

## Elevation & Depth

Flat by construction. Panels sit flush on the ground and are told apart by tone (ground darker than panel, raised lighter) and 1px seams; the default panel shadow token is deliberately empty. Only true floating layers lift: the mobile drawer, editor popovers and the collapsed rail's name tooltips carry one soft drop shadow over the content they cover.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 24px 48px -16px rgb(0 0 0 / 0.55)`): the mobile navigation drawer, the editor's floating popovers (colour, link, table menus) and the collapsed rail's name tooltips. Nothing else.

### Named Rules
**The Flush Panel Rule.** Panels never cast shadows, never float with gutters of empty ground around them as decoration, and never glow. If something must look elevated, it must actually float above other content.

## Shapes

Tight, consistent corners: 6px for status pills, state tags, small tiles and compact controls (editor toolbar buttons and selects, quiz question-navigator squares, the rail's edge toggle and its name tooltips); 8px for buttons, fields, nav items, member card, the top-bar points pill, medium tiles and inline notices (including the empty-material note); 10px for panels, large tiles and the EmptyState box. Material blockquotes and images round at about 10px, inline code at about 6px. Full circles are reserved for completion marks, numbered stop markers, progress tracks, radios, the heatmap's empty-day dot, the lab's empty-target icon ring, the theme switch and scrollbar thumbs. Every surface edge is a 1px border. Dashed borders are limited to: the "next" ring (cyan ink, 1.5px); empty states, the empty-material note and the empty lab target (strong seam); unanswered question chips in the quiz navigator (strong seam); the image upload drop zone (strong seam, cyan ink while a file is dragged over it); and the strong-seam top rule above the instructor add-task, add-question and add-room forms.

## Components

### Buttons
Compact and decisive, set in Display.
- **Shape:** gently squared (8px), 40px tall, 16px horizontal padding; small buttons 32px tall with 12px padding; large buttons 44px tall on every pointer, for the decisive actions of entry screens (home hero, dashboard Continue, auth submit, quiz result, 404/error recovery), usually with 0.9375rem text and 20 to 24px padding (the dashboard's View room/View path and the quiz-result actions keep 0.875rem).
- **Primary:** logo cyan fill with on-cyan text; hover shifts to logo-cyan-hover (lighter in dark, deeper in light). Used once per view for the forward action; may carry a forward arrow.
- **Secondary:** transparent with a strong-seam border and ink text; hover turns border and text cyan ink. Disabled stays neutral on hover.
- **Ghost:** no border, ink 2 text; hover fills raised and inks the text.
- **Danger:** transparent with a red border at 45% and red text; hover fills the red wash.
- **States:** colour transitions 150ms ease-out, a 1px press nudge on active, 55% opacity when disabled, 2px cyan-ink focus outline.

### Chips (status pills and state tags)
- **Status pill:** 6px corners, tinted wash with a 35% same-colour border, uppercase Display label text (11px, 0.06em). Tones: neutral, primary (cyan), success (green), warning (amber), danger (red), done (violet).
- **State tag:** the same shape in sentence case (12px, 600) with an optional 14px stroked check or lock icon, for inline states like "Opens 24 Oct", "Closed", "Solved", "Draft".

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** panel on ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px seam; the dashboard's Continue panel swaps in a cyan-ink seam at 35% because it holds the current item.
- **Internal Padding:** 20px, rising to 24px from sm (md for forms and material); side-column panels stay at 20px. Split panels divide their halves with a seam.
- **Empty state:** dashed strong-seam border on a translucent ground, centred title, one-line reason and the next action.

### Inputs / Fields
- **Style:** ground fill inside a panel, 1px control-edge border, 8px corners, 8px 12px padding, body text (16px on coarse pointers).
- **Focus:** border turns cyan ink with a 2px cyan ring at 30%; caret is cyan ink.
- **Hover / Disabled:** hover lifts the border to ink 3; disabled fills raised with ink 3 text.
- **Radios and checkboxes:** Quiz answer radios are drawn 18px circles with a control-edge border that thicken into a cyan-ink ring when checked. Checkboxes in instructor and admin forms are native 16px controls with a cyan-ink accent (task-list checkboxes in room material keep the violet accent), wrapped by their Display label, which is at least 44px tall on coarse pointers. The quiz editor's 'correct answer' radio is a native 16px radio with a green accent, because it marks the correct option.

### Navigation
- **Rail:** logo and name at top, member links, then labelled role groups (Teaching, Admin) with uppercase group labels; the theme switch at the foot above the member card (name, role label, cyan mono serial), with Sign out below it.
- **Items:** 36px rows on the desktop rail, 40px in the mobile drawer, 44px on coarse pointers. 8px corners, an 18px stroked icon in ink 3 and the label in ink 2; hover fills raised at 70%. The active item takes the cyan wash, cyan-ink text and icon, and a 1px inset cyan-ink hairline at 30%.
- **Edge toggle:** a 26px square button with 6px corners straddles the rail's right border, centred on the logo row, in both states: panel fill, strong-seam border, a stroked double chevron in ink 2 that points left when open and right when collapsed, turning cyan ink (border at 60%) on hover and focus. It follows the logo in tab order, carries `aria-label` "Collapse sidebar" / "Expand sidebar", `aria-expanded` and `aria-controls`, and gets an invisible 44px hit area on coarse pointers. There is no Collapse row in the rail any more.
- **Collapse:** pressing the toggle narrows the rail to 76px icons over 300ms (chevron turns, labels and member card fade); collapsed items carry full accessible names. The state is a cookie (`act-rail-collapsed`), read on the server, so every page renders the rail in its final width with no transition; motion runs only on a toggle and stops under reduced motion.
- **Collapsed tooltips:** while collapsed, hovering (mouse or pen, never touch) or keyboard-focusing a rail icon (nav items, theme switch, Sign out, the Expand toggle) shows its name 14px to the right of the rail edge, vertically centred on the item: a floating 6px label on panel with a strong-seam border and lift, 13px Display semibold ink (Teaching and Admin items read "Group / Name" with the group in ink 3, like the breadcrumb). It is `aria-hidden` (the item keeps its accessible name), fades in over 110ms (instant under reduced motion and between neighbouring items), and closes on Escape, scroll, resize, blur, page change and toggle. Expanded items have none.
- **Mobile:** sticky top bar with backdrop blur, theme icon button and Menu; the rail content slides in as a drawer (300ms, `cubic-bezier(0.16, 1, 0.3, 1)`) with lift.
- **Room section tabs:** Material / Quiz link the room's two pages (`/rooms/[slug]`, `/quiz`), in Display 14px semibold ink 2 on a seam baseline; a room without a quiz shows no tab bar at all, since one tab offers no choice. Tasks have no tab: they sit under their chapter in the material (see Room Material), and the old `/rooms/[slug]/tasks` address redirects to the chapter with the first open task (the last chapter with tasks once all are solved). The open page's tab takes a 2px cyan-ink underline, cyan-ink text and `aria-current="page"`. From lg the bar sticks under the desktop top bar. Above the tabs, the room status strip is one flush panel: progress bar with Tasks and Quiz facts (each left out when the room has none; while tasks remain, "x of y solved" links to the chapter with the first open task), then a seam and inline label/value facts (path, points, time, difficulty, schedule tag) with a small secondary Lab button at the end. The visible labels and the points' quiz-bonus note show from xl only; below xl the facts are values separated by middle dots (path · points · time · difficulty, labels kept for screen readers), so the row stays on one line at laptop widths. Below sm it shrinks further to one small ink-3 text line without the path logo, with the Lab button reduced to "Lab", so the strip stays short above the material; the path link keeps an invisible 44px hit area and Lab stays 44px on coarse pointers.
- **Room editor sections:** Details / Schedule & publishing / Material / Tasks / Quiz, each its own page. Details holds the title, URL, path, level, points and logo; Schedule & publishing holds the status facts, the Schedule form (open and close times) and Publishing (content checklist and the Publish/Unpublish button). From xl a vertical list in the side column that sticks under the desktop top bar, with the room's publish and schedule marks below a seam; below xl a wrapping row above the content on a seam baseline. Items follow the rail item grammar (36px rows, 44px on coarse pointers, 8px corners, ink 2; the open section takes the cyan wash, cyan-ink text, the inset hairline and `aria-current="page"`, and Material stays current on its chapter pages); counts sit right-aligned in small ink-3 figures, and Quiz shows no count when the room has no quiz (0 when its quiz has no questions).
  - **Content checklist** (Schedule & publishing): three mark shapes, not only colours: a green check for ready, an amber dashed ring for what needs attention before members can finish (no material, no tasks, or a quiz with no questions), and a neutral ink-3 dash for an optional part that is absent ("Quiz Optional, none"). The Room manager's Quiz column follows the same rule: "None" in ink 3 without a quiz, amber only for a quiz with no questions.
  - **Tasks page:** tasks are grouped under a heading per chapter ("Chapter 2 · Title" with its task count; chapters without tasks are left out), numbered and moved up/down within their chapter. Every task form has a Chapter select (chapters in order, then "No chapter (shows under the last chapter)"; hidden when the room has no chapters); new tasks default to the last chapter. Deleting a task removes its row, so "Task deleted, along with its answer history." appears in an always-mounted status region above the list and focus moves to the nearest task heading (next, then previous in the same chapter, then the neighbouring chapter's), or to the "Tasks (n)" heading when none is left; a failed delete keeps its message in the row. Quiz questions delete the same way, falling back to the "Add a question" heading.
  - **Material pages:** each chapter row shows "N tasks" when it has any, and the chapter editor lists that chapter's tasks read-only (title, points, an amber "No answer yet" note) with a Manage tasks link to the chapter's group on the Tasks page.
  - **Quiz page:** the quiz is optional. A small danger "Remove quiz" button sits on the Quiz settings heading row; its confirm names what is deleted (the questions) and what stays (members' attempts and points). After removal the form becomes "Create a quiz", focus moves to that heading, and the success message is announced from an always-mounted status region above it. A room with no tasks keeps its quiz: the button is disabled with a help line under the heading row ("The quiz can't be removed while the room has no tasks…"), and the server refuses the removal too. Creating a quiz recalculates members' room progress, so members who had completed the room are back in progress until they pass it. Quiz points are paid once per member per room: passing a replacement quiz pays nothing to members who passed a removed one.

### Completion Marks (signature)
Direct and calm: a passed room is a violet-wash circle with a violet check: 28px in completion lists, the room page, the quiz result's 'Room passed' row and the dashboard stop list (the CompletionMark check draws once when fresh), 32px on the path page's stop list, and 24px beside 'Passed'/'Complete' in the rooms and paths catalogs; a passed quiz is its score figure in green; a quiz to retry is a red-wash circle with a retry arrow (in the quiz result both use the large size: the retry circle is 44px and the passed score figure is set at xl, 1.25rem, with no circle); the next room is a dashed cyan-ink ring. Completion lists set the mark in a 48px column, title in Display, a one-line description in ink 3 and a right-aligned date. Numbered stop markers (28px, 32px on the path page) share the circle: a passed room keeps the violet-wash check; a solved task is a green-wash circle with a check; the current task or next room is a dashed cyan-ink ring with its number; locked tasks and rooms not yet reached are strong-seam rings with the number in ink 3, as are all markers in lists that show no state (the lab page's task preview, the home page steps and the instructor path editor). Quiz review numbers are green-wash (correct) or red-wash (wrong).

### Identity Tile
Initials of a room or path, or in person mode the member's initials as the Profile avatar, in Display bold on an identity tint with a strong-seam border. Sizes are 36 / 44 / 56 / 96px at 6 / 8 / 10 / 10px corners (the instructor overview shows the small tile at 40px; the Profile avatar is 56px, 96px from sm). An uploaded logo replaces the initials in the same frame, and the initials return if it fails to load.

### Progress Bar
A 6px full-round track in seam with a cyan fill by default (violet, ink or green tones for completed or status contexts), animated width over 500ms.

### Figure Strip
Identical cells divided by 1px seams inside one panel: uppercase label, tabular figure with optional unit in ink 2, a small ink-3 note.

### Activity Heatmap
Week columns (Monday on top) of 3px-rounded day cells, sized by a `--cell` variable in two scales (md on Profile, where the Activity panel sits in an auto-width column beside Recent completions; lg when the heatmap is the Progress panel's focus). No activity is a small control-edge dot; active days are cyan at 25 / 45 / 70 / 100% (1, 2, 3–4 and 5+ activities). Today is ringed in cyan ink, and when today is empty it shows the ring only, with no dot. Mon/Wed/Fri row labels, month labels, a caption summary and a Less-to-More legend are in ink 3, plus an sr-only list of active days. On phones (below 640px) only the most recent 17 weeks show, and the caption counts only those weeks.

### Room Material
`.prose-cyber`: Reading type in prose ink, cyan-ink underlined links, raised blockquotes and table headers, inline code on raised with a soft seam, code blocks on the code-block surface, images with seam borders. The editor writes into the same styles at the same measure. Running text (paragraphs, lists, headings, blockquotes, rules) is capped at `--prose-measure` (43.5rem, about 90 characters per line); tables, code blocks and images use the full panel width, and centred or right-aligned paragraphs and headings align to the panel.

Material is split into chapters and read one chapter per page (`?chapter=N`, document title "Chapter title · Room title" when the room has more than one chapter). With more than one chapter, an "All chapters" disclosure heads the panel ("Chapter N of M", a numbered list in two columns from md, the open chapter in cyan ink with `aria-current="page"`); each list row ends with the chapter's solved/total tasks in small ink-3 figures, turning green with a check once all are solved. Then come the chapter title (h2, 1.5rem), the chapter, the chapter's Tasks section, and a seam row with Previous chapter (secondary) and Next chapter. After the last chapter, Next chapter becomes Go to the quiz (a quiz not yet passed), else Go to open tasks (open tasks in an earlier chapter), else a secondary Back to learning path. A chapter title that only repeats the room title (such as a migrated first chapter) stays a heading for screen readers but is not printed a second time; seeded intro chapters are titled "Introduction".

**Tasks under chapters.** Tasks are optional per chapter; a task with no chapter (or whose chapter was deleted) shows under the last chapter, and a room with tasks but no chapters shows a "no material yet" note followed by its tasks. The section sits between the chapter text and the Previous/Next row, below a seam: a ruled header row ("Tasks", h3 under the chapter title, with "x of y solved" from two tasks up), then ruled task rows numbered from 01 within the chapter. Tasks open in order inside one chapter only (the next opens when the one before it is solved; other chapters are never blocked). The open task shows its instructions, answer format, answer field and clue; solved tasks keep the green check and "Solved" tag; locked ones show a lock tag and "Opens when you solve the task before it." When the room's last task is solved and its quiz is next, a "Take the quiz" row closes the section. One primary per view: while the chapter has an open task, Submit answer is the cyan action and Next chapter / Go to the quiz drop to secondary; otherwise the forward button is primary.

**Answer clue.** Under the open task's answer field a quiet line reads "Answer:" followed by the expected answer's shape in tracked mono ink 2: every letter or digit is `*`, spaces and punctuation stay ("false positive" → `***** ********`, "ACT{flag_1}" → `***{****_*}`). Star runs sit 0.2em lower (the mono star rides at cap height, which made a hyphen read as an underscore) and punctuation is semibold ink, so `-`, `_`, `.` and braces read apart. It is computed on the server from the task's primary expected answer (`answerPattern`), so the answers never reach the browser. The star line is `aria-hidden`; screen readers hear a sentence instead ("Answer pattern: 2 words, 5 and 8 characters"), and the field's `aria-describedby` points at that sentence only. A task without an expected answer shows no clue. The answer-format hint stays below it. Clue and hint sit in the field's column, so on phones (where Submit answer drops below the field, full width) both stay between the field and the button.

### Route Progress
A 3px logo-cyan line fixed to the top edge that creeps toward 85% while the next page loads and completes on arrival; it jumps instantly under reduced motion.

### Notices
Page notices are flush 10px panels with a 20px stroked circle icon and an optional Display title. Info is neutral (raised fill, strong seam, ink-2 icon), because cyan is reserved for forward motion. Warning, error and success use their status wash at 55% with a 35% same-colour border, and the icon carries the full colour. Form action messages are 8px boxes with a green (success) or red (error) wash, a 30% border, ink text and a coloured check or exclamation icon.

## Do's and Don'ts

### Do:
- **Do** put panels flush on the ground with 1px seams and 10px corners; separate content with ruled rows, not nested floating cards.
- **Do** keep logo cyan for the primary action, the current/next/active item, links, progress and focus (The Forward Cyan Rule).
- **Do** give every status exactly one colour: violet completed, green correct/score, red retry/error/destructive, amber scheduled.
- **Do** use identity tiles (indigo, teal, neutral) for room and path initials.
- **Do** set headings, labels, figures and buttons in Red Hat Display, reading in Red Hat Text, and serials, slugs, error references and code in Red Hat Mono.
- **Do** build both themes from the same tokens; test every new surface in dark and light.
- **Do** keep 44px targets and 16px field text on coarse pointers and a visible 2px cyan-ink focus outline.
- **Do** limit motion to state changes: 150 to 320ms for transitions, with `cubic-bezier(0.16, 1, 0.3, 1)` for arrivals. The only longer ones are the progress-bar fill (500ms), the one-time check draw (460ms after a 120ms delay) and the route loading line's slow creep; the only shorter one is the rail tooltip's 110ms fade-in. Honour reduced motion.

### Don't:
- **Don't** add a second gradient; the rail gradient lives only on the rail, mobile drawer and auth brand column.
- **Don't** put shadows on panels; lift belongs only to the drawer, editor popovers and the collapsed rail's tooltips.
- **Don't** use neon, glow, terminal green, matrix effects or a hacker costume.
- **Don't** bring back anything from the retired Security Paper world: iris gradient, dot grid, circuit traces, segmented progress ring, rounded floating cards, Archivo.
- **Don't** fill large areas with cyan or use a status colour for anything but its one meaning.
- **Don't** place uppercase labels above headings as eyebrows or kickers.
- **Don't** use emoji or glyph characters as icons; draw stroked inline SVG beside a label.
- **Don't** put arrows on buttons that do not move the member forward or back.
- **Don't** round past 10px on rectangular surfaces.
