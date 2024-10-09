import { build } from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"

const output = await build({
  entryPoints: ["src/api/start/api_prod.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "build/api/main.js",
  sourcemap: true,
  minify: false,
  metafile: true,
  logOverride: {
    "empty-import-meta": "silent",
  },
})

await fs.writeFile(
  path.resolve(process.cwd(), "build", "meta.json"),
  JSON.stringify(output.metafile),
)
