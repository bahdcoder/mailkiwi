import { build } from "esbuild"

build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "build/main.js",
  sourcemap: true,
  minify: false,
  logOverride: {
    "empty-import-meta": "silent",
  },
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
