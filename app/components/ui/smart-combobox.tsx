"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"
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

  // Filter options locally for immediate feedback
  const filteredOptions = React.useMemo(() => {
    if (!searchValue || searchValue.trim() === '') {
      return options
    }

    const lowerSearch = searchValue.toLowerCase()
    return options.filter(option =>
      option.label.toLowerCase().includes(lowerSearch)
    )
  }, [options, searchValue])

  const selectedOption = React.useMemo(() => {
    console.log('Finding selected option for value:', safeValue)
    console.log('Available options:', options)
    const found = options?.find(option => option.value === safeValue) || null
    console.log('Found option:', found)
    return found
  }, [options, safeValue])

  const handleSearch = React.useCallback((value: string) => {
    console.log('Search input changed:', value)
    setSearchValue(value)

    if (onSearch) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      // Set a new timeout
      searchTimeoutRef.current = setTimeout(() => {
        console.log('Debounced search triggered:', value)
        onSearch(value)
      }, searchDebounce)
    }
  }, [onSearch, searchDebounce])

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

    try {
      setIsCreating(true)
      console.log('Creating new option:', searchValue)
      const newOption = await onCreateOption(searchValue)

      if (newOption) {
        console.log('New option created successfully:', newOption)
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
  }, [onCreateOption, searchValue, allowCreate, onChange, entityName])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background border-input",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandList>
            {recentOptions.length > 0 && (
              <>
                <CommandGroup heading="Recently Used">
                  {recentOptions.map((option) => (
                    <CommandItem
                      key={`recent-${option.value}`}
                      value={option.value}
                      onSelect={(currentValue) => {
                        console.log('Recent option selected:', option.label, 'value:', option.value)
                        console.log('Current value from onSelect (recent):', currentValue)
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
                    </CommandItem>
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
                filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      console.log('Option selected:', option.label, 'value:', option.value)
                      console.log('Current value from onSelect:', currentValue)
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
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty>
                  {emptyMessage}
                </CommandEmpty>
              )}
            </CommandGroup>
          </CommandList>

          {allowCreate && searchValue && options && !filteredOptions.some(option =>
            option.label.toLowerCase() === searchValue.toLowerCase()
          ) && (
            <div className="p-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center"
                onClick={handleCreateOption}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {createMessage} "{searchValue}"
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
