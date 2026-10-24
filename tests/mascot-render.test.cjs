const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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
loadTypeScript("components/gogo/mascot/motion/svgMotion.ts", {
  "react-native": { Platform: { OS: "android" } },
  "react-native-reanimated": reanimated,
});
const parts = loadTypeScript("components/gogo/mascot/GogoArtworkParts.tsx", {
  "react-native-reanimated": reanimated,
  "react-native-svg": svg,
});
const frenzyMotion = loadTypeScript("components/gogo/mascot/motion/useGogoFrenzyMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoFrenzyArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoFrenzyArtwork.tsx",
  {
    "@/components/gogo/mascot/GogoArtworkParts": parts,
    "@/components/gogo/mascot/motion/useGogoFrenzyMotion": frenzyMotion,
    "react-native-svg": svg,
  },
);
const normalMotion = loadTypeScript("components/gogo/mascot/motion/useGogoMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoArtwork } = loadTypeScript("components/gogo/mascot/GogoArtwork.tsx", {
  "@/components/gogo/mascot/GogoArtworkParts": parts,
  "@/components/gogo/mascot/motion/useGogoMotion": normalMotion,
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

const carMotion = loadTypeScript("components/gogo/mascot/motion/useGogoCarMotion.ts", {
  "react-native-reanimated": reanimated,
  "@/components/gogo/mascot/motion/useGogoFrenzyMotion": frenzyMotion,
});
const { GogoCarFrenzyArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoCarFrenzyArtwork.tsx",
  {
    "@/components/gogo/mascot/GogoArtworkParts": parts,
    "@/components/gogo/mascot/GogoFrenzyArtwork": loadTypeScript(
      "components/gogo/mascot/GogoFrenzyArtwork.tsx",
    ),
    "@/components/gogo/mascot/motion/useGogoCarMotion": carMotion,
    "@/components/gogo/mascot/motion/useGogoFrenzyMotion": frenzyMotion,
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

const loadingMotion = loadTypeScript("components/gogo/mascot/motion/useGogoLoadingMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoLoadingArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoLoadingArtwork.tsx",
  {
    "@/components/gogo/mascot/GogoArtworkParts": parts,
    "@/components/gogo/mascot/motion/useGogoLoadingMotion": loadingMotion,
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

const spinnerMotion = loadTypeScript("components/gogo/mascot/motion/useGogoSpinnerMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoSpinnerArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoSpinnerArtwork.tsx",
  {
    "@/components/gogo/mascot/GogoArtworkParts": parts,
    "@/components/gogo/mascot/motion/useGogoSpinnerMotion": spinnerMotion,
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

const startupMotion = loadTypeScript("components/gogo/mascot/motion/useGogoStartupMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoStartupArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoStartupArtwork.tsx",
  {
    "@/components/gogo/mascot/motion/useGogoStartupMotion": startupMotion,
    "@/components/gogo/mascot/GogoArtworkParts": parts,
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
      assert.match(
        markup,
        /x="-50" y="-30" width="300" height="300" fill="#01082E"/,
      );
      assert.match(markup, /fill="#1EEBC8"/);
    }
  }
});

const comingSoonMotion = loadTypeScript("components/gogo/mascot/motion/useGogoComingSoonMotion.ts", {
  "react-native-reanimated": reanimated,
});
const { GogoComingSoonArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoComingSoonArtwork.tsx",
  {
    "@/components/gogo/mascot/motion/useGogoComingSoonMotion": comingSoonMotion,
    "@/components/gogo/mascot/GogoArtworkParts": parts,
    "react-native-svg": svg,
  },
);
test("the laptop coming-soon artwork renders through the installed native prop filter", () => {
  for (const animated of [true, false]) {
    const markup = renderToStaticMarkup(
      React.createElement(GogoComingSoonArtwork, { width: 220, animated }),
    );
    assert.match(markup, /viewBox="-30 -40 260 270"/);
    assert.match(markup, /d="M44 50C44 8 156 8 156 50Z" fill="#FFD84D"/);
    assert.match(
      markup,
      /x="14" y="160" width="172" height="54" rx="10" fill="#17524A"/,
    );
    assert.match(markup, /cx="100" cy="187" r="11"/);
    assert.doesNotMatch(markup, /animatedProps/);
  }
});

const onboardingCarpoolMotion = loadTypeScript(
  "components/gogo/mascot/motion/useGogoOnboardingCarpoolMotion.ts",
  {
    "react-native-reanimated": reanimated,
  },
);
const { GogoOnboardingCarpoolArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoOnboardingCarpoolArtwork.tsx",
  {
    "@/components/gogo/mascot/motion/useGogoOnboardingCarpoolMotion": onboardingCarpoolMotion,
    "@/components/gogo/mascot/GogoArtworkParts": parts,
    "react-native-reanimated": reanimated,
    "react-native-svg": svg,
  },
);

test("the native onboarding carpool retains the supplied artwork and renders through Reanimated's prop filter", () => {
  const source = fs.readFileSync(
    path.resolve("assets/images/onboarding2.svg"),
    "utf8",
  );
  const shapes = (markup) =>
    [...markup.matchAll(/<(path|circle|ellipse|rect)\b([^>]+)>/g)].map(
      ([, tag, attributes]) => {
        const props = Object.fromEntries(
          [...attributes.matchAll(/([\w-]+)="([^"]*)"/g)].map(
            ([, key, value]) => [key, value],
          ),
        );
        delete props.class;
        delete props["stroke-dashoffset"];
        // These two dash patterns originally lived in CSS rather than SVG attributes.
        if (props.d === "M34 240H272" || props.d === "M44 122Q140 14 240 80")
          delete props["stroke-dasharray"];
        return { tag, props };
      },
    );
  for (const animated of [true, false]) {
    const markup = renderToStaticMarkup(
      React.createElement(GogoOnboardingCarpoolArtwork, {
        width: 280,
        height: 230,
        animated,
      }),
    );
    assert.match(markup, /viewBox="0 0 300 315"/);
    assert.match(markup, /stroke-dasharray="14 12"/);
    assert.match(markup, /stroke-dasharray="2 8"/);
    assert.deepEqual(shapes(markup), shapes(source));
    for (const transform of [
      "translate(102 95) scale(0.37)",
      "translate(44 95) scale(0.37)",
      "translate(168 95) scale(0.37)",
      "translate(160 22) rotate(-8 32 20)",
    ]) {
      assert.ok(markup.includes(`transform="${transform}"`));
    }
    assert.doesNotMatch(markup, /animatedProps|<style/);
  }
});
