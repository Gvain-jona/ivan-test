"use client"

import * as React from "react"
import { SmartCombobox, SmartComboboxOption } from "./smart-combobox"
import { EntityType, fetchDropdownOptions, createDropdownOption } from "../../actions/options"

interface GlobalSmartComboboxProps {
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
  entityName?: string
  searchDebounce?: number
}

export function GlobalSmartCombobox({
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
}: GlobalSmartComboboxProps) {
  // Local state for options and loading
  const [options, setOptions] = React.useState<SmartComboboxOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [recentOptions, setRecentOptions] = React.useState<SmartComboboxOption[]>([]);

  // Fetch options on mount and when dependencies change
  React.useEffect(() => {
    let isMounted = true;

    const fetchOptions = async () => {
      if (!isMounted) return;

      setIsLoading(true);

      try {
        const { options: fetchedOptions, error } = await fetchDropdownOptions({
          entityType,
          parentId,
          search: ''
        });

        if (isMounted) {
          if (error) {
            console.error(`Error fetching ${entityType} options:`, error);
          } else {
            setOptions(fetchedOptions);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error fetching ${entityType} options:`, error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [entityType, parentId]);

  // Handle search
  const handleSearch = React.useCallback(async (term: string) => {
    if (!term.trim()) return;

    setIsLoading(true);

    try {
      const { options: fetchedOptions, error } = await fetchDropdownOptions({
        entityType,
        parentId,
        search: term
      });

      if (error) {
        console.error(`Error searching ${entityType} options:`, error);
      } else {
        setOptions(fetchedOptions);
      }
    } catch (error) {
      console.error(`Error searching ${entityType} options:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, parentId]);

  // Handle create option
  const handleCreateOption = React.useCallback(async (name: string): Promise<SmartComboboxOption | null> => {
    if (!allowCreate || !name.trim()) return null;

    try {
      const { option, error } = await createDropdownOption({
        entityType,
        label: name.trim(),
        parentId
      });

      if (error) {
        console.error(`Error creating ${entityType}:`, error);
        return null;
      }

      if (!option) {
        console.error(`No option returned when creating ${entityType}`);
        return null;
      }

      // Add to options list
      setOptions(prev => [option, ...prev]);

      // Add to recent options
      setRecentOptions(prev => {
        // Check if already in recent options
        const exists = prev.some(opt => opt.value === option.value);
        if (exists) return prev;

        // Add to beginning of array, limit to 5 items
        return [option, ...prev].slice(0, 5);
      });

      return option;
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      return null;
    }
  }, [entityType, parentId, allowCreate]);

  // Add selected option to recent options
  React.useEffect(() => {
    if (value && options.length > 0) {
      const selectedOption = options.find(opt => opt.value === value);
      if (selectedOption) {
        setRecentOptions(prev => {
          // Check if already in recent options
          const exists = prev.some(opt => opt.value === selectedOption.value);
          if (exists) return prev;

          // Add to beginning of array, limit to 5 items
          return [selectedOption, ...prev].slice(0, 5);
        });
      }
    }
  }, [value, options]);

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
      onSearch={handleSearch}
      searchDebounce={searchDebounce}
      recentOptions={recentOptions}
      entityName={entityName || entityType}
    />
  );
}
