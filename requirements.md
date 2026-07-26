# Debattic - Project Requirements

## Project Overview

**Debattic** is a platform that helps citizens understand what other citizens think. It structures arguments and debates so that public discourse becomes easier to navigate — surfacing what people find persuasive, and over time generating structured data that can supplement polling and public policy analysis.

Debattic is the technology project of the **Engage for Australia** movement. EfA's mission is to make public discourse more informed by facts and more relevant to the needs of communities. Debattic is the structured debate tool that supports that mission.

The design philosophy is closer to Wikipedia than to a social network: the **argument or debate is the unit**, not the person or the post. Structure and quality matter more than recency or individual identity. Users are expected to improve and refine shared content, not just publish and move on.

---

## Tone & Brand

**Tagline:** *Arguments worth having.*

**Naming:** TBD — whether the public product is called Debattic, Argument Atlas, or another name is outstanding. The EfA affiliation informs the values but is not dominant in the product's own branding.

**Copy voice:** Clear, serious, and warm — not casual, not academic. Short sentences. Treat the user as an intelligent adult who chose to be here. Focus debates on arguments and positions, not on people.

The platform's values — civic purpose, evidence discipline, respect for the effort of participation, and the belief that changing your mind is honourable — are expressed through the product itself, not through explicit EfA branding.

---

## Colour Palette

Users can toggle between light and dark mode. A compact view is also available as a separate layout preference (see UI Preferences below).

### Light mode

| Role | Colour | Hex |
| --- | --- | --- |
| Primary (brand, CTAs, links) | Deep teal | `#0B7285` |
| Primary light (hover, section backgrounds) | Teal 100 | `#E3F7FA` |
| Accent (highlights, active states) | Warm amber | `#D97706` |
| Accent light (badges, tags) | Yellow | `#FCD34D` |
| Supporting / for | Sage green | `#2D9E6B` |
| Opposing / against | Warm terracotta | `#C0533A` |
| Weak arguments (low score visual treatment) | Muted stone | `#9CA3AF` |
| Background | Warm off-white | `#F9F7F4` |
| Surface (cards) | White | `#FFFFFF` |
| Border | Warm grey | `#E8E2D9` |
| Text primary | Charcoal | `#1A202C` |
| Text secondary | Warm mid-grey | `#6B7280` |

### Dark mode

| Role | Colour | Hex |
| --- | --- | --- |
| Primary (brand, CTAs, links) | Teal (brightened for dark bg) | `#0E9AA7` |
| Primary light (hover, section backgrounds) | Dark teal | `#0C3540` |
| Accent (highlights, active states) | Amber | `#F59E0B` |
| Accent light (badges, tags) | Yellow | `#FCD34D` |
| Supporting / for | Sage green (lightened) | `#34A870` |
| Opposing / against | Terracotta (lightened) | `#D96B50` |
| Weak arguments | Stone | `#6B7280` |
| Background | Near-black warm | `#111318` |
| Surface (cards) | Dark surface | `#1C2128` |
| Border | Dark warm border | `#2D3442` |
| Text primary | Off-white | `#E8EDF2` |
| Text secondary | Mid grey | `#9CA3AF` |

---

## UI Preferences

Users can personalise their viewing experience via a persistent preferences panel. Preferences are stored in localStorage initially and synced to the user record once authenticated.

### Dark / light mode

- Toggles between the light and dark colour palettes above
- Defaults to the system preference (`prefers-color-scheme`)
- Toggle accessible from the main navigation on all pages

### Compact view

- A layout density preference that reduces card padding, inter-card gaps, and line height by one step
- Aimed at power users who want to see more content without scrolling
- Implemented via a `data-view="compact"` attribute on the root element — no separate component variants needed
- Toggle accessible alongside the dark mode toggle

---

## Core Principles

- **Structure over time**: debates and arguments are persistent, improvable objects — not a feed
- **Community over individual**: arguments are collaboratively maintained; attribution is secondary to quality
- **Anonymised aggregate data**: demographic data is captured to enable policy-relevant analysis but is never presented or used at the individual level
- **Weak arguments surface organically**: there is no "debunked" designation. Arguments that score low on both persuasiveness and quality appear in the Weak quadrant of the scatterplot. The community verdict is the verdict — no moderator labels required

---

## Phased Roadmap

### Phase 1: Prototype (Complete)

**Goal:** Hard-coded arguments, focus on 3 pages and UI

#### Pages

1. **Home/Landing Page** — Browse topics, see overview of debates
2. **Debate Detail Page** — View arguments for/against a contention, vote on persuasiveness
3. **Results/Analytics Page** — Visualise argument effectiveness, public opinion trends

#### Features

- Hard-coded debate topics and arguments
- Voting system (vote on most persuasive arguments)
- Clean, modern UI focused on readability
- Responsive design

#### Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Data:** Seeded database for prototype

---

### Phase 2: MVP

**Goal:** Invite-only community that can collaboratively structure, edit, and curate debates and arguments

#### Access Model

- **Invite-only at launch**: all new accounts require an invite from an existing user or admin
- Invite links/codes managed by admins
- No open registration until Phase 3
- **Anonymous (unauthenticated) users** can read all debates, arguments, results and analytics but cannot vote, edit, create, or flag content

#### Homepage

- The homepage explains what Debattic is and what it is for, for a first-time visitor
- Below the explanation: list of debates, browsable by tag/category
- Homepage includes the platform's tagline and a clear call to action (sign in / request invite)

#### Tagging & Search

- Every debate and argument can be tagged with one or more topics (e.g. Climate, Housing, Democracy, Health)
- Tags are drawn from a curated taxonomy managed by admins, with the ability to propose new tags
- A search feature covers debate titles, argument content, and tags
- Both tagging and search are part of the initial release

#### User Authentication & Profiles

- Email/password credentials (no social login required for MVP)
- Minimal user profile: username, join date, contribution count
- Contribution history (full list of edits, arguments created, evidence submitted) deferred to a near-term phase — data is captured from day one but the UI is not built initially

#### Demographic Data Capture

Captured at sign-up via a short optional survey. Fields TBD pending confirmation, likely:

- Age range (e.g. 18–24, 25–34, etc.)
- Country / region
- Political orientation (self-reported — exact framing TBD; options include a left/center/right scale or issue-based questions)

**Privacy constraint:** demographic data is never presented or used at the individual level. All analysis using this data must be aggregate and anonymised. A privacy policy covering this must ship with the MVP.

#### Privacy Policy

- Must be drafted and published before MVP launch
- Must cover: what data is collected, how demographic data is used (aggregate only), data retention, right to deletion
- Should be written in plain language accessible to a general audience

#### Community Editing (Wikipedia Model)

- Any registered user can edit existing debates and arguments
- Edit scope: **wording and content** — users can improve how an argument is written
- Edit scope: **classification metadata** — argument type (fact/opinion/value/proposal), evidence strength
- Edit scope: **structural position** — moving an argument between "for" and "against" requires moderator approval [TBD: or a vote threshold]
- Full **version history** is maintained for every argument and debate, with the ability to view and revert to any prior version
- Edits are attributed to the editing user in the version history

#### Edit Prompt UI

After a user gives a low quality score to an argument, the UI prompts: *"You rated this argument as poorly constructed — want to help improve it?"* with a direct link to the edit view. This creates an active improvement loop where low-quality ratings drive refinement.

#### Dual Voting System

Each vote captures two independent signals on a single argument:

##### Signal 1 — Persuasiveness

"Did you find this argument persuasive?" Captures the personal effect of the argument — whether it moved the user — independent of how well it is constructed. This is the core opinion-polling signal.

##### Signal 2 — Quality

"Is this a well-constructed argument?" Captures perceived argument quality, independent of personal persuasion. A user who was not persuaded can still rate the argument as well-constructed (the "steelman" signal — valuable for policy analysis).

##### Scale

Both signals use a **5-point scale** (1 = strongly disagree / not at all persuasive, 5 = strongly agree / highly persuasive).

##### Voting UX

- The UI shows **two pairs of thumbs** — one for persuasiveness, one for quality — for fast, low-friction interaction
- Thumbs up maps to 4 (agree), thumbs down to 2 (disagree); 3 is only set via the refinement modal
- On click, the vote is recorded immediately and a **refinement modal** opens showing two 5-point selectors for optional precision
- Dismissing the modal without refining leaves the initial mapped score in place
- Users **can update their vote** at any time — all revisions are timestamped, enabling opinion-change tracking over time

One interaction per user per argument (both signals captured together).

#### Argument Card Visual Design

Argument cards — both on debate pages and when appearing as supporting/opposing arguments — display three signals simultaneously:

- **Left border**: colour indicates relationship to the current argument (sage green = supporting, terracotta = opposing); saturation and thickness scale with relative persuasiveness — vivid and thick for highly persuasive, desaturated and thin for weak
- **Mini scatterplot**: always visible on the card, showing where this argument sits on the persuasiveness/quality axes. The dot position conveys both signals at a glance
- **Badges**: argument type (fact/opinion/value/proposal) and evidence strength, kept compact

On hover or tap, the card expands to show the full argument text and a larger labelled scatterplot.

Arguments scoring low on both axes (Weak quadrant) are rendered with a stone-coloured border and a muted visual weight — no special label, no moderation action. The score is the signal.

#### Analytics & Results — Argument View

The argument analytics page visualises both vote signals simultaneously:

##### Scatterplot (primary view)

