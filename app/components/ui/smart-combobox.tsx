"use client"

import * as React from "react"
import { AlertCircle, Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"

export type SmartComboboxOption = {
  value: string
  label: string
  [key: string]: any // Allow for additional metadata
}

interface SmartComboboxProps {
  options: SmartComboboxOption[]
  value: string
  onChange: (value: string) => void
  onCreateOption?: (value: string) => Promise<SmartComboboxOption | null>
  placeholder?: string
  emptyMessage?: string
  createMessage?: string
  className?: string
  disabled?: boolean
  allowCreate?: boolean
  isLoading?: boolean
  searchDebounce?: number
  onSearch?: (value: string) => void
  recentOptions?: SmartComboboxOption[]
  entityName?: string
}

export function SmartCombobox({
  options,
  value = '',
  onChange,
  onCreateOption,
  placeholder = "Select an option",
  emptyMessage = "No options found. Create one?",
  createMessage = "Create",
  className,
  disabled = false,
  allowCreate = false,
  isLoading = false,
  searchDebounce = 300,
  onSearch,
  recentOptions = [],
  entityName = "option",
}: SmartComboboxProps) {
  // Ensure value is a string
  const safeValue = value || '';
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Basic filtering for client-side search
  const filteredOptions = React.useMemo(() => {
    // If no search value, return all options
    if (!searchValue || searchValue.trim() === '') {
      return options
    }

    const trimmedSearch = searchValue.trim().toLowerCase()

    // Simple filtering - just check if the label includes the search term
    return options.filter(option =>
      option.label.toLowerCase().includes(trimmedSearch)
    )
  }, [options, searchValue])

  const selectedOption = React.useMemo(() => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Finding selected option for value:', safeValue)
      console.log('Available options count:', options?.length || 0)
    }

    // Handle case sensitivity and type issues
    const found = options?.find(option =>
      // Try exact match first
      option.value === safeValue ||
      // Then try case-insensitive string comparison
      (typeof option.value === 'string' &&
       typeof safeValue === 'string' &&
       option.value.toLowerCase() === safeValue.toLowerCase())
    ) || null

    if (process.env.NODE_ENV === 'development' && found) {
      console.log('Found option:', found)
    }

    return found
  }, [options, safeValue])

  const handleSearch = React.useCallback((value: string) => {
    // Add a unique identifier to each search to help with debugging
    const searchId = Math.random().toString(36).substring(2, 9)
    console.log('Search input changed:', value, { searchId, selectedValue: safeValue })

    // Update local state immediately for responsive UI
    setSearchValue(value)

    // Open the dropdown when user starts typing
    if (value.trim() !== '' && !open) {
      setOpen(true)
    }

    if (onSearch) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      // Use a fixed debounce time for all searches
      const debounceTime = 300

      // Set a new timeout for server-side search
      searchTimeoutRef.current = setTimeout(() => {
        console.log('Debounced search triggered:', value, { searchId, selectedValue: safeValue })
        onSearch(value)
      }, debounceTime)
    }
  }, [onSearch, open, safeValue])

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleCreateOption = React.useCallback(async () => {
    if (!onCreateOption || !searchValue || !allowCreate) return

    // Trim the search value to remove whitespace
    const trimmedValue = searchValue.trim()

    // Validate the input
    if (!trimmedValue) {
      toast({
        title: "Error",
        description: `${entityName} name cannot be empty.`,
        variant: "destructive",
      })
      return
    }

    // We no longer need to check for special options since we've removed the constraint

    // Check if the option already exists in the filtered options
    const existingOption = filteredOptions.find(
      option => option.label.toLowerCase() === trimmedValue.toLowerCase()
    )

    if (existingOption) {
      // If it exists, just select it instead of creating a new one
      console.log(`Option "${trimmedValue}" already exists, selecting it:`, existingOption)
      onChange(existingOption.value)
      setSearchValue("")
      setOpen(false)
      return
    }

    try {
      setIsCreating(true)
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating new option:', trimmedValue)
      }

      const newOption = await onCreateOption(trimmedValue)

      if (newOption) {
        if (process.env.NODE_ENV === 'development') {
          console.log('New option created successfully:', newOption)
        }
        onChange(newOption.value)
        setSearchValue("")
        toast({
          title: `${entityName} created`,
          description: `${newOption.label} has been created successfully.`,
        })
      }
    } catch (error) {
      console.error("Error creating option:", error)
      toast({
        title: "Error",
        description: `Failed to create ${entityName.toLowerCase()}.`,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
      setOpen(false)
    }
  }, [onCreateOption, searchValue, allowCreate, onChange, entityName, filteredOptions])

  // Handle opening and closing the dropdown, respecting the disabled state
  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    if (!disabled) {
      setOpen(isOpen)

      // When closing the dropdown, clear the search value but keep the selected value
      if (!isOpen) {
        setSearchValue('')
      }
    }
  }, [disabled])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background border-input",
            disabled ? "opacity-70 cursor-not-allowed" : "",
            className
          )}
          onClick={(e) => {
            // Prevent opening the dropdown if disabled
            if (disabled) {
              e.preventDefault()
              e.stopPropagation()

              // Show a toast to inform the user why it's disabled
              if (placeholder.includes("category")) {
                toast({
                  title: "Select a category first",
                  description: "You need to select a category before selecting an item.",
                  variant: "default",
                })
              }
            }
          }}
          disabled={disabled}
        >
          {/* Always show the selected option if it exists, regardless of search state */}
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <div className="px-3 py-2">
            <input
              type="text"
              placeholder="Type to search..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              autoFocus={true}
              onKeyDown={(e) => {
                // Prevent form submission when pressing Enter
                if (e.key === 'Enter') {
                  e.preventDefault();

                  // If there's exactly one filtered option, select it
                  if (filteredOptions.length === 1) {
                    onChange(filteredOptions[0].value);
                    setSearchValue('');
                    setOpen(false);
                  }
                } else if (e.key === 'Escape') {
                  // If user presses Escape, clear search but keep the selected value
                  setSearchValue('');
                  setOpen(false);
                }
              }}
            />
          </div>
          <CommandList>
            {recentOptions.length > 0 && (
              <>
                <CommandGroup heading="Recently Used">
                  {recentOptions.map((option) => (
                    <div
                      key={`recent-${option.value}`}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        safeValue === option.value ? "bg-accent text-accent-foreground" : ""
                      )}
                      onClick={() => {
                        console.log('Recent option selected:', option.label, 'value:', option.value)
                        // Use the option.value directly to ensure we're using the correct value
                        onChange(option.value)
                        setSearchValue('')
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          safeValue === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </div>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Options">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOptions && filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  // Check if this is a special option (like 'select-category-first')
                  const isSpecialOption = option.value === 'select-category-first';

                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        safeValue === option.value ? "bg-accent text-accent-foreground" : "",
                        isSpecialOption ? "opacity-70 italic" : ""
                      )}
                      onClick={() => {
                        if (isSpecialOption) {
                          // For special options, just show a toast instead of selecting
                          toast({
                            title: 'Select a category first',
                            description: 'You need to select a category before selecting an item.',
                            variant: 'default',
                          })
                          return;
                        }

                        console.log('Option selected:', option.label, 'value:', option.value)
                        // Use the option.value directly to ensure we're using the correct value
                        onChange(option.value)
                        setSearchValue('')
                        setOpen(false)
                      }}
                    >
                      {isSpecialOption ? (
                        <AlertCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            safeValue === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      )}
                      {option.label}
                    </div>
                  );
                })
              ) : (
                <CommandEmpty>
                  {emptyMessage}
                </CommandEmpty>
              )}
            </CommandGroup>
          </CommandList>

          {allowCreate && searchValue && searchValue.trim() !== '' && (
            <div className="p-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center"
                onClick={handleCreateOption}
                disabled={isCreating ||
                  filteredOptions.some(option =>
                    option.label.toLowerCase() === searchValue.trim().toLowerCase()
                  )
                }
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : filteredOptions.some(option =>
                  option.label.toLowerCase() === searchValue.trim().toLowerCase()
                ) ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {filteredOptions.some(option =>
                  option.label.toLowerCase() === searchValue.trim().toLowerCase()
                ) ? (
                  `Select "${searchValue.trim()}"`
                ) : (
                  `${createMessage} "${searchValue.trim()}"`
                )}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
