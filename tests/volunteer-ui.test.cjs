const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const state = {};
const refreshComponents = { default: "RefreshScrollView", RefreshIndicator: "RefreshIndicator" };
const { default: WithdrawApplicationButton } = loadTypeScript(
  "components/volunteer/WithdrawApplicationButton.tsx",
  {
    "@/components/buttons/CustomBtn1": { default: "ActionButton" },
    "@/services/mutations": {
      useVolunteerAction: (eventId, options) => ({
        isPending: state.withdrawPending,
        mutate: (action) => {
          state.withdrawEventId = eventId;
          state.action = action;
          state.options = options;
        },
      }),
    },
    "@/utils/globalErrorHandler": {
      showGlobalSuccess: (message) => state.messages.push(message),
    },
  },
);
const { default: SheetCloseButton } = loadTypeScript(
  "components/buttons/SheetCloseButton.tsx",
  {
    "@/hooks/usePressGuard": { usePressGuard: (callback) => callback },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native": { TouchableOpacity: "Button" },
    twrnc: { default: () => ({}) },
  },
);
const { default: VolunteerRolesSheet } = loadTypeScript(
  "components/volunteer/VolunteerRolesSheet.tsx",
  {
    "@/components/ui/AppLoader": { default: "Spinner" },
    "@/components/volunteer/WithdrawApplicationButton": {
      default: WithdrawApplicationButton,
    },
    "@/components/buttons/SheetCloseButton": { default: SheetCloseButton },
    "@/components/ui/AppToast": { default: "Toast" },
    "@/components/buttons/CustomBtn1": { default: "ActionButton" },
    "@/components/volunteer/VolunteerButton": { default: "VolunteerAction" },
    "@/components/inputs/CustomInput1": { default: "Input" },
    "@/services/queries": { useVolunteerRoles: () => state.query },
    "@/services/mutations": {
      useVolunteerAction: () => ({
        isPending: false,
        mutate: (action, options) => {
          state.action = action;
          state.options = options;
        },
      }),
    },
    "@/utils/globalErrorHandler": {
      showGlobalSuccess: (message) => state.messages.push(message),
    },
    "@/utils/navigation": {
      useLockedRouter: () => ({ push: (route) => state.routes.push(route) }),
    },
    react: { useState: (initial) => [initial, () => {}] },
    "react-native": {
      KeyboardAvoidingView: "KeyboardAvoidingView",
      Modal: "Modal",
      Platform: { OS: "ios" },
      ScrollView: "ScrollView",
      Text: "Text",
      TouchableOpacity: "Button",
      View: "View",
    },
    twrnc: { default: () => ({}) },
  },
);

const role = {
  id: "role",
  eventId: "event",
  title: "Tree planters",
  description: "Help plant trees.",
  capacity: 2,
  requiresApproval: true,
  isOpen: true,
  _count: { applications: 0 },
  applications: [],
};
const event = {
  id: "event",
  registrationType: "volunteer",
  isPhysicalEvent: true,
  impactDescription: "Restore green spaces for the community.",
  startDate: "2030-01-01T10:00:00Z",
  endDate: "2030-01-01T12:00:00Z",
  volunteerRoles: [role],
};
function reset(overrides = {}) {
  Object.assign(state, {
    messages: [],
    routes: [],
    withdrawPending: false,
    withdrawEventId: undefined,
    action: undefined,
    options: undefined,
    query: {
      isPending: false,
      isError: false,
      data: { data: [role] },
      refetch() {
        state.retried = true;
      },
    },
    retried: false,
    ...overrides,
  });
}
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
function opportunity(overrides = {}) {
  const screen = VolunteerRolesSheet({
    event,
    owner: false,
    onClose() {},
    ...overrides,
  });
  const child = [...nodes(screen)].find(
    (node) =>
      typeof node.type === "function" &&
      node.type.name === "VolunteerOpportunity",
  );
  return child.type(child.props);
}

test("applying does not claim a confirmed place before the server responds", () => {
  reset();
  const button = [...nodes(opportunity())].find(
    (node) => node.type === "ActionButton",
  );
  assert.equal(button.props.title, "Apply to volunteer");
  button.props.onPress();
  assert.deepEqual(state.action, { type: "apply", roleId: "role" });
  assert.deepEqual(state.messages, []);
  state.options.onSuccess({ data: { status: "APPLIED" } });
  assert.match(state.messages[0], /awaiting approval/);
});

test("automatic acceptance still follows the returned application status", () => {
  reset();
  state.query.data.data = [{ ...role, requiresApproval: false }];
  const button = [...nodes(opportunity())].find(
    (node) => node.type === "ActionButton",
  );
  assert.equal(button.props.title, "Join as volunteer");
  button.props.onPress();
  state.options.onSuccess({ data: { status: "ACCEPTED" } });
  assert.match(state.messages[0], /place is confirmed/);
});

test("full roles and pending applications do not offer another join action", () => {
  reset();
  state.query.data.data = [{ ...role, _count: { applications: 2 } }];
  assert.equal(
    [...nodes(opportunity())].some((node) => node.type === "ActionButton"),
    false,
  );
  state.query.data.data = [
    {
      ...role,
      applications: [
        {
          id: "application",
          status: "APPLIED",
          roleId: "role",
          confirmedMinutes: null,
        },
      ],
    },
  ];
  assert.equal(
    [...nodes(opportunity())].some((node) => node.type === "ActionButton"),
    false,
  );
});

test("role loading and errors expose their real state and a retry control", () => {
  reset();
  state.query.isPending = true;
  assert.ok(
    [...nodes(VolunteerRolesSheet({ event, owner: false, onClose() {} }))].some(
      (node) => node.type === "Spinner",
    ),
  );
  reset();
  state.query.isError = true;
  const retry = [
    ...nodes(VolunteerRolesSheet({ event, owner: false, onClose() {} })),
  ].find((node) => node.props.accessibilityLabel === "Retry volunteer roles");
  retry.props.onPress();
  assert.equal(state.retried, true);
});

const { default: EventVolunteering } = loadTypeScript(
  "components/volunteer/EventVolunteering.tsx",
  {
    "@/hooks/usePressGuard": { usePressGuard: (callback) => callback },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native": { FlatList: "FeedList", Text: "Text", TouchableOpacity: "Button", View: "View" },
    twrnc: { default: () => ({}) },
  },
);

