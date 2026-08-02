# Argument Atlas (Debattic) — Project Requirements

This file merges the original `requirements.md` with `design/requirements-delta.md`, which had accumulated a second UI/backend redesign pass as a stand-alone amendments document. The delta is retired; this is now the single source of truth. Sections below are marked **(build status)** where the current codebase (`backend/`, `frontend/`) is known to diverge from or not yet cover the spec.

---

## Project Overview

**Debattic** is a platform that helps citizens understand what other citizens think. It structures arguments and debates so that public discourse becomes easier to navigate — surfacing what people find persuasive, and over time generating structured data that can supplement polling and public policy analysis.

Debattic is the technology project of the **Engage for Australia** movement. EfA's mission is to make public discourse more informed by facts and more relevant to the needs of communities. Debattic is the structured debate tool that supports that mission.

The design philosophy is closer to Wikipedia than to a social network: the **argument or debate is the unit**, not the person or the post. Structure and quality matter more than recency or individual identity. Users are expected to improve and refine shared content, not just publish and move on.

**Naming:** TBD — Debattic / Argument Atlas / Crux remain in contention. The EfA affiliation informs the values but is not dominant in the product's own branding.

**Tagline:** *Arguments worth having.*

**Copy voice:** Clear, serious, and warm — not casual, not academic. Short sentences. Treat the user as an intelligent adult who chose to be here. Focus debates on arguments and positions, not on people.

The platform's values — civic purpose, evidence discipline, respect for the effort of participation, and the belief that changing your mind is honourable — are expressed through the product itself, not through explicit EfA branding.

---

## Core Principles

- **Structure over time**: debates and arguments are persistent, improvable objects — not a feed
- **Community over individual**: arguments are collaboratively maintained; attribution is secondary to quality
- **Anonymised aggregate data**: demographic data is captured to enable policy-relevant analysis but is never presented or used at the individual level
- **Weak arguments surface organically**: there is no "debunked" designation. Arguments that score low on both agreement and quality appear in the Weak quadrant of the scatterplot. The community verdict is the verdict — no moderator labels required
- **Rating comes after reading.** Nobody is asked to judge a claim above the material that explains it — voting sits at the bottom of the page, after context and both directions of argument.
- **Never let a relationship be legible only by position on the page.** Colour, column, or layout never carry meaning alone — the relation is always also stated in words.

---

## One object type: the Claim **(build status: shipped)**

Debates and arguments collapse into **one type: a claim**. An argument is just a claim with a connection to a parent claim. There is no separate argument page and no separate results page — a claim page shows the claim, what it connects to in both directions, and its analytics, in one fixed order:

1. **Claim header** — classification badges, claim, one-line description
2. **Context & history** — background prose, a dated "how we got here" timeline, a note on where the disagreement actually sits, and claim metadata (age, revisions, connection count, evidence count)
3. **Where this claim is used** — the upward direction: parent claims this one supports or contradicts, including uses in other debates, visibly marked as such. A claim cited as decisive in four places has four things depending on it — this view is what makes that exposure legible.
4. **What supports it / What contradicts it** — the downward direction, two columns
5. **Rate this claim** — the two voting signals, presented last, beside the results plot

This supersedes the original Phase 1 plan of separate `debate/[id]`, `argument/[id]`, and `results/[id]` pages.

---

## Colour Palette **(build status: shipped, replaces earlier palette)**

Structure is broadsheet — ink typography, hairline rules, no decorative colour. Hues carry meaning only. Two themes, one token set.

### Light — "Warm broadsheet" (L1)

| Token | Role | Hex |
| --- | --- | --- |
| `--ground` | page background | `#F7F4EE` |
| `--surface` | cards, rows, header | `#FFFFFF` |
| `--surface-alt` | secondary band inside cards | `#FBF8F2` |
| `--rule` | borders, hairlines | `#DCD5C8` |
| `--rule-soft` | internal dividers | `#E7E1D6` |
| `--text` | primary text | `#171512` |
| `--text-2` | secondary text | `#6E6558` |
| `--text-3` | metadata, muted | `#A39B8D` |
| `--primary` | nav, links, CTA | `#14636B` |
| `--accent` | tags, dates | `#B5701A` |
| `--supports` | supporting relation | `#4F7A52` |
| `--supports-ink` | supporting text on light | `#3D5F40` |
| `--contradicts` | contradicting relation | `#B24A2E` |
| `--track` | empty bar track | `#EFEAE0` |

Quadrant washes: steelman `#F3EFE7`, compelling `#E8EFE6`, weak `#FBFAF7`, partisan `#F7E7E1`.

