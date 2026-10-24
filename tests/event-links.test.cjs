const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const { default: EventLinks } = loadTypeScript("components/eventInfo/EventLinks.tsx", {
  "@/components/View": { default: "View" },
  "@/components/inputs/CustomInput1": { default: "Input" },
  "@/components/labels/FormLabel": { default: "Label" },
  "@expo/vector-icons": { Ionicons: "Icon" },
  "lucide-react-native": { PlusIcon: "Plus", Trash2Icon: "Trash" },
  "react-native": { Text: "Text", TouchableOpacity: "Button", View: "View" },
  twrnc: { default: () => ({}) },
});
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
test("the simplified links section still adds, edits and removes local link fields", () => {
  let links = [];
  const render = () => EventLinks({ links, onChange: next => { links = next; } });
  const first = render();
  const add = [...nodes(first)].find(node => node.type === "Button");
  add.props.onPress();
  assert.deepEqual(links, [""]);
  const input = [...nodes(render())].find(node => node.type === "Input");
  input.props.onChangeText("https://example.com");
  assert.deepEqual(links, ["https://example.com"]);
  const remove = [...nodes(render())].find(node => node.type === "Button" && [...nodes(node)].some(child => child.type === "Trash"));
  remove.props.onPress();
  assert.deepEqual(links, []);
});
