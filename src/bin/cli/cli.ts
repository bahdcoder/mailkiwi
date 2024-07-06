import * as changeCase from "change-case"
import { Command } from "commander"
import * as ejs from "ejs"
import * as fs from "fs/promises"
import inquirer from "inquirer"
import * as path from "path"
import * as prettier from "prettier"

class FileGenerator {
  async generateFile(
    filePath: string,
    templateName: string,
    // eslint-disable-next-line
    data: any,
  ): Promise<string> {
    const templatePath = path.join(
      import.meta.dirname,
      "templates",
      `${templateName}`,
    )
    const template = await fs.readFile(templatePath, "utf-8")
    const renderedContent = ejs.render(template, data)
    return renderedContent
  }

  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch (err) {
      return false
    }
  }
}

class RepositoryScanner {
  async scanRepositories(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const repositories: string[] = []

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        const nestedRepositories = await this.scanRepositories(entryPath)
        repositories.push(...nestedRepositories)
      } else if (entry.name.endsWith("_repository.ts")) {
        const repositoryName = entry.name.replace("_repository.ts", "")
        repositories.push(repositoryName)
      }
    }

    return repositories
  }
}

class FilesGenerator {
  private fileGenerator: FileGenerator
  public repositoryScanner: RepositoryScanner

  constructor() {
    this.fileGenerator = new FileGenerator()
    this.repositoryScanner = new RepositoryScanner()
  }

  async generateFiles(
    name: string,
    domain: string,
    repository: string | null,
    generateDto: boolean,
    generateTest: boolean,
    generateController: boolean,
  ) {
    const projectRoot = process.cwd()
    const domainPath = path.join(projectRoot, "src", "domains")

    const pascalCaseName = changeCase.pascalCase(name)
    const snakeCaseName = changeCase.snakeCase(name)
    const camelCaseName = changeCase.camelCase(name)

    let repositoryFile = ""
    let repositoryExists = false
    let repositoryName = ""

    if (repository !== null) {
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
      repositoryExists =
        await this.fileGenerator.checkFileExists(repositoryFile)
      if (!repositoryExists) {
        await this.generateRepository(
          repositoryFile,
          pascalCaseName,
          domain,
          camelCaseName,
          snakeCaseName,
        )
        console.log(`✨ Generated repository: ${repositoryFile}`)
      }
      repositoryName = snakeCaseName
    }

    if (generateController) {
      await this.generateController(
        name,
        domain,
        camelCaseName,
        repositoryExists,
        pascalCaseName,
        snakeCaseName,
        repositoryFile,
        repositoryName,
        generateDto,
      )
    }

    await this.generateAction(
      name,
      domain,
      camelCaseName,
      repositoryExists,
      generateDto,
      pascalCaseName,
      snakeCaseName,
      repositoryFile,
      repositoryName,
    )

    if (generateDto) {
      await this.generateDto(
        name,
        domain,
        camelCaseName,
        pascalCaseName,
        snakeCaseName,
      )
    } else {
      console.log("Skipped generating DTO")
    }

    if (generateTest) {
      await this.generateTest(
        name,
        domain,
        camelCaseName,
        repositoryExists,
        pascalCaseName,
        snakeCaseName,
        repositoryFile,
        repositoryName,
        generateDto,
      )
    }
  }

  private async generateRepository(
    repositoryFile: string,
    pascalCaseName: string,
    domain: string,
    camelCaseName: string,
    snakeCaseName: string,
  ) {
    const repositoryContent = await this.fileGenerator.generateFile(
      repositoryFile,
      "repository.ejs",
      {
        name: pascalCaseName,
        domain,
        camelCaseName,
        pascalCaseName,
        snakeCaseName,
      },
    )
    const formattedRepositoryContent = await prettier.format(
      repositoryContent,
      {
        parser: "typescript",
      },
    )
    await fs.writeFile(repositoryFile, formattedRepositoryContent)
  }

