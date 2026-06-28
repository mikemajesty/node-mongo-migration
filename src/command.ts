import { bold, green, red } from 'colorette'
import inquirer from 'inquirer'
import { Command, CommandRunner } from 'nest-commander'
import { MongoMigrationRunner } from './runner'

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
