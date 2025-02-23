import csvParser from 'csv-parser'
import type { Readable } from 'stream'

export async function readHeadersAndRowsFromCsvStream<T = any>(stream: Readable) {
  const parser = stream.pipe(csvParser())

  const { headers, rows }: { headers: string[]; rows: T[] } = await new Promise(
    (resolve, reject) => {
      const rows: T[] = []
      let headers: string[] = []

      parser
        .on('data', async (row) => {
          rows.push(row)
        })
        .on('headers', (_headers) => {
          headers = _headers
        })
        .on('end', () => resolve({ rows, headers }))
        .on('error', (error) => reject(error))
    },
  )

  return { headers, rows }
}
