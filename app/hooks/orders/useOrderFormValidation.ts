import { useCallback } from 'react';
import { Order } from '@/types/orders';
import { orderSchema } from '@/schemas/order-schema';

interface UseOrderFormValidationParams {
  order: Partial<Order>;
  isMountedRef: React.MutableRefObject<boolean>;
  safeSetFormStatus: (status: 'idle' | 'validating' | 'saving' | 'success' | 'error') => void;
  safeSetValidationErrors: (errors: Record<string, string[]>) => void;
  safeSetActiveTab: (tab: string) => void;
  showError: (message: string, title?: string) => void;
}

export function useOrderFormValidation({
  order,
  isMountedRef,
  safeSetFormStatus,
  safeSetValidationErrors,
  safeSetActiveTab,
  showError,
}: UseOrderFormValidationParams): { validateForm: () => boolean } {
  const validateForm = useCallback(() => {
    if (!isMountedRef.current) return false;

    safeSetFormStatus('validating');

    try {
      const result = orderSchema.safeParse(order);

      if (!result.success) {
        const formattedErrors: Record<string, string[]> = {};
        const errorSections: Record<string, boolean> = {
          'general-info': false,
          'items': false,
          'payments': false,
          'notes': false
        };

        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(error.message);

          if (['client_id', 'date', 'client_type', 'status'].includes(String(error.path[0]))) {
            errorSections['general-info'] = true;
          } else if (error.path[0] === 'items') {
            errorSections['items'] = true;
          } else if (error.path[0] === 'payments') {
            errorSections['payments'] = true;
          } else if (error.path[0] === 'notes') {
            errorSections['notes'] = true;
          }
        });

        if (isMountedRef.current) {
          safeSetValidationErrors(formattedErrors);

          for (const section of ['general-info', 'items', 'payments', 'notes']) {
            if (errorSections[section]) {
              safeSetActiveTab(section);
              break;
            }
          }

          safeSetFormStatus('error');

          const errorSectionNames = Object.entries(errorSections)
            .filter(([, hasError]) => hasError)
            .map(([section]) => {
              switch (section) {
                case 'general-info': return 'General Info';
                case 'items': return 'Items';
                case 'payments': return 'Payments';
                case 'notes': return 'Notes';
                default: return section;
              }
            });

          showError(
            `Please fix the highlighted errors in: ${errorSectionNames.join(', ')}`,
            'Validation Error'
          );
        }

        return false;
      }

      if (isMountedRef.current) {
        safeSetValidationErrors({});
        safeSetFormStatus('idle');
      }
      return true;
    } catch (error) {
      console.error('Validation error:', error);

      if (isMountedRef.current) {
        safeSetFormStatus('error');
        showError('An unexpected error occurred during validation.', 'Validation Error');
      }

      return false;
    }
  }, [order, isMountedRef, safeSetFormStatus, safeSetValidationErrors, safeSetActiveTab, showError]);

  return { validateForm };
}
