'use client';

import * as React from 'react';
import { SmartCombobox, SmartComboboxOption } from './smart-combobox';
import * as useData from '@/hooks/loading';
import { toast } from '@/components/ui/use-toast';

// Define the entity types
export type EntityType = 'clients' | 'categories' | 'items' | 'sizes' | 'suppliers';

interface EnhancedSWRSmartComboboxProps {
  entityType: EntityType;
  parentId?: string;
  value: string;
  onChange: (value: string, option?: SmartComboboxOption) => void;
  placeholder?: string;
  emptyMessage?: string;
  createMessage?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  entityName?: string;
  searchDebounce?: number;
}

/**
 * An enhanced version of SWRSmartCombobox that passes the selected option to the onChange callback
 */
export function EnhancedSWRSmartCombobox({
  entityType,
  parentId,
  value,
  onChange,
  placeholder,
  emptyMessage,
  createMessage,
  className,
  disabled = false,
  allowCreate = true,
  entityName,
  searchDebounce = 300,
}: EnhancedSWRSmartComboboxProps) {
  // State for search term
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Get the appropriate hook based on entity type
  const { options, isLoading, mutate } = useDropdownData(entityType, parentId);
  
  // Handle search
  const handleSearch = React.useCallback((term: string) => {
    setSearchTerm(term);
    // We could implement server-side search here if needed
  }, []);
  
  // Enhanced onChange handler that passes the selected option
  const handleChange = React.useCallback((value: string) => {
    // Find the selected option
    const selectedOption = options.find(option => option.value === value);
    
    // Call the onChange callback with the value and option
    onChange(value, selectedOption);
  }, [onChange, options]);
  
  // Handle option creation
  const handleCreateOption = React.useCallback(async (label: string) => {
    try {
      // Call the API to create a new option
      const response = await fetch(`/api/dropdown/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          label, 
          parentId 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create ${entityType}`);
      }
      
      const newOption = await response.json();
      
      // Update the cache with the new option
      mutate([newOption, ...options], false);
      
      // Show success toast
      toast({
        title: 'Success',
        description: `${entityName || entityType} created successfully`,
      });
      
      // Return the new option
      return newOption;
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: `Failed to create ${entityName || entityType}`,
        variant: 'destructive',
      });
      
      return null;
    }
  }, [entityType, parentId, mutate, options, entityName, toast]);
  
  return (
    <SmartCombobox
      options={options}
      value={value}
      onChange={handleChange}
      onCreateOption={allowCreate ? handleCreateOption : undefined}
      placeholder={placeholder || `Select ${entityName || entityType}`}
      emptyMessage={emptyMessage || `No ${entityName || entityType} found`}
      createMessage={createMessage || `Create ${entityName || entityType}`}
      className={className}
      disabled={disabled}
      allowCreate={allowCreate}
      isLoading={isLoading}
      onSearch={handleSearch}
      searchDebounce={searchDebounce}
      entityName={entityName || entityType}
    />
  );
}

/**
 * Helper function to get the appropriate hook based on entity type
 */
function useDropdownData(entityType: EntityType, parentId?: string) {
  // Use the appropriate hook based on entity type
  switch (entityType) {
    case 'clients':
      return useData.useDropdownClients();
    case 'categories':
      return useData.useDropdownCategories();
    case 'items':
      return useData.useDropdownItems(parentId);
    case 'sizes':
      return useData.useDropdownSizes();
    case 'suppliers':
      return useData.useDropdownSuppliers();
    default:
      // Default to clients if unknown entity type
      return { options: [], isLoading: false, mutate: async () => {} };
  }
}
