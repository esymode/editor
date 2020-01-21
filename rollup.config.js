import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import ts from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";

import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
// process.env.NODE_ENV = "production";
// const production = process.env.NODE_ENV;
const production = !process.env.ROLLUP_WATCH;
// process.env.NODE_ENV = "development";

export default [
  { entry: ["main", "src/main.tsx"], format: "esm" },
  { entry: ["ts_worker", "worker/tsWorker.ts"], format: "iife" }
].map(({ entry: [name, path], format }) => ({
  input: {
    [name]: path
    // "editor.worker":
    //   "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
    // "json.worker":
    //   "node_modules/monaco-editor/esm/vs/language/json/json.worker",
    // // "css.worker": "node_modules/monaco-editor/esm/vs/language/css/css.worker",
    // // "html.worker": "node_modules/monaco-editor/esm/vs/language/html/html.worker",
    // "ts.worker":
    //   "node_modules/monaco-editor/esm/vs/language/typescript/ts.worker"
  },
  output: {
    dir: "dist",
    format,
    sourcemap: true
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.env.CI": JSON.stringify(process.env.CI)
    }),
    ts(),
    resolve({}),
    commonjs({
      namedExports: {
        react: [
          "Children",
          "Component",
          "PropTypes",
          "useState",
          "useEffect",
          "useLayoutEffect",
          "useContext",
          "useRef",
          "useMemo",
          "useReducer",
          "Fragment",
          "createContext",
          "createElement"
        ],
        "react-dom": ["render"]
      }
    }),
    // converts date-fns to ES modules
    production && terser(), // minify, but only in production
    // linaria({ sourceMap: process.env.NODE_ENV !== "production" }),
    css({ output: "dist/styles.css" })
  ]
}));
