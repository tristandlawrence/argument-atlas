import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import type { ClaimType, EvidenceStrength, ConnectionRelation, ConnectionStrength } from "../generated/prisma/enums.ts";

const prisma = new PrismaClient();

// --- deterministic helpers, so re-seeding produces identical data -----------

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
  const arr = Array.from({ length: total }, (_, i) => i < trueCount);
  return seededShuffle(arr, seed);
}

function strengthSeries(counts: { decisive: number; relevant: number; tangential: number }, seed: number): ConnectionStrength[] {
  const arr: ConnectionStrength[] = [
    ...Array(counts.decisive).fill("DECISIVE"),
    ...Array(counts.relevant).fill("RELEVANT"),
    ...Array(counts.tangential).fill("TANGENTIAL"),
  ];
  return seededShuffle(arr, seed);
}

function claimVoteRows(total: number, agree: number, wellConstructed: number, seed: number) {
  const agreeArr = boolSeries(total, agree, seed + 1);
  const wellArr = boolSeries(total, wellConstructed, seed + 7);
  return Array.from({ length: total }, (_, i) => ({
    voterId: `seed-${seed}-${i}`,
    agree: agreeArr[i],
    wellConstructed: wellArr[i],
  }));
}

function strengthVoteRows(counts: { decisive: number; relevant: number; tangential: number }, seed: number) {
  const series = strengthSeries(counts, seed);
  return series.map((value, i) => ({ voterId: `seed-sv-${seed}-${i}`, value }));
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// --- content model ------------------------------------------------------

type ChildDef = {
  title: string;
  oneLiner: string;
  body: string;
  type: ClaimType;
  evidenceStrength: EvidenceStrength;
  relation: ConnectionRelation;
  statedStrength: ConnectionStrength;
  votes: { total: number; agree: number; well: number };
  strengthVotes: { decisive: number; relevant: number; tangential: number };
};

type DebateDef = {
  slug: string;
  title: string;
  oneLiner: string;
  body: string;
  type: ClaimType;
  evidenceStrength: EvidenceStrength;
  tags: string[];
  contextBackground: string;
  contextDisagreement: string;
  timeline: { label: string; text: string }[];
  evidence: { type: string; citation: string; url?: string }[];
  votes: { total: number; agree: number; well: number };
  children: ChildDef[];
};

let seedCounter = 0;
function nextSeed() {
  seedCounter += 1;
  return seedCounter * 97;
}

async function seedDebate(def: DebateDef) {
  const root = await prisma.claim.create({
    data: {
      slug: def.slug,
      title: def.title,
      oneLiner: def.oneLiner,
      body: def.body,
      type: def.type,
      evidenceStrength: def.evidenceStrength,
      tags: def.tags,
      contextBackground: def.contextBackground,
      contextDisagreement: def.contextDisagreement,
      timeline: { create: def.timeline.map((t, i) => ({ label: t.label, text: t.text, sortOrder: i })) },
      evidenceItems: { create: def.evidence },
      votes: { create: claimVoteRows(def.votes.total, def.votes.agree, def.votes.well, nextSeed()) },
      revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial claim", snapshot: {}, pending: false } },
    },
  });

  const childIds: Record<string, string> = {};

  for (const child of def.children) {
    const childSlug = slugify(`${child.title}-${def.slug}`);
    const childClaim = await prisma.claim.create({
      data: {
        slug: childSlug,
        title: child.title,
        oneLiner: child.oneLiner,
        body: child.body,
        type: child.type,
        evidenceStrength: child.evidenceStrength,
        tags: def.tags,
        contextBackground: `${child.body} It surfaces most directly inside the debate over “${def.title}.”`,
        contextDisagreement: `Disagreement here tracks the same fault line as the parent debate: ${def.contextDisagreement}`,
        votes: { create: claimVoteRows(child.votes.total, child.votes.agree, child.votes.well, nextSeed()) },
        revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial claim", snapshot: {}, pending: false } },
      },
    });
    childIds[child.title] = childClaim.id;

    await prisma.connection.create({
      data: {
        fromClaimId: childClaim.id,
        toClaimId: root.id,
        relation: child.relation,
        statedStrength: child.statedStrength,
        statedReason: "Matches the community distribution at seed time.",
        strengthVotes: { create: strengthVoteRows(child.strengthVotes, nextSeed()) },
        revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial connection", snapshot: {}, pending: false } },
      },
    });
  }

  return { rootId: root.id, childIds };
}

// --- flagship reference debate (from the design mockups) ----------------

const platformLiability: DebateDef = {
  slug: "platforms-legally-responsible-for-user-content",
  title: "Social media platforms should be held legally responsible for content posted by users",
  oneLiner:
    "Whether platforms should face liability for user-generated content, or whether the protections that shield them today should remain intact.",
  body:
    "The question turns on a distinction drawn decades ago: is an online service more like a printer, responsible for what it publishes, or more like a phone line, responsible for nothing said across it. Ranked feeds complicate the phone-line analogy.",
  type: "PROPOSAL",
  evidenceStrength: "STRONG",
  tags: ["TECHNOLOGY", "LAW"],
  contextBackground:
    "The question turns on a distinction drawn decades ago: is an online service more like a printer, responsible for what it publishes, or more like a phone line, responsible for nothing said across it. Most legal systems settled on the second answer while the web was young, and built liability shields accordingly.\n\nThat settlement assumed platforms were passive. Ranked feeds changed the assumption — a service that chooses what to show, in what order, to whom, is making decisions a phone line never makes. The current argument is largely about whether that change is significant enough to move the legal line, and what breaks if it moves.\n\nIt matters beyond the largest platforms. The same shield covers volunteer-run forums, encyclopedias and community sites that could not survive pre-publication review — which is why reform proposals increasingly turn on size and amplification rather than hosting alone.",
  contextDisagreement:
    "Both sides largely accept that ranking is a choice and that harm exists. They divide on whether liability is the right instrument, and on who would actually bear the cost.",
  timeline: [
    { label: "1996", text: "Liability shields for online hosts are written into law, on the assumption that services carry content rather than choose it." },
    { label: "2006–12", text: "User-generated platforms scale globally. Chronological feeds give way to ranked ones." },
    { label: "2016–20", text: "Elections and public-health crises put recommendation systems under sustained political scrutiny." },
    { label: "2021", text: "Leaked internal research reports that a major platform knew its ranking amplified divisive content." },
    { label: "Now", text: "Reform proposals increasingly target amplification and platform size rather than hosting itself." },
  ],
  evidence: [
    { type: "Primary document", citation: "Communications Decency Act §230 (1996)" },
    { type: "Reporting", citation: "Investigative series on leaked internal platform research, 2021" },
  ],
  votes: { total: 86, agree: 34, well: 36 },
  children: [
    {
      title: "Amplification of harmful content is a deliberate product decision",
      oneLiner: "Platforms actively select and rank content; choosing what to surface is an editorial act.",
      body:
        "Platforms do not passively host content — their algorithms actively select and amplify it. Choosing what to surface is an editorial act, and liability frameworks already treat editorial acts differently from carriage.",
      type: "FACT",
      evidenceStrength: "STRONG",
      relation: "SUPPORTS",
      statedStrength: "DECISIVE",
      votes: { total: 86, agree: 61, well: 60 },
      strengthVotes: { decisive: 61, relevant: 14, tangential: 10 },
    },
    {
      title: "Moderation technology exists — liability supplies the missing incentive",
      oneLiner: "Detection capability is not the bottleneck; the commercial incentive to use it against harm is.",
      body:
        "Platforms already run sophisticated detection for spam, copyright and advertiser-unfriendly material. The capability is not in question; the commercial reason to point it at harm is.",
      type: "FACT",
      evidenceStrength: "STRONG",
      relation: "SUPPORTS",
      statedStrength: "RELEVANT",
      votes: { total: 41, agree: 28, well: 26 },
      strengthVotes: { decisive: 11, relevant: 22, tangential: 8 },
    },
    {
      title: "Platforms profit directly from the harm they host",
      oneLiner: "Outrage-driven engagement is sold to advertisers, creating a financial motive to tolerate harm.",
      body:
        "Outrage and conflict drive more engagement than measured discourse, and engagement is sold to advertisers. An entity profiting from harm has an obligation to bear some of its cost.",
      type: "FACT",
      evidenceStrength: "MODERATE",
      relation: "SUPPORTS",
      statedStrength: "TANGENTIAL",
      votes: { total: 44, agree: 26, well: 14 },
      strengthVotes: { decisive: 6, relevant: 14, tangential: 26 },
    },
    {
      title: "These protections are the legal foundation of the participatory web",
      oneLiner: "The same shield that covers major platforms also lets small forums and wikis operate without pre-review.",
      body:
        "The immunity that lets platforms host user content without reviewing every post in advance is what makes encyclopedias, forums and community sites possible. Undermining it does not just touch the largest platforms.",
      type: "FACT",
      evidenceStrength: "STRONG",
      relation: "CONTRADICTS",
      statedStrength: "DECISIVE",
      votes: { total: 71, agree: 55, well: 62 },
      strengthVotes: { decisive: 48, relevant: 16, tangential: 7 },
    },
    {
      title: "Liability would entrench the incumbents it aims to constrain",
      oneLiner: "Large firms can absorb compliance costs that smaller competitors cannot.",
      body:
        "Large firms can absorb compliance costs; a startup or a cooperative network cannot. The predictable result is less competition, not better moderation.",
      type: "OPINION",
      evidenceStrength: "MODERATE",
      relation: "CONTRADICTS",
      statedStrength: "RELEVANT",
      votes: { total: 52, agree: 30, well: 34 },
      strengthVotes: { decisive: 15, relevant: 25, tangential: 10 },
    },
  ],
};

// Other claims that reference the flagship "amplification" child from
// elsewhere, including two from different debates — this is what makes the
// "where this claim is used" upward view non-trivial. Created after both
// debates exist, in `crossLinks` below.

const rankedFeedsDuties: { title: string; oneLiner: string; body: string; type: ClaimType; evidenceStrength: EvidenceStrength; tags: string[] } = {
  title: "Ranked feeds should carry the same duties as editorial publishing",
  oneLiner: "A narrower proposal about editorial duties rather than legal liability.",
  body: "If ranking is an editorial act, feeds could be made subject to the same duties of care publishers already carry — corrections, disclosure, and a standard of reasonable diligence — without going as far as full liability.",
  type: "PROPOSAL",
  evidenceStrength: "MODERATE",
  tags: ["TECHNOLOGY"],
};

const conduitClaim: { title: string; oneLiner: string; body: string; type: ClaimType; evidenceStrength: EvidenceStrength; tags: string[] } = {
  title: "Platforms are neutral conduits and should be regulated as infrastructure",
  oneLiner: "The competing frame: platforms carry speech and should be regulated like utilities, not publishers.",
  body: "Treating platforms as infrastructure — like electricity or telecommunications — protects universal access and keeps government out of editorial judgement calls about individual posts.",
  type: "OPINION",
  evidenceStrength: "WEAK",
  tags: ["DEMOCRACY"],
};

const rhetoricClaim: { title: string; oneLiner: string; body: string; type: ClaimType; evidenceStrength: EvidenceStrength; tags: string[] } = {
  title: "Inflammatory rhetoric works by bypassing deliberation",
  oneLiner: "A claim from rhetoric studies about why emotionally charged content spreads.",
  body: "Content that triggers a fast emotional response gets shared before slower, deliberative reading kicks in — a mechanism independent of any particular platform's design.",
  type: "OPINION",
  evidenceStrength: "MODERATE",
  tags: ["RHETORIC"],
};

// --- twenty Australian political debates ---------------------------------

const auDebates: DebateDef[] = [
  {
    slug: "legalise-nuclear-power-in-australia",
    title: "Nuclear power should be legalised and built in Australia",
    oneLiner: "Whether lifting Australia's long-standing nuclear moratorium and building reactors is the right path to a firmed, low-carbon grid.",
    body: "Australia has held a federal moratorium on nuclear power since 1998. Proponents argue it is the only proven technology that can firm a low-carbon grid at scale; opponents argue renewables plus storage will arrive faster and cheaper.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["ENERGY"],
    contextBackground:
      "Australia is one of the few G20 nations with a blanket legal ban on nuclear power generation, dating to 1998 amendments to federal environment law. The debate resurfaced as the National Electricity Market grapples with retiring coal plants and the pace of renewable and transmission build-out.\n\nProponents point to nuclear's low-carbon, high-capacity-factor output as a firm baseload replacement for coal. Opponents point to the long lead times and high historical cost overruns of nuclear builds elsewhere, arguing renewables plus storage and gas peaking can decarbonise faster.",
    contextDisagreement:
      "Both sides broadly accept the grid needs firm, dispatchable low-carbon capacity. The dispute is almost entirely about time frame and cost: whether nuclear can be built fast enough and cheaply enough to matter this decade.",
    timeline: [
      { label: "1998", text: "Federal law amended to prohibit nuclear power generation and enrichment facilities." },
      { label: "2019", text: "A federal parliamentary inquiry examines lifting the nuclear moratorium; no legislative change follows." },
      { label: "2022–24", text: "Coal plant retirement dates are brought forward across the National Electricity Market." },
      { label: "2024", text: "A federal opposition policy proposes government-owned nuclear plants at former coal sites." },
    ],
    evidence: [
      { type: "Official data", citation: "CSIRO GenCost annual report on levelised cost of electricity generation technologies" },
      { type: "Primary document", citation: "Environment Protection and Biodiversity Conservation Act 1999, s.140A" },
    ],
    votes: { total: 97, agree: 41, well: 52 },
    children: [
      {
        title: "Nuclear is the only proven technology that firms a grid without fossil fuels at scale",
        oneLiner: "France and Ontario show large low-carbon grids running on a nuclear-heavy mix.",
        body: "Several large grids — France, Ontario — have decarbonised their electricity supply almost entirely using nuclear as the dispatchable backbone, a track record no storage-plus-renewables grid has yet matched at similar scale.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 58, agree: 39, well: 41 },
        strengthVotes: { decisive: 33, relevant: 16, tangential: 9 },
      },
      {
        title: "Coal communities need a like-for-like transition to firm generation jobs",
        oneLiner: "Nuclear plants at old coal sites could reuse transmission links and the existing skilled workforce.",
        body: "Retiring coal plants sit on grid connections already built for large, firm generators, and their workforces have transferable skills — an argument for replacing them with another firm technology rather than distributed renewables.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 33, agree: 19, well: 12 },
        strengthVotes: { decisive: 4, relevant: 11, tangential: 18 },
      },
      {
        title: "A bipartisan energy policy reduces investment-scaring policy reversals",
        oneLiner: "Two decades of Australian energy policy churn have deterred long-term generation investment.",
        body: "Australian energy and climate policy has changed direction repeatedly since the mid-2000s; a nuclear program with cross-party support could offer investors the policy stability that has been missing.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 28, agree: 14, well: 10 },
        strengthVotes: { decisive: 3, relevant: 9, tangential: 16 },
      },
      {
        title: "Firmed renewables can now reliably meet demand at a lower cost than new nuclear",
        oneLiner: "CSIRO's GenCost modelling puts nuclear as the most expensive new-build technology in Australia's context.",
        body: "CSIRO's annual GenCost modelling consistently finds renewables firmed with storage and transmission cheaper per megawatt-hour than new nuclear in the Australian context, largely due to nuclear's long build times and high capital cost.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 64, agree: 48, well: 51 },
        strengthVotes: { decisive: 40, relevant: 14, tangential: 10 },
      },
      {
        title: "Lifting the moratorium doesn't solve the decade-plus construction timeline",
        oneLiner: "Even optimistic build schedules put a first Australian reactor online well into the 2040s.",
        body: "Australia has no domestic nuclear construction industry, regulator, or trained workforce; comparable countries starting from scratch have taken fifteen to twenty years to bring a first plant online.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 47, agree: 33, well: 30 },
        strengthVotes: { decisive: 16, relevant: 21, tangential: 10 },
      },
    ],
  },
  {
    slug: "phase-out-negative-gearing",
    title: "Negative gearing tax concessions should be phased out for future property purchases",
    oneLiner: "Whether letting investors offset rental property losses against other income inflates house prices and should be wound back.",
    body: "Negative gearing lets property investors deduct rental losses from their taxable income. Critics say it inflates prices by favouring investors over owner-occupiers; defenders say it supports rental housing supply.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["HOUSING", "TAX"],
    contextBackground:
      "Negative gearing allows an investor whose rental property costs (interest, maintenance, rates) exceed rental income to deduct the shortfall from their other taxable income. Combined with the capital gains tax discount introduced in 1999, it has become a central feature of how middle-income Australians invest in property.\n\nThe policy has been politically contentious since at least the 2016 and 2019 federal elections, when a major party twice proposed limiting it to new-build properties only, and lost both elections amid scare campaigns over house prices.",
    contextDisagreement:
      "Economists broadly agree negative gearing has some upward effect on prices at the margin. The disagreement is about magnitude — whether it is a first-order driver of unaffordability or a second-order factor dwarfed by supply constraints and population growth.",
    timeline: [
      { label: "1985", text: "Negative gearing on investment property is temporarily quarantined, then reinstated in 1987 amid investor backlash." },
      { label: "1999", text: "The capital gains tax discount is introduced, compounding the tax advantage of negatively geared property." },
      { label: "2016 & 2019", text: "A federal opposition twice takes a policy to limit negative gearing to new builds; loses both elections." },
      { label: "Now", text: "House price-to-income ratios in major cities sit near record highs, keeping the policy under scrutiny." },
    ],
    evidence: [
      { type: "Official data", citation: "Australian Taxation Office annual taxation statistics, rental property schedules" },
      { type: "Research", citation: "Grattan Institute report on housing affordability and tax concessions" },
    ],
    votes: { total: 112, agree: 58, well: 60 },
    children: [
      {
        title: "Investors outbid first-home buyers because the tax system favours them",
        oneLiner: "An investor's after-tax cost of holding a property is lower than an owner-occupier's, pushing up clearing prices.",
        body: "Because losses are deductible against other income, an investor can sustain a higher purchase price than an owner-occupier bidding with only after-tax dollars, especially at auction on established homes.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 63, agree: 41, well: 38 },
        strengthVotes: { decisive: 17, relevant: 30, tangential: 12 },
      },
      {
        title: "Over two-thirds of negatively geared property is established housing, not new supply",
        oneLiner: "ATO data shows the concession mostly subsidises the purchase of existing homes.",
        body: "Australian Taxation Office data shows the large majority of negatively geared properties are existing dwellings rather than new builds, meaning the concession mostly shifts who owns existing stock rather than adding to supply.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 74, agree: 54, well: 58 },
        strengthVotes: { decisive: 46, relevant: 18, tangential: 10 },
      },
      {
        title: "The concession costs the budget billions that could fund direct housing supply",
        oneLiner: "Forgone revenue from negative gearing and the CGT discount could instead fund social and affordable housing.",
        body: "Treasury estimates the combined revenue forgone from negative gearing and the capital gains tax discount at several billion dollars annually — money that could instead directly fund new social and affordable housing supply.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 39, agree: 24, well: 19 },
        strengthVotes: { decisive: 6, relevant: 15, tangential: 18 },
      },
      {
        title: "Private investors supply most of Australia's rental housing stock",
        oneLiner: "Unlike many countries, Australia relies overwhelmingly on individual landlords rather than institutional or public providers.",
        body: "Roughly a quarter of Australian dwellings are rented from individual investors rather than institutions or government, so removing the incentive to hold rental property risks shrinking rental supply, not just investor demand.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 55, agree: 36, well: 40 },
        strengthVotes: { decisive: 14, relevant: 28, tangential: 13 },
      },
      {
        title: "Constrained land release and slow approvals are the larger price driver",
        oneLiner: "Supply-side planning bottlenecks plausibly dominate demand-side tax settings.",
        body: "Housing supply has consistently lagged population growth for two decades because of planning approval bottlenecks and slow land release, which several economists argue is a larger driver of unaffordability than any single tax concession.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 61, agree: 40, well: 44 },
        strengthVotes: { decisive: 31, relevant: 20, tangential: 10 },
      },
    ],
  },
  {
    slug: "stage-3-tax-cuts-right-policy",
    title: "The Stage 3 tax cuts were the right policy choice",
    oneLiner: "Whether flattening the income tax scale delivered needed bracket-creep relief or handed most of the benefit to high earners during a cost-of-living crisis.",
    body: "The Stage 3 tax cuts collapsed two tax brackets into one, cutting the marginal rate on income between roughly $45,000 and $200,000 to 30%. They were legislated in 2019, then redesigned in 2024 to give more relief to low and middle earners.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: ["TAX", "ECONOMY"],
    contextBackground:
      "The Stage 3 tax cuts were the final part of a three-stage income tax package legislated with bipartisan support in 2019, intended to take effect in July 2024. In their original design, they collapsed the 32.5% and 37% brackets into a single 30% rate covering income from about $45,000 to $200,000.\n\nIn January 2024, amid a cost-of-living squeeze from high inflation and interest rates, the government redesigned the package to reduce the lowest tax rate further and lower the threshold at which the top rate applies, giving relatively more benefit to low and middle income earners and relatively less to the highest earners than the original design.",
    contextDisagreement:
      "Almost nobody disputes bracket creep is real and needed addressing. The argument is about distribution — how much relief high earners deserved relative to everyone else — and about whether the 2024 redesign broke a promise not to change the legislated package.",
    timeline: [
      { label: "2018", text: "A three-stage income tax plan is announced, with Stage 3 flattening the tax scale from 2024." },
      { label: "2019", text: "The full three-stage package passes Parliament with bipartisan support." },
      { label: "2022–23", text: "Inflation and interest rate rises squeeze household budgets ahead of Stage 3's start date." },
      { label: "Jan 2024", text: "The government announces a redesign, shifting more of the benefit to low and middle income brackets." },
      { label: "Jul 2024", text: "The redesigned cuts take effect." },
    ],
    evidence: [
      { type: "Official data", citation: "Treasury distributional analysis of the original and redesigned tax cuts" },
      { type: "Primary document", citation: "Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024" },
    ],
    votes: { total: 104, agree: 51, well: 49 },
    children: [
      {
        title: "Bracket creep had pushed middle earners into rates designed for high earners",
        oneLiner: "Without adjustment, inflation alone drags wage earners into higher tax brackets over time.",
        body: "Because tax brackets are not indexed to inflation, years of wage growth without bracket adjustment had pushed many middle-income earners into tax rates originally intended for much higher incomes.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 68, agree: 51, well: 54 },
        strengthVotes: { decisive: 42, relevant: 18, tangential: 8 },
      },
      {
        title: "The 2024 redesign directed more relief to low and middle income earners",
        oneLiner: "Treasury's own distributional tables show a larger share of the benefit moved down the income scale.",
        body: "Treasury's distributional analysis of the redesigned package shows a larger share of total tax relief going to those earning under $150,000 compared with the original 2019 design.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 57, agree: 42, well: 45 },
        strengthVotes: { decisive: 18, relevant: 27, tangential: 12 },
      },
      {
        title: "A simpler tax scale reduces distortions around bracket thresholds",
        oneLiner: "Fewer brackets mean fewer behavioural distortions near threshold boundaries.",
        body: "Collapsing brackets reduces the number of points at which taxpayers face a jump in marginal rate, which in principle reduces incentives to time income or defer earnings around a threshold.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 24, agree: 13, well: 10 },
        strengthVotes: { decisive: 3, relevant: 8, tangential: 13 },
      },
      {
        title: "The original design still gave the largest dollar benefit to the highest earners",
        oneLiner: "Even after redesign, someone on $200,000 receives a bigger annual cut than someone on $60,000.",
        body: "Under both the original and redesigned versions, the largest absolute dollar saving goes to high income earners, even though the redesign improved relief further down the income scale.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 49, agree: 33, well: 34 },
        strengthVotes: { decisive: 15, relevant: 24, tangential: 10 },
      },
      {
        title: "Flat-rate income tax cuts during high inflation risk adding to demand pressure",
        oneLiner: "Putting more after-tax income into the economy while the central bank is trying to cool demand pulls in opposite directions.",
        body: "Some economists argued that broad income tax cuts, delivered while the Reserve Bank was actively raising interest rates to curb inflation, worked somewhat against the central bank's own efforts to cool demand.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 31, agree: 16, well: 12 },
        strengthVotes: { decisive: 4, relevant: 10, tangential: 17 },
      },
    ],
  },
  {
    slug: "reserve-gas-for-domestic-market",
    title: "Australia should reserve a share of gas production for the domestic market before allowing export",
    oneLiner: "Whether Australia should follow Western Australia's model nationally, requiring gas producers to set aside supply for local use ahead of export contracts.",
    body: "Western Australia has required a share of gas production be reserved for domestic use since 2006; the east coast, tied to a globally-linked LNG export market, has not. East coast gas prices have risen sharply since export terminals opened.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["ENERGY"],
    contextBackground:
      "Western Australia's domestic gas reservation policy, in place since 2006, requires new LNG export projects to also supply a share of production to the local market, and Western Australian gas prices have generally run well below east coast prices as a result.\n\nThe east coast gas market has no equivalent reservation. Since three large LNG export terminals opened in Queensland from 2015, east coast gas producers can sell into a globally-linked export price, and domestic gas users now compete with Asian buyers for the same molecules, pulling local prices up toward export parity.",
    contextDisagreement:
      "Both sides agree WA's domestic prices are lower than the east coast's. The dispute is about cause and remedy — whether reservation itself explains the gap, and whether imposing it retroactively on existing east coast export contracts would deter future investment.",
    timeline: [
      { label: "2006", text: "Western Australia introduces its domestic gas reservation policy for new projects." },
      { label: "2015–16", text: "Three LNG export terminals begin operating in Gladstone, Queensland, linking east coast gas to export prices." },
      { label: "2017", text: "The federal government introduces the Australian Domestic Gas Security Mechanism, allowing export restrictions in a shortfall." },
      { label: "2023", text: "A mandatory code of conduct is introduced to cap east coast wholesale gas prices temporarily." },
    ],
    evidence: [
      { type: "Official data", citation: "Australian Competition and Consumer Commission gas inquiry interim reports" },
    ],
    votes: { total: 66, agree: 38, well: 36 },
    children: [
      {
        title: "Western Australia's reservation policy correlates with materially lower domestic prices",
        oneLiner: "WA gas users have consistently paid less than east coast users since the export terminals opened.",
        body: "Since east coast LNG exports began, Western Australian domestic gas prices have generally sat well below east coast prices, a gap regulators have repeatedly linked to WA's reservation policy.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 47, agree: 35, well: 36 },
        strengthVotes: { decisive: 29, relevant: 12, tangential: 6 },
      },
      {
        title: "East coast manufacturers now compete directly with Asian buyers for local gas",
        oneLiner: "Linking a domestic market to a global export price transmits international price shocks straight to local users.",
        body: "Once east coast gas is contractually linked to export markets, a price shock in Asia flows through to Australian manufacturers and households using the same gas, which a reservation requirement would insulate against.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 39, agree: 27, well: 25 },
        strengthVotes: { decisive: 12, relevant: 20, tangential: 7 },
      },
      {
        title: "Retrospectively changing supply terms undermines contract certainty for major investors",
        oneLiner: "Imposing reservation on projects that were approved without it changes the deal after billions have already been committed.",
        body: "Existing east coast LNG projects were approved and financed on the understanding they could export their full contracted volumes; imposing reservation after the fact changes investment terms that underpinned billions of dollars in committed capital.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 34, agree: 21, well: 22 },
        strengthVotes: { decisive: 9, relevant: 18, tangential: 7 },
      },
      {
        title: "The domestic security mechanism already lets government intervene in a shortfall",
        oneLiner: "A weaker, trigger-based tool already exists and has been used, without a blanket reservation requirement.",
        body: "The Australian Domestic Gas Security Mechanism already allows the government to restrict LNG exports if a forecast domestic shortfall is identified, which supporters of the current settings argue is a more targeted tool than a blanket reservation rule.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 26, agree: 14, well: 15 },
        strengthVotes: { decisive: 3, relevant: 9, tangential: 14 },
      },
    ],
  },
  {
    slug: "reduce-net-overseas-migration",
    title: "Net overseas migration should be significantly reduced",
    oneLiner: "Whether record post-pandemic migration intakes are straining housing and infrastructure faster than they can adapt, or filling essential labour shortages.",
    body: "Net overseas migration hit record levels in 2022–23 as international borders reopened and a backlog of students and workers arrived. Critics link this to housing pressure; business groups link it to filling acute skill shortages.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["IMMIGRATION", "HOUSING"],
    contextBackground:
      "Net overseas migration collapsed to near zero during the pandemic border closures of 2020–21, then rebounded sharply once borders reopened in late 2021, reaching record annual levels in 2022–23 as international students, working holiday makers and skilled migrants returned in a compressed period.\n\nThe rebound coincided with an already-tight rental market and historically low new housing completions relative to population growth, putting migration policy at the centre of the housing affordability debate even though migration, housing supply and interest rates all moved at once.",
    contextDisagreement:
      "Nearly everyone agrees the post-pandemic intake was unusually large due to a one-off catch-up effect. The dispute is about the right ongoing baseline level, and how much weight migration should carry relative to construction rates in explaining rents.",
    timeline: [
      { label: "2020–21", text: "International border closures push net overseas migration into negative territory for the first time in decades." },
      { label: "Late 2021", text: "Borders reopen; students, skilled migrants and working holiday makers return in a compressed wave." },
      { label: "2022–23", text: "Net overseas migration reaches a record annual level." },
      { label: "2023", text: "A migration strategy review announces measures to tighten international student visa integrity settings." },
    ],
    evidence: [
      { type: "Official data", citation: "Australian Bureau of Statistics overseas migration statistics" },
    ],
    votes: { total: 91, agree: 44, well: 40 },
    children: [
      {
        title: "Population growth from migration has outpaced new housing supply in major cities",
        oneLiner: "Dwelling completions have not kept pace with the record migration intake, tightening rental vacancy rates.",
        body: "New dwelling completions in Sydney and Melbourne have run well below the rate needed to house the record migration intake of 2022–23, a mismatch that shows up directly in record-low rental vacancy rates.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 62, agree: 44, well: 40 },
        strengthVotes: { decisive: 34, relevant: 18, tangential: 10 },
      },
      {
        title: "The post-pandemic intake was an unrepeatable catch-up, not the new normal",
        oneLiner: "Two years of closed borders produced a compressed backlog that inflated a single year's figures.",
        body: "A large share of the record 2022–23 intake reflects students and workers who would ordinarily have arrived over the two prior closed-border years arriving all at once, meaning the annual figure overstates the underlying ongoing rate.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 51, agree: 33, well: 32 },
        strengthVotes: { decisive: 27, relevant: 17, tangential: 7 },
      },
      {
        title: "Skilled migrants fill vacancies employers report they cannot fill locally",
        oneLiner: "Healthcare, construction and engineering sectors report acute, persistent skill shortages.",
        body: "Employer surveys and government skills lists consistently identify persistent shortages in healthcare, construction trades and engineering — sectors where the argument for skilled migration is strongest.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 40, agree: 24, well: 21 },
        strengthVotes: { decisive: 10, relevant: 21, tangential: 9 },
      },
      {
        title: "International education is one of Australia's largest export industries",
        oneLiner: "International student fees fund universities and support jobs well beyond the education sector.",
        body: "International education ranks among Australia's largest services exports, and a sharp cut to student numbers would flow through to university budgets and jobs in cities with large student populations.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 35, agree: 19, well: 20 },
        strengthVotes: { decisive: 5, relevant: 13, tangential: 17 },
      },
    ],
  },
  {
    slug: "australia-should-become-a-republic",
    title: "Australia should become a republic with an Australian head of state",
    oneLiner: "Whether Australia should replace the monarch as head of state, and whether now — after the 1999 referendum's failure and a change of monarch — is the moment to try again.",
    body: "Australia's 1999 republic referendum failed, partly due to disagreement over the model for choosing a head of state rather than opposition to a republic itself. The question resurfaced after the death of Queen Elizabeth II in 2022.",
    type: "VALUE",
    evidenceStrength: "WEAK",
    tags: ["GOVERNANCE"],
    contextBackground:
      "Australia's only referendum on becoming a republic, in 1999, failed nationally and in every state, despite polling showing majority in-principle support for a republic. Analysts have long attributed much of the loss to a split between republicans who wanted a directly elected president and those who preferred a parliamentary appointment model, which the actual referendum proposed.\n\nThe question receded from mainstream politics for two decades before resurfacing after the death of Queen Elizabeth II in September 2022, prompting fresh debate about timing, process and whether a change of monarch is a natural moment to revisit the question.",
    contextDisagreement:
      "Support for an Australian head of state in principle is not the main fault line. The practical disagreement is over the selection model — direct election versus parliamentary appointment — which is exactly the split that sank the 1999 vote.",
    timeline: [
      { label: "1999", text: "A national referendum on a republic with a parliamentary-appointed president fails." },
      { label: "2000s–2010s", text: "The republic question largely recedes from mainstream political debate." },
      { label: "2022", text: "Queen Elizabeth II dies; a federal minister for the republic is appointed shortly after." },
      { label: "2024", text: "The federal government confirms no referendum will be held during the current term." },
    ],
    evidence: [
      { type: "Official data", citation: "Australian Electoral Commission 1999 referendum results" },
    ],
    votes: { total: 78, agree: 36, well: 30 },
    children: [
      {
        title: "A hereditary foreign monarch as head of state is inconsistent with a fully independent nation",
        oneLiner: "Australia's head of state is determined by birth in another country's royal family.",
        body: "As things stand, the person who holds Australia's highest constitutional office is determined entirely by hereditary succession within the British royal family, with no role for Australians in the selection.",
        type: "VALUE",
        evidenceStrength: "NONE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 46, agree: 30, well: 24 },
        strengthVotes: { decisive: 12, relevant: 24, tangential: 10 },
      },
      {
        title: "Most comparable democracies have long since moved to a republican model",
        oneLiner: "The majority of the world's advanced democracies, including most Commonwealth nations, are republics.",
        body: "The majority of Commonwealth nations that were once part of the British Empire have since become republics, leaving Australia among a shrinking group that retains the monarch as head of state.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 29, agree: 17, well: 14 },
        strengthVotes: { decisive: 4, relevant: 11, tangential: 14 },
      },
      {
        title: "The 1999 defeat shows the risk lies in the model, not the principle",
        oneLiner: "A referendum that splits republicans between models is likely to fail again.",
        body: "Polling before and after the 1999 referendum consistently showed majority support for a republic in principle, while the actual vote split republicans over whether the president should be directly elected — a disagreement that remains unresolved.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 41, agree: 26, well: 27 },
        strengthVotes: { decisive: 22, relevant: 14, tangential: 5 },
      },
      {
        title: "A referendum so soon after the Voice's defeat risks a second high-profile loss",
        oneLiner: "Running a constitutional referendum shortly after a failed one carries political and momentum risk.",
        body: "The 2023 Voice to Parliament referendum failed nationally, and some strategists argue attempting another constitutional referendum too soon risks compounding referendum fatigue and hardening a habit of voting no.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 27, agree: 15, well: 12 },
        strengthVotes: { decisive: 3, relevant: 9, tangential: 15 },
      },
    ],
  },
  {
    slug: "supermarket-divestiture-powers",
    title: "Supermarkets should face forced divestiture powers to break up duopoly control of grocery retail",
    oneLiner: "Whether the government should be able to force Coles and Woolworths to sell stores, or whether this would raise prices and deter investment without fixing the underlying problem.",
    body: "Coles and Woolworths together hold roughly two-thirds of Australian grocery retail. Farmer groups and some senators have pushed for divestiture powers similar to those in some overseas competition regimes; the competition regulator and government have so far resisted.",
    type: "PROPOSAL",
    evidenceStrength: "WEAK",
    tags: ["ECONOMY", "AGRICULTURE"],
    contextBackground:
      "Coles and Woolworths together account for roughly two-thirds of the Australian grocery retail market, a concentration level that has drawn sustained criticism from farmer groups, independent grocers and consumer advocates, particularly during a period of high food price inflation from 2022.\n\nA Senate select committee and a separate competition regulator inquiry both examined supermarket pricing and market power through 2023–24. Divestiture power — the ability for a regulator or court to order a company to sell assets to restore competition — exists in some sectors overseas but has no precedent in Australian competition law outside of merger blocking.",
    contextDisagreement:
      "There is broad agreement the grocery sector is highly concentrated. The dispute is whether concentration is the actual cause of high prices, given supermarkets also cite input costs, energy and wages, and whether divestiture is a proportionate remedy compared with targeted conduct rules.",
    timeline: [
      { label: "2022–23", text: "Grocery price inflation runs at multi-decade highs, drawing political attention to supermarket margins." },
      { label: "2023", text: "A Senate select committee inquiry into supermarket prices is established." },
      { label: "2024", text: "A separate competition regulator review into supermarkets reports, alongside a mandatory grocery code of conduct." },
      { label: "2024", text: "Crossbench senators introduce a bill to give courts divestiture power over supermarkets found to misuse market power." },
    ],
    evidence: [
      { type: "Official data", citation: "Competition regulator supermarkets inquiry final report" },
    ],
    votes: { total: 84, agree: 46, well: 33 },
    children: [
      {
        title: "Two retailers holding two-thirds of the market gives them outsized pricing power over suppliers",
        oneLiner: "Farmer groups report limited ability to negotiate price with only two major buyers.",
        body: "With only two major buyers for most fresh produce, farmer and supplier groups have repeatedly reported limited ability to negotiate on price or contract terms, a classic symptom of concentrated buyer power.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 47, agree: 33, well: 24 },
        strengthVotes: { decisive: 13, relevant: 23, tangential: 11 },
      },
      {
        title: "The mere threat of forced divestiture can discipline pricing behaviour",
        oneLiner: "Some competition economists argue the credible threat, not its use, does most of the work.",
        body: "In sectors overseas where divestiture powers exist, some competition economists argue the credible threat of forced sale — rarely actually exercised — is itself what disciplines pricing and merger behaviour.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 25, agree: 14, well: 9 },
        strengthVotes: { decisive: 3, relevant: 8, tangential: 14 },
      },
      {
        title: "The competition regulator's own inquiry stopped short of recommending divestiture",
        oneLiner: "The regulator favoured a mandatory code of conduct and merger scrutiny over break-up powers.",
        body: "The competition regulator's own detailed inquiry into the sector recommended a mandatory code of conduct and tighter merger scrutiny rather than divestiture powers, arguing the evidence did not support break-up as the right tool.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 55, agree: 37, well: 40 },
        strengthVotes: { decisive: 29, relevant: 18, tangential: 8 },
      },
      {
        title: "Forced asset sales could deter the investment that keeps prices and supply competitive",
        oneLiner: "A credible break-up threat could make retailers reluctant to invest in efficiency-improving infrastructure.",
        body: "Opponents argue that if supermarkets face a credible risk of forced asset sales, they may under-invest in distribution and efficiency infrastructure, which over time could push prices up rather than down.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 31, agree: 18, well: 14 },
        strengthVotes: { decisive: 4, relevant: 10, tangential: 17 },
      },
    ],
  },
  {
    slug: "ban-gambling-advertising-during-sport",
    title: "Gambling advertising should be banned during live sport broadcasts",
    oneLiner: "Whether the volume of betting ads during sport normalises gambling for children and problem gamblers, or is a proportionate trade-off for free-to-air sport funding.",
    body: "A parliamentary inquiry following the death of anti-gambling reform advocate Peta Murphy recommended a total phase-out of gambling advertising. The government has so far adopted partial restrictions rather than a full ban.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["HEALTH", "MEDIA"],
    contextBackground:
      "A 2023 parliamentary inquiry, chaired by the late MP Peta Murphy, examined the online gambling industry and recommended a complete phase-out of gambling advertising across all media within three years, citing evidence on youth exposure and problem gambling harm.\n\nThe government's response, announced in 2024, adopted partial measures — capping the number of ads shown during live sport and banning ads in the hour before and after play — rather than the inquiry's recommended full phase-out, drawing criticism from health advocates and some broadcasters who argued the restriction still went too far.",
    contextDisagreement:
      "Nearly all sides accept gambling advertising exposure to children should fall. The dispute is over whether a full ban is proportionate given free-to-air broadcasters' reliance on gambling advertising revenue to fund sport coverage.",
    timeline: [
      { label: "2023", text: "A parliamentary inquiry into online gambling reports, recommending a full advertising phase-out." },
      { label: "Dec 2023", text: "Inquiry chair Peta Murphy dies; the report is released posthumously in her name." },
      { label: "2024", text: "The government announces partial restrictions on gambling advertising during sport, short of a full ban." },
    ],
    evidence: [
      { type: "Primary document", citation: "House of Representatives inquiry into online gambling final report, 2023" },
    ],
    votes: { total: 73, agree: 48, well: 44 },
    children: [
      {
        title: "Children who watch sport are exposed to gambling advertising at very high rates",
        oneLiner: "Survey data shows most children who follow sport can recall multiple betting brand names and odds language.",
        body: "Survey research cited in the parliamentary inquiry found the large majority of children who regularly watch sport could recall specific gambling brands and betting terminology, indicating high effective exposure during broadcasts.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 51, agree: 40, well: 38 },
        strengthVotes: { decisive: 31, relevant: 14, tangential: 6 },
      },
      {
        title: "Live odds promotion during play normalises betting as part of watching sport",
        oneLiner: "In-play odds updates frame gambling as a natural companion activity to spectating, not a separate product.",
        body: "Commentary that weaves live betting odds into sport broadcasts frames wagering as a normal companion activity to watching the game, rather than a separately marketed product, which health advocates argue deepens normalisation particularly for younger viewers.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 38, agree: 27, well: 22 },
        strengthVotes: { decisive: 10, relevant: 20, tangential: 8 },
      },
      {
        title: "Gambling advertising revenue helps fund free-to-air broadcast of major sport",
        oneLiner: "Broadcasters argue a full ban would threaten the economics of free, ad-supported sport coverage.",
        body: "Free-to-air broadcasters argue gambling advertising is a significant revenue line that helps keep major sport free to watch, and a full ban would put pressure on that funding model, potentially pushing coverage behind paywalls.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 33, agree: 17, well: 16 },
        strengthVotes: { decisive: 7, relevant: 17, tangential: 9 },
      },
      {
        title: "Partial restrictions already reduced ad volume during the highest-exposure windows",
        oneLiner: "Capping ads during play and around breaks addresses much of the child-exposure problem without a full ban.",
        body: "The government's partial restrictions, capping advertisements during play and around the start and end of matches, address much of the peak child-exposure window without removing gambling advertising revenue entirely.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 29, agree: 16, well: 15 },
        strengthVotes: { decisive: 4, relevant: 11, tangential: 14 },
      },
    ],
  },
  {
    slug: "social-media-age-verification-16",
    title: "Social media platforms should be required to verify users are 16 or older",
    oneLiner: "Australia's world-first social media minimum age law takes effect in December 2025 — whether it protects children's mental health or is an unenforceable overreach.",
    body: "Legislation passed in 2024 requires major social media platforms to take reasonable steps to prevent under-16s from holding accounts, with substantial penalties for systemic non-compliance, but no penalty on children or parents themselves.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["TECHNOLOGY", "HEALTH"],
    contextBackground:
      "Following growing concern about links between social media use and adolescent mental health, Australia legislated a minimum age of 16 for holding accounts on major social media platforms in late 2024, with the obligation to enforce it — and the penalties for failing to — placed on the platforms rather than on children or parents.\n\nThe law does not mandate a specific verification technology, leaving platforms to determine their own 'reasonable steps', which critics say makes the standard vague, while a trial of age-assurance technologies was run to inform implementation ahead of the law's commencement.",
    contextDisagreement:
      "The disagreement is less about whether adolescent mental health matters, and more about whether age verification technology can actually work reliably and privately at this scale, and whether a hard age cut-off is the right policy lever compared with product design regulation.",
    timeline: [
      { label: "2022–23", text: "Research linking heavy adolescent social media use to mental health outcomes gains political attention." },
      { label: "2024", text: "Legislation setting a minimum social media age of 16 passes the federal Parliament." },
      { label: "2024–25", text: "A government-funded trial tests age-assurance technologies ahead of the law's commencement." },
      { label: "Dec 2025", text: "The minimum age obligation on platforms takes effect." },
    ],
    evidence: [
      { type: "Primary document", citation: "Online Safety Amendment (Social Media Minimum Age) Act 2024" },
    ],
    votes: { total: 88, agree: 49, well: 38 },
    children: [
      {
        title: "Adolescent mental health measures worsened over the same period smartphone social media use became universal",
        oneLiner: "Multiple national surveys show a correlated rise in youth anxiety and depression indicators alongside social media adoption.",
        body: "National surveys in several countries show a correlated rise in reported adolescent anxiety, depression and self-harm indicators over the same period smartphone-based social media use became near-universal among teenagers, though researchers differ on how much of this reflects causation.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 46, agree: 30, well: 22 },
        strengthVotes: { decisive: 11, relevant: 22, tangential: 13 },
      },
      {
        title: "Placing the compliance burden on platforms, not children, avoids criminalising kids",
        oneLiner: "The law's penalty structure targets platform non-compliance rather than the young people using the service.",
        body: "Unlike some earlier proposals, the legislated model places all penalties on platforms for systemic non-compliance, explicitly avoiding any penalty or account against the children or parents involved.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 30, agree: 20, well: 17 },
        strengthVotes: { decisive: 4, relevant: 12, tangential: 14 },
      },
      {
        title: "Age verification at this scale has no proven, privacy-preserving technical solution",
        oneLiner: "Every current age-assurance method involves either weak checks easily bypassed, or invasive ID/biometric collection.",
        body: "Independent reviewers of the government's own age-assurance technology trial found no single method that was both reliably accurate and did not require collecting sensitive identity or biometric data from users.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 55, agree: 38, well: 40 },
        strengthVotes: { decisive: 33, relevant: 15, tangential: 7 },
      },
      {
        title: "A hard age cut-off may push younger users onto less regulated, less safe platforms",
        oneLiner: "Displacement to unregulated apps and private messaging could reduce visibility into youth online harm, not increase it.",
        body: "Some youth mental health researchers warn that banning under-16s from mainstream platforms could push them toward smaller, unregulated apps or private messaging groups with less moderation and less visibility for parents and safety systems.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 37, agree: 21, well: 19 },
        strengthVotes: { decisive: 8, relevant: 19, tangential: 10 },
      },
    ],
  },
  {
    slug: "raise-gst-fund-income-tax-cuts",
    title: "The GST rate should be increased to fund further income tax cuts",
    oneLiner: "Whether shifting the tax mix from income to consumption would boost growth and workforce participation, or fall hardest on low-income households.",
    body: "Australia's GST rate of 10% has been unchanged since its 2000 introduction and is low by OECD standards. Various tax reviews have floated raising it in exchange for income tax cuts and compensation for low-income households.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["TAX", "ECONOMY"],
    contextBackground:
      "The Goods and Services Tax was introduced in 2000 at 10% and has never been changed since, despite the rate sitting well below the OECD average for consumption taxes. Because GST revenue is constitutionally tied to the states and requires their unanimous agreement to change, rate rises have proven politically difficult to negotiate.\n\nSuccessive tax reviews, including the 2010 Henry Tax Review, have floated broadening or raising the GST as part of a package that also cuts income tax and compensates low-income households, on the argument that taxing consumption distorts work and investment decisions less than taxing income.",
    contextDisagreement:
      "Economists broadly agree consumption taxes are less distorting than income taxes at the margin. The disagreement is almost entirely about fairness — GST take a larger share of income from low earners than high earners — and whether compensation packages can reliably offset that in practice.",
    timeline: [
      { label: "2000", text: "The GST is introduced nationally at a rate of 10%." },
      { label: "2010", text: "The Henry Tax Review recommends broadening the tax mix but the government rules out changing the GST." },
      { label: "2015", text: "A GST rate rise is floated ahead of a tax white paper process, then shelved amid state disagreement." },
      { label: "Now", text: "The rate remains at 10%, unchanged since introduction." },
    ],
    evidence: [
      { type: "Research", citation: "Henry Tax Review, Australia's Future Tax System, 2010" },
    ],
    votes: { total: 69, agree: 27, well: 31 },
    children: [
      {
        title: "Australia's GST rate and base are both narrow by OECD standards",
        oneLiner: "Many OECD countries apply a broader consumption tax at a materially higher rate.",
        body: "Australia's 10% rate sits below the OECD average for value-added and consumption taxes, and the GST base also excludes fresh food, health and education, narrowing it further relative to comparable countries.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 42, agree: 22, well: 24 },
        strengthVotes: { decisive: 10, relevant: 22, tangential: 10 },
      },
      {
        title: "Consumption taxes distort work and investment decisions less than income taxes",
        oneLiner: "Standard public finance theory treats broad consumption taxes as less economically distorting at the margin.",
        body: "Mainstream public finance analysis, including the Henry Tax Review, treats broad-based consumption taxes as less distorting to work and investment incentives than taxes levied directly on income.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 27, agree: 15, well: 13 },
        strengthVotes: { decisive: 3, relevant: 10, tangential: 14 },
      },
      {
        title: "GST takes a larger share of income from low earners than high earners",
        oneLiner: "Because low-income households spend a larger share of their income, a flat consumption tax is regressive.",
        body: "Because lower-income households spend a much larger proportion of their income on consumption than higher earners, a flat-rate consumption tax like the GST takes a proportionally larger bite out of low incomes unless carefully offset.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 50, agree: 31, well: 34 },
        strengthVotes: { decisive: 30, relevant: 15, tangential: 5 },
      },
      {
        title: "GST changes require unanimous state agreement, making reform politically difficult regardless of merit",
        oneLiner: "Every state and territory must agree to a rate or base change, a high bar that has blocked past proposals.",
        body: "Because GST revenue is distributed to the states and the rate and base cannot be changed without unanimous state and territory agreement, previous proposals to raise or broaden it have stalled for political reasons independent of their economic merit.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 22, agree: 11, well: 14 },
        strengthVotes: { decisive: 3, relevant: 8, tangential: 11 },
      },
    ],
  },
  {
    slug: "phase-out-live-sheep-exports",
    title: "Live sheep exports should be phased out",
    oneLiner: "Legislation ending live sheep exports by sea takes effect in 2028 — whether it corrects a persistent animal welfare failure or needlessly ends a viable regional industry.",
    body: "Live sheep export by sea has faced recurring animal welfare scandals over decades, including mass mortality events in extreme heat. Legislation to phase out the trade by 2028 passed in 2024, with a transition package for affected Western Australian producers.",
    type: "PROPOSAL",
    evidenceStrength: "STRONG",
    tags: ["AGRICULTURE"],
    contextBackground:
      "Live sheep export by sea, overwhelmingly from Western Australia to the Middle East, has faced repeated animal welfare scandals since the 1980s, including footage of mass mortality events during voyages through extreme northern hemisphere summer heat, most prominently in 2018.\n\nAfter successive reviews and tightened regulatory conditions failed to end the recurring welfare incidents, legislation was passed in 2024 to phase out live sheep export by sea entirely from May 2028, accompanied by a transition support package for Western Australian sheep producers and the export supply chain.",
    contextDisagreement:
      "There is little dispute that welfare incidents have occurred and were serious. The disagreement is over whether regulation could have fixed the trade without ending it, and over the adequacy of transition support for an industry concentrated in one state.",
    timeline: [
      { label: "2011", text: "Live cattle exports to Indonesia are briefly suspended after welfare footage; sheep trade conditions are also reviewed." },
      { label: "2018", text: "Footage of mass mortality aboard a live export voyage in extreme heat prompts a formal regulatory review." },
      { label: "2020–23", text: "Tightened stocking density and heat-stress rules are introduced without ending the trade." },
      { label: "2024", text: "Legislation passes to end live sheep export by sea from May 2028, with a transition package for the industry." },
    ],
    evidence: [
      { type: "Reporting", citation: "Investigative footage and subsequent independent review of live export voyage conditions, 2018" },
    ],
    votes: { total: 76, agree: 51, well: 46 },
    children: [
      {
        title: "Mass mortality events during extreme-heat voyages have recurred across decades",
        oneLiner: "Multiple documented mortality events span from the 1980s through to 2018, despite intervening regulation.",
        body: "Documented mass mortality events during live sheep voyages through extreme heat have recurred across four decades of the trade, despite multiple rounds of tightened regulation in between.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 54, agree: 42, well: 40 },
        strengthVotes: { decisive: 36, relevant: 12, tangential: 6 },
      },
      {
        title: "Regulatory tightening after each scandal did not prevent the next one",
        oneLiner: "The repeated pattern of incident, review, and new rules suggests regulation alone cannot fix the underlying risk.",
        body: "Each welfare scandal has been followed by tighter stocking density or heat-stress rules, yet incidents recurred, which supporters of the phase-out argue shows regulation cannot eliminate the underlying risk of long sea voyages through extreme heat.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 39, agree: 27, well: 23 },
        strengthVotes: { decisive: 12, relevant: 19, tangential: 8 },
      },
      {
        title: "The trade is heavily concentrated in one region, and the transition package may not fully replace lost income",
        oneLiner: "Western Australian sheep producers and the export supply chain bear a geographically concentrated impact.",
        body: "The live sheep export trade is heavily concentrated in Western Australia, and producers and supply-chain workers there argue the transition support package may not fully replace the income and infrastructure built around the trade.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 34, agree: 18, well: 19 },
        strengthVotes: { decisive: 9, relevant: 17, tangential: 8 },
      },
      {
        title: "Some Middle Eastern markets prefer live animals for religious slaughter requirements",
        oneLiner: "Certain buyers value live delivery over chilled or frozen meat for observance reasons, an export market chilled meat may not fully replace.",
        body: "Some importing markets have expressed a preference for live animals over chilled or frozen meat for religious slaughter practices, meaning a shift to a chilled meat trade may not capture the full value of the existing live export market.",
        type: "FACT",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 24, agree: 12, well: 12 },
        strengthVotes: { decisive: 3, relevant: 8, tangential: 13 },
      },
    ],
  },
  {
    slug: "legislate-national-voluntary-assisted-dying",
    title: "Voluntary assisted dying should be legislated uniformly across Australia",
    oneLiner: "All states now permit voluntary assisted dying under varying eligibility rules, while the territories only gained the legal power to legislate it in 2025 — should the rules be made consistent nationally?",
    body: "Every Australian state has legalised voluntary assisted dying since Victoria did so first in 2017, but eligibility criteria, waiting periods and access rules differ between states, and the territories only recently gained the power to legislate it themselves.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["HEALTH", "LAW"],
    contextBackground:
      "Victoria became the first Australian state to legalise voluntary assisted dying in 2017, and every other state followed by 2022, each after its own extensive parliamentary inquiry and community consultation process. Because health law is a state responsibility, each state legislated its own eligibility criteria, assessment process and waiting periods, producing meaningful variation between jurisdictions.\n\nThe territories were legally barred from legislating on the issue at all until the federal Parliament repealed the restriction in 2022, and the Australian Capital Territory and Northern Territory have since moved to introduce their own schemes.",
    contextDisagreement:
      "Support for voluntary assisted dying in some form is now broad across jurisdictions. The live disagreement is about consistency and access — whether differing state eligibility rules and waiting periods create unfair postcode-dependent access, and whether uniform national rules would improve or unhelpfully override each state's own deliberative process.",
    timeline: [
      { label: "2017", text: "Victoria becomes the first Australian state to legalise voluntary assisted dying." },
      { label: "2019–22", text: "Western Australia, Tasmania, South Australia, Queensland and New South Wales each legislate their own schemes." },
      { label: "2022", text: "The federal Parliament repeals the law barring territories from legislating on voluntary assisted dying." },
      { label: "2024–25", text: "The Australian Capital Territory and Northern Territory advance their own voluntary assisted dying legislation." },
    ],
    evidence: [
      { type: "Official data", citation: "State voluntary assisted dying review board annual reports" },
    ],
    votes: { total: 81, agree: 52, well: 47 },
    children: [
      {
        title: "Every state's independent review process reached broadly the same conclusion",
        oneLiner: "Six separate state inquiries, run years apart, each recommended some form of legal access.",
        body: "Each state ran its own extensive, independent parliamentary inquiry before legislating, and all six reached broadly the same conclusion — that legal access to voluntary assisted dying under safeguards was appropriate — despite being conducted years apart.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 47, agree: 34, well: 32 },
        strengthVotes: { decisive: 13, relevant: 25, tangential: 9 },
      },
      {
        title: "Differing waiting periods and eligibility rules create unequal access depending on where a patient lives",
        oneLiner: "A patient's practical ability to access assisted dying can depend on which state border they live nearest.",
        body: "Because eligibility criteria and mandatory waiting periods differ by state, terminally ill patients can face materially different practical access to voluntary assisted dying depending on their state of residence, which advocates argue is an arbitrary basis for such a consequential difference.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 41, agree: 29, well: 24 },
        strengthVotes: { decisive: 24, relevant: 13, tangential: 4 },
      },
      {
        title: "State-by-state legislation let each community's own deliberation shape locally appropriate safeguards",
        oneLiner: "Differences in scheme design partly reflect deliberate, community-specific safeguard choices, not oversight.",
        body: "Some of the variation between state schemes reflects deliberate differences in safeguard design that emerged from each state's own community consultation, rather than oversight — a strength some health law scholars argue a uniform national scheme would flatten.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 26, agree: 13, well: 13 },
        strengthVotes: { decisive: 3, relevant: 9, tangential: 14 },
      },
      {
        title: "Health law is constitutionally a state responsibility, limiting the federal government's role",
        oneLiner: "The federal government has no direct power to legislate a uniform scheme over the states' own health laws.",
        body: "Because voluntary assisted dying falls within state health law powers, the federal government cannot simply legislate a single uniform scheme over the top of existing state laws without their agreement, limiting national consistency to a coordination exercise.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 33, agree: 18, well: 21 },
        strengthVotes: { decisive: 9, relevant: 17, tangential: 7 },
      },
    ],
  },
  {
    slug: "rba-raised-rates-too-aggressively-2022-23",
    title: "The Reserve Bank raised interest rates too aggressively in 2022–23",
    oneLiner: "Whether the fastest rate-hiking cycle in a generation was a necessary response to inflation, or overcorrected and caused avoidable mortgage-holder pain.",
    body: "The Reserve Bank raised the cash rate from 0.1% to 4.35% between May 2022 and November 2023, the fastest tightening cycle in decades, aiming to bring inflation back within its 2–3% target band.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: ["ECONOMY"],
    contextBackground:
      "The Reserve Bank held the cash rate at a record low of 0.1% through the pandemic before beginning to raise it in May 2022 as inflation, driven by supply chain disruption, fiscal and monetary stimulus, and later the energy price shock from Russia's invasion of Ukraine, rose to a multi-decade high.\n\nBetween May 2022 and November 2023, the Bank raised the cash rate thirteen times to 4.35%, the fastest tightening cycle since the modern inflation-targeting framework began in the early 1990s, before holding rates steady through 2024 as inflation gradually eased back toward the target band.",
    contextDisagreement:
      "Almost everyone agrees inflation needed to come down. The dispute is about calibration — whether the Bank moved too late and then had to catch up too hard, and whether it placed too much of the adjustment burden on mortgage holders relative to other levers.",
    timeline: [
      { label: "2020–21", text: "The cash rate is held at a record low of 0.1% through the pandemic." },
      { label: "May 2022", text: "The Reserve Bank begins raising rates as inflation climbs to a multi-decade high." },
      { label: "Nov 2023", text: "The cash rate reaches 4.35% after thirteen increases in eighteen months." },
      { label: "2024", text: "Rates are held steady as inflation gradually eases toward the 2–3% target band." },
    ],
    evidence: [
      { type: "Official data", citation: "Reserve Bank of Australia cash rate decision history and statements on monetary policy" },
    ],
    votes: { total: 95, agree: 42, well: 39 },
    children: [
      {
        title: "The Bank itself later acknowledged it was slow to begin raising rates in 2021",
        oneLiner: "A 2023 independent review found the Bank could have started tightening earlier given the inflation signals available.",
        body: "An independent review of the Reserve Bank's conduct found the Bank could plausibly have begun raising rates somewhat earlier in 2021 given the inflation signals already visible, which meant a faster catch-up was required once tightening began.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 44, agree: 28, well: 27 },
        strengthVotes: { decisive: 12, relevant: 22, tangential: 10 },
      },
      {
        title: "Mortgage holders on variable rates absorbed a disproportionate share of the adjustment",
        oneLiner: "Rate rises transmit through the economy mainly via household mortgage repayments, concentrating pain on recent borrowers.",
        body: "Because the cash rate transmits to the economy largely through variable-rate mortgage repayments, the burden of the tightening cycle fell disproportionately on recent home buyers with large, newly originated loans.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 36, agree: 21, well: 17 },
        strengthVotes: { decisive: 6, relevant: 16, tangential: 14 },
      },
      {
        title: "Inflation returned to the target band without the recession some forecasters expected",
        oneLiner: "Unemployment stayed low through the tightening cycle, an outcome the Bank describes as a narrow path successfully navigated.",
        body: "Unemployment remained low throughout the tightening cycle and inflation gradually returned toward the target band without the recession several forecasters had predicted, which the Bank has pointed to as evidence the calibration was ultimately appropriate.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 49, agree: 30, well: 33 },
        strengthVotes: { decisive: 26, relevant: 16, tangential: 7 },
      },
      {
        title: "A slower tightening path risked inflation becoming entrenched in wage and price expectations",
        oneLiner: "Central banks widely judge under-reacting to inflation as riskier than over-reacting, given how hard entrenched inflation is to reverse.",
        body: "Central bank orthodoxy generally treats acting decisively against rising inflation expectations as less risky than under-reacting, since entrenched inflation expectations are historically far harder and more costly to reverse once established.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 38, agree: 22, well: 23 },
        strengthVotes: { decisive: 11, relevant: 19, tangential: 8 },
      },
    ],
  },
  {
    slug: "nacc-public-hearings-by-default",
    title: "The National Anti-Corruption Commission should hold public hearings by default",
    oneLiner: "The NACC can only hold public hearings in 'exceptional circumstances' — whether that threshold protects reputations fairly or shields serious misconduct from scrutiny.",
    body: "Australia's National Anti-Corruption Commission began operating in 2023 with a high bar for public hearings, requiring 'exceptional circumstances'. Critics argue this mirrors the failures of a similar state-level threshold; the government argues it protects the reputations of the not-yet-charged.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["GOVERNANCE"],
    contextBackground:
      "The National Anti-Corruption Commission began operating in mid-2023 as Australia's first standing federal anti-corruption body, following years of advocacy after several state-level bodies had already been operating for years or decades. Its enabling legislation permits public hearings only where the Commissioner is satisfied 'exceptional circumstances' justify it, a materially higher bar than most state equivalents.\n\nThe threshold was a significant point of negotiation during the bill's passage, with the government arguing it protects individuals who are investigated but never charged from reputational damage, while integrity advocates argued a similar high bar in an earlier state-level integrity body had allowed serious findings to stay largely unexamined by the public.",
    contextDisagreement:
      "Both sides agree public hearings can cause serious reputational harm to people never charged with an offence. The dispute is about which error is worse — occasionally damaging an innocent person's reputation, or systematically under-scrutinising serious public corruption because hearings default to private.",
    timeline: [
      { label: "2018–22", text: "Sustained advocacy and a series of state-level integrity scandals build pressure for a federal anti-corruption body." },
      { label: "2022", text: "Legislation establishing the National Anti-Corruption Commission is introduced and passed with an 'exceptional circumstances' threshold for public hearings." },
      { label: "Jul 2023", text: "The Commission begins operating and receiving referrals." },
      { label: "2024", text: "The Commission declines to hold a public inquiry into a high-profile referred matter, citing the threshold, prompting fresh criticism." },
    ],
    evidence: [
      { type: "Primary document", citation: "National Anti-Corruption Commission Act 2022, s.73" },
    ],
    votes: { total: 58, agree: 35, well: 28 },
    children: [
      {
        title: "Private hearings and findings limit the public accountability function of an anti-corruption body",
        oneLiner: "If the public cannot see the evidence or process, deterrence and public confidence effects are weaker.",
        body: "An anti-corruption body's deterrent and confidence-building effect depends partly on the public being able to see how evidence was tested, which a default-private hearing model structurally limits regardless of the eventual findings.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 34, agree: 22, well: 17 },
        strengthVotes: { decisive: 8, relevant: 18, tangential: 8 },
      },
      {
        title: "A comparable high threshold at state level was widely seen as limiting effective scrutiny",
        oneLiner: "Advocates point to an earlier state integrity body's similar exceptional-circumstances test as a cautionary precedent.",
        body: "Integrity advocates frequently point to an earlier state-level integrity body operating under a similarly high threshold for public examination as a precedent where serious matters received comparatively limited public scrutiny.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 29, agree: 19, well: 15 },
        strengthVotes: { decisive: 16, relevant: 10, tangential: 3 },
      },
      {
        title: "Most people referred to integrity bodies are never ultimately charged with an offence",
        oneLiner: "A public hearing can cause lasting reputational harm even when no adverse finding follows.",
        body: "Data from comparable integrity bodies shows a large majority of individuals referred are never charged with any offence, and advocates for the higher threshold argue a public hearing can cause lasting reputational harm regardless of the eventual outcome.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 31, agree: 16, well: 17 },
        strengthVotes: { decisive: 7, relevant: 16, tangential: 8 },
      },
      {
        title: "The Commissioner retains discretion to hold public hearings when genuinely warranted",
        oneLiner: "The threshold is a bar to clear, not a bar on public hearings occurring at all.",
        body: "The legislation does not prohibit public hearings — it requires the independent Commissioner to be satisfied exceptional circumstances justify one, preserving discretion for genuinely serious matters rather than removing the option entirely.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 20, agree: 10, well: 12 },
        strengthVotes: { decisive: 2, relevant: 7, tangential: 11 },
      },
    ],
  },
  {
    slug: "aukus-submarines-right-defence-investment",
    title: "AUKUS submarines are the right defence investment for Australia",
    oneLiner: "A roughly $368 billion, decades-long program to acquire nuclear-powered submarines — the right response to a changing strategic environment, or an unaffordable bet on a single capability?",
    body: "The 2021 AUKUS pact commits Australia to acquiring nuclear-powered (not nuclear-armed) submarines with US and UK support, at an estimated cost of up to $368 billion over three decades — the largest defence investment in Australian history.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["DEFENCE"],
    contextBackground:
      "The AUKUS security partnership, announced in September 2021, commits Australia to acquiring a fleet of nuclear-powered (though conventionally armed) attack submarines, initially through the purchase of US Virginia-class boats and later through a jointly developed AUKUS-class design built partly in Australia.\n\nGovernment estimates put the total cost of the program at up to $368 billion over three decades, making it the single largest defence acquisition in Australian history. The program replaced an earlier, already-troubled contract for conventionally powered submarines with a French manufacturer, which was cancelled at the time AUKUS was announced.",
    contextDisagreement:
      "Almost all sides accept the regional strategic environment has become more contested. The dispute is over whether submarines specifically, at this cost and on this timeline, are the best use of a large but finite defence budget compared with other capabilities.",
    timeline: [
      { label: "2016", text: "Australia signs a contract with a French manufacturer for conventionally powered submarines." },
      { label: "Sep 2021", text: "The AUKUS pact is announced; the French submarine contract is cancelled." },
      { label: "Mar 2023", text: "Details of the optimal pathway are announced: US Virginia-class boats from the early 2030s, then a new AUKUS-class design." },
      { label: "2023–25", text: "Initial funding and workforce agreements with the United States and United Kingdom are finalised." },
    ],
    evidence: [
      { type: "Official data", citation: "Defence Strategic Review 2023 and government AUKUS cost estimates" },
    ],
    votes: { total: 87, agree: 44, well: 40 },
    children: [
      {
        title: "Nuclear-powered submarines can stay submerged and range far longer than conventional boats",
        oneLiner: "Endurance and stealth advantages are strategically significant given Australia's maritime approaches.",
        body: "Nuclear propulsion allows a submarine to remain submerged and operate at range for far longer than a conventionally powered boat, a capability advantage defence planners argue matters given the size of Australia's maritime approaches.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 51, agree: 35, well: 33 },
        strengthVotes: { decisive: 30, relevant: 15, tangential: 6 },
      },
      {
        title: "The pact deepens interoperability and intelligence-sharing with Australia's closest allies",
        oneLiner: "Beyond the submarines themselves, AUKUS expands joint capability and technology-sharing arrangements.",
        body: "Beyond the submarines, the AUKUS framework expands technology-sharing and joint capability development with the United States and United Kingdom across other advanced defence areas, which proponents argue has strategic value beyond the vessels themselves.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 32, agree: 19, well: 16 },
        strengthVotes: { decisive: 5, relevant: 14, tangential: 13 },
      },
      {
        title: "At up to $368 billion over three decades, the program could crowd out other defence and domestic spending",
        oneLiner: "Critics argue committing this scale of funding to one capability constrains flexibility for decades.",
        body: "At an estimated cost of up to $368 billion over thirty years, critics argue the program locks in a very large, multi-decade funding commitment to a single capability, constraining the flexibility of future defence and broader budget decisions.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 43, agree: 27, well: 28 },
        strengthVotes: { decisive: 13, relevant: 22, tangential: 8 },
      },
      {
        title: "The first Australian-built submarine is not expected until the 2040s, leaving a capability gap",
        oneLiner: "Some strategic analysts question whether the timeline matches the pace of regional military modernisation.",
        body: "Under the announced timeline, Australia will operate ageing Collins-class submarines until at least the early 2030s and will not build its own AUKUS-class boats until the 2040s, which some strategic analysts argue may not match the pace of regional military modernisation.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 36, agree: 21, well: 20 },
        strengthVotes: { decisive: 9, relevant: 18, tangential: 9 },
      },
    ],
  },
  {
    slug: "cap-hecs-indexation-below-cpi",
    title: "HECS-HELP debt indexation should be permanently capped below CPI",
    oneLiner: "After a 2023 spike in indexation added billions to student debts overnight, legislation capped future indexation to the lower of CPI or wage growth — should this become permanent, or does it just delay the real cost?",
    body: "HECS-HELP student debt is indexed annually to inflation. A 2023 inflation spike added an average of over $1,000 to the typical outstanding debt overnight, prompting legislation to cap future indexation to the lower of CPI or the wage price index.",
    type: "PROPOSAL",
    evidenceStrength: "STRONG",
    tags: ["EDUCATION", "TAX"],
    contextBackground:
      "HECS-HELP student loan balances are indexed each year to the Consumer Price Index, intended to preserve the loan's real value rather than charge interest. When inflation spiked in 2022–23, indexation of 7.1% was applied in June 2023, adding an average of over $1,000 to a typical outstanding balance in a single adjustment, drawing significant public attention to how indexation works.\n\nLegislation passed in 2024 capped indexation to the lower of CPI or the Wage Price Index going forward, and applied the change retrospectively to reduce balances as if the cap had been in place for the two highest-indexation years.",
    contextDisagreement:
      "There is little dispute the 2023 spike felt unfair to borrowers whose wages had not kept pace with inflation. The disagreement is about the right long-term design — whether a wage-linked cap is fair to taxpayers who did not take out loans, and whether the debt should be indexed at all versus treated differently.",
    timeline: [
      { label: "1989", text: "The Higher Education Contribution Scheme is introduced with CPI indexation of outstanding balances." },
      { label: "Jun 2023", text: "A 7.1% indexation adjustment, the largest in over a decade, is applied to outstanding HECS-HELP debts." },
      { label: "2024", text: "Legislation caps future indexation to the lower of CPI or the Wage Price Index, applied retrospectively for two prior years." },
    ],
    evidence: [
      { type: "Official data", citation: "Australian Taxation Office HELP indexation figures, 2023–24" },
    ],
    votes: { total: 79, agree: 54, well: 41 },
    children: [
      {
        title: "The 2023 indexation rate exceeded average wage growth, making real debt balances rise",
        oneLiner: "When indexation outpaces wages, a borrower's debt grows faster than their capacity to repay it in real terms.",
        body: "In 2023, the CPI indexation rate applied to HECS-HELP balances exceeded average wage growth for that year, meaning borrowers' debts grew faster in real terms than their income, the opposite of the scheme's original intent to merely preserve real value.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 52, agree: 42, well: 34 },
        strengthVotes: { decisive: 33, relevant: 14, tangential: 5 },
      },
      {
        title: "A wage-linked cap ties debt growth to the same base borrowers actually repay from",
        oneLiner: "Repayments are calculated as a share of income, so linking indexation to wages keeps the two measures consistent.",
        body: "Because compulsory HECS-HELP repayments are calculated as a percentage of income, capping indexation to wage growth keeps the measure used to grow the debt consistent with the measure used to repay it.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 38, agree: 26, well: 20 },
        strengthVotes: { decisive: 10, relevant: 21, tangential: 7 },
      },
      {
        title: "A permanent below-CPI cap means the government progressively absorbs more of the scheme's real cost",
        oneLiner: "If indexation never fully tracks inflation, the gap becomes an ongoing cost to taxpayers rather than borrowers.",
        body: "If indexation is permanently capped below whichever of CPI or wages is higher, the real value of outstanding HELP debt gradually erodes over time, with that shortfall effectively borne by the budget rather than by borrowers.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 30, agree: 15, well: 17 },
        strengthVotes: { decisive: 7, relevant: 16, tangential: 7 },
      },
      {
        title: "The scheme still requires no repayment below an income threshold, unlike commercial debt",
        oneLiner: "HECS-HELP already has borrower protections that commercial loans do not, which some argue reduces the urgency of further concessions.",
        body: "Unlike a commercial loan, HECS-HELP requires no repayment at all below an indexed income threshold and charges no real interest beyond indexation, protections some argue already make the scheme comparatively generous to borrowers.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 23, agree: 11, well: 14 },
        strengthVotes: { decisive: 3, relevant: 8, tangential: 12 },
      },
    ],
  },
  {
    slug: "right-to-disconnect-net-benefit",
    title: "The Right to Disconnect laws are a net benefit for workers",
    oneLiner: "New federal workplace laws let employees refuse unreasonable after-hours contact from employers — a needed boundary in an always-on work culture, or an unenforceable, business-unfriendly overreach?",
    body: "Right to Disconnect provisions, giving employees a legal basis to refuse unreasonable after-hours contact without penalty, took effect for larger employers in 2024 and smaller employers in 2025, as part of a broader industrial relations reform package.",
    type: "PROPOSAL",
    evidenceStrength: "WEAK",
    tags: ["LABOUR"],
    contextBackground:
      "The Right to Disconnect provisions were introduced as part of the second tranche of the federal government's 'Closing Loopholes' industrial relations reforms, giving employees a legal right to refuse to monitor, read or respond to employer contact outside working hours where that refusal is not unreasonable.\n\nThe laws took effect for larger employers in August 2024 and were extended to small businesses in August 2025, following similar 'right to disconnect' style provisions already in place in several European countries. The Fair Work Commission can arbitrate disputes over what counts as 'unreasonable' contact or refusal.",
    contextDisagreement:
      "Most parties accept some employees feel pressure to respond to work contact around the clock. The disagreement is over whether a general legal right, adjudicated case-by-case by the Fair Work Commission, actually changes workplace culture or mainly adds legal uncertainty for employers operating across time zones or on-call arrangements.",
    timeline: [
      { label: "2023", text: "The Closing Loopholes industrial relations reform package is introduced, including right to disconnect provisions in a later tranche." },
      { label: "Aug 2024", text: "Right to disconnect provisions take effect for larger employers." },
      { label: "Aug 2025", text: "The provisions extend to small businesses." },
    ],
    evidence: [
      { type: "Primary document", citation: "Fair Work Legislation Amendment (Closing Loopholes No. 2) Act 2024" },
    ],
    votes: { total: 64, agree: 33, well: 24 },
    children: [
      {
        title: "Surveys report widespread after-hours work contact as a source of stress and reduced recovery time",
        oneLiner: "Workplace wellbeing research consistently links after-hours availability expectations to burnout risk.",
        body: "Workplace wellbeing research has repeatedly linked expectations of after-hours availability to higher reported stress and reduced recovery time, the underlying problem the right to disconnect provisions aim to address.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 34, agree: 22, well: 15 },
        strengthVotes: { decisive: 8, relevant: 18, tangential: 8 },
      },
      {
        title: "The law gives employees a concrete legal basis to refuse contact, rather than relying on informal norms",
        oneLiner: "Formalising the right into law changes the default from 'expected to respond' to 'entitled to refuse'.",
        body: "Before the law, an employee's ability to ignore after-hours contact depended on informal workplace norms and individual negotiating power; the legislation instead sets a formal default that refusal is legitimate unless shown to be unreasonable.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 22, agree: 12, well: 8 },
        strengthVotes: { decisive: 2, relevant: 7, tangential: 13 },
      },
      {
        title: "'Unreasonable' is defined case-by-case, creating uncertainty for employers with genuine after-hours needs",
        oneLiner: "Businesses operating across time zones, on-call rosters or emergency response argue the standard is hard to apply in advance.",
        body: "Because reasonableness is assessed case-by-case by the Fair Work Commission rather than defined by a clear rule, employers with legitimate after-hours needs — across time zones, on-call rosters, or emergency response — argue they cannot know in advance where the line sits.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 29, agree: 14, well: 12 },
        strengthVotes: { decisive: 6, relevant: 15, tangential: 8 },
      },
      {
        title: "Comparable overseas right-to-disconnect laws show mixed evidence of changing actual behaviour",
        oneLiner: "Early evaluations of similar European provisions have found limited measurable change in after-hours contact volume.",
        body: "Early evaluations of similar right-to-disconnect laws introduced in some European countries have found only limited measurable change in the actual volume of after-hours work contact, raising questions about how much the Australian version will shift workplace culture on its own.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 25, agree: 12, well: 13 },
        strengthVotes: { decisive: 3, relevant: 9, tangential: 15 },
      },
    ],
  },
  {
    slug: "end-offshore-processing-asylum-seekers",
    title: "Offshore processing of asylum seekers should end",
    oneLiner: "Whether Australia's offshore processing regime is a necessary deterrent that stopped deaths at sea, or an indefensible human cost that has continued long after boat arrivals largely stopped.",
    body: "Australia has processed asylum seekers who arrive by boat in offshore facilities, primarily on Nauru, since 2001, with a significant expansion from 2012–13. The policy is credited with ending a period of frequent, fatal boat voyages, but has drawn sustained human rights criticism over conditions and prolonged detention.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["IMMIGRATION", "LAW"],
    contextBackground:
      "Australia's offshore processing policy for asylum seekers arriving by boat began in 2001 and was significantly expanded from 2012–13 following a resurgence in dangerous boat voyages, including fatal sinkings. Under the policy, since reinforced by a rule that no one arriving by boat could ever be settled in Australia, people intercepted at sea have been transferred to processing facilities on Nauru or, previously, Manus Island in Papua New Guinea.\n\nBoat arrivals fell sharply and stayed low after the policy's expansion and the accompanying maritime turn-back operations, which the government of the time and successive governments since have credited with ending a period in which hundreds of people died attempting the crossing.",
    contextDisagreement:
      "Both sides generally accept boat arrivals and deaths at sea fell sharply after 2013. The dispute is over causation — how much offshore processing itself, versus maritime turn-backs and other measures, drove that outcome — and over whether the human cost of prolonged offshore detention is justified by the deterrent it may provide.",
    timeline: [
      { label: "2001", text: "Offshore processing is first introduced amid a period of increasing boat arrivals." },
      { label: "2012–13", text: "Offshore processing is significantly expanded following a resurgence in boat arrivals and fatal sinkings." },
      { label: "2013", text: "A policy is introduced ruling out permanent settlement in Australia for anyone arriving by boat." },
      { label: "2014–now", text: "Boat arrivals remain at very low levels; offshore facilities continue to operate with a much smaller caseload." },
    ],
    evidence: [
      { type: "Official data", citation: "Australian Border Force maritime arrival and interception statistics" },
    ],
    votes: { total: 82, agree: 33, well: 38 },
    children: [
      {
        title: "Fatal boat voyages fell sharply and stayed low after the policy's 2013 expansion",
        oneLiner: "Border statistics show a marked and sustained drop in both boat arrivals and deaths at sea from 2013 onward.",
        body: "Official border statistics show both boat arrivals and recorded deaths at sea fell sharply after 2013 and have remained at very low levels since, a trend the policy's supporters point to directly.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 46, agree: 24, well: 27 },
        strengthVotes: { decisive: 12, relevant: 23, tangential: 11 },
      },
      {
        title: "Ending a settled policy risks restarting the conditions that drove people onto dangerous boats",
        oneLiner: "Advocates for the current settings warn removing the deterrent could see smuggling networks and boat departures resume.",
        body: "Some border security analysts argue that unwinding the current deterrent framework risks people-smuggling networks re-establishing routes, given the same underlying push factors that drove departures before 2013 have not disappeared.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 25, agree: 11, well: 10 },
        strengthVotes: { decisive: 3, relevant: 8, tangential: 14 },
      },
      {
        title: "United Nations and human rights bodies have repeatedly found conditions in offshore facilities breach international obligations",
        oneLiner: "Multiple independent reviews have documented serious harm, including to children, from prolonged offshore detention.",
        body: "United Nations human rights bodies and independent reviews have repeatedly found that conditions and the duration of detention in offshore processing facilities caused serious psychological harm, including to children held there, and have found aspects incompatible with international obligations.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 57, agree: 40, well: 42 },
        strengthVotes: { decisive: 37, relevant: 15, tangential: 5 },
      },
      {
        title: "Maritime turn-back operations, not offshore processing itself, may explain most of the fall in arrivals",
        oneLiner: "Some researchers attribute the drop primarily to at-sea turn-backs rather than the offshore facilities.",
        body: "Some border policy researchers argue the sharp fall in arrivals is better explained by maritime turn-back operations intercepting boats before they reached Australian waters at all, rather than by the offshore processing regime itself acting as a deterrent.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 33, agree: 18, well: 19 },
        strengthVotes: { decisive: 9, relevant: 17, tangential: 7 },
      },
    ],
  },
  {
    slug: "raise-jobseeker-to-pension-rate",
    title: "JobSeeker should be raised to at least the age pension rate",
    oneLiner: "The unemployment payment sits well below the pension and below the poverty line — should it be lifted to match, and what would that cost?",
    body: "JobSeeker, Australia's main unemployment payment, pays substantially less than the age pension for a single recipient. An economic inclusion advisory committee has recommended increases in successive federal budgets, citing poverty and workforce participation evidence.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["WELFARE"],
    contextBackground:
      "JobSeeker Payment, Australia's main income support payment for unemployed people, has for years paid a single recipient substantially less than the age pension, despite both being flat-rate payments intended to support a basic standard of living. The gap widened over the 2010s as JobSeeker (then Newstart) was indexed only to inflation while the pension was also indexed to wage benchmarks.\n\nA one-off temporary supplement during the pandemic briefly lifted the effective payment close to the poverty line, and its removal in 2021 renewed sustained advocacy from welfare and economic groups for a permanent increase. A standing economic inclusion advisory committee, established in 2022, has recommended increases in its reports ahead of successive federal budgets, with only partial increases legislated so far.",
    contextDisagreement:
      "There is broad expert agreement JobSeeker sits below commonly used poverty lines. The dispute is about cost and design — how large an increase is fiscally sustainable, and whether a higher flat payment could weaken incentives to move into work relative to a more tapered or activity-linked design.",
    timeline: [
      { label: "1990s–2010s", text: "Newstart/JobSeeker is indexed only to inflation, while the pension is also indexed to wage benchmarks, widening the gap between them." },
      { label: "2020", text: "A temporary pandemic supplement roughly doubles the effective payment for several months." },
      { label: "2021", text: "The supplement is removed; the payment returns to a rate below most poverty line measures." },
      { label: "2022", text: "An Economic Inclusion Advisory Committee is established to report ahead of each federal budget." },
      { label: "2024", text: "A modest increase is legislated, alongside eligibility changes for some recipients, short of matching the pension rate." },
    ],
    evidence: [
      { type: "Research", citation: "Economic Inclusion Advisory Committee report to government, pre-Budget 2024" },
    ],
    votes: { total: 88, agree: 56, well: 42 },
    children: [
      {
        title: "JobSeeker sits well below commonly used poverty line measures for a single adult",
        oneLiner: "Multiple independent analyses place the current rate below half the median household income benchmark.",
        body: "Independent analyses, including from the government's own advisory committee, consistently place the JobSeeker rate for a single adult below commonly used relative poverty line benchmarks.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 58, agree: 44, well: 38 },
        strengthVotes: { decisive: 39, relevant: 14, tangential: 5 },
      },
      {
        title: "A standing advisory committee has recommended increases in successive pre-budget reports",
        oneLiner: "The government's own appointed experts have repeatedly flagged the rate as inadequate.",
        body: "The Economic Inclusion Advisory Committee, established by the government itself, has recommended increasing working-age payments in each of its reports since being established, citing adequacy and poverty evidence.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 44, agree: 32, well: 30 },
        strengthVotes: { decisive: 15, relevant: 22, tangential: 7 },
      },
      {
        title: "A large permanent increase carries an ongoing multi-billion dollar budget cost",
        oneLiner: "Because JobSeeker covers a large number of recipients, even a modest per-person rise compounds into a significant annual expense.",
        body: "Because several hundred thousand people receive JobSeeker at any given time, even a moderate per-person increase compounds into a multi-billion dollar ongoing cost to the federal budget each year.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 39, agree: 20, well: 23 },
        strengthVotes: { decisive: 10, relevant: 20, tangential: 9 },
      },
      {
        title: "Narrowing the gap to the pension rate could reduce the incentive to move from payment into work",
        oneLiner: "Some economists warn a materially higher flat payment could blunt job-search incentives at the margin.",
        body: "Some labour economists caution that substantially narrowing the gap between an unemployment payment and take-home pay from available work could reduce job-search incentives at the margin, even if the current gap is judged too wide on adequacy grounds.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 27, agree: 13, well: 12 },
        strengthVotes: { decisive: 3, relevant: 9, tangential: 15 },
      },
    ],
  },
  {
    slug: "fast-track-environmental-approvals-major-projects",
    title: "Environmental approval processes should be fast-tracked for major projects",
    oneLiner: "A promised overhaul of national environment law aims to cut approval times and create a federal EPA — does streamlining approvals trade away environmental protection, or fix a system that delays good projects along with bad ones?",
    body: "A major independent review found Australia's national environment law fails to prevent extinction and involves approval processes seen as slow and duplicative by industry. Reform proposals since have balanced faster approvals against stronger environmental standards and enforcement.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["ENVIRONMENT", "ECONOMY"],
    contextBackground:
      "A statutory independent review of national environment law, delivered in 2020, found the existing framework was failing to prevent species decline and extinction, while also being widely criticised by industry and state governments as slow, duplicative with state approval processes, and unpredictable for major project proponents.\n\nSubsequent reform efforts have attempted to address both critiques at once — creating a national Environment Protection Agency with stronger enforcement powers and clearer national environmental standards, while also streamlining approval timeframes and reducing duplication between state and federal processes, with the two goals in some tension.",
    contextDisagreement:
      "Nearly everyone agrees the current process is slow and the environmental outcomes it delivers are poor. The dispute is over trade-offs within the reform package — whether faster approval timeframes and reduced duplication with the states come at the expense of the stronger enforcement and standards the same review recommended.",
    timeline: [
      { label: "2020", text: "The statutory independent review of national environment law reports, finding the law fails to prevent extinction." },
      { label: "2022", text: "The government commits to establishing a federal Environment Protection Agency and new national environmental standards." },
      { label: "2023–24", text: "Reform legislation is developed and partly introduced, with elements delayed amid industry and state negotiation." },
      { label: "2025", text: "Further negotiation continues over the balance between approval speed and stronger environmental standards." },
    ],
    evidence: [
      { type: "Research", citation: "Independent Review of the EPBC Act, final report, 2020" },
    ],
    votes: { total: 71, agree: 34, well: 30 },
    children: [
      {
        title: "The independent statutory review found current approval processes are slow, duplicative and unpredictable",
        oneLiner: "The review that triggered these reforms explicitly criticised process delay and duplication as a real problem, not just an industry complaint.",
        body: "The 2020 independent statutory review itself found significant duplication between state and federal approval processes and highlighted unpredictable timeframes as a genuine problem, not merely an industry perception.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 38, agree: 22, well: 19 },
        strengthVotes: { decisive: 9, relevant: 20, tangential: 9 },
      },
      {
        title: "Approval delay applies equally to renewable energy and housing projects, not just resource extraction",
        oneLiner: "Slow processes are cited as a barrier to the energy transition and housing supply, not only to mining approvals.",
        body: "Renewable energy developers and housing proponents have both separately cited slow, duplicative environmental approval processes as a barrier to project delivery, meaning faster processes could also support projects the government otherwise wants to accelerate.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 27, agree: 15, well: 12 },
        strengthVotes: { decisive: 4, relevant: 11, tangential: 12 },
      },
      {
        title: "The same review found the law is failing to prevent species decline and extinction",
        oneLiner: "The review's headline finding was about environmental failure, not process delay — a case for stronger standards, not faster approvals.",
        body: "The independent review's central and most widely cited finding was that the existing law is failing at its core purpose of preventing species decline and extinction, which environment groups argue means the priority should be stronger standards and enforcement, not faster approval timeframes.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 44, agree: 27, well: 29 },
        strengthVotes: { decisive: 25, relevant: 15, tangential: 4 },
      },
      {
        title: "Faster timeframes without stronger enforcement could increase approvals of environmentally damaging projects",
        oneLiner: "Speed and rigour can trade off against each other if not deliberately designed to avoid it.",
        body: "Environmental groups argue that unless matched with genuinely stronger standards and enforcement capacity, simply shortening approval timeframes risks increasing the rate at which environmentally damaging projects are approved rather than improving outcomes.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 33, agree: 17, well: 18 },
        strengthVotes: { decisive: 8, relevant: 17, tangential: 8 },
      },
    ],
  },
];

