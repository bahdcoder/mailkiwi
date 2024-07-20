import pluginJs from "@eslint/js"
import EslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort"
import globals from "globals"

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  { ignores: ["build/", "node_modules/", "coverage/"] },
  {
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    plugins: {
      "simple-import-sort": EslintPluginSimpleImportSort,
    },
  },
  pluginJs.configs.recommended,
]
