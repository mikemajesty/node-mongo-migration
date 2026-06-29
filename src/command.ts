import { bold, green, red } from 'colorette'
import inquirer from 'inquirer'
import { Command, CommandRunner, Option } from 'nest-commander'
import { MongoMigrationRunner } from './runner'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

@Command({ name: 'migration:run', options: { isDefault: true } })
export class MigrationRunCommand extends CommandRunner {
  constructor(private runner: MongoMigrationRunner) {
    super()
  }

  async run() {
    await this.runner.runMigrations(this.runner.config.migrations, 'up')
  }
}

@Command({ name: 'migration:rollback' })
export class MigrationRollbackCommand extends CommandRunner {
  private context = bold(green(MigrationRollbackCommand.name))
  constructor(private runner: MongoMigrationRunner) {
    super()
  }

  async run(passedParams: string[]) {
    const { version } = await this.parseParams(passedParams)
    if (version) {
      const migration = this.runner.config.migrations.find((m) => m.version === version)
      if (!migration) {
        console.error(`${this.context} - Migration with version ${bold(version)} ${red(' not found.')}\n`)
        process.exit(0)
      }
      await this.runner.runMigrations([migration], 'down')
      process.exit(0)
    }
    throw new Error(`Version parameter is required for rollback. Use --version=VERSION`)
  }

  private async askVersion(): Promise<string> {
    const changelog = await this.runner.getChangeLog()
    const appliedVersions = (await changelog.toArray()).map((m) => m.version.concat(` - `).concat(m.name))

    if (appliedVersions.length === 0) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'version',
          message: 'Migration version:',
          validate: (input) => (input.trim() ? true : 'Version is required')
        }
      ])
      return answer.version
    }

    const answer = await inquirer.prompt([
      {
        type: 'select',
        name: 'version',
        message: 'Migration version:',
        choices: appliedVersions
      }
    ])
    return answer.version.split(` - `)[0]
  }

  private async parseParams(params: string[]): Promise<{ version?: string }> {
    const versionParam = params.find((p) => p.startsWith('version='))
    if (versionParam) {
      const version = versionParam.split('=')[1]
      return { version }
    }

    const versionInput = await this.askVersion()
    return { version: versionInput }
  }
}

@Command({ name: 'migration:status', options: { isDefault: true } })
export class MigrationStatusCommand extends CommandRunner {
  constructor(private runner: MongoMigrationRunner) {
    super()
  }

  async run() {
    const status = await this.runner.getStatus()
    console.table(status, ['version', 'name', 'applied'])
  }
}

@Command({ name: 'migration:create' })
export class MigrationCreateCommand extends CommandRunner {
  constructor(private runner: MongoMigrationRunner) {
    super();
  }

  async run(passedParams: string[], options?: MigrationCreateOptions): Promise<void> {
    const migrationsDir = this.runner.config.migrationsPath;

    const name = await this.getName(options, passedParams);
    this.validateName(name);

    if (!existsSync(migrationsDir)) {
      throw new Error(
        `${MigrationCreateCommand.name}: ${red(`Migrations directory does not exist: ${migrationsDir}`)}`
      );
    }

    const version = this.getNextVersion();
    const versionPadded = this.padNumber(version);
    const className = this.toPascalCase(name) + versionPadded;
    const fileName = `${versionPadded}_${this.toSnakeCase(name)}.ts`;
    const filePath = join(migrationsDir, fileName);

    if (existsSync(filePath)) {
      console.error(red(`❌ Migration ${fileName} already exists`));
      process.exit(1);
    }

    const content = this.generateTemplate(className, versionPadded);
    writeFileSync(filePath, content);

    console.log(green(`✅ Migration created: ${bold(fileName)}`));
    console.log(`📁 Path: ${filePath}`);
    console.log(`📊 Next available number: ${this.padNumber(version + 1)}`);
  }


  private async getName(options: MigrationCreateOptions | undefined, passedParams: string[]): Promise<string> {
    const name = options?.name || passedParams[0];
    return name || (await this.askMigrationName());
  }

  private validateName(name: string): void {
    if (!name || name.trim() === '') {
      console.error(red('❌ Migration name is required'));
      process.exit(1);
    }

    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
      console.error(red('❌ Name must start with a letter and contain only letters and numbers'));
      process.exit(1);
    }
  }

  private async askMigrationName(): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Migration name:',
        validate: (input) => {
          if (!input || input.trim() === '') return 'Name is required';
          if (!/^[A-Za-z][A-Za-z0-9]*$/.test(input)) {
            return 'Name must start with a letter and contain only letters and numbers';
          }
          return true;
        }
      }
    ]);
    return answer.name;
  }

  private getNextVersion(): number {
    const numbers = this.runner.config.migrations.map((m) => {
      const num = parseInt(m.version.replace(/\D/g, ''), 10);
      return isNaN(num) ? 0 : num;
    });

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return maxNumber + 1;
  }

  private padNumber(num: number): string {
    return String(num).padStart(4, '0');
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .toLowerCase();
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }


  private generateTemplate(className: string, version: string): string {
    return `import { IMongoMigration } from './interface';
import { Db } from 'mongodb';

export class ${className} implements IMongoMigration {
  get version(): string {
    return '${version}';
  }

  async up(db: Db): Promise<void> {
    // TODO: Implement up migration
  }

  async down(db: Db): Promise<void> {
    // TODO: Implement down migration
  }
}`;
  }

  // ─── Opções CLI ─────────────────────────────────────────

  @Option({
    flags: '-n, --name <name>',
    description: 'Migration name (e.g., AddUserIndex)',
  })
  parseName(val: string): string {
    return val;
  }
}

export type MigrationCreateOptions = {
  name?: string;
}