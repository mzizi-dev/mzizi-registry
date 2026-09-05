"use client"

import * as React from "react"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef as TanstackColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "@/lib/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ── Table Features (v9 composition API) ─────────────────────────────
// This primitive accepts arbitrary consumer-defined columns, so the full
// built-in filter/sort function registries are registered (rather than
// tree-shaking down to a handful of named functions) — that keeps the
// "auto" resolution v8 used to pick a filter/sort strategy per column's
// value type working for any column a consumer defines.
const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns,
  sortFns,
})

type Features = typeof features

// ── Re-exports for consumers ────────────────────────────────────────
// Keep the public `ColumnDef<TData, TValue>` shape (2 generics) that
// consumers already depend on, bound to this component's fixed feature set —
// v9's ColumnDef itself now takes a `TFeatures` generic first.
export type ColumnDef<TData extends RowData, TValue = unknown> = TanstackColumnDef<
  Features,
  TData,
  TValue
>

// ── DataTable ───────────────────────────────────────────────────────

interface DataTableProps<TData extends RowData, TValue> {
  columns?: ColumnDef<TData, TValue>[]
  data?: TData[]
  /** Column key to use for the search/filter input. Omit to hide the filter. */
  filterColumn?: string
  /** Placeholder text for the filter input */
  filterPlaceholder?: string
  /** Show column visibility toggle dropdown (default true) */
  showColumnToggle?: boolean
  /** Show pagination controls (default true) */
  showPagination?: boolean
  /** Number of rows per page (default 10) */
  pageSize?: number
  className?: string
}

function DataTable<TData extends RowData, TValue>({
  columns = [],
  data = [],
  filterColumn,
  filterPlaceholder = "Filter...",
  showColumnToggle = true,
  showPagination = true,
  pageSize = 10,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useTable({
    features,
    data,
    // `columns` carries the public `ColumnDef<TData, TValue>` shape (a single
    // TValue shared across the array); v9's `useTable` wants each column's own
    // cell-value type reflected against `unknown`, which TS can't verify from
    // that shared-TValue shape. The row model itself is untyped per-cell at
    // render time (flexRender resolves each cell's own context), so this is a
    // type-level mismatch only.
    columns: columns as unknown as TanstackColumnDef<Features, TData, unknown>[],
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize },
    },
  })

  return (
    <div
      data-slot="data-table"
      data-portal="https://mzizi.dev/components/data-table"
      role="table"
      aria-label="Data table"
      className={cn("w-full space-y-4", className)}
    >
      {/* Toolbar */}
      {(filterColumn || showColumnToggle) && (
        <div className="flex items-center gap-2">
          {filterColumn && (
            <Input
              placeholder={filterPlaceholder}
              value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(filterColumn)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          )}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-[var(--radius-xl,17px)] border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DataTableColumnHeader ───────────────────────────────────────────

interface DataTableColumnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
}

function DataTableColumnHeader({ title, className, ...rest }: DataTableColumnHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...rest}>
      {title}
      <ArrowUpDown className="size-4" />
    </div>
  )
}

export { DataTable, DataTableColumnHeader }
