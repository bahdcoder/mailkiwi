import { inspect } from 'node:util'

/**
 * Dump function for debugging - prints values to console with nice formatting
 */
function dump(...values: unknown[]): void {
  for (const value of values) {
    console.log(
      inspect(value, {
        colors: true,
        depth: null,
        maxArrayLength: null,
        maxStringLength: null,
        breakLength: 80,
        compact: false,
      }),
    )
  }
}

/**
 * Short alias for dump function
 */
function d(...values: unknown[]): void {
  dump(...values)
}

// Make functions available globally
declare global {
  function dump(...values: unknown[]): void
  function d(...values: unknown[]): void
}
// Assign to global object
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
;(globalThis as any).dump = dump
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
;(globalThis as any).d = d

// Note: dump and d are made available globally but not exported
