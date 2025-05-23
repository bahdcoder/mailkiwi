import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import mjml from 'mjml'
import puppeteer, { KnownDevices } from 'puppeteer'

import { E_OPERATION_FAILED } from '#root/core/http/responses/errors.js'

import { sleep } from '#root/core/utils/sleep.js'

/**
 * EmailSnapshotTool generates visual snapshots of email templates across different devices.
 *
 * This tool is essential for email template development and testing, providing:
 * 1. Visual verification of email rendering across different device types
 * 2. Automated screenshot generation for responsive design testing
 * 3. HTML output for manual inspection and debugging
 *
 * The tool uses Puppeteer to render emails in different viewport sizes and device
 * configurations, ensuring that templates look correct across desktop and mobile
 * environments before being sent to recipients.
 */
export class EmailSnapshotTool {
  private name = ''
  private toDirectory: string = path.resolve(
    process.cwd(),
    'src',
    'tests',
    'snapshots',
    'emails',
  )

  constructor(private content: string) {}

  private devices = [
    { name: 'desktop', viewport: { width: 1280, height: 920 } },
    { name: 'Pixel 5', device: KnownDevices['Pixel 5'] },
    // {
    //   name: "iPhone 13 Pro Max",
    //   device: KnownDevices["iPhone 13 Pro Max"],
    // },
  ]

  /**
   * Sets the output directory for snapshot files.
   *
   * @param directory - Path where snapshot files will be saved
   * @returns The tool instance for method chaining
   */
  writeToDirectory(directory: string) {
    this.toDirectory = directory

    return this
  }

  /**
   * Sets the filename prefix for all generated snapshots.
   *
   * @param name - Prefix to use for snapshot filenames
   * @returns The tool instance for method chaining
   */
  prefix(name: string) {
    this.name = name

    return this
  }

  private getSnapshotName(deviceName: string) {
    return `${this.name}-${deviceName.toLowerCase().replace(' ', '-')}`
  }

  /**
   * Generates email snapshots for all configured devices.
   *
   * This method:
   * 1. Saves the raw HTML content to a file for reference
   * 2. Launches a headless browser to render the email
   * 3. Captures screenshots of the email as rendered on different devices
   * 4. Saves the screenshots to the configured directory
   *
   * The process includes a short delay after loading content to ensure
   * all assets and styles are properly rendered before capturing.
   */
  async snapshot() {
    await writeFile(path.resolve(this.toDirectory, `${this.name}.html`), this.content)

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
        path: path.resolve(this.toDirectory, `${this.getSnapshotName(device.name)}.png`),
        fullPage: true,
      })
    }

    await browser.close()
  }
}
