'use client';

import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 48,
  className = '',
  onRowClick
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [parentHeight, setParentHeight] = useState(500);

  // Update parent height on resize
  useEffect(() => {
    if (!parentRef.current) return;

    const updateSize = () => {
      if (parentRef.current) {
        setParentHeight(parentRef.current.offsetHeight);
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    const currentRef = parentRef.current;
    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, []);

  // Create virtualizer
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className={`h-[500px] overflow-auto border rounded-md ${className}`}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-900 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="text-left p-3 text-sm font-medium text-gray-400 border-b border-gray-800"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            <td colSpan={columns.length} className="p-0">
              <div className="relative">
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = data[virtualRow.index];
                  return (
                    <tr
                      key={virtualRow.index}
                      className={`absolute top-0 left-0 w-full ${
                        onRowClick ? 'cursor-pointer hover:bg-gray-800/50' : ''
                      }`}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((column, columnIndex) => (
                        <td
                          key={columnIndex}
                          className="p-3 text-sm border-b border-gray-800"
                        >
                          {column.cell
                            ? column.cell(item)
                            : (item[column.accessorKey] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
