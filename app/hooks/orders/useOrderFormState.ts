import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { OrderItem, OrderNote, OrderPayment } from '@/types/orders';
import { DeletionType } from '@/components/ui/approval-dialog';

export interface OrderFormState {
  itemToDelete: {
    id: string;
    index: number;
    name: string;
    type: DeletionType;
  } | null;
  setItemToDelete: React.Dispatch<React.SetStateAction<{
    id: string;
    index: number;
    name: string;
    type: DeletionType;
  } | null>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  validationErrors: Record<string, string[]>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  formStatus: 'idle' | 'validating' | 'saving' | 'success' | 'error';
  setFormStatus: React.Dispatch<React.SetStateAction<'idle' | 'validating' | 'saving' | 'success' | 'error'>>;
  isMountedRef: React.MutableRefObject<boolean>;
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  formIds: { itemForms: number[]; noteForms: number[]; paymentForms: number[] };
  setFormIds: React.Dispatch<React.SetStateAction<{ itemForms: number[]; noteForms: number[]; paymentForms: number[] }>>;
  formIdCounters: { items: number; payments: number; notes: number };
  setFormIdCounters: React.Dispatch<React.SetStateAction<{ items: number; payments: number; notes: number }>>;
  partialDataRef: React.MutableRefObject<{
    items: Record<number, Partial<OrderItem>>;
    payments: Record<number, Partial<OrderPayment>>;
    notes: Record<number, Partial<OrderNote>>;
  }>;
  safeSetFormStatus: (status: 'idle' | 'validating' | 'saving' | 'success' | 'error') => void;
  safeSetIsSaving: (saving: boolean) => void;
  safeSetValidationErrors: (errors: Record<string, string[]>) => void;
  formState: {
    itemForms: number[];
    noteForms: number[];
    paymentForms: number[];
    formIdCounters: { items: number; payments: number; notes: number };
    partialData: {
      items: Record<number, Partial<OrderItem>>;
      payments: Record<number, Partial<OrderPayment>>;
      notes: Record<number, Partial<OrderNote>>;
    };
  };
}

export function useOrderFormState(): OrderFormState {
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    index: number;
    name: string;
    type: DeletionType;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<string>('general-info');
  const [formStatus, setFormStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');

  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formIds, setFormIds] = useState({
    itemForms: [0],
    noteForms: [0],
    paymentForms: [0]
  });

  const [formIdCounters, setFormIdCounters] = useState({
    items: 1,
    payments: 1,
    notes: 1
  });

  const partialDataRef = useRef<{
    items: Record<number, Partial<OrderItem>>;
    payments: Record<number, Partial<OrderPayment>>;
    notes: Record<number, Partial<OrderNote>>;
  }>({
    items: {},
    payments: {},
    notes: {}
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const safeSetFormStatus = useCallback(
    (status: 'idle' | 'validating' | 'saving' | 'success' | 'error') => {
      if (isMountedRef.current) {
        setFormStatus(status);
      }
    },
    []
  );

  const safeSetIsSaving = useCallback((saving: boolean) => {
    if (isMountedRef.current) {
      setIsSaving(saving);
    }
  }, []);

  const safeSetValidationErrors = useCallback((errors: Record<string, string[]>) => {
    if (isMountedRef.current) {
      setValidationErrors(errors);
    }
  }, []);

  const formState = useMemo(
    () => ({
      itemForms: formIds.itemForms,
      noteForms: formIds.noteForms,
      paymentForms: formIds.paymentForms,
      formIdCounters,
      partialData: partialDataRef.current
    }),
    [formIds, formIdCounters]
  );

  return {
    itemToDelete,
    setItemToDelete,
    isSaving,
    setIsSaving,
    validationErrors,
    setValidationErrors,
    activeTab,
    setActiveTab,
    formStatus,
    setFormStatus,
    isMountedRef,
    timeoutRef,
    formIds,
    setFormIds,
    formIdCounters,
    setFormIdCounters,
    partialDataRef,
    safeSetFormStatus,
    safeSetIsSaving,
    safeSetValidationErrors,
    formState,
  };
}
