import { defineConfig } from "@lingui/cli"

export default defineConfig({
  locales: ["en", "fr", "es"],
  sourceLocale: "en",
  catalogs: [{ path: "locales/{locale}", include: ["auth"] }],
})
