export function makeExtraAppConfigurations<T extends object, R extends object>(
  value: T,
  extensions: R,
): T & R {
  return { ...value, ...extensions }
}
