---
name: Anon Cyber Team
description: Self-paced cybersecurity learning, recorded plainly on security paper in crisp ink, with quiet circuit-board motifs.
colors:
  paper: "#F3F7F8"
  sheet: "#FCFDFD"
  well: "#ECF3F5"
  line: "#CCDCE1"
  line-soft: "#DFE8EB"
  line-strong: "#96AFB8"
  line-input: "#768C95"
  ink: "#10161F"
  ink-2: "#3A4750"
  ink-3: "#5C6A72"
  cyan: "#00C2F5"
  cyan-hover: "#00AEDE"
  cyan-soft: "#DEF4FB"
  cyan-ink: "#006C8A"
  on-cyan: "#042836"
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
    textColor: "{colors.on-cyan}"
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
  progress-ring:
    backgroundColor: "{colors.line-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    size: "200px"
  progress-bar:
    backgroundColor: "{colors.line-soft}"
    rounded: "{rounded.full}"
    height: "6px"
---

# Design System: Anon Cyber Team

## Overview

**Creative North Star: "The Security-Paper Record"**

Every member's learning is a calm, official record on security paper. The ground is cool security paper, content sits on whiter sheets ruled with hairlines, text is crisp intaglio ink, and the app rail is iris-printed (pale cyan fading to pale periwinkle) under a fine dot grid in deep cyan ink. Progress is stated plainly: a passed room gets a violet check, a passed quiz shows its score in green, a quiz to retry shows a red retry icon. A check that was just earned draws itself in once; nothing else celebrates.

The system is calm and dense rather than decorative. Ornament is quiet, digital, and drawn only in deep cyan ink at low opacity: a dot-grid surface on the rail, drawer, auth panel, and signed-out hero; deterministic circuit traces fading in on the hero and auth panel; a thin circuit "data bus" strip edging the hero and heading the Continue sheet. The one ornament that carries information is the segmented progress ring, one segment per room of the active path. Rooms and paths are identified by an uploaded logo or, by default, a tinted tile with the initials of their name. Status colours carry state. Counters sit in ruled, fixed cells with tabular figures so numbers never shift. The one bright colour, the logo's cyan, marks the member's next step and nothing else.

The world rejects both category defaults, the near-black console with neon accents and glowing cards and the white SaaS LMS with blue buttons and thumbnail tiles, and it rejects decorative badges, rubber stamps, and postage-stamp print ornament (guilloche, perforation). An opt-in, app-wide night theme re-inks the same paper-and-ink system dark, without neon or glow. Instructors and admins work in the same system, with denser ruled tables.

**Key Characteristics:**
- Light, cool paper ground; whiter sheets; hairline rules; whisper-level shadows.
- One reserved accent (logo cyan with a thin cyan border and deep blue-ink text) for the next step and primary action.
- Status colours (violet, green, red, amber) carry state only.
- Completion is a direct mark: a check, a score, or a retry icon.
- Rooms and paths wear their logo or an initials tile; path progress is a segmented ring, one segment per room.
- Digital motifs (dot grid, circuit traces, data-bus strip) in deep cyan ink at low opacity, decorative and hidden from assistive technology.
- Archivo throughout, with its width axis used for condensed field labels and status pills; JetBrains Mono only for code.
- Nothing vanishes: closed, scheduled, and draft items stay visible and carry a flat state tag.

### Antislop Record (Design Read, dials, written reasons)

The antislop filter runs on top of this direction (DURING mode). Its record lives here so every technique it puts behind a purpose test has its one-line reason (R-31).

**Design Read.** Reading this as: a self-paced learning app (mostly Operate and Read surfaces) for community members who study cybersecurity in long sessions on laptops and phones, in a "security-paper record" visual language. Dial: ENERGY 1 / RHYTHM 2 / MOTION 2.

