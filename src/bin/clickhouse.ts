#!/usr/bin/env tsx

import { MigrationFileManager } from "@/clickhouse/migrations/clickhouse_migrations_manager.ts";
import { run, command, positional } from "@drizzle-team/brocli";

const makeMigration = command({
  name: "make",
  options: {
    name: positional().desc("Name of migration file").required(),
  },
  handler: (opts) => MigrationFileManager.createMigrationFiles(opts.name),
});

run([makeMigration]);
