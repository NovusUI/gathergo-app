const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const { getProfileWelcomeCopy } = loadTypeScript("components/gogo/mascot/constants.ts");
const { profileSchema } = loadTypeScript("schemas/profile.ts");
const today = new Date(2026, 9, 17);

test("the welcome changes tone when the user turns eighteen", () => {
  const teen = getProfileWelcomeCopy(new Date(2008, 9, 18), today);
  const adult = getProfileWelcomeCopy(new Date(2008, 9, 17), today);
  assert.notEqual(teen.message, adult.message);
  assert.equal(
    adult.message,
    getProfileWelcomeCopy(new Date(1997, 9, 17), today).message,
  );
});

test("the thirtieth birthday selects the next welcome tone", () => {
  assert.notEqual(
    getProfileWelcomeCopy(new Date(1996, 9, 18), today).message,
    getProfileWelcomeCopy(new Date(1996, 9, 17), today).message,
  );
});

test("the fiftieth birthday selects the next welcome tone", () => {
  assert.notEqual(
    getProfileWelcomeCopy(new Date(1976, 9, 18), today).message,
    getProfileWelcomeCopy(new Date(1976, 9, 17), today).message,
  );
});

test("birth month is included when choosing a welcome tone", () => {
  assert.equal(
    getProfileWelcomeCopy(new Date(2008, 10, 1), today).message,
    getProfileWelcomeCopy(new Date(2009, 0, 1), today).message,
  );
  assert.notEqual(
    getProfileWelcomeCopy(new Date(2008, 10, 1), today).message,
    getProfileWelcomeCopy(new Date(2008, 8, 30), today).message,
  );
});

test("all age groups get the same mascot introduction and celebration", () => {
  for (const birthYear of [2010, 2000, 1985, 1960, 1930]) {
    const copy = getProfileWelcomeCopy(new Date(birthYear, 0, 1), today);
    assert.equal(copy.variant, "success");
    assert.equal(copy.title, "Meet Gogo");
    assert.ok(copy.message.length > 0);
  }
});

test("a profile without a birthday gets a welcome without an age assumption", () => {
  const copy = getProfileWelcomeCopy(null, today);
  assert.equal(copy.variant, "success");
  assert.equal(copy.title, "Meet Gogo");
  assert.match(copy.message, /find an event that feels like you/);
});

test("the saved name is trimmed for the personalised welcome", () => {
  const profile = profileSchema.parse({
    fullName: "  Ada Example  ",
    username: "ada_example",
    birthDate: new Date(2000, 9, 17),
  });
  assert.equal(profile.fullName, "Ada Example");
});

test("a blank name cannot reach the save or welcome flow", () => {
  assert.equal(
    profileSchema.safeParse({
      fullName: "   ",
      username: "ada_example",
      birthDate: new Date(2000, 9, 17),
    }).success,
    false,
  );
});

test("the existing minimum-age validation still applies before the welcome", () => {
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - 12);
  assert.equal(
    profileSchema.safeParse({
      fullName: "Ada Example",
      username: "ada_example",
      birthDate,
    }).success,
    false,
  );
});

const layoutState = {
  user: { isProfileComplete: true, hasPreferences: false },
  loading: false,
  isAuthenticated: true,
  hasHydrated: true,
  segments: ["(app)", "profile-setup"],
};
function Stack() {}
function Redirect() {}
const { default: AppLayout } = loadTypeScript("app/(app)/_layout.tsx", {
  "@/context/AuthContext": { useAuth: () => layoutState },
  "@/store/auth": { useAuthStore: () => layoutState },
  "@/components/ui/AppLaunchScreen": { default: "LaunchScreen" },
  "expo-router": { Stack, Redirect, useSegments: () => layoutState.segments },
});

test("the authenticated route uses the app logo while startup authentication is loading", () => {
  try {
    layoutState.loading = true;
    assert.equal(AppLayout().type, "LaunchScreen");
    layoutState.loading = false;
    layoutState.hasHydrated = false;
    assert.equal(AppLayout().type, "LaunchScreen");
  } finally {
    layoutState.loading = false;
    layoutState.hasHydrated = true;
  }
});

