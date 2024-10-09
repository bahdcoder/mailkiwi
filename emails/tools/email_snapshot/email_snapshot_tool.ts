import mjml from "mjml"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import puppeteer, { KnownDevices } from "puppeteer"

import { E_OPERATION_FAILED } from "@/http/responses/errors.js"

import { sleep } from "@/utils/sleep.js"

export class EmailSnapshotTool {
  private name: string = ""
  private toDirectory: string = path.resolve(
    process.cwd(),
    "src",
    "tests",
    "snapshots",
    "emails",
  )

  constructor(private content: string) {}

  private devices = [
    { name: "desktop", viewport: { width: 1280, height: 920 } },
    { name: "Pixel 5", device: KnownDevices["Pixel 5"] },
    // {
    //   name: "iPhone 13 Pro Max",
    //   device: KnownDevices["iPhone 13 Pro Max"],
    // },
  ]

  writeToDirectory(directory: string) {
    this.toDirectory = directory

    return this
  }

  prefix(name: string) {
    this.name = name

    return this
  }

  private getSnapshotName(deviceName: string) {
    return this.name + "-" + deviceName.toLowerCase().replace(" ", "-")
  }

  async snapshot() {
    await writeFile(
      path.resolve(this.toDirectory, `${this.name}.html`),
      this.content,
    )

    const browser = await puppeteer.launch()

    const page = await browser.newPage()

    for (const device of this.devices) {
      if (device.device) {
        await page.emulate(device.device)
      }

      if (device.viewport) {
        await page.setViewport(device.viewport)
      }

      await page.setContent(this.content)

      await sleep(2000)

      await page.screenshot({
        path: path.resolve(
          this.toDirectory,
          `${this.getSnapshotName(device.name)}.png`,
        ),
        fullPage: true,
      })
    }

    await browser.close()
  }
}
