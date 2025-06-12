#!/usr/bin/env node

import { InfisicalSDK } from '@infisical/sdk'
import { spawn } from 'node:child_process'
import consola from 'consola'

/**
 * ArgumentParser class for parsing command-line arguments.
 */
class ArgumentParser {
  /**
   * Displays help information about the script usage.
   */
  showHelp() {
    console.log(`
Usage: ./env.mjs [options] [command] [args...]

Options:
  --env=<environment>  Specify the Infisical environment to use (default: dev)
                       Supported values: test, dev, test-playwright, staging or prod.
  --help               Show this help message

Examples:
  ./env.mjs                                 # Display secrets from dev environment
  ./env.mjs --env=prod                      # Display secrets from prod environment
  ./env.mjs --env=staging node server.js    # Run node server.js with staging secrets
  ./env.mjs --env=prod npm start            # Run npm start with prod secrets
`)
    process.exit(0)
  }

  /**
   * Parses command-line arguments to extract configuration values and commands.
   * @returns {Object} An object containing parsed arguments and remaining command.
   */
  parse() {
    const args = [...process.argv.slice(2)]

    const parsedArgs = {
      env: 'dev',
      command: null,
      commandArgs: [],
    }

    // Check for help flag first
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp()
    }

    // Process environment flag
    const envArgIndex = args.findIndex((arg) => arg.startsWith('--env='))

    if (envArgIndex !== -1) {
      const envArg = args[envArgIndex]
      const envValue = envArg.split('=')[1]

      if (envValue) {
        parsedArgs.env = envValue
      }

      args.splice(envArgIndex, 1)
    }

    // Process command and arguments
    if (args.length > 0) {
      parsedArgs.command = args[0]
      parsedArgs.commandArgs = args.slice(1)
    }

    return parsedArgs
  }
}

/**
 * Configuration class for managing environment-specific settings and constants.
 */
class Config {
  /**
   * Creates a new Config instance.
   * @param {Object} args - Parsed command-line arguments.
   */
  constructor(args) {
    this.DEFAULT_INFISICAL_ENV = 'dev'
    this.DEFAULT_INFISICAL_SERVICE_TOKEN =
      'st.8b716665-5949-4c67-af84-da88a4360b35.8848f40d0308da5c52f54dc91a937029.0420989a588d510adcc602ab8b532749'
    this.PROJECT_ID = '3df67a8d-229b-4f34-bd5f-712a60e01d71'
    this.INFISICAL_DOMAIN = 'https://infisical.kibamail.com'

    // Use the environment from command line args first, then from process.env, then the default
    this.INFISICAL_ENV =
      args.env || process.env.INFISICAL_ENV || this.DEFAULT_INFISICAL_ENV

    this.INFISICAL_SERVICE_TOKEN =
      process.env.INFISICAL_SERVICE_TOKEN || this.DEFAULT_INFISICAL_SERVICE_TOKEN

    this.command = args.command
    this.commandArgs = args.commandArgs
  }
}

/**
 * Logger class that provides colorful, structured logging capabilities.
 */
class Logger {
  /**
   * Logs an informational message.
   * @param {string} message - The message to log.
   * @param {Object} [context] - Optional context data to include with the log.
   */
  info(message, context) {
    if (!context) {
      consola.info(message)
      return
    }

    consola.info({ message, additional: JSON.stringify(context) })
  }

  /**
   * Logs a success message.
   * @param {string} message - The message to log.
   * @param {Object} [context] - Optional context data to include with the log.
   */
  success(message, context) {
    if (!context) {
      consola.success(message)
      return
    }

    consola.success({ message, additional: JSON.stringify(context) })
  }

  /**
   * Logs a warning message.
   * @param {string} message - The message to log.
   * @param {Object} [context] - Optional context data to include with the log.
   */
  warn(message, context) {
    if (!context) {
      consola.warn(message)
      return
    }

    consola.warn({ message, additional: JSON.stringify(context) })
  }

  /**
   * Logs an error message.
   * @param {string} message - The message to log.
   * @param {Error|Object} [error] - The error object or context to include.
   */
  error(message, error) {
    if (!error) {
      consola.error(message)
      return
    }

    if (error instanceof Error) {
      consola.error({ message, stack: error.stack })
      return
    }

    consola.error({ message, additional: JSON.stringify(error) })
  }

  /**
   * Logs a debug message (only in development environments).
   * @param {string} message - The message to log.
   * @param {Object} [context] - Optional context data to include with the log.
   */
  debug(message, context) {
    if (!context) {
      consola.debug(message)
      return
    }

    consola.debug({ message, additional: JSON.stringify(context) })
  }
}

/**
 * InfisicalClient class responsible for interacting with the Infisical API.
 */
class InfisicalClient {
  /**
   * Creates a new InfisicalClient instance.
   * @param {Config} config - Configuration object containing Infisical settings.
   * @param {Logger} logger - Logger instance for logging operations.
   */
  constructor(config, logger) {
    this.config = config
    this.logger = logger
  }

