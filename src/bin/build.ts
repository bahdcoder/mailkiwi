import { build } from "esbuild"

build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "build/main.js",
  sourcemap: true,
  minify: false,
  external: ["bcrypt"],
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
