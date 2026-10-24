/* global __dirname */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const babel = require("@babel/core");

const root = path.resolve(__dirname, "..");
const screenFile = path.join(root, "app/(app)/chat/[id].tsx");
const source = ts.createSourceFile(
  screenFile,
  fs.readFileSync(screenFile, "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let opening;
function visit(node) {
  if (
    ts.isJsxOpeningElement(node) &&
    node.tagName.getText(source) === "KeyboardAvoidingView"
  )
    opening = node;
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(opening);
// Exercise the chat screen's actual wrapper props with the installed native
// implementation, without replacing the chat's data/auth hooks with fixtures.
const wrapper = ts.factory.createJsxSelfClosingElement(
  opening.tagName,
  undefined,
  opening.attributes,
);
const jsx = ts
  .createPrinter()
  .printNode(ts.EmitHint.Unspecified, wrapper, source);
const wrapperModule = new Module(screenFile, module);
wrapperModule.filename = screenFile;
wrapperModule.paths = Module._nodeModulePaths(root);
wrapperModule._compile(
  ts.transpileModule(
    `export default function(Platform) { const tw=()=>({}); const KeyboardAvoidingView="Keyboard"; return (${jsx}); }`,
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  screenFile,
);
const propsFor = wrapperModule.exports.default;
const nativeFile = path.join(
  path.dirname(require.resolve("react-native/package.json")),
  "Libraries/Components/Keyboard/KeyboardAvoidingView.js",
);

function keyboardScreen(platform = "android") {
  const handlers = new Map();
  const dependencies = {
    "../../StyleSheet/StyleSheet": { compose: (a, b) => [a, b] },
    "../../Utilities/Platform": { OS: platform },
    "../../LayoutAnimation/LayoutAnimation": {
      Types: { keyboard: "keyboard" },
      configureNext() {},
    },
    "../AccessibilityInfo/AccessibilityInfo": {
      prefersCrossFadeTransitions: async () => false,
    },
    "../View/View": "View",
    "./Keyboard": {
      isVisible: () => false,
      addListener: (name, fn) => {
        handlers.set(name, fn);
        return { remove: () => handlers.delete(name) };
      },
    },
  };
  const loaded = new Module(nativeFile, module);
  loaded.filename = nativeFile;
  loaded.paths = Module._nodeModulePaths(path.dirname(nativeFile));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (name) =>
    Object.hasOwn(dependencies, name)
      ? dependencies[name]
      : originalRequire(name);
  const transformed = babel.transformSync(fs.readFileSync(nativeFile, "utf8"), {
    filename: nativeFile,
    babelrc: false,
    configFile: false,
    presets: [require.resolve("@react-native/babel-preset")],
  });
  loaded._compile(transformed.code, nativeFile);
  const view = new loaded.exports.default(propsFor({ OS: platform }).props);
  view.setState = (update) => {
    view.state = { ...view.state, ...update };
  };
  view.componentDidMount();
  let frame;
  return {
    layout: async (height, y = 0) => {
      frame = { x: 0, y, width: 390, height };
      await view._onLayout({ persist() {}, nativeEvent: { layout: frame } });
    },
    keyboard: async (name, screenY, height) => {
      handlers.get(name)({
        duration: 0,
        easing: "keyboard",
        endCoordinates: { screenX: 0, screenY, width: 390, height },
      });
      await new Promise((resolve) => setImmediate(resolve));
    },
    get bottom() {
      const styles = Object.assign(
        {},
        ...[view.render().props.style].flat(Infinity).filter(Boolean),
      );
      return frame.y + frame.height - (styles.paddingBottom || 0);
    },
    get padding() {
      return (
        Object.assign(
          {},
          ...[view.render().props.style].flat(Infinity).filter(Boolean),
        ).paddingBottom || 0
      );
    },
    cleanup: () => view.componentWillUnmount(),
    handlers,
  };
}

for (const systemBottom of [0, 24, 48]) {
  test(`Android keyboard keeps the composer visible with ${systemBottom} points of system navigation`, async () => {
    const screen = keyboardScreen();
    try {
      await screen.layout(844 - systemBottom);
      await screen.keyboard("keyboardDidShow", 520, 324 - systemBottom);
      assert.equal(
        screen.bottom,
        520,
        "composer must finish above the overlaid keyboard",
      );
      await screen.layout(520 - systemBottom);
      assert.equal(
        screen.padding,
        0,
        "a resized Android window must not receive a second keyboard inset",
      );
      assert.ok(screen.bottom <= 520);
      await screen.keyboard("keyboardDidHide", 844 - systemBottom, 0);
      await screen.layout(844 - systemBottom);
      assert.equal(screen.bottom, 844 - systemBottom);
    } finally {
      screen.cleanup();
    }
    assert.equal(screen.handlers.size, 0);
  });
}
test("Android keyboard can reopen and survive a viewport resize without an accumulating gap", async () => {
  const screen = keyboardScreen();
  try {
    await screen.layout(820);
    for (let cycle = 0; cycle < 3; cycle++) {
      await screen.keyboard("keyboardDidShow", 520, 300);
      assert.equal(screen.bottom, 520);
      await screen.keyboard("keyboardDidHide", 820, 0);
      assert.equal(screen.bottom, 820);
    }
    await screen.keyboard("keyboardDidShow", 520, 300);
    await screen.layout(460);
    await screen.keyboard("keyboardDidShow", 260, 200);
    assert.equal(screen.bottom, 260);
    await screen.keyboard("keyboardDidHide", 460, 0);
    assert.equal(screen.bottom, 460);
  } finally {
    screen.cleanup();
  }
});
test("iOS retains its keyboard clearance", async () => {
  const screen = keyboardScreen("ios");
  try {
    await screen.layout(810);
    await screen.keyboard("keyboardWillShow", 500, 310);
    assert.equal(screen.bottom, 484);
    await screen.keyboard("keyboardWillHide", 810, 0);
    assert.equal(screen.bottom, 810);
  } finally {
    screen.cleanup();
  }
});
