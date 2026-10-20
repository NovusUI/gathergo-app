import { buildImpactMapFormFields } from "@/constants/impact";
import type { EventFormData } from "@/schemas/event";

export function buildEventParticipationFormFields(
  values: Pick<
    EventFormData,
    | "registrationType"
    | "registrationFee"
    | "registrationAttendees"
    | "tickets"
    | "donationsEnabled"
    | "donationTarget"
    | "volunteerRoles"
  >,
  mode: "create" | "update",
) {
  const donationsEnabled =
    values.registrationType === "donation" ||
    (values.registrationType === "volunteer" && values.donationsEnabled);
  return {
    donationsEnabled,
    ...(donationsEnabled && values.donationTarget !== undefined
      ? { donationTarget: values.donationTarget }
      : {}),
    ...(values.registrationType === "registration"
      ? {
          registrationAttendees: values.registrationAttendees ?? 100000,
          registrationFee: values.registrationFee ?? 0,
        }
      : {}),
    ...(values.registrationType === "ticket"
      ? {
          tickets: values.tickets?.map(({ paid, limited, isNew, ...ticket }) =>
            JSON.stringify(ticket),
          ),
        }
      : {}),
    ...(mode === "create"
      ? {
          registrationType: values.registrationType,
          ...(values.volunteerRoles.length > 0
            ? { volunteerRoles: JSON.stringify(values.volunteerRoles) }
            : {}),
        }
      : {}),
  };
}

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