test("Give your time opens the role list without rendering roles on the event page", () => {
  let opened = false;
  const card = EventVolunteering({
    event,
    owner: false,
    onPress: () => {
      opened = true;
    },
  });
  assert.equal(card.type, "Button");
  assert.equal(card.props.accessibilityLabel, "Give your time");
  assert.equal(
    [...nodes(card)].some(
      (node) => node.type === "ActionButton" || node.type === "Modal",
    ),
    false,
  );
  card.props.onPress();
  assert.equal(opened, true);
  assert.equal(
    EventVolunteering({
      event: { ...event, volunteerRoles: [] },
      owner: false,
      onPress() {},
    }),
    null,
  );
});

test("the role sheet can be closed with its icon or the system back action", () => {
  reset();
  let closed = 0;
  const sheet = VolunteerRolesSheet({
    event,
    owner: false,
    onClose: () => {
      closed += 1;
    },
  });
  assert.equal(sheet.type, "Modal");
  assert.equal(sheet.props.visible, true);
  const close = [...nodes(sheet)].find(
    (node) => node.props.accessibilityLabel === "Close volunteer roles",
  );
  close.props.onPress();
  sheet.props.onRequestClose();
  assert.equal(closed, 2);
});

test("organisers can close the roles sheet and open management when no roles are published", () => {
  reset();
  state.query.data.data = [];
  let closed = false;
  const sheet = VolunteerRolesSheet({
    event: { ...event, volunteerRoles: [] },
    owner: true,
    onClose: () => {
      closed = true;
    },
  });
  assert.ok(
    [...nodes(sheet)].some(
      (node) =>
        node.props.children === "No volunteer roles have been published yet.",
    ),
  );
  const manage = [...nodes(sheet)].find(
    (node) => node.type === "VolunteerAction",
  );
  assert.equal(manage.props.purpose, "manage");
  manage.props.onPress();
  assert.equal(closed, true);
  assert.deepEqual(state.routes, [
    { pathname: "/volunteers/[id]", params: { id: event.id } },
  ]);
});

const formValues = {};
const volunteerWarnings = [];
let previousPricing;
let activeRoleEditor;
// Field-array mutations render before useWatch receives its next effect notification.
let watchedVolunteerRoles;
const roleDraft = {
  title: role.title,
  description: role.description,
  capacity: role.capacity,
  requiresApproval: role.requiresApproval,
};
const { default: VolunteerSetupFields } = loadTypeScript(
  "components/eventInfo/VolunteerSetupFields.tsx",
  {
    "@/utils/globalErrorHandler": {
      showGlobalWarning: (message) => volunteerWarnings.push(message),
    },
    "@/components/CustomSwitcher": { default: "Switch" },
    "@/components/volunteer/VolunteerRoleSheet": { default: "RoleSheet" },
    "react-hook-form": {
      useWatch: ({ name }) =>
        Array.isArray(name)
          ? name.map((key) =>
              key === "volunteerRoles" && watchedVolunteerRoles !== undefined
                ? watchedVolunteerRoles
                : formValues[key],
            )
          : formValues[name],
      useFormState: () => ({ errors: {} }),
      useFieldArray: () => ({
        fields: formValues.volunteerRoles,
        update: (index, value) => {
          formValues.volunteerRoles[index] = value;
        },
        append: (value) => formValues.volunteerRoles.push(value),
        remove: (index) => formValues.volunteerRoles.splice(index, 1),
      }),
    },
    react: {
      useRef: () => previousPricing,
      useState: () => [
        activeRoleEditor,
        (value) => {
          activeRoleEditor = value;
        },
      ],
    },
    "react-native": { FlatList: "FeedList", Text: "Text", TouchableOpacity: "Button", View: "View" },
    twrnc: { default: () => ({}), style: () => ({}) },
  },
);
const formProps = {
  control: {},
  setValue: (key, value) => {
    formValues[key] = value;
  },
};
function resetForm(overrides = {}) {
  volunteerWarnings.length = 0;
  Object.assign(formValues, {
    registrationType: "registration",
    isPhysicalEvent: true,
    impactTitle: "",
    impactDescription: "",
    volunteerRoles: [],
    donationsEnabled: false,
    donationTarget: undefined,
    ...overrides,
  });
  previousPricing = { current: "registration" };
  activeRoleEditor = null;
  watchedVolunteerRoles = undefined;
}
function volunteerOnlySwitch() {
  return [...nodes(VolunteerSetupFields(formProps))].find(
    (node) => node.type === "Switch",
  );
}

function roleEditor() {
  return [...nodes(VolunteerSetupFields(formProps))].find(
    (node) => node.type === "RoleSheet",
  );
}

test("a volunteer-only event adds roles without another participation selector", () => {
  resetForm({ registrationType: "volunteer", impactDescription: "Restore green spaces together." });
  assert.equal(volunteerOnlySwitch(), undefined);
  const add = [...nodes(VolunteerSetupFields(formProps))].find(node => node.type === "Button" && [...nodes(node)].some(child => child.props.children === "+ Add volunteer role"));
  add.props.onPress();
  assert.equal(roleEditor().props.initialValue, undefined);
  roleEditor().props.onSave(roleDraft);
  assert.deepEqual(formValues.volunteerRoles, [roleDraft]);
  assert.equal(formValues.registrationType, "volunteer");
});


test("a newly saved volunteer role renders before the watched array catches up", () => {
  resetForm({ registrationType: "volunteer", impactDescription: "Restore green spaces together." });
  watchedVolunteerRoles = [];
  const add = [...nodes(VolunteerSetupFields(formProps))].find(
    (node) => node.type === "Button" && node.props.accessibilityState,
  );
  add.props.onPress();
  roleEditor().props.onSave(roleDraft);

  const content = [...nodes(VolunteerSetupFields(formProps))];
  assert.ok(content.some((node) => node.props.children === roleDraft.title));
  assert.ok(content.some((node) => node.props.children === roleDraft.description));
  assert.ok(content.some((node) => Array.isArray(node.props.children) &&
    node.props.children[0] === roleDraft.capacity &&
    node.props.children.includes("Approval required")));
  content.find((node) => node.props.accessibilityLabel === "Edit volunteer role 1").props.onPress();
  assert.deepEqual(roleEditor().props.initialValue, roleDraft);
});

test("an edited volunteer role displays and reopens its latest values before watch catches up", () => {
  resetForm({
    registrationType: "volunteer",
    impactDescription: "Restore green spaces together.",
    volunteerRoles: [{ ...roleDraft }],
  });
  watchedVolunteerRoles = [...formValues.volunteerRoles];
  const edit = () => [...nodes(VolunteerSetupFields(formProps))].find(
    (node) => node.props.accessibilityLabel === "Edit volunteer role 1",
  );
  edit().props.onPress();
  const updated = {
    title: "Welcome team",
    description: "Help neighbours find their planting group.",
    capacity: 5,
    requiresApproval: false,
  };
  roleEditor().props.onSave(updated);

  const content = [...nodes(VolunteerSetupFields(formProps))];
  assert.ok(content.some((node) => node.props.children === updated.title));
  assert.ok(content.some((node) => node.props.children === updated.description));
  assert.ok(content.some((node) => Array.isArray(node.props.children) &&
    node.props.children[0] === updated.capacity &&
    node.props.children.includes("Automatic acceptance")));
  edit().props.onPress();
  assert.deepEqual(roleEditor().props.initialValue, updated);
});

