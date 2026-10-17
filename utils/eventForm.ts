import { buildImpactMapFormFields } from "@/constants/impact";
import type { EventFormData } from "@/schemas/event";

export const buildEventImpactFormFields = (
  values: Pick<
    EventFormData,
    | "impactTitle"
    | "impactDescription"
    | "impactSdgGoals"
    | "impactPaths"
    | "impactCommitments"
  >,
) => {
  const sdgGoals = values.impactSdgGoals ?? [];
  const impactPaths = values.impactPaths ?? [];
  const commitments = values.impactCommitments ?? [];
  const hasMap = sdgGoals.length + impactPaths.length + commitments.length > 0;

  return {
    impactTitle: values.impactTitle.trim(),
    impactDescription: values.impactDescription.trim(),
    ...(hasMap
      ? buildImpactMapFormFields({
          sdgGoals,
          impactPaths,
          commitments,
          source: "manual",
        })
      : {
          impactSdgGoals: "[]",
          impactPaths: "[]",
          impactCommitments: "[]",
          impactMapSource: "",
        }),
  };
};
