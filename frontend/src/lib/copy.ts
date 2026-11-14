export const CLASSIFICATION_COPY: Record<string, string> = {
  FACT: "A claim about what is the case. It can be checked against evidence, and evidence can settle it.",
  OPINION: "A judgement about how to read the facts. Legitimate, but not the kind of claim evidence alone can settle.",
  VALUE: "A claim about what matters or what is right. Rests on principles rather than evidence — disagreement here is not error.",
  PROPOSAL: "A claim about what should be done. Usually stands on facts and values underneath it, which can be argued separately.",
  STRONG: "Supported by sources that directly substantiate the claim — research, official data, primary documents.",
  MODERATE: "Supported, but indirectly or partially: reporting, secondary analysis, or evidence covering part of the claim.",
  WEAK: "Sources are thin, contested, or only loosely connected to what the claim actually asserts.",
  NONE: "Nothing attached yet. Not a verdict on the claim — an invitation to supply what is missing.",
};

export const EVIDENCE_LABEL: Record<string, string> = {
  STRONG: "STRONG EVIDENCE",
  MODERATE: "MODERATE EVIDENCE",
  WEAK: "WEAK EVIDENCE",
  NONE: "NO EVIDENCE",
};

export const AGREE_TOOLTIP =
  "Share of raters who agree the claim is true — independent of how well it is argued.";
export const WELL_CONSTRUCTED_TOOLTIP =
  "Share of raters who judge the claim argued properly — evidence, logic, clarity. You can rate it well made and still disagree.";

export const STRENGTH_DEFINITIONS: Record<string, { supports: string; contradicts: string }> = {
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

export const TYPE_LABEL: Record<string, string> = {
  FACT: "Fact",
  OPINION: "Opinion",
  VALUE: "Value",
  PROPOSAL: "Proposal",
};

/** One-line scope for each topic. Free-string tags until the Phase 3 taxonomy; unknown tags get a generic line. */
export const TAG_COPY: Record<string, string> = {
  ENERGY: "Electricity and gas: generation, firming, prices, the grid and the transition.",
  CLIMATE: "Emissions, targets and the policies meant to reach them.",
  HOUSING: "Supply, prices, rents, planning and the tax settings that shape them.",
  TAX: "What is taxed, who pays, and the concessions that change behaviour.",
  ECONOMY: "Growth, investment, productivity and the public finances.",
  IMMIGRATION: "Permanent and temporary migration, its size, composition and effects.",
  EDUCATION: "Schools, universities and the international education sector.",
  LABOUR: "Jobs, wages, skills and the rules of work.",
  GOVERNANCE: "How decisions are made, by whom, and with what accountability.",
  ENVIRONMENT: "Nature, species, land and the laws that protect them.",
  TRANSPORT: "Roads, public transport, parking and how people move.",
  LOCAL: "Decisions made by councils and felt street by street.",
  TECHNOLOGY: "Digital infrastructure, platforms, data centres and their regulation.",
  DEFENCE: "Security, alliances and defence spending.",
  LAW: "Legislation, courts and legal process.",
  HEALTH: "Health services, public health and medical regulation.",
  AGRICULTURE: "Farming, land use and the industries that depend on them.",
};

export const CONTENTIOUS_TOOLTIP =
  "Editors marked this as where the debate currently turns. Nothing is permanently the crux: the mark carries the date it was last confirmed and is re-checked every 90 days.";
export const CONTENTIOUS_REVIEW_TOOLTIP =
  "This was marked as where the debate turns more than 90 days ago and is due for review. It may no longer be the live question.";

export const QUADRANT_COPY: Record<string, string> = {
  COMPELLING: "Most raters agree and judge it well made: the consensus pick.",
  STEELMAN: "Well made but did not move most raters. The quadrant most useful for understanding the other side.",
  PARTISAN: "Most raters agree but judge it poorly made. Popular, weakly argued.",
  WEAK: "Few agree and few think it well made. No label needed; the score is the signal.",
  UNRATED: "Nobody has rated this claim yet.",
};
