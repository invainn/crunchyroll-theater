import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const build = process.env.BUILD === "true";

export default [
  {
    input: "src/js/content.ts",
    output: {
      dir: "public/js",
      format: "cjs",
    },
    plugins: [typescript(), nodeResolve(), build && terser()],
  },
  {
    input: "src/js/player.ts",
    output: {
      dir: "public/js",
      format: "cjs",
    },
    plugins: [typescript(), nodeResolve(), build && terser()],
  },
  {
    input: "src/js/background.ts",
    output: {
      dir: "public/js",
      format: "cjs",
    },
    plugins: [typescript(), nodeResolve(), build && terser()],
  },
  {
    input: "src/js/popup.ts",
    output: {
      dir: "public/js",
      format: "es",
    },
    plugins: [typescript(), nodeResolve(), build && terser()],
  },
];
