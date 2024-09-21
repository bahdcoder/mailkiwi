import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
    setupFiles: ["src/tests/setup.ts"],
    hideSkippedTests: true,
    exclude: [...configDefaults.exclude, "**/build/**"],
    reporters: ["verbose"],
    retry: 3,
  },
  plugins: [tsconfigPaths()],
})
