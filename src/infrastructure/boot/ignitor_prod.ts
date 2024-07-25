import { serve } from '@hono/node-server'
import { Ignitor } from './ignitor.js'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { container } from '@/utils/typi.js'

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