test("removing a volunteer role keeps the remaining card and editor aligned before watch catches up", () => {
  const second = { ...roleDraft, title: "Welcome team", capacity: 4 };
  resetForm({
    registrationType: "volunteer",
    impactDescription: "Restore green spaces together.",
    volunteerRoles: [{ ...roleDraft }, second],
  });
  watchedVolunteerRoles = [...formValues.volunteerRoles];
  const remove = () => [...nodes(VolunteerSetupFields(formProps))].find(
    (node) => node.props.accessibilityLabel === "Remove volunteer role 1",
  );
  remove().props.onPress();

  const content = [...nodes(VolunteerSetupFields(formProps))];
  assert.ok(content.some((node) => node.props.children === second.title));
  assert.equal(content.some((node) => node.props.children === roleDraft.title), false);
  content.find((node) => node.props.accessibilityLabel === "Edit volunteer role 1").props.onPress();
  assert.deepEqual(roleEditor().props.initialValue, second);
  roleEditor().props.onClose();
  remove().props.onPress();
  assert.deepEqual(formValues.volunteerRoles, []);
  assert.equal([...nodes(VolunteerSetupFields(formProps))].some(
    (node) => node.props.accessibilityLabel === "Edit volunteer role 1",
  ), false);
});

test("other event types have no volunteer setup, cards or actions even with impact and saved roles", () => {
  for (const registrationType of ["ticket", "registration", "donation"]) {
    resetForm({
      registrationType,
      impactDescription: "Restore green spaces together.",
      volunteerRoles: [role],
    });
    assert.equal(VolunteerSetupFields(formProps), null);
    assert.equal(VolunteerSetupFields({ ...formProps, editMode: true }), null);
    const otherEvent = { ...event, registrationType };
    assert.equal(EventVolunteering({ event: otherEvent, owner: false, onPress() {} }), null);
    assert.equal(EventVolunteering({ event: otherEvent, owner: true, onPress() {} }), null);
    for (const purpose of ["volunteer", "manage"]) {
      assert.equal(VolunteerButton({ event: otherEvent, purpose, hasEventEnded: false, onPress() {} }), null);
    }
  }
});

test("volunteer setup respects physical events and the existing event type when editing", () => {
  resetForm({ isPhysicalEvent: false });
  assert.equal(VolunteerSetupFields(formProps), null);
  resetForm({ registrationType: "donation" });
  assert.equal(volunteerOnlySwitch(), undefined);
  resetForm({
    registrationType: "volunteer",
    volunteerRoles: [role],
    impactDescription: "Restore green spaces together.",
  });
  const edit = VolunteerSetupFields({
    ...formProps,
    editMode: true,
    onManage() {},
  });
  assert.equal([...nodes(edit)].some(node => node.type === "Switch"), false);
  assert.ok([...nodes(edit)].some(node => node.props.children === "Manage volunteer roles and applications"));
  assert.equal(formValues.registrationType, "volunteer");
});

const { default: EventFundraisingFields } = loadTypeScript(
  "components/eventInfo/EventFundraisingFields.tsx",
  {
    "@/components/CustomSwitcher": { default: "Switch" },
    "@/components/inputs/CustomInput1": { default: "Input" },
    "react-hook-form": {
      useWatch: ({ name }) => name.map((key) => formValues[key]),
      Controller: "Controller",
    },
    "react-native": { Text: "Text", View: "View" },
    twrnc: { default: () => ({}) },
  },
);

test("optional donations appear only for volunteer-only events", () => {
  for (const registrationType of ["ticket", "registration", "donation"]) {
    resetForm({ registrationType, donationsEnabled: true });
    assert.equal(EventFundraisingFields(formProps), null);
  }
  resetForm({ registrationType: "volunteer" });
  const toggle = [...nodes(EventFundraisingFields(formProps))].find(
    (node) => node.type === "Switch",
  );
  toggle.props.setIsEnabled(true);
  assert.equal(formValues.donationsEnabled, true);
});

const { default: VolunteerButton } = loadTypeScript(
  "components/volunteer/VolunteerButton.tsx",
  {
    "@/components/buttons/CustomBtn1": { default: "ActionButton" },
    "@/hooks/usePressGuard": { usePressGuard: (fn) => fn },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native": { Text: "Text", TouchableOpacity: "Button" },
    twrnc: { default: () => ({}) },
  },
);

test("the volunteer action opens the role flow only when the event offers roles", () => {
  let opened = false;
  const props = {
    event,
    variant: "primary",
    hasEventEnded: false,
    onPress: () => {
      opened = true;
    },
  };
  const button = [...nodes(VolunteerButton(props))].find(
    (node) => node.type === "ActionButton",
  );
  assert.equal(button.props.title, "Volunteer");
  button.props.onPress();
  assert.equal(opened, true);
  assert.equal(
    VolunteerButton({ ...props, event: { ...event, volunteerRoles: [] } }),
    null,
  );
  assert.equal(VolunteerButton({ ...props, hasEventEnded: true }), null);
});

