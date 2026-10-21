const assert = require("node:assert/strict");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const vendorRoot = "node_modules/react-native-reanimated/src/";
const { PropsFilter } = loadTypeScript(
  `${vendorRoot}createAnimatedComponent/PropsFilter.tsx`,
  {
    "../animation": { initialUpdaterRun: (updater) => updater() },
    "../isSharedValue": loadTypeScript(`${vendorRoot}isSharedValue.ts`),
    "../PlatformChecker": { isChromeDebugger: () => false },
    "../WorkletEventHandler": { WorkletEventHandler: class {} },
    "./InlinePropManager": {
      getInlineStyle: () => {
        throw new Error("SVG groups should not have inline shared styles");
      },
      hasInlineStyles: () => false,
    },
    "./utils": loadTypeScript(`${vendorRoot}createAnimatedComponent/utils.ts`),
  },
);

// Use the installed Reanimated prop filter at the render boundary. The older
// drawing mocks accepted animatedProps={undefined}, which crashes in 3.17.4.
const reanimated = {
  Easing: { bezierFn: () => (value) => value },
  default: {
    createAnimatedComponent: (Component) =>
      function AnimatedSvgGroup(props) {
        const filtered = new PropsFilter().filterNonAnimatedProps({
          props,
          _isFirstRender: true,
        });
        return React.createElement(Component, filtered);
      },
  },
  interpolateColor: (value, _range, colors) =>
    value < 0.5 ? colors[0] : colors[1],
  createAnimatedPropAdapter: (adapter) => adapter,
  useSharedValue: (value) => ({ value }),
  useAnimatedProps: (updater, _deps, adapter) => {
    const value = updater();
    adapter?.(value);
    return { initial: { value, updater } };
  },
  interpolate: (value, inputs, outputs) => {
    for (let index = 1; index < inputs.length; index++) {
      if (value <= inputs[index]) {
        return (
          outputs[index - 1] +
          ((value - inputs[index - 1]) / (inputs[index] - inputs[index - 1])) *
            (outputs[index] - outputs[index - 1])
        );
      }
    }
    return outputs[outputs.length - 1];
  },
};
const svg = {
  default: ({ accessible, ...props }) => React.createElement("svg", props),
  G: ({ matrix, transform, ...props }) =>
    React.createElement("g", {
      ...props,
      transform: matrix ? `matrix(${matrix.join(" ")})` : transform,
    }),
  Line: "line",
  Circle: "circle",
  Ellipse: "ellipse",
  Path: "path",
  Rect: "rect",
  Defs: "defs",
  RadialGradient: "radialGradient",
  Stop: "stop",
};
loadTypeScript("utils/svgMotion.ts", {
  "react-native": { Platform: { OS: "android" } },
  "react-native-reanimated": reanimated,
});
const parts = loadTypeScript("components/ui/GogoArtworkParts.tsx", {
  "react-native-reanimated": reanimated,
  "react-native-svg": svg,
});
const frenzyMotion = loadTypeScript("hooks/useGogoFrenzyMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoFrenzyArtwork } = loadTypeScript(
  "components/feed/GogoFrenzyArtwork.tsx",
  {
    "@/components/ui/GogoArtworkParts": parts,
    "@/hooks/useGogoFrenzyMotion": frenzyMotion,
    "react-native-svg": svg,
  },
);
const normalMotion = loadTypeScript("hooks/useGogoMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoArtwork } = loadTypeScript("components/ui/GogoArtwork.tsx", {
  "./GogoArtworkParts": parts,
  "@/hooks/useGogoMotion": normalMotion,
  "react-native-svg": svg,
});

test("the event feed mascot renders all four frenzy levels through Reanimated's actual prop filter", () => {
  for (const animated of [true, false]) {
    for (const level of [1, 2, 3, 4]) {
      const markup = renderToStaticMarkup(
        React.createElement(GogoFrenzyArtwork, { level, size: 88, animated }),
      );
      assert.match(markup, /fill="#1EEBC8"/);
      assert.match(markup, /cx="100" cy="14" r="9"/);
    }
  }
});

test("the regular mascot's animated antenna still renders for every pose", () => {
  for (const animated of [true, false]) {
    for (const pose of ["base", "wave", "celebrate", "lost"]) {
      const markup = renderToStaticMarkup(
        React.createElement(GogoArtwork, { pose, size: 88, animated }),
      );
      assert.match(markup, /fill="#1EEBC8"/);
      assert.match(markup, /cx="100" cy="14" r="9"/);
    }
  }
});

