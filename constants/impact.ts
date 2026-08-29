import {
  ImpactSuggestionData,
  ImpactSuggestionPayload,
  PersistedImpactMap,
  SuggestedImpactPath,
  SuggestedSdgGoal,
} from "@/types/impact";

export type EventRegistrationType = "ticket" | "registration" | "donation";

export type ImpactConfidence = "high" | "medium" | "low";

export interface ImpactCauseOption {
  id: string;
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
}

export interface ImpactSdgGoal {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  color: string;
  keywords: string[];
}

export interface InferredImpactSdgGoal extends ImpactSdgGoal {
  score: number;
  confidence: ImpactConfidence;
  source: "inferred";
}

export interface ImpactMechanismOption {
  id: string;
  title: string;
  summaryLabel: string;
  description: string;
  keywords: string[];
}

export interface InferredImpactMechanism extends ImpactMechanismOption {
  score: number;
  confidence: ImpactConfidence;
  source: "inferred";
}

export interface InferredImpactCommitment {
  id: string;
  type: string;
  value: number;
  unit: string;
  label: string;
  confidence: ImpactConfidence;
  source: "inferred";
}

export const IMPACT_CAUSES: ImpactCauseOption[] = [
  {
    id: "education",
    title: "Education",
    description: "Support books, school fees, skills training, and safer learning spaces.",
    tags: ["Education", "Scholarship", "Youth Development"],
    keywords: ["education", "school", "student", "tuition", "scholarship", "learning"],
  },
  {
    id: "healthcare",
    title: "Healthcare",
    description: "Fund treatment, hospital support, medication access, and community health outreach.",
    tags: ["Healthcare", "Medical Aid", "Wellness"],
    keywords: ["health", "care", "hospital", "clinic", "medical", "wellness"],
  },
  {
    id: "orphanage",
    title: "Orphanage Support",
    description: "Provide food, shelter, school support, and daily care for children in need.",
    tags: ["Orphanage", "Children", "Care Giving"],
    keywords: ["orphan", "children", "care", "shelter", "home"],
  },
  {
    id: "food_relief",
    title: "Food Relief",
    description: "Help families access meals, groceries, and emergency food packs.",
    tags: ["Food Relief", "Hunger", "Community Support"],
    keywords: ["food", "meal", "hunger", "nutrition", "relief"],
  },
  {
    id: "women_empowerment",
    title: "Women Empowerment",
    description: "Back programs focused on income access, safety, and opportunity for women and girls.",
    tags: ["Women Empowerment", "Inclusion", "Economic Access"],
    keywords: ["women", "girls", "empowerment", "inclusion", "support"],
  },
  {
    id: "youth_development",
    title: "Youth Development",
    description: "Create room for mentorship, leadership, sports, arts, and employability programs.",
    tags: ["Youth Development", "Mentorship", "Leadership"],
    keywords: ["youth", "mentor", "leadership", "training", "skills"],
  },
  {
    id: "disability_support",
    title: "Disability Support",
    description: "Increase access to mobility tools, care, assistive technology, and inclusive spaces.",
    tags: ["Disability Support", "Accessibility", "Inclusion"],
    keywords: ["disability", "accessibility", "inclusion", "assistive"],
  },
  {
    id: "environment",
    title: "Environment",
    description: "Fund cleanup drives, tree planting, waste reduction, and climate action work.",
    tags: ["Environment", "Climate", "Cleanup"],
    keywords: ["environment", "climate", "cleanup", "tree", "waste", "green"],
  },
  {
    id: "animal_welfare",
    title: "Animal Welfare",
    description: "Support rescue, shelter care, feeding, and protection for animals.",
    tags: ["Animal Welfare", "Rescue", "Shelter"],
    keywords: ["animal", "rescue", "shelter", "pet", "care"],
  },
  {
    id: "community_building",
    title: "Community Building",
    description: "Strengthen neighborhoods through shared resources, outreach, and mutual support.",
    tags: ["Community Building", "Neighborhood", "Outreach"],
    keywords: ["community", "neighborhood", "outreach", "mutual aid", "support"],
  },
];

