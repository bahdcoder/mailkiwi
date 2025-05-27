import type { FilterCondition } from '#root/pages/w/engage/contacts/components/filters.jsx'
import type { Table } from '@tanstack/react-table'
import type React from 'react'

import type { ContactWithTagsAndProperties } from '#root/database/database_schema_types.js'

export function useFilterOperations({
  setFilters,
  setDeletedFilters,
  table,
}: {
  setFilters: React.Dispatch<React.SetStateAction<FilterCondition[]>>
  table: Table<ContactWithTagsAndProperties>
  setDeletedFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  function onFiltersChange(filters: FilterCondition[]) {
    setFilters((current) =>
      filters.map((filter) => {
        const existing = current.find(
          (currentFilter) => currentFilter.field === filter.field,
        )

        return { ...existing, ...filter }
      }),
    )

    table.resetPageIndex()
  }

  function removeFilter(filter: FilterCondition) {
    setDeletedFilters((current) => ({ ...current, [filter.id]: true }))
  }

  function updateFilterOperation(
    filter: FilterCondition,
    operation: FilterCondition['operation'],
  ) {
    setFilters((current) =>
      current.map((f) => (f.id === filter.id ? { ...f, operation } : f)),
    )
  }

  function updateFilterValue(filter: FilterCondition, value: FilterCondition['value']) {
    setFilters((current) =>
      current.map((f) => (f.id === filter.id ? { ...f, value } : f)),
    )
  }

  return {
    onFiltersChange,
    removeFilter,
    updateFilterOperation,
    updateFilterValue,
  }
}
