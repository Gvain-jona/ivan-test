import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  totalCount?: number; // For backward compatibility
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  isLoading?: boolean; // Add loading state
}

/**
 * A reusable table pagination component
 */
export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize = 10,
  totalItems,
  totalCount, // For backward compatibility
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50, 100],
  className,
  isLoading = false,
}) => {
  // Use totalCount for backward compatibility with enhanced error checking
  const total = totalItems || totalCount || 0;

  // Pagination validation (debug logs removed)

  const handlePageSizeChange = (value: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(value));
    }
  };

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  // Calculate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are fewer than maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      // Add ellipsis if needed at the beginning
      if (start > 2) {
        pages.push('...');
      }

      // Add visible page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed at the end
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-6 text-sm">
        {/* Show pagination info with better handling of edge cases */}
        <div className="text-sm text-white">
          {total > 0 ? (
            <>
              <span className="text-muted-foreground">Showing </span>
              <span className="font-medium">{startItem}</span>
              <span className="text-muted-foreground"> to </span>
              <span className="font-medium">{endItem}</span>
              <span className="text-muted-foreground"> of </span>
              <span className="font-medium">{total}</span>
              <span className="text-muted-foreground"> items</span>
            </>
          ) : isLoading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : (
            <span className="text-muted-foreground">No items</span>
          )}
        </div>
        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px] bg-muted/20 border-border hover:bg-muted/30">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-foreground hover:bg-muted/20">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          className={`h-8 w-8 p-0 bg-muted/20 border-border hover:bg-muted/30 disabled:opacity-50 ${isLoading ? 'cursor-not-allowed' : ''}`}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className={`h-8 w-8 p-0 bg-muted/20 border-border hover:bg-muted/30 disabled:opacity-50 ${isLoading ? 'cursor-not-allowed' : ''}`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={`h-8 w-8 p-0 ${currentPage === page
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted/20 border-border hover:bg-muted/30'} ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {isLoading && currentPage === page ? (
                  <span className="animate-pulse">•</span>
                ) : (
                  page
                )}
              </Button>
            ) : (
              <span key={index} className="px-1 text-muted-foreground">...</span>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className={`h-8 w-8 p-0 bg-muted/20 border-border hover:bg-muted/30 disabled:opacity-50 ${isLoading ? 'cursor-not-allowed' : ''}`}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || isLoading}
          className={`h-8 w-8 p-0 bg-muted/20 border-border hover:bg-muted/30 disabled:opacity-50 ${isLoading ? 'cursor-not-allowed' : ''}`}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;
