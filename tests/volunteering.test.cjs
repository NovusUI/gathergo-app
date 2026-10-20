const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const { eventSchema, eventPricingSchema } = loadTypeScript("schemas/event.ts");
const { buildEventParticipationFormFields } =
  loadTypeScript("utils/eventForm.ts");
const { canApplyToRole, canWithdrawApplication, volunteerAttendanceActions } =
  loadTypeScript("utils/volunteer.ts");

const role = {
  title: "Tree planters",
  description: "Help plant seedlings.",
  capacity: 2,
  requiresApproval: false,
};
const event = {
  eventName: "Plant trees",
  description: "Plant trees at the community garden.",
  impactDescription: "Restore shared green spaces for our community.",
  registrationType: "volunteer",
  isPhysicalEvent: true,
  location: "Lagos",
  startDate: new Date("2030-01-01T10:00:00Z"),
  endDate: new Date("2030-01-01T12:00:00Z"),
  startTime: "10:00",
  endTime: "12:00",
  isRecurring: false,
  repeat: "NONE",
  links: [],
  tags: [],
  volunteerRoles: [role],
};

test("a volunteer-only event needs roles and a physical venue, with no ticket or registration settings", () => {
  const parsed = eventSchema.parse(event);
  const payload = buildEventParticipationFormFields(parsed, "create");
  assert.equal(payload.registrationType, "volunteer");
  assert.equal(payload.donationsEnabled, false);
  assert.deepEqual(JSON.parse(payload.volunteerRoles), [role]);
  for (const field of [
    "tickets",
    "registrationFee",
    "registrationAttendees",
    "donationTarget",
  ])
    assert.equal(field in payload, false);
  assert.equal(
    eventSchema.safeParse({ ...event, volunteerRoles: [] }).success,
    false,
  );
  assert.equal(
    eventSchema.safeParse({ ...event, isPhysicalEvent: false, location: "" })
      .success,
    false,
  );
});

test("physical ticketed and registered impact events can recruit volunteers", () => {
  for (const registrationType of ["ticket", "registration"]) {
    assert.equal(
      eventSchema.safeParse({
        ...event,
        registrationType,
        impactDescription: "",
      }).success,
      false,
    );
    assert.equal(
      eventSchema.safeParse({
        ...event,
        registrationType,
        impactDescription: "Restore green spaces together.",
      }).success,
      true,
    );
  }
});

test("organisers explicitly choose automatic acceptance or approval for each role", () => {
  for (const requiresApproval of [true, false]) {
    assert.equal(
      eventSchema.parse({
        ...event,
        volunteerRoles: [{ ...role, requiresApproval }],
      }).volunteerRoles[0].requiresApproval,
      requiresApproval,
    );
  }
  for (const capacity of [0, 1.5, 100001]) {
    assert.equal(
      eventSchema.safeParse({
        ...event,
        volunteerRoles: [{ ...role, capacity }],
      }).success,
      false,
    );
  }
});

test("donations and a kobo target are optional and independent of volunteering", () => {
  const parsed = eventSchema.parse({
    ...event,
    donationsEnabled: true,
    donationTarget: 500000,
  });
  assert.equal(
    buildEventParticipationFormFields(parsed, "create").donationTarget,
    500000,
  );
  assert.equal(
    eventSchema.safeParse({ ...event, donationsEnabled: true }).success,
    true,
  );
  assert.equal(
    eventSchema.safeParse({
      ...event,
      donationsEnabled: true,
      donationTarget: 499999,
    }).success,
    false,
  );
});

test("updating an event preserves its primary mode and saves role changes through the role API", () => {
  const payload = buildEventParticipationFormFields(
    eventSchema.parse(event),
    "update",
  );
  assert.equal("registrationType" in payload, false);
  assert.equal("volunteerRoles" in payload, false);
  assert.equal(payload.donationsEnabled, false);
});

test("volunteer mode does not serialize stale ticket and registration form fields", () => {
  const parsed = eventSchema.parse({
    ...event,
    registrationFee: 2000,
    registrationAttendees: 50,
    tickets: [],
  });
  const payload = buildEventParticipationFormFields(parsed, "create");
  assert.equal("registrationFee" in payload, false);
  assert.equal("registrationAttendees" in payload, false);
  assert.equal("tickets" in payload, false);
});

test("volunteering is outside the payment type selector", () => {
  assert.equal(
    eventPricingSchema.safeParse({
      registrationType: "volunteer",
      paid: false,
      limited: false,
      tickets: [],
    }).success,
    false,
  );
});

