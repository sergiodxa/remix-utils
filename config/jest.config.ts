import type { Config } from "@jest/types";
// eslint-disable-next-line unicorn/prefer-node-protocol
// eslint-disable-next-line unicorn/import-style
import * as path from "path";

const config: Config.InitialOptions = {
  verbose: Boolean(process.env.CI),
  rootDir: path.resolve("."),
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
  setupFilesAfterEnv: ["<rootDir>/config/jest/setup.ts"],
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  transform: {
    "\\.[jt]sx?$": [
      "babel-jest",
      { configFile: "./config/jest/babel.config.js" },
    ],
  },
};

export default config;
