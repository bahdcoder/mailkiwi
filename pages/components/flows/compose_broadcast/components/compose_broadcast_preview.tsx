import { CancelIcon } from '@/pages/components/icons/cancel.svg.jsx'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import * as Tabs from '@kibamail/owly/tabs'
import { useQuery } from '@tanstack/react-query'
import { usePageProps } from '@/pages/hooks/use_page_props.js'
import type { EngageBroadcastsComposerPageProps } from '@/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx'
import { useServerQuery } from '@/pages/hooks/use_server_query.js'
import { route } from '@/shared/routes/route_aliases.js'
import React from 'react'
import { cn } from '@/pages/components/tiptap/utils/index.js'

type Device = 'mobile' | 'desktop'

export function ComposeBroadcastPreview() {
  const pageProps = usePageProps<EngageBroadcastsComposerPageProps>()
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

      <Dialog.Content className="w-screen h-screen px-2 pb-2 box-border kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out z-[3]">
        <VisuallyHidden>
          <Dialog.Title>Preview broadcast email content</Dialog.Title>
          <Dialog.Description>Preview broadcast email content</Dialog.Description>
        </VisuallyHidden>

        <header className="h-[3.75rem] w-full box-border flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <Dialog.Close aria-label="Close preview" asChild>
              <Button variant="tertiary" className="flex-shrink-0">
                <CancelIcon className="!w-6 !h-6" />
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

        <div className="flex flex-grow w-full h-[calc(100vh-4.25rem)] box-border border kb-border-tertiary rounded-xl kb-background-hover px-24 py-16">
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
