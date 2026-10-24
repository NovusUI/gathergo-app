const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const urls = loadTypeScript("components/gogo/services/urls.ts", {
  "@/constants/network": { API_BASE_URL: "https://gathergo.example/api/v1" },
});
let receive;
const api = loadTypeScript("components/gogo/services/api.ts", {
  "@/api/client": { default: { post: (...args) => receive(...args) } },
  "./urls": urls,
});
const eventDraft = {
  eventType: "general",
  timeZone: "Africa/Lagos",
  messages: [{ role: "user", content: "A morning in the park" }],
  draft: { registrationType: "registration", ticketCount: 0, volunteerRoleCount: 0, impactMapCount: 0, hasImpactGoalOrPath: false },
  addressedSections: [],
};

test("Gogo's task requests retain the inspected API routes, draft context and cancellation signal", async () => {
  const signal = new AbortController().signal;
  const cases = [
    {
      send: api.getEventCreationReply,
      path: "/events/creation-assistant",
      payload: eventDraft,
      result: {
        data: {
          reply: "Where will people meet?",
          choices: [],
          section: "Location",
          completedSection: null,
          suggestedImpactStory: null,
          updates: {},
        },
      },
    },
    {
      send: api.getImpactSuggestions,
      path: "/impact/suggestions",
      payload: { impactDescription: "Plant 100 trees in the park." },
      result: {
        data: { sdgGoals: [], impactPaths: [], commitments: [], source: "ai" },
      },
    },
  ];
  for (const { send, path, payload, result } of cases) {
    receive = (url, body, options) => {
      assert.equal(url, "https://gathergo.example/api/v1" + path);
      assert.strictEqual(body, payload);
      assert.strictEqual(options.signal, signal);
      return { data: result };
    };
    assert.strictEqual(await send(payload, signal), result);
  }
});

test("Gogo task requests propagate server failures without a fabricated reply", async () => {
  const failure = new Error("Gogo is unavailable");
  receive = () => Promise.reject(failure);
  await assert.rejects(
    api.getEventCreationReply(eventDraft, new AbortController().signal),
    (error) => error === failure,
  );
  await assert.rejects(
    api.getImpactSuggestions({}),
    (error) => error === failure,
  );
});

let query;
const { useImpactSuggestions } = loadTypeScript(
  "components/gogo/tasks/impactSuggestions/useImpactSuggestions.ts",
  {
    "@/components/gogo/services/api": api,
    "@tanstack/react-query": {
      useQuery: (options) => {
        query = options;
        return options;
      },
    },
  },
);
test("the anchored impact task keeps its cache key and sends only the supplied draft", async () => {
  const draft = { impactDescription: "Plant 100 trees." };
  const signal = new AbortController().signal;
  useImpactSuggestions(draft, { enabled: false });
  assert.deepEqual(query.queryKey, ["impactSuggestions", "ai", draft]);
  assert.equal(query.enabled, false);
  assert.equal(query.retry, false);
  receive = (_url, body, options) => {
    assert.strictEqual(body, draft);
    assert.strictEqual(options.signal, signal);
    return {
      data: {
        data: { sdgGoals: [], impactPaths: [], commitments: [], source: "ai" },
      },
    };
  };
  await query.queryFn({ signal });
});
