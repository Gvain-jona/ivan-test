# Contextual Menus for Footer Navigation

This document outlines the implementation of contextual menus for the Profile, Search, and Notifications items in the footer navigation of the Ivan Prints Business Management System.

## Overview

The footer navigation has been enhanced with contextual menus for specific navigation items:

1. **Profile**: Opens a contextual menu with profile-related actions
2. **Search**: Opens a contextual menu with search-related actions
3. **Notifications**: Opens a contextual menu with notification-related actions

These items now trigger contextual menus instead of navigating to separate pages, providing a more efficient and streamlined user experience.

## Implementation Details

### 1. Navigation Items with Context Menus

The navigation items have been updated to indicate which ones should trigger contextual menus:

```jsx
// Define navigation items
const navigationItems: NavItemType[] = [
  { title: 'Home', icon: Home, href: '/dashboard/home' },
  { title: 'Orders', icon: Package, href: '/dashboard/orders' },
  // ... other navigation items ...
  { title: 'Notifications', icon: Bell, href: '#', isContextMenu: true, menuType: 'notifications' },
  { title: 'Search', icon: Search, href: '#', isContextMenu: true, menuType: 'search' },
  { title: 'Profile', icon: User, href: '#', isContextMenu: true, menuType: 'profile' },
];
```

Key features:
- Added `isContextMenu: true` to identify items that should trigger contextual menus
- Added `menuType` to specify which type of contextual menu to display
- Used `href: '#'` to prevent actual navigation when clicked

### 2. Handling Different Menu Types

The FooterNav component has been updated to handle different menu types:

```jsx
export default function FooterNav({ className }: FooterNavProps) {
  // ...
  const [activeMenu, setActiveMenu] = useState<'profile' | 'search' | 'notifications' | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  
  // Handle tab change
  const handleTabChange = useCallback((index: number | null) => {
    if (index !== null && 'href' in navigationItems[index]) {
      // Check if it's the context menu item
      if (navigationItems[index].isContextMenu && navigationItems[index].menuType) {
        setActiveMenu(navigationItems[index].menuType);
        setContextMenuOpen(true);
      } else {
        router.push(navigationItems[index].href as string);
      }
    }
  }, [router]);
  
  // ...
  
  return (
    <>
      {/* ... */}
      <ContextMenu
        activeSection={activeSectionName}
        menuType={activeMenu}
        open={contextMenuOpen}
        onOpenChange={setContextMenuOpen}
      />
      {/* ... */}
    </>
  );
}
```

Key features:
- Added state for tracking the active menu type
- Updated the tab change handler to set the active menu type
- Passed the menu type to the ContextMenu component

### 3. Context-Aware Menu Content

The ContextMenu component has been updated to display different content based on the menu type:

```jsx
export default function ContextMenu({ activeSection, menuType, open, onOpenChange, position }: ContextMenuProps) {
  const { theme, setTheme } = useTheme();
  
  // Get the appropriate actions based on the active section or menu type
  let actions;
  
  if (menuType === 'search') {
    actions = contextualActions.search;
  } else if (menuType === 'notifications') {
    actions = contextualActions.notifications;
  } else {
    // For profile or when viewing a section
    const sectionKey = activeSection.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof contextualActions;
    actions = contextualActions[sectionKey] || contextualActions.home;
  }
  
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={true}>
      <DropdownMenuContent
        align="center"
        className="w-[calc(100vw-2rem)] max-w-md bg-gray-950 border-gray-800"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-white">
          {menuType === 'search' ? 'Search' : 
           menuType === 'notifications' ? 'Notifications' : 
           menuType === 'profile' ? 'Profile' : 
           `${activeSection} Actions`}
        </DropdownMenuLabel>
        {/* Menu content */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Key features:
- Updated the component to handle different menu types
- Displayed different actions based on the menu type
- Updated the menu title based on the menu type

## Menu Types and Actions

### 1. Profile Menu

The Profile menu provides access to user-related actions:

- **Profile**: View and edit profile information
- **Settings**: Access application settings
- **Billing**: Manage billing information
- **Help & Support**: Get help and support
- **Theme Toggle**: Switch between light and dark themes
- **Log Out**: Log out of the application

### 2. Search Menu

The Search menu provides access to search-related actions:

- **Advanced Search**: Access advanced search options
- **Recent Searches**: View recent search history
- **Search Settings**: Configure search preferences

### 3. Notifications Menu

The Notifications menu provides access to notification-related actions:

- **Clear All**: Clear all notifications
- **Notification Settings**: Configure notification preferences
- **Show Archived**: View archived notifications

## Benefits

1. **Improved Efficiency**: Users can access contextual actions without navigating away from the current screen
2. **Reduced Navigation**: Fewer clicks required to perform common actions
3. **Context Awareness**: The menu adapts to the current section and menu type
4. **Consistent Width**: The contextual menu matches the width of the footer navigation
5. **Improved Accessibility**: The menu is more accessible and easier to use

## User Experience Flow

1. **Basic Navigation**: Users use the footer navigation to move between main sections
2. **Contextual Actions**: Users click on Profile, Search, or Notifications to access contextual actions
3. **Section-Specific Actions**: When viewing a section, users can access section-specific actions
4. **Seamless Integration**: The contextual menus are seamlessly integrated with the footer navigation

## Technical Implementation

The implementation uses several key components:

1. **ExpandableTabs**: For the footer navigation
2. **DropdownMenu**: For the contextual menus
3. **Menu Type Tracking**: Determining which menu to display
4. **Contextual Actions**: Different actions based on the menu type and active section
5. **Responsive Width**: Making the menu width match the footer navigation

## Future Enhancements

1. **Customizable Actions**: Allow users to customize the actions in the contextual menus
2. **Recent Actions**: Show recently used actions at the top of the menu
3. **Keyboard Shortcuts**: Add keyboard shortcuts for common actions
4. **Animation Improvements**: Enhance the animation when opening and closing the menu
5. **Touch Gestures**: Add swipe gestures for easier access on mobile devices
