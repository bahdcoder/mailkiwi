import { cleanEnv, host, port, str } from "envalid"

import { makeEnvSecrets } from "@/shared/utils/env/make_env_secrets.ts"
import { redisDatabaseUrl } from "@/shared/utils/env/make_redis_url_validator.ts"

export type MtaAuthenticatorEnvVariables = typeof mtaAuthenticatorEnv

export const mtaAuthenticatorEnv = makeEnvSecrets(
  cleanEnv(process.env, {
    // Http server
    MTA_AUTHENTICATOR_PORT: port(),

    // Encryption & security
    APP_KEY: str(),

    // Mta
    MTA_ACCESS_TOKEN: str(),

    // Environment
    NODE_ENV: str({
      choices: ["development", "test", "production"],
      default: "test",
    }),

    // Databases
    REDIS_URL: redisDatabaseUrl(),
  }),
)