test("saving the profile moves directly to preference onboarding", () => {
  layoutState.segments = ["(app)", "profile-setup"];
  const screen = AppLayout();
  assert.equal(screen.type, Redirect);
  assert.equal(screen.props.href, "/preference");
});

test("event discovery still requires preference onboarding", () => {
  layoutState.segments = ["(app)", "(tabs)"];
  const screen = AppLayout();
  assert.equal(screen.type, Redirect);
  assert.equal(screen.props.href, "/preference");
});

test("completed or skipped preference onboarding does not redirect users back", () => {
  layoutState.segments = ["(app)", "preference"];
  layoutState.user.hasPreferences = true;
  assert.equal(AppLayout().type, Stack);
  layoutState.user.hasPreferences = false;
});

test("the welcome route does not bypass authentication", () => {
  layoutState.segments = ["(app)", "preference"];
  layoutState.isAuthenticated = false;
  const screen = AppLayout();
  assert.equal(screen.type, Redirect);
  assert.equal(screen.props.href, "/onboarding");
  layoutState.isAuthenticated = true;
});

function CustomButton() {}
function GogoInterestSetup() {}
const onboardingUser = { id: "user-1", fullName: "Ada Example", email: "ada@example.com", isProfileComplete: true, hasPreferences: false };
const emptyProfile = { interests: [], helpModes: [], city: null, learningEnabled: false, weights: [] };
const preferenceState = { user: onboardingUser, values: [], cursor: 0, saved: [], navigations: [], errors: [], pending: false, loading: false };
const { default: PreferencesScreen } = loadTypeScript("app/(app)/preference/index.tsx", {
  "@/components/gogo/tasks/interestMap/GogoInterestSetup": { GogoInterestSetup },
  "@/components/gogo/tasks/interestMap/InterestMap": { InterestMap: "InterestMap" },
  "@/components/gogo/mascot/MascotMoment": { MascotMoment: "GogoMessage" },
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/buttons/CustomBtn1": { default: CustomButton },
  "@/components/CustomSwitcher": { default: "Switch" },
  "@/components/ui/ImpactPageLoader": { default: "PageLoader" },
  "@/context/AuthContext": { useAuth: () => ({ user: preferenceState.user, setUser: user => { preferenceState.user = user; } }) },
  "@/services/queries": {
    useInterestCatalog: () => ({ isPending: preferenceState.loading, isError: false, data: { data: { topics: [], helpModes: ["attend", "volunteer", "donate"] } } }),
    useInterestProfile: () => ({ isPending: preferenceState.loading, isError: false, data: { data: emptyProfile } }),
  },
  "@/services/mutations": {
    useSavePreferences: options => { preferenceState.mutation = options; return { isPending: preferenceState.pending, mutate: data => preferenceState.saved.push(data) }; },
    useResetInterestLearning: () => ({ isPending: false, mutate() {} }),
    useDeleteInterestMap: () => ({ isPending: false, mutate() {} }),
  },
  "@/utils/navigation": { useLockedRouter: () => ({ replace: route => preferenceState.navigations.push(route) }), safeGoBack() {} },
  "@/utils/globalErrorHandler": { showGlobalError: message => preferenceState.errors.push(message), showGlobalSuccess() {} },
  react: { useState: initial => { const index = preferenceState.cursor++; if (!(index in preferenceState.values)) preferenceState.values[index] = initial; return [preferenceState.values[index], next => { preferenceState.values[index] = typeof next === "function" ? next(preferenceState.values[index]) : next; }]; } },
  "react-native": { View: "View", Text: "Text", ScrollView: "ScrollView", TouchableOpacity: "Button" },
  twrnc: { default: () => ({}) },
});
function resetPreferences(user = onboardingUser) { Object.assign(preferenceState, { user: { ...user }, values: [], cursor: 0, saved: [], navigations: [], errors: [], pending: false, loading: false }); }
function renderPreferences() { preferenceState.cursor = 0; return PreferencesScreen(); }
function findElement(element, predicate) {
  if (!element || typeof element !== "object") return undefined;
  if (predicate(element)) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
}