export const SDG_GOALS: ImpactSdgGoal[] = [
  {
    id: "sdg_1",
    number: 1,
    title: "No Poverty",
    shortTitle: "No Poverty",
    color: "#E5243B",
    keywords: ["poverty", "poor", "income", "relief", "livelihood", "support fund", "basic needs"],
  },
  {
    id: "sdg_2",
    number: 2,
    title: "Zero Hunger",
    shortTitle: "Zero Hunger",
    color: "#DDA63A",
    keywords: ["food", "hunger", "meal", "nutrition", "groceries", "farm", "feeding"],
  },
  {
    id: "sdg_3",
    number: 3,
    title: "Good Health and Well-being",
    shortTitle: "Health",
    color: "#4C9F38",
    keywords: ["health", "wellness", "clinic", "medical", "blood", "donor", "hospital", "screening", "mental health"],
  },
  {
    id: "sdg_4",
    number: 4,
    title: "Quality Education",
    shortTitle: "Education",
    color: "#C5192D",
    keywords: ["education", "school", "student", "training", "books", "learning", "scholarship", "skills"],
  },
  {
    id: "sdg_5",
    number: 5,
    title: "Gender Equality",
    shortTitle: "Gender Equality",
    color: "#FF3A21",
    keywords: ["women", "girls", "gender", "empowerment", "female", "safe space", "period"],
  },
  {
    id: "sdg_6",
    number: 6,
    title: "Clean Water and Sanitation",
    shortTitle: "Water & Sanitation",
    color: "#26BDE2",
    keywords: ["water", "sanitation", "hygiene", "clean water", "toilet", "wash"],
  },
  {
    id: "sdg_7",
    number: 7,
    title: "Affordable and Clean Energy",
    shortTitle: "Clean Energy",
    color: "#FCC30B",
    keywords: ["energy", "solar", "electricity", "renewable", "clean power", "battery"],
  },
  {
    id: "sdg_8",
    number: 8,
    title: "Decent Work and Economic Growth",
    shortTitle: "Decent Work",
    color: "#A21942",
    keywords: ["jobs", "work", "career", "entrepreneur", "business", "market", "income", "artist platform"],
  },
  {
    id: "sdg_9",
    number: 9,
    title: "Industry, Innovation and Infrastructure",
    shortTitle: "Innovation",
    color: "#FD6925",
    keywords: ["innovation", "technology", "infrastructure", "startup", "makers", "digital", "engineering"],
  },
  {
    id: "sdg_10",
    number: 10,
    title: "Reduced Inequalities",
    shortTitle: "Inclusion",
    color: "#DD1367",
    keywords: ["inclusion", "access", "disability", "underserved", "marginalized", "equal", "opportunity"],
  },
  {
    id: "sdg_11",
    number: 11,
    title: "Sustainable Cities and Communities",
    shortTitle: "Communities",
    color: "#FD9D24",
    keywords: ["community", "city", "neighborhood", "public space", "urban", "transport", "local"],
  },
  {
    id: "sdg_12",
    number: 12,
    title: "Responsible Consumption and Production",
    shortTitle: "Responsible Use",
    color: "#BF8B2E",
    keywords: ["recycle", "recycling", "waste", "plastic", "trash", "reuse", "upcycle", "sustainable fashion", "consumption"],
  },
  {
    id: "sdg_13",
    number: 13,
    title: "Climate Action",
    shortTitle: "Climate Action",
    color: "#3F7E44",
    keywords: ["climate", "carbon", "co2", "emission", "tree", "trees", "green", "environment", "carpool"],
  },
  {
    id: "sdg_14",
    number: 14,
    title: "Life Below Water",
    shortTitle: "Life Below Water",
    color: "#0A97D9",
    keywords: ["ocean", "sea", "river", "beach", "marine", "fish", "waterway"],
  },
  {
    id: "sdg_15",
    number: 15,
    title: "Life on Land",
    shortTitle: "Life on Land",
    color: "#56C02B",
    keywords: ["tree", "trees", "forest", "land", "biodiversity", "planting", "wildlife", "garden"],
  },
  {
    id: "sdg_16",
    number: 16,
    title: "Peace, Justice and Strong Institutions",
    shortTitle: "Peace & Justice",
    color: "#00689D",
    keywords: ["justice", "peace", "rights", "civic", "legal", "safety", "governance"],
  },
  {
    id: "sdg_17",
    number: 17,
    title: "Partnerships for the Goals",
    shortTitle: "Partnerships",
    color: "#19486A",
    keywords: ["partner", "partnership", "coalition", "collaboration", "ngo", "community group"],
  },
];

