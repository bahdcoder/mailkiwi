import { RuntimeException } from "@poppinss/utils"

export function E_INTERNAL_PROCESSING_ERROR(message?: string): never {
  throw new RuntimeException(message)
}
