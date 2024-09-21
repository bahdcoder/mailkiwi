import cuid2 from "@paralleldrive/cuid2"
import { v1 } from "uuid"

export function cuid() {
  // const cuid = cuid2.createId()

  // const hex = Buffer.from(cuid, "utf8").toString("hex")

  return v1()
}
