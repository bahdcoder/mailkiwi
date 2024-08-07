import { ClickHouseClient } from "@clickhouse/client";
import fs from "fs/promises";
import path from "path";

export class MigrationFileManager {
  static readonly MIGRATIONS_DIR = path.resolve(
    process.cwd(),
    "src",
    "clickhouse",
    "schema",
  );

  static async readMigrationFiles(): Promise<string[]> {
    const files = await fs.readdir(this.MIGRATIONS_DIR);
    return files.filter((file) => file.endsWith(".sql")).sort();
  }

  static async readMigrationContent(filename: string): Promise<string> {
    return fs.readFile(path.join(this.MIGRATIONS_DIR, filename), "utf-8");
  }

  static async createMigrationFiles(
    name: string,
    upSql = "-- Add your SQL migration here",
    downSql = "-- Add your rollback SQL here",
  ): Promise<string> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0];
    const migrationId = `${timestamp}_${name}`;

    const upFile = path.join(this.MIGRATIONS_DIR, `${migrationId}.sql`);
    const downFile = path.join(
      this.MIGRATIONS_DIR,
      `${migrationId}.rollback.sql`,
    );

    await fs.writeFile(upFile, upSql);
    await fs.writeFile(downFile, downSql);

    return migrationId;
  }
}

export class MigrationRecordManager {
  constructor(private client: ClickHouseClient) {}

  async initializeMigrationTable(): Promise<void> {
    await this.client.query({
      query: /*sql*/ `
        CREATE TABLE IF NOT EXISTS migrations (
          id String,
          timestamp DateTime DEFAULT now(),
          PRIMARY KEY (id)
        ) ENGINE = MergeTree()
      `,
    });
  }

  async isMigrationApplied(id: string): Promise<boolean> {
    const result = await this.client.query({
      query: /*sql*/ `SELECT 1 FROM migrations WHERE id = ${id}`,
      format: "JSONEachRow",
    });

    const rows = await result.json();
    return rows.length > 0;
  }

  async recordMigration(id: string): Promise<void> {
    await this.client.query({
      query: /*sql*/ `INSERT INTO migrations (id) VALUES (${id})`,
    });
  }

  async removeMigrationRecord(id: string): Promise<void> {
    await this.client.query({
      query: /*sql*/ `DELETE FROM migrations WHERE id = ${id}`,
    });
  }

  async getAppliedMigrations(): Promise<any[]> {
    const result = await this.client.query({
      query: /*sql*/ `SELECT id, timestamp FROM migrations ORDER BY timestamp`,
      format: "JSONEachRow",
    });

    return await result.json();
  }
}

export class ClickHouseMigrationManager {
  private migrationRecordManager: MigrationRecordManager;

  constructor(private client: ClickHouseClient) {
    this.migrationRecordManager = new MigrationRecordManager(client);
  }

  async initializeDatabase(): Promise<void> {
    await this.migrationRecordManager.initializeMigrationTable();
  }

  async applyPendingMigrations(): Promise<void> {
    const migrations = await MigrationFileManager.readMigrationFiles();

    for (const migration of migrations) {
      const id = path.parse(migration).name;
      const applied = await this.migrationRecordManager.isMigrationApplied(id);

      if (!applied) {
        const sql = await MigrationFileManager.readMigrationContent(migration);
        await this.client.query({ query: sql });
        await this.migrationRecordManager.recordMigration(id);
        console.log(`Applied migration: ${id}`);
      }
    }
  }

  async rollbackMigrations(steps: number = 1): Promise<void> {
    const appliedMigrations =
      await this.migrationRecordManager.getAppliedMigrations();
    const migrationsToRollback = appliedMigrations.slice(-steps);

    for (const migration of migrationsToRollback.reverse()) {
      const rollbackFile = `${migration.id}.rollback.sql`;

      try {
        const sql =
          await MigrationFileManager.readMigrationContent(rollbackFile);
        await this.client.query({ query: sql });

        await this.migrationRecordManager.removeMigrationRecord(migration.id);

        console.log(`Rolled back migration: ${migration.id}`);
      } catch (error) {
        console.error(`Error rolling back migration ${migration.id}:`, error);
        break;
      }
    }
  }
}
