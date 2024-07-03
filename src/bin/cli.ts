#!/usr/bin/env node

import { program } from "commander"
import * as fs from "fs/promises"
import * as path from "path"
import * as ejs from "ejs"
import * as changeCase from "change-case"

const projectRoot = process.cwd()

program
  .command("make:endpoint")
  .description("Generate files for a new endpoint")
  .option("--domain <domain>", "Domain for the endpoint")
  .option("--name <name>", "Name of the endpoint")
  .action(async (options) => {
    const { domain, name } = options

    if (!domain || !name) {
      console.error("Please provide both --domain and --name options")
      return
    }

    const domainPath = path.join(projectRoot, "src", "domains", domain)
    const httpPath = path.join(projectRoot, "src", "http")

    const pascalCaseName = changeCase.pascalCase(name)
    const snakeCaseName = changeCase.snakeCase(name)
    const camelCaseName = changeCase.camelCase(name)

    // Generate controller
    const controllerPath = path.join(httpPath, "api", "controllers", domain)
    const controllerExists = await checkFileExists(
      path.join(controllerPath, `${snakeCaseName}_controller.ts`),
    )
    if (!controllerExists) {
      const controllerFile = path.join(
        controllerPath,
        `${snakeCaseName}_controller.ts`,
      )
      await generateFile(controllerFile, "controller.ejs", {
        name: pascalCaseName,
        domain,
        camelCaseName,
        repositoryExists: false,
        actionExists: true,
      })
      console.log(`✨ Generated controller: ${controllerFile}`)
    } else {
      console.log(
        `⚠️ Controller already exists: ${path.join(controllerPath, `${snakeCaseName}_controller.ts`)}`,
      )
    }

    // Generate repository
    const repositoryPath = path.join(domainPath, "repositories")
    const repositoryExists = await checkFileExists(
      path.join(repositoryPath, `${snakeCaseName}_repository.ts`),
    )
    if (!repositoryExists) {
      const repositoryFile = path.join(
        repositoryPath,
        `${snakeCaseName}_repository.ts`,
      )
      await generateFile(repositoryFile, "repository.ejs", {
        name: pascalCaseName,
        domain,
        camelCaseName,
      })
      console.log(`✨ Generated repository: ${repositoryFile}`)
    } else {
      console.log(
        `⚠️ Repository already exists: ${path.join(repositoryPath, `${snakeCaseName}_repository.ts`)}`,
      )
    }

    // Generate action
    const actionPath = path.join(domainPath, "actions")
    const actionFile = path.join(actionPath, `${snakeCaseName}_action.ts`)
    const dtoExists = await checkFileExists(
      path.join(domainPath, "dto", `${snakeCaseName}_dto.ts`),
    )
    await generateFile(actionFile, "action.ejs", {
      name: pascalCaseName,
      domain,
      camelCaseName,
      repositoryExists,
      dtoExists,
    })
    console.log(`✨ Generated action: ${actionFile}`)

    // Generate DTO
    const dtoPath = path.join(domainPath, "dto")
    const dtoFile = path.join(dtoPath, `${snakeCaseName}_dto.ts`)
    await generateFile(dtoFile, "dto.ejs", {
      name: pascalCaseName,
      domain,
      camelCaseName,
    })
    console.log(`✨ Generated DTO: ${dtoFile}`)

    // Generate test file
    const testPath = path.join(
      projectRoot,
      "src",
      "tests",
      "integration",
      domain,
    )
    const testExists = await checkFileExists(
      path.join(testPath, `${snakeCaseName}.spec.ts`),
    )
    if (!testExists) {
      const testFile = path.join(testPath, `${snakeCaseName}.spec.ts`)
      await generateFile(testFile, "test.ejs", {
        name: pascalCaseName,
        domain,
        camelCaseName,
        repositoryExists,
        actionExists: true,
      })
      console.log(`✨ Generated test: ${testFile}`)
    } else {
      console.log(
        `⚠️ Test file already exists: ${path.join(testPath, `${snakeCaseName}.spec.ts`)}`,
      )
    }
  })

async function generateFile(filePath: string, templateName: string, data: any) {
  const templatePath = path.join(__dirname, "templates", `${templateName}`)
  const template = await fs.readFile(templatePath, "utf-8")
  const renderedContent = ejs.render(template, data)

  const dirPath = path.dirname(filePath)
  await fs.mkdir(dirPath, { recursive: true })
  await fs.writeFile(filePath, renderedContent)
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch (err) {
    return false
  }
}

program.parse(process.argv)
