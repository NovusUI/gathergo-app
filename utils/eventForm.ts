import { buildImpactMapFormFields } from "@/constants/impact";
import type {
  EventFormData,
  EventPricing,
  EventPricingFormData,
} from "@/schemas/event";

export const DEFAULT_REGISTRATION_CAPACITY = 100000;

function parsePricingNumber(value: EventPricingFormData["registrationFee"]) {
  return value === "" || value === undefined ? undefined : Number(value);
}

export function normalizeEventPricing(
  data: Omit<EventPricingFormData, "tickets"> & Pick<EventPricing, "tickets">,
): EventPricing {
  return {
    ...data,
    registrationFee:
      data.registrationType === "registration" && !data.paid
        ? 0
        : parsePricingNumber(data.registrationFee),
    registrationAttendees:
      data.registrationType === "registration" && !data.limited
        ? DEFAULT_REGISTRATION_CAPACITY
        : parsePricingNumber(data.registrationAttendees),
    donationTarget: parsePricingNumber(data.donationTarget),
  };
}

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
          registrationAttendees:
            values.registrationAttendees ?? DEFAULT_REGISTRATION_CAPACITY,
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
          ...(values.registrationType === "volunteer" &&
          values.volunteerRoles.length > 0
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
