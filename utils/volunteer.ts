import type { EventData } from "@/types/auth";
import type {
  VolunteerApplication,
  VolunteerRoleListing,
  VolunteerStatus,
} from "@/types/volunteer";

export const VOLUNTEER_IMPACT_STORY_REQUIRED =
  "Add an impact story before enabling volunteering.";

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerStatus, string> = {
  APPLIED: "Awaiting approval",
  ACCEPTED: "Place confirmed",
  DECLINED: "Application declined",
  WITHDRAWN: "Withdrawn",
  CHECKED_IN: "Checked in",
  COMPLETED: "Contribution confirmed",
};

export function canRecruitVolunteers(
  event: Pick<
    EventData,
    "registrationType" | "isPhysicalEvent" | "impactTitle" | "impactDescription"
  >,
) {
  return event.isPhysicalEvent && Boolean(event.impactDescription?.trim());
}

export function hasActiveVolunteerApplication(
  application: VolunteerApplication,
) {
  return (
    application.status !== "DECLINED" && application.status !== "WITHDRAWN"
  );
}

export function canApplyToRole(
  role: VolunteerRoleListing,
  applications: VolunteerApplication[],
  startDate: string,
  now = Date.now(),
) {
  return (
    now < new Date(startDate).getTime() &&
    role.isOpen &&
    role._count.applications < role.capacity &&
    !applications.some(hasActiveVolunteerApplication)
  );
}

export function canWithdrawApplication(
  application: VolunteerApplication,
  startDate: string,
  now = Date.now(),
) {
  return (
    now < new Date(startDate).getTime() &&
    (application.status === "APPLIED" || application.status === "ACCEPTED")
  );
}

export function volunteerAttendanceActions(
  application: VolunteerApplication,
  event: Pick<EventData, "startDate" | "endDate">,
  now = Date.now(),
) {
  const started = now >= new Date(event.startDate).getTime();
  const ended = now >= new Date(event.endDate).getTime();
  return {
    canReview: !started && application.status === "APPLIED",
    canCheckIn: started && !ended && application.status === "ACCEPTED",
    canComplete: ended && application.status === "CHECKED_IN",
  };
}