- **ENERGY 1 (calm):** long reading and answering sessions need a quiet page; energy comes from the one cyan next step and the members' own progress, not from decoration.
- **RHYTHM 2 (consistent with a few breaks):** working pages share one sheet grammar so members always know where things are; the breaks are the dashboard's Continue sheet with its ring, the path header ring, and the signed-out hero.
- **MOTION 2 (state transitions only, no scroll reveal):** motion explains a change of state (drawer slides in, rail collapses, page fades in on arrival, a fresh check draws once, the loading line runs while the next page renders) and everything stops under reduced motion.
- **Focal point:** one per screen. The Continue sheet on the dashboard, the progress ring on a path page, the material on a room page, the current question on a quiz.
- **One accent:** logo cyan, reserved for the next step and the primary action of a view (The Next-Step Cyan Rule).
- **Identity motif:** the digital security-paper print (dot grid, circuit traces, data-bus strip) plus the direct completion marks.

**Written reasons for purpose-gated techniques:**
- **Iris gradient (R-01):** the pale cyan-to-periwinkle iris comes from the logo's cube faces and the security-paper print; it is the only gradient and stays on the rail, drawer, signed-out hero, and auth panel, where it separates navigation from content.
- **Dot grid, circuit field, data-bus strip (R-07):** the owner asked for an IT/digital ground in place of postage-stamp ornament (21 Oct 2026); the print stays in one ink at low opacity and only on surfaces that are not read for long.
- **Archivo (R-06):** one variable grotesque whose width axis gives the printed-form voice (condensed caps for labels, pills, and serials) without a second display face.
- **Condensed uppercase labels with tracking (R-06):** they label data in ruled cells like the field names on an official record; never as eyebrows above headings.
- **JetBrains Mono (R-06):** code and literal machine strings (IPs, slugs, submitted answers, error references), because its distinct 0/O and 1/l/I keep payloads and flags unambiguous; never for headings or decoration.
- **Stroked inline SVG icons (R-04):** drawn for this app at one stroke weight so they sit with the hairline rules; each icon names its destination and stays beside a text label.
- **Arrows (R-08):** directional only. A forward arrow marks the action that advances the member through a path or quiz (Resume or Start room, Start next room, Next question); a back arrow marks a link that returns to the parent room or previous question. No other button carries one.
- **Owner decisions taken during the antislop pass (5 Nov 2026, owner asked for visible UI changes):** text fields get a control-edge border at 3:1 (WCAG non-text contrast) instead of the 1.9:1 hairline; heatmap days without activity are drawn as a small dot so "none" and "some" differ by shape, not only by a faint tint; the member serial keeps Serial Red as a named exception to the Status Colour Rule.
- **Shadows (R-12):** the sheet shadow says "a sheet lying on paper", lift marks the one floating layer (drawer), and the cyan whisper softens the primary button's edge.
- **Cards and figure cells (R-14):** sheets hold different jobs, so their sizes follow content; figure cells are deliberately identical because they are a ruled table of comparable numbers.
- **Activity heatmap:** it answers "how regular is my study?" for the streak beside it; it uses deep cyan ink intensity because it is a measure of effort, not a state, so it may not borrow a status colour.
- **Palette size (R-29):** neutrals, one accent (logo cyan), and four status colours that each carry one state (The Status Colour Rule); the identity tile tints are reserved for room and path initials and never carry meaning.

## Colors

A cool, low-chroma paper-and-ink palette with one reserved logo cyan and four status colours. Tokens are stored as `R G B` channel triplets on `:root` in `app/globals.css` and exposed to Tailwind with alpha support; the hex values in the frontmatter are the same colours.

### Primary
- **Logo Cyan** (cyan): the fill of the logo's cube faces. Used as the face of the primary button, the "next room" segment of the progress ring, text selection tint, and selected editor cells. Hover deepens to **Pressed Cyan** (cyan-hover).
- **Deep Blue Ink on Cyan** (on-cyan): the text colour on a cyan fill. A dark blue-ink rather than black, so the primary button reads as one seamless cyan object.
- **Deep Cyan Ink** (cyan-ink): the text-safe form of the accent. Links, the active nav icon, focus outlines, input caret, the focused input border, the selected quiz option and current-question borders, the primary button's 25% border, and every digital motif stroke (dot grid, circuit traces, data-bus strip, the ring's dotted outer gauge). Never used as a large fill.
- **Cyan Wash** (cyan-soft): background of the "primary" status pill, next-task callouts, the selected quiz option (at 50%), and the pressed night-mode toggle button. The rail's night-mode switch track turns slate ink when on, so logo cyan stays reserved for the next step.

