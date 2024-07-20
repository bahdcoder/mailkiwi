import { defineConfig } from "drizzle-kit"
import { resolve } from "path"

import { env } from "@/infrastructure/env.ts"

export default defineConfig({
  dialect: "sqlite",
  schema: resolve(__dirname, "schema", "schema.ts"),
  out: resolve(__dirname, "schema", "migrations"),
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: false,
})