const carMotion = loadTypeScript("hooks/useGogoCarMotion.ts", {
  "react-native-reanimated": reanimated,
  "@/hooks/useGogoFrenzyMotion": frenzyMotion,
});
const { GogoCarFrenzyArtwork } = loadTypeScript(
  "components/feed/GogoCarFrenzyArtwork.tsx",
  {
    "@/components/ui/GogoArtworkParts": parts,
    "./GogoFrenzyArtwork": loadTypeScript(
      "components/feed/GogoFrenzyArtwork.tsx",
    ),
    "@/hooks/useGogoCarMotion": carMotion,
    "@/hooks/useGogoFrenzyMotion": frenzyMotion,
    "react-native-reanimated": reanimated,
    "react-native-svg": svg,
  },
);

test("the roadster renders all heat levels through the real animation prop filter", () => {
  for (const animated of [true, false]) {
    for (const level of [1, 2, 3, 4]) {
      const markup = renderToStaticMarkup(
        React.createElement(GogoCarFrenzyArtwork, {
          level,
          size: 96,
          animated,
        }),
      );
      assert.match(markup, /x="70" y="200" width="260" height="92"/);
      assert.match(markup, /cx="120" cy="238" r="18"/);
      assert.match(markup, /x1="68" y1="266" x2="68" y2="326"/);
      assert.match(markup, /cx="100" cy="14" r="9"/);
    }
  }
});

const loadingMotion = loadTypeScript("hooks/useGogoLoadingMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoLoadingArtwork } = loadTypeScript(
  "components/ui/GogoLoadingArtwork.tsx",
  {
    "./GogoArtworkParts": parts,
    "@/hooks/useGogoLoadingMotion": loadingMotion,
    "react-native-svg": svg,
  },
);

test("the page loader renders its antenna and all three rings through the real animation prop filter", () => {
  for (const animated of [true, false]) {
    const markup = renderToStaticMarkup(
      React.createElement(GogoLoadingArtwork, { width: 180, animated }),
    );
    assert.match(markup, /viewBox="-20 -8 240 280"/);
    assert.match(markup, /height="210"/);
    assert.match(markup, /stroke-dasharray="30 27"/);
    for (const x of [72, 100, 128]) {
      assert.match(markup, new RegExp(`cx="${x}" cy="248" r="7"`));
    }
  }
});

const spinnerMotion = loadTypeScript("hooks/useGogoSpinnerMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoSpinnerArtwork } = loadTypeScript(
  "components/ui/GogoSpinnerArtwork.tsx",
  {
    "./GogoArtworkParts": parts,
    "@/hooks/useGogoSpinnerMotion": spinnerMotion,
    "react-native-svg": svg,
  },
);

test("small Gogo renders at button and inline sizes through the real animation prop filter", () => {
  for (const animated of [true, false]) {
    for (const size of [18, 24, 40, 128]) {
      const markup = renderToStaticMarkup(
        React.createElement(GogoSpinnerArtwork, {
          size,
          animated,
          ringColor: "#1EEBC8",
        }),
      );
      assert.match(markup, /viewBox="0 0 64 64"/);
      assert.match(markup, /stroke-dasharray="46 137"/);
      assert.match(markup, /transform="translate\(12 10\) scale\(0.2\)"/);
      assert.match(markup, /cx="70" cy="98" r="12"/);
    }
  }
});

const startupMotion = loadTypeScript("hooks/useGogoStartupMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoStartupArtwork } = loadTypeScript(
  "components/ui/GogoStartupArtwork.tsx",
  {
    "@/hooks/useGogoStartupMotion": startupMotion,
    "./GogoArtworkParts": parts,
    "react-native-reanimated": reanimated,
    "react-native-svg": svg,
  },
);

test("startup renders its logo-to-Gogo frames through the installed native animation prop filter", () => {
  for (const animated of [true, false]) {
    for (const value of [0, 20, 45, 60, 85, 100]) {
      const markup = renderToStaticMarkup(
        React.createElement(GogoStartupArtwork, {
          progress: { value },
          animated,
          size: 240,
        }),
      );
      assert.match(markup, /viewBox="-50 -30 300 300"/);
      assert.match(markup, /fill="#1EEBC8"/);
    }
  }
});
