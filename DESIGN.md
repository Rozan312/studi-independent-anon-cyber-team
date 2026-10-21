---
name: Anon Cyber Team
description: Self-paced cybersecurity learning, recorded plainly on security paper in crisp ink.
colors:
  paper: "#F3F7F8"
  sheet: "#FCFDFD"
  well: "#ECF3F5"
  line: "#CCDCE1"
  line-soft: "#DFE8EB"
  line-strong: "#96AFB8"
  ink: "#10161F"
  ink-2: "#3A4750"
  ink-3: "#5C6A72"
  cyan: "#00C2F5"
  cyan-hover: "#00AEDE"
  cyan-soft: "#DEF4FB"
  cyan-ink: "#006C8A"
  violet: "#5A3DB0"
  violet-soft: "#EDE9F9"
  green: "#267345"
  green-soft: "#E4F2E9"
  red: "#C43028"
  red-soft: "#FBE9E7"
  amber: "#8F5708"
  amber-soft: "#FBF1DC"
  tile-indigo: "#E7EAF8"
  tile-indigo-ink: "#3B4B8A"
  tile-teal: "#E1F1EF"
  tile-teal-ink: "#0F6A63"
  code-surface: "#17222B"
  code-text: "#E4EDF1"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.018em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\", \"lnum\""
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"kern\", \"liga\""
  reading:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1rem
    letterSpacing: "0.12em"
    fontVariation: "\"wdth\" 72"
  serial:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.12em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 80"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.84rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  md: "0.375rem"
  lg: "0.5rem"
  sheet: "0.75rem"
  full: "9999px"
spacing:
  card: "20px"
  panel: "24px"
  grid-gap: "20px"
  gutter-mobile: "16px"
  gutter-desktop: "40px"
  container: "1240px"
components:
  button-primary:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.cyan-hover}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.well}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.red}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  button-danger-hover:
    backgroundColor: "{colors.red-soft}"
  button-sm:
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.card}"
  status-pill:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  nav-item:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
  state-tag:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  completion-mark:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.full}"
    size: "40px"
  entity-logo:
    backgroundColor: "{colors.cyan-soft}"
    textColor: "{colors.cyan-ink}"
    rounded: "{rounded.lg}"
    size: "44px"
  progress-bar:
    backgroundColor: "{colors.line-soft}"
    rounded: "{rounded.full}"
    height: "6px"
---

# Design System: Anon Cyber Team

## Overview

**Creative North Star: "The Security-Paper Record"**

Every member's learning is a calm, official record on security paper. The ground is cool security paper, content sits on whiter sheets ruled with hairlines, text is crisp intaglio ink, and the app rail is iris-printed (pale cyan fading to pale periwinkle) with a dotted perforation edge. Progress is stated plainly: a passed room gets a violet check, a passed quiz shows its score in green, a quiz to retry shows a red retry icon. A check that was just earned draws itself in once; nothing else celebrates.

The system is calm and dense rather than decorative. Ornament is confined to the security-printing vocabulary, and the ornament that remains carries information: a guilloche rosette, generated deterministically from a learning path's slug, is the progress ring of the active path, and guilloche bands edge the hero and the Continue sheet. Rooms and paths are identified by an uploaded logo or, by default, a tinted tile with the initials of their name. Status colours carry state. Counters sit in ruled, fixed cells with tabular figures so numbers never shift. The one bright colour, the logo's cyan with an ink outline, marks the member's next step and nothing else.

The world rejects both category defaults, the near-black console with neon accents and glowing cards and the white SaaS LMS with blue buttons and thumbnail tiles, and it rejects decorative badges and rubber stamps. Instructors and admins work in the same paper-and-ink system, with denser ruled tables.

**Key Characteristics:**
- Light, cool paper ground; whiter sheets; hairline rules; whisper-level shadows.
- One reserved accent (logo cyan, ink outlined) for the next step and primary action.
- Status colours (violet, green, red, amber) carry state only.
- Completion is a direct mark: a check, a score, or a retry icon.
- Rooms and paths wear their logo or an initials tile; guilloche is reserved for the path progress ring and edge bands.
- Archivo throughout, with its width axis used for condensed field labels and status pills; JetBrains Mono only for code.
- Nothing vanishes: closed, scheduled, and draft items stay visible and carry a flat state tag.

## Colors

