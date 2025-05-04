import { useState } from 'react';
import { toast } from 'sonner';

interface UseModalOperationsProps<T, R> {
  onOperation: (item: T) => Promise<R>;
  onSuccess?: (result: R) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Custom hook for handling modal operations with loading state and error handling
 */
export function useModalOperations<T, R>({
  onOperation,
  onSuccess,
  successMessage = 'Operation completed successfully',
  errorMessage = 'Operation failed'
}: UseModalOperationsProps<T, R>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOperation = async (item: T) => {
    try {
      setIsSubmitting(true);
      
      // Perform the operation
      const result = await onOperation(item);
      
      // Show success message
      if (successMessage) {
        toast.success(successMessage);
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('Error in operation:', error);
      
      // Show error message
      toast.error(
        error instanceof Error 
          ? error.message 
          : errorMessage
      );
      
      // Re-throw the error to allow the caller to handle it
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleOperation
  };
}
