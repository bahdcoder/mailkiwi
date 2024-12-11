import { Ignitor } from "@/app/ignitor/ignitor.js"
import { addDefaultChannelsCommand } from "@/cli/commands/chat/add_default_channels_comand.js"
import { seedDevSendingSourcesCommand } from "@/cli/commands/seed_dev_sending_sources_command.js"

import { ContainerKey } from "@/shared/container/index.js"
import { VikePageRenderer } from "@/shared/types/vike.js"

import { container } from "@/utils/typi.js"

await new Ignitor().boot().start()

container.register<VikePageRenderer>(ContainerKey.vikeRenderPage, (ctx, _, pageProps) => {
  return ctx.json({
    pageProps,
    headers: ctx.req.raw,
    url: ctx.req.url,
  })
})

await Promise.all([
  addDefaultChannelsCommand.handler?.(),
  seedDevSendingSourcesCommand.handler?.(),
])
