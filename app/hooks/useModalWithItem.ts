import { useState, useCallback } from 'react';

/**
 * Custom hook for managing a modal with an associated item
 * Useful for edit/view modals that need to track which item is being edited/viewed
 */
export function useModalWithItem<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openModal = useCallback((item: T) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear the selected item after a short delay to prevent UI flicker
    setTimeout(() => {
      setSelectedItem(null);
    }, 300);
  }, []);

  return {
    isOpen,
    selectedItem,
    openModal,
    closeModal
  };
}
