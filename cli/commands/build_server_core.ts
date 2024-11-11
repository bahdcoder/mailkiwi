import { command } from "@drizzle-team/brocli"
import { build } from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"

export const buildServerCoreCommand = command({
  name: "build_server_core",
  desc: "Build the server core using esbuild.",
  async transform(opts) {
    return opts
  },
  async handler() {
    const buildFolder = path.resolve("build/core")

    async function rewriteImports(filePath: string) {
      const fileContent = await fs.readFile(filePath, "utf8")
      const fileDirName = path.dirname(filePath)

      const updatedContent = fileContent
        .replace(/from\s+['"]@\/(.*?)['"]/g, function (match, aliasPath) {
          const absolutePath = path.join(buildFolder, aliasPath)

          let relativePath = path.relative(fileDirName, absolutePath)

          if (!relativePath.startsWith(".")) {
            relativePath = `./${relativePath}`
          }

          return `from '${relativePath.replace(/\\/g, "/")}'`
        })
        .replace(/import\s+['"]@\/(.*?)['"]/g, (match, aliasPath) => {
          const absolutePath = path.join(buildFolder, aliasPath)
          let relativePath = path.relative(fileDirName, absolutePath)

          if (!relativePath.startsWith(".")) {
            relativePath = `./${relativePath}`
          }

          return `import '${relativePath.replace(/\\/g, "/")}'`
        })

      await fs.writeFile(filePath, updatedContent, "utf8")
    }

    async function processDirectory(directory: string) {
      const entries = await fs.readdir(directory, {
        withFileTypes: true,
      })

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
          processDirectory(fullPath)
        }

        if (entry.isFile() && fullPath.endsWith(".js")) {
          await rewriteImports(fullPath)
        }
      }
    }

    await processDirectory(buildFolder)
  },
})
