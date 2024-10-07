import { IgnitorDev } from "@/api/ignitor/ignitor_api_dev.js"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import { container } from "@/utils/typi.js"

export class IgnitorProd extends IgnitorDev {
  async startSinglePageApplication() {
    const viteManifestFile = await readFile(
      resolve(__dirname, "client", ".vite", "manifest.json"),
    )

    container.register(
      "viteManifestFile",
      JSON.parse(viteManifestFile.toString()),
    )
  }
}
