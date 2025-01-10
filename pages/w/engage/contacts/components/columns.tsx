import { LabelIcon } from "@/pages/components/icons/label.svg.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { Button } from "@kibamail/owly/button"
import { Checkbox } from "@kibamail/owly/checkbox"
import { Text } from "@kibamail/owly/text"
import { Column, type RowData, createColumnHelper } from "@tanstack/react-table"
import cn from "classnames"
import * as React from "react"

import { ContactWithTagsAndProperties } from "@/database/database_schema_types.js"

export const columnHelper = createColumnHelper<ContactWithTagsAndProperties>()

export function getCommonPinningStyles(
  column: Column<ContactWithTagsAndProperties>,
): React.CSSProperties {
  const isPinned = column.getIsPinned()

  return {
    boxShadow: isPinned ? "-4px 0 4px -4px var(--border-tertiary) inset" : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    header?: {
      className?: string
    }
    cell?: {
      className?: string
    }
    style?: React.CSSProperties
  }
}

export const columns = [
  columnHelper.accessor("email", {
    cell: function (info) {
      function onCheckboxChange(state: boolean | "indeterminate") {
        info.row.getToggleSelectedHandler()({
          target: {
            checked: state === true,
          },
        })
      }

      return (
        <div className="flex items-center gap-2">
          <Checkbox
            size="sm"
            onCheckedChange={onCheckboxChange}
            checked={info.row.getIsSelected()}
            disabled={!info.row.getCanSelect()}
          />
          <Text>{info.getValue()}</Text>
        </div>
      )
    },
    footer: (info) => info.column.id,
    header: function ({ table }) {
      function onCheckboxChange(state: boolean | "indeterminate") {
        table.getToggleAllRowsSelectedHandler()({
          target: {
            checked: state === true,
          },
        })
      }

      return (
        <div className="flex items-center gap-2">
          <Checkbox
            size="sm"
            onCheckedChange={onCheckboxChange}
            checked={
              table.getIsSomeRowsSelected()
                ? "indeterminate"
                : table.getIsAllRowsSelected()
            }
          />
          <Text>Email</Text>
        </div>
      )
    },
    meta: {
      style: {
        width: "268px",
        minWidth: "268px",
      },
    },
  }),

  columnHelper.accessor("tags", {
    cell: function (info) {
      const tags = info.getValue()
      return (
        <div className="w-full flex items-center gap-2 overflow-x-auto h-full">
          {info.getValue().length === 0 ? (
            <Text className="kb-content-tertiary">No tags</Text>
          ) : (
            tags.map((tag, idx) => (
              <Button
                asChild
                variant="secondary"
                className={cn("flex-shrink-0 pointer-events-none", {
                  "mr-4": idx === tags.length - 1,
                })}
                size="sm"
                key={tag.id}
              >
                <span>{tag.name}</span>
              </Button>
            ))
          )}
        </div>
      )
    },
    footer: (info) => info.column.id,
    header: function () {
      return (
        <div className="flex items-center justify-between">
          <div className="flex gap-1 items-center">
            <LabelIcon className="kb-content-tertiary" />
            <Text>Tags</Text>
          </div>

          <Button variant="tertiary" size="sm">
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
      )
    },
    meta: {
      header: {
        className: "!bg-[var(--background-hover)]",
      },
      cell: {
        className: "!bg-[var(--background-hover)] pr-0",
      },
      style: {
        width: "320px",
      },
    },
  }),

  columnHelper.accessor("firstName", {
    cell: (info) => <Text className="capitalize">{info.getValue()}</Text>,
    footer: (info) => info.column.id,
    header: function () {
      return <Text>First name</Text>
    },
    meta: {
      style: {
        minWidth: 160,
      },
    },
  }),
  columnHelper.accessor((row) => row.lastName, {
    id: "lastName",
    cell: (info) => <Text className="capitalize">{info.getValue()}</Text>,
    footer: (info) => info.column.id,
    header: function () {
      return <Text>Last name</Text>
    },
    meta: {
      style: {
        minWidth: 160,
      },
    },
  }),
  // columnHelper.accessor("age", {
  //   cell: (info) => <Text>{info.getValue()}</Text>,
  //   footer: (info) => info.column.id,
  //   header: function () {
  //     return <Text>Age</Text>
  //   },
  //   meta: {
  //     style: {
  //       minWidth: 160,
  //     },
  //   },
  // }),
  // columnHelper.accessor("visits", {
  //   cell: (info) => <Text>{info.getValue()}</Text>,
  //   footer: (info) => info.column.id,
  //   header: function () {
  //     return <Text>Visits</Text>
  //   },
  //   meta: {
  //     style: {
  //       minWidth: 160,
  //     },
  //   },
  // }),
  // columnHelper.accessor("status", {
  //   cell: (info) => <Text>{info.getValue()}</Text>,
  //   footer: (info) => info.column.id,
  //   header: function () {
  //     return <Text>Status</Text>
  //   },
  //   meta: {
  //     style: {
  //       minWidth: 160,
  //     },
  //   },
  // }),
  // columnHelper.accessor("progress", {
  //   cell: (info) => <Text>{info.getValue()}</Text>,
  //   footer: (info) => info.column.id,
  //   header: function () {
  //     return <Text>Profile Progress</Text>
  //   },
  //   meta: {
  //     style: {
  //       minWidth: 160,
  //     },
  //     header: {
  //       className: "!border-r-0",
  //     },
  //     cell: {
  //       className: "!border-r-0",
  //     },
  //   },
  // }),
]