function MascotMessage() {}
const { default: WelcomeModal } = loadTypeScript("components/ui/ProfileWelcomeModal.tsx", {
  "@/components/buttons/CustomBtn1": { default: CustomButton },
  "react-native": { Modal: "Modal", ScrollView: "ScrollView", Text: "Text", View: "View" },
  twrnc: { default: () => ({}) },
  "@/components/gogo/mascot/GatherGoMascot": { GatherGoMascot: "Mascot" },
  "@/components/gogo/mascot/MascotMessage": { MascotMessage },
});

test("birthdays keep their calendar day for both saved and API date formats", () => {
  const now = new Date();
  const birthday = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  const dateOnly = `${birthday.getFullYear()}-${String(birthday.getMonth() + 1).padStart(2, "0")}-${String(birthday.getDate()).padStart(2, "0")}`;
  for (const birthDate of [dateOnly, `${dateOnly}T00:00:00.000Z`]) {
    const modal = WelcomeModal({ profile: { fullName: "Ada", birthDate }, onContinue() {} });
    const message = findElement(modal, (element) => element.type === MascotMessage);
    assert.equal(message.props.message, getProfileWelcomeCopy(birthday, now).message);
  }
});


test("first signup opens the Gogo setup without the old welcome modal", () => {
  resetPreferences();
  const setup = findElement(renderPreferences(), node => node.type === GogoInterestSetup);
  assert.equal(setup.props.firstTime, true);
  assert.deepEqual(setup.props.profile, emptyProfile);
});
test("saving or skipping goes directly to the feed only after the server confirms", () => {
  for (const data of [
    { interests: ["Nature"], helpModes: ["volunteer"], city: "Lagos", learningEnabled: true, likedEventIds: [] },
    { interests: [], helpModes: [], city: "", learningEnabled: false, likedEventIds: [] },
  ]) {
    resetPreferences();
    findElement(renderPreferences(), node => node.type === GogoInterestSetup).props.onSave(data);
    assert.deepEqual(preferenceState.saved, [data]);
    assert.equal(preferenceState.user.hasPreferences, false);
    assert.deepEqual(preferenceState.navigations, []);
    preferenceState.mutation.onSuccess();
    assert.equal(preferenceState.user.hasPreferences, true);
    assert.deepEqual(preferenceState.navigations, ["/"]);
  }
});
test("a failed map save leaves onboarding open and does not claim success", () => {
  resetPreferences(); renderPreferences();
  preferenceState.mutation.onError(new Error("offline"));
  assert.equal(preferenceState.user.hasPreferences, false);
  assert.deepEqual(preferenceState.navigations, []);
  assert.match(preferenceState.errors[0], /Couldn’t save/);
});
test("pending saves block duplicate submissions and the page loads before setup", () => {
  resetPreferences(); preferenceState.loading = true;
  assert.ok(findElement(renderPreferences(), node => node.type === "PageLoader"));
  preferenceState.loading = false; preferenceState.pending = true;
  const setup = findElement(renderPreferences(), node => node.type === GogoInterestSetup);
  assert.equal(setup.props.pending, true);
  setup.props.onSave({});
  assert.deepEqual(preferenceState.saved, []);
});
test("an existing user with an empty or deleted map gets map controls without onboarding again", () => {
  resetPreferences({ ...onboardingUser, hasPreferences: true });
  assert.equal(findElement(renderPreferences(), node => node.type === GogoInterestSetup), undefined);
  findElement(renderPreferences(), node => node.props?.title === "Tune my map").props.onPress();
  const setup = findElement(renderPreferences(), node => node.type === GogoInterestSetup);
  assert.equal(setup.props.firstTime, false);
  setup.props.onCancel();
  assert.equal(findElement(renderPreferences(), node => node.type === GogoInterestSetup), undefined);
});
