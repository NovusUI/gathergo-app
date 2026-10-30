const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}

let expanded = false;
const theme = { useAppTheme: () => ({ tw: () => ({}), color: (value) => value }) };
const { default: InfoDisclosure } = loadTypeScript("components/ui/InfoDisclosure.tsx", {
  react: { useState: () => [expanded, (update) => { expanded = update(expanded); }] },
  "react-native": { Text: "Text", TouchableOpacity: "Button", View: "View" },
  "@expo/vector-icons": { Ionicons: "Icon" },
  "@/hooks/useAppTheme": theme,
});

test("collection explanations stay behind an accessible info control and can be hidden again", () => {
  expanded = false;
  const props = { label: "Collection info", message: "One pass per person. Collection dates lock after the first pass." };
  const render = () => [...nodes(InfoDisclosure(props))];
  const hidden = render();
  assert.equal(hidden.some((node) => node.props.children === props.message), false);
  const button = hidden.find((node) => node.type === "Button");
  assert.equal(button.props.accessibilityLabel, "About collection info");
  assert.equal(button.props.accessibilityState.expanded, false);
  button.props.onPress();
  const shown = render();
  assert.equal(shown.some((node) => node.props.children === props.message), true);
  assert.equal(shown.find((node) => node.type === "Button").props.accessibilityState.expanded, true);
  shown.find((node) => node.type === "Button").props.onPress();
  assert.equal(render().some((node) => node.props.children === props.message), false);
});

const { default: FoodBankSetupFields } = loadTypeScript("components/eventInfo/FoodBankSetupFields.tsx", {
  "react-hook-form": { Controller: "Controller" },
  "react-native": { Text: "Text", View: "View" },
  "@/hooks/useAppTheme": theme,
  "@/components/inputs/CustomInput1": { default: "Input" },
  "@/components/ui/InfoDisclosure": { default: "InfoDisclosure" },
});

test("collection setup keeps its fields and optional fundraising target without explanatory paragraphs", () => {
  const tree = [...nodes(FoodBankSetupFields({ control: {} }))];
  assert.deepEqual(tree.filter((node) => node.type === "Controller").map((node) => node.props.name), [
    "foodBankTotalMeals", "foodBankSlotCapacity", "foodBankSlotMinutes", "donationTarget",
  ]);
  assert.equal(tree.filter((node) => node.type === "InfoDisclosure").length, 1);
  assert.equal(tree.some((node) => node.type === "Text" && String(node.props.children).includes("Everyone is welcome")), false);
  const field = tree.find((node) => node.props.name === "foodBankSlotCapacity");
  let changed;
  const input = field.props.render({ field: { value: 25, onChange: (value) => { changed = value; } }, fieldState: {} });
  assert.equal(input.props.value, "25");
  input.props.onChangeText("30"); assert.equal(changed, 30);
  input.props.onChangeText(""); assert.equal(changed, undefined);
});
