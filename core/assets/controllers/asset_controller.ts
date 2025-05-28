import { appEnv } from '#root/core/app/env/app_env.js'
import { removeTrailingSlash } from '#root/pages/utils/remove_trailing_slash.js'
import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export class AssetController extends BaseController {
  protected ASSETS_STORAGE_URL(assetPath: string) {
    return [
      removeTrailingSlash(appEnv.STORJ_ASSETS_PUBLIC_URL),
      'raw',
      appEnv.STORJ_ACCESS_GRANT,
      appEnv.FILE_UPLOADS_BUCKET,
      removeTrailingSlash(this.removeAssetsPrefix(assetPath)),
    ].join('/')
  }

  private removeAssetsPrefix(path: string) {
    return path.replace('/assets', '')
  }

  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([['GET', '/*', this.get]], {
      prefix: 'assets',
      middleware: [],
    })
  }

  get = async (ctx: HonoContext) => {
    const assetsUrl = this.ASSETS_STORAGE_URL(ctx.req.path)

    const response = await fetch(assetsUrl)

    return new Response(response.body, {
      status: response.status,
      headers: this.getHeadersForResponse(response),
    })
  }

  private getHeadersForResponse(response: Response) {
    const headers = new Headers()

    for (const [name, value] of response.headers.entries()) {
      headers.set(name, value)
    }

    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return headers
  }
}
