"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  allowCreate?: boolean
  onCreateOption?: (value: string) => void
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  emptyMessage = "No options found.",
  className,
  disabled = false,
  allowCreate = false,
  onCreateOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const handleCreateOption = React.useCallback(() => {
    if (onCreateOption && searchValue) {
      onCreateOption(searchValue)
      setSearchValue("")
    }
  }, [onCreateOption, searchValue])

  const selectedOption = React.useMemo(() => {
    return options.find(option => option.value === value)
  }, [options, value])

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
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {emptyMessage}
            {allowCreate && searchValue && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={handleCreateOption}
              >
                Create "{searchValue}"
              </Button>
            )}
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
