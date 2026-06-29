import { CommandFactory } from "nest-commander";
import { MongoMigrationModule } from "./module";
import { IMongoMigration } from "./adapter";

export type MongoMigrationInput = {
  uri: string;
  dbName: string;
  changelogCollection: string;
  migrations: IMongoMigration[];
  migrationsPath: string;
  logLevels: ("verbose" | "debug" | "log" | "warn" | "error" | "fatal")[];
};


export const runMongoMigrationCLI = async (module: MongoMigrationInput) =>
  CommandFactory.run(
    MongoMigrationModule.forRoot({
      uri: module.uri,
      dbName: module.dbName,
      changelogCollection: module.changelogCollection,
      migrations: module.migrations,
      migrationsPath: module.migrationsPath
    }),
    module.logLevels ?? ['log', 'warn', 'error'],
  );
