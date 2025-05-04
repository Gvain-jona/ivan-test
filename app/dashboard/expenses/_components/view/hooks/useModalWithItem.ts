import { useState } from 'react';

/**
 * Custom hook for managing a modal with an associated item
 * This hook handles the state for opening/closing a modal and selecting/deselecting an item
 */
export function useModalWithItem<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  // Open the modal with an item
  const openModal = (item?: T) => {
    if (item) {
      setSelectedItem(item);
    }
    setIsOpen(true);
  };

  // Close the modal and clear the selected item
  const closeModal = () => {
    setIsOpen(false);
    // Use a timeout to ensure the modal is closed before clearing the item
    // This prevents UI flicker during the closing animation
    setTimeout(() => {
      setSelectedItem(null);
    }, 300);
  };

  return {
    isOpen,
    selectedItem,
    openModal,
    closeModal
  };
}
