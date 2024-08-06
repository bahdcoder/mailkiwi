import {
  url,
  ip,
  maxLength,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  safeParse,
  string,
} from "valibot";

export type EnvVariables = {
  PORT: number;
  HOST: string;
  APP_KEY: string;
  APP_URL: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  NODE_ENV: "development" | "test" | "production";
  SMTP_TEST_URL: string;
  isTest: boolean;
  isProd: boolean;
  isDev: boolean;
  TEST_AWS_KEY: string;
  TEST_AWS_SECRET: string;
  TEST_AWS_REGION: string;
};

export type ConfigVariables = typeof config;

const DEFAULT_PORT = "5566";

const envValidationSchema = object({
  PORT: optional(string(), DEFAULT_PORT),
  HOST: pipe(
    optional(string(), `http://localhost:${DEFAULT_PORT}`),
    nonEmpty(),
    ip(),
  ),
  APP_KEY: pipe(string(), nonEmpty(), minLength(32), maxLength(32)),
  APP_URL: pipe(
    optional(string(), `http://localhost:${DEFAULT_PORT}`),
    nonEmpty(),
    url(),
  ),
  REDIS_URL: pipe(string(), nonEmpty()),
  DATABASE_URL: pipe(string(), nonEmpty()),
  NODE_ENV: picklist(["development", "test", "production"]),
  SMTP_TEST_URL: pipe(string(), nonEmpty(), url()),
  TEST_AWS_KEY: optional(string()),
  TEST_AWS_SECRET: optional(string()),
  TEST_AWS_REGION: optional(string()),
});

const parsed = safeParse(envValidationSchema, process.env);

if (!parsed.success) {
  console.dir({
    "🟡 ENVIRONMENT_VARIABLES_VALIDATION_FAILED": parsed.issues,
  });
}

export const env = parsed.output as EnvVariables;

env.isTest = env.NODE_ENV === "test";
env.isProd = env.NODE_ENV === "production";
env.isDev = env.NODE_ENV === "development";

const SHORT_NAME = "mailkiwi";

export const config = {
  ...env,
  software: { shortName: SHORT_NAME, teamHeader: `x-${SHORT_NAME}-team-id` },
};
