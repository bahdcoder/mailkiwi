declare module 'mailsplit' {
  import { Transform } from 'node:stream'

  export class Splitter extends Transform {}

  export class Rewriter extends Transform {
    constructor(filterFunc: (node: any) => boolean)
  }

  export class Joiner extends Transform {}
}
