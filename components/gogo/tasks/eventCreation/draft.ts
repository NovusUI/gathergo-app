import { normalizeEventLinks } from "@/constants/eventLinks";
import type { EventFormData } from "@/schemas/event";
import type {
  EventCreationDraft,
  EventCreationUpdates,
} from "@/components/gogo/tasks/eventCreation/types";
import { buildEventDateTimeIso, extractTime } from "@/utils/dateTimeHandler";
import type { UseFormSetValue } from "react-hook-form";

export function buildEventCreationDraft(
  values: EventFormData,
): EventCreationDraft {
  return {
    title: values.eventName.trim() || undefined,
    description: values.description.trim() || undefined,
    impactDescription: values.impactDescription.trim() || undefined,
    isPhysicalEvent: values.isPhysicalEvent,
    location: values.location.trim() || undefined,
    registrationType: values.registrationType,
    registrationFee: values.registrationFee,
    registrationAttendees: values.registrationAttendees,
    donationTarget: values.donationTarget,
    donationsEnabled: values.donationsEnabled,
    links: normalizeEventLinks(values.links),
    tags: values.tags,
    startDate:
      values.startDate && values.startTime
        ? buildEventDateTimeIso(values.startDate, values.startTime)
        : undefined,
    endDate:
      values.endDate && values.endTime
        ? buildEventDateTimeIso(values.endDate, values.endTime)
        : undefined,
    ticketCount: values.tickets?.length ?? 0,
    volunteerRoleCount: values.volunteerRoles.length,
    impactMapCount:
      (values.impactSdgGoals?.length ?? 0) +
      (values.impactPaths?.length ?? 0) +
      (values.impactCommitments?.length ?? 0),
    hasImpactGoalOrPath: Boolean(
      values.impactSdgGoals?.length || values.impactPaths?.length,
    ),
  };
}

export function applyEventCreationUpdates(
  setValue: UseFormSetValue<EventFormData>,
  updates: EventCreationUpdates,
) {
  const options = { shouldDirty: true, shouldValidate: true };
  if (updates.title !== undefined)
    setValue("eventName", updates.title, options);
  if (updates.description !== undefined)
    setValue("description", updates.description, options);
  if (updates.impactDescription !== undefined)
    setValue("impactDescription", updates.impactDescription, options);
  if (updates.isPhysicalEvent !== undefined)
    setValue("isPhysicalEvent", updates.isPhysicalEvent, options);
  if (updates.location !== undefined)
    setValue("location", updates.location, options);
  if (updates.registrationType !== undefined)
    setValue("registrationType", updates.registrationType, options);
  if (updates.registrationFee !== undefined)
    setValue("registrationFee", updates.registrationFee, options);
  if (updates.registrationAttendees !== undefined)
    setValue("registrationAttendees", updates.registrationAttendees, options);
  if (updates.donationTarget !== undefined)
    setValue("donationTarget", updates.donationTarget, options);
  if (updates.donationsEnabled !== undefined)
    setValue("donationsEnabled", updates.donationsEnabled, options);
  if (updates.links !== undefined) setValue("links", updates.links, options);
  if (updates.tags !== undefined) setValue("tags", updates.tags, options);
  if (updates.startDate !== undefined) {
    const date = new Date(updates.startDate);
    setValue("startDate", date, options);
    setValue("startTime", extractTime(date), options);
  }
  if (updates.endDate !== undefined) {
    const date = new Date(updates.endDate);
    setValue("endDate", date, options);
    setValue("endTime", extractTime(date), options);
  }
}
