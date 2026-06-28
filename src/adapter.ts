// adapter.ts
import { Db } from 'mongodb'

export interface IMongoMigration {
  /**
   * Unique sequential version identifier for this migration.
   * It is a string, so it may include leading zeros if needed.
   * Examples: "1", "01", "001", "0001", "10", "100".
   */
  get version(): string
  up(db: Db): Promise<void>
  down(db: Db): Promise<void>
}

export interface IMongoMigrationRunner {
  runMigrations(migrations: IMongoMigration[], direction: 'up' | 'down'): Promise<void>
}
