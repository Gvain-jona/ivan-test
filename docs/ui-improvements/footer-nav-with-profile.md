# Footer Navigation with Profile and Contextual Menu

This document outlines the implementation of the footer navigation with an integrated profile button and contextual menu in the Ivan Prints Business Management System.

## Overview

The footer navigation has been enhanced with the following improvements:

1. **Integrated Profile Button**: Added a Profile button directly to the footer navigation
2. **Contextual Action Menu**: Implemented a context-aware action menu that provides options related to the current section
3. **Responsive Width**: Made the contextual menu match the width of the footer navigation
4. **Improved User Experience**: Made the navigation more intuitive and efficient

## Implementation Details

### 1. Footer Navigation with Profile

The Profile button has been added directly to the footer navigation:

```jsx
// Define navigation items
const navigationItems: NavItemType[] = [
  { title: 'Home', icon: Home, href: '/dashboard/home' },
  { title: 'Orders', icon: Package, href: '/dashboard/orders' },
  // ... other navigation items ...
  { title: 'Search', icon: Search, href: '/dashboard/search' },
  { title: 'Profile', icon: User, href: '#', isContextMenu: true },
];
```

Key features:
- Added a special `isContextMenu` property to identify the Profile button
- Used `href: '#'` to prevent actual navigation when clicked
- Positioned the Profile button at the end of the navigation items

### 2. Contextual Menu Integration

The ContextMenu component has been integrated with the footer navigation:

```jsx
// Handle tab change
const handleTabChange = useCallback((index: number | null) => {
  if (index !== null && 'href' in navigationItems[index]) {
    // Check if it's the context menu item
    if (navigationItems[index].isContextMenu) {
      setContextMenuOpen(true);
    } else {
      router.push(navigationItems[index].href as string);
    }
  }
}, [router]);

// In the return statement
return (
  <>
    {/* ... */}
    <ContextMenu
      activeSection={activeSectionName}
      open={contextMenuOpen}
      onOpenChange={setContextMenuOpen}
    />
    {/* Footer Navigation */}
    <div className={/* ... */}>
      <ExpandableTabs
        tabs={navigationItems as any}
        activeColor="text-orange-500"
        className="border-gray-800 bg-gray-950/90 backdrop-blur-md shadow-lg px-1 py-1"
        onChange={handleTabChange}
        initialSelectedIndex={initialTab}
      />
    </div>
  </>
);
```

Key features:
- Special handling for the Profile button to open the contextual menu
- Passing the active section name to the contextual menu for context-aware actions
- Managing the open state of the contextual menu

### 3. Contextual Menu Component

The ContextMenu component has been updated to work with the footer navigation:

```jsx
interface ContextMenuProps {
  activeSection: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: { x: number; y: number } | null;
}

export default function ContextMenu({ activeSection, open, onOpenChange, position }: ContextMenuProps) {
  const { theme, setTheme } = useTheme();
  
  // Get the appropriate actions based on the active section
  const sectionKey = activeSection.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof contextualActions;
  const actions = contextualActions[sectionKey] || contextualActions.home;
  
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={true}>
      <DropdownMenuContent
        align="center"
        className="w-[calc(100vw-2rem)] max-w-md bg-gray-950 border-gray-800"
        sideOffset={8}
      >
        {/* Menu content */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Key features:
- Removed the trigger button since it's triggered from the footer navigation
- Made the menu width match the footer navigation with `w-[calc(100vw-2rem)] max-w-md`
- Used `align="center"` to center the menu
- Added `modal={true}` for proper interaction

## Contextual Actions

The ContextMenu provides different actions based on the current section:

| Section | Actions |
|---------|---------|
| Home | New Task, View Calendar, Recent Activity |
| Orders | New Order, Filter Orders, Export Orders |
| Expenses | New Expense, Generate Report, Monthly Summary |
| Material | New Purchase, Edit Inventory, Export List |
| To-Do | New Task, Edit Tasks, Clear Completed |
| Analytics | Export Report, Share Dashboard, Change Period |
| Notifications | Clear All, Notification Settings, Show Archived |
| Search | Advanced Search, Recent Searches, Search Settings |

## Profile Actions

The ContextMenu also includes standard profile actions:

1. **Profile**: View and edit profile information
2. **Settings**: Access application settings
3. **Billing**: Manage billing information
4. **Help & Support**: Get help and support
5. **Theme Toggle**: Switch between light and dark themes
6. **Log Out**: Log out of the application

## Benefits

1. **Improved Efficiency**: Users can access contextual actions without navigating away from the current screen
2. **Integrated Experience**: The Profile button is part of the main navigation
3. **Context Awareness**: The menu adapts to the current section, providing relevant options
4. **Consistent Width**: The contextual menu matches the width of the footer navigation
5. **Improved Accessibility**: The menu is more accessible and easier to use

## User Experience Flow

1. **Basic Navigation**: Users use the footer navigation to move between main sections
2. **Profile Access**: Users click the Profile button in the footer navigation to open the contextual menu
3. **Contextual Actions**: The menu displays actions related to the current section
4. **Profile Management**: Users can access profile options from the same menu
5. **Theme Switching**: Users can switch themes from the menu

## Technical Implementation

The implementation uses several key components:

1. **ExpandableTabs**: For the footer navigation
2. **DropdownMenu**: For the contextual menu
3. **Contextual Actions**: Different actions based on the current section
4. **Active Section Tracking**: Determining the current section for context-aware actions
5. **Responsive Width**: Making the menu width match the footer navigation

## Future Enhancements

1. **Customizable Actions**: Allow users to customize the actions in the contextual menu
2. **Recent Actions**: Show recently used actions at the top of the menu
3. **Keyboard Shortcuts**: Add keyboard shortcuts for common actions
4. **Animation Improvements**: Enhance the animation when opening and closing the menu
5. **Touch Gestures**: Add swipe gestures for easier access on mobile devices
