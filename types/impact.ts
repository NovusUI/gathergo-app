export type ImpactSuggestionSource = "ai" | "manual";

export type ImpactSuggestionConfidence = "high" | "medium" | "low";

export interface SuggestedSdgGoal {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  color?: string;
  confidence?: ImpactSuggestionConfidence;
  source?: ImpactSuggestionSource;
}

export interface SuggestedImpactPath {
  id: string;
  title: string;
  summaryLabel: string;
  description?: string;
  confidence?: ImpactSuggestionConfidence;
  source?: ImpactSuggestionSource;
}

export interface SuggestedImpactCommitment {
  id?: string;
  type: string;
  value: number;
  unit: string;
  label: string;
  confidence?: ImpactSuggestionConfidence;
  source?: ImpactSuggestionSource;
}

export interface ImpactSuggestionData {
  sdgGoals: SuggestedSdgGoal[];
  impactPaths: SuggestedImpactPath[];
  commitments: SuggestedImpactCommitment[];
  source?: ImpactSuggestionSource;
}

export interface PersistedImpactMap {
  impactSdgGoals?: SuggestedSdgGoal[] | null;
  impactPaths?: SuggestedImpactPath[] | null;
  impactCommitments?: SuggestedImpactCommitment[] | null;
  impactMapSource?: ImpactSuggestionSource | string | null;
  impactMapGeneratedAt?: string | null;
}
