export type EventRegistrationType = "ticket" | "registration" | "donation";

export interface ImpactCauseOption {
  id: string;
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
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

export const DEFAULT_EVENT_TAGS = [
  "Education",
  "Healthcare",
  "Food Relief",
  "Orphanage",
  "Women Empowerment",
  "Youth Development",
  "Disability Support",
  "Environment",
  "Animal Welfare",
  "Community Building",
  "Fundraiser",
  "Volunteer",
];

export const DEFAULT_IMPACT_CAUSE = IMPACT_CAUSES[0];
export const DEFAULT_IMPACT_PERCENTAGE = 20;

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
  impactTitle?: string | null;
  impactPercentage?: number | null;
  registrationType?: EventRegistrationType | null;
}) => {
  if (!input.impactTitle?.trim()) {
    return null;
  }

  const percentage = resolveImpactPercentage(
    input.registrationType,
    input.impactPercentage,
  );

  return `${percentage}% going to ${input.impactTitle.trim()}`;
};

export const mergeImpactTags = (
  tags: string[] | undefined,
  impactTitle?: string | null,
) => {
  const unique = new Set<string>((tags || []).filter(Boolean));
  const selectedCause = findImpactCause(impactTitle);

  if (selectedCause) {
    selectedCause.tags.forEach((tag) => unique.add(tag));
  } else if (impactTitle?.trim()) {
    unique.add(impactTitle.trim());
  }

  return Array.from(unique);
};
