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

/** A public piece that makes the argument. Not evidence; never affects the badge. */
type VoiceDef = {
  title: string;
  outlet: string;
  author?: string;
  url: string;
  kind: "op-ed" | "explainer" | "speech" | "submission" | "interview" | "blog" | "report" | "campaign";
  stance: "SUPPORTS" | "CONTRADICTS" | "MIXED";
  /** Demo-only; a rated voice appears on the plot as a ring. */
  votes?: DemoVotes;
};

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
  voices?: VoiceDef[];
  contested?: { reason: string; hoursAgo: number; revertedBy: string[] };
};

type ConnDef = {
  from: string;
  to: string;
  relation: ConnectionRelation;
  strength: ConnectionStrength;
  reason: string;
  /** The connection the parent debate currently turns on. One or two per root. */
  crux?: boolean;
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
      "Australia is the only G20 country with a legislated ban on nuclear power. The prohibition was inserted into [federal environment law](https://www.legislation.gov.au/C2004A00485/latest/text) and radiation-safety law in 1998 and 1999 as a condition of the Senate passing the bill that created the national radiation regulator ([Wikipedia overview](https://en.wikipedia.org/wiki/Nuclear_power_in_Australia)).\n\nThe question returned in 2024 when the federal opposition proposed government-owned reactors on coal sites. A [House select committee](https://en.wikipedia.org/wiki/Select_Committee_on_Nuclear_Energy) reported in February 2025 that nuclear was too expensive and too slow; the Coalition dissented. After losing the May 2025 election the Coalition dropped public ownership but, in its [September 2026 energy plan](https://www.abc.net.au/news/2026-09-23/coalition-energy-plan-scrap-renewables-climate-laws/107184376), pledged to repeal every legislative prohibition on nuclear and let it compete for the same underwriting as coal, gas and renewables. The new argument for repeal is demand from AI data centres.",
    disagreement:
      "Almost nobody now argues about safety; the live dispute is timing and purpose. Opponents say nothing nuclear could run before 2040, so it answers none of this decade's price or reliability problems. Supporters say that is an argument to start now, and that data centres give nuclear a customer the grid debate ignores. The Senate would block repeal without Labor or the Greens, and state bans would remain either way.",
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
      { label: "Jun 2024", text: "The federal opposition adopts a policy of government-owned reactors at seven former coal sites." },
      { label: "Feb 2025", text: "A House select committee's interim report finds nuclear too expensive and too slow; Coalition members dissent." },
      { label: "May 2025", text: "The Coalition loses the federal election with the nuclear policy on its platform." },
      { label: "Sep 2026", text: "The Coalition's energy plan pledges to repeal all nuclear prohibitions and to underwrite nuclear through the Capacity Investment Scheme, citing data-centre demand." },
    ],
    voices: [
      { title: "Coalition vows to 'take a chainsaw' to climate laws and offshore wind", outlet: "ABC News", author: "Jake Evans", url: "https://www.abc.net.au/news/2026-09-23/coalition-energy-plan-scrap-renewables-climate-laws/107184376", kind: "report", stance: "MIXED", votes: { n: 3, agree: 2, well: 3 } },
      { title: "Why nuclear energy is not worth the risk for Australia", outlet: "Climate Council", url: "https://www.climatecouncil.org.au/nuclear-power-stations-are-not-appropriate-for-australia-and-probably-never-will-be/", kind: "explainer", stance: "CONTRADICTS", votes: { n: 5, agree: 3, well: 3 } },
      { title: "Chris Bowen declares nuclear to power data centres a 'pipe dream'", outlet: "The Nightly", author: "Caitlyn Rintoul", url: "https://thenightly.com.au/politics/chris-bowen-declares-nuclear-to-power-data-centres-a-pipe-dream-ahead-of-national-cabinet-clash-over-energy-c-22772856", kind: "report", stance: "CONTRADICTS" },
      { title: "BHP wants Australia to scrap nuclear power ban", outlet: "Mining.com (Reuters)", url: "https://www.mining.com/web/bhp-wants-australia-to-scrap-nuclear-power-ban/", kind: "report", stance: "SUPPORTS", votes: { n: 4, agree: 2, well: 2 } },
      { title: "Submission to the NSW inquiry: lift the state nuclear prohibition", outlet: "Nuclear for Australia", url: "https://www.parliament.nsw.gov.au/lcdocs/submissions/95125/0126%20Nuclear%20for%20Australia.pdf", kind: "submission", stance: "SUPPORTS", votes: { n: 2, agree: 1, well: 1 } },
      { title: "Select Committee on Nuclear Energy: majority findings and Coalition dissent", outlet: "House of Representatives (via Wikipedia)", url: "https://en.wikipedia.org/wiki/Select_Committee_on_Nuclear_Energy", kind: "report", stance: "MIXED" },
      { title: "No economic case: global experts say nuclear makes no sense in Australia", outlet: "RenewEconomy", url: "https://reneweconomy.com.au/no-economic-case-global-experts-say-nuclear-has-role-in-some-countries-but-makes-no-sense-in-australia/", kind: "report", stance: "CONTRADICTS" },
      { title: "House debate on energy, 17 August 2026", outlet: "Parliament of Australia (via OpenAustralia)", url: "https://www.openaustralia.org.au/debates/?id=2026-08-17.155.1&m=769", kind: "speech", stance: "MIXED" },
    ],
    votes: { n: 17, agree: 7, well: 11 },
  },
  {
    key: "E-not-in-time",
    title: "Nuclear power cannot help with Australia's electricity prices or reliability in time to matter",
    oneLiner: "The pressure on bills and on the grid is this decade; a first reactor is the decade after next.",
    body: "The case for repeal is usually made in terms of today's problems: high bills, coal plants closing, a grid under strain. Each of those plays out in the 2020s and 2030s. Even on generous assumptions nothing nuclear would generate before 2040, by which time the coal fleet has closed and the firming it needed has been built from something else.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "This is where the live nuclear debate actually sits. Few participants now argue about safety or waste; the argument is about timing. Supporters of repeal say the timeline is an argument for starting now; opponents say it is an argument that nuclear answers a different question from the one being asked. The facts beneath this claim, each argued separately, are the 2040 estimate, the coal closure schedule and the firming already planned with gas.",
    disagreement:
      "The dates are broadly agreed. The disagreement is whether 'too late for this decade' settles the matter or merely shifts nuclear's role from replacing coal to replacing the gas and first-generation storage that will themselves age out in the 2040s.",
    evidence: [
      {
        type: "Official report",
        citation: "CSIRO and AEMO, GenCost — lead time discussion; AEMO Integrated System Plan — coal retirement and firming",
        url: "https://www.csiro.au/en/research/technology-space/energy/gencost",
      },
    ],
    votes: { n: 9, agree: 6, well: 7 },
  },
  {
    key: "E-distraction",
    title: "The political fight over nuclear is distracting from solving price and emissions problems now",
    oneLiner: "Attention and capital spent on a 2040s technology are not spent on the 2020s transition.",
    body: "Policy attention is finite. A multi-year argument about reactors that could not run for fifteen years crowds out decisions on transmission, storage, gas firming and household electrification that determine bills and emissions this decade. On this view the debate is costly even if repeal itself is harmless.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: [...ENERGY, "CLIMATE"],
    context:
      "This argument is about the debate rather than the law. It is made by people who might accept repeal in principle but regard the current contest as a delaying tactic, and by energy-industry voices who want policy certainty for projects already under way.",
    disagreement:
      "Opponents of this claim say it proves too much: any long-horizon decision could be called a distraction. They also note that a legislated ban is itself a political choice that forecloses the long horizon.",
    evidence: [],
    votes: { n: 7, agree: 4, well: 4 },
  },
  {
    key: "E-smr-ban",
    title: "The ban stops the market from finding cheaper and faster routes to nuclear, such as small modular reactors",
    oneLiner: "A prohibition rules out every future design, not just today's large plants.",
    body: "Cost and timeline estimates for nuclear are estimates for large reactors built once. Small modular designs promise factory production, shorter builds and smaller sites, and several are in licensing overseas. A legislated ban means no Australian proponent can test those promises against local conditions, however the technology develops.",
    type: "OPINION",
    evidenceStrength: "NONE",
    tags: ENERGY,
    context:
      "This is the positive case for repeal that does not depend on building a large plant soon: it treats the ban as a restriction on what the market may discover. It is the argument most often made by people who are agnostic about whether nuclear will ever pencil out in Australia.",
    disagreement:
      "The reply is that small modular reactors do not yet exist commercially in comparable countries, so the option being preserved is speculative. Whether that matters depends on how one values keeping options open.",
    evidence: [],
    votes: { n: 8, agree: 5, well: 6 },
  },
  {
    key: "E-smr-none-built",
    title: "No commercial small modular reactor has yet operated in a Western country, and the first United States project was cancelled in 2023",
    oneLiner: "The designs being licensed overseas remain unbuilt; the most advanced US project collapsed on cost.",
    body: "Small modular reactors operate in Russia and China under state programs. In the United States, the NuScale project for a Utah utility consortium was cancelled in November 2023 after its estimated power price rose and subscribers withdrew. No Western SMR has reached commercial operation.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "The state of small modular reactor deployment is the factual test of the 'keep the option open' argument. Both sides accept the record; they differ on whether it describes a technology that is early or one that is failing.",
    disagreement:
      "Not disputed as fact. Supporters of SMRs argue first-of-a-kind cancellations are normal and later designs are progressing; critics argue the cancellation revealed costs no later design has yet escaped.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "World Nuclear Association, Small Nuclear Power Reactors — status of designs and projects",
        url: "https://world-nuclear.org/information-library/nuclear-fuel-cycle/nuclear-power-reactors/small-nuclear-power-reactors",
      },
    ],
    votes: { n: 6, agree: 5, well: 6 },
  },
  {
    key: "E-data-centres",
    title: "AI data centres need large amounts of firm power that nuclear could supply",
    oneLiner: "The newest argument for repeal: a customer that wants constant, emissions-free electricity and can pay for it.",
    body: "Australia has more than 160 operating data centres and over 200 more proposed. The Coalition argues that lifting the ban would let private operators contract for nuclear power for these loads, without any public money, and that a legislated prohibition deters that investment before it is even assessed.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: [...ENERGY, "TECHNOLOGY"],
    context:
      "By 2026 the data-centre case had largely replaced coal replacement as the Coalition's stated reason for repeal. The energy minister called nuclear for data centres a 'pipe dream'; the shadow minister called refusing it a missed opportunity. The federal government is drafting national data-centre rules on power and water.",
    disagreement:
      "Whether data centres change the arithmetic: supporters say a willing private buyer removes the public-cost objection; opponents say the timeline objection is untouched, since data centres are being built now and nuclear is not.",
    evidence: [
      {
        type: "Journalism",
        citation: "The Nightly, 'Chris Bowen declares nuclear to power data centres a pipe dream', 25 August 2026",
        url: "https://thenightly.com.au/politics/chris-bowen-declares-nuclear-to-power-data-centres-a-pipe-dream-ahead-of-national-cabinet-clash-over-energy-c-22772856",
      },
    ],
    votes: { n: 7, agree: 3, well: 4 },
  },
  {
    key: "E-smr-data-centre-cost",
    title: "Modelling commissioned by the Australian Conservation Foundation found powering data centres with small modular reactors would cost billions of dollars a year more than solar with storage",
    oneLiner: "The 'Phantom Energy' report put the gap at between $6 billion and $11 billion a year.",
    body: "The report compared the cost of meeting projected data-centre demand with small modular reactors against large-scale solar and storage, and found the nuclear option several billion dollars a year dearer. It also noted that no commercial reactor has yet been built with the modular factory methods meant to bring costs down.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: [...ENERGY, "TECHNOLOGY"],
    context:
      "This is the main factual reply to the data-centre argument. It was commissioned by an advocacy group opposed to nuclear, which is why it is rated moderate rather than strong; its inputs have not been independently audited.",
    disagreement:
      "Supporters of nuclear say the comparison assumes solar can meet a constant load and ignores the land and transmission costs of doing so; opponents say the gap is too large for those adjustments to close.",
    evidence: [
      {
        type: "Journalism",
        citation: "Canberra Times (AAP), 'Artificial intelligence, nuclear power a costly combo', 2026 — reporting the ACF-commissioned Phantom Energy analysis",
        url: "https://www.canberratimes.com.au/story/9390176/artificial-intelligence-nuclear-power-a-costly-combo/",
      },
    ],
    votes: { n: 5, agree: 3, well: 4 },
  },
  {
    key: "E-state-bans",
    title: "Repealing the federal ban would leave state prohibitions in place in New South Wales, Victoria and Queensland",
    oneLiner: "Three states have their own nuclear bans; federal repeal alone would not permit a plant in any of them.",
    body: "New South Wales, Victoria and Queensland each prohibit nuclear power facilities under state law. A federal repeal would remove one barrier but a plant on the east coast would also need the relevant state to repeal its Act, which the Coalition's plan acknowledges it would have to urge states to do.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ENERGY,
    context:
      "The layered bans are often lost in the federal debate. They matter for what 'repeal' actually achieves: it opens the question in Western Australia, South Australia and the territories, and hands the east coast question to state parliaments.",
    disagreement:
      "Not contested as fact. Supporters of repeal say removing the federal ban is the necessary first step whatever the states do; opponents say it shows how little a federal repeal would change on its own.",
    evidence: [
      {
        type: "Journalism",
        citation: "ABC News, 'Coalition vows to take a chainsaw to climate laws and offshore wind', 23 September 2026 — notes state bans would also need repeal",
        url: "https://www.abc.net.au/news/2026-09-23/coalition-energy-plan-scrap-renewables-climate-laws/107184376",
      },
    ],
    votes: { n: 4, agree: 4, well: 3 },
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
    votes: { n: 11, agree: 9, well: 10 },
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
    votes: { n: 10, agree: 7, well: 8 },
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
    votes: { n: 7, agree: 6, well: 6 },
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
    votes: { n: 7, agree: 3, well: 6 },
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
    votes: { n: 8, agree: 7, well: 6 },
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
    votes: { n: 6, agree: 5, well: 5 },
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
    votes: { n: 8, agree: 6, well: 7 },
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
    votes: { n: 7, agree: 2, well: 1 },
  },

  // ---------------------------------------------------------------------------
  // Debate 2 — east-coast gas reservation
  // ---------------------------------------------------------------------------
  {
    key: "R-gas",
    title: "The east-coast gas reservation scheme starting in July 2027 will materially lower domestic gas prices",
    oneLiner: "Australia has decided to reserve gas for domestic buyers. The question now is whether the scheme, as designed and then softened, will do what it was announced to do.",
    body: "In May 2026 the federal government announced that Queensland's three LNG export ventures must reserve a share of export volumes for Australian users from July 2027, with contracts signed before 22 December 2025 exempt. In September 2026 the rule was recast around forecast domestic demand rather than a flat share of exports. The government says prices will fall; it will not say by how much.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: [...ENERGY, "ECONOMY"],
    context:
      "Until 2015 the east-coast market was isolated. The Gladstone export terminals linked domestic prices to Asian ones just as the Bass Strait fields began to decline, and east-coast prices roughly tripled. The competition regulator has run a [standing inquiry](https://www.accc.gov.au/inquiries-and-consultations/gas-inquiry-2017-30) since 2017; governments added an export-control mechanism, a price cap and a code of conduct, but not reservation.\n\nThat changed in 2026. A [Gas Market Review](https://industry.gov.au/news/australian-governments-gas-market-review-recommends-domestic-gas-reservation-policy) recommended reservation; on [7 May 2026](https://www.abc.net.au/news/2026-05-07/east-coast-gas-reservation-policy-announced-to-avert-shortages/106651532) the government announced a 20 per cent reservation of export volumes from July 2027, with pre-December-2025 contracts preserved. Producers split: APLNG and Shell accepted it, Santos opposed it. In September 2026 the rule was softened to reserve about 110 per cent of forecast domestic demand. See the [Wikipedia summary](https://en.wikipedia.org/wiki/Domestic_Gas_Reservation_Scheme_Australia_2027).",
    disagreement:
      "Nobody now disputes that reservation is happening. The argument is whether exempting existing contracts and pegging the reserve to forecast demand leaves enough new gas in the scheme to move prices before the 2030s, and whether the Greens' alternative, an export tax, would have done more.",
    evidence: [
      {
        type: "Journalism",
        citation: "ABC News, 'Gas export restrictions and better domestic prices promised under new east coast reservation policy', 7 May 2026",
        url: "https://www.abc.net.au/news/2026-05-07/east-coast-gas-reservation-policy-announced-to-avert-shortages/106651532",
      },
      {
        type: "Official report",
        citation: "Department of Industry, Science and Resources — Gas Market Review recommends a domestic gas reservation policy",
        url: "https://industry.gov.au/news/australian-governments-gas-market-review-recommends-domestic-gas-reservation-policy",
      },
    ],
    timeline: [
      { label: "2006", text: "Western Australia adopts a domestic reservation policy for new LNG projects." },
      { label: "2015", text: "The first Queensland LNG export cargo leaves Gladstone, linking east-coast gas to Asian prices." },
      { label: "2017", text: "The Australian Domestic Gas Security Mechanism is created. The ACCC's standing gas inquiry begins." },
      { label: "22 Dec 2025", text: "Cut-off date: export contracts signed before this are later exempted from reservation." },
      { label: "7 May 2026", text: "The government announces a 20 per cent reservation of Queensland LNG export volumes from July 2027." },
      { label: "Sep 2026", text: "The rule is softened to reserve about 110 per cent of forecast domestic demand; industry welcomes the change and warns of oversupply." },
      { label: "Jul 2027", text: "Scheme due to start." },
    ],
    voices: [
      { title: "Gas export restrictions and better domestic prices promised under new east coast reservation policy", outlet: "ABC News", author: "Jane Norman", url: "https://www.abc.net.au/news/2026-05-07/east-coast-gas-reservation-policy-announced-to-avert-shortages/106651532", kind: "report", stance: "MIXED", votes: { n: 3, agree: 2, well: 3 } },
      { title: "Australian gas exporters will be forced to set aside local supply for domestic users", outlet: "The Conversation", author: "Kevin Morrison, UTS", url: "https://theconversation.com/australian-gas-exporters-will-be-forced-to-set-aside-local-supply-for-domestic-users-282366", kind: "explainer", stance: "SUPPORTS", votes: { n: 4, agree: 3, well: 4 } },
      { title: "Gas Market Review recommends domestic gas reservation policy", outlet: "Department of Industry, Science and Resources", url: "https://industry.gov.au/news/australian-governments-gas-market-review-recommends-domestic-gas-reservation-policy", kind: "report", stance: "SUPPORTS" },
      { title: "Australian Energy Producers say gas review falls short on supply goals", outlet: "Mining Weekly (Reuters)", url: "https://www.miningweekly.com/article/australian-energy-producers-say-gas-review-falls-short-on-supply-goals-2026-05-19", kind: "report", stance: "CONTRADICTS", votes: { n: 2, agree: 0, well: 1 } },
      { title: "Australia softens gas reserve rule for LNG exporters", outlet: "Mining Weekly (Reuters)", url: "https://www.miningweekly.com/article/australia-softens-gas-reserve-rule-for-lng-exporters-2026-09-10", kind: "report", stance: "MIXED" },
      { title: "Santos boss Kevin Gallagher will take Feds 'at their word' on future of contracts under gas reservation policy", outlet: "The Nightly", url: "https://thenightly.com.au/business/santos-boss-kevin-gallagher-will-take-feds-at-their-word-on-future-of-contracts-under-gas-reservation-policy-c-22338808", kind: "interview", stance: "CONTRADICTS" },
      { title: "Gas export project to stop dipping into domestic market", outlet: "Illawarra Mercury (AAP)", url: "https://www.illawarramercury.com.au/story/9347341/gas-export-project-to-stop-dipping-into-domestic-market/", kind: "report", stance: "SUPPORTS" },
    ],
    votes: { n: 12, agree: 6, well: 7 },
  },
  {
    key: "E-grandfathered-contracts",
    title: "Because export contracts signed before 22 December 2025 are exempt, the scheme reaches too little gas to move prices for years",
    oneLiner: "Most current east-coast production is already contracted; the reserve bites only on new supply.",
    body: "The announced scheme preserves foundation contracts and any signed before the December 2025 cut-off. Since the three Queensland ventures sold most of their output under long-term contracts years ago, the gas actually subject to reservation is a thin slice of new and uncontracted supply, which critics say is too small to shift the domestic price before the 2030s.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "This is where the reservation debate now sits. Producers wanted only new gas included and largely got it; the Greens say the policy was written by the industry; the government says a 'modest' oversupply is enough. The September 2026 softening, which pegs the reserve to about 110 per cent of forecast demand, sharpened the question.",
    disagreement:
      "Supporters of the design say that at the margin even a modest oversupply sets the price, and point to modelling that extra Queensland supply lowers southern prices. Critics say that with Santos the only major venture not already supplying the domestic market, the scheme mostly formalises what two of three producers already do.",
    evidence: [
      {
        type: "Journalism",
        citation: "ABC News, 7 May 2026 — contracts entered before December 2025 preserved; minister will not say how far prices fall",
        url: "https://www.abc.net.au/news/2026-05-07/east-coast-gas-reservation-policy-announced-to-avert-shortages/106651532",
      },
      {
        type: "Journalism",
        citation: "The Conversation, Kevin Morrison, 7 May 2026 — exemptions, consultation risk and WA compliance record",
        url: "https://theconversation.com/australian-gas-exporters-will-be-forced-to-set-aside-local-supply-for-domestic-users-282366",
      },
    ],
    votes: { n: 7, agree: 4, well: 5 },
  },
  {
    key: "E-softened-110",
    title: "In September 2026 the reservation was recast to about 110 per cent of forecast domestic demand, and Santos is the only major east-coast producer not already supplying the domestic market",
    oneLiner: "The softened rule reserves little beyond what two of the three ventures already sell locally.",
    body: "Reuters reported that the government revised the scheme from a flat 20 per cent of export volumes to a reserve of roughly 110 per cent of estimated domestic demand. Industry welcomed the change while warning that oversupply could depress prices and deter new development. Of the three Queensland ventures, only Santos's GLNG does not supply significant volumes domestically.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "The softening is the most recent move in the design fight and the clearest test of whether the scheme binds. Its details were still subject to regulation when this was written.",
    disagreement:
      "Agreed as a description of the change. Disputed is what it means: a sensible calibration to actual need, or a retreat that leaves the price problem where it was.",
    evidence: [
      {
        type: "Journalism",
        citation: "Mining Weekly (Reuters), 'Australia softens gas reserve rule for LNG exporters', 10 September 2026",
        url: "https://www.miningweekly.com/article/australia-softens-gas-reserve-rule-for-lng-exporters-2026-09-10",
      },
    ],
    votes: { n: 5, agree: 4, well: 4 },
  },
  {
    key: "E-southern-price-modelling",
    title: "Modelling cited in support of the scheme found that additional Queensland supply would lower wholesale prices in New South Wales and Victoria",
    oneLiner: "The government's 'modest oversupply' claim rests on this kind of result.",
    body: "An Energy Edge study cited by The Conversation found that extra gas from Queensland flowing south would reduce prices in the southern states, where the Bass Strait decline is sharpest. The government expects the reservation to create a modest domestic oversupply with the same effect.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "This is the factual plank under the government's price claim. It is modelling of supply effects, not of the scheme as finally designed.",
    disagreement:
      "Critics accept the direction and dispute the magnitude once exemptions and the demand peg are applied.",
    evidence: [
      {
        type: "Journalism",
        citation: "The Conversation, Kevin Morrison, 7 May 2026 — Energy Edge study on southern prices",
        url: "https://theconversation.com/australian-gas-exporters-will-be-forced-to-set-aside-local-supply-for-domestic-users-282366",
      },
    ],
    votes: { n: 4, agree: 3, well: 3 },
  },
  {
    key: "E-investment-deterrent",
    title: "Mandatory reservation will deter investment in new gas supply and worsen the shortfall it is meant to fix",
    oneLiner: "The producers' central objection: forced local sales at any price make new fields harder to finance.",
    body: "Australian Energy Producers argued the draft imposed complex and opaque compliance obligations, would undermine trust with Asian buyers, and would deter investment. Santos's chief executive said forcing sales at any price could 'kill companies'; a smaller producer called the scheme 'nationalisation by stealth'. If new supply does not come, the argument runs, prices rise regardless of reservation.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: [...ENERGY, "ECONOMY"],
    context:
      "This objection shaped the September softening. It is the industry's position rather than an independent finding, and the industry was itself split: two of the three Queensland ventures accepted reservation.",
    disagreement:
      "Supporters of the scheme answer that Western Australia reserved gas for twenty years without choking investment, and that producers who already supply the domestic market had no difficulty accepting the rule.",
    evidence: [
      {
        type: "Journalism",
        citation: "Mining Weekly (Reuters), 'Australian Energy Producers say gas review falls short on supply goals', 19 May 2026",
        url: "https://www.miningweekly.com/article/australian-energy-producers-say-gas-review-falls-short-on-supply-goals-2026-05-19",
      },
      {
        type: "Journalism",
        citation: "The Nightly, 'Santos boss Kevin Gallagher will take Feds at their word on future of contracts under gas reservation policy', 2026",
        url: "https://thenightly.com.au/business/santos-boss-kevin-gallagher-will-take-feds-at-their-word-on-future-of-contracts-under-gas-reservation-policy-c-22338808",
      },
    ],
    votes: { n: 6, agree: 2, well: 4 },
  },
  {
    key: "E-industry-split",
    title: "Two of the three Queensland LNG ventures accepted a reservation scheme; only Santos opposed it",
    oneLiner: "The industry's own split weakens the claim that reservation is unworkable.",
    body: "Reporting around the May 2026 announcement described the LNG industry as broadly supportive, chiefly to end ad hoc interventions by successive governments, with Australia Pacific LNG and Shell's QCLNG accepting the policy and Santos's GLNG preferring the status quo. GLNG is also the venture that has drawn most on domestic gas to meet export contracts.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ENERGY,
    context:
      "Which producers objected, and why, is a useful check on the investment-deterrence argument: the objector is the venture with the least domestic supply and the most to lose.",
    disagreement:
      "Agreed as fact. Producers say acceptance was pragmatic, not endorsement; critics say it shows the scheme asks little of two of the three.",
    evidence: [
      {
        type: "Journalism",
        citation: "ABC News, 7 May 2026 — industry broadly supportive; Illawarra Mercury (AAP), 'Gas export project to stop dipping into domestic market'",
        url: "https://www.illawarramercury.com.au/story/9347341/gas-export-project-to-stop-dipping-into-domestic-market/",
      },
    ],
    votes: { n: 4, agree: 3, well: 3 },
  },
  {
    key: "E-export-tax",
    title: "A tax on gas exports would lower domestic prices and raise revenue, which reservation does not",
    oneLiner: "The Greens and Senator Pocock argue the government chose the instrument the industry preferred.",
    body: "A Senate committee considered gas taxation alongside reservation. The Greens said the reservation policy was written by the industry for the industry and that an export tax would both lower local prices and return revenue to the public; Senator David Pocock's dissenting report recommended a 25 per cent tax on all gas exports. The government ruled out gas tax increases in the 2026 budget.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: [...ENERGY, "TAX"],
    context:
      "A competing answer to the same problem. It belongs in this debate because the case for reservation is partly the case against doing this instead.",
    disagreement:
      "Supporters of reservation say a tax raises prices for exporters without guaranteeing domestic volume; supporters of a tax say reservation guarantees volume for whoever the producers choose to sell to, at a price the government will not forecast.",
    evidence: [
      {
        type: "Journalism",
        citation: "ABC News, 7 May 2026 — Greens and Pocock positions on export taxation",
        url: "https://www.abc.net.au/news/2026-05-07/east-coast-gas-reservation-policy-announced-to-avert-shortages/106651532",
      },
    ],
    votes: { n: 6, agree: 3, well: 4 },
  },
  {
    key: "E-wa-cheap-gas",
    title: "Western Australia's low domestic gas prices owe more to abundant, cheap offshore gas and a small market than to reservation",
    oneLiner: "The precedent may show geology, not policy.",
    body: "Western Australia's LNG projects draw on large offshore fields with low production costs, and its domestic market is a fraction of the east coast's. Critics of the comparison argue those conditions would produce low prices with or without a reservation rule, so the policy cannot be credited with the gap.",
    type: "OPINION",
    evidenceStrength: "WEAK",
    tags: ENERGY,
    context:
      "The causal question behind the WA comparison. It is rarely separated out in public debate, where 'WA has reservation and cheap gas' is treated as settling the matter.",
    disagreement:
      "Supporters of reservation answer that WA's domestic price has tracked well below what its export-linked price would have been, which is the policy's effect regardless of how cheap the gas is to produce.",
    evidence: [
      {
        type: "Journalism",
        citation: "The Conversation, Kevin Morrison, 7 May 2026 — notes compliance with WA's 15 per cent reservation has been poor",
        url: "https://theconversation.com/australian-gas-exporters-will-be-forced-to-set-aside-local-supply-for-domestic-users-282366",
      },
    ],
    votes: { n: 5, agree: 2, well: 4 },
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
      "The price gap is agreed. The dispute is causation: Western Australia also has abundant, cheap offshore gas and a small domestic market, and compliance with its reservation has been described as poor, so the policy may deserve less credit than it gets.",
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
    votes: { n: 8, agree: 6, well: 5 },
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
    votes: { n: 7, agree: 6, well: 6 },
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
    votes: { n: 6, agree: 5, well: 5 },
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
    votes: { n: 6, agree: 1, well: 5 },
  },

  // ---------------------------------------------------------------------------
  // Debate 3 — negative gearing
  // ---------------------------------------------------------------------------
  {
    key: "R-negative-gearing",
    title: "Parliament should pass the 2026 budget's restriction of negative gearing to newly built homes",
    oneLiner: "The policy is now a bill before the Senate: negative gearing for new builds only from July 2027, existing investors grandfathered, and a reworked capital gains discount alongside it.",
    body: "The 12 May 2026 budget restricted negative gearing to newly built residential property for investments made after budget night, with effect from 1 July 2027, and replaced the 50 per cent capital gains discount with an inflation-based discount and a 30 per cent floor. Anyone using the concessions before budget night keeps them. A Senate inquiry took evidence in June 2026.",
    type: "PROPOSAL",
    evidenceStrength: "STRONG",
    tags: [...HOUSING, "TAX"],
    context:
      "Australia is unusual in letting rental losses offset wage income without limit. With the capital gains discount introduced in 1999, this made a loss-making rental a tax-effective way to hold an appreciating asset ([Wikipedia](https://en.wikipedia.org/wiki/Negative_gearing_in_Australia)). The concession was quarantined in 1985 and restored in 1987; a new-builds-only policy lost the 2016 and 2019 elections; the prime minister ruled out changes during the 2025 campaign.\n\nIn February 2026 Treasury was [reported to be modelling options](https://www.abc.net.au/news/2026-02-27/labor-not-ruling-out-negative-gearing-changes/106395074). The May budget adopted new-builds-only with grandfathering. Treasury's secretary told the Senate the measures mainly [change who owns housing](https://thenightly.com.au/politics/jenny-wilkinson-says-labor-tax-changes-will-reallocate-housing-as-investors-pull-back-c-22353594) rather than how much is built; the property industry's commissioned modelling forecasts higher rents and fewer homes.",
    disagreement:
      "Economists agree the concession pushes prices up at the margin and that the effect is modest. The live dispute is rents: Treasury puts the rise at under $2 a week, the industry's modelling at about $9. Behind that is a design fight over indefinite grandfathering, which keeps the concession alive for decades on existing stock.",
    evidence: [
      {
        type: "Primary source",
        citation: "Treasury Laws Amendment (Tax Reform No. 1) Bill 2026 — second reading debate, House of Representatives, 3 June 2026",
        url: "https://www.openaustralia.org.au/debates/?id=2026-06-03.112.2&m=567",
      },
      {
        type: "Journalism",
        citation: "The Nightly, 'Jenny Wilkinson says Labor tax changes will reallocate housing as investors pull back', 29 May 2026",
        url: "https://thenightly.com.au/politics/jenny-wilkinson-says-labor-tax-changes-will-reallocate-housing-as-investors-pull-back-c-22353594",
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
      { label: "2025", text: "During the election campaign the prime minister rules out changes to negative gearing." },
      { label: "Feb 2026", text: "Treasury is reported to be modelling a two-property cap and a lower capital gains discount; the government does not rule out change." },
      { label: "12 May 2026", text: "The budget restricts negative gearing to new builds from 1 July 2027 and replaces the 50 per cent CGT discount, grandfathering existing investors." },
      { label: "Jun 2026", text: "The bill is debated in the House and examined by a Senate inquiry; industry modelling and Treasury disagree on rents." },
    ],
    voices: [
      { title: "Labor not ruling out negative gearing changes", outlet: "ABC News", author: "Tom Crowley", url: "https://www.abc.net.au/news/2026-02-27/labor-not-ruling-out-negative-gearing-changes/106395074", kind: "report", stance: "MIXED" },
      { title: "Jenny Wilkinson says Labor tax changes will reallocate housing as investors pull back", outlet: "The Nightly", author: "Katina Curtis", url: "https://thenightly.com.au/politics/jenny-wilkinson-says-labor-tax-changes-will-reallocate-housing-as-investors-pull-back-c-22353594", kind: "report", stance: "MIXED", votes: { n: 3, agree: 2, well: 3 } },
      { title: "Hot property: negative gearing and capital gains tax reform", outlet: "Grattan Institute", author: "John Daley and Danielle Wood", url: "https://grattan.edu.au/report/hot-property/", kind: "report", stance: "SUPPORTS", votes: { n: 5, agree: 4, well: 5 } },
      { title: "Opening statement to the Senate inquiry: tax hikes will shrink investment, confidence and new project supply", outlet: "Property Council of Australia", author: "Mike Zorbas", url: "https://www.propertycouncil.com.au/media-releases/property-council-opening-statement-tax-hikes-will-shrink-investment-confidence-and-new-project-supply", kind: "submission", stance: "CONTRADICTS", votes: { n: 3, agree: 1, well: 2 } },
      { title: "Changes to negative gearing bad news for new housing", outlet: "Property Council of Australia", url: "https://www.propertycouncil.com.au/uncategorized/changes-to-negative-gearing-bad-news-for-new-housing", kind: "op-ed", stance: "CONTRADICTS" },
      { title: "Tax changes could cut 45,000 homes and push up rents, industry leaders warn", outlet: "Elite Agent", url: "https://eliteagent.com/tax-changes-could-cut-45000-homes-and-push-up-rents-industry-leaders-warn", kind: "report", stance: "CONTRADICTS" },
      { title: "Treasury modelling of negative gearing and a cap at two properties", outlet: "Property Investment Professionals of Australia", url: "https://pipa.asn.au/negative-gearing-law-changes-effects/", kind: "blog", stance: "CONTRADICTS" },
      { title: "Second reading debate, Treasury Laws Amendment (Tax Reform No. 1) Bill 2026", outlet: "Parliament of Australia (via OpenAustralia)", url: "https://www.openaustralia.org.au/debates/?id=2026-06-03.112.2&m=567", kind: "speech", stance: "MIXED" },
    ],
    votes: { n: 14, agree: 8, well: 9 },
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
    votes: { n: 9, agree: 8, well: 8 },
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
    votes: { n: 8, agree: 4, well: 4 },
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
    votes: { n: 8, agree: 7, well: 7 },
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
    votes: { n: 9, agree: 4, well: 5 },
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
    votes: { n: 6, agree: 4, well: 5 },
  },
  {
    key: "H-treasury-rent",
    title: "Treasury estimates the 2026 changes would raise rents by less than $2 a week for a household on the median rent",
    oneLiner: "The official estimate of the rent effect is small.",
    body: "Treasury's budget modelling puts the rent effect of restricting negative gearing and reworking the capital gains discount at under $2 a week at the median, and estimates about 35,000 fewer homes over a decade, more than offset in its view by the budget's supply measures. Its secretary told the Senate the measures mainly shift ownership from investors to owner-occupiers.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: [...HOUSING, "TAX"],
    context:
      "Treasury's number is the government's answer to the rent objection. It is an estimate of a policy not yet in force, so it is a fact about the modelling rather than about rents.",
    disagreement:
      "The industry's modellers say Treasury understates investor withdrawal; Treasury says the industry's model assumes investors leave and nobody buys the homes they sell.",
    evidence: [
      {
        type: "Journalism",
        citation: "The Nightly, 29 May 2026 — Treasury figures and secretary Jenny Wilkinson's evidence",
        url: "https://thenightly.com.au/politics/jenny-wilkinson-says-labor-tax-changes-will-reallocate-housing-as-investors-pull-back-c-22353594",
      },
    ],
    votes: { n: 6, agree: 4, well: 5 },
  },
  {
    key: "H-industry-modelling",
    title: "Modelling commissioned by the property industry forecasts rents about $9 a week higher and roughly 8,700 fewer homes by 2030 under the changes",
    oneLiner: "The competing estimate, from the groups opposing the bill.",
    body: "Qaive and Tulipwood Economics, commissioned by Master Builders Australia, the Property Council and the Real Estate Institute, forecast rents about $9 a week higher once the changes take effect, several times Treasury's figure, and about 8,700 fewer dwellings by 2029–30. The same modelling credits the budget's supply measures with far fewer homes than Treasury does.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: [...HOUSING, "TAX"],
    context:
      "Commissioned by the bill's opponents and rated moderate for that reason. It is the number behind the industry's Senate evidence.",
    disagreement:
      "Supporters of the bill say the model assumes sold rentals vanish rather than becoming owner-occupied homes; the industry says Treasury assumes frictionless substitution.",
    evidence: [
      {
        type: "Journalism",
        citation: "The Nightly, 29 May 2026 — Qaive/Tulipwood modelling for MBA, Property Council and REIA",
        url: "https://thenightly.com.au/politics/jenny-wilkinson-says-labor-tax-changes-will-reallocate-housing-as-investors-pull-back-c-22353594",
      },
      {
        type: "Journalism",
        citation: "Elite Agent, 'Tax changes could cut 45,000 homes and push up rents, industry leaders warn', 2026",
        url: "https://eliteagent.com/tax-changes-could-cut-45000-homes-and-push-up-rents-industry-leaders-warn",
      },
    ],
    votes: { n: 5, agree: 2, well: 3 },
  },
  {
    key: "H-grandfathering-timid",
    title: "Grandfathering existing investors indefinitely keeps the concession alive on most of the housing stock for decades",
    oneLiner: "An argument that the bill is too timid, made from the reform side.",
    body: "Because anyone negatively gearing before budget night keeps the concession for as long as they hold the property, the change bites only on future purchases of established homes. A government member in the House debate urged phasing out the deduction on existing properties over seven years instead.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: [...HOUSING, "TAX"],
    context:
      "Grandfathering is the price of the policy's politics: it protects every current investor. The cost is that the measured effects, on prices and on the budget, arrive slowly.",
    disagreement:
      "Supporters of grandfathering say retrospective change would be unfair and would trigger the forced sales the rent objection fears; critics say a dated phase-out is neither.",
    evidence: [
      {
        type: "Primary source",
        citation: "House of Representatives debate, 3 June 2026 — call for a seven-year phase-out on existing properties",
        url: "https://www.openaustralia.org.au/debates/?id=2026-06-03.112.2&m=567",
      },
    ],
    votes: { n: 5, agree: 3, well: 4 },
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
    votes: { n: 6, agree: 5, well: 5 },
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
    votes: { n: 8, agree: 6, well: 2 },
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
    votes: { n: 7, agree: 3, well: 3 },
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
    votes: { n: 8, agree: 6, well: 5 },
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
      "Australia sets an annual permanent migration program but does not directly cap [net overseas migration](https://www.abs.gov.au/statistics/people/population/overseas-migration/latest-release), most of which is temporary: students, working-holiday makers and temporary skilled workers. The post-pandemic rebound pushed net migration above 500,000 in 2022–23. At the 2025 election the Coalition pledged to cut it to 160,000; the [May 2026 budget](https://kpmg.com/xx/en/our-insights/gms-flash-alert/2026/flash-alert-2026-124.html) forecasts 295,000 for 2025–26, 245,000 for 2026–27 and 225,000 a year from 2027–28.\n\nThe lever both parties reach for is international students. A [2026 planning level of 295,000](https://theconversation.com/australias-student-caps-will-ease-up-in-2026-but-times-will-still-be-tough-for-international-education-262521) new students applies through visa-processing 'slow lanes' because the Senate rejected legislated caps in 2024; the Coalition proposes 240,000; and from [2 October 2026](https://www.ed.events/post/international-students-australias-intensifying-migration-debate) most student visa applicants may no longer bring partners or children.",
    disagreement:
      "Both sides accept that 2022–23 was exceptional and that housing is the pressure point, and the forecast is already falling towards 225,000. The real dispute is whether the last 25,000 to 65,000 a year should come out of international education, which is the only component large enough to cut, and what that costs.",
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
      { label: "2022–23", text: "Reopened borders produce a record intake above 500,000 as students and temporary workers return." },
      { label: "Nov 2024", text: "The Senate rejects legislated international student caps; the government moves to 'planning levels' enforced through visa processing." },
      { label: "May 2025", text: "The Coalition takes a pledge to cut net migration to 160,000 to the election and loses." },
      { label: "Aug 2025", text: "The 2026 planning level for new international students is set at 295,000, up from 270,000." },
      { label: "May 2026", text: "The budget forecasts net overseas migration of 245,000 in 2026–27 and 225,000 a year from 2027–28." },
      { label: "2 Oct 2026", text: "Student visa changes limit onshore applications and bar most applicants from bringing partners or children." },
    ],
    voices: [
      { title: "Australia's student caps will ease up in 2026, but times will still be tough for international education", outlet: "The Conversation", author: "Andrew Norton, Monash University", url: "https://theconversation.com/australias-student-caps-will-ease-up-in-2026-but-times-will-still-be-tough-for-international-education-262521", kind: "explainer", stance: "MIXED", votes: { n: 3, agree: 2, well: 3 } },
      { title: "Don't blame migrants for the housing crisis", outlet: "Grattan Institute", url: "https://grattan.edu.au/news/dont-blame-migrants-for-the-housing-crisis", kind: "op-ed", stance: "CONTRADICTS", votes: { n: 4, agree: 2, well: 3 } },
      { title: "Cutting permanent migration may make housing cheaper, but it will definitely make us poorer", outlet: "Grattan Institute", url: "https://grattan.edu.au/news/cutting-permanent-migration-may-make-housing-cheaper-but-it-will-definitely-make-us-poorer/", kind: "op-ed", stance: "CONTRADICTS" },
      { title: "Slow migration to help renters", outlet: "Grattan Institute", url: "https://grattan.edu.au/news/slow-migration-to-help-renters", kind: "op-ed", stance: "SUPPORTS", votes: { n: 3, agree: 2, well: 3 } },
      { title: "Migration: the faulty forecast", outlet: "The New Daily", url: "https://www.thenewdaily.com.au/opinion/2026/01/25/migration-faulty-forecast", kind: "op-ed", stance: "SUPPORTS" },
      { title: "The state of migration in Australia", outlet: "CEDA", url: "https://www.ceda.com.au/research-and-policy/research/population/the-state-of-migration-in-australia", kind: "report", stance: "MIXED" },
      { title: "International students caught in Australia's intensifying migration debate", outlet: "EdEvents News", url: "https://www.ed.events/post/international-students-australias-intensifying-migration-debate", kind: "report", stance: "CONTRADICTS" },
      { title: "Australia is expected to add another 1.4 million people over the next four years", outlet: "The Nightly", url: "https://thenightly.com.au/politics/australia/australia-is-expected-to-add-another-14-million-people-over-the-next-four-years-c-22273759", kind: "report", stance: "MIXED" },
    ],
    votes: { n: 18, agree: 9, well: 9 },
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
    votes: { n: 8, agree: 7, well: 7 },
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
    votes: { n: 8, agree: 6, well: 6 },
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
    votes: { n: 7, agree: 5, well: 6 },
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
    votes: { n: 7, agree: 6, well: 6 },
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
    votes: { n: 7, agree: 5, well: 4 },
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
    votes: { n: 8, agree: 2, well: 1 },
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
    votes: { n: 9, agree: 8, well: 5 },
  },
  {
    key: "M-budget-forecast",
    title: "The May 2026 budget forecasts net overseas migration falling to 245,000 in 2026–27 and 225,000 a year from 2027–28",
    oneLiner: "The number is already heading back to its pre-pandemic range without a cap.",
    body: "Budget forecasts put net overseas migration at 295,000 in 2025–26, 245,000 in 2026–27 and 225,000 a year thereafter, roughly the level of the decade before the pandemic. Treasury's long-run assumption is about 235,000. A cap of 200,000 would therefore bind by 25,000 to 45,000 a year on current forecasts.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["IMMIGRATION"],
    context:
      "Forecasts of net migration have been wrong before, in both directions, which is the main reason sceptics do not take the glide path at face value.",
    disagreement:
      "Agreed as the budget's figure. Disputed is whether it will be met: one line of commentary says the long-run forecast is too low, another that the decline is already visible in the data.",
    evidence: [
      {
        type: "Official data",
        citation: "KPMG, Flash Alert 2026-124 — Australia 2026–27 federal budget migration measures and net overseas migration forecasts, 12 May 2026",
        url: "https://kpmg.com/xx/en/our-insights/gms-flash-alert/2026/flash-alert-2026-124.html",
      },
      {
        type: "Journalism",
        citation: "AAP, 'Migration plummets from post-pandemic record highs', 2026",
        url: "https://aapnews.aap.com.au/news/migration-plummets-from-post-pandemic-record-highs",
      },
    ],
    votes: { n: 6, agree: 5, well: 5 },
  },
  {
    key: "M-grattan-rents",
    title: "Grattan Institute estimates each unexpected extra 100,000 migrants lifts rents by about 1 per cent, and that cutting net migration to 160,000 would leave rents about 6 per cent lower after a decade",
    oneLiner: "The best-known estimate of how much migration moves rents: real, and modest.",
    body: "Grattan's analysis of the Coalition's 2025 pledge found that holding net overseas migration at 160,000 a year would leave rents about 6 per cent lower than otherwise after ten years, and that cutting permanent skilled visas alone would leave them about 2.5 per cent lower, at a significant cost to incomes. It also noted the federal government has little direct control over net migration, which is driven by uncapped temporary visas.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["IMMIGRATION", ...HOUSING],
    context:
      "This figure is cited by both sides: supporters of a cap as proof the effect is real, opponents as proof it is small relative to supply measures.",
    disagreement:
      "Agreed as Grattan's estimate. Disputed is whether a 6 per cent rent difference after a decade is worth the economic cost Grattan also estimates.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, 'Cutting permanent migration may make housing cheaper, but it will definitely make us poorer'",
        url: "https://grattan.edu.au/news/cutting-permanent-migration-may-make-housing-cheaper-but-it-will-definitely-make-us-poorer/",
      },
    ],
    votes: { n: 5, agree: 4, well: 5 },
  },
  {
    key: "M-soft-caps",
    title: "The 2026 international student planning level of 295,000 is not legally enforceable; it works through visa-processing slow lanes because the Senate rejected formal caps in 2024",
    oneLiner: "The lever a migration cap would pull is an administrative one, not a law.",
    body: "After the Senate blocked legislated caps in November 2024, the government set 'national planning levels' for new international students and enforced them by slowing visa processing once a provider reaches 80 per cent of its allocation. The level rose from 270,000 in 2025 to 295,000 in 2026, with the Australian Tertiary Education Commission due to take over regulation of higher-education numbers from 2027.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["IMMIGRATION", "EDUCATION"],
    context:
      "How student numbers are actually controlled bears on whether a hard net-migration cap could be delivered at all, and on who would bear it.",
    disagreement:
      "Agreed as a description. Disputed is whether soft caps are a workable substitute for a legislated number or an invitation to miss it.",
    evidence: [
      {
        type: "Journalism",
        citation: "The Conversation, Andrew Norton, 5 August 2025 — planning levels, enforceability and the 2027 commission",
        url: "https://theconversation.com/australias-student-caps-will-ease-up-in-2026-but-times-will-still-be-tough-for-international-education-262521",
      },
    ],
    votes: { n: 4, agree: 4, well: 4 },
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
    votes: { n: 11, agree: 10, well: 8 },
  },

  // ---------------------------------------------------------------------------
  // Debate 5 — environmental approval deadlines
  // ---------------------------------------------------------------------------
  {
    key: "R-approvals",
    title: "The 2025 overhaul of national environment law will deliver faster approvals without weakening protection",
    oneLiner: "The reforms have passed. Whether they do both of the things promised is the question as they roll out through 2026.",
    body: "The Environment Protection Reform Act passed on 28 November 2025 after a Labor–Greens deal, creating a National Environmental Protection Agency, national environmental standards, a streamlined assessment pathway and a ministerial national-interest exemption. Fossil fuel projects are excluded from the fast track and the exemption. The EPA began on 1 July 2026; the faster assessment provisions commence by 1 December 2026.",
    type: "OPINION",
    evidenceStrength: "STRONG",
    tags: ["ENVIRONMENT", "ECONOMY"],
    context:
      "The [Environment Protection and Biodiversity Conservation Act](https://en.wikipedia.org/wiki/Environment_Protection_and_Biodiversity_Conservation_Act_1999) was reviewed twice since 2000 and both reviews, most recently the [2020 Samuel Review](https://epbcactreview.environment.gov.au/), found it slow and failing the environment. A first reform attempt stalled in 2024.\n\nThe second passed in November 2025 with Greens support, in exchange for excluding coal and gas from the streamlined pathway and the national-interest exemption, keeping the water trigger federal, and ending the native-forest logging exemption from July 2027 ([EDO summary](https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/)). A [Senate committee](https://corrs.com.au/insights/epbc-act-reforms-senate-committee-recommendations) reporting in 2026 backed the package but asked for published limits on the national-interest power. Implementation is staged through 2026 ([department page](https://www.dcceew.gov.au/environment/epbc/epbc-act-reform)).",
    disagreement:
      "Industry and renewable developers broadly accept the speed gains and argue about detail. Environment groups accept the EPA and standards and dispute two things: whether a minister can use the national-interest exemption to approve projects that fail the standards, and whether an EPA with no independent board and ministerial direction over delegated powers is independent enough to hold the line.",
    evidence: [
      {
        type: "Official report",
        citation: "Department of Climate Change, Energy, the Environment and Water — Environment protection reforms: implementation timetable",
        url: "https://www.dcceew.gov.au/environment/epbc/epbc-act-reform",
      },
      {
        type: "Think tank / NGO",
        citation: "Environmental Defenders Office, 'Historic environment reforms: what happened in parliament and what comes next', 28 November 2025",
        url: "https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/",
      },
    ],
    timeline: [
      { label: "2000", text: "The EPBC Act takes effect, creating a federal approval layer for matters of national environmental significance." },
      { label: "2009", text: "The first statutory review finds the Act cumbersome and recommends reform. Little changes." },
      { label: "2020", text: "The Samuel Review finds the Act 'ineffective and inefficient', failing both industry and the environment." },
      { label: "28 Nov 2025", text: "The Environment Protection Reform Bills pass after a Labor–Greens deal excluding fossil fuels from fast-tracking and the national-interest exemption." },
      { label: "20 Feb 2026", text: "First provisions commence, including the national-interest exemption powers." },
      { label: "Apr 2026", text: "A Senate committee backs the package with 14 recommendations, chiefly for published limits on the national-interest power and clearer standards." },
      { label: "1 Jul 2026", text: "The National Environmental Protection Agency and Environment Information Australia are established." },
      { label: "1 Dec 2026", text: "Streamlined assessment and approval provisions due to commence." },
    ],
    voices: [
      { title: "Historic environment reforms: what happened in parliament and what comes next", outlet: "Environmental Defenders Office", url: "https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/", kind: "explainer", stance: "MIXED", votes: { n: 4, agree: 2, well: 4 } },
      { title: "EPBC Act reforms: Senate committee recommendations", outlet: "Corrs Chambers Westgarth", url: "https://corrs.com.au/insights/epbc-act-reforms-senate-committee-recommendations", kind: "explainer", stance: "MIXED" },
      { title: "Environment protection reforms", outlet: "Department of Climate Change, Energy, the Environment and Water", url: "https://www.dcceew.gov.au/environment/epbc/epbc-act-reform", kind: "report", stance: "SUPPORTS" },
      { title: "Wind and solar developers hope for faster decisions after 11th-hour nature deal between Labor and Greens", outlet: "RenewEconomy", url: "https://reneweconomy.com.au/wind-and-solar-developers-hope-for-faster-decisions-after-11th-hour-nature-deal-between-labor-and-greens/", kind: "report", stance: "SUPPORTS", votes: { n: 3, agree: 2, well: 2 } },
      { title: "Environment Protection Reform Bill 2025: community objections", outlet: "Pittwater Online News", url: "https://www.pittwateronlinenews.com/Environment-Protection-Reform-Bill-2025-Nov2025.php", kind: "blog", stance: "CONTRADICTS", votes: { n: 2, agree: 1, well: 1 } },
      { title: "Environmental law overhaul sparks political storm in Canberra", outlet: "SBS News", url: "https://www.sbs.com.au/news/podcast-episode/environmental-law-overhaul-sparks-political-storm-in-canberra/9up0q8zqm", kind: "interview", stance: "MIXED" },
      { title: "EPBC Act reforms passed", outlet: "Lander & Rogers", url: "https://www.landers.com.au/legal-insights-news/epbc-act-reforms-passed", kind: "explainer", stance: "MIXED" },
      { title: "Australian Parliament passes key reforms to Australia's national environmental laws", outlet: "White & Case", url: "https://www.whitecase.com/insight-alert/australian-parliament-passes-key-reforms-australias-national-environmental-laws", kind: "explainer", stance: "SUPPORTS" },
    ],
    votes: { n: 11, agree: 6, well: 7 },
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
    votes: { n: 8, agree: 7, well: 7 },
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
    votes: { n: 6, agree: 5, well: 4 },
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
    votes: { n: 7, agree: 6, well: 6 },
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
  },
  {
    key: "A-national-interest",
    title: "The national-interest exemption lets a minister approve high-impact projects that fail the new standards, without defined limits on when it can be used",
    oneLiner: "The power that environment groups and the Senate committee both singled out.",
    body: "Sections commenced in February 2026 let the minister grant, vary or revoke exemptions from the Act's protections on national-interest grounds. Fossil fuel projects are barred from using the power, but the Senate committee's main concern was that it could still approve high-impact projects inconsistent with the national environmental standards without a genuine national-interest basis, and it recommended published principles and thresholds, which did not yet exist.",
    type: "OPINION",
    evidenceStrength: "STRONG",
    tags: ["ENVIRONMENT", "GOVERNANCE"],
    context:
      "This is where the live debate on the reforms sits. The standards and the EPA are the protections; the exemption is the door around them. How wide the door is depends on guidance and regulations still being written.",
    disagreement:
      "The government points to precedent, a 2023 carve-out for AUKUS nuclear waste, and says the power is for genuine emergencies and defence. Critics say an undefined power is defined by whoever holds it next, and that vegetation clearing, critical minerals and badly sited renewables could all pass through it.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Corrs Chambers Westgarth, 'EPBC Act reforms: Senate committee recommendations', 29 April 2026",
        url: "https://corrs.com.au/insights/epbc-act-reforms-senate-committee-recommendations",
      },
      {
        type: "Think tank / NGO",
        citation: "Environmental Defenders Office, 28 November 2025 — national interest pathways lack adequate guardrails",
        url: "https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/",
      },
    ],
    votes: { n: 7, agree: 5, well: 6 },
  },
  {
    key: "A-exemption-guidance",
    title: "The Senate committee recommended published principles and thresholds for using the national-interest power, and none had been published when the power commenced",
    oneLiner: "The limits everyone agrees are needed do not yet exist.",
    body: "The committee's report, while concluding the package struck an appropriate balance, recommended that the government publish the circumstances, factors and thresholds under which the national-interest power may be used. The power itself commenced on 20 February 2026 ahead of any such guidance.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["ENVIRONMENT", "GOVERNANCE"],
    context: "A gap between a power and its guardrails is temporary by design, but the order in which they arrived is part of why trust in the exemption is low.",
    disagreement: "Not disputed. The government says guidance is coming; critics say it should have come first.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Corrs Chambers Westgarth, 29 April 2026 — committee recommendation on national-interest guidance; commencement dates",
        url: "https://corrs.com.au/insights/epbc-act-reforms-senate-committee-recommendations",
      },
    ],
    votes: { n: 4, agree: 4, well: 4 },
  },
  {
    key: "A-aukus-precedent",
    title: "The government points to a 2023 carve-out of AUKUS nuclear-waste facilities from environment law as precedent for a national-interest exemption",
    oneLiner: "The exemption is not new in kind, the government argues, only in form.",
    body: "Responding to concern about the exemption, the minister cited the 2023 legislation that exempted AUKUS submarine nuclear-waste management from parts of the environmental approval regime, passed with bipartisan support, as the kind of case the new power is for.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["ENVIRONMENT", "DEFENCE"],
    context: "Precedent arguments cut both ways here: the AUKUS exemption was itself contested by environment groups.",
    disagreement: "Agreed as what the government said. Critics answer that a one-off Act debated in Parliament is a different thing from a standing ministerial power.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Environmental Defenders Office, 28 November 2025 — government response citing the 2023 AUKUS carve-out",
        url: "https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/",
      },
    ],
    votes: { n: 3, agree: 2, well: 2 },
  },
  {
    key: "A-epa-independence",
    title: "The new Environmental Protection Agency has no independent board, and can be directed by the minister when exercising delegated approval powers",
    oneLiner: "An EPA was the reform's centrepiece; how independent it is remains contested.",
    body: "The agency gets assessment and approval powers only when the minister delegates them, and when acting under delegation it can be directed. Under its own enforcement powers it is free of direction but must answer a ministerial statement of expectations. Its chief executive is appointed by the Governor-General on the minister's advice; there is no board.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["ENVIRONMENT", "GOVERNANCE"],
    context: "Environment groups campaigned for an independent regulator for a decade; what they got is a regulator independent in enforcement and answerable in approvals.",
    disagreement: "Not disputed as a description. Disputed is whether this is independence enough, and whether approval powers should ever have been left with the minister.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Environmental Defenders Office, 28 November 2025 — structure and direction powers of the National EPA",
        url: "https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/",
      },
    ],
    votes: { n: 5, agree: 4, well: 5 },
  },
  {
    key: "A-fossil-excluded",
    title: "Coal, gas and petroleum projects are excluded from the streamlined pathway and the national-interest exemption",
    oneLiner: "The Greens' price for passage: the projects with the largest impacts keep the slow road.",
    body: "Under the Labor–Greens deal, fossil fuel activities including exploration cannot use the streamlined assessment, the national-interest exemption or bioregional planning pathways, and the water trigger for large coal and unconventional gas projects stays with the Commonwealth.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: ["ENVIRONMENT", ...ENERGY],
    context: "This is the clearest sense in which the reforms do not trade protection for speed: the speed is denied to the projects environment groups worry about most.",
    disagreement: "Agreed as fact. Industry argues it leaves gas supply projects, which the government's own energy plan relies on, in the slowest lane.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Environmental Defenders Office, 28 November 2025 — terms of the Greens deal",
        url: "https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/",
      },
    ],
    votes: { n: 5, agree: 5, well: 4 },
  },
  {
    key: "A-unacceptable-bar",
    title: "The reforms raised the bar for refusing a project on 'unacceptable impacts' from impacts that are likely to impacts that are certain",
    oneLiner: "A drafting change environment groups regard as a weakening.",
    body: "The final bills removed 'likely to have' from the unacceptable-impacts test, so that a refusal on that ground now requires the impact to be certain rather than probable. The Environmental Defenders Office lists it among the package's remaining shortcomings, alongside time-limited stop-work orders and the retained restoration fund.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["ENVIRONMENT"],
    context: "Small words in environmental law carry large consequences; this one determines how much uncertainty a proponent gets the benefit of.",
    disagreement: "The change is agreed. Whether it matters in practice depends on how the standards define impacts, which is still being settled.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Environmental Defenders Office, 28 November 2025 — 'what remains wrong'",
        url: "https://www.edo.org.au/2025/11/28/historic-environment-reforms-what-happened-in-parliament-and-what-comes-next/",
      },
    ],
    votes: { n: 4, agree: 3, well: 3 },
  },
  {
    key: "A-timeframes-cut",
    title: "The streamlined pathway shortens the statutory assessment-and-approval period from 70 days to 50 or fewer",
    oneLiner: "The speed gain, as quantified in the bills as introduced.",
    body: "Law-firm analysis of the bills as introduced put the new streamlined pathway's statutory period at 50 days or less against the current 70, alongside removal of duplication with state processes. The provisions commence by 1 December 2026, so the figure is a design claim rather than an observed result.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: ["ENVIRONMENT", "ECONOMY"],
    context: "Statutory clocks measure only the part of the process they cover, which is why the pre-referral claim below still matters.",
    disagreement: "Agreed as the design. Disputed is how often the clock will be stopped, as it routinely was under the old Act.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Lander & Rogers, 'EPBC Act reforms passed' — streamlined pathway timeframes",
        url: "https://www.landers.com.au/legal-insights-news/epbc-act-reforms-passed",
      },
    ],
    votes: { n: 4, agree: 3, well: 3 },
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
      "Parking minimums date from the mid-twentieth century and were set to keep new buildings from pushing cars onto the street ([Wikipedia: parking mandates](https://en.wikipedia.org/wiki/Parking_mandates)). They are now identified as a large hidden cost of housing: Grattan's May 2026 report [Wasted space](https://grattan.edu.au/report/wasted-space/) estimates they add roughly $70,000 to a two-bedroom apartment in Sydney, $62,000 in Melbourne and up to $137,000 in Perth, and that Australia builds more than a billion dollars of unused off-street parking a year.\n\nSome Australian governments have moved. [Victoria removed minimums](https://www.premier.vic.gov.au/yes-more-homes-and-yes-more-local-infrastructure) near high-frequency public transport in December 2025, and New South Wales' low- and mid-rise housing rules limit councils' ability to refuse projects on parking grounds. Grattan wants states to override council minimums everywhere.",
    disagreement:
      "Both sides accept that parking is costly and that some residents will own cars regardless. They divide on who should bear the mismatch: the resident who parks on the street, the neighbour who loses a space, or the buyer who pays for a car space they do not use. Grattan's finding that up to 40 per cent of inner-Melbourne street spaces sit empty at night is the newest evidence in that fight, and no organised opposition to removal has yet made a public case.",
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
      { label: "Dec 2025", text: "Victoria removes parking minimums for new homes near high-frequency public transport, citing 40 per cent empty residential car parks in inner Melbourne." },
      { label: "May 2026", text: "Grattan Institute's 'Wasted space' calls on states to override council minimums nationally: 86,000 unneeded spaces and $5.2 billion over five years." },
    ],
    voices: [
      { title: "Wasted space: Axe car-parking rules to ease the housing crisis", outlet: "Grattan Institute", author: "Aruna Sathanapally, Ashleigh Chang, Dominic Behrens and Matthew Bowes", url: "https://grattan.edu.au/report/wasted-space/", kind: "report", stance: "SUPPORTS", votes: { n: 5, agree: 4, well: 5 } },
      { title: "Axe car-parking rules to cut the cost of housing", outlet: "Grattan Institute", url: "https://grattan.edu.au/axe-car-parking-rules-to-cut-the-cost-of-housing/", kind: "op-ed", stance: "SUPPORTS" },
      { title: "Yes to more homes and yes to more local infrastructure", outlet: "Premier of Victoria", url: "https://www.premier.vic.gov.au/yes-more-homes-and-yes-more-local-infrastructure", kind: "speech", stance: "SUPPORTS", votes: { n: 2, agree: 1, well: 1 } },
      { title: "Car parking rules for apartments are wasting space and billions of dollars", outlet: "WhichCar", url: "https://www.whichcar.com.au/news/car-parking-rules-apartments-wasting-space-money-grattan-institute", kind: "report", stance: "MIXED" },
      { title: "Australia's $1 billion car park problem has an answer", outlet: "Drive", url: "https://www.drive.com.au/caradvice/australias-1-billion-car-park-problem-has-an-answer/", kind: "op-ed", stance: "SUPPORTS" },
      { title: "'Separate the house from the car': proposal to scrap parking for apartments near public transport", outlet: "CarAdvice", url: "https://www.caradvice.com.au/caradvice/apartment-parking-rules-victoria/", kind: "report", stance: "MIXED", votes: { n: 3, agree: 2, well: 2 } },
      { title: "Unlocking Victorian development with modernised car parking requirements", outlet: "Urbis", url: "https://urbis.com.au/perspectives/unlocking-victorian-development-with-modernised-car-parking-requirements", kind: "explainer", stance: "SUPPORTS" },
      { title: "How parking rules add $137,000 to a new home", outlet: "Australian Broker", url: "https://www.brokernews.com.au/news/breaking-news/how-parking-rules-add-137000-to-a-new-home-289380.aspx", kind: "report", stance: "SUPPORTS" },
    ],
    votes: { n: 12, agree: 6, well: 7 },
  },
  {
    key: "P-cost-per-space",
    title: "Parking minimums add roughly $70,000 to the cost of a two-bedroom apartment in Sydney, $62,000 in Melbourne and up to $137,000 in Perth",
    oneLiner: "Grattan's 2026 estimates of what the rules add to each new apartment.",
    body: "Basement and podium parking is among the most expensive floor space in a building, and the requirement often forces an extra basement level. Grattan's May 2026 report put the cost of mandated parking at about $70,000 per two-bedroom apartment in Sydney, $62,000 in Melbourne, $113,000 in Brisbane, $95,000 in Adelaide and $137,000 in Perth, recovered in the price of every apartment including those bought by people without cars.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: HOUSING,
    context:
      "The cost claim is the economic core of the case against minimums. The 2026 figures gave it numbers that governments now quote: Victoria cited Grattan's $70,000 when it changed its rules.",
    disagreement:
      "The magnitude is broadly agreed. Whether removing the requirement lowers prices or raises developer margins is the live question, and depends on local competition.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Wasted space: Axe car-parking rules to ease the housing crisis, May 2026",
        url: "https://grattan.edu.au/report/wasted-space/",
      },
      {
        type: "Academic research",
        citation: "Donald Shoup, The High Cost of Free Parking — construction cost of structured parking",
      },
    ],
    votes: { n: 8, agree: 7, well: 7 },
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
    votes: { n: 6, agree: 5, well: 5 },
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
    votes: { n: 8, agree: 5, well: 4 },
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
    votes: { n: 6, agree: 4, well: 5 },
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
    votes: { n: 6, agree: 5, well: 5 },
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
  },
  {
    key: "P-street-vacant",
    title: "Up to 40 per cent of residential and on-street parking in inner Melbourne sits empty at night, and most street spaces are used by residents who already have off-street parking",
    oneLiner: "The spillover fear meets the occupancy data.",
    body: "Victoria's government cited up to 40 per cent of inner-Melbourne residential car parks sitting empty when it changed its rules, and Grattan's report found a similar share of on-street spaces vacant overnight, with most of the occupied ones used by residents who also have a garage or driveway. If the street is that underused, new residents' cars have somewhere to go.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: [...HOUSING, "TRANSPORT"],
    context:
      "This is the first systematic Australian evidence on the question the spillover objection turns on. It covers inner Melbourne; whether it generalises to middle suburbs is open.",
    disagreement:
      "Opponents say averages hide the streets that are full, and that it is those streets' residents who object. Supporters say that is an argument for permits on those streets, not for mandating basements everywhere.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Wasted space, May 2026 — on-street occupancy findings",
        url: "https://grattan.edu.au/report/wasted-space/",
      },
      {
        type: "Primary source",
        citation: "Premier of Victoria, 'Yes to more homes and yes to more local infrastructure', 2 December 2025",
        url: "https://www.premier.vic.gov.au/yes-more-homes-and-yes-more-local-infrastructure",
      },
    ],
    votes: { n: 5, agree: 4, well: 4 },
  },
  {
    key: "P-built-to-minimum",
    title: "Seventy-three per cent of Melbourne apartments built since 2019 provided exactly the legal minimum number of car spaces",
    oneLiner: "If most buildings sit at the floor, the floor is binding.",
    body: "Grattan found that since 2019, 73 per cent of Melbourne apartments and 70 per cent of townhouses were built with precisely the minimum parking the rules required. A rule that most projects would exceed anyway would not show this pattern; one that most projects would undercut if allowed does.",
    type: "FACT",
    evidenceStrength: "MODERATE",
    tags: HOUSING,
    context:
      "This answers the claim that minimums rarely bind because developers build parking anyway: in Melbourne they build to the line and no further.",
    disagreement:
      "Developers say building to the minimum reflects the rule setting market expectations, not suppressed demand for less; Grattan reads it the other way.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Wasted space, May 2026 — share of dwellings built at the minimum",
        url: "https://grattan.edu.au/report/wasted-space/",
      },
    ],
    votes: { n: 4, agree: 3, well: 4 },
  },
  {
    key: "P-victoria-removed",
    title: "Victoria removed minimum parking requirements for new homes near high-frequency public transport in December 2025",
    oneLiner: "The first Australian state to act, on an accessibility basis.",
    body: "From December 2025 Victorian planning rules vary parking requirements by public-transport accessibility level, with no minimums in areas of high or medium accessibility. Accessible parking for people with disabilities is unchanged and developers may still build more spaces with a permit.",
    type: "FACT",
    evidenceStrength: "STRONG",
    tags: [...HOUSING, "TRANSPORT"],
    context:
      "A live Australian trial of the proposal, roughly a year old. Its results, on provision, prices and street parking, are what the next round of this debate will be about.",
    disagreement:
      "Agreed as fact. Opponents note it is limited to well-served areas; Grattan argues that limitation is the next thing to remove.",
    evidence: [
      {
        type: "Primary source",
        citation: "Premier of Victoria, 'Yes to more homes and yes to more local infrastructure', 2 December 2025",
        url: "https://www.premier.vic.gov.au/yes-more-homes-and-yes-more-local-infrastructure",
      },
      {
        type: "Journalism",
        citation: "Urbis, 'Unlocking Victorian development with modernised car parking requirements'",
        url: "https://urbis.com.au/perspectives/unlocking-victorian-development-with-modernised-car-parking-requirements",
      },
    ],
    votes: { n: 5, agree: 5, well: 4 },
  },
  {
    key: "P-unbundle",
    title: "Car spaces could be sold separately from apartments so that only buyers who want parking pay for it",
    oneLiner: "Grattan's companion proposal: unbundle the space from the home.",
    body: "Alongside removing minimums, Grattan recommends removing parking maximums and allowing car spaces to be titled and sold separately from dwellings, so a household without a car is not obliged to buy one and a household with two can buy two.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: [...HOUSING, "TRANSPORT"],
    context: "Unbundling turns parking from a planning quantity into a priced good, which is the logic of the whole proposal carried to the sale contract.",
    disagreement: "Strata and lending rules complicate separate titling; opponents also note it does nothing for street parking.",
    evidence: [
      {
        type: "Think tank / NGO",
        citation: "Grattan Institute, Wasted space, May 2026 — recommendations",
        url: "https://grattan.edu.au/report/wasted-space/",
      },
    ],
    votes: { n: 3, agree: 2, well: 3 },
  },
];

