---
name: RAKIT
description: A controlled engineering document as a storefront and an operator console.
colors:
  cyanotype: "#0E3A8F"
  cyanotype-deep: "#0A2A69"
  cyanotype-night: "#06204F"
  cyanotype-tint: "#DCE5F6"
  exception-red: "#C42B14"
  exception-red-deep: "#9C2110"
  exception-red-tint: "#FBE4DF"
  sheet: "#FFFFFF"
  sheet-recessed: "#EFF3F7"
  sheet-deep: "#DFE7EE"
  ink: "#0C1622"
  ink-secondary: "#46586B"
  ink-annotation: "#5F7082"
  rule-hairline: "#C9D3DD"
  rule-medium: "#9AAAB9"
  plot: "#080D13"
  plot-field: "#0F1821"
  plot-raised: "#16212C"
  plot-line: "#22303D"
  plot-line-strong: "#35485A"
  chalk: "#DEE6EE"
  chalk-secondary: "#98A9BA"
  chalk-annotation: "#7C8EA1"
  lit: "#7AA2FF"
  lit-strong: "#A8C2FF"
  lit-exception: "#FF7A5C"
  lit-exception-deep: "#E0644A"
typography:
  display:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.02em"
  display-sm:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  headline-sm:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  headline-xs:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.05
  section:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title-lg:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.2
  title-sm:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.2
  figure:
    fontFamily: "Roboto Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "1.0625rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0"
  figure-sm:
    fontFamily: "Roboto Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0"
  subtitle:
    fontFamily: "Saira, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.25
  body-lg:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Roboto Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.14em"
  label-sm:
    fontFamily: "Roboto Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.14em"
  annotation:
    fontFamily: "Roboto Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.5625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.16em"
  mark:
    fontFamily: "Roboto Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  tick: "1px"
  mark: "2px"
spacing:
  unit: "4px"
  gutter: "24px"
  section: "40px"
  page: "32px"
components:
  stamp:
    backgroundColor: "{colors.cyanotype}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "11px 18px"
  stamp-hover:
    backgroundColor: "{colors.cyanotype-deep}"
  stamp-disabled:
    backgroundColor: "{colors.sheet-deep}"
    textColor: "{colors.ink-secondary}"
  stamp-counter:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  stamp-destructive:
    backgroundColor: "{colors.exception-red}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "11px 18px"
  stamp-destructive-quiet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.exception-red}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "11px 18px"
  field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  chip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  plate:
    backgroundColor: "{colors.sheet-recessed}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  panel:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: RAKIT

## Overview

**Creative North Star: "The Controlled Drawing"**

The interface is a controlled engineering document. Every surface is a numbered
sheet issued by a system: it carries a title block, a revision date, a zone ruler,
numbered column heads, part numbers, and dimension strings that measure real
figures pulled from a database. Nothing on a sheet is decoration that the drawing
standard does not already define.

The system runs at two temperatures of the same language. The **sheet** is the
light temperature: cool white paper, blue-black ink, hairline rules, used wherever
someone is browsing or reading. The **plot** is the dark temperature: a plotter
field for the operator console and the machine's own reference documents. Neither
is a theme; they are the same drawing seen under different light, and every device
re-tempers itself because both temperatures are expressed as the same token names.
Hero-metric tiles, card grids, coloured status pills, glass, gradients, and soft
rounded corners are all absent by decision: this world measures and rules, it does
not float and glow.

**Key Characteristics:**

- Two temperatures of one token set: sheet (light) and plot (dark).
- One chromatic actor (cyanotype blue) for structure and action; one exception red
  for rejection and destruction; everything else is ink, rule, and field.
- Three deliberate line weights, each with a fixed meaning.
- A closed type system: one display face, one text face, one measurement face.
- Flat by default: separation comes from rule weight and field tint, not shadow.
- Machined geometry: square corners everywhere, 2px only on drawn marks.
- State drawn as a lamp plus a word, never as a coloured badge.

## Colors

A cool, technical palette in which colour is rationed to two jobs.

### Primary

