# Argument Atlas (Debattic) — Project Requirements

This is the single source of truth for the product. Sections are marked **(build status)** where the current codebase (`backend/`, `frontend/`) is known to diverge from or not yet cover the spec. The **Roadmap** at the end sequences the open work into phases; each open item below names its phase.

**Revision note, 14 November 2026.** This revision follows a content and requirements review. It adds: a seed content policy and a new seed; a claim authoring standard; an "unsure" option and a vote history; a persuasion signal; revision semantics that protect existing votes; duplicate detection and merge; a per-claim discussion space; derived evidence strength; ordering rules; a rule on score visibility before voting; numeric contested thresholds; a statement of what the aggregates are and are not; and the phased roadmap. Nothing already shipped is reversed.

**Revision note, 14 November 2026 (later the same day).** A prototype phase is inserted ahead of everything else: the site runs locally with the new seed and no hardening, purely to gather feedback on the model and the UI. Every previously numbered phase moves back by one. Phase 1 is to be broken down further before it starts.

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
- **A claim is one proposition.** If it needs "and", "because" or a dash to hold together, it is two claims. The structure can only do its work when each node can be judged on its own.
- **The crux is a claim, not a paragraph.** Where a debate actually turns is itself something people disagree about, and it gets the same treatment as any other claim: its own supports, contradicts and votes.
- **Changing your mind is data.** The platform's most valuable signal is a vote that moved after reading. It is recorded (in aggregate), never discarded, and never shown against a person.

---

## One object type: the Claim **(build status: shipped)**

Debates and arguments collapse into **one type: a claim**. An argument is just a claim with a connection to a parent claim. There is no separate argument page and no separate results page — a claim page shows the claim, what it connects to in both directions, and its analytics, in one fixed order:

1. **Claim header** — classification badges, claim, one-line description
2. **Context & history** — background prose, a dated "how we got here" timeline, a note on where the disagreement actually sits, and claim metadata (age, revisions, connection count, evidence count)
3. **Where this claim is used** — the upward direction: parent claims this one supports or contradicts, including uses in other debates, visibly marked as such. A claim cited as decisive in four places has four things depending on it — this view is what makes that exposure legible.
4. **What supports it / What contradicts it** — the downward direction, two columns
5. **Rate this claim** — the voting signals, presented last, beside the results plot

This supersedes the original Phase 2 plan of separate `debate/[id]`, `argument/[id]`, and `results/[id]` pages.

**Claims are a graph, not a tree.** The same claim can sit under several parents, in several debates, with a different connection strength in each. Nothing in the UI or data model may assume a claim has exactly one parent.

**Question roots** *(decision: Phase 4, decide now)*. The one-object model forces every debate root to be a yes/no proposition. Some public questions are naturally multi-option ("How should Australia firm its grid?") with competing sibling proposals. Phase 4 adds a *question* framing for a root: a claim of type Proposal may be marked as one of several answers to a shared question, and the sibling comparison view (deferred below) renders them side by side. Until then, authors write each answer as its own proposal and link them with contradicting connections. This decision is recorded now so that nothing built in Phases 1–3 assumes roots are always propositions.

---

## Claim authoring standard **(new)**

These rules apply to seeded content and to the guidance shown to users in the editor. They exist because the structure only works when nodes are clean.

- **One proposition per claim.** A title that conjoins two assertions is split. "Moderation technology exists and liability supplies the incentive" is two claims with a supporting connection between them.
- **Title states the claim, not the topic.** "Negative gearing should be limited to new builds" is a claim. "Negative gearing" is a topic. A reader must be able to agree or disagree with the title alone.
- **The claim is one somebody actually holds.** Roots are framed as a position a real participant would defend, not as a strawman ("should pass in its current form") chosen to be easy to reject.
- **Type follows the claim, not the author's intent.** A Fact is checkable against evidence. An Opinion is a judgement on the facts. A Value rests on principle. A Proposal is a course of action. Misclassification is an ordinary edit and anyone may fix it (see Classification, below).
- **Facts carry evidence.** A Fact claim with no evidence item shows the "No evidence" badge and is expected to acquire one. The editor warns, but does not block, on saving a Fact without evidence.
- **The crux is a claim.** The "where the disagreement sits" note names the pivot of the debate in prose; the pivot itself is also entered as a claim and connected, so it can be argued and rated.
- **Context is written, never templated.** Background and disagreement prose is specific to the claim. Generated or copied context is worse than none.
- **Connections carry a reason.** Every connection has a stated reason that says why this claim bears on that one at the stated strength. "Matches the community distribution" is not a reason.

