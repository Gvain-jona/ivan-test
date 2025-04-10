import { useState, useCallback, useMemo } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  paginate: <T>(items: T[]) => T[];
  pageNumbers: number[];
}

/**
 * Custom hook for managing pagination state
 */
export const usePagination = ({
  initialPage = 1,
  initialPageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
}: UsePaginationProps = {}): UsePaginationReturn => {
  const [page, setPageState] = useState<number>(initialPage);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  
  // Calculate total pages based on total items and page size
  const totalPages = useMemo(() => {
    return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
  }, [totalItems, pageSize]);
  
  // Set page with boundary checking
  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPageState(validPage);
    
    if (onPageChange) {
      onPageChange(validPage);
    }
  }, [totalPages, onPageChange]);
  
  // Set page size
  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize);
    
    // Adjust current page if it would now be out of bounds
    const newTotalPages = Math.ceil(totalItems / newPageSize);
    if (page > newTotalPages) {
      setPage(newTotalPages);
    }
    
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  }, [page, totalItems, setPage, onPageSizeChange]);
  
  // Navigation functions
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);
  
  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);
  
  const firstPage = useCallback(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [page, setPage]);
  
  const lastPage = useCallback(() => {
    if (page !== totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);
  
  // Calculate indices
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
  
  // Paginate an array of items
  const paginate = useCallback(<T>(items: T[]): T[] => {
    return items.slice(startIndex, startIndex + pageSize);
  }, [startIndex, pageSize]);
  
  // Generate array of page numbers
  const pageNumbers = useMemo(() => {
    const MAX_VISIBLE_PAGES = 5;
    const pages: number[] = [];
    
    if (totalPages <= MAX_VISIBLE_PAGES) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with current page in the middle
      let start = Math.max(1, page - Math.floor(MAX_VISIBLE_PAGES / 2));
      let end = Math.min(start + MAX_VISIBLE_PAGES - 1, totalPages);
      
      // Adjust start if we're near the end
      if (end === totalPages) {
        start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [page, totalPages]);
  
  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    paginate,
    pageNumbers,
  };
};

export default usePagination; 