const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let query;
let enabled;
const { useFreeEventRegistration: checkFreeRegistration } = loadTypeScript(
  "hooks/useFreeEventRegistration.ts",
  {
    "@/services/queries": {
      useMyRegistrations: (options) => {
        enabled = options.enabled;
        return query;
      },
    },
  },
);
const event = {
  id: "event",
  registrationType: "registration",
  registrationFee: 0,
};
const registration = { id: "registration", eventId: "event" };
function reset(overrides = {}) {
  query = {
    isSuccess: true,
    isPending: false,
    isFetching: false,
    isError: false,
    data: { data: [] },
    refetch() {},
    ...overrides,
  };
}

test("a free registration is checked against existing owned places", () => {
  reset({
    data: {
      data: [{ id: "other-place", eventId: "other-event" }, registration],
    },
  });
  const result = checkFreeRegistration(event);
  assert.equal(enabled, true);
  assert.equal(result.registration, registration);
  assert.equal(result.isPending, false);
  assert.equal(result.isError, false);
});

test("a successful empty lookup permits a new free registration", () => {
  reset();
  const result = checkFreeRegistration(event);
  assert.equal(result.registration, undefined);
  assert.equal(result.isPending, false);
  assert.equal(result.isError, false);
});

test("a registration check remains pending until the server responds", () => {
  reset({ isSuccess: false, isPending: true, data: undefined });
  const result = checkFreeRegistration(event);
  assert.equal(result.isPending, true);
  assert.equal(result.registration, undefined);
});

test("failed checks expose a retry instead of silently allowing duplicate registration", () => {
  let retried = false;
  reset({
    isSuccess: false,
    isError: true,
    data: undefined,
    refetch: () => {
      retried = true;
    },
  });
  const result = checkFreeRegistration(event);
  assert.equal(result.isError, true);
  result.refetch();
  assert.equal(retried, true);
});

test("only free attendee registration uses the owned-place lookup", () => {
  reset({ isSuccess: false, isPending: true, data: undefined });
  checkFreeRegistration({ ...event, registrationFee: null });
  assert.equal(enabled, true);
  for (const value of [
    undefined,
    { ...event, registrationFee: 1000 },
    ...["ticket", "donation", "volunteer"].map((registrationType) => ({
      ...event,
      registrationType,
    })),
  ]) {
    const result = checkFreeRegistration(value);
    assert.equal(enabled, false);
    assert.equal(result.isPending, false);
    assert.equal(result.isError, false);
    assert.equal(result.registration, undefined);
  }
});

test("a cached empty list is rechecked before allowing a free registration", () => {
  reset({ isFetching: true });
  const result = checkFreeRegistration(event);
  assert.equal(result.isPending, true);
  assert.equal(result.registration, undefined);
});
