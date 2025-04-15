"use client"

import * as React from "react"
import { Search, ArrowUp, ArrowDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"

interface SearchContextMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export type SearchCategory = {
  title: string
  items: SearchItem[]
}

export type SearchItem = {
  id: string
  name: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
}

export function SearchContextMenu({
  open,
  onOpenChange,
  className,
}: SearchContextMenuProps) {
  const [inputValue, setInputValue] = React.useState("")
  
  // Example data structure based on the image
  const recentItems = [
    { id: "onboarding", name: "Onboarding" },
    { id: "reviews", name: "Reviews" },
    { id: "hiring", name: "Hiring" },
    { id: "benefits", name: "Benefits" },
    { id: "learning", name: "Learning" },
  ]
  
  const categories: SearchCategory[] = [
    {
      title: "Tools & Apps",
      items: [
        { id: "monday", name: "Monday.com", icon: <div className="w-5 h-5 rounded-md bg-gradient-to-r from-yellow-400 to-red-500 flex-shrink-0" /> },
        { id: "loom", name: "Loom", icon: <div className="w-5 h-5 rounded-full bg-purple-500 flex-shrink-0" /> },
        { id: "asana", name: "Asana", icon: <div className="w-5 h-5 rounded-full bg-red-400 flex-shrink-0" /> },
      ]
    },
    {
      title: "Employees",
      items: [
        { id: "james", name: "James Brown", icon: <div className="w-5 h-5 rounded-full bg-blue-400 flex-shrink-0" /> },
        { id: "sophia", name: "Sophia Williams", icon: <div className="w-5 h-5 rounded-full bg-green-400 flex-shrink-0" /> },
        { id: "laura", name: "Laura Perez", icon: <div className="w-5 h-5 rounded-full bg-orange-400 flex-shrink-0" /> },
      ]
    },
    {
      title: "Teams",
      items: [
        { id: "aurora", name: "Aurora Solutions", icon: <div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0" /> },
        { id: "pulse", name: "Pulse Medical", icon: <div className="w-5 h-5 rounded-full bg-blue-400 flex-shrink-0" /> },
        { id: "synergy", name: "Synergy HR", icon: <div className="w-5 h-5 rounded-full bg-purple-500 flex-shrink-0" /> },
      ]
    },
    {
      title: "Locations",
      items: [
        { id: "us", name: "United States", icon: <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0" /> },
        { id: "spain", name: "Spain", icon: <div className="w-5 h-5 rounded-full bg-yellow-500 flex-shrink-0" /> },
        { id: "italy", name: "Italy", icon: <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0" /> },
      ]
    },
  ]

  // Handle item selection
  const handleSelect = (id: string) => {
    console.log("Selected item:", id)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" onClick={() => onOpenChange(false)}>
      <div 
        className={cn(
          "w-full max-w-md rounded-lg border border-border bg-background shadow-lg animate-in fade-in-0 zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-lg">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search HR tools or press..."
            />
            <div className="ml-2 flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            {/* Recent section */}
            <CommandGroup heading="Recent">
              <div className="flex flex-wrap gap-2 p-2">
                {recentItems.map((item) => (
                  <button
                    key={item.id}
                    className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                    onClick={() => handleSelect(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </CommandGroup>
            
            <CommandSeparator />
            
            {/* Categories grid */}
            <div className="grid grid-cols-2 gap-px">
              {categories.map((category, index) => (
                <div key={category.title} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{category.title}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => handleSelect(item.id)}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                        {item.id === "sophia" && (
                          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <CommandSeparator />
            
            {/* Footer */}
            <div className="flex items-center justify-between p-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <ArrowDown className="h-3 w-3 mr-1" />
                  <span>Navigate</span>
                </div>
                <div className="flex items-center ml-3">
                  <span className="mr-1">↵</span>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center">
                <span>Any problem?</span>
                <button className="ml-1 text-primary hover:underline">Contact</button>
              </div>
            </div>
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