let feedEvent;
let feedRefreshing = false;
let feedHookIndex = 0;
let feedCarpoolsRefreshing = false;
let carpoolRefreshes = 0;
let feedRegistrationQuery = {
  isSuccess: true,
  isPending: false,
  isFetching: false,
  isError: false,
  data: { data: [] },
  refetch() {},
};
const { useFreeEventRegistration } = loadTypeScript(
  "hooks/useFreeEventRegistration.ts",
  { "@/services/queries": { useMyRegistrations: () => feedRegistrationQuery } },
);
const { default: FeedBottomSheet } = loadTypeScript(
  "app/(app)/event/FeedBottomSheet.tsx",
  {
    "@/components/carpool/CarpoolFollowBadge": { default: "CarpoolFollowBadge" },
    "@/components/carpool/CarpoolMembershipBadge": { default: "CarpoolMembershipBadge" },
    "@/hooks/useResponsiveLayout": { useResponsiveLayout: () => ({ availableWidth: 390, insets: { top: 24, bottom: 34, left: 0, right: 0 } }) },
    "@/hooks/useFreeEventRegistration": { useFreeEventRegistration },
    "@/components/ui/GogoRefreshScrollView": refreshComponents,
    "@/components/volunteer/VolunteerButton": { default: VolunteerButton },
    "@/components/feed/FeedRenderer": { default: "FeedRenderer" },
    "@/components/ui/AppLoader": { default: "Spinner" },
    "@/hooks/useLocationManager": {
      useLocationManager: () => ({ requestLocation() {}, openSettings() {} }),
    },
    "@/services/queries": {
      useEventDetails: () => ({ data: { data: feedEvent } }),
      usePaginatedEventCarpools: () => ({
        isPending: false,
        isRefetching: feedCarpoolsRefreshing,
        refetch() {
          carpoolRefreshes++;
        },
      }),
    },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "@gorhom/bottom-sheet": {
      BottomSheetModal: "Sheet",
      BottomSheetFlatList: "FeedList",
      BottomSheetBackdrop: "Backdrop",
    },
    "@react-navigation/native": { useFocusEffect() {} },
    react: {
      useCallback: (fn) => fn,
      useMemo: (fn) => fn(),
      useState: (initial) => {
        if (initial === "feed" || initial === "carpool") feedHookIndex = 0;
        const index = feedHookIndex++;
        return [index === 3 ? feedRefreshing : initial, () => {}];
      },
      useRef: () => ({ current: null }),
      useEffect() {},
    },
    "react-native": { FlatList: "FeedList", Text: "Text", TouchableOpacity: "Button", View: "View" },
    twrnc: {
      default: Object.assign(() => ({}), { style: () => ({}) }),
      style: () => ({}),
    },
    "./DontationProgress": { default: "DonationProgress" },
  },
);

test("event carpool rows expose relationship tags without repeating the follow ranking label", () => {
  feedEvent = { ...event, registrationType: "ticket" };
  let opened;
  const sheet = FeedBottomSheet({ eventId: "event", isVisible: true, initialTab: "carpool", onClose() {}, onAction: action => { opened = action; } });
  const list = [...nodes(sheet)].find(node => node.type === "FeedList");
  const row = list.props.renderItem({ item: {
    id: "ride", origin: "Yaba", destination: "Park", departureTime: "09:00", seatsLeft: 2, pricePerSeat: 0,
    driver: { username: "ada" }, isFollowingDriver: true, isFollowedByDriver: true, isCloseToYou: false, isMember: true,
  } });
  const badge = [...nodes(row)].find(node => node.type === "CarpoolFollowBadge");
  assert.equal(badge.props.isFollowing, true);
  assert.equal(badge.props.isFollowedBy, true);
  assert.ok([...nodes(row)].some(node => node.type === "CarpoolMembershipBadge"));
  const labels = [...nodes(row)].flatMap(node => [node.props.children].flat(Infinity).filter(value => typeof value === "string")).join(" ");
  assert.doesNotMatch(labels, /You follow owner|Recommended/);
  row.props.onPress();
  assert.deepEqual(opened, { type: "OPEN_CARPOOL", carpoolId: "ride" });
});
test("the feed sheet only shows a volunteer action for Volunteer and donation events", () => {
  for (const registrationType of [
    "ticket",
    "registration",
    "donation",
    "volunteer",
  ]) {
    feedEvent = { ...event, registrationType };
    const actions = [];
    const sheet = FeedBottomSheet({
      eventId: "event",
      isVisible: true,
      onClose() {},
      onAction: (action) => actions.push(action),
    });
    assert.equal(
      [...nodes(sheet)].some((node) => node.type === VolunteerButton),
      false,
    );
    const list = [...nodes(sheet)].find((node) => node.type === "FeedList");
    const header = list.props.ListHeaderComponent();
    const action = [...nodes(header)].find(
      (node) => node.type === VolunteerButton,
    );
    assert.ok(action);
    assert.equal(action.props.variant, "compact");
    const button = action.type(action.props);
    if (registrationType !== "volunteer") {
      assert.equal(button, null);
      assert.deepEqual(actions, []);
      continue;
    }
    assert.equal(button.props.accessibilityLabel, "Volunteer");
    button.props.onPress();
    assert.deepEqual(actions, [{ type: "VOLUNTEER" }]);
  }
});

const creationRoutes = [];
const { default: CreationLayout } = loadTypeScript(
  "app/(app)/(tabs)/_layout.tsx",
  {
    "@/hooks/useResponsiveLayout": { useResponsiveLayout: () => ({ useNavigationRail: false, navigationRailWidth: 0 }) },
    "@/hooks/usePressGuard": { usePressGuard: (fn) => fn },
    "@/utils/navigation": {
      pushWithLock: (_router, route) => creationRoutes.push(route),
      replaceWithLock() {},
    },
    "@expo/vector-icons": {
      Feather: "Icon",
      FontAwesome5: "Icon",
      Ionicons: "Icon",
    },
    "@gorhom/bottom-sheet": {
      default: "Sheet",
      BottomSheetBackdrop: "Backdrop",
      BottomSheetScrollView: "ScrollView",
    },
    "expo-router": {
      Stack: "Stack",
      usePathname: () => "/",
      useRouter: () => ({}),
    },
    react: {
      useCallback: (fn) => fn,
      useMemo: (fn) => fn(),
      useRef: () => ({ current: null }),
      useState: () => ["eventType", () => {}],
    },
    "react-native": { FlatList: "FeedList", Text: "Text", TouchableOpacity: "Button", View: "View" },
    twrnc: { default: () => ({}), style: () => ({}) },
  },
);

test("New Event opens the creation page directly", () => {
  creationRoutes.length = 0;
  const option = [...nodes(CreationLayout())].find(node => node.type === "Button" && [...nodes(node)].some(child => child.props.children === "New Event"));
  option.props.onPress();
  assert.deepEqual(creationRoutes, ["/new-event"]);
});

test("attempting to add volunteers without story text shows a reminder and leaves the form unchanged", () => {
  for (const registrationType of ["volunteer"]) {
    for (const impactDescription of ["", "   "]) {
      resetForm({
        registrationType,
        impactTitle: "An impact focus",
        impactDescription,
      });
      const section = VolunteerSetupFields(formProps);
      assert.equal(
        [...nodes(section)].some((node) => node.type === "Switch"),
        false,
      );
      const add = [...nodes(section)].find((node) => node.type === "Button");
      add.props.onPress();
      assert.match(volunteerWarnings[0], /Add an impact story/);
      assert.equal(formValues.volunteerRoles.length, 0);
      assert.equal(formValues.registrationType, registrationType);
    }
  }
});

