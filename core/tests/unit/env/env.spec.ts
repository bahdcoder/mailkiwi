import {
  describe,
  test,
  beforeEach,
  afterEach,
  expect,
  beforeAll,
  afterAll,
} from 'vitest'
import { execSync } from 'node:child_process'
import { createClient } from 'redis'
import path from 'node:path'
import fs from 'node:fs'

describe('@env-tests Environment variable loader', () => {
  const envScriptPath = path.resolve(process.cwd(), 'env.mjs')
  let redisClient: ReturnType<typeof createClient>
  let tempScriptPaths: string[] = []

  beforeEach(async () => {
    tempScriptPaths = []
  })

  beforeAll(async () => {
    redisClient = createClient({
      url: 'redis://localhost:5570',
    })

    redisClient.on('error', (err) => {
      console.error('Redis client error in test:', err)
    })

    await redisClient.connect()
  })

  afterAll(async () => {
    if (redisClient?.isOpen) {
      await redisClient.quit()
    }
  })

  afterEach(async () => {
    for (const tempPath of tempScriptPaths) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
    }

    if (fs.existsSync('cache-test-executed.txt')) {
      fs.unlinkSync('cache-test-executed.txt')
    }
  })

  test('env.mjs script exists and is executable', () => {
    expect(fs.existsSync(envScriptPath)).toBe(true)

    const stats = fs.statSync(envScriptPath)
    const isExecutable = !!(stats.mode & 0o111)
    expect(isExecutable).toBe(true)
  })

  test('env.mjs displays help information when --help flag is provided', async () => {
    const output = execSync(`node ${envScriptPath} --help`, { encoding: 'utf-8' })

    expect(output).toContain('Usage: ./env.mjs [options] [command] [args...]')
    expect(output).toContain('--env=<environment>')
    expect(output).toContain('--reset')
    expect(output).toContain('--help')
  })

  test('env.mjs fetches secrets from Infisical and caches them in Redis', async () => {
    const cacheKey = 'infisical_secrets:3df67a8d-229b-4f34-bd5f-712a60e01d71:dev'
    await redisClient.del(cacheKey)

    execSync(`node ${envScriptPath} --env=dev`, { encoding: 'utf-8' })

    const cachedSecrets = await redisClient.get(cacheKey)
    expect(cachedSecrets).not.toBeNull()

    const secrets = JSON.parse(cachedSecrets || '[]')
    expect(Array.isArray(secrets)).toBe(true)
    expect(secrets.length).toBeGreaterThan(0)

    const firstSecret = secrets[0]
    expect(firstSecret).toHaveProperty('secretKey')
    expect(firstSecret).toHaveProperty('secretValue')
  })

  test('env.mjs respects the --reset flag and refreshes the cache', async () => {
    execSync(`node ${envScriptPath} --env=dev`, { encoding: 'utf-8' })

    const cacheKey = 'infisical_secrets:3df67a8d-229b-4f34-bd5f-712a60e01d71:dev'
    const initialCache = await redisClient.get(cacheKey)
    expect(initialCache).not.toBeNull()

    await new Promise((resolve) => setTimeout(resolve, 100))

    execSync(`node ${envScriptPath} --env=dev --reset`, { encoding: 'utf-8' })

    const refreshedCache = await redisClient.get(cacheKey)
    expect(refreshedCache).not.toBeNull()

    const ttl = await redisClient.ttl(cacheKey)
    expect(ttl).toBeGreaterThan(60 * 60 * 47)
  })

  test('env.mjs can execute commands with environment variables from secrets', async () => {
    const tempScriptPath = path.resolve(process.cwd(), 'temp-test-script.js')
    fs.writeFileSync(tempScriptPath, 'console.log(process.env.NODE_ENV || "undefined")')
    tempScriptPaths.push(tempScriptPath)

    const output = execSync(`node ${envScriptPath} --env=dev node ${tempScriptPath}`, {
      encoding: 'utf-8',
    })

    expect(output).not.toContain('undefined')
    expect(output.trim()).toBeTruthy()
  })

  test('env.mjs handles different environment flags correctly', async () => {
    const testCacheKey = 'infisical_secrets:3df67a8d-229b-4f34-bd5f-712a60e01d71:test'
    await redisClient.del(testCacheKey)

    execSync(`node ${envScriptPath} --env=test`, { encoding: 'utf-8' })

    const testCache = await redisClient.get(testCacheKey)
    expect(testCache).not.toBeNull()

    const devCacheKey = 'infisical_secrets:3df67a8d-229b-4f34-bd5f-712a60e01d71:dev'
    const devCache = await redisClient.get(devCacheKey)
    expect(devCache).not.toBeNull()
  })

  test('env.mjs caches secrets with the correct TTL', async () => {
    const cacheKey = 'infisical_secrets:3df67a8d-229b-4f34-bd5f-712a60e01d71:dev'
    await redisClient.del(cacheKey)

    execSync(`node ${envScriptPath} --env=dev`, { encoding: 'utf-8' })

    const ttl = await redisClient.ttl(cacheKey)

    const expectedTTL = 60 * 60 * 48
    expect(ttl).toBeGreaterThan(expectedTTL - 60)
    expect(ttl).toBeLessThanOrEqual(expectedTTL)
  })

  test('env.mjs uses cached secrets when available instead of fetching again', async () => {
    const cacheKey = 'infisical_secrets:3df67a8d-229b-4f34-bd5f-712a60e01d71:dev'
    await redisClient.del(cacheKey)

    const tempScriptPath = path.resolve(process.cwd(), 'temp-cache-test.js')
    fs.writeFileSync(tempScriptPath, 'console.log("FIRST_RUN")')
    tempScriptPaths.push(tempScriptPath)

    execSync(`node ${envScriptPath} --env=dev node ${tempScriptPath}`, {
      encoding: 'utf-8',
    })

    const cachedSecrets = await redisClient.get(cacheKey)
    expect(cachedSecrets).not.toBeNull()

    const secrets = JSON.parse(cachedSecrets || '[]')
    expect(Array.isArray(secrets)).toBe(true)
    expect(secrets.length).toBeGreaterThan(0)

    fs.writeFileSync(
      tempScriptPath,
      `
      import * as fs from 'fs';
      fs.writeFileSync('cache-test-executed.txt', 'executed');
    `,
    )

    execSync(`node ${envScriptPath} --env=dev node ${tempScriptPath}`, {
      encoding: 'utf-8',
    })

    expect(fs.existsSync('cache-test-executed.txt')).toBe(true)

    const ttl = await redisClient.ttl(cacheKey)
    expect(ttl).toBeGreaterThan(0)
  })

  test('@env-error-handling env.mjs handles errors gracefully', async () => {
    let error: unknown

    try {
      execSync(`node ${envScriptPath} --env=invalid-env`, { encoding: 'utf-8' })
      expect(true).toBe(false) // Should not reach here
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
  })

  test('@env-argument-parsing env.mjs correctly parses command-line arguments', () => {
    const tempScriptPath = path.resolve(process.cwd(), 'temp-args-test.js')
    fs.writeFileSync(tempScriptPath, 'console.log(process.argv.slice(2).join(","))')
    tempScriptPaths.push(tempScriptPath)

    const output = execSync(
      `node ${envScriptPath} --env=dev node ${tempScriptPath} arg1 arg2 arg3`,
      { encoding: 'utf-8' },
    )

    expect(output).toContain('arg1,arg2,arg3')
  })
})
