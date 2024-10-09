import { addSendingSourceCommand } from "@/cli/commands/add_sending_source_command.js"
import { seedDevSendingSourcesCommand } from "@/cli/commands/seed_dev_sending_sources_command.js"
import { IgnitorCli } from "@/cli/ignitor/ignitor_cli.js"
import { run } from "@drizzle-team/brocli"

const ignitor = await new IgnitorCli().boot().start()

await run([addSendingSourceCommand, seedDevSendingSourcesCommand])

await ignitor.shutdown()