test("removing story text relocks setup and hides recruitment actions even with saved roles", () => {
  resetForm({
    registrationType: "volunteer",
    volunteerRoles: [role],
    impactDescription: "   ",
  });
  assert.equal(volunteerOnlySwitch(), undefined);
  assert.equal(formValues.volunteerRoles.length, 1);
  assert.equal(
    VolunteerButton({
      event: { ...event, impactDescription: "" },
      hasEventEnded: false,
      onPress() {},
    }),
    null,
  );
  reset();
  const content = opportunity({ event: { ...event, impactDescription: "" } });
  assert.equal(
    [...nodes(content)].some((node) => node.type === "ActionButton"),
    false,
  );
});

const { default: EventStoryFields } = loadTypeScript(
  "components/eventInfo/EventStoryFields.tsx",
  {
    "@/components/buttons/TagButton": { default: "TagButton" },
    "@/components/inputs/CustomInput1": { default: "Input" },
    "@/components/inputs/CustomTextArea": { default: "TextArea" },
    "@/components/labels/FormLabel": { default: "Label" },
    "@/utils/globalErrorHandler": {
      showGlobalWarning: (message) => volunteerWarnings.push(message),
    },
    "@/components/gogo/tasks/impactSuggestions/ImpactSelector": { default: "ImpactSelector" },
    "react-hook-form": {
      Controller: "Controller",
      useWatch: ({ name }) => name.map((key) => formValues[key]),
    },
    react: { useState: (initial) => [initial, () => {}] },
    "react-native": { FlatList: "FeedList", Text: "Text", TouchableOpacity: "Button", View: "View" },
    twrnc: { default: () => ({}) },
  },
);
function removeStoryButton(screen) {
  return [...nodes(screen)].find(
    (node) =>
      node.type === "Button" &&
      [...nodes(node)].some(
        (child) => child.type === "Text" && child.props.children === "Remove",
      ),
  );
}

for (const [name, participation] of [
  ["volunteer-only participation", { registrationType: "volunteer" }],
  ["existing volunteer roles", { registrationType: "registration", volunteerRoles: [role] }],
]) {
  test(`a required impact story has no Remove button with ${name}`, () => {
    resetForm({
      tags: [],
      ...participation,
      impactDescription: "Restore green spaces together.",
    });
    for (const section of [undefined, "Impact story"]) {
      assert.equal(removeStoryButton(EventStoryFields({ ...formProps, section })), undefined);
      formValues.impactDescription = "";
      const blankStory = EventStoryFields({ ...formProps, section });
      assert.equal(removeStoryButton(blankStory), undefined);
      assert.ok(
        [...nodes(blankStory)].some(
          (node) =>
            node.type === "Controller" && node.props.name === "impactDescription",
        ),
      );
      formValues.impactDescription = "Restore green spaces together.";
    }
  });
}

test("ordinary events can still remove an optional impact story", () => {
  resetForm({ tags: [], impactDescription: "A story without volunteering." });
  removeStoryButton(EventStoryFields(formProps)).props.onPress();
  assert.equal(formValues.impactDescription, "");
  assert.deepEqual(volunteerWarnings, []);
});

test("cancelling a new role sheet leaves the event draft unchanged", () => {
  resetForm({ registrationType: "volunteer", impactDescription: "Restore green spaces together." });
  const add = [...nodes(VolunteerSetupFields(formProps))].find(
    (node) => node.type === "Button" && node.props.accessibilityState,
  );
  add.props.onPress();
  roleEditor().props.onClose();
  assert.deepEqual(formValues.volunteerRoles, []);
  assert.equal(activeRoleEditor, null);
});

test("editing a draft role opens its values in a sheet and updates only on save", () => {
  resetForm({
    registrationType: "volunteer",
    impactDescription: "Restore green spaces together.",
    volunteerRoles: [{ ...roleDraft }],
  });
  const edit = () =>
    [...nodes(VolunteerSetupFields(formProps))].find(
      (node) => node.props.accessibilityLabel === "Edit volunteer role 1",
    );
  edit().props.onPress();
  assert.deepEqual(roleEditor().props.initialValue, roleDraft);
  roleEditor().props.onClose();
  assert.deepEqual(formValues.volunteerRoles, [roleDraft]);
  edit().props.onPress();
  const updated = { ...roleDraft, capacity: 5, requiresApproval: false };
  roleEditor().props.onSave(updated);
  assert.deepEqual(formValues.volunteerRoles, [updated]);
  assert.equal(activeRoleEditor, null);
});

const { default: VolunteerRoleSheet } = loadTypeScript(
  "components/volunteer/VolunteerRoleSheet.tsx",
  {
    "@/components/buttons/SheetCloseButton": { default: SheetCloseButton },
    "@/components/ui/AppToast": { default: "Toast" },
    "@/components/volunteer/VolunteerRoleForm": { default: "RoleForm" },
    "react-native": {
      KeyboardAvoidingView: "KeyboardView",
      Modal: "Modal",
      Platform: { OS: "ios" },
      ScrollView: "ScrollView",
      Text: "Text",
      TouchableOpacity: "Button",
      View: "View",
    },
    twrnc: { default: () => ({}) },
  },
);

test("the role sheet supports cancellation and keyboard-safe scrolling", () => {
  let closed = 0;
  const sheet = VolunteerRoleSheet({
    pending: false,
    onSave() {},
    onClose: () => {
      closed++;
    },
  });
  assert.equal(sheet.type, "Modal");
  assert.equal(sheet.props.animationType, "slide");
  assert.ok(
    [...nodes(sheet)].some(
      (node) =>
        node.type === "KeyboardView" && node.props.behavior === "padding",
    ),
  );
  assert.ok(
    [...nodes(sheet)].some(
      (node) =>
        node.type === "ScrollView" &&
        node.props.keyboardShouldPersistTaps === "handled",
    ),
  );
  sheet.props.onRequestClose();
  const close = [...nodes(sheet)].find(
    (node) => node.type === SheetCloseButton,
  );
  const icon = close.type(close.props);
  assert.equal(icon.props.accessibilityLabel, "Close volunteer role sheet");
  assert.ok(
    [...nodes(icon)].some(
      (node) => node.type === "Icon" && node.props.name === "close",
    ),
  );
  icon.props.onPress();
  [...nodes(sheet)].find((node) => node.type === "RoleForm").props.onCancel();
  assert.equal(closed, 3);
});

