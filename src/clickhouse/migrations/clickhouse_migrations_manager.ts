import { env } from '@/shared/env/index.ts'
import { type ClickHouseClient, createClient } from '@clickhouse/client'
import fs from 'node:fs/promises'
import path from 'node:path'

interface Migration {
  id: string
  TIMESTAMP: string
}

export class MigrationFileManager {
  noob() {}

  static readonly MIGRATIONS_DIR = path.resolve(
    process.cwd(),
    'src',
    'clickhouse',
    'schema',
  )

  static async readMigrationFiles(): Promise<string[]> {
    const files = await fs.readdir(MigrationFileManager.MIGRATIONS_DIR)
    return files.filter((file) => file.endsWith('.sql')).sort()
  }

  static async readMigrationContent(filename: string): Promise<string> {
    return fs.readFile(
      path.join(MigrationFileManager.MIGRATIONS_DIR, filename),
      'utf-8',
    )
  }

  static async createMigrationFiles(
    name: string,
    upSql = '-- Add your SQL migration here',
  ): Promise<string> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0]
    const migrationId = `${timestamp}_${name}`

    const migrationFile = path.join(
      MigrationFileManager.MIGRATIONS_DIR,
      `${migrationId}.sql`,
    )

    await fs.writeFile(migrationFile, upSql)

    return migrationId
  }
}

export class MigrationRecordManager {
  constructor(private client: ClickHouseClient) {}

  private DATABASE_NAME = env.CLICKHOUSE_DATABASE_URL.split('/').at(-1)

  get MIGRATIONS_TABLE() {
    return `${this.DATABASE_NAME}.__migrations`
  }

  async initializeMigrationTable(): Promise<void> {
    await this.client.query({
      query: /*sql*/ `
        CREATE TABLE IF NOT EXISTS ${this.MIGRATIONS_TABLE} (
          id String,
          timestamp DateTime DEFAULT now(),
          PRIMARY KEY (id)
        ) ENGINE = MergeTree()
      `,
    })
  }

  async isMigrationApplied(id: string): Promise<boolean> {
    const result = await this.client.query({
      query: /*sql*/ `SELECT * FROM ${this.MIGRATIONS_TABLE} WHERE id = {id:String}`,
      query_params: { id },
      format: 'JSONEachRow',
    })

    const rows = await result.json()
    return rows.length > 0
  }

  async recordMigration(id: string): Promise<void> {
    await this.client.insert({
      table: this.MIGRATIONS_TABLE,
      values: [{ id }],
      format: 'JSONEachRow',
    })
  }

  async removeMigrationRecord(id: string): Promise<void> {
    await this.client.query({
      query: /*sql*/ `DELETE FROM ${this.MIGRATIONS_TABLE} WHERE id = {id:String}`,
      query_params: { id },
    })
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.client.query({
      query: /*sql*/ `SELECT id, timestamp FROM ${this.MIGRATIONS_TABLE} ORDER BY timestamp`,
      format: 'JSONEachRow',
    })

    const migrations = await result.json<Migration>()

    return migrations
  }
}

export class MigrationManager {
  private initialized = false
  private client: ClickHouseClient
  private migrationRecordManager: MigrationRecordManager

  constructor() {
    this.client = createClient({
      url: env.CLICKHOUSE_DATABASE_URL,
    })

    this.migrationRecordManager = new MigrationRecordManager(this.client)
  }

  async initializeDatabase(): Promise<void> {
    if (this.initialized) return

    this.initialized = true
    await this.migrationRecordManager.initializeMigrationTable()
  }

  async applyPendingMigrations(): Promise<void> {
    await this.initializeDatabase()

    const migrations = await MigrationFileManager.readMigrationFiles()

    for (const migration of migrations) {
      const id = path.parse(migration).name

      if (migration.includes('rollback')) {
        continue
      }

      const applied = await this.migrationRecordManager.isMigrationApplied(id)

      if (!applied) {
        const sql = await MigrationFileManager.readMigrationContent(migration)

        await this.client.query({ query: sql })

        await this.migrationRecordManager.recordMigration(id)

        console.log(`Applied migration: ${id}`)
      } else {
        console.log(`Migration already applied: ${id}`)
      }
    }

    await this.client.close()
  }
}
