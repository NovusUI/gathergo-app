import type {
  ImpactSuggestionData,
  PersistedImpactMap,
  SuggestedSdgGoal,
} from "@/types/impact";

export type { Registration as EventRegistrationType } from "@/types/auth";

type ImpactSdgGoal = Required<
  Pick<SuggestedSdgGoal, "id" | "number" | "title" | "shortTitle" | "color">
>;

export const SDG_GOALS: ImpactSdgGoal[] = [
  {
    id: "sdg_1",
    number: 1,
    title: "No Poverty",
    shortTitle: "No Poverty",
    color: "#E5243B",
  },
  {
    id: "sdg_2",
    number: 2,
    title: "Zero Hunger",
    shortTitle: "Zero Hunger",
    color: "#DDA63A",
  },
  {
    id: "sdg_3",
    number: 3,
    title: "Good Health and Well-being",
    shortTitle: "Health",
    color: "#4C9F38",
  },
  {
    id: "sdg_4",
    number: 4,
    title: "Quality Education",
    shortTitle: "Education",
    color: "#C5192D",
  },
  {
    id: "sdg_5",
    number: 5,
    title: "Gender Equality",
    shortTitle: "Gender Equality",
    color: "#FF3A21",
  },
  {
    id: "sdg_6",
    number: 6,
    title: "Clean Water and Sanitation",
    shortTitle: "Water & Sanitation",
    color: "#26BDE2",
  },
  {
    id: "sdg_7",
    number: 7,
    title: "Affordable and Clean Energy",
    shortTitle: "Clean Energy",
    color: "#FCC30B",
  },
  {
    id: "sdg_8",
    number: 8,
    title: "Decent Work and Economic Growth",
    shortTitle: "Decent Work",
    color: "#A21942",
  },
  {
    id: "sdg_9",
    number: 9,
    title: "Industry, Innovation and Infrastructure",
    shortTitle: "Innovation",
    color: "#FD6925",
  },
  {
    id: "sdg_10",
    number: 10,
    title: "Reduced Inequalities",
    shortTitle: "Inclusion",
    color: "#DD1367",
  },
  {
    id: "sdg_11",
    number: 11,
    title: "Sustainable Cities and Communities",
    shortTitle: "Communities",
    color: "#FD9D24",
  },
  {
    id: "sdg_12",
    number: 12,
    title: "Responsible Consumption and Production",
    shortTitle: "Responsible Use",
    color: "#BF8B2E",
  },
  {
    id: "sdg_13",
    number: 13,
    title: "Climate Action",
    shortTitle: "Climate Action",
    color: "#3F7E44",
  },
  {
    id: "sdg_14",
    number: 14,
    title: "Life Below Water",
    shortTitle: "Life Below Water",
    color: "#0A97D9",
  },
  {
    id: "sdg_15",
    number: 15,
    title: "Life on Land",
    shortTitle: "Life on Land",
    color: "#56C02B",
  },
  {
    id: "sdg_16",
    number: 16,
    title: "Peace, Justice and Strong Institutions",
    shortTitle: "Peace & Justice",
    color: "#00689D",
  },
  {
    id: "sdg_17",
    number: 17,
    title: "Partnerships for the Goals",
    shortTitle: "Partnerships",
    color: "#19486A",
  },
];

const findSdgByIdOrNumber = (goal: Partial<SuggestedSdgGoal>) =>
  SDG_GOALS.find(
    (item) =>
      item.id === goal.id ||
      item.number === goal.number ||
      item.title.toLowerCase() === goal.title?.toLowerCase() ||
      item.shortTitle.toLowerCase() === goal.shortTitle?.toLowerCase(),
  );

export const buildImpactMapFormFields = (impactMap: ImpactSuggestionData) => ({
  impactSdgGoals: JSON.stringify(impactMap.sdgGoals),
  impactPaths: JSON.stringify(impactMap.impactPaths),
  impactCommitments: JSON.stringify(impactMap.commitments),
  impactMapSource: impactMap.source ?? "manual",
  impactMapGeneratedAt: new Date().toISOString(),
});

export const normalizePersistedImpactMap = (
  input: PersistedImpactMap,
): ImpactSuggestionData => ({
  sdgGoals: (input.impactSdgGoals ?? []).map((goal) => ({
    ...goal,
    color: goal.color ?? findSdgByIdOrNumber(goal)?.color,
  })),
  impactPaths: input.impactPaths ?? [],
  commitments: input.impactCommitments ?? [],
});
