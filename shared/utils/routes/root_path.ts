import { appEnv } from "@/app/env/app_env.js"

export function rootPath(path: string) {
  return `${appEnv.APP_URL}/${path}`
}