A cool, low-chroma paper-and-ink palette with one reserved logo cyan and four status colours. Tokens are stored as `R G B` channel triplets on `:root` in `app/globals.css` and exposed to Tailwind with alpha support; the hex values in the frontmatter are the same colours.

### Primary
- **Logo Cyan** (cyan): the fill of the logo's cube faces. Used as the face of the primary button (always with a 1.5px ink outline, like the logo), the active progress tone where cyan is chosen, text selection tint, and selected editor cells. Hover deepens to **Pressed Cyan** (cyan-hover).
- **Deep Cyan Ink** (cyan-ink): the text-safe form of the accent. Links, the active nav icon, focus outlines, input caret, and the focused input border. Never used as a large fill.
- **Cyan Wash** (cyan-soft): background of the "primary" status pill and next-task callouts.

### Secondary (status colours)
- **Completion Violet** (violet / violet-soft): completed. The filled circle behind a passed room's check, the default progress bar, the "done" pill, task-list checkboxes in material.
- **Approval Green** (green / green-soft): correct. A passed quiz's score figure, the "Solved" state tag, success pills.
- **Serial Red** (red / red-soft): retry, closed, error, destructive. The retry mark (red icon on red wash), the "Closed" state tag, danger buttons, and the red serial number on the member card.
- **Schedule Amber** (amber / amber-soft): scheduled or time-bound. "Opens 24 Oct" and "Closes ..." state tags, warning pills.

### Neutral
- **Security Paper** (paper): page ground behind everything.
- **Sheet White** (sheet): every content surface, button faces for secondary actions, inputs, and the check inside a completion mark.
- **Well** (well): recessed areas: table headers, blockquotes, inline code, hover fills, neutral state tags.
- **Hairline** (line), **Soft Hairline** (line-soft), **Strong Rule** (line-strong): sheet borders and dividers; progress tracks, inner rules, and completion-list row rules; input and secondary-button borders, dashed empty-slot borders, scrollbar thumbs.
- **Intaglio Ink** (ink): headings, body text, the primary-button outline.
- **Slate Ink** (ink-2): secondary text, descriptions, ghost-button text.
- **Faded Ink** (ink-3): field labels, placeholders, helper text, completion-list detail lines, inactive nav icons.
- **Iris Rail** (`linear-gradient(180deg, #d9eff6 0%, #e3ecf8 55%, #ebe8f6 100%)`, the `--iris` custom property): the only gradient in the system, used solely as the background of the navigation rail, the signed-out hero, and the auth panel.
- **Code Night** (code-surface / code-text): the one dark surface, reserved for code blocks in room material.

### Named Rules
**The Next-Step Cyan Rule.** Logo cyan fills only the member's next step and the primary action of a view, and it always wears the ink outline. Links use deep cyan ink, never the bright fill colour as text.

**The Status Colour Rule.** Violet means completed, green means correct, red means retry, closed, or error, amber means scheduled. Do not use a status colour to signal anything else, and do not let two colours share a meaning.

