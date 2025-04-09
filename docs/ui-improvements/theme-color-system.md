# Theme Color System

This document outlines the color system used in the Ivan Prints Business Management System and how it supports theming.

## Overview

The application uses a comprehensive color system that supports both light and dark themes. The implementation uses:

1. **CSS Variables** - HSL color values defined in globals.css
2. **Tailwind Config** - Color definitions that reference the CSS variables
3. **Theme Provider** - Context provider that manages theme state

## Color Variables

### Base Colors

These colors form the foundation of the UI and change based on the active theme:

| Variable | Purpose | Light Theme | Dark Theme |
|----------|---------|-------------|------------|
| `--background` | Page background | White (0 0% 100%) | Very dark (0 0% 3.9%) |
| `--foreground` | Text color | Near black (0 0% 3.9%) | Off-white (0 0% 98%) |
| `--card` | Card backgrounds | Light gray (0 0% 98%) | Dark gray (0 0% 7%) |
| `--secondary` | Secondary elements | Light gray (0 0% 96%) | Dark gray (0 0% 14.9%) |
| `--muted` | Muted elements | Light gray (0 0% 96%) | Dark gray (0 0% 14.9%) |
| `--border` | Border colors | Light gray (0 0% 89.8%) | Dark gray (0 0% 14.9%) |

### Brand Colors

These colors remain consistent across themes to maintain brand identity:

| Variable | Purpose | Value |
|----------|---------|-------|
| `--primary` | Primary brand color | Orange (16 100% 50%) |
| `--accent` | Accent color | Darker orange (16 100% 45%) |

### Status Colors

Colors used to indicate status, consistent across themes:

| Variable | Purpose | Value |
|----------|---------|-------|
| `--status-pending` | Pending status | Amber (39 100% 50%) |
| `--status-in-progress` | In progress status | Blue (217 91% 60%) |
| `--status-paused` | Paused status | Gray (220 14% 75%) |
| `--status-completed` | Completed status | Green (152 76% 40%) |
| `--status-delivered` | Delivered status | Purple (262 83% 58%) |
| `--status-cancelled` | Cancelled status | Red (0 84% 60%) |

### Chart Colors

Colors used for charts and data visualization:

| Variable | Light Theme | Dark Theme |
|----------|-------------|------------|
| `--chart-1` | Orange (12 76% 61%) | Blue (220 70% 50%) |
| `--chart-2` | Teal (173 58% 39%) | Green (160 60% 45%) |
| `--chart-3` | Blue (197 37% 24%) | Orange (30 80% 55%) |
| `--chart-4` | Yellow (43 74% 66%) | Purple (280 65% 60%) |
| `--chart-5` | Orange (27 87% 67%) | Pink (340 75% 55%) |

## Implementation

### CSS Variables in globals.css

```css
@layer base {
  :root {
    /* Light theme (default) */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    
    --primary: 16 100% 50%;
    /* ... other variables ... */
  }
  
  .dark {
    /* Dark theme */
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    
    --primary: 16 100% 50%;
    /* ... other variables ... */
  }
}
```

### Tailwind Config Integration

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))'
      },
      // ... other colors ...
      status: {
        pending: 'hsl(var(--status-pending))',
        in_progress: 'hsl(var(--status-in-progress))',
        // ... other status colors ...
      }
    }
  }
}
```

## Usage Guidelines

### Component Styling

When styling components, always use the Tailwind color classes that reference the theme variables:

```jsx
// Good - uses theme variables
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>

// Bad - hardcoded colors
<div className="bg-[#ffffff] text-[#000000]">
  <button className="bg-[#ff5733] text-white">
    Click me
  </button>
</div>
```

### Status Colors

For status indicators, use the status color variables:

```jsx
<div className="text-status-completed">Completed</div>
<div className="text-status-pending">Pending</div>
```

### Dark Mode Testing

Always test components in both light and dark modes to ensure proper contrast and readability.

## Benefits

1. **Consistent Design Language** - All UI elements follow the same color system
2. **Easy Theme Switching** - Colors automatically adapt to the active theme
3. **Maintainability** - Color changes can be made in one place
4. **Accessibility** - Proper contrast ratios can be maintained across themes

## Future Enhancements

1. **Additional Theme Options** - Support for more theme variants (e.g., high contrast)
2. **Custom Color Schemes** - Allow users to customize specific colors
3. **Context-Aware Theming** - Different color schemes for different sections of the app
