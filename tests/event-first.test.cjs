const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const { eventSchema } = loadTypeScript("schemas/event.ts");
const { buildEventImpactFormFields } = loadTypeScript("utils/eventForm.ts");
const { normalizePersistedImpactMap } = loadTypeScript("constants/impact.ts");
const { EVENT_INTEREST_GROUPS } = loadTypeScript("constants/eventInterests.ts");

const generalEvent = {
  eventName: "Comedy Night",
  description: "An evening of stand-up comedy.",
  tags: ["Nightlife"],
  repeat: "NONE",
  startDate: new Date("2030-01-01T18:00:00Z"),
  endDate: new Date("2030-01-01T21:00:00Z"),
  startTime: "18:00",
  endTime: "21:00",
  isRecurring: false,
  isPhysicalEvent: true,
  location: "Lagos",
  links: [],
  registrationType: "registration",
  registrationFee: 0,
  registrationAttendees: 50,
};

test("an ordinary event can be submitted without an impact story", () => {
  const event = eventSchema.parse(generalEvent);
  assert.equal(event.description, generalEvent.description);
  assert.equal(event.impactDescription, "");
  assert.equal(event.impactTitle, "");
  assert.deepEqual(event.tags, ["Nightlife"]);
});

test("the event description is required independently of the impact story", () => {
  const result = eventSchema.safeParse({
    ...generalEvent,
    description: "  ",
    impactDescription: "Supporting local artists.",
  });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "description");
});

test("a story does not invent an impact title, map, or commitments", () => {
  const event = eventSchema.parse({
    ...generalEvent,
    impactDescription: "Supporting local artists.",
  });
  const fields = buildEventImpactFormFields(event);
  assert.equal(fields.impactDescription, "Supporting local artists.");
  assert.equal(fields.impactTitle, "");
  assert.equal(fields.impactSdgGoals, "[]");
  assert.equal(fields.impactPaths, "[]");
  assert.equal(fields.impactCommitments, "[]");
  assert.equal(fields.impactMapGeneratedAt, undefined);
});

test("only the organiser-selected map is saved", () => {
  const path = {
    id: "skills_training",
    title: "Skills Training",
    summaryLabel: "Skills training",
  };
  const event = eventSchema.parse({
    ...generalEvent,
    impactDescription: "Free skills training for young people.",
    impactPaths: [path],
  });
  const fields = buildEventImpactFormFields(event);
  assert.deepEqual(JSON.parse(fields.impactPaths), [path]);
  assert.equal(fields.impactSdgGoals, "[]");
  assert.equal(fields.impactCommitments, "[]");
  assert.equal(fields.impactMapSource, "manual");
});

test("removing a story explicitly clears the saved map", () => {
  const fields = buildEventImpactFormFields(eventSchema.parse(generalEvent));
  assert.equal(fields.impactTitle, "");
  assert.equal(fields.impactDescription, "");
  assert.equal(fields.impactSdgGoals, "[]");
  assert.equal(fields.impactPaths, "[]");
  assert.equal(fields.impactCommitments, "[]");
  assert.equal(fields.impactMapSource, "");
});

test("public event maps do not infer goals from an omitted map", () => {
  assert.deepEqual(
    normalizePersistedImpactMap({
      impactSdgGoals: null,
      impactPaths: null,
      impactCommitments: null,
    }),
    {
      sdgGoals: [],
      impactPaths: [],
      commitments: [],
    },
  );
});

test("unselected sections stay empty when another map section was selected", () => {
  const path = {
    id: "skills_training",
    title: "Skills Training",
    summaryLabel: "Skills training",
  };
  const map = normalizePersistedImpactMap({
    impactPaths: [path],
    impactSdgGoals: [],
    impactCommitments: [],
  });
  assert.deepEqual(map.impactPaths, [path]);
  assert.deepEqual(map.sdgGoals, []);
  assert.deepEqual(map.commitments, []);
});

test("event creation and preferences share music and nightlife interests", () => {
  const interests = EVENT_INTEREST_GROUPS.flatMap((group) => group.items);
  assert.ok(interests.includes("Music"));
  assert.ok(interests.includes("Concert"));
  assert.ok(interests.includes("Nightlife"));
});
