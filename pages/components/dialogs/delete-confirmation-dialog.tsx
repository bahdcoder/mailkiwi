import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import { Text } from '@kibamail/owly/text'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import * as React from 'react'

interface DeleteConfirmationDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  itemType?: string
  onConfirm?: () => void
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  children,
  open,
  onOpenChange,
  title,
  description,
  itemName,
  itemType = 'item',
  onConfirm,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  const handleConfirm = () => {
    onConfirm?.()
    if (!isControlled) {
      setInternalOpen(false)
    }
  }

  const handleCancel = () => {
    if (!isControlled) {
      setInternalOpen(false)
    } else {
      onOpenChange?.(false)
    }
  }

  const defaultTitle = title || `Delete ${itemType}`
  const defaultDescription =
    description ||
    `Are you sure you want to delete ${itemName ? `"${itemName}"` : `this ${itemType}`}? This action cannot be undone and will revoke all access.`

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>{defaultTitle}</Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>{defaultDescription}</Dialog.Description>
          </VisuallyHidden>
        </Dialog.Header>

        <div className="px-5 pt-2 pb-4">
          <Text className="kb-content-secondary text-sm leading-relaxed">
            {defaultDescription}
          </Text>
        </div>

        <Dialog.Footer className="flex justify-between items-center">
          <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            loading={isLoading}
          >
            Permanently delete
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
