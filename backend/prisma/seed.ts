import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import type { ClaimType, EvidenceStrength, ConnectionRelation, ConnectionStrength } from "../generated/prisma/enums.ts";

/**
 * Seed data for Argument Atlas.
 *
 * Design rules (see requirements.md → "Seed content policy"):
 *
 *  1. One proposition per claim. If a title needs "and", "—" or "because" to
 *     hold together, it is two claims.
 *  2. Claims are a graph, not a tree. A claim is written once and connected to
 *     every debate it bears on, so "Where this claim is used" has real rows.
 *  3. The crux of each debate is itself a claim, with its own supports and
 *     contradicts, not a sentence of prose.
 *  4. Every Fact claim carries at least one evidence item. The evidence badge
 *     is derived: no items → NONE, and STRONG requires a checkable source.
 *  5. Votes are demo data. They exist only so the plot and score bars render
 *     during development, are generated under an obviously synthetic voter id,
 *     and are skipped entirely when SEED_DEMO_VOTES=false or NODE_ENV=production.
 *     Nothing here is a measurement of public opinion.
 *  6. Context prose is written for each claim, never templated.
 *
 * Six debates, deliberately clustered around energy and housing so that
 * cross-debate reuse is natural rather than forced.
 */

const prisma = new PrismaClient();

const DEMO_VOTES = process.env.SEED_DEMO_VOTES !== "false" && process.env.NODE_ENV !== "production";
const AUTHOR = { authorId: "editors", authorName: "Argument Atlas editors" };

