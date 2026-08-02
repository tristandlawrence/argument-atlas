# Brief for Claude Code — Argument Atlas UI redesign

Paste this into Claude Code from the root of `tristandlawrence/argument-atlas`.

---

## Context

The UI in `code/` was built before the design work and does not reflect it. Two files from the design project are the source of truth — copy them into the repo (suggest `design/`) before starting:

- **`requirements-delta.md`** — the written spec: palette tokens, page model, connection strength, hover card, voting copy, tooltips, editing, contested status. Read this first.
- **`Argument Atlas v7.dc.html`** — the visual reference. Ignore its framework; read it for structure, exact hex values, spacing, type sizes and copy. `Argument Atlas v4.dc.html` additionally holds the palette options, the context-and-history section, and the dark mode pass.

Where the two disagree, `requirements-delta.md` wins.

---

## What to build, in order

### 1. Design tokens and theming
Replace the palette in `code/src/app/globals.css` with the L1 light / D1 dark token sets from `requirements-delta.md` §1. Dark mode is a `data-theme` attribute on `<html>`, defaulting to `prefers-color-scheme`, overridable by a nav toggle, persisted to localStorage. Add the three Google fonts and map them: **Source Serif 4** for claims and headings, **Public Sans** for body and UI, **IBM Plex Mono** for labels, scores and metadata.

Visual character: 1px hairline rules, near-zero border radius, no shadows except on floating cards, colour only where it carries meaning.

### 2. Data model
Extend `code/src/data/seed.ts`:

- Debates and arguments collapse into **one type** — a claim. An argument is a claim with a connection to a parent.
- Connections are first-class: `{ fromClaimId, toClaimId, relation: 'supports' | 'contradicts', statedStrength: 'tangential' | 'relevant' | 'decisive', strengthVotes: { tangential, relevant, decisive } }`. Strength lives on the **connection**, not the claim — the same claim can be decisive in one debate and tangential in another.
- Claim votes carry two independent signals: `agree` and `wellConstructed`.
- Claims gain `contestedAt`, `contestedReason`, `contestedUntil`.
- Claims gain a `context` block: background prose plus a dated timeline.

Seed enough that a claim page shows both directions, including at least two connections originating in a different debate.

### 3. Routing
Collapse `debate/[id]`, `argument/[id]` and `results/[id]` into a single `claim/[id]` route, with redirects from the old paths. There is no results page — analytics live on the claim page.

### 4. Claim page
Fixed order (delta §2): header → context & history → where this claim is used → what supports / what contradicts → rate this claim. The rating control and the two-axis plot sit at the **bottom**.

### 5. Connection rows and the hover card
The heart of it — read delta §4 and §5 closely.

**Row**: one line. A single horizontal bar at the left whose *thickness* encodes connection strength (7px decisive, 4px at 65% opacity relevant, 2px at 40% opacity tangential), coloured by relation, then the claim text. No legend anywhere on the page.

**Hover card**: floats above the list without displacing it; opens downward near the top of the viewport, upward otherwise; dismisses on mouse-leave of the list. Two labelled bands:

1. *The claim itself* — body, type and evidence badges, two score bars (agree / well made) with rater count, a mini two-axis plot, then the claim's own for-and-against arguments and a CTA reading "Read more and rate '<claim>' on its own page →".
2. *As used here* — a sentence naming the relationship in full ("Supports '<parent claim>'"), a vote distribution using the same 7/4/2px thicknesses, and a Vote button beside each bar.

Score labels and strength terms are dotted-underlined and reveal their definitions on hover — verbatim from delta §4 and §7. Do not restate them in body copy.

Accessibility: everything on hover must also work on keyboard focus and tap. On touch and narrow viewports, fall back to inline expansion instead of a floating card.

### 6. Relationship language
Never let a relationship be legible only by which column it sits in. Every relationship names the claim on the other end of it, in a sentence: "Supports '<parent claim>'", "This claim contradicts '<parent claim>'". Section headings read "What supports this claim", "What contradicts this claim", "Where this claim is used". Cross-debate connections say so in the row's context line.

### 7. Editing
A side panel, not a page. Three tabs — Write / Evidence / History — with the claim visible beside it. Diff and revert live in History. Per-connection strength editing lives in Evidence, with the community distribution shown above the control (delta §9). Structural changes publish immediately like any other edit.

### 8. Contested status
Implement delta §10: automatic entry conditions, a public banner stating the reason, edits queued while active, reading and rating unaffected, automatic expiry. No permanent locks.

---

## Constraints

- Do not invent colours. Every value comes from the token table.
- No icon libraries, illustration, or gradients.
- Keep the copy from the reference exactly — it has been through several rounds.
- Minimum body size 13px. 9px is permitted only for IBM Plex Mono uppercase with letter-spacing.
- Ship light and dark together, not dark as a follow-up.

## Out of scope

Naming (Argument Atlas / Debattic / Crux is undecided — leave the current name), the plain-language glossary mechanism, and any home or browse page work beyond applying the new tokens.
