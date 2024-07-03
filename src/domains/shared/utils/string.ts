import { randomBytes } from "node:crypto"
import { base64 } from "@poppinss/utils"

export default {
  random(size: number) {
    const bits = (size + 1) * 6
    const buffer = randomBytes(Math.ceil(bits / 8))
    return base64.urlEncode(buffer).slice(0, size)
  },
}
