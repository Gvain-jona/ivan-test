import { useState, useCallback } from 'react';

interface UseModalStateProps {
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

/**
 * Custom hook for managing modal state
 */
export const useModalState = ({
  initialOpen = false,
  onOpenChange,
}: UseModalStateProps = {}): UseModalStateReturn => {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  
  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  }, [onOpenChange]);
  
  const open = useCallback(() => {
    setOpen(true);
  }, [setOpen]);
  
  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  
  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
  };
};

export default useModalState; 