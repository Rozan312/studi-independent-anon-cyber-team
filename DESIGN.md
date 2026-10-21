---
name: Anon Cyber Team
description: Self-paced cybersecurity learning, recorded on security paper and stamped in ink.
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
  progress-bar:
    backgroundColor: "{colors.line-soft}"
    rounded: "{rounded.full}"
    height: "6px"
---

# Design System: Anon Cyber Team

## Overview

**Creative North Star: "The Learning Passport"**

Every member's learning is an official, security-printed record. The ground is cool security paper, content sits on whiter sheets ruled with hairlines, text is crisp intaglio ink, and the app rail is iris-printed (pale cyan fading to pale periwinkle) with a dotted perforation edge. Completion does not arrive as a confetti toast or a glowing badge: it arrives as a rubber stamp struck into a visa-page passport, slightly rotated, edges worn by a noise mask.

The system is calm and dense rather than decorative. Ornament is confined to the security-printing vocabulary, and each ornament carries information. A guilloche rosette, generated deterministically from a learning path's slug, is both that path's emblem and its progress ring. Stamp inks are state colours. Counters sit in ruled, fixed cells with tabular figures so numbers never shift. The one bright colour, the logo's cyan with an ink outline, marks the member's next step and nothing else.

The world rejects both category defaults: the near-black console with neon accents and glowing cards, and the white SaaS LMS with blue buttons and thumbnail tiles. Instructors and admins work in the same paper-and-ink system, with denser ruled tables.

**Key Characteristics:**
- Light, cool paper ground; whiter sheets; hairline rules; whisper-level shadows.
- One reserved accent (logo cyan, ink outlined) for the next step and primary action.
- Stamp inks (violet, green, red, amber) carry state only.
- Generative guilloche (rosettes, bands) as emblem and progress, never as filler.
- Archivo throughout, with its width axis used for condensed field labels and stamps; JetBrains Mono only for code.
- Nothing vanishes: closed, scheduled, and draft items stay visible and wear a stamped state.

## Colors

A cool, low-chroma paper-and-ink palette with one reserved logo cyan and four stamp inks. Tokens are stored as `R G B` channel triplets on `:root` in `app/globals.css` and exposed to Tailwind with alpha support; the hex values in the frontmatter are the same colours.

### Primary
- **Logo Cyan** (cyan): the fill of the logo's cube faces. Used as the face of the primary button (always with a 1.5px ink outline, like the logo), the active progress tone where cyan is chosen, text selection tint, and selected editor cells. Hover deepens to **Pressed Cyan** (cyan-hover).
- **Deep Cyan Ink** (cyan-ink): the text-safe form of the accent. Links, the active nav icon, focus outlines, input caret, and the focused input border. Never used as a large fill.
- **Cyan Wash** (cyan-soft): background of the "primary" status pill and next-task callouts.

### Secondary (stamp inks)
- **Passport Violet** (violet / violet-soft): completed. Room-passed stamps, the default progress bar, the "done" pill, task-list checkboxes in material.
- **Approval Green** (green / green-soft): correct. Passed-quiz stamps, solved tasks, success pills.
- **Serial Red** (red / red-soft): retry, closed, error, destructive. Retry stamps, "Closed" state stamps, danger buttons, and the red serial number on the member card.
- **Schedule Amber** (amber / amber-soft): scheduled or time-bound. "Opens 24 Oct" and "Closes ..." state stamps, warning pills.

### Neutral
- **Security Paper** (paper): page ground behind everything.
- **Sheet White** (sheet): every content surface, button faces for secondary actions, inputs.
- **Well** (well): recessed areas: table headers, blockquotes, inline code, hover fills.
- **Hairline** (line), **Soft Hairline** (line-soft), **Strong Rule** (line-strong): sheet borders and dividers; progress tracks and inner rules; input and secondary-button borders, dashed empty-slot borders, scrollbar thumbs.
- **Intaglio Ink** (ink): headings, body text, the primary-button outline.
- **Slate Ink** (ink-2): secondary text, descriptions, ghost-button text.
- **Faded Ink** (ink-3): field labels, placeholders, helper text, inactive nav icons.
- **Iris Rail** (`linear-gradient(180deg, #d9eff6 0%, #e3ecf8 55%, #ebe8f6 100%)`, the `--iris` custom property): the only gradient in the system, used solely as the background of the navigation rail, the signed-out hero, and the auth panel.
- **Code Night** (code-surface / code-text): the one dark surface, reserved for code blocks in room material.

### Named Rules
**The Next-Step Cyan Rule.** Logo cyan fills only the member's next step and the primary action of a view, and it always wears the ink outline. Links use deep cyan ink, never the bright fill colour as text.

