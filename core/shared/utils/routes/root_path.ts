import { COMMERCE_WEBSITE_DOMAIN, appEnv } from '#root/core/app/env/app_env.js'

export function rootPath(path: string) {
  return `${appEnv.APP_URL}/${path}`
}

export function commercePath(path: string) {
  return `https://${COMMERCE_WEBSITE_DOMAIN}/${path}`
}
