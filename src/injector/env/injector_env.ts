import { cleanEnv, host, port, str, url } from "envalid"

import { makeEnvSecrets } from "@/shared/utils/env/make_env_secrets.ts"

export type InjectorEnvVariables = typeof injectorEnv

export const injectorEnv = makeEnvSecrets(
  cleanEnv(process.env, {
    MTA_INJECTOR_PORT: port(),

    MAILPIT_API_URL: host(),

    APP_KEY: str(),
    REDIS_URL: str(),

    NODE_ENV: str({
      choices: ["development", "test", "production"],
      default: "test",
    }),

    // Mta
    MTA_INJECTOR_URL: url(),
  }),
)
