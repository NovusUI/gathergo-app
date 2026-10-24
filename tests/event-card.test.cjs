const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const { default: EventCard } = loadTypeScript("components/ui/EventCard.tsx", {
  "@/components/ui/ArtworkFallback": { EventArtworkFallback: "Artwork" },
  "@/components/ui/SdgGoalIcon": { SdgGoalIcon: "GoalIcon" },
  "@/hooks/usePressGuard": { usePressGuard: (callback) => callback },
  "expo-image": { Image: "Image" },
  "lucide-react-native": {
    HandHeart: "HeartIcon",
    MapPin: "LocationIcon",
    PenLine: "RegistrationIcon",
    Ticket: "TicketIcon",
  },
  react: {
    useState: (initial) => [initial, () => {}],
    useEffect() {},
  },
  "react-native": { Text: "Text", TouchableOpacity: "Button", View: "View" },
  twrnc: { default: () => ({}) },
});

const event = {
  id: "comedy-night",
  title: "Comedy Night",
  description: "An evening of stand-up comedy with local performers.",
  location: "Victoria Island, Lagos",
  registrationType: "registration",
  registrationFee: 0,
  startDate: "2030-01-01T18:00:00Z",
};

function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}

test("ordinary event cards show their description and location and still open the event", () => {
  let opened = false;
  const card = EventCard({
    ...event,
    onPress: () => {
      opened = true;
    },
  });
  const content = [...nodes(card)];
  const summary = content.find(
    (node) => node.props.children === event.description,
  );
  assert.ok(summary);
  assert.equal(summary.props.numberOfLines, 2);
  assert.ok(content.some((node) => node.props.children === event.location));
  assert.ok(content.some((node) => node.props.children === "Free"));
  assert.equal(
    content.some(
      (node) => node.type === "GoalIcon" || node.type === "HeartIcon",
    ),
    false,
  );
  card.props.onPress();
  assert.equal(opened, true);
});

test("impact event cards keep their impact summary and show the event location", () => {
  const card = EventCard({ ...event, impactTitle: "Supporting local artists" });
  const content = [...nodes(card)];
  assert.ok(
    content.some((node) => node.props.children === "Supporting local artists"),
  );
  assert.ok(content.some((node) => node.props.children === event.location));
  assert.equal(
    content.some((node) => node.props.children === event.description),
    false,
  );
});

test("cards omit missing optional details without inventing a location or impact content", () => {
  const card = EventCard({ ...event, description: null, location: null });
  const content = [...nodes(card)];
  assert.ok(content.some((node) => node.props.children === event.title));
  assert.ok(content.some((node) => node.props.children === "Free"));
  assert.equal(
    content.some(
      (node) =>
        node.type === "LocationIcon" ||
        node.type === "GoalIcon" ||
        node.type === "HeartIcon",
    ),
    false,
  );
});