**The Stamp Ink Rule.** Violet means completed, green means correct, red means retry, closed, or error, amber means scheduled. Do not use a stamp ink for decoration, and do not let two inks share a meaning.

**The Artwork Ink Rule.** Path rosettes and guilloche bands draw from their own seeded ink set (`#0088B4`, `#5A3DB0`, `#267345`, `#B23A48`, `#8F5708`, `#2F5FA8`, `#0F7C7C`). In catalogs, these are the only colours that tell one path from another.

## Typography

**Display Font:** Archivo (variable weight and width), with ui-sans-serif, system-ui fallback
**Body Font:** Archivo
**Label/Mono Font:** Archivo condensed through `font-stretch` for labels, serials, and stamps; JetBrains Mono for code only

**Character:** One grotesque used across its width axis gives the passport-form feel: normal width for reading and headings, condensed uppercase for printed field labels, stamp lettering, and serial numbers.

### Hierarchy
- **Display** (700, 2.25rem rising to 3rem at the sm breakpoint, line-height 1.08, -0.025em): the signed-out home hero only.
- **Headline** (700, 1.75rem rising to 2rem at lg, leading-tight, -0.018em, balanced wrap): one page title per screen in the shell header and auth frame. No eyebrow above it.
- **Title** (700, 1.125rem, snug, -0.01em): section headers on sheets, optionally with a 0.875rem slate description below.
- **Figure** (700, 1.75rem, line-height 1, tabular and lining numerals, -0.01em): counters in ruled cells; units ride beside them at 0.875rem semibold slate. A 1.125rem variant holds word values such as difficulty.
- **Body** (400, 0.9375rem, 1.55): interface text. Secondary text at 0.875rem in slate ink.
- **Reading** (400, 1.0625rem, 1.75, text colour `#1d2933`): room material in the shared material typography, identical in the editor and student view. Headings inside material step 1.75 / 1.4 / 1.15 / 1.0625rem at 700.
- **Label** (600, 0.6875rem, 0.12em tracking, uppercase, width 72%, faded ink): field labels sitting directly above a data value.
- **Serial** (600, 0.75rem, 0.12em, uppercase, width 80%, tabular, serial red): member ID numbers and passport cell numbers (the passport muted to faded ink at 0.625rem).
- **Code** (JetBrains Mono, 0.86em inline, 0.84rem in blocks at 1.65).

### Named Rules
**The Labels-Are-Data Rule.** Condensed caps label a value, a field, or a state. They never sit above a heading as an eyebrow or kicker.

**The Fixed Cell Rule.** Every counter (points, streak, rank, scores, percentages) is set in tabular figures so values never shift width when they change.

## Layout

The signed-in app is a fixed left rail plus a centred content column. The rail is 256px wide (collapsible to 76px, preference stored locally) and the main column caps at 1240px with gutters of 16px on phones, 24px at sm, and 40px at lg, and top padding of 24px (36px at lg). Each page opens with a title row (headline plus optional slate subtitle, with actions aligned to the bottom edge on wider screens), then 28px of space before content.

Screens compose sheets on a grid with a 20px gap. The dashboard and room pages use a main column plus a 340px side column at lg (`minmax(0,1fr) 340px`); room material takes 8 of 12 columns, and the editor's writing width is matched to it. Figures sit in a ruled 2x2 cell block inside a sheet. The learning passport is a full-width grid of dashed visa cells: 2 columns on phones, 3 at sm, 6 at lg, always filled in multiples of six.

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

Gently rounded, document-like rectangles. Sheets use a 0.75rem corner; buttons, inputs, nav items, and passport frames use 0.5rem; status pills use 0.375rem; progress bars and the round quiz stamps are fully round. Borders are 1px hairlines, except the primary button's 1.5px ink outline and stamp frames (2.5px outer with a 1px inner rule, or 2px at small size). Dashed borders mean "a slot that is still empty": the next-stamp slot, passport cells, empty states, and next-task callouts. The navigation rail's right edge carries a dotted perforation line. Stamps are the only rotated elements, tilted between -7 and +7 degrees, chosen deterministically from their text so they never jitter between renders.

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

### Chips (status pills and state stamps)
- **Status pill:** 0.375rem corners, 1px border at 25% of the tone, soft wash fill, tone text, 0.6875rem semibold uppercase at 0.08em tracking and 78% width. Tones are neutral, primary (cyan), success (green), warning (amber), danger (red), and done (violet).
- **State stamp:** an inline rubber-stamp tag for states that must stay visible ("Opens 24 Oct", "Closed", "Draft"): 1.5px current-colour border, 5px corners, bold condensed caps, rotated up to ±3 degrees, without the worn mask so its small text keeps contrast.

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

