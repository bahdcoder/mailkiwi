import fs from 'node:fs/promises'
import path from 'node:path'

import { build } from 'esbuild'
const output = await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'build/main.js',
  sourcemap: true,
  minify: false,
  metafile: true,
  logOverride: {
    'empty-import-meta': 'silent',
  },
})

await fs.writeFile(
  path.resolve(process.cwd(), 'build', 'meta.json'),
  JSON.stringify(output.metafile),
)