const application = {
  id: "application",
  eventId: "event",
  roleId: "role",
  userId: "user",
  status: "APPLIED",
  note: null,
  checkedInAt: null,
  completedAt: null,
  confirmedMinutes: null,
  confirmedById: null,
  createdAt: "2029-12-01T00:00:00Z",
  updatedAt: "2029-12-01T00:00:00Z",
};
const listing = {
  ...role,
  id: "role",
  eventId: "event",
  isOpen: true,
  _count: { applications: 0 },
  applications: [],
};
const before = Date.parse("2030-01-01T09:00:00Z");
const during = Date.parse("2030-01-01T11:00:00Z");
const after = Date.parse("2030-01-01T13:00:00Z");
const schedule = {
  startDate: event.startDate.toISOString(),
  endDate: event.endDate.toISOString(),
};

test("closed, full and started roles cannot be joined", () => {
  assert.equal(canApplyToRole(listing, [], schedule.startDate, before), true);
  assert.equal(
    canApplyToRole(
      { ...listing, isOpen: false },
      [],
      schedule.startDate,
      before,
    ),
    false,
  );
  assert.equal(
    canApplyToRole(
      { ...listing, _count: { applications: 2 } },
      [],
      schedule.startDate,
      before,
    ),
    false,
  );
  assert.equal(canApplyToRole(listing, [], schedule.startDate, during), false);
});

test("one active application prevents a second role; withdrawal permits a new application", () => {
  assert.equal(
    canApplyToRole(listing, [application], schedule.startDate, before),
    false,
  );
  assert.equal(
    canApplyToRole(
      listing,
      [{ ...application, status: "WITHDRAWN" }],
      schedule.startDate,
      before,
    ),
    true,
  );
  assert.equal(
    canApplyToRole(
      listing,
      [{ ...application, status: "DECLINED" }],
      schedule.startDate,
      before,
    ),
    true,
  );
  assert.equal(
    canWithdrawApplication(application, schedule.startDate, before),
    true,
  );
  assert.equal(
    canWithdrawApplication(application, schedule.startDate, during),
    false,
  );
});

test("organiser actions follow recruitment, attendance and completion phases", () => {
  assert.equal(
    volunteerAttendanceActions(application, schedule, before).canReview,
    true,
  );
  assert.equal(
    volunteerAttendanceActions(application, schedule, during).canReview,
    false,
  );
  assert.equal(
    volunteerAttendanceActions(
      { ...application, status: "ACCEPTED" },
      schedule,
      during,
    ).canCheckIn,
    true,
  );
  assert.equal(
    volunteerAttendanceActions(
      { ...application, status: "ACCEPTED" },
      schedule,
      after,
    ).canCheckIn,
    false,
  );
  assert.equal(
    volunteerAttendanceActions(
      { ...application, status: "CHECKED_IN" },
      schedule,
      after,
    ).canComplete,
    true,
  );
  assert.equal(
    volunteerAttendanceActions(
      { ...application, status: "COMPLETED" },
      schedule,
      after,
    ).canComplete,
    false,
  );
});

const requests = [];
let response;
let requestError;
const send = async (method, ...args) => {
  requests.push([method, ...args]);
  if (requestError) throw requestError;
  return { data: response };
};
const urls = loadTypeScript("services/urls.ts", {
  "@/constants/network": { API_BASE_URL: "https://api.volunteer.test/api/v1" },
});
const api = loadTypeScript("services/serviceFn.ts", {
  "@/utils/checkout": { checkoutDeadline: () => null },
  "@/api/client": {
    default: {
      post: (...args) => send("POST", ...args),
      patch: (...args) => send("PATCH", ...args),
      get: (...args) => send("GET", ...args),
    },
  },
  "@/api/uploadClient": { uploadClient: {} },
  "./urls": urls,
});

test("applying uses the volunteer role endpoint and returns the inspected response envelope directly", async () => {
  requests.length = 0;
  response = {
    status: "success",
    message: "Request successful",
    data: application,
  };
  assert.equal(
    await api.performVolunteerAction("event", {
      type: "apply",
      roleId: "role",
      note: "Happy to help",
    }),
    response,
  );
  assert.deepEqual(requests[0], [
    "POST",
    "https://api.volunteer.test/api/v1/events/event/volunteer-roles/role/apply",
    { note: "Happy to help" },
  ]);
});

test("review, withdrawal, check-in and completion use the actual API bodies", async () => {
  for (const [action, body] of [
    [
      { type: "review", applicationId: "application", status: "ACCEPTED" },
      { status: "ACCEPTED" },
    ],
    [{ type: "withdraw", applicationId: "application" }, {}],
    [{ type: "check-in", applicationId: "application" }, {}],
    [
      { type: "complete", applicationId: "application", confirmedMinutes: 90 },
      { confirmedMinutes: 90 },
    ],
  ]) {
    requests.length = 0;
    await api.performVolunteerAction("event", action);
    assert.deepEqual(requests[0], [
      "PATCH",
      urls.VOLUNTEER_URL.action("event", "application", action.type),
      body,
    ]);
  }
});