---

## Seed content policy **(build status: new seed shipped in `backend/prisma/seed.ts`)**

The seed is the product's first impression and the only content new users see. It is held to the authoring standard above, plus:

- **No invented public opinion on real issues.** Vote data in the seed is demo data: generated under an obviously synthetic voter id, present only so the plot and score bars render in development, and skipped entirely when `SEED_DEMO_VOTES=false` or `NODE_ENV=production`. Production launches with zero votes. The platform's purpose is to supplement polling; fabricated poll results would undermine it before it starts.
- **Fewer debates, deeper.** The seed has six debates clustered around energy and housing so that cross-debate reuse is natural. Each has at least one claim with its own arguments beneath it, and several claims appear in more than one debate.
- **The plot teaches itself.** Demo votes deliberately place claims in all four quadrants, including a well-made claim few agree with (Steelman), a popular poorly-made one (Partisan) and a weak one, so a developer or reviewer sees what the quadrants mean.
- **Evidence is real and typed.** Every Fact claim has at least one evidence item from the evidence taxonomy. Strong evidence requires a checkable URL. The seed validates this and refuses to run if it is violated.
- **One contested claim.** The seed includes one claim in contested status with a real reason, so the banner, the queue and the expiry have something to show.
- **Attribution is honest.** Revisions are authored by "Argument Atlas editors", not "Seed data". Connection reasons are substantive.
- **Nothing time-sensitive.** No debate depends on an event, a poll or a bill from the last twelve months. Content that dates within a year is created by users, not seeded.
- **No children with templated context.** The previous seed generated each child's context from its parent's; the current schema makes context required, so each claim's context is written by hand. If that proves unsustainable as content grows, make the fields nullable and hide the section (Phase 3).

`npm run seed:check` validates the content and prints graph statistics without touching the database. `npm run seed` replaces all claim data.

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
- **Compact view** *(build status: not yet implemented — Phase 4)* — a layout density preference that reduces card padding, inter-card gaps, and line height by one step, for users who want to see more content without scrolling. Intended as a `data-view="compact"` attribute on the root element — no separate component variants needed.

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

Connection strength measures **logical dependency**: how much the parent relies on the child. It does not measure whether the child persuaded anyone. That is a separate signal (see Voting → Persuasion).

---

## The hover card **(build status: shipped)**

Every connected-claim row in every direction — upward and downward — opens the same card on hover (tap on touch; focus for keyboard). The card floats: nothing in the list below it moves. It opens downward when near the top of the viewport and upward otherwise.

Two labelled bands, answering two different questions:

**Band 1 — "The claim itself"**
- The claim's body text
- Type and evidence-strength badges
- Two score bars: *People agree* and *Well made*, plus the rater count (see Voting, below, for the scale actually used), subject to the score-visibility rule under Voting
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

