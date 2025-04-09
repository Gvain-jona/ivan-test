import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { tablePaginationVariant, buttonHover } from '@/utils/animation-variants';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Reusable pagination component for tables
 * Includes animations and responsive design
 */
const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  className
}) => {
  // Generate pagination range with dots for ellipsis
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    
    if (currentPage > delta + 1) {
      rangeWithDots.push(1);
    }
    
    if (currentPage > delta + 2) {
      rangeWithDots.push('dots1');
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage < totalPages - delta - 1) {
      rangeWithDots.push('dots2');
    }
    
    if (totalPages > 1 && currentPage < totalPages - delta) {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <motion.div 
      key={`pagination-${currentPage}`}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={tablePaginationVariant}
      className={cn("px-4 py-3 border-t border-table-border sm:px-6", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="border-table-border bg-transparent text-table-header hover:bg-table-hover hover:text-white disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="ml-3 border-table-border bg-transparent text-table-header hover:bg-table-hover hover:text-white disabled:opacity-50"
          >
            Next
          </Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-table-header">
              Showing <span className="font-medium text-white">{(currentPage - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium text-white">
                {Math.min(currentPage * 10, totalCount)}
              </span>{' '}
              of <span className="font-medium text-white">{totalCount}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-table-border bg-transparent text-table-header hover:bg-table-hover hover:text-white disabled:opacity-50 rounded-l-md"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </motion.div>
              
              <AnimatePresence mode="wait">
                {getPaginationRange().map((page, index) => (
                  page === 'dots1' || page === 'dots2' ? (
                    <span
                      key={`dots-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-table-border bg-transparent text-sm font-medium text-table-header"
                    >
                      ...
                    </span>
                  ) : (
                    <motion.div
                      key={`page-${page}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => onPageChange(Number(page))}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "border-table-border bg-transparent text-table-header hover:bg-table-hover hover:text-white",
                          currentPage === page && "bg-brand text-white hover:bg-brand/90 border-brand"
                        )}
                      >
                        {page}
                      </Button>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-table-border bg-transparent text-table-header hover:bg-table-hover hover:text-white disabled:opacity-50 rounded-r-md"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </nav>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TablePagination; 