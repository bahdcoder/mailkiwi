import { Ignitor } from "./ignitor_api.js"
import { serve } from "@hono/node-server"
import { readFile } from "fs/promises"
import { resolve } from "path"
import { ViteDevServer, createServer as createViteServer } from "vite"

export class IgnitorDev extends Ignitor {
  protected viewsPath = resolve(process.cwd(), "src/views/app")
  protected entryServerPath = resolve(this.viewsPath, "entry-server.tsx")
  protected templateIndexHtmlPath = resolve(this.viewsPath, "index.html")

  async startSinglePageApplication() {
    const viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    })

    this.app.use(async (ctx, next) => {
      await new Promise((resolve) => {
        viteDevServer.middlewares.handle(
          ctx.env.incoming,
          ctx.env.outgoing,
          async () => {
            return resolve(next())
          },
        )
      })
    })

    this.registerCatchAllSsrRoute(viteDevServer)
  }

  protected async getCatchAllSsrTemplate(path: string) {
    let template = await readFile(this.templateIndexHtmlPath, "utf-8")

    const { render } = await import(this.entryServerPath)

    const pageProps = { defaultCount: 76 }

    template = template.replace(
      "<!--ssr-outlet-->",
      render(path, pageProps),
    )

    template = template.replace(
      "<!--page-route-data-outlet-->",
      /* html */ `
        <script>
          window.__pageProps = ${JSON.stringify(pageProps)};
        </script>
        `,
    )

    return template
  }

  protected registerCatchAllSsrRoute(viteDevServer: ViteDevServer) {
    const self = this

    this.app.get("*", async function (ctx) {
      let template = await self.getCatchAllSsrTemplate(ctx.req.path)

      template = await viteDevServer.transformIndexHtml(
        ctx.req.path,
        template,
      )

      return ctx.html(template)
    })
  }

  async startHttpServer() {
    serve(
      {
        fetch: this.app.fetch,
        port: this.env.PORT,
      },
      ({ address, port }) => {
        console.log(`Monolith API: 🌐 http://${address}:${port}`)
      },
    )
  }
}