// --- three claims prototyped from live polling and news, July 2026 -------
// Sourced from Newspoll, Resolve, Essential Report and current reporting.
// Framed as neutral, arguable propositions per the design decision to
// reframe rather than mirror poll wording, and kept at policy level rather
// than commentary on any named individual's remarks.

const newsDebates: DebateDef[] = [
  {
    slug: "antisemitism-hate-extremism-bill-should-pass-as-is",
    title: "The Combatting Antisemitism, Hate and Extremism Bill 2026 should pass in its current form",
    oneLiner: "Introduced after the Bondi Beach attack, the bill is before a parliamentary committee — whether it strikes the right balance between counter-extremism powers and civil liberties, or needs amendment first.",
    body: "The bill responds directly to the deadliest antisemitic attack in Australian history. Legal and civil society groups broadly support its aims but have raised concerns about the breadth of some of its definitions and offences.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["LAW", "GOVERNANCE"],
    contextBackground:
      "On 14 December 2025, an Islamic State-inspired terrorist attack on a Hanukkah celebration at Bondi Beach killed 15 people. The federal government established the Royal Commission on Antisemitism and Social Cohesion three weeks later, and introduced the Combatting Antisemitism, Hate and Extremism Bill 2026 as a parallel legislative response.\n\nThe Royal Commission's interim report, tabled in Parliament on 30 April 2026, made 14 recommendations to strengthen counter-terrorism responses. The Commission itself is still sitting — its sixth public hearing block runs 28–31 July 2026 in Sydney — with a final report not due until December 2026, meaning the bill is being considered before the inquiry that partly prompted it has concluded.",
    contextDisagreement:
      "Almost no one disputes that the Bondi Beach attack demanded a strengthened response. The disagreement is about specifics: whether the bill's hate and extremism offences are drawn narrowly enough to avoid catching legitimate protest and political speech, and whether legislating now pre-empts findings the Royal Commission hasn't yet delivered.",
    timeline: [
      { label: "14 Dec 2025", text: "A terrorist attack on a Hanukkah celebration at Bondi Beach kills 15 people." },
      { label: "9 Jan 2026", text: "The Royal Commission on Antisemitism and Social Cohesion is established." },
      { label: "30 Apr 2026", text: "The Commission's interim report, with 14 recommendations, is tabled in Parliament." },
      { label: "2026", text: "The Combatting Antisemitism, Hate and Extremism Bill 2026 is introduced and referred to a parliamentary joint committee." },
      { label: "28–31 Jul 2026", text: "The Royal Commission holds its sixth public hearing block, in Sydney." },
    ],
    evidence: [
      { type: "Submission", citation: "Law Council of Australia, submission on the Combatting Antisemitism, Hate and Extremism Bill 2026", url: "https://lawcouncil.au/resources/submissions/combatting-antisemitism-hate-and-extremism-bill-2026-cth" },
      { type: "Official data", citation: "Royal Commission on Antisemitism and Social Cohesion — background and interim report", url: "https://en.wikipedia.org/wiki/Royal_Commission_on_Antisemitism_and_Social_Cohesion" },
    ],
    votes: { total: 52, agree: 24, well: 26 },
    children: [
      {
        title: "A mass-casualty, ideologically-motivated attack on a place of worship is exactly the case new hate and extremism powers are meant to address",
        oneLiner: "The Bondi Beach attack is the precipitating event the bill responds to.",
        body: "The bill was drafted in direct response to an attack that killed 15 people at a religious gathering, which supporters argue is squarely the kind of ideologically-motivated mass-casualty violence that justifies new, purpose-built offences rather than relying on existing law.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 34, agree: 24, well: 21 },
        strengthVotes: { decisive: 20, relevant: 10, tangential: 4 },
      },
      {
        title: "The Royal Commission's own interim report recommended strengthening counter-terrorism responses",
        oneLiner: "The body examining the attack has already endorsed a stronger legislative response, even ahead of its final report.",
        body: "The Commission's interim report, tabled in April 2026, made 14 recommendations to strengthen counter-terrorism responses — an indication from the inquiry itself, before its final report, that the current settings needed reinforcement.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 29, agree: 21, well: 20 },
        strengthVotes: { decisive: 9, relevant: 16, tangential: 6 },
      },
      {
        title: "Antisemitism and Islamophobia share common underlying drivers, so a combined bill addresses both",
        oneLiner: "Australia's Special Envoy to Combat Islamophobia has argued the two forms of prejudice reinforce each other and warrant a shared response.",
        body: "Submissions to the Royal Commission, including from the Special Envoy to Combat Islamophobia, argue antisemitism and Islamophobia share common underlying drivers and that addressing hate and extremism together, rather than issue by issue, is more coherent.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 21, agree: 14, well: 12 },
        strengthVotes: { decisive: 3, relevant: 9, tangential: 12 },
      },
      {
        title: "Broadly worded hate and extremism offences risk catching legitimate protest and political speech",
        oneLiner: "Legal bodies reviewing the bill have raised proportionality and rule-of-law concerns about how some offences are drafted.",
        body: "Submissions from legal bodies reviewing the bill have raised concerns that some offence definitions are broad enough to potentially capture legitimate protest and political advocacy, not just the targeted violent extremism the bill is aimed at.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 31, agree: 19, well: 22 },
        strengthVotes: { decisive: 17, relevant: 11, tangential: 6 },
      },
      {
        title: "The Royal Commission hasn't finished its inquiry, and legislating now pre-empts findings it hasn't delivered yet",
        oneLiner: "The Commission's final report isn't due until December 2026 — after the bill is already before Parliament.",
        body: "The Commission was still holding public hearings as of late July 2026 and is not due to deliver its final report until December 2026, meaning Parliament is being asked to legislate before the inquiry that partly motivated the bill has reached its own conclusions.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 26, agree: 15, well: 17 },
        strengthVotes: { decisive: 8, relevant: 14, tangential: 6 },
      },
      {
        title: "The bill's definition of extremism is broader than in comparable countries' laws",
        oneLiner: "Comparative analysis by some legal submissions flags Australia's proposed definition as unusually wide.",
        body: "Some submissions comparing the bill to counter-extremism law in similar jurisdictions argue its definition of extremism is drawn more broadly than comparable overseas models, raising vagueness concerns about how it would be applied in practice.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 18, agree: 9, well: 10 },
        strengthVotes: { decisive: 2, relevant: 7, tangential: 11 },
      },
    ],
  },
  {
    slug: "one-nation-polling-surge-is-genuine-realignment",
    title: "One Nation's rise to equal-first in national polling reflects a genuine realignment, not protest-vote volatility",
    oneLiner: "Three separate pollsters now put One Nation level with or ahead of a major party for the first time — whether that marks a durable shift in the party system or a temporary protest vote.",
    body: "Newspoll, Resolve and other pollsters have each shown One Nation reaching around 29–30% primary vote through July 2026, level with Labor and well clear of the Coalition. The party has surged before major elections and receded afterward.",
    type: "OPINION",
    evidenceStrength: "MODERATE",
    tags: ["ELECTIONS", "POLITICS"],
    contextBackground:
      "A national Newspoll conducted 21–24 July 2026 put One Nation on a 30% primary vote, level with Labor, with the Coalition on 19% and the Greens on 12%. The Resolve Political Monitor independently showed a similar pattern, with One Nation at 29% and Pauline Hanson's preferred prime minister rating rising to 25% even as Anthony Albanese extended his own lead to 33%.\n\nIt is the first time in the current polling cycle that multiple independent pollsters have shown One Nation level with or ahead of a major party simultaneously, rather than a single outlier poll. Analysts have linked the movement to sustained cost-of-living pressure and dissatisfaction with both major parties.",
    contextDisagreement:
      "Both sides accept the polling movement itself is real and unusually large. The disagreement is about durability: whether it reflects a lasting realignment in the party system, or a protest vote that — as with One Nation's past surges — recedes once a campaign puts the party under sustained scrutiny.",
    timeline: [
      { label: "2025", text: "One Nation's primary vote begins climbing in aggregated polling amid sustained cost-of-living pressure." },
      { label: "Jul 2026", text: "Newspoll shows One Nation level with Labor at 30% primary vote each, with the Coalition at 19%." },
      { label: "Jul 2026", text: "The Resolve Political Monitor independently shows a similar pattern, with Hanson's preferred PM rating also rising." },
    ],
    evidence: [
      { type: "Official data", citation: "Newspoll, 21–24 July 2026, reported via The Poll Bludger", url: "https://www.pollbludger.net/2026/07/19/newspoll-labor-30-one-nation-30-coalition-19-open-thread/" },
      { type: "Reporting", citation: "The New Daily, \"As One Nation rebounds, a warning to read with care\", 20 July 2026", url: "https://www.thenewdaily.com.au/news/politics/australian-politics/2026/07/20/australian-politics-polls" },
    ],
    votes: { total: 61, agree: 27, well: 29 },
    children: [
      {
        title: "Multiple independent pollsters are now showing the same movement, not just one outlier poll",
        oneLiner: "Newspoll and Resolve, run by different organisations with different methodologies, agree on the broad shape of the shift.",
        body: "Newspoll and the Resolve Political Monitor are conducted independently, using different methodologies and sample frames, yet both show One Nation reaching a similar level in the same month — evidence the movement isn't an artifact of one pollster's house effect.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "SUPPORTS",
        statedStrength: "DECISIVE",
        votes: { total: 38, agree: 29, well: 27 },
        strengthVotes: { decisive: 24, relevant: 11, tangential: 5 },
      },
      {
        title: "Cost-of-living dissatisfaction with both major parties has been building for years, giving a protest option time to consolidate",
        oneLiner: "Sustained economic pressure, rather than a single event, is the more likely explanation for a durable shift.",
        body: "Unlike a short-lived reaction to a single news cycle, cost-of-living pressure has built steadily for several years, which analysts argue gives a minor party more time to consolidate support into something more durable than a fleeting protest vote.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 27, agree: 18, well: 15 },
        strengthVotes: { decisive: 7, relevant: 15, tangential: 8 },
      },
      {
        title: "One Nation's primary vote has spiked before major elections and receded afterward",
        oneLiner: "The party has a documented history of pre-election surges in polling that don't fully translate into sustained support.",
        body: "One Nation's support has spiked in opinion polling ahead of previous federal and state elections before receding once results were in and sustained media scrutiny of the party's candidates and policies had run its course.",
        type: "FACT",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 33, agree: 20, well: 22 },
        strengthVotes: { decisive: 19, relevant: 10, tangential: 4 },
      },
      {
        title: "Preferred prime minister figures still show Albanese well clear, suggesting the primary vote shift hasn't converted into a genuine alternative-government preference",
        oneLiner: "Voters moving to One Nation on primary vote are not simultaneously naming Hanson as their preferred PM at anything like the same rate.",
        body: "Newspoll's three-way preferred prime minister measure still has Albanese at 46%, more than ten points clear of Hanson, even as the primary vote race has tightened — a gap that suggests much of the movement is a protest signal rather than a vote for an alternative government.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 30, agree: 17, well: 20 },
        strengthVotes: { decisive: 12, relevant: 14, tangential: 6 },
      },
      {
        title: "Compulsory preferential voting means minor-party primary support doesn't convert directly into seats",
        oneLiner: "Unlike first-past-the-post systems, a high primary vote for a third party doesn't mechanically translate into proportional representation.",
        body: "Australia's compulsory preferential voting system means a party polling level with Labor on primary vote can still win very few seats once preferences are distributed, unlike in first-past-the-post systems where the same primary share would be far more consequential.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 20, agree: 10, well: 13 },
        strengthVotes: { decisive: 3, relevant: 7, tangential: 12 },
      },
    ],
  },
  {
    slug: "abortion-access-after-20-weeks-should-require-additional-grounds",
    title: "Abortion access after 20 weeks should require additional legal grounds",
    oneLiner: "Recent bills in South Australia, New South Wales and Queensland sought to tighten late-term abortion access — whether extra legal safeguards are warranted at this stage of pregnancy, or decisions should stay with patients and doctors.",
    body: "A cluster of state bills in mid-2026 tried to restrict abortion access later in pregnancy or around specific circumstances. South Australia's bill was defeated in the elected lower house by a wide margin after passing the upper house.",
    type: "PROPOSAL",
    evidenceStrength: "MODERATE",
    tags: ["HEALTH", "LAW"],
    contextBackground:
      "In mid-2026, a cluster of state-level bills put abortion access back in the spotlight. In South Australia, a bill to remove mental health grounds for accessing abortion after 24 weeks and 6 days (except where the pregnant person's life was at risk) passed the upper house 10–9 on 17 June 2026, but was defeated in the elected House of Assembly by a wide 36–9 margin the same day. In New South Wales, a bill sought to ban abortions performed for the purpose of sex selection, with criminal penalties for healthcare providers. In Queensland, a disallowance motion targeted regulations governing abortion medication.\n\nMedical professionals, including Australia's college of obstetricians and gynaecologists, have emphasised that abortions after 23 weeks are rare and typically involve complex or serious medical circumstances.",
    contextDisagreement:
      "Both sides broadly accept that later abortions are rare and often occur in difficult medical circumstances. The disagreement is over instrument: whether an additional legal threshold at a defined gestational point adds a meaningful safeguard, or simply adds delay and legal risk for people and clinicians already dealing with a difficult situation.",
    timeline: [
      { label: "2 Jun 2026", text: "A South Australian bill to restrict abortion access after 24 weeks and 6 days is reintroduced in the upper house." },
      { label: "3 Jun 2026", text: "A New South Wales bill to ban sex-selection abortion, with criminal penalties for providers, is debated." },
      { label: "17 Jun 2026", text: "The South Australian bill passes the upper house 10–9, then is defeated in the House of Assembly 36–9." },
      { label: "2026", text: "A Queensland disallowance motion targets regulations governing abortion medication." },
    ],
    evidence: [
      { type: "Reporting", citation: "RANZCOG, \"Abortion Access Under Attack Again in Two Australian States\"", url: "https://ranzcog.edu.au/news/abortion-access-under-attack-again-in-two-australian-states/" },
      { type: "Reporting", citation: "Pedestrian.tv, \"QLD, NSW, SA: What The Hell Is Going On With Abortion Rights In Australia Right Now?\"", url: "https://www.pedestrian.tv/health/abortion-rights-australia-queensland-sa-nsw-2026/" },
    ],
    votes: { total: 68, agree: 22, well: 29 },
    children: [
      {
        title: "Late-term decisions warrant the same seriousness the law gives other major medical decisions at that stage of pregnancy",
        oneLiner: "A defined legal threshold treats a consequential, late-stage decision with a formality proponents argue matches its weight.",
        body: "Proponents argue that as a pregnancy progresses, the decision to terminate becomes more consequential, and that the law formally recognising that shift is consistent with how other serious, late-stage medical decisions are already treated.",
        type: "VALUE",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        votes: { total: 28, agree: 14, well: 12 },
        strengthVotes: { decisive: 6, relevant: 15, tangential: 7 },
      },
      {
        title: "A defined legal threshold gives clarity to patients and clinicians about when additional review applies",
        oneLiner: "Supporters argue a bright-line rule is easier to apply consistently than case-by-case clinical discretion alone.",
        body: "Supporters of an added threshold argue a clear, defined point in gestation is easier for both patients and treating clinicians to apply consistently than relying solely on open-ended clinical judgement.",
        type: "OPINION",
        evidenceStrength: "WEAK",
        relation: "SUPPORTS",
        statedStrength: "TANGENTIAL",
        votes: { total: 19, agree: 9, well: 8 },
        strengthVotes: { decisive: 2, relevant: 7, tangential: 12 },
      },
      {
        title: "Abortions after 23 weeks are rare and almost always involve serious medical complications the current law already accounts for",
        oneLiner: "Australia's college of obstetricians and gynaecologists says later abortions typically follow diagnoses like fatal fetal anomalies or serious risk to the pregnant person.",
        body: "Medical professionals note that abortions after 23 weeks' gestation are very rare and typically follow a serious diagnosis — such as a fatal fetal anomaly or a serious risk to the pregnant person's health — that existing law and clinical practice already address without an added legal threshold.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "DECISIVE",
        votes: { total: 42, agree: 30, well: 33 },
        strengthVotes: { decisive: 27, relevant: 12, tangential: 6 },
      },
      {
        title: "South Australia's bill was emphatically rejected by the elected lower house, 36 votes to 9",
        oneLiner: "The chamber directly accountable to voters defeated the bill by a wide margin, even after it passed the upper house.",
        body: "Despite passing South Australia's upper house 10–9, the bill was defeated in the House of Assembly — the chamber whose members are directly elected by and accountable to constituents — by a wide 36–9 margin, a result proponents of the existing law point to as reflecting where public and parliamentary opinion actually sits.",
        type: "FACT",
        evidenceStrength: "STRONG",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 31, agree: 21, well: 24 },
        strengthVotes: { decisive: 14, relevant: 14, tangential: 5 },
      },
      {
        title: "Medical colleges argue these decisions should rest on clinical judgement, not a fixed legal test",
        oneLiner: "Professional medical bodies have opposed replacing case-by-case clinical assessment with a rigid legal threshold.",
        body: "Professional medical bodies have argued that late-stage abortion decisions involve complex, individual medical circumstances best assessed case by case by treating clinicians, and that a fixed legal test risks forcing a one-size-fits-all rule onto genuinely varied situations.",
        type: "OPINION",
        evidenceStrength: "MODERATE",
        relation: "CONTRADICTS",
        statedStrength: "RELEVANT",
        votes: { total: 25, agree: 16, well: 18 },
        strengthVotes: { decisive: 9, relevant: 13, tangential: 5 },
      },
    ],
  },
];

// --- cross-debate connections ---------------------------------------------
// Two explicit connections whose fromClaim was seeded inside one debate and
// whose toClaim is the root of a different debate, so at least one claim
// page shows upward rows visibly marked "another debate".

async function seedCrossLinks(ids: Record<string, Record<string, string>>) {
  const housingSupplyClaim = ids["reduce-net-overseas-migration"]["Population growth from migration has outpaced new housing supply in major cities"];
  const negativeGearingRoot = ids["phase-out-negative-gearing"]?.__root;
  const firmedRenewablesClaim = ids["legalise-nuclear-power-in-australia"]["Firmed renewables can now reliably meet demand at a lower cost than new nuclear"];
  const gasReservationRoot = ids["reserve-gas-for-domestic-market"]?.__root;

  if (housingSupplyClaim && negativeGearingRoot) {
    await prisma.connection.create({
      data: {
        fromClaimId: housingSupplyClaim,
        toClaimId: negativeGearingRoot,
        relation: "SUPPORTS",
        statedStrength: "RELEVANT",
        statedReason: "Housing supply pressure from migration is part of the same affordability picture as investor demand.",
        strengthVotes: { create: strengthVoteRows({ decisive: 6, relevant: 14, tangential: 9 }, nextSeed()) },
        revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Cross-debate connection", snapshot: {}, pending: false } },
      },
    });
  }

  if (firmedRenewablesClaim && gasReservationRoot) {
    await prisma.connection.create({
      data: {
        fromClaimId: firmedRenewablesClaim,
        toClaimId: gasReservationRoot,
        relation: "CONTRADICTS",
        statedStrength: "TANGENTIAL",
        statedReason: "If renewables reduce reliance on gas generation, the case for reserving domestic gas supply weakens somewhat.",
        strengthVotes: { create: strengthVoteRows({ decisive: 3, relevant: 10, tangential: 15 }, nextSeed()) },
        revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Cross-debate connection", snapshot: {}, pending: false } },
      },
    });
  }
}