### Navigation
- **Rail:** the iris gradient behind the logo and wordmark (0.9375rem bold), the member links, then role groups (Teaching, Admin) under condensed field labels, a collapse control, the member card (name, role label, red serial ID), and sign out.
- **Items:** 0.9375rem slate text with an 18px stroked SVG icon (1.7 stroke) in faded ink; 36px tall at lg, 40px on touch. Hover lays translucent sheet behind the item. **Active** is a sheet tab: sheet fill, sheet shadow, 1px hairline ring, semibold ink text, deep-cyan icon.
- **Mobile:** sticky paper top bar with backdrop blur; "Menu" opens the rail as a drawer over a 30% ink scrim.

### Path Rosette (signature)
A generative guilloche emblem built from three rotated sine-wave rings (outer, inner, core), seeded by FNV-1a from the path slug, so each path always draws the same emblem in the same ink. With progress, the completed sweep is drawn at full ink and heavier stroke while the remainder stays at 45% opacity: the art is the progress ring. Rendered from 40px (list rows) to about 200px (the dashboard Continue sheet), with fewer stroke copies at small sizes so the weave stays legible. Strokes are non-scaling hairlines. Entry plays the `rosette-in` draw (rotate from -24 degrees and scale from 0.92 over 900ms, `cubic-bezier(0.16, 1, 0.3, 1)`).

### Guilloche Band
A 24px-tall band of seven phase-shifted sine lines in the seed's rosette ink at 55% opacity, 0.75px stroke. It heads visa pages and the dashboard's Continue sheet, and divides the signed-out hero from the page. Always decorative and hidden from assistive technology.

### Stamp and Learning Passport (signature)
- **Stamp:** a rectangular (0.625rem corner, 9.75rem wide) or round (6.5rem) rubber stamp in one stamp ink, with a double frame (2.5px outer, 1px inner), condensed bold caps in three lines (top word, title, date), worn edges from a fractal-noise mask, and a deterministic tilt. Long titles wrap and the stamp grows; titles are never truncated. A small size (8rem / 4.75rem) is used inside passport cells.
- **Stamp strike:** only for a completion that has just happened. The stamp drops from 1.45x scale with blur, overshoots to 0.96, and settles over 520ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Under reduced motion the stamp appears without animation.
- **Learning passport:** a visa page on translucent paper headed by a "Visas · Stamps" serial and a guilloche band, then a grid of dashed cells numbered "No. 01" onward. Passed rooms get a violet rectangular stamp, passed quizzes a green round one, failed quizzes a red round "Retry", and the next room appears as a dashed "Next stamp" slot.

### Figure Cells
A condensed field label, then a 1.75rem tabular figure with an optional slate unit, then an optional 0.75rem note. They are grouped as ruled 2x2 blocks inside a sheet.

### Progress Bar
A 6px fully rounded soft-hairline track with a fill in violet by default (cyan, ink, or green available), animating width over 500ms ease-out. Always exposes progressbar semantics.

### Room Material
Instructor-authored HTML is set in the reading style on sheet white, with deep-cyan underlined links, well-tinted blockquotes and inline code, hairline-ruled tables with well headers, and code blocks on code night. The visual editor applies the identical rules, so what an instructor writes is what a member reads.

## Do's and Don'ts

### Do:
- **Do** reserve the logo-cyan fill with a 1.5px ink outline for the single next-step or primary action in a view; use the secondary paper button for everything else.
- **Do** express state with the stamp inks: violet completed, green correct, red retry, closed, or error, amber scheduled.
- **Do** keep closed, scheduled, and draft items visible and give them a state stamp instead of hiding them.
- **Do** show a learning path through its seeded rosette, and let that rosette carry the path's progress.
- **Do** set every counter in tabular figures inside ruled cells, with a condensed caps label above the value.
- **Do** build surfaces as sheet white on security paper with 1px hairlines and the sheet shadow (`0 1px 2px rgb(16 22 31 / 0.05), 0 1px 1px rgb(16 22 31 / 0.03)`).
- **Do** play the stamp strike only for a completion that just happened, and keep it off under reduced motion.
- **Do** keep the editor and the student view on the same material typography.

### Don't:
- **Don't** turn the app chrome into a near-black console with neon accents and glowing cards; the only dark surface is the code block.
- **Don't** build a white SaaS LMS look with blue buttons and thumbnail tiles; paths are identified by rosettes, not cover images.
- **Don't** put a condensed caps label above a heading as an eyebrow or kicker.
- **Don't** use stamp inks or logo cyan as decoration, gradient fills, or glows; the iris gradient belongs to the rail, the signed-out hero, and the auth panel only.
- **Don't** use hard offset shadows or coloured shadows; lift is only for floating layers.
- **Don't** use JetBrains Mono outside code, or draw icons with text glyphs; icons are stroked inline SVG.
- **Don't** truncate stamp titles with an ellipsis; let the stamp grow.