export const IMPACT_MECHANISMS: ImpactMechanismOption[] = [
  {
    id: "fundraising",
    title: "Fundraising",
    summaryLabel: "Fundraising",
    description: "People give money directly toward a stated cause or goal.",
    keywords: ["donation", "donate", "fundraise", "fundraising", "raise money", "charity", "support fund"],
  },
  {
    id: "proceeds_contribution",
    title: "Proceeds Contribution",
    summaryLabel: "Proceeds support",
    description: "Ticket or registration earnings are partly or fully committed to impact work.",
    keywords: ["proceeds", "percentage", "earnings", "ticket sales", "sales", "revenue", "profit"],
  },
  {
    id: "direct_action",
    title: "Direct Action",
    summaryLabel: "Direct action",
    description: "Participants physically do the work, such as cleanup, outreach, planting, or service.",
    keywords: ["volunteer", "cleanup", "clean up", "plant", "planting", "serve", "outreach", "drive", "sanitation"],
  },
  {
    id: "awareness_education",
    title: "Awareness and Education",
    summaryLabel: "Awareness",
    description: "The event teaches, informs, or shifts attention toward an issue.",
    keywords: ["awareness", "workshop", "talk", "training", "education", "learn", "teach", "panel", "sensitize"],
  },
  {
    id: "creative_platform",
    title: "Creative Platform",
    summaryLabel: "Creative platform",
    description: "The event gives people visibility, audience access, or space to show their work.",
    keywords: ["artist", "artists", "art", "exhibition", "showcase", "creative", "platform", "gallery", "performance"],
  },
  {
    id: "resource_collection",
    title: "Resource Collection",
    summaryLabel: "Resource drive",
    description: "People bring or gather useful items such as food, books, clothes, tools, or supplies.",
    keywords: ["collect", "collection", "donate items", "books", "clothes", "tools", "supplies", "kits"],
  },
  {
    id: "health_action",
    title: "Health Action",
    summaryLabel: "Health action",
    description: "The event supports health through screening, blood donation, wellness, or care access.",
    keywords: ["blood", "donor", "screening", "health", "wellness", "clinic", "medical", "fitness"],
  },
  {
    id: "access_inclusion",
    title: "Access and Inclusion",
    summaryLabel: "Access",
    description: "The event opens space, opportunity, or participation for people with limited access.",
    keywords: ["access", "inclusion", "inclusive", "disability", "underserved", "opportunity", "free for", "platform"],
  },
  {
    id: "sustainable_mobility",
    title: "Sustainable Mobility",
    summaryLabel: "Sustainable mobility",
    description: "The event itself is about lower-impact movement, walking, cycling, or shared transport.",
    keywords: ["carpool", "car-free", "walk", "walking", "bike", "cycling", "shared ride", "transport"],
  },
];

export const DEFAULT_IMPACT_PERCENTAGE = 20;

const IMPACT_COMMITMENT_PATTERNS = [
  {
    type: "trees",
    unitSingular: "tree",
    unitPlural: "trees",
    variants: ["trees?", "seedlings?"],
  },
  {
    type: "volunteers",
    unitSingular: "volunteer",
    unitPlural: "volunteers",
    variants: ["volunteers?", "participants?"],
  },
  {
    type: "artists",
    unitSingular: "artist",
    unitPlural: "artists",
    variants: ["artists?", "creatives?", "exhibitors?"],
  },
  {
    type: "blood_donors",
    unitSingular: "blood donor",
    unitPlural: "blood donors",
    variants: ["blood donors?", "donors?"],
  },
  {
    type: "waste_kg",
    unitSingular: "kg waste",
    unitPlural: "kg waste",
    variants: ["kgs?(?: of)? waste", "kilograms?(?: of)? waste"],
  },
  {
    type: "waste_tons",
    unitSingular: "ton waste",
    unitPlural: "tons waste",
    variants: ["tons?(?: of)? waste", "tonnes?(?: of)? waste"],
  },
  {
    type: "tools",
    unitSingular: "tool",
    unitPlural: "tools",
    variants: ["tools?", "cleanup tools?", "kits?", "cleanup kits?"],
  },
  {
    type: "meals",
    unitSingular: "meal",
    unitPlural: "meals",
    variants: ["meals?", "food packs?", "food boxes?"],
  },
  {
    type: "books",
    unitSingular: "book",
    unitPlural: "books",
    variants: ["books?", "learning materials?"],
  },
  {
    type: "people",
    unitSingular: "person reached",
    unitPlural: "people reached",
    variants: ["people", "attendees?", "students?", "children", "families"],
  },
];

const getConfidence = (score: number): ImpactConfidence => {
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
};

