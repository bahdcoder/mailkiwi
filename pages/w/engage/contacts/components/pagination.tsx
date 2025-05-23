import { FastArrowLeftIcon } from '#root/pages/components/icons/fast-arrow-left.svg.jsx'
import { FastArrowRightIcon } from '#root/pages/components/icons/fast-arrow-right.svg.jsx'
import { NavArrowLeftIcon } from '#root/pages/components/icons/nav-arrow-left.svg.jsx'
import { NavArrowRightIcon } from '#root/pages/components/icons/nav-arrow-right.svg.jsx'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import type { Table } from '@tanstack/react-table'

import type { ContactWithTagsAndProperties } from '#root/database/database_schema_types.js'

import { formatCount } from '#root/pages/utils/number_formatter.js'

export interface PaginationProps {
  table: Table<ContactWithTagsAndProperties>
}

export function Pagination({ table }: PaginationProps) {
  const { pageIndex } = table.getState().pagination

  return (
    <div className="w-full h-8 flex items-center justify-between">
      <Text data-testid="w-contacts-pagination-page-number">
        Page {pageIndex + 1} of {formatCount(table.getPageCount())}
      </Text>

      <div className="flex items-center gap-2">
        <Button
          variant="tertiary"
          onClick={table.firstPage}
          disabled={!table.getCanPreviousPage()}
        >
          <FastArrowLeftIcon />
        </Button>
        <Button
          variant="tertiary"
          onClick={table.previousPage}
          disabled={!table.getCanPreviousPage()}
        >
          <NavArrowLeftIcon />
        </Button>
        <Button
          variant="tertiary"
          onClick={table.nextPage}
          disabled={!table.getCanNextPage()}
        >
          <NavArrowRightIcon />
        </Button>
        <Button
          variant="tertiary"
          onClick={table.lastPage}
          disabled={!table.getCanNextPage()}
        >
          <FastArrowRightIcon />
        </Button>
      </div>
    </div>
  )
}
