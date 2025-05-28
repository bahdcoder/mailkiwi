import { appEnv } from '#root/core/app/env/app_env.js'
import { command } from '@drizzle-team/brocli'

import { fonts as fontsTable } from '#root/database/schema.js'

import { makeDatabase, makeLogger } from '#root/core/shared/container/index.js'

type GoogleFont = {
  family: string
  lastModified: string
  files: Record<string, string>
  category: string
  subsets: string[]
  variants: string[]
}

export const syncGoogleFontsCommand = command({
  name: 'sync_google_fonts',
  desc: 'Sync google fonts to the database.',
  async transform(opts) {
    return opts
  },
  async handler() {
    const logger = makeLogger()
    const database = makeDatabase()
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${appEnv.GOOGLE_FONTS_API_KEY}&sort=popularity`,
    )

    const fonts = await response.json()

    const items = fonts.items as GoogleFont[]

    const allExistingFonts = await database.select().from(fontsTable)
    const allExistingFontsNames: Record<string, boolean> = {}
    for (const font of allExistingFonts) {
      allExistingFontsNames[font.family] = true
    }

    const newFontsToInsert = items.filter((item) => !allExistingFontsNames[item.family])

    await database.insert(fontsTable).values(
      newFontsToInsert.map((font) => ({
        family: font.family,
        category: font.category,
        files: font.files,
        subsets: font.subsets.join('___'),
        variants: font.variants.join('___'),
      })),
    )

    logger.info('👍 Google fonts synced successfully.')
  },
})