### Secondary (status colours)
- **Completion Violet** (violet / violet-soft): completed. The filled circle behind a passed room's check, completed segments of the progress ring, the default progress bar, the "done" pill, task-list checkboxes in material.
- **Approval Green** (green / green-soft): correct. A passed quiz's score figure, the "Solved" state tag, success pills.
- **Serial Red** (red / red-soft): retry, closed, error, destructive. The retry mark (red icon on red wash), the "Closed" state tag, danger buttons, and the red serial number on the member card.
- **Schedule Amber** (amber / amber-soft): scheduled or time-bound. "Opens 24 Oct" and "Closes ..." state tags, warning pills.

### Neutral
- **Security Paper** (paper): page ground behind everything.
- **Sheet White** (sheet): every content surface, button faces for secondary actions, inputs, the check inside a completion mark, and the fill of circuit via circles.
- **Well** (well): recessed areas: table headers, blockquotes, inline code, hover fills, neutral state tags.
- **Hairline** (line), **Soft Hairline** (line-soft), **Strong Rule** (line-strong): sheet borders and dividers; progress tracks, "to do" ring segments, inner rules, and completion-list row rules; secondary-button borders, dashed empty-slot borders, ring tick marks, scrollbar thumbs.
- **Control Edge** (line-input, `#768C95`, night `#5C707C`): the border of text fields and the dot of empty heatmap days, at least 3:1 against sheet, paper, and well in both themes, so an edge is visible (WCAG non-text contrast).
- **Intaglio Ink** (ink): headings, body text, the ring's centre figure.
- **Slate Ink** (ink-2): secondary text, descriptions, ghost-button text.
- **Faded Ink** (ink-3): field labels, placeholders, helper text, completion-list detail lines, inactive nav icons, the ring's sublabel.
- **Iris** (`linear-gradient(180deg, #d9eff6 0%, #e3ecf8 55%, #ebe8f6 100%)`, the `--iris` custom property): the only gradient in the system, always under the digital dot grid, used solely for the navigation rail, the mobile drawer, the signed-out hero, and the auth panel.
- **Code Night** (code-surface / code-text): the dark surface reserved for code blocks in room material, in both themes.

### Night Theme (opt-in, app-wide)
`:root[data-theme="night"]` redefines every colour token so all components follow without their own dark variants: paper `#0D1318`, sheet `#141C23`, well `#1A242C`, hairlines `#29363F` / `#202B33` / `#465863`, ink `#E6EEF2` / `#B6C4CC` / `#8C9DA7`; logo cyan is unchanged with hover `#46D4FA`, wash `#0C3442`, and a lightened cyan ink `#60D4F6`; status colours lighten (violet `#AC9AF2`, green `#6ECC92`, red `#F28076`, amber `#E8B860`) over dark washes; identity tiles and the iris (`#0f1c24` to `#151a28`) darken; room material text becomes `#d3dee4`. It is opt-in and app-wide: set by any "Night mode" toggle (rail, mobile top bar, drawer, lab header), remembered locally, and applied before first paint; room material follows it, with instructor colours re-inked for the dark page.

### Named Rules
**The Next-Step Cyan Rule.** Logo cyan fills only the member's next step and the primary action of a view, with on-cyan text and a thin cyan-ink border, never a black outline. Links use deep cyan ink, never the bright fill colour as text.

**The Status Colour Rule.** Violet means completed; green means correct, and in staff views live (a Published item, a running lab); red means retry, closed, error, or destructive; amber means scheduled, and in staff views needs attention (a starting lab, unsaved changes, a room missing tasks or material). Do not use a status colour to signal anything else, and do not let two colours share a meaning. One named exception: the member serial is printed in Serial Red, like a banknote serial; it is an identifier, never a state, and appears only on the member card and profile. Hints are not a state, so the hint box is neutral (well fill, faded-ink label), not amber.

