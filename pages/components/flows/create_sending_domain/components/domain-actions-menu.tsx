import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import * as Dropdown from '#root/pages/components/dropdown/dropdown.js'
import { MoreVertIcon } from '#root/pages/components/icons/more-vert.svg.jsx'
import { useServerFormMutation } from '#root/pages/hooks/use_server_form_mutation.jsx'
import type { SendingDomain } from '#root/database/database_schema_types'
import * as React from 'react'
import { toast } from 'sonner'
import { DeleteConfirmationDialog } from '#root/pages/components/dialogs/delete-confirmation-dialog.jsx'

interface DomainActionsMenuProps {
  sendingDomain: SendingDomain
  onDomainDeleted?: () => void
}

export function DomainActionsMenu({
  sendingDomain,
  onDomainDeleted,
}: DomainActionsMenuProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const { mutate: deleteDomain, isPending } = useServerFormMutation({
    action: `/sending_domains/${sendingDomain.id}`,
    method: 'DELETE',
    async onSuccess() {
      toast.success('Domain deleted successfully')
      onDomainDeleted?.()
      setDropdownOpen(false)
      setDeleteDialogOpen(false)
    },
    async onError() {
      toast.error('Failed to delete domain')
    },
  })

  const handleDeleteClick = () => {
    setDropdownOpen(false)
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    deleteDomain({})
  }

  return (
    <>
      <Dropdown.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <Dropdown.Trigger asChild>
          <Button variant="secondary" disabled={isPending}>
            <MoreVertIcon className="h-4 w-4" />
          </Button>
        </Dropdown.Trigger>

        <Dropdown.Content align="end">
          <Dropdown.Item
            onSelect={handleDeleteClick}
            className="p-2 flex items-center hover:bg-(--background-secondary) rounded-lg cursor-pointer text-red-600 hover:text-red-700"
          >
            <Text>Delete domain</Text>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={sendingDomain.name}
        itemType="domain"
        onConfirm={handleDelete}
        isLoading={isPending}
      >
        <div />
      </DeleteConfirmationDialog>
    </>
  )
}
