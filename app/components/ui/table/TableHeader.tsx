import React from 'react';
import {
  TableHead,
  TableHeader as ShadcnTableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface TableColumn {
  id: string;
  header: React.ReactNode;
  accessorKey?: string;
  className?: string;
  sortable?: boolean;
}

interface TableHeaderProps {
  columns: TableColumn[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}

/**
 * A reusable table header component
 */
export const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  sortColumn,
  sortDirection,
  onSort,
  className,
}) => {
  const handleSort = (column: TableColumn) => {
    if (column.sortable && onSort) {
      onSort(column.id);
    }
  };

  const getSortIcon = (column: TableColumn) => {
    if (!column.sortable) return null;
    
    if (sortColumn === column.id) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <ShadcnTableHeader className={className}>
      <TableRow>
        {columns.map((column) => (
          <TableHead
            key={column.id}
            className={cn(
              column.className,
              column.sortable && 'cursor-pointer select-none',
            )}
            onClick={() => column.sortable && handleSort(column)}
          >
            <div className="flex items-center">
              {column.header}
              {getSortIcon(column)}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </ShadcnTableHeader>
  );
};

export default TableHeader; 