**The Identity Tile Rule.** Rooms and paths are told apart by their uploaded logo or, by default, an initials tile whose tint is chosen deterministically from the name among a dedicated identity palette: cyan soft, tile indigo (#E7EAF8 with #3B4B8A initials), tile teal (#E1F1EF with #0F6A63 initials), and the neutral well. Status colours are never used for tiles, so a tile can never be read as a state; state always rides on a mark, tag, or pill beside the name.

**The One Motif Ink Rule.** Digital motifs draw only in deep cyan ink (`rgb(0 108 138)`) at low opacity (13% for the dot grid, about 32% for circuit strokes, 40% for the data-bus strip), never in status colours or logo cyan.

**The One Theme Per Token Rule.** A dark surface is made by re-valuing the tokens under `data-theme="night"`, never by hard-coding dark colours in a component.

## Typography

**Display Font:** Archivo (variable weight and width), with ui-sans-serif, system-ui fallback
**Body Font:** Archivo
**Label/Mono Font:** Archivo condensed through `font-stretch` for labels, pills, and serials; JetBrains Mono for code and literal machine strings (IPs, slugs, submitted answers, error references), because its distinct 0/O and 1/l/I keep payloads and flags unambiguous

**Character:** One grotesque used across its width axis gives the printed-form feel: normal width for reading and headings, condensed uppercase for printed field labels, status pills, and serial numbers.

### Hierarchy
- **Display** (700, 2.25rem rising to 3rem at the sm breakpoint, line-height 1.08, -0.025em): the signed-out home hero only.
- **Headline** (700, 1.75rem rising to 2rem at lg, leading-tight, -0.018em, balanced wrap): one page title per screen in the shell header and auth frame. No eyebrow above it.
- **Title** (700, 1.125rem, snug, -0.01em): section headers on sheets, optionally with a 0.875rem slate description below.
- **Figure** (700, 1.75rem, line-height 1, tabular and lining numerals, -0.01em): counters in ruled cells; units ride beside them at 0.875rem semibold slate. A 1.125rem variant holds word values such as difficulty. The same figure style sets a passed quiz's score mark (1.125rem in lists, 1.75rem on the quiz result) in green, and the progress ring's centre count ("3/8").
- **Body** (400, 0.9375rem, 1.55): interface text. Secondary text at 0.875rem in slate ink.
- **Reading** (400, 1.0625rem, 1.75, text colour `#1d2933`): room material in the shared material typography, identical in the editor and student view. Headings inside material step 1.75 / 1.4 / 1.15 / 1.0625rem at 700.
- **Label** (600, 0.6875rem, 0.12em tracking, uppercase, width 72%, faded ink): field labels sitting directly above a data value, and the progress ring's sublabel ("ROOMS").
- **Serial** (600, 0.75rem, 0.12em, uppercase, width 80%, tabular, serial red): member ID numbers on the member card and profile.
- **Code** (JetBrains Mono, 0.86em inline, 0.84rem in blocks at 1.65).

### Named Rules
**The Labels-Are-Data Rule.** Condensed caps label a value, a field, or a state. They never sit above a heading as an eyebrow or kicker.

**The Fixed Cell Rule.** Every counter (points, streak, rank, scores, percentages, ring counts) is set in tabular figures so values never shift width when they change.

## Layout

The signed-in app is a fixed left rail plus a centred content column. The rail is 256px wide (collapsible to 76px, preference stored locally) and the main column caps at 1240px with gutters of 16px on phones, 24px at sm, and 40px at lg, and top padding of 24px (36px at lg). Each page opens with a title row (headline plus optional slate subtitle, with actions aligned to the bottom edge on wider screens), then 28px of space before content. The content column fades up 6px over 320ms on every page view; purpose: it confirms that a navigation landed while the rail stays still. While the next page renders on the server, a 3px logo-cyan line runs along the top edge (shown only after 150ms, so fast navigations do not flicker; static under reduced motion, announced as "Loading page"). Every page ends with the shared footer: the community line and the "Safe, defensive practice only" note. Unknown addresses and failed pages use the auth frame with a plain explanation and two ways on (Page not found; This page didn't load, with Try again).

Screens compose sheets on a grid with a 20px gap. The dashboard, profile, and room pages use a main column plus a 340px side column from xl (`minmax(0,1fr) 340px`), because with the 256px rail open, lg would leave the main column under 330px, too narrow for the Continue and member-details rows; room material takes 8 of 12 columns, and the editor's writing width is matched to it. Figures sit in a ruled 2x2 cell block inside a sheet. Completion lists flow as rows in 1 column on phones, 2 at sm, and 3 at xl (24px column gap), each row ruled below by a soft hairline. Lists of rooms and paths lead each row with the entity logo.

Collapsing the rail keeps one layout: the width and item padding animate over 300ms, labels fade out (200ms) while icons stay put, and the member card folds away by grid rows; purpose: icons keep their place so the member never loses their position in the nav. Below lg, the rail becomes a sticky paper top bar (logo, name, and a small secondary "Menu" button) that slides the same dotted iris rail in as a modal drawer (`min(18rem, 86vw)`, 300ms on `cubic-bezier(0.16, 1, 0.3, 1)`, over a fading 30% ink scrim, focus-trapped, Escape closes); purpose: it slides from the rail's edge so it reads as the same rail, not a new surface. When closed it stays mounted but invisible and inert. Sheet padding is 20px, rising to 24px for form panels at md.

Touch pointers (`pointer: coarse`, through the `coarse:` Tailwind variant and an unlayered block in `globals.css`) get 44px targets per antislop R-03: buttons, small buttons, fields, selects, nav items, editor tools, and an invisible 44px hit area on standalone text links. Mouse layouts keep the dense desktop rhythm. Fields use 1rem text on touch so iOS Safari does not zoom the page on focus. On phones, wide tables drop secondary columns (name, date, answer) into a small second line under the first cell instead of scrolling them off-screen.

## Elevation & Depth

Depth is paper, not light. Surfaces are separated by tone (paper, sheet, well) and hairline borders; shadows are barely there and exist only to say "this is a sheet lying on paper". The one lifted object is the mobile navigation drawer. The digital motifs are printed flat into the surface, never raised.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px rgb(16 22 31 / 0.05), 0 1px 1px rgb(16 22 31 / 0.03)`): every sheet, and the active nav item.
- **Cyan whisper** (`box-shadow: 0 1px 2px rgb(0 108 138 / 0.18)`): the primary button only, so its edge dissolves into the cyan face instead of reading as an outline.
- **Lift** (`box-shadow: 0 10px 30px -12px rgb(16 22 31 / 0.22), 0 2px 6px rgb(16 22 31 / 0.06)`): floating layers only (the mobile drawer).
- **Input inset** (`box-shadow: inset 0 1px 1px rgb(16 22 31 / 0.04)`): text fields, to read as pressed into the sheet.

### Named Rules
**The Paper Depth Rule.** A sheet is a hairline border plus the sheet shadow. No glows and no hard offset shadows; the only tinted shadow is the primary button's 1px cyan whisper, and lift is reserved for things that float above the page.

## Shapes

Gently rounded, document-like rectangles, all upright. Sheets use a 0.75rem corner; buttons, inputs, quiz options, and nav items use 0.5rem; status pills and state tags use 0.375rem; progress bars, the progress ring, and completion marks are fully round. Entity logo tiles scale their corner with their size (0.375rem at 36px, 0.5rem at 44px, 0.75rem at 64px, 1rem at 96px). Borders are 1px hairlines, except the quiz's current-question marker (1.5px deep cyan ink at 70%). Dashed borders mean "a slot that is still empty": the "Up next" mark, empty states, unchosen upload drop zones, the lab placeholder, and next-task callouts. Circuit geometry is orthogonal runs with 45-degree jogs on a 24px step, ending in small open via circles and starting from small square pads. Nothing is rotated.

## Components

### Buttons
Printed and plain: one bright face for the next step, paper for everything else.
- **Shape:** gently rounded (0.5rem), minimum height 40px (44px on touch), 16px horizontal padding, 0.875rem semibold label, optional 8px-gap inline SVG icon.
- **Primary:** logo cyan face, on-cyan text, 1px deep-cyan-ink border at 25%, the cyan whisper shadow. Hover deepens to pressed cyan. One per view: form submit buttons default to secondary and only the view's main action (Create announcement, Create or save a learning path, Save material, Resume room) is passed the primary style.
- **Arrows:** directional only. A forward arrow marks the action that advances the member through a path or quiz (Resume or Start room, Start next room, Next question); a back arrow marks a link that returns to the parent room or previous question; no other button carries one.
- **Secondary:** sheet face, strong-rule border, ink text. Hover moves the border to faded ink and the face to well. As a toggle (the "Night mode" button, `aria-pressed`) its pressed state takes a cyan wash with a cyan-ink border at 50%.
- **Ghost:** no face or border, slate text, 12px padding. Hover fills well and darkens text to ink.
- **Danger:** sheet face, red text, red border at 40% opacity. Hover strengthens the border and fills red wash.
- **Small:** 32px minimum height (44px tall and wide on touch), 12px padding, 0.8125rem text.
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
- **Style:** sheet fill, 1px control-edge border (line-input, at least 3:1 on sheet and paper in both themes, so the field's edge meets WCAG non-text contrast), 0.5rem corners, 8px by 12px padding, 0.9375rem ink text (1rem on touch, so iOS Safari does not zoom the page on focus), faded-ink placeholder, inset whisper shadow. The label above is 0.875rem semibold ink; helper text below is 0.75rem faded ink.
- **Focus:** the border turns deep cyan ink with a 2px logo-cyan ring at 35%.
- **Hover / Disabled:** hover darkens the border to faded ink; disabled fills well with faded-ink text.
- **Quiz options:** 0.5rem-cornered hairline rows on sheet; selected turns the border deep cyan ink at 60% over a 50% cyan wash. The question navigator marks the current question with a 1.5px cyan-ink border at 70%.
- **Image upload:** a dashed drop zone on paper with an upload button and a URL field. Room and path configuration carry a "Logo" field (square preview, controls named "Upload logo", "Remove logo", "Logo URL") beside "Cover image" (wide preview).

### Navigation
- **Rail:** the dotted iris surface behind the logo and wordmark (0.9375rem bold), the member links, then role groups (Teaching, Admin) under condensed field labels, a collapse control, the member card (name, role label, red serial ID), and sign out. Right edge is a plain 1px hairline.
- **Items:** 0.9375rem slate text with an 18px stroked SVG icon (1.7 stroke) in faded ink; 36px tall at lg with a mouse, 40px below lg, 44px on touch. Hover lays translucent sheet behind the item. **Active** is a sheet tab: sheet fill, sheet shadow, 1px hairline ring, semibold ink text, deep-cyan icon.
- **Collapsed:** icons only at fixed positions, each with a full accessible name and tooltip; labels fade rather than unmount.
- **Mobile:** sticky paper top bar with backdrop blur; "Menu" slides the rail in as a drawer over a 30% ink scrim.

### Completion Mark and Completion List (signature)
- **Completion mark:** one direct mark per outcome, 40px (56px on the quiz result). A passed room is a violet filled circle with a sheet-white stroked check (2.6 stroke). A passed quiz is its score as a green tabular figure ("85%"), with no container. A quiz to retry is a red stroked retry icon (an open circular arrow with its head at the upper right) on a red-wash circle. The next room is an empty circle with a 2px dashed strong-rule border.
- **Check draw:** only for a completion that has just happened, the check's stroke draws in once (460ms on `cubic-bezier(0.16, 1, 0.3, 1)` after a 120ms delay). Under reduced motion the check appears already drawn.
- **Completion list:** newest first; each row is the mark centred in a 48px column, then the room title (semibold ink) and a 0.875rem faded-ink detail line ("Room passed · 3 Oct 2026", "Quiz passed with 85% · 1 Oct 2026", "Quiz scored 40% · try again · 28 Sep 2026"), optionally closed by an "Up next" row in slate. It appears as "Completed" on the dashboard and progress page, "Recently completed" on the profile, and as a labelled example on the signed-out home. The room page shows a single mark in its "Room passed" callout.

### Entity Logo
A square identity tile beside every room and path name: the uploaded logo (object-cover, hairline border, sheet backing) or, by default, the bold initials of the name (first letters of the first two non-stopword words, or the first two letters of a single word) on an identity-palette fill with a 20%-tone border. In `person` mode, used for a missing profile avatar, no words are dropped as stopwords ("Dan Pratama" reads "DP"). Sizes 36, 44, 64, and 96px. Always decorative (hidden from assistive technology) because the full name sits beside it. It leads rows in the dashboard, catalogs, room lists, path itineraries, room headers, the progress grid, and instructor managers.

### Path Progress Ring (signature)
A segmented gauge for the active learning path: one 12px-stroke arc on an 80-unit radius per room, in path order, with butt ends and small gaps (at most 6 degrees). Completed rooms are violet, the next room is logo cyan, rooms to do are soft hairline grey. A dotted outer ring in deep cyan ink at 35% and a hairline inner ring with a strong-rule tick at every segment boundary give it the read of a digital gauge. A single-room path draws a full circle; above 24 rooms the segments merge into one continuous violet arc over a grey track. The centre holds the count as a 34-unit tabular figure ("3/8") over a condensed caps sublabel. It sits at 200px on the dashboard's Continue sheet (160px on phones) and 184px in the path header (144px on phones), and carries an image role with a full sentence label ("Path: 3 of 8 rooms completed"). The segments enter with `ring-in` (fade in and rotate from -30 degrees over 700ms on `cubic-bezier(0.16, 1, 0.3, 1)`), off under reduced motion; purpose: it draws the eye to the ring once on arrival, so path progress is read first.

### Activity Heatmap
Answers "On which days did I practise in the last 17 weeks?" for the streak figures beside it. One column per week (Monday on top), month labels above, Mon/Wed/Fri row labels, today ringed in deep cyan ink. Fixed thresholds per day (1, 2, 3 to 4, 5+ task answers and quiz attempts) step through deep cyan ink at 25, 45, 70, and 100%, because activity is a quantity, neither a state nor the next step, so it never takes a status colour or logo cyan. Days without activity are a small centred dot in the control-edge colour (3:1 or more), so "none" and "some" differ by shape (dot against square) as well as tint, without turning the grid into ruled boxes; the dots echo the rail's dot grid. The exact date and count sit in each cell's tooltip for mouse users and in a screen-reader list of active days; the visible caption states the total. Shown on Progress (with Longest streak, This week, Busiest day) and Profile.

### Digital Surface and Circuit Motifs
- **Dot-grid surface:** 1px deep-cyan-ink dots at 13% on an 18px grid laid over the iris gradient. Used on the rail, mobile drawer, auth panel, and signed-out hero, nowhere else.
- **Circuit field:** sixteen deterministic traces (seeded with FNV-1a and mulberry32, so the field never changes between renders) of horizontal runs with one 45-degree jog, each starting at a small square pad and ending in an open via circle, plus two small chips with pins; 1.25px non-scaling strokes in deep cyan ink at about 32%. It sits on the right of the signed-out hero (masked to fade toward the text) and the lower part of the auth panel at lg (masked to fade upward), behind content and never interactive.
- **Data-bus strip:** a 20px-tall repeating pattern (168px tile) of two bus lines with 45-degree jogs, vias, and pads at 40%, on a translucent paper backing with a soft hairline. It heads the dashboard's Continue sheet and closes the bottom edge of the signed-out hero.
- All three are decorative and hidden from assistive technology.
- **Why:** the owner asked for an IT motif that names the subject (circuit boards, data buses) in place of the rejected postage-stamp ornament; it stays on navigation and entry surfaces (rail, drawer, auth panel, signed-out hero, the head of the Continue sheet) so reading surfaces remain plain.

### Figure Cells
A condensed field label, then a 1.75rem tabular figure with an optional slate unit, then an optional 0.75rem note. They are grouped as ruled 2x2 blocks inside a sheet; the dashboard block reads Points, Streak, Rooms completed, Rank.

### Progress Bar
A 6px fully rounded soft-hairline track with a fill in violet by default (cyan, ink, or green available), animating width over 500ms ease-out. Always exposes progressbar semantics.

### Room Material
Instructor-authored HTML is set in the reading style on sheet white, with deep-cyan underlined links, well-tinted blockquotes and inline code, hairline-ruled tables with well headers, and code blocks on code night. The visual editor applies the identical rules, so what an instructor writes is what a member reads.

### Night Mode
An app-wide, opt-in night theme. The toggle lives at the bottom of the left rail ("Night mode" with a small switch; icon-only with a tooltip when the rail is collapsed), in the mobile drawer, as an icon button next to Menu in the mobile top bar, and as a secondary button in the lab page's action row. All of them share one preference (localStorage `act-night-mode`, synced between toggles with a window event), and a constant inline script in `app/layout.tsx` applies `data-theme="night"` before first paint, so there is no light flash. Room material and the material editor follow night mode too: instructor-chosen text colours (picked for the light page) are re-inked with `filter: invert(1) hue-rotate(180deg)` on coloured elements only (not highlights, not nested twice), which keeps each hue but flips its lightness, so the palette reaches 6–8:1 on the night sheet; code blocks sit on a slightly darker panel. Background and text colour cross-fade over 200ms when it switches. The light paper world remains the default.

### Do:
- **Do** reserve the logo-cyan fill (on-cyan text, thin cyan-ink border, cyan whisper shadow) for the single next-step or primary action in a view; use the secondary paper button for everything else.
- **Do** express state with the status colours: violet completed, green correct, red retry, closed, or error, amber scheduled.
- **Do** show completion directly: a violet check for a passed room, the green score for a passed quiz, a red retry icon for a quiz to retake.
- **Do** keep closed, scheduled, and draft items visible and give them a flat state tag instead of hiding them.
- **Do** lead every room and path name with its entity logo: the uploaded logo, or the initials tile by default.
- **Do** let the segmented progress ring carry the active path's progress on the dashboard and path page, one segment per room.
- **Do** draw digital motifs (dot grid, circuit traces, data-bus strip) only in deep cyan ink at low opacity, deterministically, and hidden from assistive technology.
- **Do** set every counter in tabular figures inside ruled cells, with a condensed caps label above the value.
- **Do** build surfaces as sheet white on security paper with 1px hairlines and the sheet shadow (`0 1px 2px rgb(16 22 31 / 0.05), 0 1px 1px rgb(16 22 31 / 0.03)`).
- **Do** play the check draw only for a completion that just happened, and show the finished check under reduced motion.
- **Do** build dark surfaces by re-valuing tokens under the night theme, and keep the night theme opt-in (light is the default), with instructor colours in room material re-inked rather than left dark-on-dark.
- **Do** keep the editor and the student view on the same material typography.

### Don't:
- **Don't** turn the app chrome into a near-black console with neon accents and glowing cards; the light paper world is the default, and the optional night theme is the same system re-inked dark, without neon or glow.
- **Don't** build a white SaaS LMS look with blue buttons and thumbnail tiles; rooms and paths are identified by a small square logo or initials tile.
- **Don't** reintroduce rubber stamps, rotated tags, badge or cube shapes, passport and visa framing, or postage-stamp print ornament (guilloche rosettes, wavy bands, perforated edges); completion is a check, a score, or a retry icon.
- **Don't** put a black or ink outline on the primary button.
- **Don't** put a condensed caps label above a heading as an eyebrow or kicker.
- **Don't** use status colours (except the member serial's Serial Red) or logo cyan as decoration, gradient fills, or glows; the iris gradient belongs to the rail, the mobile drawer, the signed-out hero, and the auth panel only.
- **Don't** use hard offset shadows or glows; the only tinted shadow is the primary button's cyan whisper, and lift is only for floating layers.
- **Don't** use JetBrains Mono outside code and literal machine strings, or draw icons with text glyphs; icons are stroked inline SVG.
- **Don't** let a status pill or state tag wrap onto two lines.