test("role edits preserve the organiser's chosen approval policy", async () => {
  requests.length = 0;
  await api.saveVolunteerRole("event", {
    type: "update",
    roleId: "role",
    data: { requiresApproval: false, capacity: 3 },
  });
  assert.deepEqual(requests[0], [
    "PATCH",
    urls.VOLUNTEER_URL.role("event", "role"),
    { requiresApproval: false, capacity: 3 },
  ]);
});

test("server rejections remain errors without a fabricated successful application", async () => {
  requestError = new Error("This volunteer role is full");
  await assert.rejects(
    api.performVolunteerAction("event", { type: "apply", roleId: "role" }),
    /role is full/,
  );
  requestError = undefined;
});

const invalidated = [];
const queryKeys = loadTypeScript("services/queryKeys.ts");
let mutationConfig;
const mutationHooks = loadTypeScript("services/mutations.ts", {
  "@/context/AuthContext": { useAuth: () => ({}) },
  "@/utils/globalErrorHandler": { showGlobalError() {} },
  "@/utils/storage": { saveItem() {} },
  "./serviceFn": api,
  "./queryKeys": queryKeys,
  "@tanstack/react-query": {
    useQueryClient: () => ({
      invalidateQueries: async ({ queryKey }) => {
        invalidated.push(queryKey);
      },
    }),
    useMutation: (config) => {
      mutationConfig = config;
      return config;
    },
  },
});

test("a volunteer change refreshes places, roster, summary, history and event details", async () => {
  invalidated.length = 0;
  let callbackRan = false;
  mutationHooks.useVolunteerAction("event", {
    onSuccess: () => {
      callbackRan = true;
    },
  });
  await mutationConfig.onSuccess(response, {
    type: "withdraw",
    applicationId: "application",
  });
  for (const key of [
    "volunteerRoles",
    "volunteerRoster",
    "volunteerSummary",
    "eventDetails",
  ]) {
    assert.ok(
      invalidated.some(
        (queryKey) =>
          JSON.stringify(queryKey) ===
          JSON.stringify([queryKeys.QUERY_KEYS[key], "event"]),
      ),
    );
  }
  assert.ok(
    invalidated.some(
      (queryKey) => queryKey === queryKeys.QUERY_KEYS.volunteerHistory,
    ),
  );
  assert.equal(callbackRan, true);
});

test("event edits refresh fundraising and volunteer eligibility before returning to details", async () => {
  invalidated.length = 0;
  let refreshCountAtSuccess;
  mutationHooks.useUpdateEvent("event", {
    onSuccess: () => {
      refreshCountAtSuccess = invalidated.length;
    },
  });
  await mutationConfig.onSuccess(response, new FormData());
  assert.ok(
    invalidated.some(
      (queryKey) =>
        JSON.stringify(queryKey) ===
        JSON.stringify([queryKeys.QUERY_KEYS.eventDetails, "event"]),
    ),
  );
  assert.equal(refreshCountAtSuccess, invalidated.length);
  assert.ok(refreshCountAtSuccess > 0);
});

test("ticket and registration payloads do not enable hidden optional donations", () => {
  for (const registrationType of ["ticket", "registration"]) {
    const parsed = eventSchema.parse({
      ...event,
      registrationType,
      impactTitle: "Plant trees",
      donationsEnabled: true,
      donationTarget: 500000,
    });
    const payload = buildEventParticipationFormFields(parsed, "create");
    assert.equal(payload.donationsEnabled, false);
    assert.equal("donationTarget" in payload, false);
  }
});

test("all participation modes require story text before recruiting volunteers", () => {
  for (const registrationType of [
    "ticket",
    "registration",
    "donation",
    "volunteer",
  ]) {
    for (const impactDescription of ["", "   "]) {
      const result = eventSchema.safeParse({
        ...event,
        registrationType,
        donationTarget: 500000,
        impactTitle: "Restore green spaces",
        impactDescription,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.error.issues.some(
          (issue) =>
            issue.path[0] === "impactDescription" &&
            /impact story/.test(issue.message),
        ),
      );
    }
    assert.equal(
      eventSchema.safeParse({
        ...event,
        registrationType,
        donationTarget: 500000,
      }).success,
      true,
    );
  }
});

test("registration completion refreshes owned registrations and event details before returning to the screen", async () => {
  invalidated.length = 0;
  let refreshed = false;
  mutationHooks.useRegisterEvent({
    onSuccess: () => {
      refreshed = invalidated.length === 2;
    },
  });
  await mutationConfig.onSuccess(response, {
    eventId: "event",
    idempotencyKey: "key",
  });
  assert.ok(
    invalidated.some((key) => key === queryKeys.QUERY_KEYS.myRegistrations),
  );
  assert.ok(
    invalidated.some(
      (key) =>
        JSON.stringify(key) ===
        JSON.stringify([queryKeys.QUERY_KEYS.eventDetails, "event"]),
    ),
  );
  assert.equal(refreshed, true);
});
