import { v1 } from 'uuid'

export function cuid() {
  return v1()
}

export const UUID_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
