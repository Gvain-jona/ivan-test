"use client"

import * as React from "react"
import { SmartCombobox, SmartComboboxOption } from "./smart-combobox"
import { useDropdownCache } from "@/hooks/useDropdownCache"
import { EntityType, createDropdownOption } from "../../actions/options"

interface CachedSmartComboboxProps {
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
}

/**
 * @deprecated Use SWRSmartCombobox instead
 */
export function CachedSmartCombobox({
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
  searchDebounce,
  entityName,
}: CachedSmartComboboxProps) {
  // Use the dropdown cache hook
  const { options, isLoading, addOption } = useDropdownCache(entityType, parentId);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Handle search
  const handleSearch = React.useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Handle create option
  const handleCreateOption = React.useCallback(async (name: string): Promise<SmartComboboxOption | null> => {
    try {
      const { option, error } = await createDropdownOption({
        entityType,
        name,
        parentId
      });

      if (error) {
        console.error(`Error creating ${entityType}:`, error);
        return null;
      }

      if (option) {
        // Add the new option to the cache
        addOption(option);
        return option;
      }

      return null;
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      return null;
    }
  }, [entityType, parentId, addOption]);

  return (
    <SmartCombobox
      options={options}
      value={value}
      onChange={onChange}
      onCreateOption={allowCreate ? handleCreateOption : undefined}
      placeholder={placeholder || `Select ${entityType}`}
      emptyMessage={emptyMessage || `No ${entityType} found`}
      createMessage={createMessage || `Create ${entityType}`}
      className={className}
      disabled={disabled}
      allowCreate={allowCreate}
      isLoading={isLoading}
      searchDebounce={searchDebounce}
      onSearch={handleSearch}
      entityName={entityName || entityType}
    />
  );
}
