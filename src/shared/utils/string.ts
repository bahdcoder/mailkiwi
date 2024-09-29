import { base64 } from "@poppinss/utils"
import { randomBytes } from "node:crypto"

export function fromEmailToDomain(email: string) {
  return email?.split("@")?.[1]
}

export function ipv4AdressFromIpAndPort(ipAndPort: string) {
  return ipAndPort?.split(":")?.[0]
}

export default {
  random(size: number) {
    const bits = (size + 1) * 6
    const buffer = randomBytes(Math.ceil(bits / 8))
    return base64.urlEncode(buffer).slice(0, size)
  },
  fromEmailToDomain,
}
