export type ClaimType = "FACT" | "OPINION" | "VALUE" | "PROPOSAL";
export type EvidenceStrength = "NONE" | "WEAK" | "MODERATE" | "STRONG";
export type ConnectionRelation = "SUPPORTS" | "CONTRADICTS";
export type ConnectionStrength = "TANGENTIAL" | "RELEVANT" | "DECISIVE";

export type VoteStats = {
  raterCount: number;
  agreePct: number | null;
  wellConstructedPct: number | null;
  scatter: { left: number; top: number }[];
};

export type OwnArgument = {
  relation: ConnectionRelation;
  label: "FOR" | "AGAINST";
  text: string;
  weight: number;
  opacity: number;
};

export type ClaimSummary = {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  body: string;
  type: ClaimType;
  evidenceStrength: EvidenceStrength;
  tags: string[];
  raterCount: number;
  agreePct: number | null;
  wellConstructedPct: number | null;
  scatter: { left: number; top: number }[];
  ownArguments: OwnArgument[];
};

export type StrengthDistributionEntry = {
  value: ConnectionStrength;
  label: string;
  count: number;
  pct: number | null;
  weight: number;
};

export type ChallengeKind = "NOT_RELEVANT" | "WRONG_DIRECTION";

export type ChallengeCounts = { notRelevant: number; wrongDirection: number; total: number };

export type VoiceStance = "SUPPORTS" | "CONTRADICTS" | "MIXED";

export type Voice = {
  id: string;
  title: string;
  outlet: string;
  author: string | null;
  url: string;
  kind: string;
  stance: VoiceStance;
  raterCount: number;
  agreePct: number | null;
  wellConstructedPct: number | null;
  plot: { left: number; top: number } | null;
};

export type ConnectionRow = {
  connectionId: string;
  relation: ConnectionRelation;
  statedStrength: ConnectionStrength;
  /** Dated editorial mark: where the parent debate currently turns. Null when not marked. */
  contentious: { asOf: string; label: string; reviewDue: boolean } | null;
  challenges: ChallengeCounts;
  weight: number;
  opacity: number;
  otherClaim: { id: string; slug: string; title: string };
  crossDebate?: boolean;
  contextLabel?: string;
  raterCount?: number;
  claimItself: ClaimSummary;
  relationSentence: string;
  strengthDistribution: StrengthDistributionEntry[];
  strengthDefinitions: { decisive: string; relevant: string; tangential: string };
};

export type Revision = {
  id: string;
  authorName: string;
  summary: string;
  pending: boolean;
  createdAt: string;
  snapshot: Record<string, unknown>;
};

export type ClaimDetail = {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  body: string;
  type: ClaimType;
  evidenceStrength: EvidenceStrength;
  tags: string[];
  contextBackground: string;
  contextDisagreement: string;
  contested: { reason: string; since: string; until: string } | null;
  ageLabel: string;
  timeline: { label: string; text: string }[];
  evidenceItems: { id: string; type: string; citation: string; url: string | null }[];
  stats: {
    revisionCount: number;
    revisionAuthorCount: number;
    connectionCount: number;
    evidenceCount: number;
    crossDebateUsedInCount: number;
  };
  votes: VoteStats;
  voices: Voice[];
  usedIn: ConnectionRow[];
  supports: ConnectionRow[];
  contradicts: ConnectionRow[];
  revisions: Revision[];
};

export type ClaimListItem = {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  type: ClaimType;
  tags: string[];
  evidenceStrength: EvidenceStrength;
  contestedAt: string | null;
  createdAt: string;
  raterCount: number;
  agreePct: number | null;
  wellConstructedPct: number | null;
  supportsCount: number;
  contradictsCount: number;
  usedInCount: number;
  voiceCount: number;
  isRoot: boolean;
  /** This claim is itself the marked question beneath some parent. */
  isTurningPoint: boolean;
  /** The child connection currently marked contentious, if any. */
  turnsOn: { slug: string; title: string; raterCount: number; reviewDue: boolean } | null;
};

/**
 * Whether a debate's "turns on" line is confident enough to show in lists.
 * Phase 0 heuristic: the mark is current and the question has a few raters.
 * Phase 2 replaces this with the derived contentious signal.
 */
export const TURNS_ON_MIN_RATERS = 5;
export function showTurnsOn(c: ClaimListItem) {
  return !!c.turnsOn && !c.turnsOn.reviewDue && c.turnsOn.raterCount >= TURNS_ON_MIN_RATERS;
}

export type Quadrant = "COMPELLING" | "STEELMAN" | "PARTISAN" | "WEAK" | "UNRATED";

export function quadrantOf(c: { raterCount: number; agreePct: number | null; wellConstructedPct: number | null }): Quadrant {
  if (!c.raterCount || c.agreePct === null || c.wellConstructedPct === null) return "UNRATED";
  const a = c.agreePct >= 50;
  const w = c.wellConstructedPct >= 50;
  return a && w ? "COMPELLING" : !a && w ? "STEELMAN" : a && !w ? "PARTISAN" : "WEAK";
}

export type GraphNode = {
  id: string;
  slug: string;
  title: string;
  type: ClaimType;
  tags: string[];
  raterCount: number;
  arguedByCount: number;
  usedInCount: number;
  isRoot: boolean;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: ConnectionRelation;
  strength: ConnectionStrength;
  contentious: boolean;
};

export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };
