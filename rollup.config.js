import merge from "deepmerge";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { createBasicConfig } from '@open-wc/building-rollup';


const baseConfig = createBasicConfig();

export default [
  merge(baseConfig, {
    input: "src/js/content.ts",
    output: {
      file: "public/js/content.js",
      dir: undefined,
    },
    plugins: [typescript()],
  }),
  merge(baseConfig, {
    input: "src/js/player.ts",
    output: {
      file: "public/js/player.js",
      dir: undefined,
    },
    plugins: [typescript()],
  }),
  merge(baseConfig, {
    input: "src/background.ts",
    output: {
      file: "public/background.js",
      dir: undefined,
    },
    plugins: [typescript()],
  }),
  merge(baseConfig, {
    input: "src/js/popup.ts",
    output: {
      file: "public/js/popup.js",
      dir: undefined,
    },
    plugins: [typescript(), nodeResolve()],
  }),
];
