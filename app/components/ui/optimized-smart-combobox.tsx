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

/**
 * @deprecated Use SWRSmartCombobox instead
 */
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
  // Local state for search term and dropdown open state
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  // Debounce search to avoid too many requests
  const debouncedSearch = useDebounce(searchTerm, searchDebounce);

  // Use the dropdown data hook with debounced search and lazy loading
  const {
    options,
    isLoading,
    handleSearch,
    createOption,
    loadOptions
  } = useDropdownData(
    entityType,
    parentId,
    debouncedSearch
  );

  // Handle dropdown open state change
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);

    // When opening the dropdown, load options if needed
    if (open) {
      loadOptions();
    }
  }, [loadOptions]);

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
      onOpenChange={handleOpenChange}
      open={isOpen}
    />
  );
});
