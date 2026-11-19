import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so tests don't load the TanStack Start,
// Nitro or devtools plugins. Unit tests here cover pure functions only.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Run as a UTC server would, so Manila date logic is tested against the
    // timezone the app is deployed in, not the developer's machine.
    env: { TZ: "UTC" },
  },
});
