import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { container } from '@/utils/typi.js'
import { serve } from '@hono/node-server'
import { Ignitor } from './ignitor.js'

export class IgnitorProd extends Ignitor {
  async startSinglePageApplication() {
    const viteManifestFile = await readFile(
      resolve(__dirname, 'client', '.vite', 'manifest.json'),
    )

    container.register(
      'viteManifestFile',
      JSON.parse(viteManifestFile.toString()),
    )
  }

  async startHttpServer() {
    serve({
      fetch: this.app.fetch,
      port: this.env.PORT,
    })

    console.log(`🌐 http://127.0.0.1:${this.env.PORT}`)
  }
}
