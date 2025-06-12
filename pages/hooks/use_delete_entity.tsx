import * as React from 'react'
import { toast } from 'sonner'

import { DeleteConfirmationDialog } from '#root/pages/components/dialogs/delete-confirmation-dialog.js'
import { useServerFormMutation } from '#root/pages/hooks/use_server_form_mutation.js'

interface UseDeleteEntityOptions<T extends { name?: string | null; id: string }> {
  entity: string
  route: string
  refetchQuery: () => void
}

interface UseDeleteEntityReturn<T> {
  mutation: ReturnType<typeof useServerFormMutation>
  onDelete: (entity: T) => void
  onDeleteConfirm: () => void
  deleteDialog: React.ReactElement
  entityToDelete: T | null
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
}

export function useDeleteEntity<T extends { name?: string | null; id: string }>({
  entity,
  route,
  refetchQuery,
}: UseDeleteEntityOptions<T>): UseDeleteEntityReturn<T> {
  const [entityToDelete, setEntityToDelete] = React.useState<T | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const onDelete = React.useCallback((entity: T) => {
    setEntityToDelete(entity)
    setIsDeleteDialogOpen(true)
  }, [])

  const mutation = useServerFormMutation<{ id: string }>({
    method: 'DELETE',
    action: entityToDelete ? `${route}/${entityToDelete.id}` : '',
    onSuccess() {
      if (entityToDelete) {
        const entityName = entityToDelete.name || 'Untitled'
        toast.success(`${entity} "${entityName}" has been deleted successfully.`)

        setIsDeleteDialogOpen(false)
        setEntityToDelete(null)

        refetchQuery()
      }
    },
    onError() {
      toast.error(`Failed to delete ${entity.toLowerCase()}. Please try again.`)
    },
  })

  const onDeleteConfirm = React.useCallback(() => {
    if (entityToDelete) {
      mutation.mutate({})
    }
  }, [entityToDelete, mutation])

  const deleteDialog = React.useMemo(
    () => (
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemName={entityToDelete ? entityToDelete.name || 'Untitled' : 'Untitled'}
        itemType={entity}
        onConfirm={onDeleteConfirm}
        isLoading={mutation.isPending}
      >
        <div />
      </DeleteConfirmationDialog>
    ),
    [isDeleteDialogOpen, entityToDelete, entity, onDeleteConfirm, mutation.isPending],
  )

  return {
    mutation,
    onDelete,
    onDeleteConfirm,
    deleteDialog,
    entityToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  }
}
