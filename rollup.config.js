import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import ts from "rollup-plugin-typescript";
import replace from "rollup-plugin-replace";
// import linaria from "linaria/rollup";
import css from "rollup-plugin-css-only";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
// process.env.NODE_ENV = "production";
// const production = process.env.NODE_ENV;
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.tsx",
  output: {
    dir: "dist",
    format: "module",
    sourcemap: true
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),
    ts(),
    resolve(),
    commonjs({
      namedExports: {
        "node_modules/react/index.js": [
          "Children",
          "Component",
          "PropTypes",
          "useState",
          "useEffect",
          "useRef",
          "useReducer",
          "Fragment",
          "createElement"
        ],
        "node_modules/react-dom/index.js": ["render"]
      }
    }),
    // converts date-fns to ES modules
    production && terser(), // minify, but only in production
    // linaria({ sourceMap: process.env.NODE_ENV !== "production" }),
    css({ output: "dist/styles.css" })
  ]
};
