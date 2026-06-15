import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["tests/e2e/**", "src/lib/signup-form.test.ts"],
  },
});
