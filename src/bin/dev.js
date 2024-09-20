import concurrently from "concurrently"

await concurrently([
  {
    command: "pnpm api:dev",
    name: "monolith-api",
  },
  {
    command: "pnpm mta_authenticator:dev",
    name: "mta-authenticator",
  },
  {
    command: "pnpm mta_log_processor:dev",
    name: "mta-log-processor",
  },
  {
    command: "pnpm mta_injector:dev",
    name: "mta-injector",
  },
]).result
