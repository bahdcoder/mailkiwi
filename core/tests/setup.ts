import { Ignitor } from '#root/core/app/ignitor/ignitor.js'
import { seedDevSendingSourcesCommand } from '#root/cli/commands/seed_dev_sending_sources_command.js'

await new Ignitor().boot().start()

await Promise.all([seedDevSendingSourcesCommand.handler?.()])
