'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: string;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
}

export function SideDrawer({
  isOpen,
  onClose,
  position = 'right',
  width = '400px',
  children,
  title,
  showCloseButton = true,
}: SideDrawerProps) {
  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    // Prevent scrolling when drawer is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle click outside to close drawer
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleBackdropClick}
      >
        {/* Drawer */}
        <div
          className={cn(
            'fixed top-0 bottom-0 bg-background border-l border-border/40 shadow-lg transition-transform duration-300 ease-in-out z-50 flex flex-col',
            position === 'right' ? 'right-0' : 'left-0',
            isOpen
              ? 'translate-x-0'
              : position === 'right'
              ? 'translate-x-full'
              : '-translate-x-full'
          )}
          style={{ width }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              {title && <h2 className="text-xl font-semibold">{title}</h2>}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
