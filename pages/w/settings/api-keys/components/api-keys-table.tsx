import { Badge } from '@kibamail/owly/badge'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import * as React from 'react'
import { toast } from 'sonner'

import type { AccessToken } from '#root/database/database_schema_types.js'
import { DeleteConfirmationDialog } from '#root/pages/components/dialogs/delete-confirmation-dialog.js'
import * as Dropdown from '#root/pages/components/dropdown/dropdown.js'
import { MoreVertIcon } from '#root/pages/components/icons/more-vert.svg.js'
import { useServerFormMutation } from '#root/pages/hooks/use_server_form_mutation.js'
import * as Table from '#root/pages/w/engage/contacts/components/table.js'

dayjs.extend(relativeTime)

interface ApiKeysTableProps {
  apiKeys: AccessToken[]
  refetchQuery: () => void
}

const columnHelper = createColumnHelper<AccessToken>()

interface ApiKeyActionsMenuProps {
  apiKey: AccessToken
  onDeleteClick: (apiKey: AccessToken) => void
}

function ApiKeyActionsMenu({ apiKey, onDeleteClick }: ApiKeyActionsMenuProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  const handleDeleteClick = () => {
    onDeleteClick(apiKey)
    setDropdownOpen(false)
  }

  return (
    <Dropdown.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <Dropdown.Trigger asChild>
        <Button variant="tertiary" size="sm" className="h-8 w-8 p-0">
          <MoreVertIcon className="h-4 w-4" />
        </Button>
      </Dropdown.Trigger>

      <Dropdown.Content align="end">
        <Dropdown.Item
          onSelect={handleDeleteClick}
          className="p-2 flex items-center hover:bg-(--background-secondary) rounded-lg cursor-pointer text-red-600 hover:text-red-700"
        >
          <Text>Delete</Text>
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

export function ApiKeysTable({ apiKeys, refetchQuery }: ApiKeysTableProps) {
  const [apiKeyToDelete, setApiKeyToDelete] = React.useState<AccessToken | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const handleDeleteClick = React.useCallback((apiKey: AccessToken) => {
    setApiKeyToDelete(apiKey)
    setIsDeleteDialogOpen(true)
  }, [])

  const deleteApiKeyMutation = useServerFormMutation<{ id: string }>({
    method: 'DELETE',
    action: `/auth/api-keys/${apiKeyToDelete?.id}`,
    onSuccess() {
      toast.success(
        `API key "${apiKeyToDelete?.name || 'Untitled'}" has been deleted successfully.`,
      )
      setIsDeleteDialogOpen(false)
      setApiKeyToDelete(null)

      refetchQuery()
    },
    onError() {
      toast.error('Failed to delete API key. Please try again.')
    },
  })

  const handleDeleteConfirm = () => {
    if (apiKeyToDelete) {
      deleteApiKeyMutation.mutate({})
    }
  }

  const columns = React.useMemo(
    () => [
      columnHelper.accessor('name', {
        id: 'name',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Name
          </Text>
        ),
        cell: (info) => <Text>{info.getValue() || 'Untitled'}</Text>,
        meta: {
          style: {
            width: '200px',
            minWidth: '200px',
          },
        },
      }),
      columnHelper.accessor('preview', {
        id: 'token',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Token
          </Text>
        ),
        cell: (info) => (
          <Badge variant="neutral" className="font-mono text-xs">
            {info.getValue()}••••••••••••••••••••
          </Badge>
        ),
        meta: {
          style: {
            width: '150px',
            minWidth: '150px',
          },
        },
      }),
      columnHelper.accessor('capabilities', {
        id: 'permissions',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Permissions
          </Text>
        ),
        cell: (info) => {
          const capabilities = info.getValue()
          const firstCapability = Array.isArray(capabilities)
            ? capabilities[0]
            : capabilities
          return (
            <Text size="sm" className="capitalize">
              {firstCapability || 'None'}
            </Text>
          )
        },
        meta: {
          style: {
            width: '150px',
            minWidth: '150px',
          },
        },
      }),
      columnHelper.accessor('lastUsedAt', {
        id: 'lastUsed',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Last used
          </Text>
        ),
        cell: (info) => {
          const lastUsedAt = info.getValue()
          if (!lastUsedAt) {
            return <Text className="kb-content-tertiary">Never</Text>
          }
          return (
            <Text className="kb-content-tertiary">{dayjs(lastUsedAt).fromNow()}</Text>
          )
        },
        meta: {
          style: {
            width: '150px',
            minWidth: '150px',
          },
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => null,
        cell: (info) => (
          <ApiKeyActionsMenu
            apiKey={info.row.original}
            onDeleteClick={handleDeleteClick}
          />
        ),
        meta: {
          style: {
            width: '60px',
            minWidth: '60px',
          },
        },
      }),
    ],
    [handleDeleteClick],
  )

  const table = useReactTable({
    data: apiKeys,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div className="w-full max-w-[calc(100vw-var(--w-sidebar-width)-64px)] overflow-x-auto block">
        <Table.Root className="min-w-full border-0">
          <Table.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id} className="border-0">
                {headerGroup.headers.map((header) => (
                  <Table.Cell
                    key={header.id}
                    style={header.column.columnDef.meta?.style}
                    className="kb-background-secondary !border-0 !border-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body>
            {table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id} className="border-0">
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    style={cell.column.columnDef.meta?.style}
                    key={cell.id}
                    className="!border-0 !border-none"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>

      {/* Shared Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemName={apiKeyToDelete?.name || 'Untitled'}
        itemType="API key"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteApiKeyMutation.isPending}
      >
        <div />
      </DeleteConfirmationDialog>
    </>
  )
}
