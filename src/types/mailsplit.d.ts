declare module "mailsplit" {
  import { Transform } from "node:stream"
  export class Splitter extends Transform {}
}

declare module "mailsplit/lib/node-rewriter" {
  import { Transform } from "node:stream"
  export default class Rewriter extends Transform {
    constructor(filterFunc: (node: any) => boolean) {}
  }
}

declare module "mailsplit/lib/message-joiner" {
  import { Transform } from "node:stream"
  export default class Joiner extends Transform {}
}
