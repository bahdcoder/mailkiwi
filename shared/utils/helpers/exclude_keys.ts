export function excludeKeys<T extends object>(object: T, keysToExclude: (keyof T)[]) {
  if (!object) {
    return object
  }

  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keysToExclude.includes(key as keyof T)),
  )
}
