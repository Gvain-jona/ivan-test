/**
 * Utility functions for managing form data in localStorage
 */

/**
 * Clear all form data from localStorage for a specific form type
 * @param formType The type of form (e.g., 'item', 'payment', 'note')
 */
export function clearFormStorage(formType: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    const formPrefix = `${formType}-form-`;
    
    keys.forEach(key => {
      if (key.startsWith(formPrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log(`Cleared all ${formType} form data from localStorage`);
  } catch (error) {
    console.error(`Error clearing ${formType} form data:`, error);
  }
}

/**
 * Clear all order form data from localStorage
 * This includes items, payments, and notes
 */
export function clearAllOrderFormData(): void {
  clearFormStorage('item');
  clearFormStorage('payment');
  clearFormStorage('note');
  console.log('Cleared all order form data from localStorage');
}
