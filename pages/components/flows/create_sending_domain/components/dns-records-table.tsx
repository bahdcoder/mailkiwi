import { useCallback } from 'react'
import { Badge } from '@kibamail/owly/badge'
import { Text } from '@kibamail/owly/text'
import { Button } from '@kibamail/owly/button'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'
import * as Table from '#root/pages/w/engage/contacts/components/table.jsx'
import { CopyIcon } from '#root/pages/components/icons/copy.svg.jsx'
import { toast } from 'sonner'
import { $trycatch } from '@tszen/trycatch'

export interface DnsRecord {
  type: string
  hostname: string
  value: string
  verified: boolean
}

interface DnsRecordsTableProps {
  records: DnsRecord[]
  title: string
}

const columnHelper = createColumnHelper<DnsRecord>()

export function DnsRecordsTable({ records }: DnsRecordsTableProps) {
  const copyToClipboard = useCallback(async (value: string) => {
    const [, error] = await $trycatch(() => navigator.clipboard.writeText(value))

    if (error) {
      toast.error('Failed to copy to clipboard. Please try copying it manually.')

      return
    }

    toast.success('Copied dns record value to clipboard.')
  }, [])

  const columns = React.useMemo(
    () => [
      columnHelper.accessor('type', {
        id: 'type',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Type
          </Text>
        ),
        cell: (info) => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            {info.getValue()}
          </Text>
        ),
        meta: {
          style: {
            width: '100px',
            minWidth: '100px',
          },
        },
      }),
      columnHelper.accessor('hostname', {
        id: 'hostname',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Host name
          </Text>
        ),
        cell: (info) => (
          <Button
            variant="tertiary"
            className="flex !items-start gap-2 cursor-pointer hover:bg-(--background-secondary) p-1 rounded text-left"
            onClick={() => copyToClipboard(info.getValue())}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                copyToClipboard(info.getValue())
              }
            }}
            aria-label={`Copy hostname: ${info.getValue()}`}
          >
            <CopyIcon className="w-4 h-4 kb-content-tertiary flex-shrink-0 mt-0.5" />
            <Text className="!font-mono text-sm break-all kb-content-tertiary">
              {info.getValue()}
            </Text>
          </Button>
        ),
        meta: {
          style: {
            width: '250px',
            minWidth: '250px',
          },
        },
      }),
      columnHelper.accessor('value', {
        id: 'value',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Value
          </Text>
        ),
        cell: (info) => (
          <Button
            variant="tertiary"
            className="flex !items-start gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-left"
            onClick={() => copyToClipboard(info.getValue())}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                copyToClipboard(info.getValue())
              }
            }}
            aria-label={`Copy hostname value: ${info.getValue()}`}
          >
            <CopyIcon className="w-4 h-4 kb-content-tertiary flex-shrink-0 mt-0.5" />
            <Text className="!font-mono text-sm break-all kb-content-tertiary">
              {info.getValue()}
            </Text>
          </Button>
        ),
        meta: {
          style: {
            width: '300px',
            minWidth: '300px',
          },
        },
      }),
      columnHelper.accessor('verified', {
        id: 'status',
        header: () => (
          <Text size="sm" className="font-medium uppercase kb-content-tertiary">
            Status
          </Text>
        ),
        cell: (info) => {
          const verified = info.getValue()
          return (
            <Badge variant={verified ? 'success' : 'warning'} size="sm">
              {verified ? 'Verified' : 'Pending'}
            </Badge>
          )
        },
        meta: {
          style: {
            width: '90px',
          },
        },
      }),
    ],
    [copyToClipboard],
  )

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table.Root className="w-full border-0">
      <Table.Header>
        {table.getHeaderGroups().map((headerGroup) => (
          <Table.Row
            key={headerGroup.id}
            className="border-0 border-b border-(--background-secondary)"
          >
            {headerGroup.headers.map((header) => (
              <Table.Cell
                key={header.id}
                style={header.column.columnDef.meta?.style}
                className={`!border-0 !border-none !bg-transparent !px-0 align-top ${header.id === 'status' ? 'text-right' : ''}`}
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
        {table.getRowModel().rows.map((row, index) => (
          <Table.Row
            key={row.id}
            className={`border-0 ${index === table.getRowModel().rows.length - 1 ? 'border-b border-(--background-secondary)' : ''}`}
          >
            {row.getVisibleCells().map((cell) => (
              <Table.Cell
                style={cell.column.columnDef.meta?.style}
                key={cell.id}
                className={`!border-0 !border-none !bg-transparent !px-0 align-top ${cell.column.id === 'status' ? 'text-right' : ''}`}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
