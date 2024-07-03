import { defineConfig, configDefaults } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
    setupFiles: ["src/tests/setup.ts"],
    exclude: [...configDefaults.exclude, "**/build/**"],
  },
  plugins: [tsconfigPaths()],
})
