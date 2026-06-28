import { DynamicModule, Module } from '@nestjs/common'
import { MigrationRollbackCommand, MigrationRunCommand, MigrationStatusCommand } from './command'
import { MongoMigrationRunner, MongoMigrationRunnerConfig } from './runner'

@Module({})
export class MongoMigrationModule {
  static forRoot(config: MongoMigrationRunnerConfig): DynamicModule {
    if (!config.uri || !config.dbName) {
      throw new Error(`${MongoMigrationModule.name}: config is missing required uri or dbName`)
    }
    return {
      module: MongoMigrationModule,
      providers: [
        {
          provide: MongoMigrationRunner,
          useFactory: () => {
            return new MongoMigrationRunner(config)
          }
        },
        MigrationRunCommand,
        MigrationRollbackCommand,
        MigrationStatusCommand
      ],
      exports: [MongoMigrationRunner]
    }
  }
}
