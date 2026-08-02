const STRENGTH_WEIGHT: Record<string, number> = { DECISIVE: 7, RELEVANT: 4, TANGENTIAL: 2 };
const STRENGTH_OPACITY: Record<string, number> = { DECISIVE: 1, RELEVANT: 0.65, TANGENTIAL: 0.4 };
const STRENGTH_ORDER = ["DECISIVE", "RELEVANT", "TANGENTIAL"] as const;
const STRENGTH_RANK: Record<string, number> = { DECISIVE: 0, RELEVANT: 1, TANGENTIAL: 2 };

export function strengthMark(strength: string) {
  return { weight: STRENGTH_WEIGHT[strength] ?? 2, opacity: STRENGTH_OPACITY[strength] ?? 0.4 };
}

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : null;
}

type ClaimVoteLike = { id: string; agree: boolean; wellConstructed: boolean };

export function voteStats(votes: ClaimVoteLike[]) {
  const raterCount = votes.length;
  const agreeCount = votes.filter((v) => v.agree).length;
  const wellCount = votes.filter((v) => v.wellConstructed).length;
  const scatter = votes.slice(0, 24).map((v) => {
    const jx = hash(v.id + "x");
    const jy = hash(v.id + "y");
    const left = v.agree ? 58 + jx * 37 : 5 + jx * 37;
    const top = v.wellConstructed ? 5 + jy * 37 : 58 + jy * 37;
    return { left: Math.round(left), top: Math.round(top) };
  });
  return {
    raterCount,
    agreePct: pct(agreeCount, raterCount),
    wellConstructedPct: pct(wellCount, raterCount),
    scatter,
  };
}

type StrengthVoteLike = { value: string };

export function strengthDistribution(strengthVotes: StrengthVoteLike[]) {
  const total = strengthVotes.length;
  const counts: Record<string, number> = { DECISIVE: 0, RELEVANT: 0, TANGENTIAL: 0 };
  for (const v of strengthVotes) counts[v.value] = (counts[v.value] ?? 0) + 1;
  return STRENGTH_ORDER.map((value) => ({
    value,
    label: value.charAt(0) + value.slice(1).toLowerCase(),
    count: counts[value],
    pct: pct(counts[value], total),
    weight: STRENGTH_WEIGHT[value],
  }));
}

const STRENGTH_DEFINITIONS: Record<string, { supports: string; contradicts: string }> = {
  DECISIVE: {
    supports: "The parent claim largely stands or falls on this one.",
    contradicts: "It defeats the parent claim if accepted.",
  },
  RELEVANT: {
    supports: "It adds real weight, but the parent claim survives without it.",
    contradicts: "It counts against the parent claim without settling it.",
  },
  TANGENTIAL: {
    supports: "True perhaps, but it does little work for this claim.",
    contradicts: "True perhaps, but it does not land against this claim.",
  },
};

export function strengthDefinition(value: string, relation: string) {
  const def = STRENGTH_DEFINITIONS[value];
  return relation === "SUPPORTS" ? def.supports : def.contradicts;
}

type ClaimSummaryInput = {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  body: string;
  type: string;
  evidenceStrength: string;
  tags: string[];
  votes: ClaimVoteLike[];
  arguedBy: Array<{
    relation: string;
    statedStrength: string;
    fromClaim: { title: string };
  }>;
};

export function claimSummary(claim: ClaimSummaryInput) {
  const stats = voteStats(claim.votes);
  const ownArguments = [...claim.arguedBy]
    .sort((a, b) => STRENGTH_RANK[a.statedStrength] - STRENGTH_RANK[b.statedStrength])
    .slice(0, 3)
    .map((c) => ({
      relation: c.relation,
      label: c.relation === "SUPPORTS" ? "FOR" : "AGAINST",
      text: c.fromClaim.title,
      ...strengthMark(c.statedStrength),
    }));

  return {
    id: claim.id,
    slug: claim.slug,
    title: claim.title,
    oneLiner: claim.oneLiner,
    body: claim.body,
    type: claim.type,
    evidenceStrength: claim.evidenceStrength,
    tags: claim.tags,
    ...stats,
    ownArguments,
  };
}

export function ageLabel(createdAt: Date) {
  const days = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30.4);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function capitalize(word: string) {
  return word.charAt(0) + word.slice(1).toLowerCase();
}
