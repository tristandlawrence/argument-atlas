import { quadrantOf, showTurnsOn, type ClaimListItem } from "./types";

/**
 * Recommended slices: pre-canned filter views for the homepage. Each one is
 * derived from a principle in requirements.md, named in `why`, and links to
 * the claims browser with the matching filters so a reader can widen it.
 */
export type Slice = {
  key: string;
  title: string;
  blurb: string;
  why: string;
  params: Record<string, string>;
  test: (c: ClaimListItem) => boolean;
};

export const SLICES: Slice[] = [
  {
    key: "live-debates",
    title: "Contentious proposals",
    blurb: "Debates with a confident live question: the claim editors say they currently turn on, rated by enough people to trust.",
    why: "Debate lifecycle: where the argument sits now, not its history.",
    params: { status: "ROOT,CONTENTIOUS", view: "cards" },
    test: (c) => c.isRoot && showTurnsOn(c),
  },
  {
    key: "turning-points",
    title: "The questions themselves",
    blurb: "The claims each debate turns on. Argue here and you argue the whole debate.",
    why: "The crux is a claim, not a paragraph.",
    params: { status: "TURNING", view: "cards" },
    test: (c) => c.isTurningPoint,
  },
  {
    key: "steelmen",
    title: "Well made, unpersuasive",
    blurb: "Claims most raters judge well argued but do not agree with. The other side at its best.",
    why: "The Steelman quadrant is the one the requirements call uniquely valuable.",
    params: { quadrant: "STEELMAN" },
    test: (c) => quadrantOf(c) === "STEELMAN",
  },
  {
    key: "needs-evidence",
    title: "Facts that need sources",
    blurb: "Factual claims with weak or no evidence attached. An invitation, not a verdict.",
    why: "Evidence discipline: a Fact with no evidence is expected to acquire some.",
    params: { type: "FACT", evidence: "NONE,WEAK" },
    test: (c) => c.type === "FACT" && (c.evidenceStrength === "NONE" || c.evidenceStrength === "WEAK"),
  },
  {
    key: "not-yet-rated",
    title: "Nobody has rated these",
    blurb: "Claims with no votes at all. The fastest way to make a difference to the data.",
    why: "Rating comes after reading; unrated claims are where reading is still needed.",
    params: { status: "UNRATED" },
    test: (c) => c.raterCount === 0,
  },
  {
    key: "load-bearing",
    title: "Load-bearing claims",
    blurb: "Claims used in more than one place. If one of these falls, several debates move.",
    why: "Where this claim is used: exposure made legible.",
    params: { status: "CROSS" },
    test: (c) => c.usedInCount >= 2,
  },
  {
    key: "competing-proposals",
    title: "Proposals inside debates",
    blurb: "Specific things someone proposes doing, argued beneath a larger question.",
    why: "Alternatives are a lens in the coverage rubric; competing proposals are how a generic proposal gets concrete.",
    params: { type: "PROPOSAL", status: "ARGUMENT" },
    test: (c) => c.type === "PROPOSAL" && !c.isRoot,
  },
  {
    key: "values",
    title: "What people hold regardless",
    blurb: "Value claims: positions evidence cannot settle, where disagreement is not error.",
    why: "Values are a lens in the coverage rubric and the type most often missing.",
    params: { type: "VALUE" },
    test: (c) => c.type === "VALUE",
  },
  {
    key: "contested",
    title: "Contested right now",
    blurb: "Claims in contested status after edit wars or flags. Reading and rating stay open.",
    why: "Contested status is public by design.",
    params: { status: "CONTESTED" },
    test: (c) => !!c.contestedAt,
  },
];
