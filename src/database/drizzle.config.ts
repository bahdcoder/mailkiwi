import { apiEnv } from "@/api/env/api_env.ts"
import { defineConfig } from "drizzle-kit"
import { resolve } from "node:path"

export default defineConfig({
  dialect: "mysql",
  schema: resolve(__dirname, "schema", "schema.ts"),
  out: resolve(__dirname, "schema", "migrations"),
  dbCredentials: {
    url: apiEnv.DATABASE_URL,
  },
  verbose: true,
  strict: false,
})
