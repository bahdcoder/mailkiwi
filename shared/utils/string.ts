import { base64 } from "@poppinss/utils"
import { randomBytes } from "node:crypto"
import { Readable } from "node:stream"
import { v1, v4 } from "uuid"

export function fromEmailToDomain(email: string) {
  return email?.split("@")?.[1]
}

export function generateMessageIdForDomain(domain: string) {
  const id = v1()
  return { id, messageId: `<${id + "@" + domain}>` }
}

export function ipv4AdressFromIpAndPort(ipAndPort: string) {
  return ipAndPort?.split(":")?.[0]
}

export function stringFromReadableStream(stream: Readable): Promise<string> {
  return new Promise(function (resolve, reject) {
    let chunks: Uint8Array[] = []

    stream.on("data", function (chunk) {
      chunks.push(chunk)
    })

    stream.on("end", function () {
      return resolve(Buffer.concat(chunks).toString("utf-8"))
    })

    stream.on("error", function (error) {
      return reject(error)
    })
  })
}

export default {
  fromEmailToDomain,
}
