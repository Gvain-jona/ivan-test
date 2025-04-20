"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleSelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface SimpleSelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SimpleSelectContext = React.createContext<SimpleSelectContextType | null>(null)

export const SimpleSelect: React.FC<SimpleSelectProps> = React.memo(({
  value,
  onValueChange,
  children,
  placeholder,
  disabled = false,
  className
}) => {
  const [open, setOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <SimpleSelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className={cn("relative", className)} ref={dropdownRef}>
        {children}
      </div>
    </SimpleSelectContext.Provider>
  )
})
SimpleSelect.displayName = "SimpleSelect"

interface SimpleSelectTriggerProps {
  className?: string
  children?: React.ReactNode
  placeholder?: string
  id?: string
}

export const SimpleSelectTrigger: React.FC<SimpleSelectTriggerProps> = React.memo(({
  className,
  children,
  placeholder,
  id
}) => {
  const context = React.useContext(SimpleSelectContext)
  
  if (!context) {
    throw new Error('SimpleSelectTrigger must be used within a SimpleSelect')
  }
  
  const { open, setOpen, value } = context
  
  return (
    <button
      type="button"
      id={id}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(!open)}
    >
      {children || placeholder || "Select an option"}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SimpleSelectTrigger.displayName = "SimpleSelectTrigger"

interface SimpleSelectContentProps {
  className?: string
  children?: React.ReactNode
}

export const SimpleSelectContent: React.FC<SimpleSelectContentProps> = React.memo(({
  className,
  children
}) => {
  const context = React.useContext(SimpleSelectContext)
  
  if (!context) {
    throw new Error('SimpleSelectContent must be used within a SimpleSelect')
  }
  
  const { open } = context
  
  if (!open) return null
  
  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 mt-1 w-full",
        className
      )}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  )
})
SimpleSelectContent.displayName = "SimpleSelectContent"

interface SimpleSelectItemProps {
  value: string
  className?: string
  children?: React.ReactNode
}

export const SimpleSelectItem: React.FC<SimpleSelectItemProps> = React.memo(({
  value,
  className,
  children
}) => {
  const context = React.useContext(SimpleSelectContext)
  
  if (!context) {
    throw new Error('SimpleSelectItem must be used within a SimpleSelect')
  }
  
  const { value: selectedValue, onValueChange, setOpen } = context
  const isSelected = selectedValue === value
  
  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => {
        onValueChange(value)
        setOpen(false)
      }}
    >
      {children}
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </span>
      )}
    </div>
  )
})
SimpleSelectItem.displayName = "SimpleSelectItem"

export const SimpleSelectValue: React.FC<{ placeholder?: string }> = React.memo(({ placeholder }) => {
  const context = React.useContext(SimpleSelectContext)
  
  if (!context) {
    throw new Error('SimpleSelectValue must be used within a SimpleSelect')
  }
  
  const { value } = context
  
  return (
    <span className="text-sm truncate">
      {value || placeholder || "Select an option"}
    </span>
  )
})
SimpleSelectValue.displayName = "SimpleSelectValue"
