declare module 'mailsplit' {
  import { Transform } from 'node:stream'

  export class Splitter extends Transform {}

  export class Rewriter extends Transform {
    // biome-ignore lint/suspicious/noExplicitAny: Mailsplit type definitions
    constructor(filterFunc: (node: any) => boolean)
  }

  export class Joiner extends Transform {}
}
