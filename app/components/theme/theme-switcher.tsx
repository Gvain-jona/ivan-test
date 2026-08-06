"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, Laptop } from "lucide-react"

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Laptop },
] as const

/**
 * Desktop theme control, rendered in TopHeader. Items carry no colour classes
 * of their own — DropdownMenuItem already styles itself from the tokens, and
 * the explicit text-white here made every label invisible in light mode.
 */
export function ThemeSwitcher() {
  const { setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  // Handle theme change with explicit dropdown closing
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    // Close the dropdown after theme change
    setTimeout(() => setOpen(false), 100)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={true}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/20 relative mr-2"
          aria-label="Change theme"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border/40" sideOffset={8}>
        {THEMES.map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleThemeChange(value)}
            className="cursor-pointer"
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
