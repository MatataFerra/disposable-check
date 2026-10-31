import { defineConfig, type ViteUserConfig } from "vitest/config";

const config: ViteUserConfig = defineConfig({
  test: {
    // Only this project's tests, not those of tools installed in the repo.
    include: ["test/**/*.test.ts"],
  },
});

export default config;