const normalizeImpactText = (parts: (string | string[] | null | undefined)[]) =>
  parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const scoreKeywords = (text: string, keywords: string[]) =>
  keywords.reduce((score, keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    if (!normalizedKeyword || !text.includes(normalizedKeyword)) {
      return score;
    }

    return score + (normalizedKeyword.includes(" ") ? 3 : 2);
  }, 0);

const parseCommitmentValue = (value: string) =>
  Number(value.replace(/,/g, ""));

const formatCommitmentValue = (value: number) =>
  Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString();

const formatCommitmentLabel = (
  value: number,
  singular: string,
  plural: string,
) => `${formatCommitmentValue(value)} ${value === 1 ? singular : plural} goal`;

export const inferImpactSdgGoals = (input: {
  title?: string | null;
  description?: string | null;
  impactTitle?: string | null;
  impactDescription?: string | null;
  tags?: string[] | null;
  limit?: number;
}) => {
  const text = normalizeImpactText([
    input.title,
    input.description,
    input.impactTitle,
    input.impactDescription,
    input.tags || [],
  ]);

  if (!text.trim()) {
    return [] as InferredImpactSdgGoal[];
  }

  return SDG_GOALS.map((goal) => {
    const score = scoreKeywords(text, goal.keywords);
    return {
      ...goal,
      score,
      confidence: getConfidence(score),
      source: "inferred" as const,
    };
  })
    .filter((goal) => goal.score > 0)
    .sort((a, b) => b.score - a.score || a.number - b.number)
    .slice(0, input.limit || 3);
};

export const inferImpactMechanisms = (input: {
  title?: string | null;
  description?: string | null;
  impactTitle?: string | null;
  impactDescription?: string | null;
  tags?: string[] | null;
  registrationType?: EventRegistrationType | null;
  limit?: number;
}) => {
  const text = normalizeImpactText([
    input.title,
    input.description,
    input.impactTitle,
    input.impactDescription,
    input.tags || [],
  ]);

  if (!text.trim()) {
    return [] as InferredImpactMechanism[];
  }

  return IMPACT_MECHANISMS.map((mechanism) => {
    const registrationBoost =
      input.registrationType === "donation" && mechanism.id === "fundraising"
        ? 4
        : 0;
    const score = scoreKeywords(text, mechanism.keywords) + registrationBoost;
    return {
      ...mechanism,
      score,
      confidence: getConfidence(score),
      source: "inferred" as const,
    };
  })
    .filter((mechanism) => mechanism.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, input.limit || 2);
};

export const inferImpactCommitments = (input: {
  title?: string | null;
  description?: string | null;
  impactTitle?: string | null;
  impactDescription?: string | null;
  tags?: string[] | null;
  limit?: number;
}) => {
  const text = normalizeImpactText([
    input.title,
    input.description,
    input.impactTitle,
    input.impactDescription,
    input.tags || [],
  ]);

  if (!text.trim()) {
    return [] as InferredImpactCommitment[];
  }

  const commitments: (InferredImpactCommitment & { index: number })[] = [];

  IMPACT_COMMITMENT_PATTERNS.forEach((pattern) => {
    const regex = new RegExp(
      `\\b(\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:${pattern.variants.join("|")})\\b`,
      "gi",
    );

    let match = regex.exec(text);
    while (match) {
      const value = parseCommitmentValue(match[1]);
      if (value > 0) {
        commitments.push({
          id: `${pattern.type}_${match.index}_${value}`,
          type: pattern.type,
          value,
          unit: value === 1 ? pattern.unitSingular : pattern.unitPlural,
          label: formatCommitmentLabel(
            value,
            pattern.unitSingular,
            pattern.unitPlural,
          ),
          confidence: "high",
          source: "inferred",
          index: match.index,
        });
      }
      match = regex.exec(text);
    }
  });

  const unique = new Map<string, InferredImpactCommitment & { index: number }>();
  commitments.forEach((commitment) => {
    const key = `${commitment.type}_${commitment.value}`;
    if (!unique.has(key)) {
      unique.set(key, commitment);
    }
  });

  return Array.from(unique.values())
    .sort((a, b) => a.index - b.index)
    .slice(0, input.limit || 3)
    .map(({ index, ...commitment }) => commitment);
};

const findSdgByIdOrNumber = (goal: Partial<SuggestedSdgGoal>) =>
  SDG_GOALS.find(
    (item) =>
      item.id === goal.id ||
      item.number === goal.number ||
      item.title.toLowerCase() === goal.title?.toLowerCase() ||
      item.shortTitle.toLowerCase() === goal.shortTitle?.toLowerCase(),
  );