// --- deterministic helpers ----------------------------------------------------

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function boolSeries(total: number, trueCount: number, seed: number): boolean[] {
  return seededShuffle(Array.from({ length: total }, (_, i) => i < trueCount), seed);
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

let seedCounter = 0;
function nextSeed() {
  seedCounter += 1;
  return seedCounter * 97;
}

// --- content types -----------------------------------------------------------

type Evidence = { type: EvidenceType; citation: string; url?: string };

/** Evidence taxonomy, verbatim from requirements.md → Data Models → EvidenceItem. */
type EvidenceType =
  | "Academic research"
  | "Official data"
  | "Official report"
  | "Legal text"
  | "Think tank / NGO"
  | "Journalism"
  | "Fact-check"
  | "Poll or survey"
  | "Video"
  | "Primary source"
  | "Personal / blog";

type DemoVotes = { n: number; agree: number; well: number };

type ClaimDef = {
  key: string;
  title: string;
  oneLiner: string;
  body: string;
  type: ClaimType;
  evidenceStrength: EvidenceStrength;
  tags: string[];
  context: string;
  disagreement: string;
  evidence: Evidence[];
  timeline?: { label: string; text: string }[];
  /** Demo-only. Omit for a claim that should ship with no votes at all. */
  votes?: DemoVotes;
  contested?: { reason: string; hoursAgo: number; revertedBy: string[] };
};

type ConnDef = {
  from: string;
  to: string;
  relation: ConnectionRelation;
  strength: ConnectionStrength;
  reason: string;
  /** Demo-only distribution [decisive, relevant, tangential]. */
  votes?: [number, number, number];
};

// =============================================================================
// CLAIMS
// =============================================================================

const ENERGY = ["ENERGY"];
const HOUSING = ["HOUSING"];

const claims: ClaimDef[] = [
  // ---------------------------------------------------------------------------
  // Debate 1 — nuclear ban
  // ---------------------------------------------------------------------------
  {
    key: "R-nuclear",
    title: "Australia should repeal its federal ban on nuclear power generation",
    oneLiner: "Whether the 1998 prohibition on nuclear power plants should be lifted. Repeal is a separate question from whether anyone would then build one.",
    body: "Two federal Acts prohibit the approval of a nuclear power plant anywhere in Australia. Repealing them would allow proposals to be assessed on their merits under the ordinary environmental, safety and planning regimes. Whether a plant would then be commercially viable, or built in time to matter, is argued below.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: [...ENERGY, "CLIMATE"],
    context:
      "Australia is the only G20 country with a legislated ban on nuclear power. The prohibition was inserted into federal environment and radiation-safety law in 1998 and 1999 as a condition of the Senate passing the bill that created the national radiation regulator. It has never been seriously tested in Parliament since.\n\nThe question returned as coal plants in the National Electricity Market announced closure dates and the pace of renewable and transmission build-out came under strain. In 2024 the federal opposition adopted a policy of government-owned reactors on former coal sites, which put repeal on the agenda for the first time in a generation.",
    disagreement:
      "Almost nobody argues the ban is a good piece of law on its own terms. The live dispute is whether repeal is harmless because it merely permits, or harmful because it diverts investment and attention from a transition that must happen before any reactor could run.",
    evidence: [
      {
        type: "Legal text",
        citation: "Environment Protection and Biodiversity Conservation Act 1999 (Cth), s 140A — prohibition on approving nuclear installations",
        url: "https://www.legislation.gov.au/C2004A00485/latest/text",
      },
      {
        type: "Legal text",
        citation: "Australian Radiation Protection and Nuclear Safety Act 1998 (Cth), s 10 — prohibition on certain nuclear installations",
      },
    ],
    timeline: [
      { label: "1998–99", text: "The ban is written into federal radiation-safety and environment law as a condition of creating the national regulator." },
      { label: "2006", text: "A government-commissioned review finds nuclear could be competitive only with a carbon price. No legislative change follows." },
      { label: "2019", text: "A House committee recommends a partial lift of the moratorium for newer reactor designs. The recommendation is not acted on." },
      { label: "2022–24", text: "Coal plant closure dates across the National Electricity Market are brought forward." },
      { label: "2024", text: "The federal opposition adopts a policy of government-owned reactors at seven former coal sites." },
    ],
    votes: { n: 42, agree: 18, well: 26 },
  },
  {
    key: "E-gencost",
    title: "CSIRO's GenCost report finds firmed renewables the cheapest new-build electricity for Australia and large-scale nuclear the most expensive",
    oneLiner: "The national science agency's annual cost comparison puts wind and solar with storage and transmission below every other new-build option.",
    body: "GenCost, produced each year by CSIRO with the market operator, estimates the cost of building and running each generation technology in Australian conditions. Its recent editions find renewables with firming cheaper per megawatt-hour than new coal, gas or nuclear, and put large-scale nuclear at the top of the range because of its capital cost and build time.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "GenCost is the reference cost study used by the Australian Energy Market Operator in system planning. It has been published annually since 2018 and is revised after public consultation each year. Its nuclear figures have been the most contested part of the report since 2023, and CSIRO has responded by publishing its assumptions and a longer discussion of them.",
    disagreement:
      "Critics accept the report exists and says this, but argue the comparison understates integration costs for renewables and overstates nuclear costs by assuming a first-of-a-kind build. Supporters note that each year's revision has been consulted on and the ranking has not changed.",
    evidence: [
      {
        type: "Official report",
        citation: "CSIRO and AEMO, GenCost: annual report on the cost of electricity generation technologies in Australia",
        url: "https://www.csiro.au/en/research/technology-space/energy/gencost",
      },
    ],
    votes: { n: 38, agree: 31, well: 33 },
  },
  {
    key: "E-not-before-2040",
    title: "A first Australian nuclear power reactor could not be generating electricity before 2040",
    oneLiner: "Legislation, licensing, site selection, workforce and construction each take years, and none has started.",
    body: "Starting from no regulator for power reactors, no licensed site and no construction supply chain, the sequence of repeal, regulatory design, licensing, approvals and a first-of-a-kind build is estimated by CSIRO and others at fifteen years or more. On that reckoning a decision taken now delivers first power around 2040 at the earliest.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "This is the pivot of the whole nuclear debate: both sides agree the grid needs firm low-emissions capacity, and they divide on whether nuclear could arrive in time to supply it. Most of the arguments about cost and about coal closures draw their force from this one estimate.",
    disagreement:
      "Supporters of the estimate point to the sequence of steps and to comparable first builds. Critics argue a determined government using a proven reactor design and existing coal sites could compress the timeline, and that estimates for first-of-a-kind builds are inherently pessimistic.",
    evidence: [
      {
        type: "Official report",
        citation: "CSIRO and AEMO, GenCost 2023–24 — discussion of lead times for a first Australian nuclear plant",
        url: "https://www.csiro.au/en/research/technology-space/energy/gencost",
      },
      {
        type: "Official report",
        citation: "House of Representatives Standing Committee on the Environment and Energy, Not without your approval: a way forward for nuclear technology in Australia (2019)",
      },
    ],
    votes: { n: 35, agree: 25, well: 27 },
  },
  {
    key: "E-no-regulator",
    title: "Australia has no licensing regime, construction supply chain or operating workforce for nuclear power reactors",
    oneLiner: "The national regulator licenses research reactors and medical facilities, not power plants.",
    body: "The Australian Radiation Protection and Nuclear Safety Agency regulates one research reactor at Lucas Heights and radiation use in medicine and industry. It has no framework for licensing, inspecting or decommissioning a power reactor, and no Australian firm has built one. Each of these would have to be created before construction could begin.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "Australia has operated research reactors since 1958 and has a mature radiation-safety profession. What it has never had is the much larger regulatory, engineering and training apparatus that power reactors require, which in other countries took a decade or more to establish.",
    disagreement:
      "Nobody disputes the gap. The argument is about how long it takes to close: whether regulatory frameworks can be adopted from the United States or Canada largely as-is, or must be built from first principles.",
    evidence: [
      {
        type: "Official report",
        citation: "Australian Radiation Protection and Nuclear Safety Agency — regulatory functions and licensed facilities",
        url: "https://www.arpansa.gov.au/",
      },
    ],
    votes: { n: 24, agree: 22, well: 19 },
  },
  {
    key: "E-uae-twelve-years",
    title: "The United Arab Emirates went from deciding to build nuclear power to first grid electricity in about twelve years, with no prior nuclear industry",
    oneLiner: "The Barakah project is the clearest recent case of a newcomer country building reactors from a standing start.",
    body: "The UAE adopted its nuclear policy in 2008, created a regulator and a utility, selected a Korean reactor design, and connected the first of four Barakah units to the grid in 2020. It did so with imported expertise and a vendor delivering a design already operating elsewhere.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "Barakah is cited by both sides. Proponents of nuclear point to it as proof that a newcomer can build quickly; opponents note that it relied on a non-democratic planning process, a single vendor relationship and conditions that do not transfer to Australia.",
    disagreement:
      "The fact is not disputed. What is disputed is whether it bears on Australia: twelve years from a 2026 start still lands in the late 2030s, so the example narrows the gap without closing it.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "World Nuclear Association, Nuclear Power in the United Arab Emirates — country profile",
        url: "https://world-nuclear.org/information-library/country-profiles/countries-t-z/united-arab-emirates",
      },
    ],
    // Deliberately a "steelman": well made, cited, and persuasive to fewer people.
    votes: { n: 26, agree: 11, well: 23 },
  },
  {
    key: "E-coal-closures",
    title: "Most of the National Electricity Market's remaining coal-fired capacity is scheduled to close by the late 2030s",
    oneLiner: "Owners' announced closure dates, and the market operator's planning scenarios, retire the bulk of the coal fleet within fifteen years.",
    body: "The Australian Energy Market Operator's Integrated System Plan models the exit of most coal generation across the eastern states during the 2030s, consistent with dates announced by plant owners. Several plants have brought their dates forward rather than back.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "Coal still supplies the largest share of eastern-state electricity, so its exit schedule sets the deadline for whatever replaces it. The schedule has repeatedly moved earlier as plants have become less reliable and less profitable.",
    disagreement:
      "The schedule itself is accepted. The argument is about whether closures will slip if replacement capacity is late, which would change the timing calculation for every firming technology.",
    evidence: [
      {
        type: "Official report",
        citation: "Australian Energy Market Operator, Integrated System Plan — coal retirement schedule and scenarios",
        url: "https://aemo.com.au/energy-systems/major-publications/integrated-system-plan-isp",
      },
    ],
    votes: { n: 29, agree: 24, well: 22 },
  },
  {
    key: "E-gas-firming",
    title: "AEMO's Integrated System Plan relies on gas-fired generation to firm renewables through the 2030s and beyond",
    oneLiner: "The market operator's own plan keeps gas peakers in the mix as backup, run for a small number of hours a year.",
    body: "In every Integrated System Plan scenario, gas-fired peaking plants remain in the system to cover long periods of low wind and solar output. Their capacity is held or grows while their total energy output falls, because they run rarely.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "This is one of the few points on which the market operator, gas producers and most renewable advocates agree in substance while disagreeing in emphasis: gas as insurance, running rarely, is part of the plan.",
    disagreement:
      "The dispute is over quantity and duration: how many hours a year, for how many decades, and whether storage or hydrogen displaces it sooner than the plan assumes.",
    evidence: [
      {
        type: "Official report",
        citation: "Australian Energy Market Operator, Integrated System Plan — role of gas-powered generation",
        url: "https://aemo.com.au/energy-systems/major-publications/integrated-system-plan-isp",
      },
    ],
    votes: { n: 21, agree: 18, well: 17 },
  },
  {
    key: "E-ban-separate",
    title: "Repealing the ban is a separate decision from building reactors; it removes a prohibition and commits to nothing",
    oneLiner: "A repeal does not fund, site or approve a plant. It only stops the law from answering the question in advance.",
    body: "Every other generation technology is assessed on its merits through planning, environmental and safety approval. Repeal would put nuclear on the same footing. Any plant would still need a proponent, finance, a site, a licence and public consent.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: ENERGY,
    context:
      "This argument tries to separate two questions the public debate usually runs together: whether the law should forbid nuclear, and whether Australia should build it. Many who oppose building reactors still accept this distinction; many who support them think it understates how much repeal would change investor behaviour.",
    disagreement:
      "Opponents answer that in practice repeal would be read as a signal, and that signals shape where capital and political attention go. Whether a legal change can be 'neutral' in that sense is the real dispute.",
    evidence: [],
    votes: { n: 27, agree: 19, well: 22 },
  },
  {
    key: "E-france-ontario",
    title: "France and Ontario run among the lowest-emissions large electricity grids in the world, with nuclear as the backbone",
    oneLiner: "Two large grids decarbonised decades ago on a nuclear-heavy mix, with hydro and later renewables around it.",
    body: "France generates around two-thirds of its electricity from nuclear and has grid emissions intensity a fraction of Australia's. Ontario closed its last coal plant in 2014, relying on nuclear and hydro. Both are regularly cited as proof that a large grid can run reliably at very low emissions.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "The two examples are the standard evidence that nuclear-based decarbonisation works at scale. Their fleets were built in the 1970s and 1980s under conditions very different from today's: state-directed, serial construction of a standard design.",
    disagreement:
      "The record is undisputed. What is disputed is whether a grid can be built this way now, in a country without an existing fleet, at a cost that competes with alternatives that did not exist in 1980.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Ember, electricity data explorer — generation mix and carbon intensity by country and region",
        url: "https://ember-energy.org/data/",
      },
    ],
    votes: { n: 30, agree: 24, well: 25 },
  },
  {
    key: "E-unsafe",
    title: "Nuclear power is too dangerous for Australia, as Chernobyl and Fukushima show",
    oneLiner: "Two major accidents are offered as reason enough to keep the ban.",
    body: "The two most serious nuclear accidents displaced hundreds of thousands of people and left land unusable for decades. Proponents of the ban argue that no economic case justifies exposing Australian communities to that category of risk.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: ENERGY,
    context:
      "Safety is the oldest argument against nuclear power and the one most often made in public, though rarely by energy specialists on either side. It is included here because it is widely held, and so the community's rating of it is informative.",
    disagreement:
      "Opponents of this claim argue that reactor designs, regulation and siting have changed substantially since both accidents, and that per unit of electricity nuclear has a lower death toll than coal or gas. The claim as written does not engage with that comparison.",
    evidence: [],
    // Deliberately in the Weak quadrant: widely heard, poorly constructed, few agree once asked.
    votes: { n: 25, agree: 6, well: 4 },
  },

  // ---------------------------------------------------------------------------
  // Debate 2 — east-coast gas reservation
  // ---------------------------------------------------------------------------
  {
    key: "R-gas",
    title: "East-coast gas producers should be required to reserve a share of production for domestic buyers",
    oneLiner: "Whether a Western Australian-style domestic reservation should apply to Queensland's LNG export projects.",
    body: "Queensland's three LNG export terminals connected the east-coast gas market to Asian prices in 2015. A reservation policy would require producers to set aside a fixed share of output for domestic use, as Western Australia has done since 2006. The question is whether that is the right tool for the price and supply problems that followed.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: [...ENERGY, "ECONOMY"],
    context:
      "Until 2015 the east-coast market was isolated: gas produced there could only be sold there. The Gladstone export terminals changed that, linking domestic prices to international ones just as the Bass Strait fields began to decline. The competition regulator has run a standing inquiry into the market since 2017, and successive governments have adopted a price cap, a code of conduct and an export control mechanism, but not reservation.",
    disagreement:
      "Both sides accept that east-coast prices rose sharply after exports began and that gas remains needed for firming. They divide on whether reservation would lower prices without deterring the new supply the market also needs, and on whether existing contracts could be touched.",
    evidence: [
      {
        type: "Official report",
        citation: "Australian Competition and Consumer Commission, Gas Inquiry 2017–2030 — interim reports",
        url: "https://www.accc.gov.au/inquiries-and-consultations/gas-inquiry-2017-30",
      },
    ],
    timeline: [
      { label: "2006", text: "Western Australia adopts a domestic reservation policy for new LNG projects." },
      { label: "2015", text: "The first Queensland LNG export cargo leaves Gladstone, linking east-coast gas to Asian prices." },
      { label: "2017", text: "The Australian Domestic Gas Security Mechanism is created, allowing export limits during a forecast shortfall. The ACCC's standing gas inquiry begins." },
      { label: "2022", text: "A temporary wholesale price cap and a mandatory code of conduct follow the energy price spike." },
      { label: "Now", text: "Reservation remains the main policy proposed but not adopted." },
    ],
    votes: { n: 33, agree: 20, well: 19 },
  },
  {
    key: "E-wa-domgas",
    title: "Western Australia requires LNG projects to reserve 15 per cent of production for the domestic market, and its gas prices have been well below the east coast's",
    oneLiner: "The one Australian jurisdiction with reservation has had the cheapest domestic gas.",
    body: "Since 2006 Western Australia has negotiated a 15 per cent domestic reservation into the approval of each LNG project. Through the east-coast price spikes of 2017 and 2022 its domestic wholesale prices stayed a fraction of eastern levels.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "Western Australia is a natural comparison because it is the only part of the country that has run the policy, and because its gas market is physically separate from the east coast's.",
    disagreement:
      "The price gap is agreed. The dispute is causation: Western Australia also has abundant, cheap-to-produce offshore gas and a small domestic market, which would produce low prices with or without reservation.",
    evidence: [
      {
        type: "Official report",
        citation: "Government of Western Australia, Western Australian Domestic Gas Policy",
      },
      {
        type: "Official report",
        citation: "Australian Competition and Consumer Commission, Gas Inquiry — east-coast and western price comparisons",
        url: "https://www.accc.gov.au/inquiries-and-consultations/gas-inquiry-2017-30",
      },
    ],
    votes: { n: 28, agree: 22, well: 18 },
  },
  {
    key: "E-east-prices",
    title: "East-coast wholesale gas prices more than doubled after LNG exports from Queensland began in 2015",
    oneLiner: "Domestic buyers moved from an isolated market to one priced off Asian LNG, and paid for it.",
    body: "Before 2015, east-coast gas typically traded at $3 to $4 a gigajoule. The competition regulator's inquiry documents offers to domestic buyers rising to between $8 and $12 within three years of exports beginning, with spikes well above that in 2022.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "The price rise is the event the whole reservation debate responds to. Manufacturers who use gas as a feedstock, not just a fuel, were hit hardest, and several closures were attributed to it.",
    disagreement:
      "That prices rose is not disputed. Whether exports caused the rise, or merely coincided with declining southern fields and state moratoria on onshore gas, is where the argument sits.",
    evidence: [
      {
        type: "Official report",
        citation: "Australian Competition and Consumer Commission, Gas Inquiry 2017–2030 — price series and offers to domestic buyers",
        url: "https://www.accc.gov.au/inquiries-and-consultations/gas-inquiry-2017-30",
      },
    ],
    votes: { n: 26, agree: 22, well: 21 },
  },
  {
    key: "E-retrospective",
    title: "Imposing reservation on gas already contracted for export would break existing contracts and deter future investment",
    oneLiner: "Producers borrowed against long-term export contracts; forcing gas away from them is a sovereign-risk event.",
    body: "The Queensland LNG projects were financed on the strength of twenty-year supply contracts with Asian buyers. A reservation that reached that gas would put Australian producers in breach and signal to future investors that approvals can be rewritten after the money is spent.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: ENERGY,
    context:
      "This is the producers' central objection and the reason governments have reached for export controls and price caps instead of reservation. It bears on how a policy is designed as much as on whether to have one.",
    disagreement:
      "Supporters of reservation generally accept the point about existing contracts and answer that a prospective policy avoids it. The disagreement then becomes whether a policy that touches only new gas would do anything useful soon enough.",
    evidence: [],
    votes: { n: 24, agree: 15, well: 17 },
  },
  {
    key: "E-wa-prospective",
    title: "Western Australia's reservation applied only to new projects, leaving existing export contracts untouched",
    oneLiner: "The precedent the proposal draws on was prospective, not retrospective.",
    body: "Western Australia's policy was negotiated project by project as each new LNG development sought approval. No existing contract was reopened. An east-coast policy could follow the same model, applying to new fields and expansions.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "The design of the Western Australian policy is often lost in the east-coast argument, where 'reservation' is heard as confiscation. How it actually worked matters for whether the sovereign-risk objection applies.",
    disagreement:
      "The history is agreed. The argument is whether a prospective policy on the east coast would reach enough gas to matter, given that most current production is already contracted.",
    evidence: [
      {
        type: "Official report",
        citation: "Government of Western Australia, Western Australian Domestic Gas Policy — application to new projects",
      },
    ],
    votes: { n: 19, agree: 15, well: 15 },
  },
  {
    key: "E-adgsm",
    title: "The Australian Domestic Gas Security Mechanism, in force since 2017, already lets the government limit LNG exports when a domestic shortfall is forecast",
    oneLiner: "An export-control lever already exists; the question is whether it is the right one.",
    body: "The mechanism allows the minister to require exporters to find offsetting domestic supply, or restrict exports, in a year the market operator forecasts a shortfall. It has been reformed to allow quarterly rather than annual triggering, but it has never been formally activated.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "The mechanism was the government's answer to the 2017 price spike and was offered as the alternative to reservation. Its existence is the main reason reservation advocates are asked what their policy adds.",
    disagreement:
      "Its existence is undisputed. Reservation advocates argue it addresses volume, not price, and only in a declared shortfall; defenders argue its threat has been enough to secure supply agreements without the costs of reservation.",
    evidence: [
      {
        type: "Legal text",
        citation: "Customs (Prohibited Exports) Regulations 1958, Division 6 — Australian Domestic Gas Security Mechanism",
      },
    ],
    votes: { n: 20, agree: 17, well: 16 },
  },
  {
    key: "E-market-working",
    title: "Higher east-coast gas prices are the market working: they signal scarcity and speed up the shift away from gas",
    oneLiner: "If gas is scarce and the grid must decarbonise anyway, a high price is doing the right job.",
    body: "Reservation holds domestic prices below the international price, which encourages continued gas use and discourages the electrification and efficiency that the energy transition requires. A price that reflects scarcity moves households and industry off gas faster than any policy could.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: ENERGY,
    context:
      "This is an economist's argument that is rarely made in public because it accepts the pain of high prices as a feature. It is included because it is well constructed and because the community's response to it is itself informative.",
    disagreement:
      "Critics answer that the burden of the signal falls on manufacturers and low-income households who cannot electrify quickly, and that transition policy should not be run through the gas bill.",
    evidence: [],
    // Deliberately a "steelman": coherent and well made, agreed with by few.
    votes: { n: 22, agree: 5, well: 18 },
  },

  // ---------------------------------------------------------------------------
  // Debate 3 — negative gearing
  // ---------------------------------------------------------------------------
  {
    key: "R-negative-gearing",
    title: "Negative gearing should be limited to newly built dwellings for purchases made after a start date",
    oneLiner: "Whether the deduction of rental losses against wage income should continue for established homes bought in future.",
    body: "Negative gearing lets a landlord whose rental costs exceed rental income deduct the shortfall from other income, such as salary. The proposal keeps the concession for new construction, where it may add to supply, and ends it for future purchases of existing homes. Current arrangements would be grandfathered.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: [...HOUSING, "TAX"],
    context:
      "Australia is unusual in letting rental losses offset wage income without limit. Combined with the capital gains discount introduced in 1999, this makes a loss-making rental property a tax-effective way to hold an appreciating asset. The policy was briefly quarantined in 1985 and restored in 1987, and a version of this proposal was taken to the 2016 and 2019 federal elections and lost both times.",
    disagreement:
      "Economists broadly agree the concession pushes prices up at the margin. The disagreement is about magnitude, about whether rents would rise if investors withdrew, and about whether this is the right lever when supply constraints are so much larger.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Taxation Office, Taxation statistics — individuals, rental property schedules",
        url: "https://www.ato.gov.au/about-ato/research-and-statistics/in-detail/taxation-statistics",
      },
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Hot property: negative gearing and capital gains tax reform (2016)",
        url: "https://grattan.edu.au/report/hot-property/",
      },
    ],
    timeline: [
      { label: "1985", text: "Rental losses are quarantined so they can only be offset against rental income." },
      { label: "1987", text: "Quarantining is reversed after rents rise in Sydney and Perth." },
      { label: "1999", text: "The capital gains tax discount is introduced, increasing the appeal of loss-making property investment." },
      { label: "2016 & 2019", text: "A federal opposition takes a new-builds-only policy to two elections and loses both." },
      { label: "Now", text: "Price-to-income ratios in major cities sit near record highs, and the policy returns to debate in each budget cycle." },
    ],
    votes: { n: 40, agree: 23, well: 24 },
  },
  {
    key: "H-investor-loans-established",
    title: "The large majority of investor housing loans finance established dwellings rather than new construction",
    oneLiner: "If the concession is meant to add rental supply, most of it is going to homes that already exist.",
    body: "Lending data published monthly by the Bureau of Statistics shows investor loans for the construction or purchase of new dwellings are a small fraction of total investor lending. Most investor borrowing buys existing homes, where it competes directly with owner-occupiers.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: HOUSING,
    context:
      "This is the core factual plank of the new-builds-only proposal: it concedes that investment in new housing is valuable and argues the current concession is not producing it.",
    disagreement:
      "The figures are not contested. Defenders of the concession respond that buying an established home and renting it out still adds to the rental stock, even if not to the total stock.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Bureau of Statistics, Lending Indicators — investor housing finance by purpose",
        url: "https://www.abs.gov.au/statistics/economy/finance/lending-indicators/latest-release",
      },
    ],
    votes: { n: 31, agree: 27, well: 26 },
  },
  {
    key: "H-ng-materially-affordable",
    title: "Limiting negative gearing to new builds would make housing materially more affordable",
    oneLiner: "Removing the tax advantage for investors in existing homes would take heat out of the market first-home buyers compete in.",
    body: "Investors and first-home buyers bid for the same established dwellings. Removing a concession available only to one side would, proponents argue, shift enough demand to make a visible difference to prices and to who wins at auction.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: HOUSING,
    context:
      "This is the claim most proponents actually care about. It is separated here from the proposal itself because one can support the proposal on fairness grounds while accepting the price effect would be small.",
    disagreement:
      "The best available modelling finds a price effect of a few per cent. Whether that is 'material' is partly a judgement, and partly depends on whether one counts the effect on who buys rather than just on price.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Hot property: negative gearing and capital gains tax reform (2016) — modelled price effects",
        url: "https://grattan.edu.au/report/hot-property/",
      },
    ],
    votes: { n: 29, agree: 15, well: 14 },
  },
  {
    key: "H-grattan-two-percent",
    title: "Grattan Institute modelling found that limiting negative gearing and halving the capital gains discount would lower house prices by about 2 per cent",
    oneLiner: "The most-cited independent estimate puts the price effect in the low single digits.",
    body: "Grattan's 2016 analysis estimated that both reforms together would reduce prices by roughly 2 per cent and reduce the share of homes bought by investors, with little effect on rents. It is the figure most often quoted on both sides.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: HOUSING,
    context:
      "A single number does a lot of work in this debate. Supporters of reform cite it to show rents would not spike; opponents of reform cite the same number to show the price effect is too small to justify the change.",
    disagreement:
      "The estimate is accepted as a fair reading of the report. The argument is about what it implies, and whether a decade of further price growth has changed the magnitude.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Hot property: negative gearing and capital gains tax reform (2016), chapter 5",
        url: "https://grattan.edu.au/report/hot-property/",
      },
    ],
    votes: { n: 27, agree: 23, well: 24 },
  },
  {
    key: "H-rents-rise",
    title: "Winding back negative gearing would push rents up as investors leave the market",
    oneLiner: "Fewer landlords means fewer rentals, and fewer rentals means higher rents.",
    body: "If the after-tax return on rental property falls, some investors will sell and fewer will buy. Opponents of reform argue that the resulting withdrawal of rental stock would raise rents for the tenants the policy is meant to help.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: HOUSING,
    context:
      "This was the central argument of the campaigns against reform in 2016 and 2019, and the main reason governments have not touched the concession since 1987.",
    disagreement:
      "Reform advocates answer that a home sold by an investor is usually bought by an owner-occupier who was renting, so the rental stock and the number of renters fall together. The empirical record from 1985–87 is read differently by each side.",
    evidence: [],
    votes: { n: 32, agree: 15, well: 18 },
  },
  {
    key: "H-quarantine-1985",
    title: "When negative gearing was quarantined in 1985–87, rents rose sharply in Sydney and Perth but not in other capitals",
    oneLiner: "The one time Australia tried this, the rent effect showed up in two cities with tight vacancy and nowhere else.",
    body: "Real rents rose strongly in Sydney and Perth during the quarantine period, which is the episode usually cited as proof that rents would spike. Rents in Melbourne, Brisbane and Adelaide were flat or fell in real terms over the same period, which suggests local vacancy rates, not the tax change, drove the increases.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: HOUSING,
    context:
      "Two years of data from forty years ago carry an unusual amount of weight in this debate because they are the only natural experiment available.",
    disagreement:
      "The city-level figures are agreed. Whether they exonerate the tax change, or merely show it interacted with local conditions, is the dispute.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Hot property (2016) — discussion of the 1985–87 quarantine and capital-city rents",
        url: "https://grattan.edu.au/report/hot-property/",
      },
      {
        type: "Official data",
        citation: "Australian Bureau of Statistics, Consumer Price Index — rents component by capital city, 1985–1988",
      },
    ],
    votes: { n: 23, agree: 17, well: 20 },
  },
  {
    key: "H-private-landlords",
    title: "Private landlords supply the large majority of Australia's rental housing",
    oneLiner: "Social and institutional housing is a small share; most renters rent from an individual.",
    body: "Census tenure data shows that most rented dwellings are owned by private individuals rather than by governments, community housing providers or institutional investors. Any policy that changes individual investors' behaviour therefore acts on most of the rental stock.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: HOUSING,
    context:
      "Australia's rental market is unusual in how little of it is institutional. This shapes every argument about investor incentives: there is no large alternative landlord class to absorb a change in individual investors' behaviour.",
    disagreement:
      "Not disputed as a fact. The disagreement is about what follows: whether reliance on individual landlords is a reason to protect their incentives, or a structural weakness to be addressed directly.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Bureau of Statistics, Census of Population and Housing — tenure and landlord type",
        url: "https://www.abs.gov.au/census",
      },
    ],
    votes: { n: 21, agree: 19, well: 18 },
  },
  {
    key: "H-foreign-buyers",
    title: "Foreign buyers are the main reason house prices are out of reach",
    oneLiner: "Overseas money bidding up Australian homes is blamed for the affordability gap.",
    body: "Foreign purchasers, particularly in new apartment developments and prestige suburbs, are widely believed to be a major source of price pressure. Proponents argue that tightening foreign investment rules would do more for affordability than changing tax concessions for local investors.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: HOUSING,
    context:
      "Foreign buyers are already restricted to new dwellings and pay additional duties and fees. Their share of transactions, as reported by the foreign investment regulator, is small. The claim is nonetheless widely believed, which makes it useful to see how it rates.",
    disagreement:
      "Critics point to the regulator's own figures on the volume of approved foreign purchases and argue they are too small to drive a national market. Supporters argue the official figures understate purchases made through local intermediaries.",
    evidence: [],
    // Deliberately in the Partisan quadrant: popular, weakly constructed, no evidence attached.
    votes: { n: 30, agree: 21, well: 7 },
  },
  {
    key: "H-middle-income",
    title: "Most negatively geared investors have taxable incomes below $100,000",
    oneLiner: "Tax office data is cited to show the concession is used mainly by middle earners, not the wealthy.",
    body: "Tax statistics show that the majority of individuals reporting a net rental loss have taxable incomes under $100,000. Defenders of the concession cite this to argue it is a middle-class saving tool rather than a tax break for the rich.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: HOUSING,
    context:
      "This claim has been reverted repeatedly because 'income' is doing contested work. Taxable income is measured after the rental loss is deducted, so a high earner with a large loss appears as a middle earner. Measured by total income before deductions, the distribution tilts upward.",
    disagreement:
      "Both readings of the tax data are accurate; they measure different things. The dispute is over which measure the claim should use, and whether the claim as worded misleads.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Taxation Office, Taxation statistics — individuals by taxable income range, net rent",
        url: "https://www.ato.gov.au/about-ato/research-and-statistics/in-detail/taxation-statistics",
      },
    ],
    votes: { n: 26, agree: 12, well: 10 },
    contested: {
      reason:
        "Three reverts by different users inside 24 hours, over whether 'income' means taxable income after deductions or total income before them. Edits from non-moderators queue for review until the quiet period ends.",
      hoursAgo: 6,
      revertedBy: ["demo-user-a", "demo-user-b", "demo-user-c"],
    },
  },
  {
    key: "H-second-home-value",
    title: "The tax system should not treat buying a second home more favourably than buying a first",
    oneLiner: "A fairness claim, independent of any price effect.",
    body: "An owner-occupier cannot deduct mortgage interest; an investor can deduct it against wages. Proponents argue that whatever the market effect, a tax system that rewards the purchase of a second home over a first is backwards.",
    type: "VALUE",
    evidenceStrength: "NONE",
    tags: [...HOUSING, "TAX"],
    context:
      "This is the argument that remains if every empirical claim in the debate is conceded to the other side. It is a claim about what the tax system should express, not about what it causes.",
    disagreement:
      "Opponents answer that the deduction is for the cost of earning assessable rental income, consistent with how every other business expense is treated, and that singling out property is the real unfairness.",
    evidence: [],
    votes: { n: 28, agree: 20, well: 19 },
  },

  // ---------------------------------------------------------------------------
  // Debate 4 — migration cap
  // ---------------------------------------------------------------------------
  {
    key: "R-migration",
    title: "Net overseas migration should be held below 200,000 a year",
    oneLiner: "Whether the federal government should cap net arrivals below the levels of the past decade and well below the post-pandemic peak.",
    body: "Net overseas migration is arrivals minus departures of people who stay, or leave, for at least twelve months. It averaged just over 200,000 a year in the decade before the pandemic and exceeded 500,000 in 2022–23. The proposal is a cap of 200,000, which would require the government to manage the student, temporary-work and permanent programs together to hit it.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["IMMIGRATION", ...HOUSING],
    context:
      "Australia sets an annual permanent migration program but does not directly cap net overseas migration, most of which is temporary: students, working-holiday makers and temporary skilled workers. The post-pandemic rebound pushed net migration to a record, and both major parties have since proposed reducing it, with different targets.\n\nThe debate is entangled with housing: migration adds to demand for homes in the cities where construction is most constrained, and most of the argument for a cap runs through that channel.",
    disagreement:
      "Both sides accept that 2022–23 was exceptional and that housing is the pressure point. They divide on whether the cap is the right tool for a housing problem, and on who pays for it: a cap of this size falls mainly on international education.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Bureau of Statistics, Overseas Migration — net overseas migration, annual",
        url: "https://www.abs.gov.au/statistics/people/population/overseas-migration/latest-release",
      },
      {
        type: "Official report",
        citation: "Centre for Population, Population Statement — migration projections and components",
        url: "https://population.gov.au/",
      },
    ],
    timeline: [
      { label: "2010s", text: "Net overseas migration runs at roughly 200,000 to 250,000 a year, driven mainly by students and temporary workers." },
      { label: "2020–21", text: "Borders close. Net migration turns negative for the first time since the Second World War." },
      { label: "2022–23", text: "Reopened borders produce a record intake as students and temporary workers return." },
      { label: "2024", text: "Both major parties propose reducing net migration, with caps on international student numbers as the main lever." },
    ],
    votes: { n: 44, agree: 22, well: 23 },
  },
  {
    key: "M-nom-double",
    title: "Net overseas migration in 2022–23 was roughly double the average of the decade before the pandemic",
    oneLiner: "The post-pandemic intake was far above any previous year.",
    body: "The Bureau of Statistics recorded net overseas migration above 500,000 in 2022–23, against an average of a little over 200,000 a year across 2010 to 2019. It was the largest annual intake on record by a wide margin.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["IMMIGRATION"],
    context:
      "The number is the starting point of the current debate, and both sides use it. It is cited by supporters of a cap as evidence the system is out of control and by opponents as evidence of an obvious one-off.",
    disagreement:
      "The figure itself is not contested. Its meaning is: whether it describes a new normal or a rebound.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Bureau of Statistics, Overseas Migration — net overseas migration by financial year",
        url: "https://www.abs.gov.au/statistics/people/population/overseas-migration/latest-release",
      },
    ],
    votes: { n: 30, agree: 27, well: 25 },
  },
  {
    key: "M-catch-up",
    title: "The 2022–23 surge largely reflected students and temporary workers returning after two years of closed borders",
    oneLiner: "Two cohorts arrived in one year because none arrived in the two before.",
    body: "Net migration was negative in 2020–21. When borders reopened, the students and temporary workers who would have come across two or three years arrived together, and departures were low because few had been in the country long enough to leave. The Centre for Population's projections show net migration falling back towards its long-run level without any change in policy.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["IMMIGRATION"],
    context:
      "This is the standard explanation of the record year and the government's own account of it. It matters because a cap justified by an exceptional year may be set with that year in mind.",
    disagreement:
      "The mechanism is agreed. What is disputed is how far the number falls on its own and how fast, and whether 'back to the 2010s average' is itself too high.",
    evidence: [
      {
        type: "Official report",
        citation: "Centre for Population, Population Statement — analysis of post-pandemic net overseas migration",
        url: "https://population.gov.au/",
      },
    ],
    votes: { n: 27, agree: 21, well: 20 },
  },
  {
    key: "M-cap-needs-student-cuts",
    title: "Holding net overseas migration below 200,000 would require large cuts to international student numbers",
    oneLiner: "Students are the biggest component of net migration, so a cap of this size is mostly a cap on them.",
    body: "Permanent skilled and family visas are already capped and make up a minority of net migration. The remainder is dominated by students, with working-holiday makers and temporary skilled workers behind them. Holding the total below 200,000 while keeping the permanent program at current levels leaves international education as the only component large enough to cut.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["IMMIGRATION", "EDUCATION"],
    context:
      "This is where the migration debate actually turns. Supporters and opponents of a cap largely agree about housing pressure and about the record year; what they are really arguing about is whether cutting student numbers is an acceptable price.",
    disagreement:
      "The arithmetic is broadly accepted. The dispute is whether the cut should fall on students, on some other component, or on the permanent program, and what each choice costs.",
    evidence: [
      {
        type: "Official report",
        citation: "Centre for Population, Population Statement — components of net overseas migration by visa category",
        url: "https://population.gov.au/",
      },
      {
        type: "Official data",
        citation: "Department of Education, International education data and research — enrolments and commencements",
        url: "https://www.education.gov.au/international-education-data-and-research",
      },
    ],
    votes: { n: 25, agree: 19, well: 21 },
  },
  {
    key: "M-intl-ed-export",
    title: "International education is one of Australia's largest exports, worth tens of billions of dollars a year",
    oneLiner: "Fees and living expenses paid by overseas students rank with iron ore, coal and gas among export earners.",
    body: "The Bureau of Statistics counts spending by international students as a service export. Through the 2010s it grew to be Australia's largest services export and one of the top four exports overall, and it underwrites a large share of university research funding.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["EDUCATION", "ECONOMY"],
    context:
      "The export framing is how the sector describes itself and how the national accounts record it. Critics note that much of the spending is on rent and goods that would otherwise be consumed locally, and that the net benefit is smaller than the gross figure.",
    disagreement:
      "The figure is accepted. Whether it represents a benefit to Australians or mainly to universities, and how much of it would be lost under a cap, is disputed.",
    evidence: [
      {
        type: "Official data",
        citation: "Department of Education, Education export income — financial year",
        url: "https://www.education.gov.au/international-education-data-and-research",
      },
    ],
    votes: { n: 24, agree: 21, well: 20 },
  },
  {
    key: "M-shortages",
    title: "Employers in health, aged care and construction report persistent shortages that skilled migration helps fill",
    oneLiner: "The government's own shortage list shows the same occupations year after year.",
    body: "Jobs and Skills Australia's annual occupation shortage list has consistently included nurses, aged-care workers, electricians, carpenters and other trades. Employers in those sectors argue that skilled and temporary migration is the only way to staff them at current wages and training rates.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["IMMIGRATION", "LABOUR"],
    context:
      "Shortage lists are the formal basis for skilled visa eligibility, which is why they feature in every migration debate. They record employers' reported difficulty hiring, not an independent measure of need.",
    disagreement:
      "That the lists say this is agreed. Whether reported shortages reflect genuine scarcity or wages set too low to attract local workers is the dispute, and it does not resolve on the data alone.",
    evidence: [
      {
        type: "Official report",
        citation: "Jobs and Skills Australia, Occupation Shortage List",
        url: "https://www.jobsandskills.gov.au/",
      },
    ],
    votes: { n: 26, agree: 18, well: 16 },
  },
  {
    key: "M-skilled-minority",
    title: "Permanent skilled visas make up a minority of net overseas migration; students and other temporary entrants make up most of it",
    oneLiner: "A cap on total net migration need not touch the skilled program at all.",
    body: "The permanent skilled stream is set each year in the budget and has run at roughly 130,000 to 140,000 places, many granted to people already in the country. Net overseas migration is several times larger and is driven mainly by temporary arrivals. A cap could therefore be met without reducing the skilled intake.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["IMMIGRATION"],
    context:
      "The distinction between the permanent program, which the government sets, and net overseas migration, which it mostly does not, is lost in much public debate. It changes what a cap would actually cut.",
    disagreement:
      "The composition is not disputed. The argument is whether the skilled program could realistically be held harmless under a cap, given that many skilled visas go to former students.",
    evidence: [
      {
        type: "Official report",
        citation: "Centre for Population, Population Statement — net overseas migration by visa category",
        url: "https://population.gov.au/",
      },
    ],
    votes: { n: 22, agree: 19, well: 19 },
  },
  {
    key: "M-take-jobs",
    title: "Migrants take jobs that would otherwise go to Australian-born workers",
    oneLiner: "The oldest argument against migration, stated plainly.",
    body: "Each job filled by a migrant is, on this view, a job not filled by someone already here. Supporters of a cap argue that lower migration would push employers to train and hire locally and lift wages for Australian workers.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: ["IMMIGRATION", "LABOUR"],
    context:
      "The claim is widely held and almost never made by economists, who generally find that migrants add demand as well as supply and that the net effect on local employment is small. It is included because it circulates, and the community's rating of it is informative.",
    disagreement:
      "The claim treats the number of jobs as fixed. Critics argue that is the error: migrants also spend, start businesses and fill roles that enable other jobs. Whether low-wage local workers are an exception is the one point of genuine dispute.",
    evidence: [],
    // Deliberately in the Weak quadrant.
    votes: { n: 28, agree: 7, well: 5 },
  },
  {
    key: "M-entitled-to-decide",
    title: "A country is entitled to decide how many people it admits each year",
    oneLiner: "A claim about sovereignty, not about any particular number.",
    body: "Whatever the economic arguments, proponents hold that the size of the intake is a legitimate democratic decision, and that it is reasonable for the government to set a figure and manage the programs to meet it.",
    type: "VALUE",
    evidenceStrength: "NONE",
    tags: ["IMMIGRATION", "GOVERNANCE"],
    context:
      "Almost everyone in the debate accepts this in principle, which is why it does little to settle the question of what the number should be. It is here because it is often stated as if it did.",
    disagreement:
      "The principle is barely contested. The disagreement is whether invoking it adds anything to an argument about a specific cap, which is a question about this connection rather than about the claim.",
    evidence: [],
    votes: { n: 31, agree: 27, well: 17 },
  },

  // ---------------------------------------------------------------------------
  // Shared housing-supply claim (used in three debates)
  // ---------------------------------------------------------------------------
  {
    key: "H-supply-lagged",
    title: "New housing completions have not kept pace with population growth in Australia's largest cities over the past decade",
    oneLiner: "Dwellings built per new resident have fallen, and vacancy rates in Sydney, Melbourne, Brisbane and Perth sit near record lows.",
    body: "Completions peaked around 2017 and fell through the pandemic as costs rose and builders failed, while population growth resumed at pace. The national housing agency's projections show a cumulative shortfall against household formation through the second half of the decade.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: HOUSING,
    context:
      "This claim sits underneath several debates at once: migration, negative gearing, planning and parking all argue about the causes and cures of the same shortfall. It is written once here so each debate connects to the same evidence.",
    disagreement:
      "The shortfall is broadly accepted. What is contested is how much of it reflects demand growth and how much reflects construction capacity, planning constraints and financing, because each answer points to a different policy.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Bureau of Statistics, Building Approvals, Australia — dwelling units approved, monthly",
        url: "https://www.abs.gov.au/statistics/industry/building-and-construction/building-approvals-australia/latest-release",
      },
      {
        type: "Official report",
        citation: "Housing Australia (formerly NHFIC), State of the Nation's Housing — supply and demand projections",
        url: "https://www.housingaustralia.gov.au/",
      },
    ],
    votes: { n: 39, agree: 34, well: 30 },
  },

  // ---------------------------------------------------------------------------
  // Debate 5 — environmental approval deadlines
  // ---------------------------------------------------------------------------
  {
    key: "R-approvals",
    title: "Federal environmental approvals should carry binding statutory decision deadlines",
    oneLiner: "Whether the environment minister should be required by law to decide a referred project within a fixed period.",
    body: "Projects likely to affect matters of national environmental significance must be referred to the federal environment minister for assessment and approval. The Act sets indicative timeframes that are routinely stopped and extended. The proposal makes the deadlines binding, with a defined consequence if they pass.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["ENVIRONMENT", "ECONOMY"],
    context:
      "The Environment Protection and Biodiversity Conservation Act has been reviewed twice since it took effect in 2000, and both reviews found it slow and ineffective. The 2020 independent review recommended national environmental standards and an independent regulator; the deadlines proposal comes from the business and renewable-energy side of the same debate, which argues that process delay is now the binding constraint on the energy transition and on housing.",
    disagreement:
      "Both sides accept the process is slow and that the Act is failing on its environmental objectives. They divide on whether a deadline fixes the delay or simply changes who bears it, and above all on what should happen when the clock runs out.",
    evidence: [
      {
        type: "Official report",
        citation: "Independent Review of the EPBC Act (Samuel Review), final report, 2020",
        url: "https://epbcactreview.environment.gov.au/",
      },
    ],
    timeline: [
      { label: "2000", text: "The EPBC Act takes effect, creating a federal approval layer for matters of national environmental significance." },
      { label: "2009", text: "The first statutory review finds the Act cumbersome and recommends reform. Little changes." },
      { label: "2020", text: "The second independent review finds the Act 'ineffective and inefficient', failing both industry and the environment." },
      { label: "2024", text: "Reform legislation is split and partly deferred; renewable-energy developers join miners in calling for faster decisions." },
    ],
    votes: { n: 34, agree: 17, well: 18 },
  },
  {
    key: "A-samuel-slow",
    title: "The 2020 independent review of the EPBC Act found its approval processes slow, duplicative and unpredictable",
    oneLiner: "The government's own review reached the conclusion industry had been making for years.",
    body: "The review, led by Professor Graeme Samuel, found that assessment and approval under the Act duplicated state processes, took far longer than the statutory timeframes suggested, and gave proponents little certainty about what would be required of them.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["ENVIRONMENT"],
    context:
      "The review was commissioned by a government sympathetic to industry and is nonetheless cited approvingly by environment groups, because it was equally damning about the Act's environmental record. It is the common reference point for everyone in the reform debate.",
    disagreement:
      "The finding itself is not disputed. What is disputed is which of the review's remedies to adopt: it recommended standards and an independent regulator, not deadlines.",
    evidence: [
      {
        type: "Official report",
        citation: "Independent Review of the EPBC Act, final report, 2020 — chapter on efficiency and duplication",
        url: "https://epbcactreview.environment.gov.au/",
      },
    ],
    votes: { n: 29, agree: 26, well: 25 },
  },
  {
    key: "A-delays-hit-renewables",
    title: "Approval delays fall on renewable energy and transmission projects as much as on mines and gas fields",
    oneLiner: "The energy transition now queues behind the same process the Act was designed to make mines pass through.",
    body: "Wind farms, solar farms and the transmission lines connecting them routinely trigger federal referral because of their footprint. Industry bodies report assessment times of two to four years, which they argue is incompatible with the build rate the market operator's plan requires.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["ENVIRONMENT", ...ENERGY],
    context:
      "This is what changed the politics of approval reform. When only extractive projects complained of delay, reform had one constituency; when the renewable build-out joined them, it had two.",
    disagreement:
      "Renewable developers' delay figures are accepted in broad terms. Environment groups argue that transmission and wind projects do have real impacts on threatened species and that fast-tracking them is not obviously better for the environment.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Clean Energy Council, submissions on environmental approval timeframes for renewable energy and transmission projects",
        url: "https://www.cleanenergycouncil.org.au/",
      },
    ],
    votes: { n: 23, agree: 19, well: 17 },
  },
  {
    key: "A-act-failed-species",
    title: "The same review found the Act has failed to halt the decline of Australia's threatened species",
    oneLiner: "The slow process is not buying environmental outcomes either.",
    body: "The Samuel Review found that the environment is in a state of decline under the Act, that the number of threatened species has grown, and that cumulative impacts are not assessed at all. Its reform package was designed to improve environmental results, not only speed.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["ENVIRONMENT"],
    context:
      "Environment groups cite this finding to argue that reform which addresses only speed misreads the review. It is the mirror image of the efficiency finding and comes from the same document.",
    disagreement:
      "Not contested as a finding. The argument is whether speed and environmental outcomes are in tension, or whether a faster process with clearer standards could improve both.",
    evidence: [
      {
        type: "Official report",
        citation: "Independent Review of the EPBC Act, final report, 2020 — chapter on environmental outcomes",
        url: "https://epbcactreview.environment.gov.au/",
      },
    ],
    votes: { n: 26, agree: 23, well: 23 },
  },
  {
    key: "A-deemed-approval",
    title: "A deadline that defaults to approval when time runs out rewards under-resourcing the regulator",
    oneLiner: "If missing the clock means yes, the cheapest path to approval is to starve the assessors.",
    body: "The practical question is what happens when a binding deadline passes. If the answer is deemed approval, then any government that wants projects approved need only fund the department thinly. The incentive runs the wrong way and the environmental assessment becomes a formality.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: ["ENVIRONMENT", "GOVERNANCE"],
    context:
      "This is the crux of the deadlines debate. Most people who support faster decisions and most who oppose deemed approval can agree on everything except this design question, which is why it is a claim of its own.",
    disagreement:
      "Supporters of deadlines mostly accept the incentive problem and argue it is a reason to design the default carefully, not to abandon deadlines. The disagreement is over whether any default short of approval would actually bind.",
    evidence: [],
    votes: { n: 27, agree: 20, well: 23 },
  },
  {
    key: "A-default-refusal",
    title: "Deadlines could default to refusal, or to an automatic extension with a public reason, rather than to approval",
    oneLiner: "The incentive problem is a design choice, and other defaults exist.",
    body: "A missed deadline could result in refusal, forcing the proponent to re-refer, which gives the regulator no incentive to stall but gives the minister a strong reason to decide. Or it could trigger a public statement of reasons and a short fixed extension, making delay visible without pre-deciding the outcome.",
    type: "PROPOSAL",
    evidenceStrength: "NONE",
    tags: ["ENVIRONMENT", "GOVERNANCE"],
    context:
      "This is a proposal nested inside a proposal: it answers the strongest objection to deadlines by changing their design. If it is accepted, the parent objection loses most of its force.",
    disagreement:
      "Industry argues default refusal simply moves the delay to a re-referral loop. Environment groups argue that a published-reasons extension would in practice become routine. Both may be right about different regulators.",
    evidence: [],
    votes: { n: 19, agree: 14, well: 15 },
  },
  {
    key: "A-delay-pre-referral",
    title: "Much of the delay occurs before formal referral, in proponent studies a statutory clock would not cover",
    oneLiner: "The clock can only time the part of the process it can see.",
    body: "Proponents often spend years on baseline surveys, consultation and design changes before a project is formally referred. A statutory deadline starts at referral and would leave that period untouched, so headline approval times could fall without total project timelines changing much.",
    type: "FACT",
    evidenceStrength: "WEAK",
    tags: ["ENVIRONMENT"],
    context:
      "Timing data on the pre-referral phase is thin because it is not recorded anywhere official; the claim rests on proponents' own accounts and on inquiry evidence rather than a systematic dataset.",
    disagreement:
      "The claim is plausible and weakly evidenced. Supporters of deadlines answer that much pre-referral work is itself driven by uncertainty about what the regulator will require, which clearer standards and deadlines would reduce.",
    evidence: [
      {
        type: "Official report",
        citation: "Productivity Commission, Resources Sector Regulation, study report, 2020 — evidence on pre-referral timelines",
      },
    ],
    votes: { n: 17, agree: 11, well: 9 },
  },

  // ---------------------------------------------------------------------------
  // Debate 6 — parking minimums
  // ---------------------------------------------------------------------------
  {
    key: "R-parking",
    title: "Councils should abolish minimum parking requirements for new housing",
    oneLiner: "Whether planning schemes should stop requiring a set number of car spaces per new dwelling and let builders decide.",
    body: "Most Australian planning schemes require new apartments and townhouses to include a minimum number of off-street car spaces, typically one or more per dwelling. The proposal removes the minimum. Developers could still build parking; they would no longer be required to.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: [...HOUSING, "TRANSPORT", "LOCAL"],
    context:
      "Parking minimums date from the mid-twentieth century and were set to prevent new buildings from pushing cars onto the street. They have since been identified as a significant hidden cost of housing, because structured parking is expensive and the requirement applies whether or not residents own cars. Several cities overseas and a small number of Australian councils have removed them in whole or in part.\n\nThis is a local-government question that most people never encounter directly but which shapes what gets built near them.",
    disagreement:
      "Both sides accept that parking is costly and that some residents will own cars regardless. They divide on who should bear the mismatch: the resident who parks on the street, the neighbour who loses a space, or the buyer who pays for a car space they do not use.",
    evidence: [
      {
        type: "Academic research",
        citation: "Donald Shoup, The High Cost of Free Parking (updated edition, 2011)",
      },
    ],
    timeline: [
      { label: "1950s–70s", text: "Australian councils adopt parking minimums as cars become universal." },
      { label: "2005", text: "Shoup's work popularises the argument that minimums are an unpriced subsidy to driving." },
      { label: "2016", text: "Auckland removes minimums citywide; several US cities follow over the next decade." },
      { label: "Now", text: "Some Australian inner-city councils have removed minimums near transit; most retain them." },
    ],
    votes: { n: 30, agree: 16, well: 17 },
  },
  {
    key: "P-cost-per-space",
    title: "Structured parking adds tens of thousands of dollars per space to the cost of a new apartment",
    oneLiner: "Basement and podium parking is among the most expensive floor space in a building.",
    body: "Industry cost guides and academic studies put the construction cost of a basement car space at well above the cost of an equivalent area of living space, and the requirement often forces an extra basement level. That cost is recovered in the sale price of every apartment, including those bought by people without cars.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: HOUSING,
    context:
      "The cost claim is the economic core of the case against minimums. It is well established in the planning literature and in developers' own feasibility models, but is rarely visible to buyers.",
    disagreement:
      "The magnitude is broadly agreed. Whether removing the requirement would lower prices or simply raise developer margins is the live question, and depends on local competition.",
    evidence: [
      {
        type: "Academic research",
        citation: "Donald Shoup, The High Cost of Free Parking — construction cost of structured parking",
      },
    ],
    votes: { n: 26, agree: 22, well: 20 },
  },
  {
    key: "P-auckland",
    title: "Auckland removed minimum parking requirements citywide in 2016, and new developments near frequent transit have since provided markedly less parking",
    oneLiner: "The closest large-scale natural experiment in a comparable city.",
    body: "The Auckland Unitary Plan, operative from late 2016, removed minimum parking requirements across the city. Subsequent research found that developments near frequent public transport built substantially fewer spaces per dwelling, while those in car-dependent areas continued to provide roughly what they had before.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: [...HOUSING, "TRANSPORT"],
    context:
      "Auckland is the reference case for Australian councils because its housing market, car ownership and urban form are similar. It is also the case opponents study for evidence of street-parking spillover.",
    disagreement:
      "The change in parking provision is well documented. Whether it reduced housing costs, and whether it worsened on-street parking in affected suburbs, are still being argued over.",
    evidence: [
      {
        type: "Primary source",
        citation: "Auckland Council, Auckland Unitary Plan (Operative in part, 2016) — removal of minimum parking requirements",
        url: "https://www.aucklandcouncil.govt.nz/",
      },
    ],
    votes: { n: 23, agree: 18, well: 19 },
  },
  {
    key: "P-spillover",
    title: "Without minimums, residents' cars spill onto surrounding streets and crowd out existing residents",
    oneLiner: "If the building does not house the cars, the street does.",
    body: "Residents of new developments will own cars at roughly the rate of their neighbours, whatever the building provides. Opponents of removal argue the predictable result is competition for kerbside space that existing residents regard as theirs.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: [...HOUSING, "TRANSPORT"],
    context:
      "This is the objection that fills council meetings. It is a real cost; the question is whether it is the council's problem to solve through the building or through the street.",
    disagreement:
      "Supporters of removal generally concede spillover occurs where street parking is free and unmanaged, and argue the remedy is to manage the street. Opponents regard that as shifting a cost onto existing residents who did not choose it.",
    evidence: [],
    votes: { n: 27, agree: 16, well: 14 },
  },
  {
    key: "P-manage-street",
    title: "Councils can manage street parking with permits and pricing, independently of what new buildings provide",
    oneLiner: "Kerbside space is the council's to allocate; it does not have to be first-come, first-served.",
    body: "Resident permit schemes, time limits and paid parking are standard tools and are already used in most inner suburbs. They address street crowding directly, whatever the parking provision in new buildings, and can be introduced in the same decision that removes the minimum.",
    type: "PROPOSAL",
    evidenceStrength: "NONE",
    tags: ["TRANSPORT", "LOCAL"],
    context:
      "This is the standard answer to the spillover objection and is the usual companion measure where minimums have been removed.",
    disagreement:
      "The tools exist and work. The disagreement is political: residents who currently park free on the street are being asked to accept permits or charges so that new residents can pay less for housing.",
    evidence: [],
    votes: { n: 22, agree: 15, well: 17 },
  },
  {
    key: "P-suburbs-lack-transit",
    title: "Most Australian suburbs lack public transport frequent enough to make living without a car practical",
    oneLiner: "Outside the inner ring, a car is not a choice.",
    body: "Census journey-to-work data shows car use above 70 per cent in most middle and outer suburbs, and service frequency outside peak hours is low. In those areas the assumption behind removing minimums, that some residents will choose not to own a car, does not hold for most households.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["TRANSPORT"],
    context:
      "This claim limits the geography of the proposal rather than opposing it outright: it suggests removal makes sense near frequent transit and little sense elsewhere, which is roughly what Auckland's experience showed.",
    disagreement:
      "The travel data is not disputed. Whether it argues for keeping minimums in those suburbs, or for letting developers there build parking anyway because buyers will demand it, is where the two sides part.",
    evidence: [
      {
        type: "Official data",
        citation: "Australian Bureau of Statistics, Census of Population and Housing — method of travel to work by statistical area",
        url: "https://www.abs.gov.au/census",
      },
    ],
    votes: { n: 21, agree: 17, well: 16 },
  },
  {
    key: "P-market-provides",
    title: "Developers still build parking where buyers want it; minimums only bind where demand is below the mandate",
    oneLiner: "A minimum changes nothing where people want cars, and forces waste where they do not.",
    body: "In car-dependent suburbs, apartments without parking do not sell, so developers build it whether or not it is required. The minimum only has an effect where buyers would accept less parking than the rule demands, which is exactly where it is most costly and least useful.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: [...HOUSING, "TRANSPORT"],
    context:
      "This is the market-logic version of the case for removal and the reason the Auckland result is not surprising to its supporters: provision fell where demand was lower and held where it was not.",
    disagreement:
      "Opponents argue developers under-provide because the spillover cost falls on neighbours, not on the building, so the market signal is incomplete. Whether that externality is large is the dispute.",
    evidence: [],
    votes: { n: 24, agree: 17, well: 20 },
  },
];

