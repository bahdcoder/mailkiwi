import { fixTypescriptImportsCommand } from "./commands/fix_typescript_imports_command.js"
import { addSendingSourceCommand } from "@/cli/commands/add_sending_source_command.js"
import { downloadGeolite2Database } from "@/cli/commands/download_geolite2_database_command.js"
import { generateAcmeAccountIdentityCommand } from "@/cli/commands/generate_acme_account_identity.js"
import { seedDevSendingSourcesCommand } from "@/cli/commands/seed_dev_sending_sources_command.js"
import { IgnitorCli } from "@/cli/ignitor/ignitor_cli.js"
import { run } from "@drizzle-team/brocli"

const ignitor = await new IgnitorCli().boot().start()

await run([
  addSendingSourceCommand,
  seedDevSendingSourcesCommand,
  downloadGeolite2Database,
  generateAcmeAccountIdentityCommand,
  fixTypescriptImportsCommand,
])

await ignitor.shutdown()