  /**
   * Fetches secrets from the Infisical service.
   * Initializes an authenticated client and retrieves secrets for the configured project and environment.
   * @returns {Promise<Array>} A promise that resolves to an array of secret objects.
   */
  async fetchSecrets() {
    this.logger.info(
      `Initializing Infisical client for environment: ${this.config.INFISICAL_ENV}`,
    )

    let client = new InfisicalSDK({
      siteUrl: this.config.INFISICAL_DOMAIN,
    })

    client = client.auth().accessToken(this.config.INFISICAL_SERVICE_TOKEN)

    this.logger.info(
      `Fetching secrets from Infisical for project: ${this.config.PROJECT_ID}`,
    )

    const { secrets } = await client
      .secrets()
      .listSecrets({
        projectId: this.config.PROJECT_ID,
        environment: this.config.INFISICAL_ENV,
      })
      .catch((error) => {
        this.logger.error('Failed to fetch secrets from Infisical', error)
        throw new Error('Failed to fetch secrets from Infisical')
      })

    this.logger.success(`Successfully fetched ${secrets.length} secrets from Infisical`)
    return secrets
  }
}

/**
 * SecretManager class responsible for retrieving secrets from Infisical.
 */
class SecretManager {
  /**
   * Creates a new SecretManager instance.
   * @param {Config} config - Configuration object.
   * @param {InfisicalClient} infisicalClient - Client for fetching secrets from Infisical.
   * @param {Logger} logger - Logger instance for logging operations.
   */
  constructor(config, infisicalClient, logger) {
    this.config = config
    this.infisicalClient = infisicalClient
    this.logger = logger
  }

  /**
   * Retrieves secrets directly from Infisical.
   * @returns {Promise<Array>} A promise that resolves to an array of secret objects.
   */
  async getSecrets() {
    this.logger.info('Fetching secrets from Infisical')
    const secrets = await this.infisicalClient.fetchSecrets()
    return secrets
  }
}

/**
 * EnvironmentManager class responsible for converting secrets to environment variables.
 */
class EnvironmentManager {
  /**
   * Creates a new EnvironmentManager instance.
   * @param {Logger} logger - Logger instance for logging operations.
   */
  constructor(logger) {
    this.logger = logger
  }

  /**
   * Converts an array of secret objects to environment variables.
   * @param {Array} secrets - Array of secret objects from Infisical.
   * @returns {Object} An environment object with secrets merged with process.env.
   */
  secretsToEnv(secrets) {
    const env = { ...process.env }

    this.logger.info(`Converting ${secrets.length} secrets to environment variables`)

    for (const secret of secrets) {
      env[secret.secretKey] = secret.secretValue
    }

    return env
  }

  /**
   * Executes a command with environment variables enhanced with secrets.
   * @param {string} command - The command to execute.
   * @param {Array} args - Arguments to pass to the command.
   * @param {Object} env - Environment variables including secrets.
   * @returns {Promise<number>} A promise that resolves to the exit code.
   */
  executeCommand(command, args, env) {
    this.logger.info(`Executing command: ${command} ${args.join(' ')}`)

    return new Promise((resolve) => {
      const childProcess = spawn(command, args, {
        env,
        stdio: 'inherit',
        shell: true,
      })

      childProcess.on('error', (error) => {
        this.logger.error(`Command execution error: ${error.message}`, error)
        resolve(1)
      })

      childProcess.on('exit', (code) => {
        const exitCode = code || 0
        this.logger.info(`Command exited with code: ${exitCode}`)
        resolve(exitCode)
      })
    })
  }
}

/**
 * Application class that orchestrates the entire process.
 */
class Application {
  /**
   * Creates a new Application instance.
   */
  constructor() {
    const argParser = new ArgumentParser()
    const args = argParser.parse()

    this.logger = new Logger()
    this.config = new Config(args)
    this.infisicalClient = new InfisicalClient(this.config, this.logger)
    this.secretManager = new SecretManager(this.config, this.infisicalClient, this.logger)
    this.environmentManager = new EnvironmentManager(this.logger)
  }

  /**
   * Runs the application, fetching secrets and executing commands if provided.
   * @returns {Promise<void>} A promise that resolves when the application completes.
   */
  async run() {
    this.logger.info('Starting environment variable injection process', {
      environment: this.config.INFISICAL_ENV,
      projectId: this.config.PROJECT_ID,
    })

    let exitCode = 0

    try {
      // Get secrets directly from Infisical
      const secrets = await this.secretManager.getSecrets()

      // Handle command execution or display secrets
      if (!this.config.command) {
        this.logger.info('No command provided, displaying secrets')
        return
      }

      // Execute the command with environment variables
      this.logger.info(`Preparing to execute command: ${this.config.command}`, {
        args: this.config.commandArgs.join(' '),
        secretCount: secrets.length,
      })

      const env = this.environmentManager.secretsToEnv(secrets)

      exitCode = await this.environmentManager.executeCommand(
        this.config.command,
        this.config.commandArgs,
        env,
      )
    } catch (error) {
      this.logger.error('Application error', error)
      exitCode = 1
    } finally {
      this.logger.info(`Application exiting with code: ${exitCode}`)
      process.exit(exitCode)
    }
  }
}

const app = new Application()
app.run()
