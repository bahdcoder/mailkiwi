import { CancelIcon } from '#root/pages/components/icons/cancel.svg.jsx'
import { cn } from '#root/pages/components/tiptap/utils/index.js'
import {
  usePageContextWithProps,
  usePageProps,
} from '#root/pages/hooks/use_page_props.js'
import { useServerQuery } from '#root/pages/hooks/use_server_query.js'
import type { EngageBroadcastsComposerPageProps } from '#root/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { Button } from '@kibamail/owly/button'
import * as Tabs from '@kibamail/owly/tabs'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

type Device = 'mobile' | 'desktop'

export function ComposeBroadcastPreview() {
  const { pageProps } = usePageContextWithProps<EngageBroadcastsComposerPageProps>()
  const [activeDevice, setActiveDevice] = React.useState<Device>('desktop')

  const previewQuery = useServerQuery({
    queryKey: route('preview_broadcast', { uuid: pageProps.broadcast.id }),
    enabled: true,
    initialData: { preview: '' },
  })

  function onDialogOpenChange(open: boolean) {
    if (open) {
      previewQuery.refetch()
    }
  }

  return (
    <Dialog.Root onOpenChange={onDialogOpenChange}>
      <Dialog.Trigger>
        <Button variant="secondary">Preview</Button>
      </Dialog.Trigger>

      <Dialog.Content className="w-screen h-screen px-2 pb-2 box-border kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out z-3">
        <VisuallyHidden>
          <Dialog.Title>Preview broadcast email content</Dialog.Title>
          <Dialog.Description>Preview broadcast email content</Dialog.Description>
        </VisuallyHidden>

        <header className="h-15 w-full box-border flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <Dialog.Close aria-label="Close preview" asChild>
              <Button variant="tertiary" className="shrink-0">
                <CancelIcon className="w-6! h-6!" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <Tabs.Root
              value={activeDevice}
              onValueChange={(value) => setActiveDevice(value as Device)}
            >
              <Tabs.List>
                <Tabs.Indicator />
                <Tabs.Trigger value="desktop">Desktop</Tabs.Trigger>
                <Tabs.Trigger value="mobile">Mobile</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </div>
          <Button variant="secondary">Send test email</Button>
        </header>

        <div className="flex grow w-full h-[calc(100vh-4.25rem)] box-border border kb-border-tertiary rounded-xl kb-background-hover px-24 py-16">
          <iframe
            sandbox="allow-same-origin"
            srcDoc={previewQuery.data?.preview}
            title="Preview broadcast email content"
            className={cn(
              'h-full border-none mx-auto transition-[width] duration-300 ease-in-out',
              {
                'w-[380px]': activeDevice === 'mobile',
                'w-full': activeDevice === 'desktop',
              },
            )}
          />
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
