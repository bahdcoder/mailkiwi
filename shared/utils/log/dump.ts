export function dump(...value: any[]) {
  console.dir(value, { depth: null })
}

global.dump = dump
global.d = dump
