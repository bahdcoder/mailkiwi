import { defineConfig } from "drizzle-kit"
import { resolve } from "node:path"

import { env } from "@/shared/env/index.ts"

export default defineConfig({
  dialect: "mysql",
  schema: resolve(__dirname, "schema", "schema.ts"),
  out: resolve(__dirname, "schema", "migrations"),
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: false,
})
