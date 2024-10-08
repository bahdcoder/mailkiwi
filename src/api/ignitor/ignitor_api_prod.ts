import { IgnitorDev } from "@/api/ignitor/ignitor_api_dev.js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";



import { container } from "@/utils/typi.js";


export class IgnitorProd extends IgnitorDev {
  async startSinglePageApplication() {
    const viteManifestFile = await readFile(
      resolve(process.cwd(), "build", "client", ".vite", "manifest.json"),
      "utf-8",
    )
    const manifest = JSON.parse(viteManifestFile.toString())

    d({ manifest })

    container.register("viteManifestFile", manifest)
  }
}