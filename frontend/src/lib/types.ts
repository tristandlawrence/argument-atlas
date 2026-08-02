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

export type ConnectionRow = {
  connectionId: string;
  relation: ConnectionRelation;
  statedStrength: ConnectionStrength;
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
  contestedAt: string | null;
};
