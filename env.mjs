#!/usr/bin/env node

import { InfisicalSDK } from '@infisical/sdk'
import { createClient } from 'redis'
import { spawn } from 'child_process'
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
  --reset              Force refresh of cached secrets, ignoring TTL
  --help               Show this help message

Examples:
  ./env.mjs                                 # Display secrets from dev environment
  ./env.mjs --env=prod                      # Display secrets from prod environment
  ./env.mjs --reset                         # Force refresh of dev secrets
  ./env.mjs --env=staging --reset           # Force refresh of staging secrets
  ./env.mjs --env=staging node server.js    # Run node server.js with staging secrets
  ./env.mjs --reset --env=prod npm start    # Run npm start with fresh prod secrets
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
      resetCache: false,
      command: null,
      commandArgs: [],
    }

    // Check for help flag first
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp()
    }

    // Process reset flag
    const resetIndex = args.findIndex((arg) => arg === '--reset')

    if (resetIndex !== -1) {
      parsedArgs.resetCache = true
      args.splice(resetIndex, 1)
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
      'st.26503e52-caf1-40e7-b981-88077f01fda8.615a966e735e6aedd57a84e74ca2e8a4.30842122aba5c42b1b1980e71548334f'
    this.PROJECT_ID = '3df67a8d-229b-4f34-bd5f-712a60e01d71'
    this.INFISICAL_DOMAIN = 'https://infisical.kibamail.com'
    this.REDIS_URL = 'redis://localhost:5570'
    this.CACHE_TTL = 60 * 60 * 48

    this.INFISICAL_ENV =
      args.env || process.env.INFISICAL_ENV || this.DEFAULT_INFISICAL_ENV
    this.INFISICAL_SERVICE_TOKEN =
      process.env.INFISICAL_SERVICE_TOKEN || this.DEFAULT_INFISICAL_SERVICE_TOKEN
    this.CACHE_KEY = `infisical_secrets:${this.PROJECT_ID}:${this.INFISICAL_ENV}`

    this.command = args.command
    this.commandArgs = args.commandArgs

    this.resetCache = args.resetCache || false
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
 * RedisClient class that provides a robust interface for Redis operations.
 */
class RedisClient {
  /**
   * Creates a new RedisClient instance.
   * @param {Config} config - Configuration object containing Redis settings.
   * @param {Logger} logger - Logger instance for logging operations.
   */
  constructor(config, logger) {
    this.config = config
    this.logger = logger
    this.client = null
  }

  /**
   * Connects to Redis if not already connected.
   * @returns {Promise<void>} A promise that resolves when connected.
   */
  async connect() {
    if (this.client && this.client.isOpen) {
      return
    }

    this.logger.info(`Connecting to Redis at ${this.config.REDIS_URL}`)

    this.client = createClient({
      url: this.config.REDIS_URL,
    })

    this.client.on('error', (err) => {
      this.logger.error('Redis client error', err)
    })

    await this.client.connect().catch((error) => {
      this.logger.error('Failed to connect to Redis', error)
      throw new Error('Failed to connect to Redis')
    })

    this.logger.success('Successfully connected to Redis')
  }

  /**
   * Disconnects from Redis if connected.
   * @returns {Promise<void>} A promise that resolves when disconnected.
   */
  async disconnect() {
    if (!this.client || !this.client.isOpen) {
      return Promise.resolve()
    }

    this.logger.info('Disconnecting from Redis')

    await this.client.quit().catch((error) => {
      this.logger.error('Error disconnecting from Redis', error)
    })

    this.client = null
    return Promise.resolve()
  }

  /**
   * Gets a value from Redis.
   * @param {string} key - The key to retrieve.
   * @returns {Promise<string|null>} A promise that resolves to the value or null if not found.
   */
  async get(key) {
    await this.connect()

    this.logger.debug(`Getting value for key: ${key}`)
    return this.client.get(key).catch((error) => {
      this.logger.error(`Failed to get value for key: ${key}`, error)
      throw new Error(`Failed to get value for key: ${key}`)
    })
  }

  /**
   * Sets a value in Redis with optional expiration.
   * @param {string} key - The key to set.
   * @param {string} value - The value to set.
   * @param {Object} [options] - Options for the set operation.
   * @returns {Promise<string>} A promise that resolves to "OK" if successful.
   */
  async set(key, value, options) {
    await this.connect()

    this.logger.debug(`Setting value for key: ${key}`)
    return this.client.set(key, value, options).catch((error) => {
      this.logger.error(`Failed to set value for key: ${key}`, error)
      throw new Error(`Failed to set value for key: ${key}`)
    })
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key - The key to delete.
   * @returns {Promise<number>} A promise that resolves to the number of keys deleted.
   */
  async del(key) {
    await this.connect()

    this.logger.debug(`Deleting key: ${key}`)
    return this.client.del(key).catch((error) => {
      this.logger.error(`Failed to delete key: ${key}`, error)
      throw new Error(`Failed to delete key: ${key}`)
    })
  }
}

/**
 * CacheManager class responsible for caching and retrieving secrets using Redis.
 */
class CacheManager {
  /**
   * Creates a new CacheManager instance.
   * @param {Config} config - Configuration object containing Redis settings.
   * @param {InfisicalClient} infisicalClient - Client for fetching secrets from Infisical.
   * @param {RedisClient} redisClient - Client for Redis operations.
   * @param {Logger} logger - Logger instance for logging operations.
   */
  constructor(config, infisicalClient, redisClient, logger) {
    this.config = config
    this.infisicalClient = infisicalClient
    this.redisClient = redisClient
    this.logger = logger
  }

  /**
   * Deletes the cached secrets for the current environment.
   * @returns {Promise<void>} A promise that resolves when the cache is cleared.
   */
  async clearCache() {
    this.logger.info(`Clearing cache for environment: ${this.config.INFISICAL_ENV}`)
    await this.redisClient.del(this.config.CACHE_KEY).catch((error) => {
      this.logger.error(`Failed to clear cache for key: ${this.config.CACHE_KEY}`, error)
    })
    this.logger.success('Cache cleared successfully')
  }

  /**
   * Retrieves secrets, preferring cached values when available.
   * If cache is empty or expired, fetches fresh secrets from Infisical and updates the cache.
   * @returns {Promise<Array>} A promise that resolves to an array of secret objects.
   */
  async getSecrets() {
    // Handle cache reset if requested
    if (this.config.resetCache) {
      this.logger.info('Reset flag detected, clearing cache')
      await this.clearCache()
    }

    // Try to get from cache if not resetting
    if (!this.config.resetCache) {
      const cachedSecrets = await this.redisClient.get(this.config.CACHE_KEY)

      if (cachedSecrets) {
        this.logger.info('Using cached secrets from Redis')
        return JSON.parse(cachedSecrets)
      }
    }

    // Cache miss or reset, fetch from Infisical
    const logMessage = this.config.resetCache
      ? 'Fetching fresh secrets from Infisical (cache reset)'
      : 'No cached secrets found, fetching from Infisical'

    this.logger.info(logMessage)

    const secrets = await this.infisicalClient.fetchSecrets()

    // Cache the fresh secrets
    this.logger.info(
      `Caching ${secrets.length} secrets in Redis with TTL: ${this.config.CACHE_TTL}s`,
    )

    await this.redisClient.set(this.config.CACHE_KEY, JSON.stringify(secrets), {
      EX: this.config.CACHE_TTL,
    })

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
    this.redisClient = new RedisClient(this.config, this.logger)
    this.infisicalClient = new InfisicalClient(this.config, this.logger)
    this.cacheManager = new CacheManager(
      this.config,
      this.infisicalClient,
      this.redisClient,
      this.logger,
    )
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
      // Get secrets from cache or Infisical
      const secrets = await this.cacheManager.getSecrets()

      // Handle command execution or display secrets
      if (!this.config.command) {
        this.logger.info('No command provided, displaying secrets')
        console.log(JSON.stringify(secrets, null, 2))
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
      // Clean up and exit
      await this.redisClient.disconnect()
      this.logger.info(`Application exiting with code: ${exitCode}`)
      process.exit(exitCode)
    }
  }
}

const app = new Application()
app.run()