- X-axis: Persuasiveness score (1–5: not at all → highly persuasive)
- Y-axis: Quality score (1–5: poorly → well constructed)
- Each voter's response is a point; density of points shows the distribution
- Quadrant overlay divides the space into four named zones:
  - **Compelling** (top-right): high persuasiveness, high quality — consensus pick
  - **Steelman** (top-left): low persuasiveness, high quality — well-argued but didn't move people; uniquely valuable for policy analysis
  - **Partisan** (bottom-right): high persuasiveness, low quality — moved people but argument is not well-made
  - **Weak** (bottom-left): low persuasiveness, low quality — broadly dismissed
- The quadrant framing and the scatterplot distribution are shown simultaneously

##### Supporting context

- Edit history summary: number of edits, whether quality score improved after major revisions
- Demographic breakdown of votes *(aggregate, anonymised — once sufficient data exists)*
- Argument-vs-sibling comparison *(deferred to Phase 3)*

##### Miniature cached scatterplot

Visible on argument cards without hover. Precomputed and cached on the argument record — never fetched live. Also appears in expanded form in the hover/tap detail panel.

#### Analytics & Results — Debate View

- Overall for/against engagement
- Aggregate persuasiveness and quality scores across arguments on each side
- Arguments sorted by quality score, not just raw vote count
- Distribution of where voters land on the scatterplot across the whole debate

#### Argument Support Model (Option B + Evidence)

Arguments follow a **graph structure**: any argument can support or oppose any other argument, including arguments from different debates. This enables:

- Citing a well-established argument from one debate as supporting evidence in another
- Showing that an argument in debate A directly rebuts an argument in debate B
- Building up a cross-linked knowledge graph of arguments over time

In addition, arguments can have **evidence items** attached — external sources that directly substantiate or challenge the argument's claim. Any registered user can submit evidence.

Evidence item fields:

- Title / citation (required)
- URL (required — external link)
- Description / excerpt (optional)
- Evidence type (required — selected from fixed list below)

Evidence types:

| Type | Examples |
| --- | --- |
| **Academic research** | Peer-reviewed journal articles, academic books |
| **Official data** | Government statistics, ONS, Eurostat, World Bank, UN data |
| **Official report** | Parliamentary/government/regulatory reports and inquiries |
| **Legal text** | Legislation, court judgments, treaties, regulations |
| **Think tank / NGO** | Policy institute publications, civil society reports |
| **Journalism** | News articles from established outlets |
| **Fact-check** | Full Fact, Snopes, PolitiFact and equivalent organisations |
| **Poll or survey** | Public opinion data, survey research |
| **Video** | Documentary, speech, testimony, lecture recording |
| **Primary source** | Speeches, manifestos, historical documents, official statements |
| **Personal / blog** | Blog posts, personal essays, op-eds, social media posts |

The evidence type tags the *source*, not the argument direction. Whether evidence supports or challenges the argument is captured by the `supportType` field ("supporting" / "opposing") on the `ArgumentSupport` relationship.

#### Debate and Argument Creation

- Any registered user can create new debates and submit new arguments
- Any registered user can submit evidence attached to an argument
- New content goes live immediately but is subject to community editing and moderation
- Debate titles, descriptions, and argument content are all community-editable
- Creation forms must work on mobile; complex editing is optimised for desktop

#### Moderation (Admin)

- Admin panel for managing content, users, and invites
- Admins can: delete content, ban users, revert edits, manage invite codes, manage the tag taxonomy
- Content flagging: any user can flag an argument or debate for moderator review
- Admins can approve or reject structural changes (e.g. moving arguments between for/against)
- There is no "debunked" designation — argument quality is determined by community scores, not moderator labels

#### Argument Lock *(future moderation feature — design TBD)*

A moderator should be able to lock a specific argument to prevent further edits and/or votes when community activity is introducing inaccuracies rather than improving quality. This is distinct from deletion — a locked argument remains fully visible, with a clear indicator that it has been locked and why.

Open design questions:

- Should locking prevent edits only, votes only, or both independently?
- Should locks be temporary (with an expiry) or indefinite until a moderator unlocks?
- Should the reason for locking be publicly visible on the argument?
- Can a lock be escalated from a flag, or only applied directly by a moderator?

This feature is not scoped for Phase 2 MVP but the data model should not preclude it — a `lockedAt`, `lockedBy`, and `lockReason` field on the Argument model would be sufficient.

#### Sentiment Analysis

- The existing `sentimentScore` and `sentimentLabel` schema fields are candidates for removal — they predate the dual voting system and are redundant with scatterplot data [TBD: confirm removal in schema migration]

#### Tech Stack Additions

- **Database:** PostgreSQL (upgrade from SQLite for production)
- **Auth:** NextAuth.js (credentials provider, invite-only)
- **Deployment:** Vercel
- **Internationalisation:** `next-intl` — all UI strings externalised from day one; English only at launch
- **Version history storage:** TBD (database table vs. append-only log)

