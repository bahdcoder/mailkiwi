import "dotenv/config"

import { Secret } from "@poppinss/utils"
import { cleanEnv, host, makeValidator, num, str, url } from "envalid"

export type EnvVariables = typeof env
export type ConfigVariables = typeof config

const appKey = makeValidator((value) => {
  if (value.length !== 32) {
    throw new Error("APP_KEY must be 32 characters long.")
  }

  return new Secret(value)
})

export const env = cleanEnv(process.env, {
  PORT: num(),
  HOST: host(),
  APP_KEY: appKey({ desc: "Application key." }),
  DATABASE_URL: url(),
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
})

export const config = { ...env, software: { shortName: "bamboomailer" } }