// =============================================================================
// CONNECTIONS
// `from` is the child (the argument), `to` is the parent it bears on.
// =============================================================================

const connections: ConnDef[] = [
  // --- nuclear ---------------------------------------------------------------
  { from: "E-gencost", to: "R-nuclear", relation: "CONTRADICTS", strength: "DECISIVE", reason: "If nuclear is the most expensive option, the main argument for lifting the ban loses its footing.", votes: [7, 3, 2] },
  { from: "E-not-in-time", to: "R-nuclear", relation: "CONTRADICTS", strength: "DECISIVE", crux: true, reason: "The case for repeal is made in terms of this decade's problems; if nuclear cannot touch them, the case has to be remade on other grounds.", votes: [6, 3, 1] },
  { from: "E-distraction", to: "R-nuclear", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Counts against pursuing repeal now even for those who accept it in principle.", votes: [1, 4, 2] },
  { from: "E-smr-ban", to: "R-nuclear", relation: "SUPPORTS", strength: "RELEVANT", reason: "A positive reason for repeal that does not depend on building a large plant soon.", votes: [2, 4, 1] },
  { from: "E-data-centres", to: "R-nuclear", relation: "SUPPORTS", strength: "RELEVANT", reason: "Supplies a private customer and removes the public-cost objection, without touching the timing objection.", votes: [2, 3, 2] },
  { from: "E-state-bans", to: "R-nuclear", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Shows how little federal repeal changes on its own; it does not argue the ban is right.", votes: [0, 2, 4] },
  { from: "E-smr-data-centre-cost", to: "E-data-centres", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If the data-centre customer would pay billions more for nuclear than for solar, the customer is unlikely to appear.", votes: [2, 3, 0] },
  { from: "E-ban-separate", to: "R-nuclear", relation: "SUPPORTS", strength: "RELEVANT", reason: "Separates repeal from construction, which blunts most cost and timing objections without settling them.", votes: [2, 4, 2] },
  { from: "E-france-ontario", to: "R-nuclear", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the technology can run a low-emissions grid; it does not show it can be built here in time or at a competitive cost.", votes: [2, 5, 2] },
  { from: "E-unsafe", to: "R-nuclear", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Safety is a reason to regulate reactors, which repeal would permit; it does not by itself argue for a legislative ban.", votes: [1, 2, 5] },

  // --- the nuclear crux has its own arguments --------------------------------
  { from: "E-not-before-2040", to: "E-not-in-time", relation: "SUPPORTS", strength: "DECISIVE", reason: "The timing claim rests on this estimate.", votes: [5, 2, 0] },
  { from: "E-coal-closures", to: "E-not-in-time", relation: "SUPPORTS", strength: "RELEVANT", reason: "Sets the deadline nuclear would miss.", votes: [2, 4, 1] },
  { from: "E-gas-firming", to: "E-not-in-time", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the firming problem is being solved by other means in the meantime.", votes: [1, 3, 2] },
  { from: "E-smr-none-built", to: "E-smr-ban", relation: "CONTRADICTS", strength: "RELEVANT", reason: "The option being kept open has not yet been shown to exist commercially.", votes: [2, 3, 0] },
  { from: "E-no-regulator", to: "E-not-before-2040", relation: "SUPPORTS", strength: "RELEVANT", reason: "Each missing institution adds years to the sequence before construction can start.", votes: [2, 4, 1] },
  { from: "E-uae-twelve-years", to: "E-not-before-2040", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Shows a newcomer can build in about twelve years; from 2026 that lands in the late 2030s, so it narrows the claim without defeating it.", votes: [2, 4, 2] },
  { from: "A-samuel-slow", to: "E-not-before-2040", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "A reactor would pass through the same slow approval process as every other major project, adding to the timeline.", votes: [0, 2, 3] },

  // --- gas reservation -------------------------------------------------------
  { from: "E-grandfathered-contracts", to: "R-gas", relation: "CONTRADICTS", strength: "DECISIVE", crux: true, reason: "If the exemptions leave too little gas in the scheme, it cannot move the price whatever its headline share.", votes: [5, 2, 0] },
  { from: "E-wa-domgas", to: "R-gas", relation: "SUPPORTS", strength: "RELEVANT", reason: "The precedent the scheme is modelled on coincides with the outcome it promises.", votes: [3, 4, 1] },
  { from: "E-east-prices", to: "R-gas", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Establishes the problem the scheme answers; says nothing about whether this design solves it.", votes: [1, 2, 4] },
  { from: "E-investment-deterrent", to: "R-gas", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If new supply dries up, prices rise regardless of how the existing gas is allocated.", votes: [2, 4, 1] },
  { from: "E-export-tax", to: "R-gas", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Argues a different instrument would have done more for prices; a competing answer rather than a rebuttal.", votes: [1, 3, 2] },
  { from: "E-market-working", to: "R-gas", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Questions whether lower gas prices are the right goal at all during a transition away from gas.", votes: [1, 2, 4] },
  { from: "E-adgsm", to: "R-gas", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "A supply lever already existed and was never triggered; reservation must show what it adds.", votes: [0, 2, 3] },
  { from: "E-gas-firming", to: "R-gas", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Gas demand for firming persists, so the domestic price keeps mattering.", votes: [0, 2, 3] },
  { from: "E-coal-closures", to: "R-gas", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Coal's exit raises reliance on gas in exactly the years the scheme starts.", votes: [0, 2, 3] },
  { from: "E-gencost", to: "R-gas", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Cheaper renewables erode long-run gas demand, which weakens the case slowly.", votes: [0, 1, 4] },

  // --- the gas crux has its own arguments -----------------------------------
  { from: "E-softened-110", to: "E-grandfathered-contracts", relation: "SUPPORTS", strength: "RELEVANT", reason: "A reserve pegged to demand that two producers already meet reserves little new gas.", votes: [2, 3, 0] },
  { from: "E-southern-price-modelling", to: "E-grandfathered-contracts", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Even modest extra southern supply lowers prices in the modelling the government relies on.", votes: [1, 3, 1] },
  { from: "E-wa-cheap-gas", to: "E-wa-domgas", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If geology explains the precedent, the precedent proves less than it seems.", votes: [1, 3, 1] },
  { from: "E-industry-split", to: "E-investment-deterrent", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Producers who already supply the domestic market accepted the rule without threatening investment.", votes: [1, 3, 1] },


  // --- negative gearing ------------------------------------------------------
  { from: "H-investor-loans-established", to: "R-negative-gearing", relation: "SUPPORTS", strength: "DECISIVE", reason: "The proposal's core premise is that the concession is not producing new supply; this is the evidence for it.", votes: [5, 3, 1] },
  { from: "H-ng-materially-affordable", to: "R-negative-gearing", relation: "SUPPORTS", strength: "RELEVANT", reason: "The outcome most proponents want from the proposal; it is argued separately because it may be false while the proposal is still justified.", votes: [3, 4, 2] },
  { from: "H-second-home-value", to: "R-negative-gearing", relation: "SUPPORTS", strength: "RELEVANT", reason: "A fairness ground that survives even if the price effect is negligible.", votes: [2, 4, 2] },
  { from: "H-rents-rise", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "DECISIVE", crux: true, reason: "If true, the proposal harms the renters it is meant to help, which would defeat it.", votes: [4, 3, 2] },
  { from: "H-supply-lagged", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If supply is the dominant driver, the concession is a second-order factor and the proposal aims at the wrong target.", votes: [4, 3, 2] },
  { from: "H-middle-income", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Who benefits bears on fairness, not on whether the concession adds supply or raises prices.", votes: [1, 3, 4] },
  { from: "H-foreign-buyers", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Argues the price problem lies elsewhere; even if true it does not bear on what the concession does.", votes: [3, 3, 3] },
  { from: "H-grandfathering-timid", to: "R-negative-gearing", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Says the bill should go further, not that it should fail; counts against passing it as drafted.", votes: [0, 2, 3] },
  { from: "H-treasury-rent", to: "H-ng-materially-affordable", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Treasury itself says the measures redistribute ownership rather than change supply or prices much.", votes: [1, 3, 1] },

  // --- the affordability claim has evidence against it -------------------------
  { from: "H-grattan-two-percent", to: "H-ng-materially-affordable", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A 2 per cent effect is real but hard to call material against a decade of double-digit growth.", votes: [2, 4, 1] },

  // --- the rent objection has arguments both ways ----------------------------
  { from: "H-treasury-rent", to: "H-rents-rise", relation: "CONTRADICTS", strength: "RELEVANT", reason: "The official estimate of the rent effect is small.", votes: [2, 3, 0] },
  { from: "H-industry-modelling", to: "H-rents-rise", relation: "SUPPORTS", strength: "RELEVANT", reason: "The industry's estimate is several times Treasury's.", votes: [1, 3, 1] },
  { from: "H-quarantine-1985", to: "H-rents-rise", relation: "CONTRADICTS", strength: "RELEVANT", reason: "The only natural experiment shows rent rises tracked local vacancy, not the tax change.", votes: [3, 3, 1] },
  { from: "H-private-landlords", to: "H-rents-rise", relation: "SUPPORTS", strength: "RELEVANT", reason: "If individuals supply most rentals, a change to their incentives acts on most of the stock.", votes: [2, 4, 1] },

  // --- migration -------------------------------------------------------------
  { from: "H-supply-lagged", to: "R-migration", relation: "SUPPORTS", strength: "DECISIVE", reason: "Housing pressure is the central argument for a cap; without a supply shortfall the case largely dissolves.", votes: [6, 3, 1] },
  { from: "M-nom-double", to: "R-migration", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the recent intake was far above the proposed cap, which is the problem the proposal names.", votes: [2, 4, 1] },
  { from: "M-entitled-to-decide", to: "R-migration", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Establishes that a cap is legitimate, not that this cap is right; it does little work for the specific number.", votes: [2, 2, 5] },
  { from: "M-take-jobs", to: "R-migration", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Widely made, but it does not engage with how labour markets actually absorb migrants.", votes: [1, 2, 4] },
  { from: "M-catch-up", to: "R-migration", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If the record year corrects itself, a permanent cap is a response to a temporary condition.", votes: [3, 4, 2] },
  { from: "M-cap-needs-student-cuts", to: "R-migration", relation: "CONTRADICTS", strength: "DECISIVE", crux: true, reason: "Names the cost of the proposal; whether it is acceptable is what the debate actually turns on.", votes: [4, 3, 1] },
  { from: "M-shortages", to: "R-migration", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A cap that reached skilled migration would worsen shortages; whether it need reach them is argued below.", votes: [2, 4, 2] },
  { from: "M-intl-ed-export", to: "R-migration", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Quantifies what a student-heavy cut would put at risk.", votes: [2, 4, 2] },

  // --- the migration crux has its own argument -------------------------------
  { from: "M-budget-forecast", to: "R-migration", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If the number is already falling to 225,000, a 200,000 cap buys little at considerable cost.", votes: [2, 3, 1] },
  { from: "M-grattan-rents", to: "R-migration", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the rent effect of lower migration is real, while putting a modest number on it.", votes: [1, 4, 1] },
  { from: "M-budget-forecast", to: "M-catch-up", relation: "SUPPORTS", strength: "RELEVANT", reason: "The forecast decline is what the catch-up explanation predicts.", votes: [1, 3, 0] },
  { from: "M-soft-caps", to: "M-cap-needs-student-cuts", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Shows the student lever exists and is already in use, so a cap would pull it harder.", votes: [0, 2, 3] },
  { from: "M-intl-ed-export", to: "M-cap-needs-student-cuts", relation: "SUPPORTS", strength: "DECISIVE", reason: "Shows why cutting student numbers is a cost and not a rounding error.", votes: [4, 2, 1] },
  { from: "M-skilled-minority", to: "M-shortages", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A cap could be met without touching skilled visas, so shortages need not follow from a cap.", votes: [2, 3, 1] },

  // --- housing supply has its own causes ---------------------------------------
  { from: "A-samuel-slow", to: "H-supply-lagged", relation: "SUPPORTS", strength: "RELEVANT", reason: "Approval delay is one of several constraints on how fast homes get built.", votes: [1, 4, 2] },
  { from: "M-nom-double", to: "H-supply-lagged", relation: "SUPPORTS", strength: "RELEVANT", reason: "The record intake increased the demand side of the shortfall in a single year.", votes: [2, 3, 2] },

  // --- approvals -------------------------------------------------------------
  { from: "A-national-interest", to: "R-approvals", relation: "CONTRADICTS", strength: "DECISIVE", crux: true, reason: "If a minister can route around the standards, the protection half of the promise depends on who the minister is.", votes: [4, 2, 0] },
  { from: "A-epa-independence", to: "R-approvals", relation: "CONTRADICTS", strength: "RELEVANT", reason: "An EPA answerable to the minister on approvals cannot guarantee the standards are applied.", votes: [2, 3, 1] },
  { from: "A-unacceptable-bar", to: "R-approvals", relation: "CONTRADICTS", strength: "RELEVANT", reason: "A higher refusal bar is a weakening of protection by design, however modest.", votes: [1, 3, 1] },
  { from: "A-delay-pre-referral", to: "R-approvals", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If most delay is outside the statutory clock, the speed gain is smaller than the headline.", votes: [1, 3, 1] },
  { from: "A-timeframes-cut", to: "R-approvals", relation: "SUPPORTS", strength: "RELEVANT", reason: "The quantified speed gain the reforms promise.", votes: [2, 3, 0] },
  { from: "A-fossil-excluded", to: "R-approvals", relation: "SUPPORTS", strength: "RELEVANT", reason: "Speed is withheld from the highest-impact projects, which is the strongest sense in which protection was not traded away.", votes: [2, 3, 0] },
  { from: "A-delays-hit-renewables", to: "R-approvals", relation: "SUPPORTS", strength: "RELEVANT", reason: "The projects the energy transition depends on are the main beneficiaries of faster decisions.", votes: [1, 3, 1] },
  { from: "A-samuel-slow", to: "R-approvals", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "Establishes the problem the reforms answer; does not show they answer it.", votes: [0, 2, 3] },
  { from: "A-act-failed-species", to: "R-approvals", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "The old Act failed on protection too, so reform was needed on both counts.", votes: [0, 2, 3] },

  // --- the approvals crux has its own arguments -----------------------------
  { from: "A-exemption-guidance", to: "A-national-interest", relation: "SUPPORTS", strength: "RELEVANT", reason: "An undefined power is as wide as the next minister wants it to be.", votes: [2, 2, 0] },
  { from: "A-aukus-precedent", to: "A-national-interest", relation: "CONTRADICTS", strength: "TANGENTIAL", reason: "Shows the kind of case the power is meant for; does not limit it to such cases.", votes: [0, 1, 3] },


  // --- parking ---------------------------------------------------------------
  { from: "P-cost-per-space", to: "R-parking", relation: "SUPPORTS", strength: "DECISIVE", reason: "The affordability case rests on parking being expensive; this is the evidence that it is.", votes: [4, 3, 1] },
  { from: "P-auckland", to: "R-parking", relation: "SUPPORTS", strength: "RELEVANT", reason: "Shows the policy produces the intended change in provision in a comparable city.", votes: [2, 4, 1] },
  { from: "H-supply-lagged", to: "R-parking", relation: "SUPPORTS", strength: "RELEVANT", reason: "Anything that lowers the cost of building homes bears on the shortfall, though parking is one factor among many.", votes: [2, 4, 2] },
  { from: "P-market-provides", to: "R-parking", relation: "SUPPORTS", strength: "RELEVANT", reason: "Answers the fear that removal means no parking anywhere.", votes: [2, 4, 2] },
  { from: "P-spillover", to: "R-parking", relation: "CONTRADICTS", strength: "RELEVANT", crux: true, reason: "A genuine cost of the proposal, borne by people who did not choose it.", votes: [2, 4, 2] },
  { from: "P-suburbs-lack-transit", to: "R-parking", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Limits where the proposal's premise holds; it argues for a narrower policy rather than none.", votes: [2, 4, 1] },

  // --- the spillover objection has a rebuttal --------------------------------
  { from: "P-street-vacant", to: "P-spillover", relation: "CONTRADICTS", strength: "RELEVANT", reason: "If the street is largely empty at night, the cars have somewhere to go.", votes: [2, 3, 0] },
  { from: "P-built-to-minimum", to: "P-market-provides", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Buildings clustered at the minimum suggest the rule binds, so the market is not providing what buyers want.", votes: [1, 3, 1] },
  { from: "P-victoria-removed", to: "R-parking", relation: "SUPPORTS", strength: "RELEVANT", reason: "An Australian state has already done it where transport is good; the precedent is local now.", votes: [1, 4, 1] },
  { from: "P-unbundle", to: "R-parking", relation: "SUPPORTS", strength: "TANGENTIAL", reason: "A companion design that answers 'who pays' without touching minimums directly.", votes: [0, 2, 3] },
  { from: "P-manage-street", to: "P-spillover", relation: "CONTRADICTS", strength: "RELEVANT", reason: "Spillover is real only where the street is unmanaged, and managing it is within the same council's power.", votes: [2, 3, 1] },
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
    for (const v of c.voices ?? []) {
      if (!/^https?:\/\//.test(v.url)) problems.push(`${c.key}: voice "${v.title}" has no http(s) URL`);
      if (v.votes && (v.votes.agree > v.votes.n || v.votes.well > v.votes.n)) problems.push(`${c.key}: voice vote counts exceed total`);
    }
  }
  for (const root of claims.filter((c) => c.key.startsWith("R-"))) {
    const cruxes = connections.filter((c) => c.to === root.key && c.crux).length;
    if (cruxes < 1 || cruxes > 2) problems.push(`${root.key}: expected 1–2 crux connections, found ${cruxes}`);
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
  await prisma.connectionChallenge.deleteMany();
  await prisma.connectionRevision.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.claimVote.deleteMany();
  await prisma.voiceVote.deleteMany();
  await prisma.voice.deleteMany();
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
        voices: {
          create: (c.voices ?? []).map((v, i) => ({
            title: v.title,
            outlet: v.outlet,
            author: v.author ?? null,
            url: v.url,
            kind: v.kind,
            stance: v.stance,
            votes: { create: demoClaimVotes(`${c.key}-voice-${i}`, v.votes) },
          })),
        },
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
        crux: conn.crux ?? false,
        strengthVotes: { create: demoStrengthVotes(`${conn.from}-${conn.to}`, conn.votes) },
        revisions: { create: { ...AUTHOR, summary: "Initial connection", snapshot: {}, pending: false } },
      },
    });
  }

  const voiceCount = claims.reduce((n, c) => n + (c.voices?.length ?? 0), 0);
  console.log(`Done. ${claims.length} claims (${s.roots} debates), ${connections.length} connections, ${s.reused.length} claims used in more than one place, ${voiceCount} voices.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