test("the role sheet blocks dismissal while the role is being saved", () => {
  let closed = false;
  const sheet = VolunteerRoleSheet({
    pending: true,
    initialValue: roleDraft,
    onSave() {},
    onClose: () => {
      closed = true;
    },
  });
  const close = [...nodes(sheet)].find(
    (node) => node.type === SheetCloseButton,
  );
  assert.equal(close.props.disabled, true);
  const icon = close.type(close.props);
  assert.equal(icon.props.disabled, true);
  assert.deepEqual(icon.props.accessibilityState, { disabled: true });
  assert.equal(icon.props.onPress, undefined);
  sheet.props.onRequestClose();
  const form = [...nodes(sheet)].find((node) => node.type === "RoleForm");
  assert.equal(form.props.initialValue, roleDraft);
  assert.equal(form.props.pending, true);
  form.props.onCancel();
  assert.equal(closed, false);
});

let managerState;
let managerHookIndex;
let resolveRoleSave;
let rejectRoleSave;
const roleRequests = [];
const query = (data) => ({
  isPending: false,
  isError: false,
  isSuccess: true,
  isRefetching: false,
  data: { data },
  refetch() {},
});
const { default: ManageVolunteers } = loadTypeScript(
  "app/(app)/volunteers/[id].tsx",
  {
    "@/components/ui/AppLoader": { default: "Spinner" },
    "@/components/ui/GogoRefreshScrollView": refreshComponents,
    "@/components/CustomeTopBarNav": { default: "TopBar" },
    "@/components/buttons/CustomBtn1": { default: "ActionButton" },
    "@/components/inputs/CustomInput1": { default: "Input" },
    "@/components/volunteer/VolunteerRoleSheet": { default: "RoleSheet" },
    "@/components/volunteer/VolunteerStats": { default: "Stats" },
    "@/context/AuthContext": { useAuth: () => ({ user: { id: "organiser" } }) },
    "@/services/mutations": {
      useSaveVolunteerRole: () => ({
        isPending: false,
        mutate() {},
        mutateAsync: (action) => {
          roleRequests.push(action);
          return new Promise((resolve, reject) => {
            resolveRoleSave = resolve;
            rejectRoleSave = reject;
          });
        },
      }),
    },
    "@/services/queries": {
      useEventDetails: () =>
        query({ ...event, creatorId: "organiser", title: "Plant trees" }),
      useVolunteerRoles: () => query([role]),
      useVolunteerRoster: () => query([]),
      useVolunteerSummary: () => query({}),
    },
    "@/utils/globalErrorHandler": { showGlobalSuccess() {} },
    "@/utils/navigation": { useLockedRouter: () => ({}), safeGoBack() {} },
    "expo-router": { useLocalSearchParams: () => ({ id: "event" }) },
    react: {
      useState: (initial) => {
        const index = managerHookIndex++;
        if (managerState.length === index) managerState.push(initial);
        return [
          managerState[index],
          (value) => {
            managerState[index] = value;
          },
        ];
      },
    },
    "react-native": {
      RefreshControl: "RefreshControl",
      ScrollView: "ScrollView",
      Text: "Text",
      TouchableOpacity: "Button",
      View: "View",
    },
    twrnc: { default: () => ({}), style: () => ({}) },
  },
);
function renderManager() {
  managerHookIndex = 0;
  return ManageVolunteers();
}
function resetManager() {
  managerState = [];
  roleRequests.length = 0;
  return renderManager();
}
function managerSheet() {
  return [...nodes(renderManager())].find((node) => node.type === "RoleSheet");
}
function openNewManagerRole() {
  const page = resetManager();
  [...nodes(page)]
    .find(
      (node) =>
        node.type === "ActionButton" &&
        node.props.title === "Add volunteer role",
    )
    .props.onPress();
  return managerSheet();
}

test("organiser role creation uses a sheet and closes after the API save succeeds", async () => {
  const sheet = openNewManagerRole();
  assert.ok(sheet);
  assert.equal(sheet.props.initialValue, undefined);
  const page = renderManager();
  assert.equal(
    [...nodes(page)]
      .filter((node) => node.type === "ScrollView")
      .some((scroll) =>
        [...nodes(scroll)].some((node) => node.type === "RoleSheet"),
      ),
    false,
  );
  const save = sheet.props.onSave(roleDraft);
  assert.ok(managerSheet());
  assert.deepEqual(roleRequests[0], { type: "create", data: roleDraft });
  resolveRoleSave({ data: roleDraft });
  await save;
  assert.equal(managerSheet(), undefined);
});

test("a failed organiser save leaves the sheet open for correction or retry", async () => {
  const save = openNewManagerRole().props.onSave(roleDraft);
  rejectRoleSave(new Error("Role could not be saved"));
  await save;
  assert.ok(managerSheet());
});

test("organiser role editing prefills the sheet and sends the role update endpoint action", async () => {
  const page = resetManager();
  [...nodes(page)]
    .find(
      (node) =>
        node.type === "Button" &&
        [...nodes(node)].some(
          (child) =>
            child.type === "Text" && child.props.children === "Edit role",
        ),
    )
    .props.onPress();
  const sheet = managerSheet();
  assert.equal(sheet.props.initialValue, role);
  const updated = { ...roleDraft, capacity: 4 };
  const save = sheet.props.onSave(updated);
  assert.deepEqual(roleRequests[0], {
    type: "update",
    roleId: role.id,
    data: updated,
  });
  resolveRoleSave({ data: updated });
  await save;
  assert.equal(managerSheet(), undefined);
});

test("compact volunteer actions keep the role flow available without a full-width button", () => {
  let opened = false;
  const button = VolunteerButton({
    event,
    hasEventEnded: false,
    variant: "compact",
    onPress: () => {
      opened = true;
    },
  });
  assert.equal(button.type, "Button");
  assert.equal(button.props.accessibilityLabel, "Volunteer");
  button.props.onPress();
  assert.equal(opened, true);
});

test("the organiser icon opens management and remains available for attendance after the event", () => {
  let opened = false;
  const button = VolunteerButton({
    event,
    hasEventEnded: true,
    purpose: "manage",
    variant: "icon",
    onPress: () => {
      opened = true;
    },
  });
  assert.equal(button.type, "Button");
  assert.equal(button.props.accessibilityLabel, "Manage volunteers");
  assert.equal(
    [...nodes(button)].some((node) => node.type === "Text"),
    false,
  );
  button.props.onPress();
  assert.equal(opened, true);
});

test("organisers can open recruitment setup from the icon before publishing any roles", () => {
  const props = {
    event: { ...event, volunteerRoles: [] },
    hasEventEnded: false,
    purpose: "manage",
    variant: "icon",
    onPress() {},
  };
  assert.ok(VolunteerButton(props));
  assert.equal(
    VolunteerButton({
      ...props,
      event: { ...props.event, impactDescription: "" },
    }),
    null,
  );
});

