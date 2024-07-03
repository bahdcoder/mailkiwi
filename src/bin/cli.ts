#!/usr/bin/env node

import { program } from "commander"
import * as fs from "fs"
import * as path from "path"
import * as ejs from "ejs"

program
  .command("make:endpoint")
  .description("Generate files for a new endpoint")
  .option("--domain <domain>", "Domain for the endpoint")
  .option("--name <name>", "Name of the endpoint")
  .option("--skip-repository", "Skip generating the repository file")
  .option("--skip-controller", "Skip generating the controller file")
  .option("--skip-test", "Skip generating the test file")
  .action(async (options) => {
    const { domain, name, skipRepository, skipController, skipTest } = options

    if (!domain || !name) {
      console.error("Please provide both --domain and --name options")
      return
    }

    const domainPath = path.join(__dirname, "src", "domains", domain)
    const httpPath = path.join(__dirname, "src", "http")

    // Generate controller
    if (!skipController) {
      const controllerPath = path.join(httpPath, "api", "controllers", domain)
      const controllerFile = path.join(controllerPath, `${name}_controller.ts`)
      await generateFile(controllerFile, "controller.ejs", { name, domain })
    }

    // Generate repository
    if (!skipRepository) {
      const repositoryPath = path.join(domainPath, "repositories")
      const repositoryFile = path.join(repositoryPath, `${name}_repository.ts`)
      await generateFile(repositoryFile, "repository.ejs", { name, domain })
    }

    // Generate action
    const actionPath = path.join(domainPath, "actions")
    const actionFile = path.join(actionPath, `${name}_action.ts`)
    await generateFile(actionFile, "action.ejs", { name, domain })

    // Generate DTO
    const dtoPath = path.join(domainPath, "dto")
    const dtoFile = path.join(dtoPath, `${name}_dto.ts`)
    await generateFile(dtoFile, "dto.ejs", { name, domain })

    // Generate test file
    if (!skipTest) {
      const testPath = path.join(
        __dirname,
        "src",
        "tests",
        "integration",
        domain,
      )
      const testFile = path.join(testPath, `${name}.spec.ts`)
      await generateFile(testFile, "test.ejs", { name, domain })
    }

    console.log("Files generated successfully!")
  })

async function generateFile(filePath: string, templateName: string, data: any) {
  const templatePath = path.join(__dirname, "templates", `${templateName}`)
  const template = await fs.promises.readFile(templatePath, "utf-8")
  const renderedContent = ejs.render(template, data)

  const dirPath = path.dirname(filePath)
  await fs.promises.mkdir(dirPath, { recursive: true })
  await fs.promises.writeFile(filePath, renderedContent)
}

program.parse(process.argv)
