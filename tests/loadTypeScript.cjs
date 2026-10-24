/* global __dirname */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Run focused module tests with the app's existing TypeScript compiler.
const root = path.resolve(__dirname, "..");
const modules = new Map();
function loadTypeScript(relativePath, dependencies = {}) {
  const filename = path.join(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  modules.set(filename, loaded);
  const requireModule = loaded.require.bind(loaded);
  loaded.require = (specifier) => {
    if (Object.hasOwn(dependencies, specifier)) return dependencies[specifier];
    if (specifier === "@/hooks/useAppTheme") {
      const { DARK_COLORS } = loadTypeScript("constants/theme.ts");
      // Existing isolated screen tests use their supplied styling double in dark mode.
      const styling = dependencies.twrnc;
      const tw = styling?.default;
      if (tw && !tw.style && styling.style) tw.style = styling.style;
      return { useAppTheme: () => ({
        mode: "dark", colors: DARK_COLORS, color: (darkColor) => darkColor, tw,
      }) };
    }
    return specifier.startsWith("@/")
      ? loadTypeScript(`${specifier.slice(2)}.ts`)
      : requireModule(specifier);
  };
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  loaded._compile(result.outputText, filename);
  return loaded.exports;
}

module.exports = { loadTypeScript };