**The Identity Tile Rule.** Rooms and paths are told apart by their uploaded logo or, by default, an initials tile whose tint is chosen deterministically from the name among a dedicated identity palette: cyan soft, tile indigo (#E7EAF8 with #3B4B8A initials), tile teal (#E1F1EF with #0F6A63 initials), and the neutral well. Status colours are never used for tiles, so a tile can never be read as a state; state always rides on a mark, tag, or pill beside the name.

**The Artwork Ink Rule.** Path rosettes and guilloche bands draw from their own seeded ink set (`#0088B4`, `#5A3DB0`, `#267345`, `#B23A48`, `#8F5708`, `#2F5FA8`, `#0F7C7C`), never from the status tokens.

## Typography

**Display Font:** Archivo (variable weight and width), with ui-sans-serif, system-ui fallback
**Body Font:** Archivo
**Label/Mono Font:** Archivo condensed through `font-stretch` for labels, pills, and serials; JetBrains Mono for code only

**Character:** One grotesque used across its width axis gives the printed-form feel: normal width for reading and headings, condensed uppercase for printed field labels, status pills, and serial numbers.

### Hierarchy
- **Display** (700, 2.25rem rising to 3rem at the sm breakpoint, line-height 1.08, -0.025em): the signed-out home hero only.
- **Headline** (700, 1.75rem rising to 2rem at lg, leading-tight, -0.018em, balanced wrap): one page title per screen in the shell header and auth frame. No eyebrow above it.
- **Title** (700, 1.125rem, snug, -0.01em): section headers on sheets, optionally with a 0.875rem slate description below.
- **Figure** (700, 1.75rem, line-height 1, tabular and lining numerals, -0.01em): counters in ruled cells; units ride beside them at 0.875rem semibold slate. A 1.125rem variant holds word values such as difficulty. The same figure style sets a passed quiz's score mark (1.125rem in lists, 1.75rem on the quiz result) in green.
- **Body** (400, 0.9375rem, 1.55): interface text. Secondary text at 0.875rem in slate ink.
- **Reading** (400, 1.0625rem, 1.75, text colour `#1d2933`): room material in the shared material typography, identical in the editor and student view. Headings inside material step 1.75 / 1.4 / 1.15 / 1.0625rem at 700.
- **Label** (600, 0.6875rem, 0.12em tracking, uppercase, width 72%, faded ink): field labels sitting directly above a data value.
- **Serial** (600, 0.75rem, 0.12em, uppercase, width 80%, tabular, serial red): member ID numbers on the member card and profile.
- **Code** (JetBrains Mono, 0.86em inline, 0.84rem in blocks at 1.65).

### Named Rules
**The Labels-Are-Data Rule.** Condensed caps label a value, a field, or a state. They never sit above a heading as an eyebrow or kicker.

**The Fixed Cell Rule.** Every counter (points, streak, rank, scores, percentages) is set in tabular figures so values never shift width when they change.

## Layout

The signed-in app is a fixed left rail plus a centred content column. The rail is 256px wide (collapsible to 76px, preference stored locally) and the main column caps at 1240px with gutters of 16px on phones, 24px at sm, and 40px at lg, and top padding of 24px (36px at lg). Each page opens with a title row (headline plus optional slate subtitle, with actions aligned to the bottom edge on wider screens), then 28px of space before content.

Screens compose sheets on a grid with a 20px gap. The dashboard and room pages use a main column plus a 340px side column at lg (`minmax(0,1fr) 340px`); room material takes 8 of 12 columns, and the editor's writing width is matched to it. Figures sit in a ruled 2x2 cell block inside a sheet. Completion lists flow as rows in 1 column on phones, 2 at sm, and 3 at xl (24px column gap), each row ruled below by a soft hairline. Lists of rooms and paths lead each row with the entity logo.

Below lg, the rail becomes a sticky paper top bar (logo, name, and a small secondary "Menu" button) that opens the same iris rail as a modal drawer (`min(18rem, 86vw)`, focus-trapped, Escape closes). Sheet padding is 20px, rising to 24px for form panels at md.

## Elevation & Depth

Depth is paper, not light. Surfaces are separated by tone (paper, sheet, well) and hairline borders; shadows are barely there and exist only to say "this is a sheet lying on paper". The one lifted object is the mobile navigation drawer.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px rgb(16 22 31 / 0.05), 0 1px 1px rgb(16 22 31 / 0.03)`): every sheet, and the active nav item.
- **Lift** (`box-shadow: 0 10px 30px -12px rgb(16 22 31 / 0.22), 0 2px 6px rgb(16 22 31 / 0.06)`): floating layers only (the mobile drawer).
- **Input inset** (`box-shadow: inset 0 1px 1px rgb(16 22 31 / 0.04)`): text fields, to read as pressed into the sheet.

### Named Rules
**The Paper Depth Rule.** A sheet is a hairline border plus the sheet shadow. No glows, no coloured shadows, no hard offset shadows; lift is reserved for things that float above the page.

## Shapes

Gently rounded, document-like rectangles, all upright. Sheets use a 0.75rem corner; buttons, inputs, and nav items use 0.5rem; status pills and state tags use 0.375rem; progress bars and completion marks are fully round. Entity logo tiles scale their corner with their size (0.375rem at 36px, 0.5rem at 44px, 0.75rem at 64px, 1rem at 96px). Borders are 1px hairlines, except the primary button's 1.5px ink outline. Dashed borders mean "a slot that is still empty": the "Up next" mark, empty states, unchosen quiz options, the lab placeholder, and next-task callouts. The navigation rail's right edge carries a dotted perforation line. Nothing is rotated.

## Components

### Buttons
Printed and plain: one bright face for the next step, paper for everything else.
- **Shape:** gently rounded (0.5rem), minimum height 40px, 16px horizontal padding, 0.875rem semibold label, optional 8px-gap inline SVG icon.
- **Primary:** logo cyan face, ink text, 1.5px ink outline. Hover deepens to pressed cyan.
- **Secondary:** sheet face, strong-rule border, ink text. Hover moves the border to faded ink and the face to well.
- **Ghost:** no face or border, slate text, 12px padding. Hover fills well and darkens text to ink.
- **Danger:** sheet face, red text, red border at 40% opacity. Hover strengthens the border and fills red wash.
- **Small:** 32px minimum height, 12px padding, 0.8125rem text.
- **States:** colour transitions at 150ms ease-out; a 1px downward press on active; disabled at 55% opacity with a not-allowed cursor; the global 2px deep-cyan focus outline with a 2px offset.

### Chips (status pills and state tags)
- **Status pill:** 0.375rem corners, 1px border at 25% of the tone, soft wash fill, tone text, 0.6875rem semibold uppercase at 0.08em tracking and 78% width, never wrapping. Tones are neutral, primary (cyan), success (green), warning (amber), danger (red), and done (violet).
- **State tag:** a flat, upright inline tag for states that must stay visible ("Opens 24 Oct", "Closes ...", "Closed", "Draft", "Solved", "Locked"): 0.375rem corners, 1px border at 25% of the tone, soft wash fill, 0.75rem semibold sentence case, never wrapping, with an optional 14px stroked check or lock icon. Tones follow the Status Colour Rule (amber scheduled, red closed, green solved, violet completed), with a neutral well tone for draft, locked, and placeholder states.

### Cards / Containers
- **Corner Style:** 0.75rem.
- **Background:** sheet white on paper ground.
- **Shadow Strategy:** sheet shadow (see Elevation & Depth).
- **Border:** 1px hairline. Internal dividers are hairlines; ruled figure blocks divide cells with 1px rules.
- **Internal Padding:** 20px (24px on form panels at md; up to 28px on the dashboard's Continue sheet at sm).
- **Empty state:** a dashed strong-rule box on translucent paper, centred title, short reason, and a next-step action.

### Inputs / Fields
- **Style:** sheet fill, 1px strong-rule border at 80%, 0.5rem corners, 8px by 12px padding, 0.9375rem ink text, faded-ink placeholder, inset whisper shadow. The label above is 0.875rem semibold ink; helper text below is 0.75rem faded ink.
- **Focus:** the border turns deep cyan ink with a 2px logo-cyan ring at 35%.
- **Hover / Disabled:** hover darkens the border to faded ink; disabled fills well with faded-ink text.
- **Image upload:** room and path configuration carry a "Logo" field (optional square image) beside "Cover image".

### Navigation
- **Rail:** the iris gradient behind the logo and wordmark (0.9375rem bold), the member links, then role groups (Teaching, Admin) under condensed field labels, a collapse control, the member card (name, role label, red serial ID), and sign out.
- **Items:** 0.9375rem slate text with an 18px stroked SVG icon (1.7 stroke) in faded ink; 36px tall at lg, 40px on touch. Hover lays translucent sheet behind the item. **Active** is a sheet tab: sheet fill, sheet shadow, 1px hairline ring, semibold ink text, deep-cyan icon.
- **Mobile:** sticky paper top bar with backdrop blur; "Menu" opens the rail as a drawer over a 30% ink scrim.

### Completion Mark and Completion List (signature)
- **Completion mark:** one direct mark per outcome, 40px (56px on the quiz result). A passed room is a violet filled circle with a sheet-white stroked check (2.6 stroke). A passed quiz is its score as a green tabular figure ("85%"), with no container. A quiz to retry is a red stroked retry icon on a red-wash circle. The next room is an empty circle with a 2px dashed strong-rule border.
- **Check draw:** only for a completion that has just happened, the check's stroke draws in once (460ms on `cubic-bezier(0.16, 1, 0.3, 1)` after a 120ms delay). Under reduced motion the check appears already drawn.
- **Completion list:** newest first; each row is the mark centred in a 48px column, then the room title (semibold ink) and a 0.875rem faded-ink detail line ("Room passed · 3 Oct 2026", "Quiz passed · date", "Quiz scored 40% · try again · date"), optionally closed by an "Up next" row in slate. It appears as "Completed" on the dashboard and progress page, "Recently completed" on the profile, and as a labelled example on the signed-out home. The room page shows a single mark in its "Room passed" callout.

### Entity Logo
A square identity tile beside every room and path name: the uploaded logo (object-cover, hairline border, sheet backing) or, by default, the bold initials of the name (first letters of the first two non-stopword words, or the first two letters of a single word) on an identity-palette fill with a 20%-tone border. Sizes 36, 44, 64, and 96px. Always decorative (hidden from assistive technology) because the full name sits beside it. It leads rows in the dashboard, catalogs, room lists, path itineraries, room headers, the progress grid, and instructor managers, and stands in for a missing profile avatar.

### Path Progress Rosette
A generative guilloche ring built from three rotated sine-wave rings (outer, inner, core), seeded by FNV-1a from the path slug, so each path always draws the same ring in the same ink. The completed sweep is drawn at full ink and heavier stroke while the remainder stays at 45% opacity: the art is the progress ring. It appears at about 200px on the dashboard's Continue sheet and 184px in the path detail header, and as unprogressed decorative artwork on the signed-out hero and auth panel. Strokes are non-scaling hairlines. Entry plays the `rosette-in` draw (rotate from -24 degrees and scale from 0.92 over 900ms, `cubic-bezier(0.16, 1, 0.3, 1)`), off under reduced motion.

### Guilloche Band
A 20px band of seven phase-shifted sine lines in the seed's rosette ink at 55% opacity (45% on the hero), 0.75px stroke. It heads the dashboard's Continue sheet and edges the signed-out hero. Always decorative and hidden from assistive technology.

### Figure Cells
A condensed field label, then a 1.75rem tabular figure with an optional slate unit, then an optional 0.75rem note. They are grouped as ruled 2x2 blocks inside a sheet; the dashboard block reads Points, Streak, Rooms completed, Rank.

### Progress Bar
A 6px fully rounded soft-hairline track with a fill in violet by default (cyan, ink, or green available), animating width over 500ms ease-out. Always exposes progressbar semantics.

### Room Material
Instructor-authored HTML is set in the reading style on sheet white, with deep-cyan underlined links, well-tinted blockquotes and inline code, hairline-ruled tables with well headers, and code blocks on code night. The visual editor applies the identical rules, so what an instructor writes is what a member reads.

## Do's and Don'ts

### Do:
- **Do** reserve the logo-cyan fill with a 1.5px ink outline for the single next-step or primary action in a view; use the secondary paper button for everything else.
- **Do** express state with the status colours: violet completed, green correct, red retry, closed, or error, amber scheduled.
- **Do** show completion directly: a violet check for a passed room, the green score for a passed quiz, a red retry icon for a quiz to retake.
- **Do** keep closed, scheduled, and draft items visible and give them a flat state tag instead of hiding them.
- **Do** lead every room and path name with its entity logo: the uploaded logo, or the initials tile by default.
- **Do** let the seeded rosette carry the active path's progress on the dashboard and path page.
- **Do** set every counter in tabular figures inside ruled cells, with a condensed caps label above the value.
- **Do** build surfaces as sheet white on security paper with 1px hairlines and the sheet shadow (`0 1px 2px rgb(16 22 31 / 0.05), 0 1px 1px rgb(16 22 31 / 0.03)`).
- **Do** play the check draw only for a completion that just happened, and show the finished check under reduced motion.
- **Do** keep the editor and the student view on the same material typography.

### Don't:
- **Don't** turn the app chrome into a near-black console with neon accents and glowing cards; the only dark surface is the code block.
- **Don't** build a white SaaS LMS look with blue buttons and thumbnail tiles; rooms and paths are identified by a small square logo or initials tile.
- **Don't** reintroduce rubber stamps, rotated tags, badge or cube shapes, or passport and visa framing; completion is a check, a score, or a retry icon.
- **Don't** put a condensed caps label above a heading as an eyebrow or kicker.
- **Don't** use status colours or logo cyan as decoration, gradient fills, or glows; the iris gradient belongs to the rail, the signed-out hero, and the auth panel only.
- **Don't** use hard offset shadows or coloured shadows; lift is only for floating layers.
- **Don't** use JetBrains Mono outside code, or draw icons with text glyphs; icons are stroked inline SVG.
- **Don't** let a status pill or state tag wrap onto two lines.