  private async generateController(
    name: string,
    domain: string,
    camelCaseName: string,
    repositoryExists: boolean,
    pascalCaseName: string,
    snakeCaseName: string,
    repositoryFile: string,
    repositoryName: string,
    generateDto: boolean,
  ) {
    const controllerPath = path.join(
      "src",
      "http",
      "api",
      "controllers",
      domain,
    )
    const controllerFile = path.join(
      controllerPath,
      `${snakeCaseName}_controller.ts`,
    )
    const controllerExists =
      await this.fileGenerator.checkFileExists(controllerFile)
    if (!controllerExists) {
      const controllerContent = await this.fileGenerator.generateFile(
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
          repositoryNamePascalCase: changeCase.pascalCase(repositoryName),
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
      console.log(`⚠️ Controller already exists: ${controllerFile}`)
    }
  }

  private async generateAction(
    name: string,
    domain: string,
    camelCaseName: string,
    repositoryExists: boolean,
    generateDto: boolean,
    pascalCaseName: string,
    snakeCaseName: string,
    repositoryFile: string,
    repositoryName: string,
  ) {
    const actionPath = path.join("src", "domains", domain, "actions")
    const actionFile = path.join(actionPath, `${snakeCaseName}_action.ts`)
    const actionContent = await this.fileGenerator.generateFile(
      actionFile,
      "action.ejs",
      {
        name: pascalCaseName,
        domain,
        camelCaseName,
        repositoryExists,
        generateDto,
        pascalCaseName,
        snakeCaseName,
        repositoryFile,
        repositoryName,
        repositoryNamePascalCase: changeCase.pascalCase(repositoryName),
      },
    )
    const formattedActionContent = await prettier.format(actionContent, {
      parser: "typescript",
    })
    await fs.writeFile(actionFile, formattedActionContent)
    console.log(`✨ Generated action: ${actionFile}`)
  }

  private async generateDto(
    name: string,
    domain: string,
    camelCaseName: string,
    pascalCaseName: string,
    snakeCaseName: string,
  ) {
    const dtoPath = path.join("src", "domains", domain, "dto")
    const dtoFile = path.join(dtoPath, `${snakeCaseName}_dto.ts`)
    const dtoContent = await this.fileGenerator.generateFile(
      dtoFile,
      "dto.ejs",
      {
        name: pascalCaseName,
        domain,
        camelCaseName,
        pascalCaseName,
        snakeCaseName,
      },
    )
    const formattedDtoContent = await prettier.format(dtoContent, {
      parser: "typescript",
    })
    await fs.writeFile(dtoFile, formattedDtoContent)
    console.log(`✨ Generated DTO: ${dtoFile}`)
  }

  private async generateTest(
    name: string,
    domain: string,
    camelCaseName: string,
    repositoryExists: boolean,
    pascalCaseName: string,
    snakeCaseName: string,
    repositoryFile: string,
    repositoryName: string,
    generateDto: boolean,
  ) {
    const testPath = path.join("src", "tests", "integration", domain)
    const testFile = path.join(testPath, `${snakeCaseName}.spec.ts`)
    const testExists = await this.fileGenerator.checkFileExists(testFile)
    if (!testExists) {
      const testContent = await this.fileGenerator.generateFile(
        testFile,
        "test.ejs",
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
      const formattedTestContent = await prettier.format(testContent, {
        parser: "typescript",
      })
      await fs.writeFile(testFile, formattedTestContent)
      console.log(`✨ Generated test: ${testFile}`)
    } else {
      console.log(`⚠️ Test file already exists: ${testFile}`)
    }
  }
}

class FilesGeneratorCLI {
  private filesGenerator: FilesGenerator

  constructor(filesGenerator: FilesGenerator) {
    this.filesGenerator = filesGenerator
  }

  run() {
    const program = new Command()

    program
      .command("make:files")
      .description("Generate files for a new endpoint")
      .action(this.handleMakeFilesCommand.bind(this))

    program.parse(process.argv)
  }

  private async handleMakeFilesCommand() {
    const { name } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter the name of the endpoint (e.g., reset_password):",
      },
    ])

    const projectRoot = process.cwd()
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

    const repositories =
      await this.filesGenerator.repositoryScanner.scanRepositories(
        path.join(domainPath, domain),
      )

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

    const { generateTest } = await inquirer.prompt([
      {
        type: "confirm",
        name: "generateTest",
        message: "Do you want to generate a test file?",
        default: true,
      },
    ])

    const { generateController } = await inquirer.prompt([
      {
        type: "confirm",
        name: "generateController",
        message: "Do you want to generate a new controller file?",
        default: false,
      },
    ])

    const repositoryOption = repository === "Skip" ? null : repository

    await this.filesGenerator.generateFiles(
      name,
      domain,
      repositoryOption,
      generateDto,
      generateTest,
      generateController,
    )
  }
}

const filesGenerator = new FilesGenerator()
const cli = new FilesGeneratorCLI(filesGenerator)
cli.run()
