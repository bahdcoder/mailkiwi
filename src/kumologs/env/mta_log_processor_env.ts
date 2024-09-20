import { cleanEnv, host, port } from "envalid"

import { makeEnvSecrets } from "@/shared/utils/env/make_env_secrets.ts"
import { redisDatabaseUrl } from "@/shared/utils/env/make_redis_url_validator.ts"

export type MtaLogProcessorEnv = typeof mtaLogProcessorEnv

export const mtaLogProcessorEnv = makeEnvSecrets(
  cleanEnv(process.env, {
    // Http server
    MTA_LOG_PROCESSOR_PORT: port(),
    HOST: host(),

    // Databases
    REDIS_URL: redisDatabaseUrl(),
  }),
)
