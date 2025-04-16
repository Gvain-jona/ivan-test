"use client"

import * as React from "react"
import { SmartCombobox, SmartComboboxOption } from "./smart-combobox"
import { useDropdownData, EntityType } from "@/hooks/useDropdownData"
import { useDebounce } from "@/hooks/useDebounce"

interface OptimizedSmartComboboxProps {
  entityType: EntityType
  parentId?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  createMessage?: string
  className?: string
  disabled?: boolean
  allowCreate?: boolean
  searchDebounce?: number
  entityName?: string
  skipLoading?: boolean
}

export const OptimizedSmartCombobox = React.memo(function OptimizedSmartCombobox({
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
  searchDebounce = 300,
  entityName,
  skipLoading = false,
}: OptimizedSmartComboboxProps) {
  // Local state for search term
  const [searchTerm, setSearchTerm] = React.useState("");
  
  // Debounce search to avoid too many requests
  const debouncedSearch = useDebounce(searchTerm, searchDebounce);
  
  // Use the dropdown data hook with debounced search
  const { 
    options, 
    isLoading, 
    handleSearch, 
    createOption 
  } = useDropdownData(
    entityType, 
    parentId, 
    debouncedSearch
  );
  
  // Handle search input
  const onSearch = React.useCallback((term: string) => {
    setSearchTerm(term);
    handleSearch(term);
  }, [handleSearch]);
  
  // Handle create option
  const onCreateOption = React.useCallback(async (name: string): Promise<SmartComboboxOption | null> => {
    if (!allowCreate) return null;
    
    const newOption = await createOption(name);
    return newOption;
  }, [allowCreate, createOption]);
  
  return (
    <SmartCombobox
      options={options}
      value={value}
      onChange={onChange}
      onCreateOption={allowCreate ? onCreateOption : undefined}
      placeholder={placeholder || `Select ${entityName || entityType}`}
      emptyMessage={emptyMessage || `No ${entityName || entityType} found`}
      createMessage={createMessage || `Create ${entityName || entityType}`}
      className={className}
      disabled={disabled}
      allowCreate={allowCreate}
      isLoading={!skipLoading && isLoading}
      searchDebounce={searchDebounce}
      onSearch={onSearch}
      entityName={entityName || entityType}
    />
  );
});