---

### Phase 3: Open Moderation & Social

**Goal:** Widen participation, connect to external data, begin policy-relevant data use

#### Access Model

- Open registration (no invite required)
- **Contributor role**: lower-access moderation tier open to any registered user — can edit, flag, and vote on argument quality, but cannot delete content, ban users, or manage invites
- Full moderator role remains invite/admin-assigned

#### Features

- Open registration with demographic survey
- Contributor moderation tier
- User contribution history pages
- Social network integration — connect accounts, share debates
- Show what a user's network thinks vs. general public opinion
- Ingest external polling data on similar questions for comparison
- Advanced analytics and data visualisations using anonymised demographic breakdowns
- Argument-vs-sibling comparison view
- API for third-party integrations (e.g. policy research, journalism tools)

---

## User Roles

| Role | Access |
| --- | --- |
| **Public (unauthenticated)** | Read debates, arguments, results — no voting, editing, or flagging |
| **Registered user** | Vote (dual signal, updatable), create debates/arguments, edit content, flag content, attach evidence, use tags and search |
| **Contributor** *(Phase 3)* | All of above + lightweight moderation |
| **Moderator/Admin** | Full moderation: delete, ban, revert, manage invites and tag taxonomy |

---

## Core Data Models

### Contention (Debate)

- Title
- Description
- Tags (many-to-many)
- Status (active / archived)
- Created by, created date
- Version history

### Argument

- Contention it belongs to
- Position (for / against)
- Content and summary
- Argument type (fact / opinion / value / proposal)
- Evidence strength (strong / moderate / weak / none)
- Cached scatterplot summary (precomputed persuasiveness + quality distribution for card display)
- Tags (many-to-many, inherited from parent debate by default, overridable)
- Version history
- Supporting arguments and evidence (via ArgumentSupport)

### Tag *(new for Phase 2)*

- Name
- Slug
- Description (optional)
- Created / managed by admin

### Evidence *(new for Phase 2)*

- Title / citation (required)
- URL (required)
- Description / excerpt (optional)
- Evidence type: one of academic research / official data / official report / legal text / think tank or NGO / journalism / fact-check / poll or survey / video / primary source / personal or blog
- Submitted by user
- Linked to argument via ArgumentSupport

### ArgumentSupport

- Parent item (argument or debate)
- Child item (argument or evidence item)
- Relationship type: "supporting" or "opposing"
- Votes on support strength

### Vote *(updated for Phase 2)*

- User
- Argument voted on
- Persuasiveness score: 1–5
- Quality score: 1–5
- Created timestamp
- Updated timestamp (updatable; all revisions timestamped for opinion-change tracking)

### User

- Email, name, avatar
- Invite source
- Demographic data (age range, region, political orientation) — stored but only used in aggregate

### EditHistory *(new for Phase 2)*

- Item edited (debate or argument)
- Editing user
- Previous content snapshot
- Timestamp
- Revert status

---

## Non-Functional Requirements

- **Performance:** Fast page loads; scatterplot data precomputed and cached on argument records, not fetched live
- **Accessibility:** WCAG compliant, keyboard navigable; colour coding always supplemented with text labels (not colour-only encoding)
- **Mobile:** Reading, voting, creating arguments, submitting evidence, and tagging all supported on mobile. Complex editing (version comparison, revert, structural moves) is designed for desktop but not blocked on mobile.
- **Internationalisation:** All UI strings externalised into translation files via `next-intl` from day one. English only at launch; adding further languages requires no code changes. Database content is not translated.
- **Security:** Input sanitisation, rate limiting, secure auth, no individual-level demographic exposure
- **Privacy:** GDPR-aware data handling; privacy policy published at MVP launch

---

## Out of Scope

### Permanently out of scope

- Mobile native apps
- Individual-level demographic data presentation (always anonymised and aggregate)
- "Debunked" designation — argument quality is determined by community votes, not moderator labels

### Out of scope until Phase 3

- Open registration
- Contributor/lower-access moderator role
- User contribution history pages
- Social network API integrations
- External polling data ingestion
- Advanced demographic analytics
- Argument-vs-sibling comparison view
- Third-party API

### Deferred / TBD

- Exact naming: Debattic vs. Argument Atlas vs. other
- Exact demographic survey fields and political orientation framing
- Version history storage implementation
- Structural edit approval flow (moderator-gated vs. vote threshold)
- Whether to retain or remove legacy `votesFor` / `votesAgainst` and `sentimentScore` / `sentimentLabel` fields during schema migration
- Tag taxonomy: initial set of tags
- Argument lock design: lock scope (edits / votes / both), duration, public visibility of reason, escalation path from flag

---

Last updated: 12 May 2026
