import { DateTime } from 'luxon'

// biome-ignore lint/suspicious/noExplicitAny: Function needs to handle any value type
export function guessValueType(value: any) {
  if (isValueABoolean(value)) {
    return 'boolean'
  }

  if (isValueADateType(value)) {
    return 'date'
  }

  if (isValueANumber(value)) {
    return 'float'
  }

  return 'text'
}

// biome-ignore lint/suspicious/noExplicitAny: Function needs to handle any value type
export function isValueABoolean(value: any) {
  return value === true || value === false
}

// biome-ignore lint/suspicious/noExplicitAny: Function needs to handle any value type
export function isValueANumber(value: any) {
  if (!Number.isNaN(value) && value !== '' && typeof value !== 'boolean') {
    const parsedValue = Number.parseFloat(value)
    if (!Number.isNaN(parsedValue)) {
      const MYSQL_FLOAT_MIN = -3.402823466e38
      const MYSQL_FLOAT_MAX = 3.402823466e38

      return parsedValue >= MYSQL_FLOAT_MIN && parsedValue <= MYSQL_FLOAT_MAX
    }
  }

  return false
}

// biome-ignore lint/suspicious/noExplicitAny: Function needs to handle any value type
export function isValueADateType(value: any) {
  if (typeof value !== 'string') {
    return false
  }

  if (
    !value.match(
      new RegExp(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/,
      ),
    )
  ) {
    return false
  }

  try {
    const date = DateTime.fromISO(value)

    return date.isValid
  } catch (error) {
    return false
  }
}
