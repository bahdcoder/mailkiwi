import { addSendingSourceCommand } from '#root/cli/commands/add_sending_source_command.js'
import { addChannelCommand } from '#root/cli/commands/chat/add_channel_command.js'
import { downloadGeolite2Database } from '#root/cli/commands/download_geolite2_database_command.js'
import { generateAcmeAccountIdentityCommand } from '#root/cli/commands/generate_acme_account_identity.js'
import { addDefaultChannelsCommand } from './commands/chat/add_default_channels_comand.js'

import { resetDatabaseCommand } from '#root/cli/commands/reset_database_command.js'
import { seedDevSendingSourcesCommand } from '#root/cli/commands/seed_dev_sending_sources_command.js'
import { syncGoogleFontsCommand } from '#root/cli/commands/sync_google_fonts_command.js'
import { IgnitorCli } from '#root/cli/ignitor/ignitor_cli.js'
import { run } from '@drizzle-team/brocli'

const ignitor = await new IgnitorCli().boot().start()

await run([
  addSendingSourceCommand,
  seedDevSendingSourcesCommand,
  downloadGeolite2Database,
  generateAcmeAccountIdentityCommand,

  // chat
  addChannelCommand,
  addDefaultChannelsCommand,

  // database
  resetDatabaseCommand,

  // composer editor
  syncGoogleFontsCommand,
])

await ignitor.shutdown()
