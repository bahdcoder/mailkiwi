import { Ignitor } from '#root/core/app/ignitor/ignitor.js'
import { seedDevSendingSourcesCommand } from '#root/cli/commands/seed_dev_sending_sources_command.js'

import { ContainerKey } from '#root/core/shared/container/index.js'
import type { VikePageRenderer } from '#root/core/shared/types/vike.js'

import { container } from '#root/core/utils/typi.js'

await new Ignitor().boot().start()

container.register<VikePageRenderer>(
  ContainerKey.vikeRenderPage,
  async (ctx, _, pageProps) => {
    return Promise.resolve(
      ctx.json({
        pageProps,
        headers: ctx.req.raw,
        url: ctx.req.url,
      }),
    )
  },
)

await Promise.all([
  seedDevSendingSourcesCommand.handler?.(),
  // other commands here.
])
