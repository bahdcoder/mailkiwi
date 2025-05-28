import { appEnv } from '#root/core/app/env/app_env.js'
import { removeTrailingSlash } from './remove_trailing_slash.js'

export function assetsPath(path: string) {
  return [removeTrailingSlash(appEnv.ASSETS_URL), removeTrailingSlash(path)].join('/')
}
