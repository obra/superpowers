import * as React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
  TableLoading,
} from './Table';

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
};

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyState,
  headerContent,
}: DataTableProps<T>) {
  const colSpan = columns.length;

  return (
    <Table>
      <TableHead>
        <tr>
          {headerContent ? (
            <TableHeaderCell colSpan={colSpan}>{headerContent}</TableHeaderCell>
          ) : (
            columns.map((column) => (
              <TableHeaderCell
                key={column.id}
                className={column.headerClassName}
              >
                {column.header}
              </TableHeaderCell>
            ))
          )}
        </tr>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableLoading colSpan={colSpan} />
        ) : data.length === 0 ? (
          <TableEmpty colSpan={colSpan}>{emptyState || 'No data'}</TableEmpty>
        ) : (
          data.map((row) => {
            const key = keyExtractor(row);
            const handleClick = onRowClick ? () => onRowClick(row) : undefined;
            const handleKeyDown = onRowClick
              ? (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }
              : undefined;

            return (
              <TableRow
                key={key}
                clickable={!!onRowClick}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.accessor(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