const { default: MyVolunteering } = loadTypeScript(
  "app/(app)/my-volunteering.tsx",
  {
    "@/components/ui/ImpactPageLoader": { default: "PageLoader" },
    "@/components/gogo/mascot/MascotMoment": { MascotMoment: "GogoEmptyState" },
    "@/components/ui/GogoRefreshScrollView": refreshComponents,
    "@/components/CustomeTopBarNav": { default: "TopBar" },
    "@/components/buttons/CustomBtn1": { default: "ActionButton" },
    "@/components/volunteer/WithdrawApplicationButton": {
      default: WithdrawApplicationButton,
    },
    "@/services/queries": { useVolunteerHistory: () => state.history },
    "@/utils/navigation": {
      useLockedRouter: () => ({ push() {} }),
      safeGoBack() {},
    },
    "react-native": {
      FlatList: "List",
      Text: "Text",
      TouchableOpacity: "Button",
      View: "View",
    },
    twrnc: { default: () => ({}) },
  },
);

const pendingApplication = {
  id: "application",
  eventId: "event",
  roleId: "role",
  status: "APPLIED",
  confirmedMinutes: null,
};

test("pending and accepted volunteer applications have a visible withdrawal action before the event", () => {
  for (const status of ["APPLIED", "ACCEPTED"]) {
    reset();
    state.query.data.data = [
      { ...role, applications: [{ ...pendingApplication, status }] },
    ];
    const withdrawal = [...nodes(opportunity())].find(
      (node) => node.type === WithdrawApplicationButton,
    );
    assert.ok(withdrawal);
    const button = withdrawal.type(withdrawal.props);
    assert.equal(button.props.title, "Withdraw application");
    button.props.onPress();
    assert.equal(state.withdrawEventId, "event");
    assert.deepEqual(state.action, {
      type: "withdraw",
      applicationId: "application",
    });
    assert.deepEqual(state.messages, []);
    state.options.onSuccess();
    assert.deepEqual(state.messages, ["Volunteer application withdrawn."]);
  }
});

test("My volunteering offers the same withdrawal operation for an application", () => {
  reset();
  const entry = {
    ...pendingApplication,
    event: { ...event, title: "Plant trees", location: "Lagos" },
    role,
  };
  state.history = {
    isPending: false,
    isError: false,
    isRefetching: false,
    isFetching: false,
    data: { data: [entry] },
  };
  const list = [...nodes(MyVolunteering())].find(
    (node) => node.type === "List",
  );
  const historyCard = list.props.renderItem({ item: entry });
  const withdrawal = [...nodes(historyCard.type(historyCard.props))].find(
    (node) => node.type === WithdrawApplicationButton,
  );
  const button = withdrawal.type(withdrawal.props);
  button.props.onPress();
  assert.equal(state.withdrawEventId, "event");
  assert.deepEqual(state.action, {
    type: "withdraw",
    applicationId: "application",
  });
});

test("withdrawal blocks repeat taps while pending and closes after attendance begins or withdrawal succeeds", () => {
  reset({ withdrawPending: true });
  const props = { application: pendingApplication, startDate: event.startDate };
  const pending = WithdrawApplicationButton(props);
  assert.equal(pending.props.disabled, true);
  assert.equal(pending.props.title, "Withdrawing…");
  assert.equal(
    WithdrawApplicationButton({ ...props, startDate: "2020-01-01T10:00:00Z" }),
    null,
  );
  for (const status of ["WITHDRAWN", "DECLINED", "CHECKED_IN", "COMPLETED"]) {
    assert.equal(
      WithdrawApplicationButton({
        ...props,
        application: { ...pendingApplication, status },
      }),
      null,
    );
  }
});

function feedRegistration() {
  const sheet = FeedBottomSheet({
    eventId: "event",
    isVisible: true,
    onClose() {},
    onAction() {},
  });
  const list = [...nodes(sheet)].find((node) => node.type === "FeedList");
  return [...nodes(list.props.ListHeaderComponent())].find(
    (node) => node.props.accessibilityLabel === "Event registration",
  );
}

test("the feed shows Registered for an existing free place and disables the registration action", () => {
  feedEvent = {
    ...event,
    registrationType: "registration",
    registrationFee: 0,
  };
  feedRegistrationQuery = {
    isSuccess: true,
    isPending: false,
    isFetching: false,
    isError: false,
    data: { data: [{ id: "registration", eventId: "event" }] },
    refetch() {},
  };
  const button = feedRegistration();
  assert.equal(button.props.disabled, true);
  assert.ok(
    [...nodes(button)].some((node) => node.props.children === "Registered"),
  );
});

test("the feed waits for registration checks and retries a failed check before allowing registration", () => {
  feedEvent = {
    ...event,
    registrationType: "registration",
    registrationFee: null,
  };
  feedRegistrationQuery = {
    isSuccess: false,
    isPending: true,
    isError: false,
    refetch() {},
  };
  assert.equal(feedRegistration().props.disabled, true);
  let retried = false;
  feedRegistrationQuery = {
    isSuccess: false,
    isPending: false,
    isFetching: false,
    isError: true,
    refetch: () => {
      retried = true;
    },
  };
  const retry = feedRegistration();
  assert.ok(
    [...nodes(retry)].some(
      (node) => node.props.children === "Retry registration check",
    ),
  );
  retry.props.onPress();
  assert.equal(retried, true);
});

function loadingIndicators(tree) {
  return [...nodes(tree)]
    .flatMap((node) =>
      node.type === refreshComponents.RefreshIndicator
        ? [...nodes(node.type(node.props))]
        : [node],
    )
    .filter((node) => node.type === "Spinner");
}

test("pulling to refresh an empty feed shows one Gogo and suppresses initial and pagination loaders", () => {
  feedEvent = { ...event, registrationType: "ticket" };
  feedRefreshing = true;
  const sheet = FeedBottomSheet({
    eventId: "event",
    isVisible: true,
    onClose() {},
    feedData: {
      pinnedFeeds: [],
      regularFeeds: [],
      allFeeds: [],
      hasMore: true,
      loading: true,
      loadingMore: true,
      refreshing: true,
      error: null,
      hideFeed() {},
      loadMore() {},
      refresh() {},
    },
  });
  const list = [...nodes(sheet)].find((node) => node.type === "FeedList");
  const header = loadingIndicators(list.props.ListHeaderComponent());
  assert.equal(header.length, 0);
  assert.equal(list.props.renderScrollComponent({}).props.refreshing, true);
  assert.equal(loadingIndicators(list.props.ListFooterComponent()).length, 0);
  assert.equal(list.props.refreshControl, undefined);
  assert.equal(list.props.onRefresh, undefined);
  assert.equal(sheet.props.enableContentPanningGesture, false);
  feedRefreshing = false;
});

