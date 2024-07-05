import "reflect-metadata"

import { Ignitor } from "@/infrastructure/boot/ignitor"

process.env.NODE_ENV = "test"
process.env.DATABASE_URL =
  "postgresql://bahdcoder:password@localhost:5432/bamboomailer_tests?schema=public"

new Ignitor().boot().register()