const findImpactPathByIdOrTitle = (path: Partial<SuggestedImpactPath>) =>
  IMPACT_MECHANISMS.find(
    (item) =>
      item.id === path.id ||
      item.title.toLowerCase() === path.title?.toLowerCase() ||
      item.summaryLabel.toLowerCase() === path.summaryLabel?.toLowerCase(),
  );

export const buildLocalImpactSuggestions = (
  input: ImpactSuggestionPayload,
): ImpactSuggestionData => ({
  sdgGoals: inferImpactSdgGoals({
    title: input.title,
    description: input.description,
    impactDescription: input.impactDescription,
    limit: 3,
  }).map((goal) => ({ ...goal, source: "local_rules" as const })),
  impactPaths: inferImpactMechanisms({
    title: input.title,
    description: input.description,
    impactDescription: input.impactDescription,
    registrationType: input.registrationType,
    limit: 2,
  }).map((path) => ({ ...path, source: "local_rules" as const })),
  commitments: inferImpactCommitments({
    title: input.title,
    description: input.description,
    impactDescription: input.impactDescription,
    limit: 3,
  }).map((commitment) => ({ ...commitment, source: "local_rules" as const })),
  source: "local_rules",
});

export const buildImpactSuggestionPayloadKey = (
  input: ImpactSuggestionPayload,
) =>
  JSON.stringify({
    title: input.title?.trim() || "",
    description: input.description?.trim() || "",
    impactDescription: input.impactDescription?.trim() || "",
    registrationType: input.registrationType || null,
  });

export const normalizeImpactSuggestions = (
  data?: Partial<ImpactSuggestionData> | null,
  fallbackInput?: ImpactSuggestionPayload,
): ImpactSuggestionData => {
  const fallback = fallbackInput
    ? buildLocalImpactSuggestions(fallbackInput)
    : {
        sdgGoals: [],
        impactPaths: [],
        commitments: [],
        source: "local_rules" as const,
      };

  if (!data) {
    return fallback;
  }

  return {
    sdgGoals: (data.sdgGoals?.length ? data.sdgGoals : fallback.sdgGoals).map(
      (goal) => {
        const match = findSdgByIdOrNumber(goal);
        return {
          ...match,
          ...goal,
          id: goal.id || match?.id || `sdg_${goal.number}`,
          title: goal.title || match?.title || goal.shortTitle || "SDG",
          shortTitle:
            goal.shortTitle || match?.shortTitle || goal.title || "SDG",
          color: goal.color || match?.color,
          source: goal.source || data.source || "backend_rules",
        };
      },
    ),
    impactPaths: (
      data.impactPaths?.length ? data.impactPaths : fallback.impactPaths
    ).map((path) => {
      const match = findImpactPathByIdOrTitle(path);
      return {
        ...match,
        ...path,
        id: path.id || match?.id || path.title || "impact_path",
        title: path.title || match?.title || path.summaryLabel || "Impact path",
        summaryLabel:
          path.summaryLabel || match?.summaryLabel || path.title || "Impact",
        description: path.description || match?.description,
        source: path.source || data.source || "backend_rules",
      };
    }),
    commitments: (
      data.commitments?.length ? data.commitments : fallback.commitments
    ).map((commitment, index) => ({
      ...commitment,
      id: commitment.id || `${commitment.type}_${commitment.value}_${index}`,
      source: commitment.source || data.source || "backend_rules",
    })),
    source: data.source || "backend_rules",
  };
};

export const buildImpactMapForPersistence = (
  input: ImpactSuggestionPayload,
): ImpactSuggestionData => buildLocalImpactSuggestions(input);

export const buildImpactMapFormFields = (impactMap: ImpactSuggestionData) => ({
  impactSdgGoals: JSON.stringify(impactMap.sdgGoals || []),
  impactPaths: JSON.stringify(impactMap.impactPaths || []),
  impactCommitments: JSON.stringify(impactMap.commitments || []),
  impactMapSource: impactMap.source || "local_rules",
  impactMapGeneratedAt: new Date().toISOString(),
});

