#!/usr/bin/env tsx

import {
  MigrationFileManager,
  MigrationManager,
} from '@/clickhouse/migrations/clickhouse_migrations_manager.ts'
import { run, command, positional } from '@drizzle-team/brocli'

const makeMigration = command({
  name: 'make',
  options: {
    name: positional().desc('Name of migration file').required(),
  },
  handler: (opts) => MigrationFileManager.createMigrationFiles(opts.name),
})

const runMigrations = command({
  name: 'run',
  handler: () => new MigrationManager().applyPendingMigrations(),
})

run([makeMigration, runMigrations])