### Dark — "Ink night" (D1)

| Token | Hex |
| --- | --- |
| `--ground` | `#16130F` |
| `--surface` | `#1E1A15` |
| `--rule` | `#322B22` |
| `--text` | `#EFE8DB` |
| `--text-2` | `#A0968A` |
| `--text-3` | `#6B6357` |
| `--primary` | `#58B6BA` |
| `--accent` | `#D9A441` |
| `--supports` | `#7FA86A` |
| `--contradicts` | `#D9714F` |

D1 is the same hue family rotated onto a warm near-black, so the themes map token-for-token.

**Dark mode is a requirement, not an option.** Defaults to `prefers-color-scheme`; the nav toggle overrides and persists (localStorage, then the user record once authenticated).

### Type

- Headings and claims: **Source Serif 4**
- UI and body: **Public Sans**
- Labels, metadata, timestamps, axis labels, scores: **IBM Plex Mono**

Never use colour alone to carry the supports/contradicts distinction — the relation is always also stated in words.

### UI Preferences

- **Dark / light mode** — as above.
- **Compact view** *(build status: not yet implemented)* — a layout density preference that reduces card padding, inter-card gaps, and line height by one step, for users who want to see more content without scrolling. Intended as a `data-view="compact"` attribute on the root element — no separate component variants needed.

---

## Connection strength **(build status: shipped)**

`Connection` (formerly `ArgumentSupport`) carries a community-rated strength: **tangential / relevant / decisive**.

- Rated **on the connection, not the claim** — the same claim can be decisive in one debate and tangential in another. The rating is per parent–child pair.
- Rendered in list rows as a horizontal bar whose **thickness** encodes the value: decisive 7px, relevant 4px (65% opacity), tangential 2px (40% opacity). Bar colour follows the relation.
- The same 7/4/2px thicknesses are reused for the distribution bars inside the hover card, so the row mark and the chart are one visual language.
- **No standalone legend.** The explanation lives in the hover card attached to the bar it describes.

Definitions (used verbatim in tooltips):

| Value | Supporting connection | Contradicting connection |
| --- | --- | --- |
| Decisive | The parent claim largely stands or falls on this one. | It defeats the parent claim if accepted. |
| Relevant | It adds real weight, but the parent claim survives without it. | It counts against the parent claim without settling it. |
| Tangential | True perhaps, but it does little work for this claim. | True perhaps, but it does not land against this claim. |

Community votes are a signal, not the setting — an editor sets each connection's **stated strength** separately (see Editing, below), with the vote distribution shown as reference above the control.

---

## The hover card **(build status: shipped)**

Every connected-claim row in every direction — upward and downward — opens the same card on hover (tap on touch; focus for keyboard). The card floats: nothing in the list below it moves. It opens downward when near the top of the viewport and upward otherwise.

Two labelled bands, answering two different questions:

**Band 1 — "The claim itself"**
- The claim's body text
- Type and evidence-strength badges
- Two score bars: *People agree* and *Well made*, plus the rater count (see Voting, below, for the scale actually used)
- A miniature two-axis plot (x = agree, y = well made) showing the rating distribution
- Labels are dotted-underlined and explain themselves on hover — no explanatory body copy in the card

**Band 2 — "As used here · supports/contradicts"**
- A sentence naming the relationship in full (e.g. "Supports '<parent claim>'") so the relation is never legible only by column position
- A distribution bar chart of decisive / relevant / tangential votes for *this connection*, using the 7/4/2px thicknesses
- A **Vote** control to the right of each bar, so voting happens on the value being voted for
- Term labels dotted-underlined, with the connection-strength definitions on hover

**Footer** — the claim's own graph counts and a **"Read more and rate it →"** call to action.

The two bands must remain visually distinct. Their job is to keep apart "is this claim any good?" and "how much does it do for the claim it's attached to?" — these are independent judgements and the UI must never blur them.

**Mobile** *(build status: `useIsNarrow` fallback shipped)* — hover cards fall back to tap-to-expand inline instead of a floating card on touch/narrow viewports; the two-column supports/contradicts grid stacks.

**Accessibility:** everything on hover must also work on keyboard focus and tap.

---

## Voting

