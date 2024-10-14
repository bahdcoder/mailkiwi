import { defineConfig } from "drizzle-kit"
import { resolve } from "node:path"

export default defineConfig({
  dialect: "mysql",
  schema: "database/schema.ts",
  out: "migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  verbose: true,
  strict: false,
  breakpoints: true,
})
