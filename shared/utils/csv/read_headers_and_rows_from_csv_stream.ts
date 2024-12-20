import csvParser from "csv-parser"
import { Readable } from "stream"

export async function readHeadersAndRowsFromCsvStream<T = any>(stream: Readable) {
  const parser = stream.pipe(csvParser())

  const { headers, rows }: { headers: string[]; rows: T[] } = await new Promise(function (
    resolve,
    reject,
  ) {
    const rows: T[] = []
    let headers: string[] = []

    parser
      .on("data", async function (row) {
        rows.push(row)
      })
      .on("headers", (_headers) => {
        headers = _headers
      })
      .on("end", function () {
        return resolve({ rows, headers })
      })
      .on("error", function (error) {
        return reject(error)
      })
  })

  return { headers, rows }
}
