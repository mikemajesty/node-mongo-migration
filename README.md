# @mikemajesty/mongo-migration

MongoDB migration runner for NestJS and Node.js applications, powered by `nest-commander`.

It provides a small CLI for creating migrations, running pending migrations, checking migration status, and rolling back applied migrations.

## Features

- Class-based TypeScript migrations
- Sequential string versions such as `0001`, `0002`, `0010`
- Configurable MongoDB changelog collection
- Idempotent `migration:run` command that skips already applied migrations
- Interactive rollback from the list of applied migrations
- Rollback by version
- Migration file generator

## Installation

```bash
npm install @mikemajesty/mongo-migration mongodb
```

`mongodb` is a peer dependency and must be installed by the consuming application.

## Create Your Migration CLI File

The consuming application must create a TypeScript file that calls `runMongoMigrationCLI`. This file can be placed in any folder. The important parts are:

- `migrations` must contain the migration classes that can be executed.
- `migrationsPath` must point to the folder where migration files are stored.
- The npm scripts must point to this CLI file.

Example: `src/infra/database/mongo/migrations/cli.ts`

```ts
import { runMongoMigrationCLI } from '@mikemajesty/mongo-migration'
import 'dotenv/config'
import path from 'path'
import { CreateCatsCollection } from './0001_create-cats-collection'

runMongoMigrationCLI({
	uri: process.env.MONGO_URL as string,
	dbName: process.env.MONGO_DATABASE as string,
	changelogCollection: 'changelog',
	migrations: [new CreateCatsCollection()],
	logLevels: ['warn', 'error'],
	migrationsPath: path.resolve(__dirname)
})
```

If you place the CLI file somewhere else, keep the same idea: import the migrations from their real location and set `migrationsPath` to the directory where new migration files should be created.

In this example, `migrationsPath: path.resolve(__dirname)` works because `cli.ts` is in the same folder as the migration files. If your CLI file is in another folder, `migrationsPath` must point to the folder where the migration files are located.

## Create a Migration

Each migration must implement `IMongoMigration`.

Example: `src/infra/database/mongo/migrations/0001_create-cats-collection.ts`

```ts
import { IMongoMigration } from '@mikemajesty/mongo-migration'
import { Db } from 'mongodb'

export class CreateCatsCollection implements IMongoMigration {
	get version(): string {
		return '0001'
	}

	async up(db: Db): Promise<void> {
		await db.createCollection('cats')
	}

	async down(db: Db): Promise<void> {
		await db.dropCollection('cats')
	}
}
```

After creating a migration file, import it in your CLI file and add an instance to the `migrations` array.

```ts
migrations: [new CreateCatsCollection()]
```

## Configure NPM Scripts

Point your package scripts to the CLI file created by your application.

```json
{
	"scripts": {
		"migration-mongo:create": "ts-node -r tsconfig-paths/register ./src/infra/database/mongo/migrations/cli.ts migration:create",
		"migration-mongo:run": "ts-node -r tsconfig-paths/register ./src/infra/database/mongo/migrations/cli.ts migration:run",
		"migration-mongo:rollback": "ts-node -r tsconfig-paths/register ./src/infra/database/mongo/migrations/cli.ts migration:rollback",
		"migration-mongo:status": "ts-node -r tsconfig-paths/register ./src/infra/database/mongo/migrations/cli.ts migration:status"
	}
}
```

If your CLI file is in another folder, update the script path accordingly.

## Commands

### Run pending migrations

```bash
npm run migration-mongo:run
```

Runs all migrations in ascending version order. Already applied migrations are skipped. When a migration runs successfully, the runner stores `{ version, name, appliedAt }` in the configured changelog collection.

### Check migration status

```bash
npm run migration-mongo:status
```

Prints a table with the migration version, class name, applied status, and applied date.

### Roll back interactively

```bash
npm run migration-mongo:rollback
```

Without parameters, rollback reads the changelog collection, sorts applied migrations by `appliedAt` descending, and lets you choose one from an interactive CLI prompt.

### Roll back by version

```bash
npm run migration-mongo:rollback -- version=0001
```

Runs the selected migration's `down` method and removes it from the changelog collection.

The selected migration version must still exist in the `migrations` array configured in your CLI file.

### Create a migration file

```bash
npm run migration-mongo:create -- AddUserIndex
```

You can also use the named option:

```bash
npm run migration-mongo:create -- --name AddUserIndex
```

The file is created inside `migrationsPath`. After the file is created, import the generated class in your CLI file and add it to the `migrations` array.

## Configuration

| Option | Description |
| --- | --- |
| `uri` | MongoDB connection string. |
| `dbName` | MongoDB database name. |
| `changelogCollection` | Collection used to store applied migrations. |
| `migrations` | Migration instances available to run or roll back. |
| `migrationsPath` | Directory used by `migration:create` to write new migration files. |
| `logLevels` | Nest logger levels passed to `CommandFactory.run`. |

## Recommended Structure

```text
src/
	infra/
		database/
			mongo/
				migrations/
					cli.ts
					0001_create-cats-collection.ts
					0002_add-user-index.ts
```

The structure is only a recommendation. The CLI file can live anywhere as long as your imports, `migrationsPath`, and package scripts point to the correct locations.

## Notes

- Use padded versions such as `0001`, `0002`, and `0010` so string sorting keeps the expected order.
- `migration:create` creates the file but does not automatically update your CLI file.
- Rollback depends on the `down` method. Write it carefully and test it before using it in production.
- In production, run migrations before starting the application or as a separate deployment step.
