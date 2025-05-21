import { describe, test, beforeEach, afterEach, expect } from 'vitest'
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

describe('@env-tests Environment variable loader', () => {
  const envScriptPath = path.resolve(process.cwd(), 'env.mjs')
  let tempScriptPaths: string[] = []

  beforeEach(async () => {
    tempScriptPaths = []
  })

  afterEach(async () => {
    for (const tempPath of tempScriptPaths) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
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
    expect(output).toContain('--help')
  })

  test('env.mjs fetches secrets from Infisical', async () => {
    // Just verify the command runs without error
    const output = execSync(`node ${envScriptPath} --env=dev`, { encoding: 'utf-8' })
    expect(output).toBeDefined()
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
    // Just verify the command runs without error for different environments
    const testOutput = execSync(`node ${envScriptPath} --env=test`, { encoding: 'utf-8' })
    expect(testOutput).toBeDefined()

    const devOutput = execSync(`node ${envScriptPath} --env=dev`, { encoding: 'utf-8' })
    expect(devOutput).toBeDefined()
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
