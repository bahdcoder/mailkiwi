import { ComposeBroadcastFlow } from '#root/pages/components/flows/compose_broadcast/compose_broadcast_flow.jsx'
import { CreateBroadcastFlow } from '#root/pages/components/flows/compose_broadcast/create_broadcast_flow.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import React from 'react'

import * as DropdownMenu from '#root/pages/components/dropdown/dropdown.jsx'
import { ImportContactsDialog } from '#root/pages/components/flows/contacts/import_contacts/import_contacts_flow.jsx'
import { MoreVertIcon } from '#root/pages/components/icons/more-vert.svg.jsx'
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

export interface ProductPageHeadingProps extends React.PropsWithChildren {
  header?: React.ReactNode
}

export function ProductPageHeading({ children, header }: ProductPageHeadingProps) {
  const { audience } = usePageContextWithProps()

  const {
    dropdownOpen,
    setDropdownOpen,
    hasOpenDialog,
    onCloseAutoFocus,
    dropdownTriggerRef,
    handleDialogItemSelect,
    handleDialogItemOpenChange,
  } = useDialogInDropdownMenuItem()

  return (
    <div className="w-full pt-6 flex flex-col sticky top-0 kb-background-secondary z-2">
      {header ? (
        header
      ) : (
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between">
          <Heading variant="display" size="xs">
            Engage
          </Heading>

          <div className="flex items-center gap-2">
            <CreateBroadcastFlow>
              <Button className="h-10">Compose a broadcast</Button>
            </CreateBroadcastFlow>

            <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenu.Trigger asChild>
                <Button className="h-10" variant="secondary" ref={dropdownTriggerRef}>
                  <MoreVertIcon />
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content
                className="relative -left-8"
                hidden={hasOpenDialog}
                onCloseAutoFocus={onCloseAutoFocus}
              >
                <DropdownMenu.Label />

                <ImportContactsDialog
                  audienceId={audience?.id}
                  onOpenChange={handleDialogItemOpenChange}
                >
                  <DropdownMenu.Item
                    onSelect={handleDialogItemSelect}
                    className="h-9 box-border flex px-2 items-center cursor-pointer hover:bg-(--background-hover)"
                  >
                    <Text>Import contacts</Text>
                  </DropdownMenu.Item>
                </ImportContactsDialog>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

export function useDialogInDropdownMenuItem() {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [hasOpenDialog, setHasOpenDialog] = React.useState(false)

  const dropdownTriggerRef = React.useRef<HTMLButtonElement | null>(null)
  const focusRef = React.useRef<HTMLButtonElement | null>(null)

  function handleDialogItemSelect(event: Event) {
    event.preventDefault()

    focusRef.current = dropdownTriggerRef.current
  }

  function handleDialogItemOpenChange(open: boolean) {
    setHasOpenDialog(open)
    if (open === false) {
      setDropdownOpen(false)
    }
  }

  function onCloseAutoFocus(event: Event) {
    if (focusRef.current) {
      focusRef.current.focus()
      focusRef.current = null
      event.preventDefault()
    }
  }

  return {
    focusRef,
    dropdownOpen,
    hasOpenDialog,
    setDropdownOpen,
    setHasOpenDialog,
    dropdownTriggerRef,
    handleDialogItemSelect,
    handleDialogItemOpenChange,
    onCloseAutoFocus,
  }
}
