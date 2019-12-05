import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import ts from "rollup-plugin-typescript";
import replace from "rollup-plugin-replace";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.tsx",
  output: {
    file: "dist/bundle.js",
    format: "iife", // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),
    ts(),
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(),
    // converts date-fns to ES modules
    production && false && terser() // minify, but only in production
  ]
};
