import type { HonoInstance } from "@/server/hono.js"
import type { HonoContext } from "@/server/types.js"

import {
  ContainerKey,
  makeApp,
  makeEnv,
} from "@/shared/container/index.js"
import type { EnvVariables } from "@/shared/env/index.js"

import { container } from "@/utils/typi.js"

export class RootController {
  constructor(
    private app: HonoInstance = makeApp(),
    private env: EnvVariables = makeEnv(),
  ) {
    this.app.defineRoutes([["GET", "*", this.index.bind(this)]], {
      prefix: "p",
      middleware: [],
    })
  }

  async index(ctx: HonoContext) {
    return ctx.html(/* html*/ `
      <!DOCTYPE html>
        <head>
          ${
            this.env.isDev
              ? /* html*/
                `<script type="module" src="/@vite/client"></script>
          <script type="module">
            import RefreshRuntime from '/@react-refresh'
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
          </script>`
              : ""
          }
        </head>
        
        <body>
          <div id="root"></div>
        </body>

        ${this.env.isDev ? /* html*/ `<script type="module" src="/main.tsx"></script>` : ""}
        ${
          this.env.isProd
            ? /* html*/ `<script type="module" src="/${
                container.resolve<Record<string, { file: string }>>(
                  ContainerKey.viteManifestFile,
                )["main.tsx"].file
              }"></script>`
            : ""
        }
      `)
  }
}
