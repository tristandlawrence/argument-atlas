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
