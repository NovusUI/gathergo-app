const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const tw = strings => ({ classes: strings.join("") });
const native = { Text: "Text", View: "View", TouchableOpacity: "Button" };
const { default: Badge } = loadTypeScript("components/carpool/CarpoolFollowBadge.tsx", {
  "lucide-react-native": { UserRoundCheck: "FollowingIcon", UserRoundPlus: "FollowerIcon", UsersRound: "MutualIcon" },
  "react-native": native,
  twrnc: { default: tw },
});
const { default: MembershipBadge } = loadTypeScript("components/carpool/CarpoolMembershipBadge.tsx", {
  "@expo/vector-icons": { Ionicons: "MembershipIcon" },
  "react-native": native,
  twrnc: { default: tw },
});
const { default: Card } = loadTypeScript("components/ui/CarpoolCard.tsx", {
  "@/components/carpool/CarpoolFollowBadge": { default: Badge },
  "@/components/carpool/CarpoolMembershipBadge": { default: MembershipBadge },
  "@expo/vector-icons": { Ionicons: "VehicleIcon" },
  "@/utils/dateTimeHandler": { formatShortDate: () => "Oct 29" },
  "@/utils/utils": { formatTo12Hour: () => "9:00 am" },
  "react-native": native,
  twrnc: { default: tw },
});
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  if (node.type === Badge) { yield* nodes(Badge(node.props)); return; }
  if (node.type === MembershipBadge) { yield* nodes(MembershipBadge()); return; }
  for (const child of [node.props.children].flat(Infinity)) yield* nodes(child);
}
for (const [isFollowingDriver, isFollowedByDriver, label, icon] of [
  [true, false, "Following", "FollowingIcon"],
  [false, true, "Follower", "FollowerIcon"],
  [true, true, "Mutual follow", "MutualIcon"],
]) {
  test(`${label} shows its matching icon and one accessible relationship tag`, () => {
    const tree = Badge({ isFollowing: isFollowingDriver, isFollowedBy: isFollowedByDriver });
    assert.ok(tree.props.accessibilityLabel.startsWith(label));
    assert.equal([...nodes(tree)].filter(node => node.type === "Text").length, 1);
    assert.ok([...nodes(tree)].some(node => node.props.children === label));
    assert.ok([...nodes(tree)].some(node => node.type === icon));
  });
}
test("unrelated poolers have no relationship tag", () => {
  assert.equal(Badge({ isFollowing: false, isFollowedBy: false }), null);
});
test("carpool cards show the relationship while preserving their open-ride action", () => {
  let opened = 0;
  const tree = Card({ id: "ride", title: "Park day", startDate: "2035-01-01T09:00:00Z", pickupLocation: "Yaba", departureTime: "09:00", poolerUsername: "ada", isFollowingDriver: true, isFollowedByDriver: true, onPress: () => opened++ });
  assert.ok([...nodes(tree)].some(node => node.props.children === "Mutual follow"));
  tree.props.onPress();
  assert.equal(opened, 1);
});
test("member rides have a distinct card color and a visible membership label", () => {
  const props = { id: "ride", title: "Park day", startDate: "2035-01-01T09:00:00Z", pickupLocation: "Yaba", departureTime: "09:00", isFollowingDriver: true, isFollowedByDriver: false };
  const normal = Card({ ...props, isMember: false });
  const joined = Card({ ...props, isMember: true });
  assert.notDeepEqual(joined.props.style, normal.props.style);
  assert.ok([...nodes(joined)].some(node => node.props.children === "Your ride"));
  assert.equal([...nodes(normal)].some(node => node.props.children === "Your ride"), false);
});

let mutation;
const invalidations = [];
const { useFollowUser, useUnfollowUser, useCreateCarpool, useCarpoolRequestRes, useRemovePassenger, useLeaveCarpool, useRequestCarpoolAfterCancel } = loadTypeScript("services/mutations.ts", {
  "@/context/AuthContext": { useAuth: () => ({}) },
  "@/utils/globalErrorHandler": { showGlobalError() {} },
  "@/utils/storage": { saveItem() {} },
  "./serviceFn": { followUser() {}, unfollowUser() {} },
  "./queryKeys": loadTypeScript("services/queryKeys.ts"),
  "@tanstack/react-query": {
    useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => { invalidations.push(queryKey); } }),
    useMutation: options => { mutation = options; return {}; },
  },
});
test("following and unfollowing refresh both card lists and retain caller callbacks", async () => {
  for (const follow of [true, false]) {
    invalidations.length = 0;
    let continued = 0;
    const options = { onSuccess: () => continued++ };
    if (follow) useFollowUser(options);
    else useUnfollowUser("pooler", options);
    await mutation.onSuccess({ status: "success" }, { followingId: "pooler" });
    assert.deepEqual(invalidations, [[["carpoolForYou"]], [["eventCarpoolsPaginated"]], [["carpoolDetails"]]]);
    assert.equal(continued, 1);
  }
});
test("membership changes refresh card colors after creating, accepting, leaving or removing a rider", async () => {
  for (const hook of [useCreateCarpool, useCarpoolRequestRes, useRemovePassenger, useLeaveCarpool, useRequestCarpoolAfterCancel]) {
    invalidations.length = 0;
    let continued = 0;
    const options = { onSuccess: () => continued++ };
    if (hook === useCreateCarpool) hook(options);
    else hook("ride-or-request", options);
    await mutation.onSuccess({ status: "success" }, "ACCEPTED");
    assert.deepEqual(invalidations, [[["carpoolForYou"]], [["eventCarpoolsPaginated"]]]);
    assert.equal(continued, 1);
  }
});