// =============================================================================
// CONNECTIONS
// `from` is the child (the argument), `to` is the parent it bears on.
// =============================================================================

const connections: ConnDef[] = [
  // --- nuclear ---------------------------------------------------------------
  { from: "E-gencost", to: "R-nuclear", relation: "CONTRADICTS", strength: "DECISIVE", reason: "If nuclear is the most expensive option, the main argument for lifting the ban loses its footing.", votes: [22, 9, 5] },
  { from: "E-not-before-2040", to: "R-nuclear", relation: "CONTRADICTS", strength: "DECISIVE", reason: "The proposal is argued as a way to replace coal; if nothing could run before 2040 that purpose fails.", votes: [19, 10, 4] },
  { from: "E-coal-closures", to: "R-nuclear", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Coal exits before a reactor could arrive, so nuclear cannot be the coal replacement proponents describe.", votes: [8, 14, 6] },
  { from: "E-gas-firming", to: "R-nuclear", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Firming through the transition is already planned with gas; this weakens the urgency argument without addressing the ban itself.", votes: [2, 7, 12] },
  { from: "E-ban-separate", to: "R-nuclear", relation: "SUPPORTS", strength: "RELEVANT", reason: "Separates repeal from construction, which blunts most cost and timing objections without settling them.", votes: [7, 13, 6] },
  { from: "E-france-ontario", to: "R-nuclear", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the technology can run a low-emissions grid; it does not show it can be built here in time or at a competitive cost.", votes: [6, 16, 7] },
  { from: "E-unsafe", to: "R-nuclear", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Safety is a reason to regulate reactors, which repeal would permit; it does not by itself argue for a legislative ban.", votes: [3, 5, 16] },

  // --- the nuclear crux has its own arguments --------------------------------
  { from: "E-no-regulator", to: "E-not-before-2040", relation: "SUPPORTS", strength: "RELEVANT", reason: "Each missing institution adds years to the sequence before construction can start.", votes: [8, 12, 3] },
  { from: "E-uae-twelve-years", to: "E-not-before-2040", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Shows a newcomer can build in about twelve years; from 2026 that lands in the late 2030s, so it narrows the claim without defeating it.", votes: [5, 14, 6] },
  { from: "A-samuel-slow", to: "E-not-before-2040", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "A reactor would pass through the same slow approval process as every other major project, adding to the timeline.", votes: [1, 6, 11] },

  // --- gas reservation -------------------------------------------------------
  { from: "E-wa-domgas", to: "R-gas", relation: "SUPPORTS", strength: "DECISIVE", reason: "The one Australian precedent for the policy coincides with the outcome the policy is meant to produce.", votes: [15, 9, 3] },
  { from: "E-east-prices", to: "R-gas", relation: "SUPPORTS", strength: "RELEVANT", reason: "Establishes the problem the proposal responds to; it does not by itself show reservation is the fix.", votes: [7, 13, 4] },
  { from: "E-gas-firming", to: "R-gas", relation: "SUPPORTS", strength: "RELEVANT", reason: "If gas remains necessary for firming, securing domestic supply has a system-reliability rationale beyond price.", votes: [6, 11, 4] },
  { from: "E-coal-closures", to: "R-gas", relation: "SUPPORTS", strength: "RELEVANT", reason: "Coal's exit increases reliance on gas for firming during the 2030s, when a shortfall would bite hardest.", votes: [5, 10, 6] },
  { from: "E-retrospective", to: "R-gas", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Counts against any design that touches existing contracts; a prospective policy avoids most of it.", votes: [6, 12, 4] },
  { from: "E-adgsm", to: "R-gas", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If a supply lever already exists, reservation must show what it adds beyond price suppression.", votes: [5, 11, 4] },
  { from: "E-market-working", to: "R-gas", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Attacks the premise that lower domestic gas prices are desirable at all during a transition away from gas.", votes: [5, 10, 7] },
  { from: "E-gencost", to: "R-gas", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Cheaper renewables reduce long-run gas demand, which weakens the case for securing supply, but only slowly.", votes: [1, 6, 13] },

  // --- the sovereign-risk objection has a rebuttal ---------------------------
  { from: "E-wa-prospective", to: "E-retrospective", relation: "CONTRADICTS", strength: "RELEVANT", reason: "The precedent the proposal relies on did not reopen contracts, so a prospective design is available.", votes: [6, 10, 3] },

  // --- negative gearing ------------------------------------------------------
  { from: "H-investor-loans-established", to: "R-negative-gearing", relation: "SUPPORTS", strength: "DECISIVE", reason: "The proposal's core premise is that the concession is not producing new supply; this is the evidence for it.", votes: [17, 10, 4] },
  { from: "H-ng-materially-affordable", to: "R-negative-gearing", relation: "SUPPORTS", strength: "RELEVANT", reason: "The outcome most proponents want from the proposal; it is argued separately because it may be false while the proposal is still justified.", votes: [9, 14, 6] },
  { from: "H-second-home-value", to: "R-negative-gearing", relation: "SUPPORTS", strength: "RELEVANT", reason: "A fairness ground that survives even if the price effect is negligible.", votes: [8, 12, 8] },
  { from: "H-rents-rise", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "DECISIVE", reason: "If true, the proposal harms the renters it is meant to help, which would defeat it.", votes: [14, 11, 7] },
  { from: "H-supply-lagged", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If supply is the dominant driver, the concession is a second-order factor and the proposal aims at the wrong target.", votes: [12, 11, 5] },
  { from: "H-middle-income", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Who benefits bears on fairness, not on whether the concession adds supply or raises prices.", votes: [3, 9, 14] },
  { from: "H-foreign-buyers", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Argues the price problem lies elsewhere; even if true it does not bear on what the concession does.", votes: [9, 10, 11] },

  // --- the affordability claim has evidence against it -------------------------
  { from: "H-grattan-two-percent", to: "H-ng-materially-affordable", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A 2 per cent effect is real but hard to call material against a decade of double-digit growth.", votes: [8, 13, 3] },

  // --- the rent objection has arguments both ways ----------------------------
  { from: "H-quarantine-1985", to: "H-rents-rise", relation: "CONTRADICTS", strength: "RELEVANT", reason: "The only natural experiment shows rent rises tracked local vacancy, not the tax change.", votes: [9, 10, 4] },
  { from: "H-private-landlords", to: "H-rents-rise", relation: "SUPPORTS", strength: "RELEVANT", reason: "If individuals supply most rentals, a change to their incentives acts on most of the stock.", votes: [5, 12, 4] },

  // --- migration -------------------------------------------------------------
  { from: "H-supply-lagged", to: "R-migration", relation: "SUPPORTS", strength: "DECISIVE", reason: "Housing pressure is the central argument for a cap; without a supply shortfall the case largely dissolves.", votes: [20, 9, 3] },
  { from: "M-nom-double", to: "R-migration", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the recent intake was far above the proposed cap, which is the problem the proposal names.", votes: [8, 15, 4] },
  { from: "M-entitled-to-decide", to: "R-migration", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Establishes that a cap is legitimate, not that this cap is right; it does little work for the specific number.", votes: [6, 8, 17] },
  { from: "M-take-jobs", to: "R-migration", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Widely made, but it does not engage with how labour markets actually absorb migrants.", votes: [4, 6, 15] },
  { from: "M-catch-up", to: "R-migration", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If the record year corrects itself, a permanent cap is a response to a temporary condition.", votes: [9, 13, 5] },
  { from: "M-cap-needs-student-cuts", to: "R-migration", relation: "CONTRADICTS", strength: "DECISIVE", reason: "Names the cost of the proposal; whether it is acceptable is what the debate actually turns on.", votes: [13, 9, 3] },
  { from: "M-shortages", to: "R-migration", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A cap that reached skilled migration would worsen shortages; whether it need reach them is argued below.", votes: [6, 14, 6] },
  { from: "M-intl-ed-export", to: "R-migration", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Quantifies what a student-heavy cut would put at risk.", votes: [7, 12, 5] },

  // --- the migration crux has its own argument -------------------------------
  { from: "M-intl-ed-export", to: "M-cap-needs-student-cuts", relation: "SUPPORTS", strength: "DECISIVE", reason: "Shows why cutting student numbers is a cost and not a rounding error.", votes: [14, 8, 3] },
  { from: "M-skilled-minority", to: "M-shortages", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A cap could be met without touching skilled visas, so shortages need not follow from a cap.", votes: [7, 11, 4] },

  // --- housing supply has its own causes ---------------------------------------
  { from: "A-samuel-slow", to: "H-supply-lagged", relation: "SUPPORTS", strength: "RELEVANT", reason: "Approval delay is one of several constraints on how fast homes get built.", votes: [4, 12, 7] },
  { from: "M-nom-double", to: "H-supply-lagged", relation: "SUPPORTS", strength: "RELEVANT", reason: "The record intake increased the demand side of the shortfall in a single year.", votes: [8, 11, 5] },

  // --- approvals -------------------------------------------------------------
  { from: "A-samuel-slow", to: "R-approvals", relation: "SUPPORTS", strength: "DECISIVE", reason: "The proposal exists to fix exactly the problem the review documented.", votes: [16, 9, 4] },
  { from: "A-delays-hit-renewables", to: "R-approvals", relation: "SUPPORTS", strength: "RELEVANT", reason: "Broadens who bears the cost of delay, which strengthens the case without changing its logic.", votes: [7, 12, 4] },
  { from: "A-act-failed-species", to: "R-approvals", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Suggests speed is not the Act's only failure, and that fixing speed alone may worsen the other.", votes: [8, 13, 5] },
  { from: "A-deemed-approval", to: "R-approvals", relation: "CONTRADICTS", strength: "DECISIVE", reason: "If the only workable default is approval, the proposal gutted the assessment it was meant to speed up.", votes: [13, 10, 4] },
  { from: "A-delay-pre-referral", to: "R-approvals", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If most delay is outside the clock, the proposal addresses a minority of the problem.", votes: [4, 9, 4] },

  // --- the approvals crux has a rebuttal -------------------------------------
  { from: "A-default-refusal", to: "A-deemed-approval", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Shows the incentive problem attaches to one default, not to deadlines as such.", votes: [6, 10, 3] },

  // --- parking ---------------------------------------------------------------
  { from: "P-cost-per-space", to: "R-parking", relation: "SUPPORTS", strength: "DECISIVE", reason: "The affordability case rests on parking being expensive; this is the evidence that it is.", votes: [14, 9, 3] },
  { from: "P-auckland", to: "R-parking", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the policy produces the intended change in provision in a comparable city.", votes: [7, 12, 4] },
  { from: "H-supply-lagged", to: "R-parking", relation: "SUPPORTS", strength: "RELEVANT", reason: "Anything that lowers the cost of building homes bears on the shortfall, though parking is one factor among many.", votes: [5, 13, 8] },
  { from: "P-market-provides", to: "R-parking", relation: "SUPPORTS", strength: "RELEVANT", reason: "Answers the fear that removal means no parking anywhere.", votes: [6, 12, 6] },
  { from: "P-spillover", to: "R-parking", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A genuine cost of the proposal, borne by people who did not choose it.", votes: [8, 13, 6] },
  { from: "P-suburbs-lack-transit", to: "R-parking", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Limits where the proposal's premise holds; it argues for a narrower policy rather than none.", votes: [5, 12, 4] },

  // --- the spillover objection has a rebuttal --------------------------------
  { from: "P-manage-street", to: "P-spillover", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Spillover is real only where the street is unmanaged, and managing it is within the same council's power.", votes: [7, 11, 4] },
];

// =============================================================================
// VALIDATION — fail loudly rather than seed something inconsistent
// =============================================================================

function validate() {
  const keys = new Set<string>();
  const problems: string[] = [];

  for (const c of claims) {
    if (keys.has(c.key)) problems.push(`duplicate claim key ${c.key}`);
    keys.add(c.key);
    if (c.evidence.length === 0 && c.evidenceStrength !== "NONE") {
      problems.push(`${c.key}: evidence strength ${c.evidenceStrength} with no evidence items (must be NONE)`);
    }
    if (c.evidence.length > 0 && c.evidenceStrength === "NONE") {
      problems.push(`${c.key}: has evidence items but strength NONE`);
    }
    if (c.evidenceStrength === "STRONG" && !c.evidence.some((e) => e.url)) {
      problems.push(`${c.key}: STRONG evidence requires at least one item with a checkable URL`);
    }
    if (c.type === "FACT" && c.evidence.length === 0) {
      problems.push(`${c.key}: FACT claim with no evidence`);
    }
    if (c.key.startsWith("R-") && (!c.timeline || c.timeline.length === 0)) {
      problems.push(`${c.key}: root debate without a timeline`);
    }
    if (c.votes && (c.votes.agree > c.votes.n || c.votes.well > c.votes.n)) {
      problems.push(`${c.key}: demo vote counts exceed total`);
    }
  }

  const pairs = new Set<string>();
  for (const conn of connections) {
    if (!keys.has(conn.from)) problems.push(`connection from unknown claim ${conn.from}`);
    if (!keys.has(conn.to)) problems.push(`connection to unknown claim ${conn.to}`);
    if (conn.from === conn.to) problems.push(`self-connection on ${conn.from}`);
    const pair = `${conn.from}→${conn.to}`;
    if (pairs.has(pair)) problems.push(`duplicate connection ${pair}`);
    pairs.add(pair);
  }

  if (problems.length) {
    throw new Error(`Seed content failed validation:\n  - ${problems.join("\n  - ")}`);
  }
}

// =============================================================================
// WRITE
// =============================================================================

function demoClaimVotes(key: string, v: DemoVotes | undefined) {
  if (!DEMO_VOTES || !v) return [];
  const seed = nextSeed();
  const agree = boolSeries(v.n, v.agree, seed + 1);
  const well = boolSeries(v.n, v.well, seed + 7);
  return Array.from({ length: v.n }, (_, i) => ({
    voterId: `demo-${key}-${i}`,
    agree: agree[i],
    wellConstructed: well[i],
  }));
}

function demoStrengthVotes(pair: string, v: [number, number, number] | undefined) {
  if (!DEMO_VOTES || !v) return [];
  const [d, r, t] = v;
  const series: ConnectionStrength[] = seededShuffle(
    [...Array<ConnectionStrength>(d).fill("DECISIVE"), ...Array<ConnectionStrength>(r).fill("RELEVANT"), ...Array<ConnectionStrength>(t).fill("TANGENTIAL")],
    nextSeed(),
  );
  return series.map((value, i) => ({ voterId: `demo-${pair}-${i}`, value }));
}

function summarise() {
  const roots = claims.filter((c) => c.key.startsWith("R-"));
  const usedCount = connections.reduce<Record<string, number>>((acc, c) => ((acc[c.from] = (acc[c.from] ?? 0) + 1), acc), {});
  const reused = Object.entries(usedCount).filter(([, n]) => n > 1);
  const grandchildren = connections.filter((c) => !c.to.startsWith("R-")).length;
  const byType = claims.reduce<Record<string, number>>((acc, c) => ((acc[c.type] = (acc[c.type] ?? 0) + 1), acc), {});
  const byEvidence = claims.reduce<Record<string, number>>((acc, c) => ((acc[c.evidenceStrength] = (acc[c.evidenceStrength] ?? 0) + 1), acc), {});
  const quadrant = (v: DemoVotes) => {
    const a = v.agree / v.n >= 0.5;
    const w = v.well / v.n >= 0.5;
    return a && w ? "Compelling" : !a && w ? "Steelman" : a && !w ? "Partisan" : "Weak";
  };
  const byQuadrant = claims.reduce<Record<string, number>>((acc, c) => {
    if (c.votes) acc[quadrant(c.votes)] = (acc[quadrant(c.votes)] ?? 0) + 1;
    return acc;
  }, {});
  return { roots: roots.length, reused, grandchildren, byType, byEvidence, byQuadrant };
}

async function main() {
  validate();
  const s = summarise();

  if (process.env.SEED_DRY_RUN === "true") {
    console.log(`Dry run: content validates.`);
    console.log(`  ${claims.length} claims in ${s.roots} debates, ${connections.length} connections`);
    console.log(`  ${s.reused.length} claims used in more than one place: ${s.reused.map(([k, n]) => `${k}×${n}`).join(", ")}`);
    console.log(`  ${s.grandchildren} connections sit two or more levels below a debate root`);
    console.log(`  by type: ${JSON.stringify(s.byType)}`);
    console.log(`  by evidence: ${JSON.stringify(s.byEvidence)}`);
    console.log(`  demo-vote quadrants: ${JSON.stringify(s.byQuadrant)}`);
    return;
  }

  console.log("Clearing existing data...");
  await prisma.connectionStrengthVote.deleteMany();
  await prisma.connectionRevision.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.claimVote.deleteMany();
  await prisma.claimRevert.deleteMany();
  await prisma.claimFlag.deleteMany();
  await prisma.claimRevision.deleteMany();
  await prisma.evidenceItem.deleteMany();
  await prisma.claimTimelineEvent.deleteMany();
  await prisma.claim.deleteMany();

  console.log(`Seeding ${claims.length} claims (demo votes ${DEMO_VOTES ? "on" : "off"})...`);
  const ids: Record<string, string> = {};
  const now = Date.now();

  for (const c of claims) {
    const contestedAt = c.contested ? new Date(now - c.contested.hoursAgo * 3600_000) : null;
    const created = await prisma.claim.create({
      data: {
        slug: slugify(c.title),
        title: c.title,
        oneLiner: c.oneLiner,
        body: c.body,
        type: c.type,
        evidenceStrength: c.evidenceStrength,
        tags: c.tags,
        contextBackground: c.context,
        contextDisagreement: c.disagreement,
        contestedAt,
        contestedReason: c.contested?.reason ?? null,
        // Mirrors QUIET_PERIOD_MS in src/lib/contested.ts (7 days from entry).
        contestedUntil: contestedAt ? new Date(contestedAt.getTime() + 7 * 24 * 3600_000) : null,
        timeline: c.timeline ? { create: c.timeline.map((t, i) => ({ label: t.label, text: t.text, sortOrder: i })) } : undefined,
        evidenceItems: { create: c.evidence },
        votes: { create: demoClaimVotes(c.key, c.votes) },
        revisions: { create: { ...AUTHOR, summary: "Initial claim", snapshot: {}, pending: false } },
        reverts: c.contested
          ? {
              create: c.contested.revertedBy.map((who, i) => ({
                revertedBy: who,
                createdAt: new Date(now - (c.contested!.hoursAgo + 1 + i) * 3600_000),
              })),
            }
          : undefined,
      },
    });
    ids[c.key] = created.id;
  }

  console.log(`Seeding ${connections.length} connections...`);
  for (const conn of connections) {
    await prisma.connection.create({
      data: {
        fromClaimId: ids[conn.from],
        toClaimId: ids[conn.to],
        relation: conn.relation,
        statedStrength: conn.strength,
        statedReason: conn.reason,
        strengthVotes: { create: demoStrengthVotes(`${conn.from}-${conn.to}`, conn.votes) },
        revisions: { create: { ...AUTHOR, summary: "Initial connection", snapshot: {}, pending: false } },
      },
    });
  }

  console.log(`Done. ${claims.length} claims (${s.roots} debates), ${connections.length} connections, ${s.reused.length} claims used in more than one place.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