async function main() {
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

  console.log("Seeding flagship reference debate...");
  const flagship = await seedDebate(platformLiability);
  const amplificationId = flagship.childIds["Amplification of harmful content is a deliberate product decision"];

  const rankedFeeds = await prisma.claim.create({
    data: {
      slug: slugify(rankedFeedsDuties.title),
      ...rankedFeedsDuties,
      contextBackground: rankedFeedsDuties.body,
      contextDisagreement: "The disagreement is about how far duties can go without amounting to the liability regime this narrower proposal was meant to avoid.",
      votes: { create: claimVoteRows(41, 28, 26, nextSeed()) },
      revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial claim", snapshot: {}, pending: false } },
    },
  });
  const conduit = await prisma.claim.create({
    data: {
      slug: slugify(conduitClaim.title),
      ...conduitClaim,
      contextBackground: conduitClaim.body,
      contextDisagreement: "Debated in the democracy and platform-regulation literature as the main alternative frame to editorial responsibility.",
      votes: { create: claimVoteRows(63, 28, 34, nextSeed()) },
      revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial claim", snapshot: {}, pending: false } },
    },
  });
  const rhetoric = await prisma.claim.create({
    data: {
      slug: slugify(rhetoricClaim.title),
      ...rhetoricClaim,
      contextBackground: rhetoricClaim.body,
      contextDisagreement: "Rhetoric researchers differ on how much of this effect is platform-specific versus a general feature of emotionally charged communication.",
      votes: { create: claimVoteRows(39, 31, 30, nextSeed()) },
      revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial claim", snapshot: {}, pending: false } },
    },
  });

  await prisma.connection.create({
    data: {
      fromClaimId: amplificationId,
      toClaimId: rankedFeeds.id,
      relation: "SUPPORTS",
      statedStrength: "RELEVANT",
      statedReason: "A narrower proposal about duties rather than liability.",
      strengthVotes: { create: strengthVoteRows({ decisive: 7, relevant: 26, tangential: 14 }, nextSeed()) },
      revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial connection", snapshot: {}, pending: false } },
    },
  });
  await prisma.connection.create({
    data: {
      fromClaimId: amplificationId,
      toClaimId: conduit.id,
      relation: "CONTRADICTS",
      statedStrength: "RELEVANT",
      statedReason: "A claim from a different debate that this one cuts against.",
      strengthVotes: { create: strengthVoteRows({ decisive: 9, relevant: 31, tangential: 18 }, nextSeed()) },
      revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial connection", snapshot: {}, pending: false } },
    },
  });
  await prisma.connection.create({
    data: {
      fromClaimId: amplificationId,
      toClaimId: rhetoric.id,
      relation: "SUPPORTS",
      statedStrength: "TANGENTIAL",
      statedReason: "Cited from the rhetoric debate; related in subject matter but tangential here.",
      strengthVotes: { create: strengthVoteRows({ decisive: 22, relevant: 11, tangential: 4 }, nextSeed()) },
      revisions: { create: { authorId: "seed", authorName: "Seed data", summary: "Initial connection", snapshot: {}, pending: false } },
    },
  });

  console.log("Seeding 20 Australian political debates...");
  const idMap: Record<string, Record<string, string>> = {};
  for (const debate of auDebates) {
    const { rootId, childIds } = await seedDebate(debate);
    idMap[debate.slug] = { ...childIds, __root: rootId };
    console.log(`  seeded: ${debate.title}`);
  }

  console.log("Seeding cross-debate connections...");
  await seedCrossLinks(idMap);

  console.log("Seeding claims prototyped from live polling and news...");
  for (const debate of newsDebates) {
    await seedDebate(debate);
    console.log(`  seeded: ${debate.title}`);
  }

  const totalClaims = await prisma.claim.count();
  const totalConnections = await prisma.connection.count();
  console.log(`Done. ${totalClaims} claims, ${totalConnections} connections.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
