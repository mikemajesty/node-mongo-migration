import { Db } from 'mongodb'

import { bold, green, red, yellow } from 'colorette'
import { MongoClient } from 'mongodb'
import { IMongoMigration, IMongoMigrationRunner } from './adapter'
export class MongoMigrationRunner implements IMongoMigrationRunner {
  private context = bold(green(MongoMigrationRunner.name))
  private client!: MongoClient
  private db!: Db

  constructor(readonly config: MongoMigrationRunnerConfig) {}

  async getStatus() {
    try {
      await this.connect()
      const changelog = this.db.collection(this.config.changelogCollection || 'migrations')
      const appliedMigrations = await changelog.find().toArray()
      const appliedVersions = appliedMigrations.map((m) => m.version)

      return this.config.migrations.map((m) => ({
        version: m.version,
        name: m.constructor.name,
        applied: appliedVersions.includes(m.version)
      }))
    } finally {
      await this.close()
    }
  }

  async runMigrations(migrations: IMongoMigration[], direction: 'up' | 'down') {
    try {
      await this.connect()
      const { sorted, changelog } = this.getCollection(migrations, direction)

      for (const migration of sorted) {
        const alreadyApplied = await changelog.findOne({ version: migration.version })
        if (direction === 'up' && alreadyApplied) {
          console.log(
            `${this.context} ${yellow('⏭️ Migration: ')} ${bold(migration.constructor.name)} ${green(bold(migration.version))} ${yellow('already applied, skipping')}`
          )
          continue
        }
        if (direction === 'down' && !alreadyApplied) {
          console.log(
            `${this.context} ${yellow('⏭️ Migration: ')} ${bold(migration.constructor.name)} ${green(bold(migration.version))} ${yellow('not applied yet, skipping')}`
          )
          continue
        }

        try {
          if (direction === 'up') {
            await migration.up(this.db)
            await changelog.insertOne({
              version: migration.version,
              name: migration.constructor.name,
              appliedAt: new Date()
            })
          } else {
            await migration.down(this.db)
            await changelog.deleteOne({ version: migration.version })
          }
          console.log(
            `${this.context} ${green('✅')} ${direction} applied: ${bold(migration.constructor.name)} ${green(bold(migration.version))}`
          )
        } catch (err) {
          console.error(`${this.context} ${red('❌')} Error on ${direction} ${green(bold(migration.version))}:`, err)
          throw err
        }
      }
    } finally {
      await this.close()
    }
  }

  public getCollection = (migrations: IMongoMigration[], direction: 'up' | 'down') => {
    const changelog = this.db.collection(this.config.changelogCollection)

    const sorted = migrations.sort((a, b) =>
      direction === 'up' ? a.version.localeCompare(b.version) : b.version.localeCompare(a.version)
    )
    return { sorted, changelog }
  }

  public async getChangeLog() {
    await this.connect()
    const changelog = this.db.collection(this.config.changelogCollection).find()
    return changelog.sort({ appliedAt: -1 })
  }

  private async connect() {
    this.client = new MongoClient(this.config.uri)
    await this.client.connect()
    this.db = this.client.db(this.config.dbName)
  }

  private async close() {
    await this.client?.close()
  }
}

export type MongoMigrationRunnerConfig = {
  uri: string
  dbName: string
  changelogCollection: string
  migrations: IMongoMigration[]
}