export const normalizePersistedImpactMap = (
  input?: PersistedImpactMap | null,
  fallbackInput?: ImpactSuggestionPayload,
): ImpactSuggestionData => {
  const hasPersistedMap =
    Boolean(input?.impactSdgGoals?.length) ||
    Boolean(input?.impactPaths?.length) ||
    Boolean(input?.impactCommitments?.length);

  if (!hasPersistedMap) {
    return normalizeImpactSuggestions(null, fallbackInput);
  }

  return normalizeImpactSuggestions(
    {
      sdgGoals: input?.impactSdgGoals || [],
      impactPaths: input?.impactPaths || [],
      commitments: input?.impactCommitments || [],
      source:
        (input?.impactMapSource as ImpactSuggestionData["source"]) ||
        "backend_rules",
    },
    fallbackInput,
  );
};

export const clampImpactPercentage = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return DEFAULT_IMPACT_PERCENTAGE;
  }

  return Math.max(1, Math.min(100, Math.round(Number(value))));
};

export const resolveImpactPercentage = (
  registrationType?: EventRegistrationType | null,
  percentage?: number | null,
) => {
  if (registrationType === "donation") {
    return 100;
  }

  return clampImpactPercentage(percentage);
};

export const findImpactCause = (impactTitle?: string | null) => {
  if (!impactTitle) return null;
  const normalized = impactTitle.trim().toLowerCase();

  return (
    IMPACT_CAUSES.find(
      (cause) =>
        cause.title.toLowerCase() === normalized ||
        cause.keywords.some((keyword) => keyword.toLowerCase() === normalized),
    ) || null
  );
};

export const buildImpactDescription = (
  impactTitle?: string | null,
  impactDescription?: string | null,
) => {
  if (impactDescription?.trim()) {
    return impactDescription.trim();
  }

  return (
    findImpactCause(impactTitle)?.description ||
    "This event gives back directly to a real-world cause."
  );
};

export const formatImpactSummary = (input: {
  title?: string | null;
  description?: string | null;
  impactTitle?: string | null;
  impactDescription?: string | null;
  impactPercentage?: number | null;
  registrationType?: EventRegistrationType | null;
  tags?: string[] | null;
}) => {
  if (!input.impactTitle?.trim() && !input.impactDescription?.trim()) {
    return null;
  }

  const [mechanism] = inferImpactMechanisms({ ...input, limit: 1 });
  const [goal] = inferImpactSdgGoals({ ...input, limit: 1 });
  const [commitment] = inferImpactCommitments({ ...input, limit: 1 });

  if (commitment && goal) {
    return `${commitment.label} - ${goal.shortTitle}`;
  }

  if (commitment) {
    return commitment.label;
  }

  if (mechanism && goal) {
    return `${mechanism.summaryLabel} - ${goal.shortTitle}`;
  }

  if (mechanism) {
    return mechanism.summaryLabel;
  }

  if (input.registrationType === "donation" && input.impactTitle?.trim()) {
    return `Donation drive - ${input.impactTitle.trim()}`;
  }

  if (goal) {
    return goal.shortTitle;
  }

  return input.impactTitle?.trim() || "Impact event";
};

export const deriveImpactTitle = (input: {
  title?: string | null;
  description?: string | null;
  impactDescription?: string | null;
  tags?: string[] | null;
  registrationType?: EventRegistrationType | null;
}) => {
  const [goal] = inferImpactSdgGoals({ ...input, limit: 1 });
  if (goal) {
    return goal.shortTitle;
  }

  const [mechanism] = inferImpactMechanisms({ ...input, limit: 1 });
  if (mechanism) {
    return mechanism.title;
  }

  return "Community Impact";
};

export const deriveImpactTags = (input: {
  title?: string | null;
  description?: string | null;
  impactTitle?: string | null;
  impactDescription?: string | null;
  tags?: string[] | null;
  registrationType?: EventRegistrationType | null;
}) => {
  const unique = new Set<string>((input.tags || []).filter(Boolean));

  inferImpactSdgGoals({ ...input, limit: 3 }).forEach((goal) => {
    unique.add(goal.shortTitle);
    unique.add(`SDG ${goal.number}`);
  });

  inferImpactMechanisms({ ...input, limit: 2 }).forEach((mechanism) => {
    unique.add(mechanism.summaryLabel);
  });

  inferImpactCommitments({ ...input, limit: 3 }).forEach((commitment) => {
    unique.add(commitment.unit);
    unique.add(commitment.type.replace(/_/g, " "));
  });

  if (input.registrationType === "donation") {
    unique.add("Fundraising");
  }

  if (input.impactTitle?.trim()) {
    unique.add(input.impactTitle.trim());
  }

  return Array.from(unique);
};
