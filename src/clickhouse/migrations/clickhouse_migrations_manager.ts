import { apiEnv } from "@/api/env/api_env.ts"
import { type ClickHouseClient, createClient } from "@clickhouse/client"
import chalk from "chalk"
import fs from "node:fs/promises"
import path from "node:path"

export class MigrationFileManager {
  noob() {}

  static readonly MIGRATIONS_DIR = path.resolve(
    process.cwd(),
    "src",
    "clickhouse",
    "schema",
  )

  static async readMigrationFiles(): Promise<string[]> {
    console.log(
      chalk.grey(
        `Reading clickhouse migrations from '${MigrationFileManager.MIGRATIONS_DIR}'`,
      ),
    )

    const files = await fs.readdir(MigrationFileManager.MIGRATIONS_DIR)
    return files.filter((file) => file.endsWith(".sql")).sort()
  }

  static async readMigrationContent(filename: string): Promise<string> {
    return fs.readFile(
      path.join(MigrationFileManager.MIGRATIONS_DIR, filename),
      "utf-8",
    )
  }

  static async createMigrationFiles(
    name: string,
    upSql = "-- Add your SQL migration here",
  ): Promise<string> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0]
    const migrationId = `${timestamp}_${name}`

    const migrationFile = path.join(
      MigrationFileManager.MIGRATIONS_DIR,
      `${migrationId}.sql`,
    )

    await fs.writeFile(migrationFile, upSql)

    return migrationId
  }
}

export class MigrationManager {
  private client: ClickHouseClient

  constructor() {
    this.client = createClient({
      url: apiEnv.CLICKHOUSE_DATABASE_URL,
    })
  }

  async applyPendingMigrations(): Promise<void> {
    const migrations = await MigrationFileManager.readMigrationFiles()

    for (const migration of migrations) {
      const id = path.parse(migration).name

      if (migration.includes("rollback")) {
        continue
      }

      const sql =
        await MigrationFileManager.readMigrationContent(migration)

      await this.client.query({ query: sql })

      console.log(
        `[${chalk.green("✓")}] Clickhouse migration ${id} applied successfully!`,
      )
    }

    await this.client.close()
  }
}
