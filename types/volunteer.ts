import type { EventData, StandardResponse, User } from "./auth";

export type VolunteerStatus =
  | "APPLIED"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN"
  | "CHECKED_IN"
  | "COMPLETED";

export interface VolunteerRole {
  id: string;
  eventId: string;
  title: string;
  description: string;
  capacity: number;
  requiresApproval: boolean;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerApplication {
  id: string;
  eventId: string;
  roleId: string;
  userId: string;
  status: VolunteerStatus;
  note: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  confirmedMinutes: number | null;
  confirmedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export type VolunteerRoleWithCount = VolunteerRole & {
  _count: { applications: number };
};

export type VolunteerRoleListing = VolunteerRoleWithCount & {
  applications: VolunteerApplication[];
};

export type VolunteerRosterEntry = VolunteerApplication & {
  role: VolunteerRole;
  user: Omit<
    Required<Pick<User, "id" | "fullName" | "username">>,
    "username"
  > & {
    username: string | null;
    profilePicUrlTN: string | null;
  };
};

export type VolunteerHistoryEntry = VolunteerApplication & {
  role: VolunteerRole;
  event: Pick<
    EventData,
    "id" | "title" | "location" | "startDate" | "endDate"
  > & {
    thumbnailUrl: EventData["thumbnailUrl"] | null;
  };
};

export interface VolunteerSummary {
  counts: Record<VolunteerStatus, number>;
  capacity: number;
  confirmedPlaces: number;
  attended: number;
  confirmedMinutes: number;
  confirmedHours: number;
  recruitmentProgress: number;
}

export type VolunteerRoleInput = Pick<
  VolunteerRole,
  "title" | "description" | "capacity" | "requiresApproval"
>;
export type VolunteerRoleUpdate = Partial<
  VolunteerRoleInput & Pick<VolunteerRole, "isOpen">
>;
export type VolunteerResponse<T> = Omit<
  StandardResponse,
  "data" | "status_code"
> & { data: T };

export type VolunteerAction =
  | { type: "apply"; roleId: string; note?: string }
  | { type: "review"; applicationId: string; status: "ACCEPTED" | "DECLINED" }
  | { type: "withdraw" | "check-in"; applicationId: string }
  | { type: "complete"; applicationId: string; confirmedMinutes: number };

export type SaveVolunteerRole =
  | { type: "create"; data: VolunteerRoleInput }
  | { type: "update"; roleId: string; data: VolunteerRoleUpdate };
