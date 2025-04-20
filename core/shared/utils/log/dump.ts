export function dump(...value: unknown[]) {
  console.dir(value, { depth: null })
}

global.dump = dump
global.d = dump