test("carpool refresh uses one controlled Gogo and keeps the ride refresh callback", () => {
  feedEvent = { ...event, registrationType: "ticket" };
  feedCarpoolsRefreshing = true;
  carpoolRefreshes = 0;
  const list = [
    ...nodes(
      FeedBottomSheet({
        eventId: "event",
        isVisible: true,
        initialTab: "carpool",
        onClose() {},
      }),
    ),
  ].find((node) => node.type === "FeedList");
  const scroll = list.props.renderScrollComponent({});
  assert.equal(scroll.props.refreshing, true);
  assert.equal(loadingIndicators(list.props.ListHeaderComponent()).length, 0);
  scroll.props.onRefresh();
  assert.equal(carpoolRefreshes, 1);
  feedCarpoolsRefreshing = false;
});

test("empty volunteer history refresh uses Gogo without another page loader", () => {
  let refreshes = 0;
  state.history = {
    isPending: false,
    isError: false,
    isRefetching: true,
    isFetching: true,
    data: { data: [] },
    refetch() {
      refreshes++;
    },
  };
  const list = [...nodes(MyVolunteering())].find(
    (node) => node.type === "List",
  );
  assert.equal(list.props.onRefresh, undefined);
  const header = loadingIndicators(list.props.ListHeaderComponent);
  assert.equal(header.length, 0);
  assert.equal(list.props.ListEmptyComponent, null);
  const control = list.props.renderScrollComponent({});
  assert.equal(control.props.refreshing, true);
  control.props.onRefresh();
  assert.equal(refreshes, 1);
});

test("volunteer history loads the page before confirming an empty response", () => {
  state.history = {
    isPending: true,
    isFetching: true,
    isError: false,
    isRefetching: false,
    data: undefined,
  };
  let screen = MyVolunteering();
  assert.ok([...nodes(screen)].some((node) => node.type === "PageLoader"));
  assert.equal(
    [...nodes(screen)].some(
      (node) => node.type === "List" || node.type === "GogoEmptyState",
    ),
    false,
  );
  state.history = {
    isPending: false,
    isFetching: true,
    isError: false,
    isRefetching: true,
    data: { data: [] },
  };
  let list = [...nodes(MyVolunteering())].find((node) => node.type === "List");
  assert.equal(list.props.ListEmptyComponent, null);
  assert.equal(list.props.renderScrollComponent({}).props.refreshing, true);
  assert.equal(loadingIndicators(list.props.ListHeaderComponent).length, 0);
  state.history.isFetching = false;
  state.history.isRefetching = false;
  list = [...nodes(MyVolunteering())].find((node) => node.type === "List");
  assert.equal(
    [...nodes(list.props.ListEmptyComponent)].find(
      (node) => node.type === "GogoEmptyState",
    ).props.variant,
    "empty",
  );
});
test("a volunteering load failure offers retry without showing an empty state", () => {
  let retried = 0;
  state.history = {
    isPending: false,
    isFetching: false,
    isError: true,
    isRefetching: false,
    data: undefined,
    refetch: () => {
      retried++;
    },
  };
  const screen = MyVolunteering();
  assert.equal(
    [...nodes(screen)].some((node) =>
      ["PageLoader", "List", "GogoEmptyState"].includes(node.type),
    ),
    false,
  );
  [...nodes(screen)].find((node) => node.type === "Button").props.onPress();
  assert.equal(retried, 1);
});
test("populated volunteer history keeps its list and small refresh indicator", () => {
  const entry = {
    ...pendingApplication,
    event: { ...event, title: "Plant trees", location: "Lagos" },
    role,
  };
  state.history = {
    isPending: false,
    isFetching: true,
    isError: false,
    isRefetching: true,
    data: { data: [entry] },
  };
  const list = [...nodes(MyVolunteering())].find(
    (node) => node.type === "List",
  );
  assert.deepEqual(list.props.data, [entry]);
  assert.equal(loadingIndicators(list.props.ListHeaderComponent).length, 0);
  assert.equal(list.props.renderScrollComponent({}).props.refreshing, true);
});


test("guided story, impact and interest editors stay focused on the selected step", () => {
  resetForm({ tags: [], impactDescription: "Restore the park." });
  for (const section of ["Story", "Impact story", "Impact map", "Interests"]) {
    const tree = EventStoryFields({ ...formProps, section });
    const fields = [...nodes(tree)].filter(node => node.type === "Controller").map(node => node.props.name);
    assert.equal(fields.includes("description"), section === "Story");
    assert.equal(fields.includes("impactTitle"), false);
    assert.equal(fields.includes("impactDescription"), ["Impact story", "Impact map"].includes(section));
    assert.equal([...nodes(tree)].some(node => node.type === "TagButton"), section === "Interests");
    if (["Impact story", "Impact map"].includes(section)) {
      const field = [...nodes(tree)].find(node => node.type === "Controller" && node.props.name === "impactDescription");
      const body = field.props.render({ field: { value: formValues.impactDescription, onChange() {} }, fieldState: {} });
      assert.equal([...nodes(body)].find(node => node.type === "ImpactSelector").props.section, section === "Impact story" ? "story" : "map");
    }
  }
});

test("feed scrolling includes its event header and every pinned and regular update in one list", () => {
  feedEvent = { ...event, title: 'Community gathering', registrationType: 'ticket' };
  const pinned = { id: 'pinned', title: 'Donation progress' };
  const regular = { id: 'purchase', title: 'Ticket purchased' };
  for (const rows of [[pinned], [pinned, regular]]) {
    let loaded = 0, opened;
    const sheet = FeedBottomSheet({ eventId: 'event', isVisible: true, onClose() {}, onAction: action => { opened = action; }, feedData: {
      pinnedFeeds: [pinned], regularFeeds: rows.slice(1), allFeeds: rows,
      hasMore: true, loading: false, loadingMore: false, refreshing: false, error: null,
      hideFeed() {}, loadMore() { loaded++; }, refresh() {},
    } });
    const list = [...nodes(sheet)].find(node => node.type === 'FeedList');
    assert.strictEqual(list.props.data, rows);
    const header = [...nodes(list.props.ListHeaderComponent())];
    assert.ok(header.some(node => node.props.children === 'Community gathering'));
    assert.equal(header.some(node => typeof node.props.children === 'string' && /Pinned|Latest Activity/.test(node.props.children)), false);
    assert.equal(header.some(node => node.type === 'FeedRenderer'), false);
    const row = list.props.renderItem({ item: pinned });
    assert.strictEqual(row.props.feed, pinned);
    row.props.onAction({ type: 'DONATE' }); assert.deepEqual(opened, { type: 'DONATE' });
    list.props.onEndReached(); assert.equal(loaded, 1);
  }
});
