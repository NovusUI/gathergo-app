const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const { default: WalletSetupReminder } = loadTypeScript("components/ui/WalletSetupReminder.tsx", {
  "@/components/gogo/mascot/MascotMoment": { MascotMoment: "GogoMessage" },
  "react-native": { Text: "Text", TouchableOpacity: "Button" },
  twrnc: { default: () => ({}) },
});
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
test("the Gogo payout reminder describes the actual next action and opens Wallet directly", () => {
  for (const [nextAction, phrase] of [["ADD_SETTLEMENT_ACCOUNT", /settlement account/], ["COMPLETE_KYC", /verification/], ["PREPARE_ALAT_PROFILE", /ALAT/]]) {
    let opened = 0;
    const tree = WalletSetupReminder({ nextAction, onPress: () => opened++ });
    const mascot = [...nodes(tree)].find(node => node.type === "GogoMessage");
    assert.equal(mascot.props.variant, "pending");
    assert.match(mascot.props.message, phrase);
    tree.props.onPress();
    assert.equal(opened, 1);
    assert.equal([...nodes(tree)].some(node => node.type === "Modal"), false);
  }
});