Each vote captures independent signals on a claim, kept deliberately separate from connection-strength voting (which is cast only from the hover card or the claim's own page).

### The two core signals **(build status: shipped as binary)**

- **Signal 1 — "Do you agree?"** Captures the personal effect of the claim — whether it moved the user — independent of how well it is constructed. This is the core opinion-polling signal.
- **Signal 2 — "Is this well constructed?"** Captures perceived quality, independent of personal agreement. A user who was not persuaded can still rate a claim as well-constructed (the "steelman" signal — valuable for policy analysis).

**Scale.** The original spec called for a 5-point scale per signal with a thumbs-based quick-vote plus an optional refinement modal. The shipped implementation uses a plain **yes/no vote per signal, displayed as a percentage** of respondents — a deliberate simplification agreed with the project owner, trading distributional nuance for a much lower-friction voting UI. The two-axis scatterplot (below) still reads as a distribution because it plots the *aggregate* percentages across many binary votes, not a single respondent's 5-point position.

**Signal wording by claim type** *(Phase 2)*. "Do you agree?" reads oddly against a Fact. The label adapts to type while the stored field stays `agree`: Fact → "Is this accurate?"; Opinion and Value → "Do you agree?"; Proposal → "Should this happen?". Signal 2 reads "Is this well made?" for every type.

### Unsure **(Phase 2)**

Each signal gains a third option, **Unsure**, stored as `null` on the vote. A respondent who is forced to pick a side is a respondent whose persuadability has been thrown away, and persuadability is what a polling supplement most wants to see. Unsure votes count in the rater total, are reported as their own percentage, and are excluded from the agree/well-made percentages used for the plot. The vote control presents all three options with equal weight; Unsure is never styled as the default or the dismissal.

### Vote history **(Phase 2)**

A changed vote is the platform's most valuable event and the current schema overwrites it. From Phase 2:

- `ClaimVote` keeps the current position, as now. A new `ClaimVoteEvent` row is appended on every create or change, holding the new values, the previous values, the claim revision id current at the time, and a timestamp.
- The event log is **aggregate-only**: it is never exposed per voter in any API response, and is subject to the same small-cell suppression as demographics.
- It feeds two things: a "changed their mind" count on the claim stats row (Phase 2, display) and the persuasion analysis below (Phase 4).

### Persuasion **(Phase 4)**

The mission is "surfacing what people find persuasive". Agree measures opinion, well-made measures craft, and connection strength measures logical dependency. None of them records what moved a voter.

When a user votes on a debate root (a claim with no upward connections, or any claim with children), they are offered one optional follow-up: **"Which of these did the most work for you?"**, listing the claim's direct supports and contradicts. The answer is stored as a `PersuasionVote(claimId, connectionId, voterId)`, one per voter per root, updatable. It is displayed on the root as a per-connection count, and in the hover card for the connection. Combined with vote history it answers the question the platform exists to answer: not just what people think, but which argument changed it.

### Ordering within a column **(Phase 2)**

Nothing in the shipped build specifies how supports and contradicts are ordered within their columns. The rule: **stated strength first (decisive, relevant, tangential), then rater count descending, then creation date ascending.** Agreement percentage is never used for ordering, because sorting by popularity entrenches popular claims and buries steelmen. The rule is stated in a tooltip on the column heading.

### Score visibility before voting **(Phase 2)**

"Rating comes after reading" is a core principle, and the hover card currently shows agreement percentages on every child claim before the reader has opened it. Seeing 70% agreement before reading anchors the vote. From Phase 2:

- On a claim's own page, the score bars and plot beside the vote control are shown **after** the viewer has voted on that claim, or on request via a "Show results first" link that is remembered per viewer.
- In hover cards and rows, the miniature plot and score bars are shown as now **but without the numeric percentages** until the viewer has voted on that claim. The rater count is always shown.
- Unauthenticated viewers, who cannot vote, see everything. The anchoring concern applies to votes, not to reading.

### Scatterplot (results view) **(build status: shipped)**

- X-axis: agreement · Y-axis: quality — **both axes must be labelled**
- Quadrant overlay: **Compelling** (high/high, consensus pick), **Steelman** (low agreement/high quality — well-argued but didn't move people, uniquely valuable for policy analysis), **Partisan** (high agreement/low quality), **Weak** (low/low — broadly dismissed, no special label or moderation action; the score is the signal)
- Rater count appears exactly once per page, in the stats row beneath the plot
- A miniature, cached version of the same plot appears on hover cards and rows without a live fetch

---

## Classification **(build status: tooltips shipped; derived evidence strength and type challenge are Phase 2/2)**

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

**Evidence strength is derived, not declared** *(Phase 1)*. The badge copy already assumes this ("Nothing attached yet"), and the shipped build lets an editor set Strong on a claim with no evidence. From Phase 1: a claim with no evidence items is **No evidence**, regardless of the stored field. Phase 2 moves the rating onto the evidence item: each item carries a strength (strong / moderate / weak) set by the editor with a one-line reason, and the claim badge shows the strongest item. The claim-level field is then removed.

**Type is contestable** *(Phase 2)*. Whether something is a Fact or an Opinion is often the actual argument. Type is an ordinary editable field already; Phase 2 adds a one-click "Challenge this classification" affordance on the badge that opens the editor with the type field focused and a prefilled reason, so the challenge lands in revision history like any other edit and can be reverted.

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

### Revision semantics and vote validity **(Phase 2)**

A hundred people voted on the old wording. If the title changes meaning, their votes no longer mean what the page says they mean. From Phase 2 every revision is one of two kinds, chosen by the editor and visible in history:

- **Copyedit** — wording, typos, formatting, body prose, context, evidence, tags. The claim's meaning is unchanged. Votes carry over.
- **Substantive** — the title or the type changes in a way that alters what is being asserted. Votes cast before the revision are **archived**: they remain in the vote history (and in the aggregate record) tagged with the revision they were cast against, but the claim's live counts restart from zero and the stats row says so: "Reworded on 3 March; 84 earlier votes archived."

The editor defaults to Copyedit and asks the editor to confirm Substantive. A Substantive revision on a claim with more than 20 live votes also requires the "why this change" to be at least a sentence. Anyone can revert either kind; reverting a Substantive revision restores the archived votes. Abuse of the Copyedit label to change meaning without resetting votes is a flaggable act and counts toward contested status.

### Duplicates, merge and redirects **(Phase 3)**

Every argument-mapping platform drowns in near-identical claims. The Wikipedia model works because of merge and redirect, and this product has neither.

- **At creation**, as the user types a title, the editor searches existing claims and shows the closest matches with their type and rater count: "This may already exist." The user can connect to the existing claim instead of creating a new one. This is the single highest-leverage quality feature after search.
- **Merge** is an edit available to any registered user: it points every connection, vote and evidence item on claim B at claim A, records a Substantive revision on A with the merge reason, and leaves B as a **redirect** to A. Votes from B are archived (as above) rather than added to A, because they were cast on different wording. Merge is revertible from History for 30 days.
- **Redirects** keep every old slug resolving. A merged or re-slugged claim's old URL returns the new claim with a one-line note.
- Merge of a claim with more than 50 live votes, or in contested status, queues for moderator review rather than publishing immediately.

---

## Discussion **(Phase 3)**

The shipped contested-status copy says "reading, rating and commenting stay open", but no commenting feature exists anywhere. Wikipedia's talk page is where the argument about the article happens, and the editor's "why this change" field is not a substitute.

Phase 3 adds a **Discussion** tab to the side panel beside Write / Evidence / History. It is a flat, chronological thread per claim, for coordination about the claim: proposed rewordings, disputes about type or evidence, merge proposals. It is not a place to argue the claim itself; the claim's children are. Discussion posts carry the author's display name, are editable by their author for 15 minutes, and are moderator-deletable. They are not votes and do not affect any score. Until Phase 3 ships, the contested-status copy reads "reading and rating stay open".

---

## Contested status **(build status: entry logic shipped; no review/exit UI — see Open Items)**

A claim enters **contested** status when:

1. Three or more reverts by different users inside 24 hours
2. Flags from **five or more** distinct accounts inside seven days *(the shipped code uses these numbers; the earlier spec said "a handful")*
3. A moderator applies it directly, with a public reason

While contested, edits by non-moderators queue for review before publishing. Reading and rating stay open — only publishing waits. The status and its reason are shown publicly on the claim. It expires automatically **seven days** after entry; there are no permanent locks.

**Thresholds scale with participation** *(Phase 2)*. Five accounts can freeze any claim under the fixed rule, which is a brigading vector once registration is open. From Phase 2 the flag threshold is the greater of five and 5% of the claim's live rater count, capped at fifty, and the revert threshold is unchanged. Flags and reverts from accounts younger than 48 hours count at half weight toward the threshold.

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
- The same suppression applies to the vote-history and persuasion aggregates introduced above

**What the numbers are and are not** *(Phase 1, copy)*. Respondents are self-selected, unweighted and unverified. The aggregates describe the people who chose to rate a claim here; they are not a poll of the population and the product never calls them one. A short, permanent note beneath every demographic breakdown says so, and the "supplement polling" ambition is expressed in the project's own description, not on claim pages. With roughly a hundred raters per claim and five demographic dimensions, suppression means most breakdowns will not display at all for a long time; that is correct behaviour, not a bug.

A published privacy policy covering this (what's collected, aggregate-only use, retention, right to deletion) is still required before any real user signs up — see Open Items.

---

## Access model and roles

*(build status: not yet implemented — every account today has identical access; roles are Phase 3)*

| Role | Access |
| --- | --- |
| **Public (unauthenticated)** | Read claims and their connections, results — no voting, editing, or flagging |
| **Registered user** | Vote (both signals, updatable), create claims/connections, edit content, flag content, attach evidence, use tags and search, merge |
| **Contributor** *(Phase 4)* | All of the above + lightweight moderation |
| **Moderator/Admin** | Full moderation: delete, ban, revert, manage invites and tag taxonomy, apply/lift contested status, review the pending-edit and merge queues, delete discussion posts |

**Launch access model** *(decision: Phase 1)*. The original spec called for invite-only registration at MVP, widening to open registration in Phase 4. The shipped sign-up flow is open registration with no invite gate. **Decision: launch invite-only.** The content-quality features that make open registration safe (duplicate detection, merge, discussion, moderator queue) are Phase 3, and the first cohort of users will shape the authoring norms for everyone after them. Phase 1 adds an invite-code table and a gate on sign-up; open registration is re-evaluated at the end of Phase 3.

---

## Data Models

Current schema (`backend/prisma/schema.prisma`), renamed from the original Contention/Argument language to match the shipped one-object-type model. Phase-tagged items are additions.

### Claim (formerly Contention + Argument, now unified)
- Slug, title, one-liner, body
- Type: fact / opinion / value / proposal
- Evidence strength: none / weak / moderate / strong *(derived from evidence items from Phase 1; field removed in Phase 2)*
- Tags (string array; original spec's separate `Tag` model with admin-managed taxonomy is not yet built — Phase 3)
- Context block: background prose + dated timeline
- Contested fields: `contestedAt`, `contestedReason`, `contestedUntil`
- Revision history, votes, reverts, flags
- Connections in both directions (`usedIn` / `arguedBy`)
- *(Phase 3)* `redirectToId` — set when a claim has been merged into another; the slug resolves to the target
- *(Phase 4)* `questionId` — optional link to a shared question for sibling proposals

### Connection (formerly ArgumentSupport)
- `fromClaimId`, `toClaimId`, `relation` (supports/contradicts), `statedStrength` (tangential/relevant/decisive), `statedReason`
- Community strength votes, revision history

### ClaimVote
- `agree` (boolean, *nullable from Phase 2 for Unsure*), `wellConstructed` (boolean, *nullable from Phase 2*)
- One per (claim, voter)
- *(Phase 2)* `revisionId` — the claim revision the vote was cast against; votes whose revision predates the latest Substantive revision are archived

### ClaimVoteEvent *(Phase 2)*
- `claimId`, `voterId`, `revisionId`, previous and new values for both signals, `createdAt`
- Append-only; aggregate-only in every API

### PersuasionVote *(Phase 4)*
- `claimId`, `connectionId`, `voterId`; one per (claim, voter), updatable

### EvidenceItem
- Type, citation, URL, linked claim. Evidence-type taxonomy (academic research, official data, official report, legal text, think tank/NGO, journalism, fact-check, poll or survey, video, primary source, personal/blog) carries over unchanged from the original spec and is used verbatim by the seed.
- *(Phase 2)* `strength` (strong / moderate / weak) and `strengthReason`

### ClaimRevision / ConnectionRevision (formerly EditHistory)
- Author, summary, snapshot, `pending` flag, timestamp
- *(Phase 2)* `kind` (copyedit / substantive) on `ClaimRevision`

### ClaimRevert / ClaimFlag
- Feed the contested-status auto-trigger logic

### DiscussionPost *(Phase 3)*
- `claimId`, `authorId`, body, `createdAt`, `editedAt`, `deletedAt`

### User / Session / Account / Verification / TwoFactor / Passkey
- Better Auth's standard tables plus the demographic fields listed under Accounts, above
- *(Phase 3)* `role` (user / moderator / admin)

### Invite *(Phase 1)*
- Code, `createdBy`, `usedBy`, `expiresAt`

### Postcode
- Reference table for the postcode → state/electorate lookup

**Not yet modelled:** a `Tag` entity with admin-managed taxonomy (Phase 3); a `Question` entity for sibling proposals (Phase 4).

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
| i18n | `next-intl`, all strings externalised from day one | Not implemented — Phase 4 |
| Deployment | Vercel | Not yet decided (split frontend/backend changes the deployment shape Vercel alone assumed) |

---

## Non-Functional Requirements

- **Performance:** Fast page loads; scatterplot data precomputed and cached on claim/connection records, not fetched live.
- **Accessibility:** WCAG compliant, keyboard navigable; colour coding always supplemented with text labels (not colour-only encoding). Hover-card interactions must also work on keyboard focus and touch.
- **Mobile:** Reading, voting, creating claims, submitting evidence, and tagging all supported on mobile. Complex editing (version comparison, revert, structural moves, merge) is designed for desktop but not blocked on mobile.
- **Internationalisation:** All UI strings externalised into translation files via `next-intl` — **not yet done** (Phase 4). English only at launch either way.
- **Security:** Input sanitisation, rate limiting, secure auth, no individual-level demographic exposure. **Currently a gap**: mutating API endpoints trust client-supplied identity (`x-voter-id` header, freeform `authorName`) rather than the authenticated session; there is no rate limiting or moderator-only gating on any endpoint yet. All Phase 1.
- **Privacy:** GDPR/Australian-Privacy-Act-aware data handling; privacy policy published before real users are onboarded — **not yet drafted** (Phase 1).
- **Homepage ordering** *(Phase 2)*: the homepage currently lists claims newest-first, which is a feed and contradicts "structure over time". From Phase 2 the homepage lists debate roots (claims with no upward connections) ordered by rater count, with a tag filter; search (Phase 3) replaces it as the primary way in.

---

## Out of scope

### Permanently out of scope
- Mobile native apps
- Individual-level demographic data presentation (always anonymised and aggregate)
- "Debunked" designation — claim quality is determined by community votes, not moderator labels
- Any per-voter exposure of vote history or persuasion data

### Deferred to a later phase
- Contributor role (lightweight moderation tier below full moderator/admin)
- User contribution history pages
- Social network integrations, showing what a user's network thinks vs. general public
- Ingesting external polling data for comparison
- Argument-vs-sibling comparison view (Phase 4, with question roots)
- Third-party API
- Watchlists and notifications (the maintenance loop that keeps improvable objects improved; revisit after Phase 3 once there are enough editors to need it)

---

## Roadmap

The phases are ordered by a single rule: **learn from a prototype first, then get the data model right before it holds real data, then make contribution safe, then extract insight.** Anything that changes what a stored vote or revision *means* is in Phase 2, because retrofitting meaning onto existing rows is far more expensive than adding a column now. Growth features wait until the model can bear them. Analytics wait until there is something to analyse.

### Phase 0 — Prototype *(now; local only)*

The site runs on a developer's machine with the new seed, for the project owner and a handful of invited reviewers to look at and react to. It exists to test the model and the page design, not to collect data.

- Local hosting only. No public URL, no real users, no sign-ups beyond what is needed to exercise the UI.
- The new seed loaded (done), with demo votes on so the plot, score bars and hover cards have something to show.
- No privacy policy, no request validation, no rate limiting, no invite gate. None of these matters while the only data is seed data on one laptop. They are all Phase 1 and they all block anyone else signing up.
- Feedback gathered on: whether the claim graph reads clearly; whether the crux-as-claim pattern helps or confuses; whether the two voting signals and connection strength are understood without explanation; what the hover card gets wrong; what is missing from the claim page.
- Exit: a written list of what the prototype got wrong, folded into Phase 1 and Phase 2 before either starts.

### Phase 1 — Safe to invite anyone *(before any real user signs up)*

Prerequisites. None of these is optional and none depends on another. **This phase is to be broken into smaller, separately shippable pieces before it starts**, informed by the Phase 0 feedback; the list below is the scope, not the plan.

- Server-side identity: votes, edits, flags and reverts attributed to the authenticated session, never to a client-supplied id or name.
- Request validation at the API boundary (zod or equivalent); malformed input returns 400, not 500.
- Rate limiting on vote, flag, revert, create and sign-up endpoints.
- Invite-only registration: `Invite` table and sign-up gate (decision recorded under Access model).
- Privacy policy drafted and published; the "what the numbers are and are not" note beneath every breakdown.
- Evidence strength derived: no evidence items means No evidence, enforced at the API.
- `seed:check` runs in CI.
- Contested-status copy corrected to "reading and rating stay open".

### Phase 2 — The model means what it says *(first cohort, invite-only)*

Changes to what votes and revisions mean. Each is small; together they are the difference between a dataset and a pile of booleans.

- Unsure as a third option on both signals.
- Signal wording by claim type.
- `ClaimVoteEvent` log and the "changed their mind" count.
- Revision kinds (copyedit / substantive) and vote archiving on substantive change.
- Evidence strength on the item, with reason; claim-level field retired.
- "Challenge this classification" affordance on the type badge.
- Column ordering rule and homepage ordering rule.
- Score visibility: numbers hidden until the viewer has voted.
- Contested thresholds scaled to rater count; half-weight for new accounts.
- Moderator `role` on `User` and a minimal pending-edit review page (needed to exit contested status at all).

### Phase 3 — Contribution at scale *(open the gate, or decide not to)*

The features that make it safe for many people to add content, in the order they compound.

- Search over titles, body and tags.
- Duplicate detection at creation ("This may already exist").
- Merge and redirects.
- Discussion tab.
- Tag taxonomy with admin management.
- Full moderator tooling: queues for pending edits and large merges, apply/lift contested, delete and ban.
- Nullable context fields and a hidden empty context section, if hand-written context is not keeping up.
- Re-evaluate open registration.

### Phase 4 — Insight *(enough data to learn from)*

- Persuasion signal: "Which of these did the most work for you?"
- Mind-change analytics by claim and by connection, aggregate-only.
- Question roots and the sibling comparison view.
- Demographic breakdown presentation beyond the raw endpoint.
- Compact view, i18n scaffolding, Contributor role.
- Argument Lock design, if contested status has proven insufficient.

### Deliberately not scheduled

- Watchlists and notifications: wait for evidence that editors need them.
- External polling ingestion, social integrations, third-party API: wait for the data to be worth comparing.

---

## Open Items

Each item names its phase; the Roadmap above is the sequence.

- **Server-side identity enforcement** *(Phase 1)*. Voting (`x-voter-id`) and editing (`authorName`) both trust client-supplied values instead of the authenticated session. Currently anyone can vote or edit as any identity.
- **Request validation** *(Phase 1)*. No schema validation at the API boundary; malformed enum values currently 500 instead of 400.
- **Rate limiting** *(Phase 1)*. None exists on vote/flag/revert/sign-up endpoints.
- **Invite gate** *(Phase 1)*. Decision recorded: invite-only at launch.
- **Privacy policy** *(Phase 1)*. Must be drafted and published before real users sign up, given demographic + political-opinion data collection.
- **Derived evidence strength** *(Phase 1 at claim level, Phase 2 at item level)*.
- **Moderator role and pending-edit review** *(Phase 2 minimal, Phase 3 full)*. Contested status assumes "a moderator applies it directly," but there is no `role` field or moderator concept yet, and no UI to review the `pending` queue a contested claim accumulates.
- **Unsure, vote history, revision kinds, ordering, score visibility, scaled thresholds** *(Phase 2)*. Specified above.
- **Search** *(Phase 3)*. Claim titles/content/tags — in the original MVP scope, not yet built.
- **Duplicates, merge, redirects** *(Phase 3)*. Specified above.
- **Discussion** *(Phase 3)*. Specified above.
- **Tag taxonomy** *(Phase 3)*. Admin-managed `Tag` model with search, vs. the current free-string tags array.
- **Persuasion signal, question roots** *(Phase 4)*. Specified above.
- **Argument Lock** *(Phase 4, design only)* — a moderator-only persistent lock on a single claim: scope (edits/votes/both), duration, public visibility of reason, escalation path from a flag.
- **Compact view** *(Phase 4)* — specified, not built.
- **i18n scaffolding** (`next-intl`) *(Phase 4)* — specified, not built.
- **v7 hover-card changes agreed but not yet drawn** *(Phase 2, design)*: move the claim's own supporting/contradicting list and the CTA into band 1 of the hover card; rewrite relationship headings so the referenced claim is named inline rather than implied by column position.
- **Plain-language mechanism** (glossary terms, or a required plain-English summary per claim) — deferred, not dropped.
- **Sentiment fields** — legacy `sentimentScore`/`sentimentLabel` from the pre-unification schema; confirmed removed in the current schema, no action needed.
- **README** still refers to a `code/` directory and the original tech stack; update to `backend/` and `frontend/` *(Phase 1, trivial)*.

---

Last updated: 14 November 2026.
