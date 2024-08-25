import { build } from "esbuild"

await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "build/main.js",
  sourcemap: true,
  minify: false,
  metafile: true,
  logOverride: {
    "empty-import-meta": "silent",
  },
})