- **Cyanotype** (#0E3A8F): the only chromatic actor. Carries the issuer strip,
  primary actions, active filters, the selected row rule, the filled segment of a
  distribution bar, and the lit lamp on a healthy record. It is the colour of the
  drawing's own reproduction process, not a brand accent.
- **Cyanotype Deep** (#0A2A69): the hover step; pressed drives to **Cyanotype
  Night** (#06204F).
- **Cyanotype Tint** (#DCE5F6): the selected-state field behind a chosen option.

### Secondary

- **Exception Red** (#C42B14): rejection and destruction only. A cancelled order,
  an out-of-stock position, a delete confirmation, a validation failure. It is
  never used to draw attention to something that is merely important.
- **Exception Red Deep** (#9C2110): the hover step; **Exception Red Tint**
  (#FBE4DF) is the ground of a rejection notice.

### Neutral

- **Sheet** (#FFFFFF) and **Sheet Recessed** (#EFF3F7): paper and recessed field.
  **Sheet Deep** (#DFE7EE) is a pressed or disabled ground.
- **Ink** (#0C1622): body text and the heavy rule. **Ink Secondary** (#46586B) is
  supporting copy; **Ink Annotation** (#5F7082) is the smallest legible annotation
  (5.0:1 on sheet).
- **Rule Hairline** (#C9D3DD) separates; **Rule Medium** (#9AAAB9) bounds.
- **Plot** (#080D13), **Plot Field** (#0F1821), **Plot Raised** (#16212C): the dark
  temperature's ground and fields. **Chalk** (#DEE6EE), **Chalk Secondary**
  (#98A9BA), **Chalk Annotation** (#7C8EA1) are its three ink steps.
- **Plot Line** (#22303D) and **Plot Line Strong** (#35485A) are its rules.
- **Lit** (#7AA2FF) is cyanotype lifted for the dark ground; **Lit Strong**
  (#A8C2FF) is its hover. **Lit Exception** (#FF7A5C) and **Lit Exception Deep**
  (#E0644A) are the exception red for the dark ground.

### Named Rules

**The One Actor Rule.** Cyanotype blue is the only chromatic colour in the system.
It marks structure and action and nothing else. If an element is neither carrying
the drawing's frame nor offering an action, it is ink, rule, or field.

**The Exception Only Rule.** Red means rejected, destructive, or failed. Never use
it for emphasis, never for a "hot" metric, never to make a number feel important.

**The Two Temperatures Rule.** Inside a `.plot` surface the sheet's token names are
re-pointed at their dark equivalents. Write against `--color-ink`, `--color-rule`,
`--color-sheet`, `--color-cyan` and `--color-red`, and the same component renders
correctly in both temperatures. Never add a per-page colour remap, and never write
a `.plot .component` override for a state (`:hover`, `:focus`, `:disabled`) — it
ties on specificity with the base rule and silently wins.

**The Reader Chooses The Temperature.** Which temperature you get is a reading
preference, not a property of the page: `:root[data-theme='plot']` re-points the same
five names at the document root, so the storefront can be read on the plot ground and
every device re-tempers without knowing a theme exists. The attribute is written by a
blocking script in the document head — set from React it would paint the light sheet
and then repaint it, which is the flash every themed site is judged on — and the
choice persists in `localStorage`, falling back to the reader's system preference.

Two consequences worth stating, both of which were real defects before they were
rules:

- **`bg-ink` is not a dark panel.** It is the opposite of the ground, which means it is
  dark on the sheet and *light* in the dark theme. A panel that must be dark in both
  temperatures — the issuer strip, the colophon, the module footers — is a `.plot` or
  `bg-plot*` surface with chalk text, not an ink one. Pairing `bg-ink` with
  `text-chalk-*` produced 1.91:1 across an entire footer the moment the theme
  switched. Pair it with `text-sheet*` if it must invert, or use the plot tokens if it
  must not.
- **The instrument reads the theme, not just the page.** It floats over the app root
  as a sibling, so its temperature is set from JS and watches both the app's children
  and the root's `data-theme` attribute.

Colour-scheme is declared in CSS (`color-scheme: dark` on the dark root), so form
controls, scrollbars and the caret follow the theme the reader chose rather than the
one the system reported.

## Typography

**Display Font:** Saira (with Archivo, then the system sans)
**Body Font:** Archivo (with the system sans)
**Label/Mono Font:** Roboto Mono (with the system monospace)

**Character:** A machined grotesque for display, a workhorse grotesque for reading,
and a monospace reserved for anything that is measured. The pairing reads as
lettering on a drawing rather than as a brand voice: Saira's slightly squared
capitals carry headlines, Archivo stays out of the way in paragraphs, and Roboto
Mono makes columns of figures line up.

### Hierarchy

- **Display** (800, clamp 1.75rem–3.375rem, 0.94, tracking -0.02em, uppercase):
  the page thesis, once per sheet. Never a second display line in the same view.
- **Headline** (700, 1.25rem, 1.1, tracking -0.01em, uppercase): section heads,
  set inside a rule so the divider and the label are one object.
- **Title** (600–700, 0.9375rem–1.1875rem, 1.2): part designations, panel titles.
- **Body** (400, 0.8125rem, 1.6, measure 58–74ch): reading copy and descriptions.
- **Label** (400–500, 0.5625–0.625rem, tracking 0.12–0.16em, uppercase,
  measurement face): column heads, callout keys, field labels, coordinates,
  timestamps, and every money figure.

### Named Rules

**The Measurement Rule.** Money, quantities, part numbers, coordinates, dates, and
codes are set in Roboto Mono with tabular figures. Monospace is for measurement,
never a costume for "technical".

**The Closed Set Rule.** Three faces exist. A fourth is a decision, not a detail,
and the answer is usually a weight or a case change instead.

**No Eyebrow Rule.** A label never sits above a heading as a kicker. The heading
carries its own weight; if a section needs identifying, the identification goes
inside the rule as the section head itself, or into the meta position at the end
of the same line.

## Layout

A 12-column sheet inside a page gutter, held to a 1400px maximum. Content sits on
one of three measures: full width for a register, 7/5 for a plate beside its
specification block, and 8/4 for a list beside its bill.

Spacing runs on a 4px unit with a deliberate rhythm: 40px between sections, 24px
between a rule and the content it governs, 16px inside a panel, 10px inside a
table cell. Space above a heading always exceeds the space below it.

A register wider than the viewport scrolls inside its own frame; the page itself
never scrolls sideways, and the frame's overflow is paint-contained so it cannot
widen the layout viewport on a phone. Which form a register takes at 390px depends
on what it is for:

- **Browsing registers** — the storefront catalogue and the positions related to a
  part — become ruled block lists, one block per part, because a shopper must be
  able to read the price and the stock without panning.
- **Working registers** — the console's queue, catalogue, and customer sheets, and
  the module reference tables — stay dense tables that scroll inside their frame.
  An operator scanning a column of figures is better served by the column than by a
  stack, and the frame makes the rest reachable.

## Elevation & Depth

**The system is flat.** There are no shadows on the sheet, no shadows on the plot,
and no tonal drop between a panel and its ground beyond one field step. Depth is
carried entirely by three line weights and by field tint:

- a **hairline** separates related rows,
- a **medium** rule bounds a frame or a field,
- a **heavy ink** rule asserts a section or a table head.

The single exception is a genuinely floating overlay (the account menu, a notice
toast), which may cast one offset, soft-blurred shadow, because a floating object
is not paper.

### Named Rules

**The No Shadow Rule.** If an element needs to look raised, it is not raised; it is
either separated by a rule or tinted one step. Shadows are reserved for objects
that actually float above the page.

## Shapes

Square. Every panel, field, button, table, and frame has a 0px radius. 1px is used
for a drawn tick, and 2px for the smallest marks (a lamp, a filter chip) so they do
not read as knife edges. There is no pill, no capsule, and no rounded card.

Borders are always 1px and always a palette rule; a 2px border means the heavy ink
weight and is reserved for a section assert. Imagery is framed by a 1px ink border
with a filled tab at its top-left corner — a plate on the sheet, never a full-bleed
background.

## Components

### Buttons

- **Shape:** square (0px), 1px border, no shadow; uppercase display face at 0.6875rem
  with 0.14em tracking.
- **Primary (`.stamp`):** cyanotype ground, sheet text, 11px/18px padding. Hover
  steps to cyanotype-deep; active steps to cyanotype-night and presses 1px down.
- **Secondary (`.stamp-2`):** transparent ground, ink border and ink text. Hover
  inverts to a filled ink ground with sheet text.
- **Destructive (`.stamp--red`):** exception red ground, sheet text, with its own
  hover, active, and disabled states.
- **Quiet destructive (`.stamp--red-quiet`):** transparent ground, exception red
  border and text, filled red on hover. Used for a per-row delete inside a register,
  where a table of filled red buttons would shout over the row's content.
- **Disabled:** hatch-free but muted — a deeper field ground, a medium rule border,
  and secondary ink, with `cursor: not-allowed`. A disabled stamp must never look
  pressable. The ink step is secondary rather than annotation on purpose: annotation
  ink on the disabled ground measures 4.07:1, under the floor for a 10px label, while
  secondary ink measures 5.7:1 (6.9:1 in the plot temperature).

### Chips

- **Style:** square, filled ink ground with sheet text for an applied filter, or a
  1px medium rule with secondary ink for a neutral tag. Label face, 0.14em tracking.
- **State:** an applied filter carries a `×` and is itself a link that removes it;
  the filter's current value is also always stated in words next to the strip.

### Cards / Containers

- **Corner Style:** square (0px).
- **Background:** sheet on sheet, plot-field on plot. A recessed field is one step
  deeper, never a shadow.
- **Shadow Strategy:** none. See Elevation & Depth.
- **Border:** 1px ink for a frame that asserts, 1px rule for a field, 1px medium for
  a field that accepts input.
- **Internal Padding:** 16px standard, 12px in a dense table cell, 24px in a plate.

### Inputs / Fields

- **Style:** 1px medium rule on a sheet ground, 10px/12px padding, square.
- **Focus:** the border becomes cyanotype and gains a 1px inset cyanotype ring. No
  glow, no outline duplication.
- **Error:** the field border turns exception red and the message names both the
  problem and the recovery, set below the field in red at 0.6875rem.
- **Disabled:** a deeper field ground with annotation ink and `not-allowed`.
- **Placeholder:** annotation ink, never lighter than 4.5:1 on its ground.

### Navigation

- **Storefront:** an ink issuer strip above a sticky sheet header. The header holds
  the drawn brand mark, the catalogue groups as the sheet index (label face,
  uppercase, a 2px cyanotype underline on the active group), a ruled search field,
  and the cart counter in the measurement face. Below lg it collapses into a ruled
  two-column group grid inside a drawer.
- **Console:** a left rail that is the sheet index — a two-digit sheet number in the
  measurement face and the sheet's name, with the active sheet filled one step
  lighter and its number in the lit tone. The rail is `hidden` below lg when closed,
  never translated off-canvas, because a fixed element outside the viewport widens
  the document's scrollable area on a phone.
- **Crumbs:** a mono path at 0.625rem with 0.14em tracking inside the page band, the
  current sheet in ink and the ancestors as links.

### Signature components

- **The drawing table (`DrawingTable`):** the storefront's opening, and the one place
  where the sheet is an instrument rather than a document. It puts one real position
  from the register on the plate and the visitor works it: the image pans by drag and
  magnifies by wheel or by the loupe control, three pins open real fields from the
  record, the rail below swaps position (click, or ← →), and the compare control lays
  the next position beside this one so the price difference between them is measured
  rather than claimed. Every figure it prints is read from the row. The display line
  lives here, and this is the only place on the storefront allowed a photograph at
  plate scale.
- **The register (`.data-table` inside `.register`):** a column-numbered bill of
  materials. Numbered column heads, positions and part numbers in the measurement
  face, a lamp for stock, a right-aligned money column, and a working per-row action.
  Browsing registers become ruled block lists below `lg`; working registers keep their
  columns and scroll inside their own frame.
- **The specimen plate (RegisterPlates):** the catalogue's *primary* shape, on both surfaces. A plate is
  still a register entry, not a marketing tile — the same fields in the same order
  (position, part number, designation, group and brand, stock as a lamp and a word,
  unit price) plus the same two actions, measured with the same rules. What changes is
  the shape: one part per plate, three or four to a row, so a thing can be found by
  its face instead of its row. It exists because columns are the right device for
  *comparing* a hundred and eighty-four positions and a poor one for *browsing* them,
  and the console previously offered only columns. Plates are the default; the
  register stays one press away in the console, and the choice is remembered. Neither
  shape is master: a surface that shows a catalogue picks the one its reader came for.

  It is written against the **re-tintable tokens** — `--color-sheet`, `--color-ink`,
  `--color-rule`, `--color-cyan` — not against the plot palette, which is what lets
  one component serve the operator console (inside a `.plot` surface) and the
  storefront (on the issued sheet, in either theme) with no tone prop, no variant and
  no second copy to drift. What differs by surface is the *action*, which is a slot: an
  operator edits and deletes, a customer puts the part in the bag.
- **The lamp (`.lamp`):** a 9px drawn square, filled (lit), half-filled, or hollow,
  always paired with an uppercase word. Status never depends on colour alone.
- **The dimension string (`.dim`):** end ticks, a hairline span, and a centred
  measurement label. It measures one figure against the element above it.
- **The plate (`.plate`):** a 1px ink frame with a filled tab naming the figure,
  carrying a reference image and nothing else.
- **The title block (`.title-block`):** a ruled grid of label/value cells identifying
  the sheet — sheet class, revision date, scale.
- **The instrument (`.instr`):** the cursor. See Motion.

### Motion

Motion is seven named moments, each with a job, written in `resources/css/app.css`
under `Motion`. They are deliberately not one entrance repeated on every section:

1. **Plot** — a rule is drawn from the left, once, to open a sheet. Used on the
   drawing table's spine and the register's section head, never twice in a viewport.
2. **Measure** — a dimension string or a callout extends to its reading. This is the
   drawing table's answer to a click on a pin.
3. **Snap** — the instrument's head fills and names what it is over, and a register
   row draws a hairline under itself as it is read.
4. **Settle** — a section arrives once, when first reached, staggered by position.
   `useSettle` arms only what is below the fold: content already on screen is content
   the reader is looking at, and fading it in delays the thing they came for.
5. **Write** — a register's lines arrive in turn, 26ms apart and capped at the twelfth
   row. A filtered register reads as a page being ruled rather than a table swapped.
6. **Count** — a figure counts up to its value as it enters view, and starts at its
   **real** value: it is rewound to zero only in the frame the count begins. A figure
   that is only right once something scrolls it into view is worse than one that does
   not move. The formatter runs at every step, so the currency mark and separators are
   correct throughout — the digits move, nothing else does.
7. **Reveal** — the temperature switch. A circle grows from the control that was
   pressed until it clears the furthest corner, using the View Transitions API: the
   new sheet is revealed by a hard edge travelling outward, not dissolved into the old
   one. Where the API is absent or motion was declined, the temperature simply changes.

Two further gestures are attached to specific controls rather than being moments:
a **magnetic** stamp leans a few pixels toward the pointer (opt-in, on the few
controls that are the point of their surface — a page where every button dodges the
cursor is a page you cannot aim at), and the drawing table's **plate drifts** toward
the pointer while it is unmagnified.

Every animated state has the finished state as its default, so nothing is ever hidden
behind a script that might not arrive, and `useSettle` carries a net: anything still
armed five seconds after it was armed is released regardless. An intersection observer
reports the changes it observes, and a jump — End, a dragged scrollbar, a restored
scroll position — can carry a section from below the viewport to above it without it
ever having been inside it. The worst case is "arrived a little late", never "hidden
for ever".

Easing is exponential ease-out (`--ease-plot`) for arrival and a hard, mechanical
curve (`--ease-cut`) for state changes.

**The Motion Is A Setting Rule.** Motion is a property of this application, not a hint
taken from the operating system, and the two must not be confused. `data-motion` on the
root is `full` unless the reader has turned it down **here**, and the switch sits beside
the temperature switch in every layout. It is deliberately not derived from
`prefers-reduced-motion`: an operating-system flag is neither consent nor a request
about this application, and treating it as a verdict removed the thing the sheet is
made of — silently, on the strength of a preference set for some other reason.

What the setting does not do is hide. A reader who needs the sheet to hold still can
say so, the choice is remembered, and turning it down is a quieter application rather
than a broken one: transitions stop, the cursor's ring stops trailing, the crosshair
stays. `useMotionReduced` is a subscribable value, so throwing the switch re-arms the
hooks already on the page instead of waiting for a reload.

### The instrument

On a fine pointer the platform cursor is replaced by a drafting crosshair: a drawn
head, a live `X / Y` readout in the measurement face, and a label naming what is under
it (Tautan, Aksi, Pilih, Ketik, Ukur, Geser). It writes to the DOM through refs inside
one animation frame loop; a React state update per `pointermove` would re-render the
tree sixty times a second for nothing.

**Every pointer state the platform distinguishes is drawn.** The crosshair is the
default; over a text field it becomes an **I-beam** — a 1px stem with two serifs, the
mark a text cursor has worn for forty years — and drops the axes and the ring, because
a crosshair over a field would say the sheet is measuring when it is not; over a
button, a link or a select the head fills and the label names it (`Aksi`, `Tautan`,
`Pilih`); over the drawing table's plate it opens to the measuring ring (`Ukur`).
Nothing hands the pointer back to the platform. A system arrow appearing in the middle
of a drawing sheet is the one object on the page made by somebody else.

That suppression is written **outside every cascade layer**, and the placement is
load-bearing: Tailwind's `cursor-pointer` and friends are utilities, utilities are
emitted after components, so a suppression rule inside `@layer components` loses to a
`cursor-pointer` class however it is phrased. Unlayered declarations beat every layered
one, so the suppression wins without an `!important`.

The instrument's temperature is set from JS, not from CSS ancestry: it is mounted as a
sibling *after* the app root, so no descendant or sibling selector can reach the page
it floats over. It reads the dark temperature from either signal — a `.plot` surface,
or the reader's theme — and is observable on both.

**The Instrument Is Not A Toy Rule.** It takes over only where it can do the job: a
fine pointer on a hover-capable device. Every other case keeps the platform cursor, so
touch and keyboard users lose nothing.

### The scrollbar

Written against the same tokens as everything else, so it re-tempers with the surface
it belongs to: a recessed track (`--color-sheet-2`) with a hairline rule down its edge,
a mid-weight thumb (`--color-rule-2`) inset 4px inside it, stepping to cyanotype under
the pointer and to cyanotype-deep while held. Square. Firefox takes
`scrollbar-width`/`scrollbar-color`, WebKit takes the pseudo-elements, and both resolve
from the same two names — which is what let the dark theme be a root-level retint
rather than a second set of rules.

### The boot sheet

The document ships a boot screen inline, with its own critical CSS, because it is the
one surface that has to be correct before a byte of the bundle has arrived. It is a
sheet being drawn: four edges drawn in sequence from their own corners, registration
marks, the mark and wordmark, and a title block.

Its four stages are **real milestones**, not a timed animation wearing their names:
`01 Struktur` the document parsed, `02 Huruf & garis` the stylesheet and the
self-hosted faces settled, `03 Mesin gambar` the application entry executed,
`04 Meja siap` React has mounted. Nothing reports progress it cannot measure. It
dismisses one frame after mount — not on mount, or the reveal would lift over an empty
document — and it carries a fail-safe that clears it after nine seconds so a bundle
that never arrives cannot seal the sheet behind a cover.

Type in the boot sheet is set in the **system** monospace, not the self-hosted
measurement face: that face arrives with the stylesheet, and naming it here would swap
the boot text mid-draw.

### The route loader

Inertia's own progress rule, kept and stripped of its glow and gradient tail: a 2px
cyanotype rule with a square head, the same weight as every other rule on the sheet.
Beside it, a chip that names the sheet being fetched — a bar with no name on it could
be loading anything. It waits 220ms before appearing, so a fast visit never flashes it.

### Delivery

The application is one page. Navigation resolves a route to a lazily imported chunk
and swaps it without a document load, so the shared runtime is downloaded once and
cached, and each surface costs 15–29 KB. Third-party code is pinned to its own chunks,
so React's hash survives application changes; the charting library and the notice
library load only on the surfaces that use them. Links prefetch on hover.

## Do's and Don'ts

### Do:

- **Do** write component colours against the token names (`--color-ink`,
  `--color-sheet`, `--color-cyan`, `--color-red`) so the same component works on the
  sheet and on the plot.
- **Do** set every figure — money, count, date, part number, coordinate — in the
  measurement face with tabular figures, and right-align a column of them.
- **Do** state a status as a lamp plus a word, so it survives greyscale and a screen
  reader.
- **Do** separate with rule weight and field tint before reaching for any other
  device.
- **Do** keep one display line per viewport, and keep body copy between 58 and 74
  characters.
- **Do** name the real action on every control ("Tambah ke tas", "Kirim pesanan",
  "Simpan perubahan") and make every empty and error state name both the problem and
  the recovery.
- **Do** keep the page's own scrollbars horizontal-free: a wide register scrolls
  inside its frame.

### Don't:

- **Don't** introduce a second chromatic colour. Red is reserved for rejection and
  destruction.
- **Don't** round a corner, add a shadow to a sheet surface, or use a gradient,
  glass, or decorative blur.
- **Don't** put a kicker or eyebrow label above a heading, and don't number sections
  decoratively — the only numbers allowed are ones that carry real sequence,
  coordinate, or column information.
- **Don't** render status as a coloured pill, and never let colour be the only
  carrier of a state.
- **Don't** use monospace for prose or as a costume for "technical"; it is for
  measurement.
- **Don't** build the page from equal cards of icon plus heading plus text, and never
  nest a card inside a card.
- **Don't** add a `.plot` rule for a component state (`:hover`, `:focus`,
  `:disabled`) — it ties with the base rule on specificity and silently overrides it.
- **Don't** print a commercial claim the data cannot support: no shipping promises,
  tax lines, guarantees, return windows, testimonials, or certifications.
