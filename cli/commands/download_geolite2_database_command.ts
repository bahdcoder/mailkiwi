import { appEnv } from '@/app/env/app_env.js'
import { boolean, command } from '@drizzle-team/brocli'
import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { lstat, readdir, rename, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { extract as tarExtract } from 'tar'
import { createGunzip } from 'node:zlib'

export const downloadGeolite2Database = command({
  name: 'download_geolite2_database',
  desc: 'Download the latest cached version of the geolite2 database and store close to code.',
  options: {
    force: boolean().default(false),
  },
  async transform(opts) {
    return opts
  },
  async handler({ force }) {
    const decompressedFilePath = resolve(process.cwd(), 'geo')
    const newDatabaseFilePath = resolve(decompressedFilePath, 'cities.mmdb')

    if (existsSync(newDatabaseFilePath) && !force) {
      console.log('Cities database already downloaded.')
      return
    }

    const response = await fetch(appEnv.MMDB_DOWNLOAD_URL)

    console.log('Downloading zipped file')

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const compressedFilePath = resolve(process.cwd(), 'geo', 'mmdb_cities.tar.gz')

    const compressedFileOutputStream = createWriteStream(compressedFilePath)

    console.log('Streaming to compressed zip file.')
    await pipeline(response.body as any, compressedFileOutputStream)

    const compressedFileReadStream = createReadStream(compressedFilePath)

    console.log('Stream compressed file, decompress and write to final db file.')

    await pipeline(
      compressedFileReadStream,
      createGunzip(),
      tarExtract({ cwd: decompressedFilePath }),
    )

    const files = await readdir(decompressedFilePath)

    console.log('Copying extracted file to geo folder.')

    for (const file of files) {
      const fileStats = await lstat(resolve(decompressedFilePath, file))

      if (!fileStats.isDirectory()) {
        continue
      }

      const databaseFilePath = resolve(decompressedFilePath, file, 'GeoLite2-City.mmdb')

      await rename(databaseFilePath, newDatabaseFilePath)

      console.log('Cleaning up extracted folder and compressed file.')
      await rm(resolve(decompressedFilePath, file), { recursive: true })
      await rm(resolve(compressedFilePath))

      console.log('Done !')

      break
    }
  },
})
