import cn from 'classnames'
import React from 'react'

export interface TableProps extends React.ElementRef<'table'> {}

export const Table = React.forwardRef<TableProps, React.ComponentProps<'table'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <table ref={ref} {...props} className={cn('kb-table', className)}>
        {children}
      </table>
    )
  },
)

Table.displayName = 'Table'

export interface TableHeaderProps extends React.ElementRef<'thead'> {}

export const TableHeader = React.forwardRef<
  TableHeaderProps,
  React.ComponentProps<'thead'>
>(({ children, className, ...props }, ref) => {
  return (
    <thead ref={ref} {...props} className={cn('kb-table-header', className)}>
      {children}
    </thead>
  )
})

TableHeader.displayName = 'TableHeader'

export interface TableBodyProps extends React.ElementRef<'tbody'> {}
export const TableBody = React.forwardRef<TableBodyProps, React.ComponentProps<'tbody'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <tbody ref={ref} {...props} className={cn('kb-table-body', className)}>
        {children}
      </tbody>
    )
  },
)

TableBody.displayName = 'TableBody'

export interface TableRowProps extends React.ElementRef<'tr'> {}
export const TableRow = React.forwardRef<TableRowProps, React.ComponentProps<'tr'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <tr ref={ref} {...props} className={cn('kb-table-row', className)}>
        {children}
      </tr>
    )
  },
)

TableRow.displayName = 'TableRow'

export interface TableCellProps extends React.ElementRef<'td'> {}
export const TableCell = React.forwardRef<TableCellProps, React.ComponentProps<'td'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        {...props}
        className={cn(
          'kb-table-cell',
          'px-4 h-12 box-border border-b border-r kb-border-tertiary bg-(--background-secondary)',
          className,
        )}
      >
        {children}
      </td>
    )
  },
)

TableCell.displayName = 'TableCell'

export {
  Table as Root,
  TableHeader as Header,
  TableBody as Body,
  TableRow as Row,
  TableCell as Cell,
}
