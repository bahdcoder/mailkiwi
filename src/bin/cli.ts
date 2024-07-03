#!/usr/bin/env node

import { program } from "commander"
import * as fs from "fs/promises"
import * as path from "path"
import * as ejs from "ejs"
import * as changeCase from "change-case"
import inquirer from "inquirer"
import * as prettier from "prettier"

const projectRoot = process.cwd()

program
  .command("make:endpoint")
  .description("Generate files for a new endpoint")
  .action(async () => {
    const { name } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter the name of the endpoint (e.g., reset_password):",
      },
    ])

    const domainPath = path.join(projectRoot, "src", "domains")
    const domains = await fs.readdir(domainPath)

    const { domain } = await inquirer.prompt([
      {
        type: "list",
        name: "domain",
        message: "Select the domain:",
        choices: domains,
      },
    ])

    const repositories = await scanRepositories(path.join(domainPath, domain))

    const { repository } = await inquirer.prompt([
      {
        type: "list",
        name: "repository",
        message: "Select the repository (or skip to generate a new one):",
        choices: [...repositories, "Skip"],
      },
    ])

    const { generateDto } = await inquirer.prompt([
      {
        type: "confirm",
        name: "generateDto",
        message: "Do you want to generate a DTO schema?",
        default: true,
      },
    ])

    const pascalCaseName = changeCase.pascalCase(name)
    const snakeCaseName = changeCase.snakeCase(name)
    const camelCaseName = changeCase.camelCase(name)

    const httpPath = path.join(projectRoot, "src", "http")

    let repositoryFile = ""
    let repositoryExists = false
    let repositoryName = ""

    if (repository !== "Skip") {
      repositoryName = repository
      repositoryFile = path.join(
        domainPath,
        domain,
        "repositories",
        `${repository}_repository.ts`,
      )
      repositoryExists = true
    } else {
      repositoryFile = path.join(
        domainPath,
        domain,
        "repositories",
        `${snakeCaseName}_repository.ts`,
      )
      repositoryExists = await checkFileExists(repositoryFile)
      if (!repositoryExists) {
        await generateFile(repositoryFile, "repository.ejs", {
          name: pascalCaseName,
          domain,
          camelCaseName,
          pascalCaseName,
          snakeCaseName,
        })
        console.log(`✨ Generated repository: ${repositoryFile}`)
      }
      repositoryName = snakeCaseName
    }

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
      const controllerContent = await generateFile(
        controllerFile,
        "controller.ejs",
        {
          name: pascalCaseName,
          domain,
          camelCaseName,
          repositoryExists: true,
          actionExists: true,
          pascalCaseName,
          snakeCaseName,
          repositoryFile,
          repositoryName,
          generateDto,
        },
      )
      const formattedControllerContent = await prettier.format(
        controllerContent,
        {
          parser: "typescript",
        },
      )
      await fs.writeFile(controllerFile, formattedControllerContent)
      console.log(`✨ Generated controller: ${controllerFile}`)
    } else {
      console.log(
        `⚠️ Controller already exists: ${path.join(controllerPath, `${snakeCaseName}_controller.ts`)}`,
      )
    }

    // Generate action
    const actionPath = path.join(domainPath, domain, "actions")
    const actionFile = path.join(actionPath, `${snakeCaseName}_action.ts`)
    const actionContent = await generateFile(actionFile, "action.ejs", {
      name: pascalCaseName,
      domain,
      camelCaseName,
      repositoryExists,
      generateDto,
      pascalCaseName,
      snakeCaseName,
      repositoryFile,
      repositoryName,
    })
    const formattedActionContent = await prettier.format(actionContent, {
      parser: "typescript",
    })
    await fs.writeFile(actionFile, formattedActionContent)
    console.log(`✨ Generated action: ${actionFile}`)

    // Generate DTO
    if (generateDto) {
      const dtoPath = path.join(domainPath, domain, "dto")
      const dtoFile = path.join(dtoPath, `${snakeCaseName}_dto.ts`)
      const dtoContent = await generateFile(dtoFile, "dto.ejs", {
        name: pascalCaseName,
        domain,
        camelCaseName,
        pascalCaseName,
        snakeCaseName,
      })
      const formattedDtoContent = await prettier.format(dtoContent, {
        parser: "typescript",
      })
      await fs.writeFile(dtoFile, formattedDtoContent)
      console.log(`✨ Generated DTO: ${dtoFile}`)
    } else {
      console.log("Skipped generating DTO")
    }

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
      const testContent = await generateFile(testFile, "test.ejs", {
        name: pascalCaseName,
        domain,
        camelCaseName,
        repositoryExists: true,
        actionExists: true,
        pascalCaseName,
        snakeCaseName,
        repositoryFile,
        repositoryName,
        generateDto,
      })
      const formattedTestContent = await prettier.format(testContent, {
        parser: "typescript",
      })
      await fs.writeFile(testFile, formattedTestContent)
      console.log(`✨ Generated test: ${testFile}`)
    } else {
      console.log(
        `⚠️ Test file already exists: ${path.join(testPath, `${snakeCaseName}.spec.ts`)}`,
      )
    }
  })

async function scanRepositories(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const repositories: string[] = []

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      const nestedRepositories = await scanRepositories(entryPath)
      repositories.push(...nestedRepositories)
    } else if (entry.name.endsWith("_repository.ts")) {
      const repositoryName = entry.name.replace("_repository.ts", "")
      repositories.push(repositoryName)
    }
  }

  return repositories
}

async function generateFile(
  filePath: string,
  templateName: string,
  data: any,
): Promise<string> {
  const templatePath = path.join(__dirname, "templates", `${templateName}`)
  const template = await fs.readFile(templatePath, "utf-8")
  const renderedContent = ejs.render(template, data)
  return renderedContent
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
