const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const { getProfileWelcomeCopy } = loadTypeScript("constants/mascot.ts");
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
    assert.equal(copy.title, "Meet your GatherGo sidekick");
    assert.ok(copy.message.length > 0);
  }
});

test("a profile without a birthday gets a welcome without an age assumption", () => {
  const copy = getProfileWelcomeCopy(null, today);
  assert.equal(copy.variant, "success");
  assert.equal(copy.title, "Meet your GatherGo sidekick");
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
  "@/components/ui/FullScreenLoader": { default: () => null },
  "expo-router": { Stack, Redirect, useSegments: () => layoutState.segments },
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

test("saving preferences keeps the welcome mounted on the preference screen", () => {
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
function ProfileWelcomeModal() {}
const preferenceState = {
  user: null,
  queryData: undefined,
  state: [],
  cursor: 0,
  saved: [],
  navigations: [],
  errors: [],
  pending: false,
};
const { default: PreferencesScreen } = loadTypeScript(
  "app/(app)/preference/index.tsx",
  {
    "@/components/buttons/CustomBtn1": { default: CustomButton },
    "@/components/ui/ProfileWelcomeModal": { default: ProfileWelcomeModal },
    "@/context/AuthContext": {
      useAuth: () => ({
        user: preferenceState.user,
        setUser: (user) => {
          preferenceState.user = user;
        },
      }),
    },
    "@/services/mutations": {
      useSavePreferences: (options) => {
        preferenceState.mutation = options;
        return {
          isPending: preferenceState.pending,
          mutate: (values) => {
            preferenceState.saved.push(values);
          },
        };
      },
    },
    "@/services/queries": {
      useCurrentUser: (options) => {
        preferenceState.queryOptions = options;
        return { data: preferenceState.queryData };
      },
    },
    "@/utils/globalErrorHandler": {
      showGlobalError: (message) => {
        preferenceState.errors.push(message);
      },
    },
    "@/utils/navigation": {
      useLockedRouter: () => ({
        replace: (route) => {
          preferenceState.navigations.push(route);
        },
      }),
    },
    react: {
      useState: (initial) => {
        const index = preferenceState.cursor++;
        if (!(index in preferenceState.state)) {
          preferenceState.state[index] = initial;
        }
        return [
          preferenceState.state[index],
          (next) => {
            preferenceState.state[index] = typeof next === "function"
              ? next(preferenceState.state[index])
              : next;
          },
        ];
      },
    },
    "react-native": {
      View: "View",
      Text: "Text",
      ScrollView: "ScrollView",
      TouchableOpacity: "TouchableOpacity",
    },
    "react-native-svg": {},
    "@expo/vector-icons": { Ionicons: "Icon" },
    twrnc: { default: () => ({}) },
  },
);

const onboardingUser = {
  id: "user-1",
  email: "ada@example.com",
  fullName: "Ada Example",
  username: "ada_example",
  birthDate: "2000-10-17",
  isProfileComplete: true,
  hasPreferences: false,
};

function resetPreferences(user = onboardingUser) {
  Object.assign(preferenceState, {
    user: { ...user },
    queryData: undefined,
    state: [],
    cursor: 0,
    saved: [],
    navigations: [],
    errors: [],
    pending: false,
  });
}

function renderPreferences() {
  preferenceState.cursor = 0;
  return PreferencesScreen();
}

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
  "./GatherGoMascot": { GatherGoMascot: "Mascot" },
  "./MascotMessage": { MascotMessage },
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

function selectAndSavePreferences() {
  const initial = renderPreferences();
  const chip = findElement(initial, (element) => typeof element.props?.item === "string");
  chip.props.onPress();
  const selected = renderPreferences();
  findElement(selected, (element) => element.type === CustomButton).props.onPress();
  return chip.props.item;
}

test("the welcome follows a successful preference save and continues into the feed", () => {
  resetPreferences();
  const selected = selectAndSavePreferences();
  assert.deepEqual(preferenceState.saved, [[selected]]);
  assert.equal(findElement(renderPreferences(), (element) => element.type === ProfileWelcomeModal), undefined);
  assert.equal(preferenceState.user.hasPreferences, false);

  preferenceState.mutation.onSuccess();
  const screen = renderPreferences();
  const welcome = findElement(screen, (element) => element.type === ProfileWelcomeModal);
  assert.equal(preferenceState.user.hasPreferences, true);
  assert.equal(welcome.props.profile.birthDate, onboardingUser.birthDate);
  assert.deepEqual(preferenceState.navigations, []);
  assert.equal(findElement(screen, (element) => element.type === CustomButton).props.disabled, true);
  welcome.props.onContinue();
  assert.deepEqual(preferenceState.navigations, ["/"]);
});

test("a failed preference save leaves onboarding open without a welcome", () => {
  resetPreferences();
  selectAndSavePreferences();
  preferenceState.mutation.onError(new Error("Connection failed"));
  assert.deepEqual(preferenceState.errors, ["Connection failed"]);
  assert.equal(preferenceState.user.hasPreferences, false);
  assert.equal(findElement(renderPreferences(), (element) => element.type === ProfileWelcomeModal), undefined);
  assert.deepEqual(preferenceState.navigations, []);
});

test("resumed onboarding uses the saved profile from the current-user API", () => {
  resetPreferences({ id: "user-1", email: "ada@example.com", isProfileComplete: true, hasPreferences: false });
  preferenceState.queryData = { data: { ...onboardingUser, birthDate: "2000-10-17T00:00:00.000Z" } };
  selectAndSavePreferences();
  assert.equal(preferenceState.queryOptions.enabled, true);
  preferenceState.mutation.onSuccess();
  const welcome = findElement(renderPreferences(), (element) => element.type === ProfileWelcomeModal);
  assert.equal(welcome.props.profile.fullName, onboardingUser.fullName);
  assert.equal(welcome.props.profile.birthDate, "2000-10-17T00:00:00.000Z");
});
