import { Ignitor } from '@/app/ignitor/ignitor.js'
import { seedDevSendingSourcesCommand } from '@/cli/commands/seed_dev_sending_sources_command.js'

import { ContainerKey } from '@/shared/container/index.js'
import type { VikePageRenderer } from '@/shared/types/vike.js'

import { container } from '@/utils/typi.js'

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
