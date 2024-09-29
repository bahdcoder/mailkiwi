import { Ignitor } from "@/api/ignitor/ignitor_api.js"
import { seedDevSendingSourcesCommand } from "@/cli/commands/seed_dev_sending_sources_command.js"

await new Ignitor().boot().start()

await seedDevSendingSourcesCommand.handler?.()