Each vote captures two independent signals on a claim, kept deliberately separate from connection-strength voting (which is cast only from the hover card or the claim's own page):

- **Signal 1 — "Do you agree?"** Captures the personal effect of the claim — whether it moved the user — independent of how well it is constructed. This is the core opinion-polling signal.
- **Signal 2 — "Is this well constructed?"** Captures perceived quality, independent of personal agreement. A user who was not persuaded can still rate a claim as well-constructed (the "steelman" signal — valuable for policy analysis).

**Scale — (build status: shipped as binary, deviates from original 5-point design).** The original spec called for a 5-point scale per signal with a thumbs-based quick-vote plus an optional refinement modal. The shipped implementation uses a plain **yes/no vote per signal, displayed as a percentage** of respondents — a deliberate simplification agreed with the project owner, trading distributional nuance for a much lower-friction voting UI. The two-axis scatterplot (below) still reads as a distribution because it plots the *aggregate* percentages across many binary votes, not a single respondent's 5-point position.

One interaction per user per claim (both signals captured together); users can update their vote at any time.

**Scatterplot (results view)**
- X-axis: agreement · Y-axis: quality — **both axes must be labelled**
- Quadrant overlay: **Compelling** (high/high, consensus pick), **Steelman** (low agreement/high quality — well-argued but didn't move people, uniquely valuable for policy analysis), **Partisan** (high agreement/low quality), **Weak** (low/low — broadly dismissed, no special label or moderation action; the score is the signal)
- Rater count appears exactly once per page, in the stats row beneath the plot
- A miniature, cached version of the same plot appears on hover cards and rows without a live fetch

---

## Classification tooltips **(build status: shipped)**

Every classification badge explains itself on hover, focus, or tap. Same copy wherever the badge appears — claim header, hover card, editor.

| Badge | Copy |
| --- | --- |
| Fact | A claim about what is the case. It can be checked against evidence, and evidence can settle it. |
| Opinion | A judgement about how to read the facts. Legitimate, but not the kind of claim evidence alone can settle. |
| Value | A claim about what matters or what is right. Rests on principles rather than evidence — disagreement here is not error. |
| Proposal | A claim about what should be done. Usually stands on facts and values underneath it, which can be argued separately. |
| Strong evidence | Supported by sources that directly substantiate the claim — research, official data, primary documents. |
| Moderate evidence | Supported, but indirectly or partially: reporting, secondary analysis, or evidence covering part of the claim. |
| Weak evidence | Sources are thin, contested, or only loosely connected to what the claim actually asserts. |
| No evidence | Nothing attached yet. Not a verdict on the claim — an invitation to supply what is missing. |

---

## Editing **(build status: shipped, identity model incomplete — see Open Items)**

Editing happens in a **side panel** beside the live claim, never on a separate page. Three tabs: Write / Evidence / History.

- **Write** — claim, body, type, evidence strength, tags, and a required one-line "why this change?"
- **Evidence** — attach and remove evidence items (type, citation, URL); also hosts per-connection strength editing
- **History** — revision list with author, date and change summary; readable diff; revert without leaving the page
- Entry points: the edit affordance on any claim, and a one-time dismissible prompt after a low quality rating: *"You rated this claim as poorly constructed — want to help improve it?"*, linking directly to the edit view

**Structural changes do not require moderator approval.** Re-parenting a claim, or flipping it between supports and contradicts, is an ordinary edit: it publishes immediately, appears in history, and anyone can revert it. (The original spec left structural-move approval as for-vs-moderator TBD; this resolves it in favour of the open-edit model, backstopped by contested status below.)

Per-connection strength editing: the distribution (decisive/relevant/tangential counts, same bar thicknesses) is shown as reference above a segmented control that sets the connection's stated strength; a one-line reason is required; the change is recorded in history and anyone can revert it.

Debate titles, descriptions, and claim content are all community-editable, per the original Wikipedia-model principle. Any registered user can create new claims and submit new connections/evidence; new content goes live immediately, subject to the contested-status safety valve below.

---

## Contested status **(build status: entry logic shipped; no review/exit UI — see Open Items)**

A claim enters **contested** status when:

1. Three or more reverts by different users inside 24 hours
2. Flags from more than a handful of distinct accounts
3. A moderator applies it directly, with a public reason

While contested, edits by non-moderators queue for review before publishing. Reading, rating and commenting stay open — only publishing waits. The status and its reason are shown publicly on the claim. It expires automatically after a quiet period; there are no permanent locks.

Data model: `contestedAt`, `contestedReason`, `contestedUntil` on the claim; pending edits held as `ClaimRevision`/`ConnectionRevision` rows with a `pending` flag.

This is distinct from the separate, not-yet-designed **Argument Lock** concept (see Open Items) — contested status is an automatic, temporary, community-triggered pause; a lock would be a persistent, moderator-only action.

---

## Accounts and sign-in **(build status: shipped, Google + Microsoft live; identity not yet enforced server-side — see Open Items)**

Real accounts via **Better Auth** (Prisma-adapted, self-hosted) replace the original NextAuth-credentials-only plan and the anonymous-only model. Any combination of the methods below can be linked to one account.

**Methods**
- Email + password, with required email verification before the account is treated as verified
- Forgotten-password reset by email link
- App-based 2FA (TOTP: QR enrolment + backup codes), optional, enabled from account settings
- Passkeys (WebAuthn), any number per account, added from account settings
- OAuth2: Google and Microsoft are live; Apple, Facebook, Twitter/X, Discord and Reddit are wired in code and rendered in the sign-in/sign-up UI in a fixed order, but shown disabled with a "coming soon" mark until credentials are configured — nothing is hidden, so the eventual rollout doesn't change layout
- Account linking is enabled across all methods (email-password counts as a linkable method), so a person can add e.g. Google to an account they first created with a password

**Demographic fields, collected at sign-up (all optional)** — supersedes the original "age range / region / political orientation" placeholder fields:
- Postcode, with a lookup that resolves state deterministically and federal electorate from a curated reference table where available (postcodes can span more than one electorate; there is no complete authoritative postcode→electorate dataset, only AEC GIS boundaries, so the UI falls back to state-only plus a link to the AEC's own tool when an electorate can't be resolved)
- Gender, age range, education level, relationship status — option sets chosen to align with how Newspoll/Essential and similar firms report cross-tabs, so this platform's aggregates read the same way

**Privacy rule — aggregate-only cross-tabs**, fulfilling the original "never presented at the individual level" principle:
- Individual votes are never joined to a person's demographic profile in any API response
- Demographic breakdowns are served only as per-value aggregates (`GET /claims/:id/demographics/:dimension`), and any group smaller than a minimum size (20 raters) is dropped from the response entirely rather than shown with a small, potentially re-identifying count — the same small-cell suppression pollsters use
- This is enforced at the query layer (`claimVoteDemographicBreakdown`), not just as a UI convention

A published privacy policy covering this (what's collected, aggregate-only use, retention, right to deletion) is still required before any real user signs up — see Open Items.

---

## Access model and roles

*(build status: not yet implemented — every account today has identical access; this whole section is forward-looking)*

| Role | Access |
| --- | --- |
| **Public (unauthenticated)** | Read claims and their connections, results — no voting, editing, or flagging |
| **Registered user** | Vote (both signals, updatable), create claims/connections, edit content, flag content, attach evidence, use tags and search |
| **Contributor** *(Phase 3)* | All of the above + lightweight moderation |
| **Moderator/Admin** | Full moderation: delete, ban, revert, manage invites and tag taxonomy, apply/lift contested status, review the pending-edit queue |

**Launch access model (undecided against current build):** the original spec called for invite-only registration at MVP, widening to open registration in Phase 3. The shipped sign-up flow is currently open registration with no invite gate — this needs an explicit decision before wider release: either build the invite gate, or consciously drop it and update this section.

---

## Data Models

Current schema (`backend/prisma/schema.prisma`), renamed from the original Contention/Argument language to match the shipped one-object-type model:

### Claim (formerly Contention + Argument, now unified)
- Slug, title, one-liner, body
- Type: fact / opinion / value / proposal
- Evidence strength: none / weak / moderate / strong
- Tags (string array; original spec's separate `Tag` model with admin-managed taxonomy is not yet built — see Open Items)
- Context block: background prose + dated timeline
- Contested fields: `contestedAt`, `contestedReason`, `contestedUntil`
- Revision history, votes, reverts, flags
- Connections in both directions (`usedIn` / `arguedBy`)

### Connection (formerly ArgumentSupport)
- `fromClaimId`, `toClaimId`, `relation` (supports/contradicts), `statedStrength` (tangential/relevant/decisive), `statedReason`
- Community strength votes, revision history

### ClaimVote
- `agree` (boolean), `wellConstructed` (boolean) — see Voting scale note above
- One per (claim, voter)

### EvidenceItem
- Type, citation, URL, linked claim. Evidence-type taxonomy (academic research, official data, official report, legal text, think tank/NGO, journalism, fact-check, poll or survey, video, primary source, personal/blog) carries over unchanged from the original spec.

### ClaimRevision / ConnectionRevision (formerly EditHistory)
- Author, summary, snapshot, `pending` flag, timestamp

### ClaimRevert / ClaimFlag
- Feed the contested-status auto-trigger logic

### User / Session / Account / Verification / TwoFactor / Passkey
- Better Auth's standard tables plus the demographic fields listed under Accounts, above

### Postcode
- Reference table for the postcode → state/electorate lookup

**Not yet modelled:** a `Tag` entity with admin-managed taxonomy (tags are currently a free string array on `Claim`); a `role` field on `User` for moderator/admin distinction; an invite/invite-code model.

---

## Tech Stack **(build status: current, differs from original plan)**

| Layer | Original plan | Shipped |
| --- | --- | --- |
| Frontend framework | Next.js (CRA initially prototyped) | Next.js 16, App Router, Turbopack |
| Backend | Next.js API routes | Standalone Express 5 API |
| Database | SQLite → Postgres for production | Postgres (local `prisma dev`) from the start |
| ORM | Prisma | Prisma (`prisma-client` TS generator) |
| Auth | NextAuth.js, credentials only | Better Auth — email/password, OAuth, TOTP, passkeys |
| Realtime | Pusher | Not implemented (not currently required) |
| Styling | Tailwind CSS | CSS Modules + design-token CSS custom properties |
| i18n | `next-intl`, all strings externalised from day one | Not implemented — see Open Items |
| Deployment | Vercel | Not yet decided (split frontend/backend changes the deployment shape Vercel alone assumed) |

---

## Non-Functional Requirements

- **Performance:** Fast page loads; scatterplot data precomputed and cached on claim/connection records, not fetched live.
- **Accessibility:** WCAG compliant, keyboard navigable; colour coding always supplemented with text labels (not colour-only encoding). Hover-card interactions must also work on keyboard focus and touch.
- **Mobile:** Reading, voting, creating claims, submitting evidence, and tagging all supported on mobile. Complex editing (version comparison, revert, structural moves) is designed for desktop but not blocked on mobile.
- **Internationalisation:** All UI strings externalised into translation files via `next-intl` from day one — **not yet done**. English only at launch either way.
- **Security:** Input sanitisation, rate limiting, secure auth, no individual-level demographic exposure. **Currently a gap**: mutating API endpoints trust client-supplied identity (`x-voter-id` header, freeform `authorName`) rather than the authenticated session; there is no rate limiting or moderator-only gating on any endpoint yet. See Open Items.
- **Privacy:** GDPR/Australian-Privacy-Act-aware data handling; privacy policy published before real users are onboarded — **not yet drafted**.

---

## Out of scope

### Permanently out of scope
- Mobile native apps
- Individual-level demographic data presentation (always anonymised and aggregate)
- "Debunked" designation — claim quality is determined by community votes, not moderator labels

### Deferred to a later phase
- Contributor role (lightweight moderation tier below full moderator/admin)
- User contribution history pages
- Social network integrations, showing what a user's network thinks vs. general public
- Ingesting external polling data for comparison
- Argument-vs-sibling comparison view
- Third-party API

---

## Open Items

Carried over from `requirements-delta.md`'s "Open / not yet designed" plus gaps identified in a subsequent requirements/security/architecture review:

- **Server-side identity enforcement.** Voting (`x-voter-id`) and editing (`authorName`) both trust client-supplied values instead of the authenticated session. This needs fixing before the account system is actually meaningful for attribution or abuse prevention — currently anyone can vote or edit as any identity.
- **Moderator role.** Contested status assumes "a moderator applies it directly," but there is no `role` field or moderator concept anywhere yet, and no UI to review the `pending` edit queue a contested claim accumulates.
- **Rate limiting.** None exists on vote/flag/revert/sign-up endpoints.
- **Request validation.** No schema validation (e.g. zod) at the API boundary; malformed enum values currently 500 instead of 400.
- **Access model decision.** Invite-only (original spec) vs. open registration (shipped) needs an explicit call.
- **Tag taxonomy.** Admin-managed `Tag` model with search, vs. the current free-string tags array.
- **Search.** Claim titles/content/tags — specified in the original MVP scope, not yet built (homepage is currently an unfiltered list).
- **Argument Lock** *(distinct from contested status)* — a moderator-only persistent lock on a single claim, design still open: scope (edits/votes/both), duration, public visibility of reason, escalation path from a flag.
- **Privacy policy** — must be drafted and published before real users sign up, given demographic + political-opinion data collection.
- **Compact view** UI density preference — specified, not built.
- **i18n scaffolding** (`next-intl`) — specified, not built.
- **v7 hover-card changes agreed but not yet drawn**: move the claim's own supporting/contradicting list and the CTA into band 1 of the hover card; rewrite relationship headings so the referenced claim is named inline rather than implied by column position.
- **Plain-language mechanism** (glossary terms, or a required plain-English summary per claim) — deferred, not dropped.
- **Sentiment fields** — legacy `sentimentScore`/`sentimentLabel` from the pre-unification schema; confirmed removed in the current schema, no action needed.

---

Last updated: 2 August 2026.
