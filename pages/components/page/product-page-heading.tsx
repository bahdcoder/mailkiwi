import { CreateBroadcastFlow } from '#root/pages/components/flows/compose_broadcast/create_broadcast_flow.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import type React from 'react'

import * as DropdownMenu from '#root/pages/components/dropdown/dropdown.jsx'
import { ImportContactsDialog } from '#root/pages/components/flows/contacts/import_contacts/import_contacts_flow.jsx'
import { MoreVertIcon } from '#root/pages/components/icons/more-vert.svg.jsx'
import { useDialogInDropdownMenuItem } from '#root/pages/hooks/use_dialog_in_dropdown_menu_item.jsx'
import { Text } from '@kibamail/owly/text'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

interface ProductPageHeadingProps extends React.PropsWithChildren {
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
