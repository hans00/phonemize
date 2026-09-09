const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  // agent worktrees live under .claude/ and carry their own copies of the suite
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.claude/"],
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  transform: {
    ...tsJestTransformCfg,
  },
};
