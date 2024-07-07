import { defineConfig } from "drizzle-kit"
import { resolve } from "path"

import { env } from "@/infrastructure/env.ts"

export default defineConfig({
  dialect: "mysql",
  schema: resolve(__dirname, "schema", "schema.ts"),
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: false,
})
